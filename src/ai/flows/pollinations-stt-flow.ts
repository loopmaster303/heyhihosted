
'use server';

/**
 * @fileOverview A function for transcribing audio using the Pollinations AI API.
 * This implementation uses a direct fetch call without a Genkit wrapper.
 *
 * - transcribeAudioPollinations - A function that handles the audio transcription process.
 * - TranscribeAudioPollinationsInput - The input type for the function.
 * - TranscribeAudioPollinationsOutput - The return type for the function.
 */

import { z } from 'zod';

const POLLINATIONS_STT_API_URL = 'https://text.pollinations.ai/stt';
const POLLINATIONS_API_TOKEN = process.env.POLLINATIONS_API_TOKEN;

// Define the schema for the function's input
const TranscribeAudioPollinationsInputSchema = z.object({
  audioDataUri: z
    .string()
    .refine(val => val.startsWith('data:audio/'), {
      message:
        "A valid audio data URI must be provided (e.g., 'data:audio/webm;base64,...').",
    })
    .describe(
      'An audio file encoded as a data URI that must include a MIME type and use Base64 encoding.'
    ),
});
export type TranscribeAudioPollinationsInput = z.infer<
  typeof TranscribeAudioPollinationsInputSchema
>;

// Define the schema for the function's output
const TranscribeAudioPollinationsOutputSchema = z.object({
  transcription: z
    .string()
    .describe('The transcribed text from the audio.'),
});
export type TranscribeAudioPollinationsOutput = z.infer<
  typeof TranscribeAudioPollinationsOutputSchema
>;

/**
 * Calls the Pollinations STT API to transcribe an audio data URI.
 * @param input The audio data URI to be transcribed.
 * @returns The transcription result.
 */
export async function transcribeAudioPollinations(
  input: TranscribeAudioPollinationsInput
): Promise<TranscribeAudioPollinationsOutput> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (POLLINATIONS_API_TOKEN) {
    headers['Authorization'] = `Bearer ${POLLINATIONS_API_TOKEN}`;
  } else {
    console.warn("POLLINATIONS_API_TOKEN is not set. STT requests may fail or be rate-limited.");
  }

  const payload = {
    // The Pollinations STT endpoint expects the data URI directly.
    // We wrap it in a simple JSON object.
    audio_data_uri: input.audioDataUri,
  };

  const response = await fetch(POLLINATIONS_STT_API_URL, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  if (!response.ok) {
    let errorDetails = responseText;
    try {
      const errorJson = JSON.parse(responseText);
      errorDetails = errorJson.error?.message || errorJson.detail || responseText;
    } catch (e) {
      // responseText is not JSON, use as is
    }
    console.error('Pollinations STT API Error:', errorDetails);
    throw new Error(`Pollinations STT API request failed with status ${response.status}: ${errorDetails}`);
  }

  try {
    const result = JSON.parse(responseText);
    const transcription = result.text || result.transcription;

    if (typeof transcription !== 'string') {
      throw new Error('API response did not contain valid transcription text.');
    }

    return { transcription: transcription.trim() };
  } catch (e) {
    // If the response is plain text, use it directly.
    if (responseText.trim()) {
      return { transcription: responseText.trim() };
    }
    console.error("Failed to parse Pollinations STT response:", e, "Response was:", responseText);
    throw new Error('Failed to parse a valid response from the STT API.');
  }
}
