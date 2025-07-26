
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
