export async function speechToText(audioFile: File): Promise<{ transcription: string }> {
  if (!audioFile || audioFile.size === 0) {
    throw new Error('Invalid audio file');
  }

  const endpoint = 'https://gen.pollinations.ai/v1/audio/transcriptions';
  const apiKey = process.env.POLLEN_API_KEY || process.env.POLLINATIONS_API_KEY;

  const headers: HeadersInit = {};
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const attempt = async (model: 'scribe' | 'whisper-large-v3') => {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', model);
    formData.append('language', 'de');
    formData.append('response_format', 'json');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Pollinations STT failed (${model}) (${response.status}): ${errorText}`);
    }

    const result = await response.json().catch(() => ({}));
    const text = typeof (result as any).text === 'string' ? (result as any).text : '';
    return text.trim();
  };

  try {
    const transcription = await attempt('scribe');
    return { transcription };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[STT] scribe failed; retrying whisper-large-v3:', msg);
    const transcription = await attempt('whisper-large-v3');
    return { transcription };
  }
}
