
import { NextResponse } from 'next/server';

const POLLINATIONS_STT_API_URL = 'https://text.pollinations.ai/openai';

export async function POST(request: Request) {
  try {
    const { audioData, format = 'wav' } = await request.json();

    if (!audioData) {
      return NextResponse.json({ error: 'Audio data is required.' }, { status: 400 });
    }

    const payload = {
      model: "openai-audio",
      messages: [
        {
          role: "user",
          content: [
            { "type": "text", "text": "Transcribe this audio" },
            {
              "type": "input_audio",
              "input_audio": {
                "data": audioData,
                "format": format
              }
            }
          ]
        }
      ]
    };

    const sttResponse = await fetch(POLLINATIONS_STT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!sttResponse.ok) {
      const errorText = await sttResponse.text();
      console.error('Pollinations STT API Error:', errorText);
      return NextResponse.json({ error: 'Failed to transcribe audio from Pollinations API.', details: errorText }, { status: sttResponse.status });
    }

    const result = await sttResponse.json();
    const transcription = result?.choices?.[0]?.message?.content?.trim();

    if (!transcription) {
        console.error('Pollinations STT API - Unexpected response structure:', result);
        return NextResponse.json({ error: 'Could not extract transcription from API response.' }, { status: 500 });
    }

    return NextResponse.json({ transcription });

  } catch (error: any) {
    console.error('Error in STT route:', error);
    return NextResponse.json({ error: 'Internal server error.', details: error.message }, { status: 500 });
  }
}
