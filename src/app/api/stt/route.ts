import { NextResponse } from 'next/server';
import { speechToText } from '@/ai/flows/stt-flow';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audioFile') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'Missing required field: audioFile' }, { status: 400 });
    }

    const result = await speechToText(audioFile);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Deepgram STT API error:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}