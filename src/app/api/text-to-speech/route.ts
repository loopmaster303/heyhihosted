
import { NextResponse } from 'next/server';

const POLLINATIONS_TTS_API_URL = 'https://text.pollinations.ai';

export async function POST(request: Request) {
  try {
    const { text, voice = 'alloy' } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text prompt is required.' }, { status: 400 });
    }

    const encodedText = encodeURIComponent(text);
    const ttsUrl = `${POLLINATIONS_TTS_API_URL}/${encodedText}?model=openai-audio&voice=${voice}`;

    const ttsResponse = await fetch(ttsUrl);

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('Pollinations TTS API Error:', errorText);
      return NextResponse.json({ error: 'Failed to generate speech from Pollinations API.', details: errorText }, { status: ttsResponse.status });
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
