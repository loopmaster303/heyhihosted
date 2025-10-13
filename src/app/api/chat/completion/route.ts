
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, validateRequest, requireEnv, ApiError } from '@/lib/api-error-handler';

const POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';

// Validation schema
const ChatCompletionSchema = z.object({
  messages: z.array(z.any()).min(1, 'At least one message is required'),
  modelId: z.string().min(1, 'Model ID is required'),
  systemPrompt: z.string().optional(),
  webBrowsingEnabled: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request
    const { messages, modelId, systemPrompt, webBrowsingEnabled } = validateRequest(ChatCompletionSchema, body);

    // If web browsing is enabled, force Gemini model
    const effectiveModelId = webBrowsingEnabled ? "gemini" : modelId;

    // Handle GPT-OSS-120b model with Replicate API
    if (effectiveModelId === "gpt-oss-120b") {
      console.log("Using GPT-OSS-120b via Replicate API");
      
      const REPLICATE_API_TOKEN = requireEnv('REPLICATE_API_TOKEN');
      
      const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "openai/gpt-oss-120b",
          input: {
            prompt: messages.map((m: any) => `${m.role}: ${m.content}`).join('\n'),
            system_prompt: systemPrompt || "",
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 1000,
            reasoning: "medium" // Default reasoning level
          }
        })
      });

      if (!replicateResponse.ok) {
        const errorText = await replicateResponse.text();
        console.error("Replicate API error:", errorText);
        throw new ApiError(
          502,
          `Replicate API error: ${replicateResponse.status}`,
          'REPLICATE_API_ERROR'
        );
      }

      const replicateData = await replicateResponse.json();
      
      // Poll for completion
      let result = null;
      let attempts = 0;
      const maxAttempts = 30;
      
      while (!result && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await fetch(replicateData.urls.get, {
          headers: {
            "Authorization": `Token ${REPLICATE_API_TOKEN}`,
          }
        });
        
        const statusData = await statusResponse.json();
        
        if (statusData.status === "succeeded") {
          result = statusData.output;
        } else if (statusData.status === "failed") {
          throw new ApiError(500, "Replicate prediction failed", 'PREDICTION_FAILED');
        }
        
        attempts++;
      }
      
      if (!result) {
        throw new ApiError(504, "Replicate prediction timed out", 'PREDICTION_TIMEOUT');
      }
      
      // Log the result for debugging
      console.log("Replicate API result:", result);
      
      // Clean up the response text
      let cleanedResult = Array.isArray(result) ? result.join('\n') : result;
      
      // Remove excessive whitespace and normalize line breaks
      cleanedResult = cleanedResult
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove multiple consecutive empty lines
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim(); // Remove leading/trailing whitespace
      
      return NextResponse.json({
        choices: [{
          message: {
            content: cleanedResult,
            role: "assistant"
          }
        }],
        model: "gpt-oss-120b"
      });
    }

    const payload: Record<string, any> = {
        model: effectiveModelId,
      messages: messages,
    };

    if (systemPrompt && systemPrompt.trim() !== "") {
      payload.system = systemPrompt;
    }

    // Securely get the API key from server-side environment variables.
    const apiKey = requireEnv('POLLINATIONS_API_TOKEN');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    const response = await fetch(POLLINATIONS_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pollinations API error (${response.status}):`, errorText);
      throw new ApiError(
        502,
        `Pollinations API returned status ${response.status}`,
        'POLLINATIONS_API_ERROR'
      );
    }
    
    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    return handleApiError(error);
  }
}

    