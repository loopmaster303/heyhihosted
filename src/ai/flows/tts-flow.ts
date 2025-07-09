'use server';
/**
 * @fileOverview A Genkit flow for Text-to-Speech (TTS) conversion.
 *
 * - textToSpeech - Converts a string of text into playable audio data.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import wav from 'wav';

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: z.object({
      text: z.string(),
      voice: z.string(),
    }),
    outputSchema: z.object({
      audioDataUri: z.string(),
    }),
  },
  async ({ text, voice }) => {
    if (!text || text.trim() === '') {
      throw new Error('Input text cannot be empty.');
    }

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
      prompt: text,
    });

    if (!media) {
      throw new Error('No media returned from the TTS model.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);

    return {
      audioDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);

export async function textToSpeech(text: string, voice: string): Promise<{ audioDataUri: string }> {
 return textToSpeechFlow({ text, voice });
}
