
import {NextResponse} from 'next/server';
import {transcribeAudio} from '@/ai/flows/stt-flow';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const audioDataUri = body.audioDataUri as string | undefined;

    if (!audioDataUri) {
      return NextResponse.json(
        {error: 'Missing required field: audioDataUri'},
        {status: 400}
      );
    }

    // Call the flow with the data URI
    const result = await transcribeAudio(audioDataUri);

    return NextResponse.json({transcription: result.transcription});
  } catch (error) {
    console.error('STT API Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process audio for transcription.',
      },
      {status: 500}
    );
  }
}
