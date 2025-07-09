'use server';
/**
 * @fileOverview Converts text to speech using the official Google Cloud Text-to-Speech API.
 *
 * - textToSpeech - Converts a string of text into playable audio data (MP3).
 */

import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// Instantiates a client.
// The client will automatically use credentials from the environment if configured correctly.
const ttsClient = new TextToSpeechClient();

export async function textToSpeech(text: string, voice: string): Promise<{ audioDataUri: string }> {
  if (!text || text.trim() === '') {
    throw new Error('Input text cannot be empty.');
  }

  // The text to synthesize
  const synthesisInput = {
    text: text,
  };

  // Build the voice request
  const voiceSelection = {
    languageCode: voice.split('-').slice(0, 2).join('-'), // e.g., 'de-DE' from 'de-DE-Wavenet-F'
    name: voice, // e.g., 'de-DE-Wavenet-F'
  };

  // Select the type of audio file you want
  const audioConfig = {
    audioEncoding: 'MP3' as const,
  };

  const request = {
    input: synthesisInput,
    voice: voiceSelection,
    audioConfig: audioConfig,
  };

  try {
    const [response] = await ttsClient.synthesizeSpeech(request);
    
    if (!response.audioContent) {
        throw new Error('No audio content received from Google TTS API.');
    }

    // The audioContent is a Buffer. Convert it to a base64 string.
    const audioBase64 = Buffer.from(response.audioContent as Uint8Array).toString('base64');
    
    // Create the data URI for an MP3 file.
    const audioDataUri = `data:audio/mp3;base64,${audioBase64}`;

    return {
      audioDataUri,
    };
  } catch (error) {
    console.error('ERROR synthesizing speech with Google Cloud TTS:', error);
    // Re-throw a more user-friendly error
    throw new Error('Failed to generate audio with Google Cloud TTS. Ensure API is enabled and authentication is configured.');
  }
}
