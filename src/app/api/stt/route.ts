
import {NextResponse} from 'next/server';
import {
  transcribeAudioPollinations,
  type TranscribeAudioPollinationsInput,
} from '@/ai/flows/pollinations-stt-flow';

export async function POST(request: Request) {
  try {
    const body: {audioDataUri: string} = await request.json();

    if (!body.audioDataUri) {
      return NextResponse.json(
        {error: 'Missing required field: audioDataUri'},
        {status: 400}
      );
    }

    const input: TranscribeAudioPollinationsInput = {
      audioDataUri: body.audioDataUri,
    };

    const result = await transcribeAudioPollinations(input);

    return NextResponse.json({transcription: result.transcription});
  } catch (error) {
    console.error('STT API Error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred during transcription.',
      },
      {status: 500}
    );
  }
}
