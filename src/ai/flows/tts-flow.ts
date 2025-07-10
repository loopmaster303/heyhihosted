'use server';
/**
 * @fileOverview Converts text to speech using a custom Replicate API endpoint.
 *
 * - textToSpeech - Converts a string of text into playable audio data (MP3/WAV).
 */

export async function textToSpeech(text: string, voice: string): Promise<{ audioDataUri: string }> {
  if (!text || text.trim() === '') {
    throw new Error('Input text cannot be empty.');
  }

  try {
    const response = await fetch('/api/replicate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_id: voice }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `TTS API request failed with status ${response.status}`);
    }

    if (!data.audioUrl) {
        throw new Error('TTS API returned no audio URL.');
    }
    
    return {
      audioDataUri: data.audioUrl,
    };

  } catch (error) {
    console.error('ERROR synthesizing speech with Replicate TTS:', error);
    // Re-throw a more user-friendly error
    if (error instanceof Error) {
        throw new Error(`Failed to generate audio with Replicate: ${error.message}`);
    }
    throw new Error('An unknown error occurred during audio generation.');
  }
}
