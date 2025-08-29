
import { NextResponse } from 'next/server';

const POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // The client no longer sends the API key.
    const { messages, modelId, systemPrompt } = body;
    
    if (!messages || !modelId) {
      return NextResponse.json({ error: 'Missing required fields: messages and modelId' }, { status: 400 });
    }

    // Handle GPT-OSS-120b model with Replicate API
    if (modelId === "gpt-oss-120b") {
      console.log("Using GPT-OSS-120b via Replicate API");
      
      if (!process.env.REPLICATE_API_TOKEN) {
        console.error("REPLICATE_API_TOKEN is not set");
        return NextResponse.json({ error: 'Replicate API token is not configured on the server.' }, { status: 500 });
      }
      
      const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
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
        throw new Error(`Replicate API error: ${replicateResponse.status} ${errorText}`);
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
            "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
          }
        });
        
        const statusData = await statusResponse.json();
        
        if (statusData.status === "succeeded") {
          result = statusData.output;
        } else if (statusData.status === "failed") {
          throw new Error("Replicate prediction failed");
        }
        
        attempts++;
      }
      
      if (!result) {
        throw new Error("Replicate prediction timed out");
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
      model: modelId,
      messages: messages,
    };

    if (systemPrompt && systemPrompt.trim() !== "") {
      payload.system = systemPrompt;
    }

    // Securely get the API key from server-side environment variables.
    const apiKey = process.env.POLLINATIONS_API_TOKEN;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else {
        // If the key is missing on the server, fail early.
        console.error('Error: POLLINATIONS_API_TOKEN is not set in the environment variables.');
        return NextResponse.json({ error: 'API key is not configured on the server.' }, { status: 500 });
    }

    const response = await fetch(POLLINATIONS_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    // Detailed logging for non-OK responses
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = errorText; // The error is not JSON, use the raw text.
      }
      const detail = typeof errorData === 'string'
          ? errorData
          : errorData.error?.message || JSON.stringify(errorData);

      console.error(`Pollinations API request failed with status ${response.status}: ${detail}`);
      return NextResponse.json(
        { error: `Pollinations API request failed with status ${response.status}: ${detail}` },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in /api/chat/completion:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

    