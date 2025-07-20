
import {NextResponse} from 'next/server';
import {transcribeAudio, type TranscribeAudioInput} from '@/ai/flows/stt-flow';

export async function POST(request: Request) {
  try {
    // The client now sends a JSON body with the data URI
    const body: TranscribeAudioInput = await request.json();

    // The audioDataUri is validated by the Zod schema in the flow
    if (!body.audioDataUri) {
      return NextResponse.json(
        {error: 'Missing required field: audioDataUri'},
        {status: 400}
      );
    }

    // Call the Genkit flow with the input object
    const result = await transcribeAudio(body);

    // Return the transcription from the flow's output
    return NextResponse.json({transcription: result.transcription});

  } catch (error) {
    // Log the full error for server-side debugging
    console.error('STT API Error:', error);

    // Return a generic but helpful error to the client
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
