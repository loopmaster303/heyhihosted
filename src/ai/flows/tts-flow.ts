'use server';
/**
 * @fileOverview Converts text to speech using Pollinations (OpenAI TTS compatible).
 *
 * - textToSpeech - Converts a string of text into playable audio data (data URI).
 */

const POLLINATIONS_TTS_ENDPOINT = 'https://gen.pollinations.ai/v1/audio/speech';

// Pollinations exposes both OpenAI voices and ElevenLabs voices behind the same endpoint.
// We pick a provider model based on the selected voice.
const OPENAI_VOICES = new Set([
  'alloy',
  'echo',
  'fable',
  'onyx',
  'nova',
  'shimmer',
  'ash',
  'ballad',
  'coral',
  'sage',
  'verse',
]);

function getPollinationsApiKey() {
  return process.env.POLLEN_API_KEY || process.env.POLLINATIONS_API_KEY || '';
}

function resolveTtsModelForVoice(voice: string) {
  return OPENAI_VOICES.has(voice) ? 'tts-1' : 'elevenlabs';
}

export async function textToSpeech(text: string, voice: string): Promise<{ audioDataUri: string }> {
  if (!text || text.trim() === '') {
    throw new Error('Input text cannot be empty.');
  }
  if (!voice || typeof voice !== 'string') {
    throw new Error('The "voice" parameter is required.');
  }

  const apiKey = getPollinationsApiKey();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const model = resolveTtsModelForVoice(voice);

  const response = await fetch(POLLINATIONS_TTS_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      input: text.trim(),
      voice,
      response_format: 'mp3',
      speed: 1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Pollinations TTS failed (${response.status}): ${errorText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'audio/mpeg';
  const base64Audio = Buffer.from(audioBuffer).toString('base64');
  const audioDataUri = `data:${contentType};base64,${base64Audio}`;

  return { audioDataUri };
}

