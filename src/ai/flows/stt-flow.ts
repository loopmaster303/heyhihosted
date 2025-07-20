
'use server';

import {SpeechClient} from '@google-cloud/speech';

// Instantiates a client. By explicitly providing the project ID,
// we can help resolve authentication issues in some environments.
const speechClient = new SpeechClient({
  // This helps the client find the correct project, especially when ADC has issues.
  // The GOOGLE_CLOUD_PROJECT env var is usually set automatically by App Hosting.
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

/**
 * Transcribes an audio file using the Google Cloud Speech-to-Text API.
 * @param audioFile The audio file object (e.g., from FormData).
 * @returns An object containing the transcription text.
 */
export async function transcribeAudio(audioFile: File): Promise<{transcription: string}> {
  if (!audioFile) {
    throw new Error('No audio file provided for transcription.');
  }

  try {
    const audioBytes = Buffer.from(await audioFile.arrayBuffer());
    const audio = {
      content: audioBytes.toString('base64'),
    };

    // The audio file's MIME type from the client is 'audio/webm'.
    // The corresponding encoding in Google Cloud Speech is 'WEBM_OPUS'.
    const config = {
      encoding: 'WEBM_OPUS' as const,
      sampleRateHertz: 48000, // Common for webm/opus
      languageCode: 'en-US', // Or make this dynamic
      model: 'latest_long',
    };

    const request = {
      audio: audio,
      config: config,
    };

    // Detects speech in the audio file
    const [response] = await speechClient.recognize(request);
    const transcription =
      response.results?.map(result => result.alternatives?.[0].transcript).join('\n') ?? '';

    if (!transcription) {
      console.warn('Google Cloud STT returned no transcription.');
      return {transcription: ''};
    }

    return {transcription};
  } catch (error) {
    console.error('Error in Google Cloud STT flow:', error);
    throw new Error(
      `Google Cloud STT failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
