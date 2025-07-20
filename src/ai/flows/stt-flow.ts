
'use server';
/**
 * @fileOverview Converts speech to text using the Replicate HTTP API.
 * This implementation uses the official Replicate SDK which handles polling.
 *
 * - speechToText - Transcribes an audio file into text using openai/gpt-4o-transcribe.
 */

import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});


export async function speechToText(audioFile: File): Promise<{ transcription: string }> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('Server configuration error: REPLICATE_API_TOKEN is missing.');
  }
  if (!audioFile) {
    throw new Error('A valid audio file must be provided.');
  }

  try {
    const prediction = await replicate.run(
      "openai/gpt-4o-transcribe",
      {
        input: {
          audio_file: audioFile,
          temperature: 0
        }
      }
    );

    // The output for this model is documented as an object { transcription: "...", segments: [...] }
    if (prediction && typeof prediction === 'object' && 'transcription' in prediction) {
        const result = prediction as { transcription: string };
        return { transcription: result.transcription.trim() };
    }

    // Fallback for unexpected plain string output
    if (typeof prediction === 'string') {
        return { transcription: prediction.trim() };
    }

    console.error("Replicate STT - Unexpected output format:", prediction);
    throw new Error("Received an unexpected output format from Replicate.");


  } catch (err: any) {
    const message = err?.message || 'Unknown error occurred during transcription.';
    console.error("Replicate STT error in flow:", message, err);
    throw new Error(`Failed to transcribe audio with Replicate: ${message}`);
  }
}
