
import { NextResponse } from 'next/server';

// This is the OpenAI-compatible endpoint that supports more complex requests via POST.
const POLLINATIONS_TTS_API_URL = 'https://text.pollinations.ai/openai';

export async function POST(request: Request) {
  try {
    // We receive a POST from our frontend
    const { text, voice = 'alloy' } = await request.json();

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json({ error: 'Text prompt is required and cannot be empty.' }, { status: 400 });
    }

    // This payload structure is inferred to be compatible with OpenAI's native TTS API,
    // which the Pollinations endpoint likely proxies. This avoids URL length limits.
    const payload = {
      model: 'openai-audio', // The model designated for audio tasks
      input: text.trim(),    // The text to be synthesized
      voice: voice,          // The desired voice
    };
    
    // We now use a POST request to the /openai endpoint
    const ttsResponse = await fetch(POLLINATIONS_TTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('Pollinations TTS API Error (POST):', errorText, 'Payload:', JSON.stringify(payload));
      let details = `API responded with status ${ttsResponse.status}.`;
      try {
        const errorJson = JSON.parse(errorText);
        details = errorJson.error?.message || errorText;
      } catch (e) {
        // Not a JSON error, use raw text but truncate
        details = errorText.substring(0, 200);
      }
      return NextResponse.json({ error: 'Failed to generate speech from Pollinations API.', details }, { status: ttsResponse.status });
    }

    const contentType = ttsResponse.headers.get('content-type');
    if (!contentType || !contentType.startsWith('audio/')) {
        const responseText = await ttsResponse.text();
        console.error('Pollinations TTS API - Unexpected content type:', contentType, 'Response body:', responseText);
        return NextResponse.json({ error: 'API returned an unexpected response format instead of audio.' }, { status: 500 });
    }

    // Stream the audio response back to the client
    const audioBlob = await ttsResponse.blob();
    return new NextResponse(audioBlob, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error: any) {
    console.error('Error in TTS route:', error);
    return NextResponse.json({ error: 'Internal server error.', details: error.message }, { status: 500 });
  }
}
