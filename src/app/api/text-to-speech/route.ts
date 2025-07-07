
import { NextResponse } from 'next/server';

// The endpoint for OpenAI-compatible models, including audio.
const POLLINATIONS_OPENAI_API_URL = 'https://text.pollinations.ai/openai';

export async function POST(request: Request) {
  try {
    const { text, voice = 'alloy' } = await request.json();

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json({ error: 'Text prompt is required and cannot be empty.' }, { status: 400 });
    }

    // This payload mirrors the OpenAI TTS API structure, which is more robust for longer texts.
    // We send it to the Pollinations proxy endpoint that handles OpenAI models.
    const payload = {
      model: 'openai-audio', // This model key handles both STT and TTS.
      input: text,
      voice: voice,
    };

    const ttsResponse = await fetch(POLLINATIONS_OPENAI_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('Pollinations TTS API Error (POST):', errorText, 'Payload:', JSON.stringify(payload));
      let details = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        details = errorJson.error?.message || errorText;
      } catch (e) {
        // Not a JSON error, use raw text
      }
      return NextResponse.json({ error: 'Failed to generate speech from Pollinations API.', details: details }, { status: ttsResponse.status });
    }

    const contentType = ttsResponse.headers.get('content-type');
    if (!contentType || !contentType.startsWith('audio/')) {
        const responseText = await ttsResponse.text();
        console.error('Pollinations TTS API - Unexpected content type:', contentType, 'Response body:', responseText);
        return NextResponse.json({ error: 'API returned an unexpected response format instead of audio.'}, { status: 500 });
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
