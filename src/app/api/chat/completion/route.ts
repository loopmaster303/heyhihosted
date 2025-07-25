import { NextResponse } from 'next/server';

const POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check for apiKey and add it to the header if it exists.
    const { messages, modelId, systemPrompt, apiKey } = body;
    
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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add Authorization header only if apiKey is provided
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(POLLINATIONS_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = errorText;
      }
      const detail = typeof errorData === 'string'
          ? errorData
          : errorData.error?.message || JSON.stringify(errorData);

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
