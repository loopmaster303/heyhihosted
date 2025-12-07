
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, validateRequest, ApiError, requireEnv } from '@/lib/api-error-handler';

const POLLEN_CHAT_API_URL = 'https://enter.pollinations.ai/api/generate/v1/chat/completions';
const LEGACY_POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';
const LEGACY_FALLBACK_MODELS = new Set(['openai-large', 'gemini-search']);

// Validation schema
const ChatCompletionSchema = z.object({
  messages: z.array(z.any()).min(1, 'At least one message is required'),
  modelId: z.string().min(1, 'Model ID is required'),
  systemPrompt: z.string().optional(),
  webBrowsingEnabled: z.boolean().optional(),
  stream: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request
    const { messages, modelId, systemPrompt, webBrowsingEnabled, stream } = validateRequest(ChatCompletionSchema, body);

    // If web browsing is enabled, route through Gemini Search variant
    const effectiveModelId = webBrowsingEnabled ? "gemini-search" : modelId;
    const streamEnabled = Boolean(stream) && effectiveModelId !== "gpt-oss-120b";

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

    const pollenApiKey = process.env.POLLEN_API_KEY;
    const legacyApiKey = process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_API_TOKEN;
    const allowLegacyFallback = LEGACY_FALLBACK_MODELS.has(effectiveModelId);

    if (!pollenApiKey && !(allowLegacyFallback && legacyApiKey)) {
      throw new ApiError(500, 'Server configuration error: POLLEN_API_KEY is not set', 'MISSING_ENV_VAR');
    }

    const payload: Record<string, any> = {
      model: effectiveModelId,
      messages: messages,
    };

    if (systemPrompt && systemPrompt.trim() !== "") {
      const trimmedSystem = systemPrompt.trim();
      payload.messages = [{ role: 'system', content: trimmedSystem }, ...messages];
    }

    if (streamEnabled) {
      payload.stream = true;
    }

    type EndpointTarget = {
      name: 'pollen' | 'legacy';
      url: string;
      apiKey: string;
    };

    const targets: EndpointTarget[] = [];
    if (pollenApiKey) {
      targets.push({ name: 'pollen', url: POLLEN_CHAT_API_URL, apiKey: pollenApiKey });
    }
    if (allowLegacyFallback && legacyApiKey) {
      targets.push({ name: 'legacy', url: LEGACY_POLLINATIONS_API_URL, apiKey: legacyApiKey });
    }

    let lastError: Error | null = null;

    const mapModelForLegacy = (model: string) => {
      if (model === 'openai-large') return 'openai';
      if (model === 'gemini-search') return 'gemini';
      return model;
    };

    for (const target of targets) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${target.apiKey}`,
        };
    
        if (streamEnabled) {
          headers['Accept'] = 'text/event-stream';
        }
    
        const payloadForTarget = {
          ...payload,
          model: target.name === 'legacy' ? mapModelForLegacy(payload.model) : payload.model,
        };

        const response = await fetch(target.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payloadForTarget),
        });
    
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Chat API (${target.name}) error (${response.status}):`, errorText);
          const detail = errorText || 'Unknown error';
          
          // Check if this is a content filter error (Azure OpenAI content management policy)
          let isContentFilterError = false;
          if (response.status === 400) {
            try {
              const errorJson = JSON.parse(errorText);
              const errorMessage = errorJson?.error?.message || errorJson?.message || '';
              isContentFilterError = errorMessage.toLowerCase().includes('content management policy') ||
                                   errorMessage.toLowerCase().includes('content filtering') ||
                                   errorMessage.toLowerCase().includes('content filter');
            } catch {
              // If parsing fails, check string directly
              isContentFilterError = errorText.toLowerCase().includes('content management policy') ||
                                   errorText.toLowerCase().includes('content filtering');
            }
          }
          
          // If content filter error and using OpenAI model, fallback to Claude
          if (isContentFilterError && target.name === 'pollen' && 
              (effectiveModelId.startsWith('openai') || effectiveModelId.includes('openai'))) {
            console.warn(`[Chat API] Content filter triggered for ${effectiveModelId}, falling back to Claude Sonnet 3.7`);
            // Retry with Claude
            const claudePayload = {
              ...payload,
              model: 'claude',
            };
            
            const claudeResponse = await fetch(POLLEN_CHAT_API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pollenApiKey}`,
                ...(streamEnabled ? { 'Accept': 'text/event-stream' } : {}),
              },
              body: JSON.stringify(claudePayload),
            });
            
            if (!claudeResponse.ok) {
              // If Claude also fails, throw original error
              const apiError = new ApiError(
                response.status,
                `Chat API (${target.name}) returned status ${response.status}: ${detail}`,
                `${target.name.toUpperCase()}_CHAT_API_ERROR`
              );
              throw apiError;
            }
            
            if (streamEnabled) {
              const bodyStream = claudeResponse.body;
              if (!bodyStream) {
                throw new ApiError(502, `Chat API (claude fallback) stream did not return a body`, 'CLAUDE_FALLBACK_STREAM_ERROR');
              }
              return new Response(bodyStream, {
                status: 200,
                headers: {
                  'Content-Type': claudeResponse.headers.get('content-type') ?? 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  Connection: 'keep-alive',
                },
              });
            }
            
            const claudeResult = await claudeResponse.json();
            return NextResponse.json(claudeResult);
          }
          
          const apiError = new ApiError(
            response.status,
            `Chat API (${target.name}) returned status ${response.status}: ${detail}`,
            `${target.name.toUpperCase()}_CHAT_API_ERROR`
          );
          // Only attempt legacy fallback if pollen returns 5xx; for 4xx bubble up immediately.
          if (target.name === 'pollen' && response.status >= 500) {
            lastError = apiError;
            continue;
          }
          throw apiError;
        }
    
        if (streamEnabled) {
          const bodyStream = response.body;
          if (!bodyStream) {
            throw new ApiError(502, `Chat API (${target.name}) stream did not return a body`, `${target.name.toUpperCase()}_CHAT_STREAM_ERROR`);
          }
          return new Response(bodyStream, {
            status: 200,
            headers: {
              'Content-Type': response.headers.get('content-type') ?? 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
          });
        }
        
        const result = await response.json();
        return NextResponse.json(result);
      } catch (err) {
        // For pollen 4xx errors, stop and bubble up immediately.
        if (target.name === 'pollen' && err instanceof ApiError && err.statusCode < 500) {
          throw err;
        }
        lastError = err instanceof Error ? err : new Error(String(err));
        // Try next target if available
      }
    }

    if (lastError) {
      throw lastError;
    }

    throw new ApiError(503, 'No chat backend available', 'CHAT_BACKEND_UNAVAILABLE');

  } catch (error) {
    return handleApiError(error);
  }
}

    
