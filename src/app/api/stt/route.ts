// src/app/api/stt/route.ts

import {NextResponse} from 'next/server';
import {transcribeAudio} from '@/ai/flows/stt-flow'; // Import the new flow

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audioFile') as File | null;

    if (!audioFile) {
      return NextResponse.json(
        {error: 'No audio file uploaded.'},
        {status: 400}
      );
    }

    // Call the new STT flow with the file
    const result = await transcribeAudio(audioFile);

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