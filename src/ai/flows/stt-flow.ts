import { Readable } from 'stream';
import { Buffer } from 'buffer';

export async function speechToText(audioFile: File): Promise<{ transcription: string }> {
  if (!audioFile || audioFile.size === 0) {
    throw new Error('Invalid audio file');
  }

  const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

  const url = new URL('https://api.deepgram.com/v1/listen');
  url.searchParams.append('language', 'de');
  url.searchParams.append('punctuate', 'true');
  url.searchParams.append('smart_format', 'true');

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
      'Content-Type': audioFile.type || 'audio/webm',
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Deepgram API error response:', errorBody);
    throw new Error('Deepgram API request failed');
  }

  const result = await response.json();
  const transcription = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

  return { transcription: transcription.trim() };
}