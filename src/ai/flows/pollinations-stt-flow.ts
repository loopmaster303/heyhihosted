
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

  // Extract base64 data and determine the format for the API.
  const base64Data = audioDataUri.substring(audioDataUri.indexOf(',') + 1);
  let format: string;

  if (audioDataUri.startsWith('data:audio/mpeg')) {
    format = 'mp3';
  } else if (audioDataUri.startsWith('data:audio/wav')) {
    format = 'wav';
  } else {
    // The API only supports mp3 and wav.
    throw new Error('Unsupported audio format. Please provide audio in MP3 or WAV format.');
  }

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

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Pollinations STT API request failed with status ${response.status}: ${responseText}`);
    }

    const result = JSON.parse(responseText);

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
