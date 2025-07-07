
import { NextResponse } from 'next/server';

const POLLINATIONS_TTS_API_URL = 'https://text.pollinations.ai/openai';
const API_TOKEN = process.env.POLLINATIONS_API_TOKEN;

export async function POST(request: Request) {
  try {
    const { text, voice = 'alloy' } = await request.json();

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json({ error: 'Text prompt is required and cannot be empty.' }, { status: 400 });
    }

    const payload = {
      model: 'openai-audio', // The model for audio tasks
      input: text.trim(),    // The text to synthesize
      voice: voice,          // The selected voice
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (API_TOKEN) {
      headers['Authorization'] = `Bearer ${API_TOKEN}`;
    }
    
    const ttsResponse = await fetch(POLLINATIONS_TTS_API_URL, {
      method: 'POST',
      headers: headers,
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

    const audioBlob = await ttsResponse.blob();
    return new NextResponse(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error: any) {
    console.error('Error in TTS route:', error);
    return NextResponse.json({ error: 'Internal server error.', details: error.message }, { status: 500 });
  }
}
