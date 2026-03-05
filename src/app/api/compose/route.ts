import { NextRequest, NextResponse } from 'next/server';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';
import { httpsFetchBinary } from '@/lib/https-post';

const POLLINATIONS_BASE = 'https://gen.pollinations.ai';
type ComposeModel = 'elevenmusic' | 'suno';

export async function POST(request: NextRequest) {
  try {
    const { prompt, duration = 60, instrumental = false, model = 'elevenmusic' } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const selectedModel: ComposeModel = model === 'suno' ? 'suno' : 'elevenmusic';

    // BYOP: Resolve API key (user key from header → env var fallback)
    const apiKey = resolvePollenKey(request);

    // Free tier: max 120s. Own Pollen key: full 300s.
    const maxDuration = apiKey ? 300 : 120;
    const validDuration = Math.max(3, Math.min(maxDuration, Number(duration)));

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    let resp: { status: number; buffer: Buffer; contentType: string };
    // Both models use the Pollinations universal audio endpoint (GET).
    // The OpenAI-compatible POST /v1/audio/speech endpoint does not support
    // the music-specific `duration` and `instrumental` params — they are silently
    // ignored and Pollinations falls back to its own defaults (60s, vocals).
    const encodedPrompt = encodeURIComponent(prompt);
    const audioModel = selectedModel === 'suno' ? 'suno' : 'elevenmusic';
    const url = `${POLLINATIONS_BASE}/audio/${encodedPrompt}?model=${audioModel}&duration=${validDuration}&instrumental=${instrumental}`;
    console.log('[Compose] Requesting audio:', url.slice(0, 120) + (url.length > 120 ? '…' : ''));
    resp = await httpsFetchBinary(url, headers);

    if (resp.status !== 200) {
      console.error('[Compose] API Error:', resp.status);
      return NextResponse.json(
        { error: `Pollinations API error: ${resp.status}` },
        { status: resp.status }
      );
    }

    // Return audio as base64 for easy client handling
    const base64Audio = resp.buffer.toString('base64');
    const audioDataUrl = `data:${resp.contentType};base64,${base64Audio}`;

    return NextResponse.json({
      audioUrl: audioDataUrl,
      prompt,
      duration: validDuration,
      instrumental,
      model: selectedModel,
    });

  } catch (error) {
    console.error('Compose API error:', error);
    return NextResponse.json(
      { error: `Music generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
