
import { NextResponse } from 'next/server';

const POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';
const API_TOKEN = process.env.POLLINATIONS_API_TOKEN;

export async function POST(request: Request) {
  try {
    const { text, voice = 'alloy' } = await request.json();

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json({ error: 'Text prompt is required and cannot be empty.' }, { status: 400 });
    }

    const payload = {
      model: "openai-audio",
      messages: [
        { "role": "user", "content": text.trim() }
      ],
      voice: voice,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (API_TOKEN) {
      headers['Authorization'] = `Bearer ${API_TOKEN}`;
    }

    const ttsResponse = await fetch(POLLINATIONS_API_URL, {
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
        details = errorJson.detail || errorJson.error?.message || errorText;
      } catch (e) {
        details = errorText.substring(0, 200); 
      }
      return NextResponse.json({ error: 'Failed to generate speech from Pollinations API.', details }, { status: ttsResponse.status });
    }

    // The API returns a JSON response containing the audio data.
    const result = await ttsResponse.json();

    // According to the docs, the response contains base64 audio.
    // We look for it in the standard chat completion path.
    const audioBase64 = result?.choices?.[0]?.message?.content;
    
    if (typeof audioBase64 === 'string' && audioBase64.length > 0) {
        const audioBuffer = Buffer.from(audioBase64, 'base64');
        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
            },
        });
    } else {
        console.error('Pollinations TTS API - Unexpected response structure:', result);
        return NextResponse.json({ error: 'Could not extract audio data from API response.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error in TTS route:', error);
    return NextResponse.json({ error: 'Internal server error.', details: error.message }, { status: 500 });
  }
}
