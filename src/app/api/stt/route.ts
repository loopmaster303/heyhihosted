
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
    console.error('Error in /api/stt:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
