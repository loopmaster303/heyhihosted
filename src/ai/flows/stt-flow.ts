
'use server';
/**
 * @fileOverview Converts speech to text using the official Replicate SDK.
 *
 * - speechToText - Transcribes an audio file into text using openai/gpt-4o-transcribe.
 */

import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function speechToText(audioDataUri: string): Promise<{ transcription: string }> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('Server configuration error: REPLICATE_API_TOKEN is missing.');
  }
  if (!audioDataUri || !audioDataUri.startsWith('data:audio')) {
    throw new Error('A valid audio data URI must be provided.');
  }

  try {
    const prediction = await replicate.run(
      "openai/gpt-4o-transcribe",
      {
        input: {
          audio_file: audioDataUri,
          temperature: 0,
        }
      }
    );

    if (!prediction || typeof prediction !== 'object' || !('transcription' in prediction)) {
      console.error("Unexpected output format from Replicate:", prediction);
      throw new Error("Unexpected or invalid output from Replicate API.");
    }
    
    // The output from the model might have extra properties, so we cast to any first
    // before accessing the transcription. This is safer than assuming the exact type.
    const result = prediction as any;

    return { transcription: result.transcription ? result.transcription.trim() : "" };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    console.error("Replicate STT error:", message, err);
    throw new Error(`Failed to transcribe audio with Replicate: ${message}`);
  }
}
