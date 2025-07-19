
import { NextResponse } from 'next/server';
import { textToSpeech } from '@/ai/flows/tts-flow';

interface TtsApiInput {
  text: string;
  voice: string;
}

export async function POST(request: Request) {
  try {
    const body: TtsApiInput = await request.json();

    if (!body.text || !body.voice) {
      return NextResponse.json({ error: 'Missing required fields: text and voice' }, { status: 400 });
    }

    const result = await textToSpeech(body.text, body.voice);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in /api/tts:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
