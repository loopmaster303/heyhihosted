import { NextResponse } from 'next/server';

const POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.messages || !body.modelId) {
      return NextResponse.json({ error: 'Missing required fields: messages and modelId' }, { status: 400 });
    }

    const { messages, modelId, systemPrompt, stream } = body;

    const payload: Record<string, any> = {
      model: modelId,
      messages: messages,
      stream: !!stream, // Ensure stream is a boolean
    };

    if (systemPrompt && systemPrompt.trim() !== "") {
      payload.system = systemPrompt;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream', // Important for streaming
      'Authorization': `Bearer ${process.env.POLLINATIONS_API_TOKEN}`,
    };

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

      // Return a structured error response
      return NextResponse.json(
        { error: `Pollinations API request failed with status ${response.status}: ${detail}` },
        { status: response.status }
      );
    }
    
    // If streaming is requested and the response body is available, stream it back.
    if (stream && response.body) {
      // The headers from the original response can be piped through, but we set our own for robustness.
      return new NextResponse(response.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle non-streaming response
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
