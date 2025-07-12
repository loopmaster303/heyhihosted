
'use server';
/**
 * @fileOverview Interacts with the Pollinations AI API for speech-to-text transcriptions.
 *
 * Exports:
 * - getPollinationsTranscription - Transcribes audio data using Pollinations AI.
 * - PollinationsSttInput - Type definition for the input.
 * - PollinationsSttOutput - Type definition for the output.
 */

import { z } from 'zod';

const PollinationsSttInputSchema = z.object({
  audioDataUri: z.string().startsWith('data:audio/').describe('Base64 encoded audio data URI.'),
});

export type PollinationsSttInput = z.infer<typeof PollinationsSttInputSchema>;

export interface PollinationsSttOutput {
  transcription: string;
}

const POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';
const API_TOKEN = process.env.POLLINATIONS_API_TOKEN;

/**
 * Transcribes audio data using the Pollinations 'openai-audio' model.
 */
export async function getPollinationsTranscription(
  input: PollinationsSttInput
): Promise<PollinationsSttOutput> {
  const { audioDataUri } = input;

  // Extract format and base64 data from the data URI
  const matches = audioDataUri.match(/^data:audio\/(.+);base64,(.*)$/);
  if (!matches || matches.length < 3) {
    throw new Error('Invalid audio data URI format.');
  }
  const format = matches[1].split(';')[0]; // e.g., 'webm' from 'webm;codecs=opus'
  const base64Data = matches[2];

  const payload = {
    model: 'openai-audio',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Transcribe this audio. Respond only with the transcribed text.' },
          {
            type: 'input_audio',
            input_audio: { data: base64Data, format: format }
          }
        ]
      }
    ]
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  try {
    const response = await fetch(POLLINATIONS_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pollinations STT API request failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(`Pollinations STT API returned an error: ${result.error.message || JSON.stringify(result.error)}`);
    }

    const transcription = result.choices?.[0]?.message?.content?.trim() || '';
    
    return { transcription };

  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred while transcribing the audio.');
  }
}
