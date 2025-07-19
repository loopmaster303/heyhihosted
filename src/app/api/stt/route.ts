
import { NextResponse } from 'next/server';
import { speechToText } from '@/ai/flows/stt-flow';

interface SttApiInput {
  audioDataUri: string;
}

export async function POST(request: Request) {
  try {
    const body: SttApiInput = await request.json();

    if (!body.audioDataUri) {
      return NextResponse.json({ error: 'Missing required field: audioDataUri' }, { status: 400 });
    }

    const result = await speechToText(body.audioDataUri);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in /api/stt:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
