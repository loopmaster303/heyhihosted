import { NextRequest, NextResponse } from 'next/server';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';
import { httpsFetchBinary } from '@/lib/https-post';

const POLLINATIONS_BASE = 'https://gen.pollinations.ai';

export async function POST(request: NextRequest) {
  try {
    const { prompt, duration = 60, instrumental = false } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // BYOP: Resolve API key (user key from header → env var fallback)
    const apiKey = resolvePollenKey(request);

    // Free tier: max 120s. Own Pollen key: full 300s.
    const maxDuration = apiKey ? 300 : 120;
    const validDuration = Math.max(3, Math.min(maxDuration, Number(duration)));

    // Build Universal request (GET)
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `${POLLINATIONS_BASE}/audio/${encodedPrompt}?model=elevenmusic&duration=${validDuration}&instrumental=${instrumental}`;

    console.log('[Compose] Requesting audio (Universal):', url);

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Fetch audio via curl (bypasses Next.js fetch patching)
    const resp = await httpsFetchBinary(url, headers);

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
    });

  } catch (error) {
    console.error('Compose API error:', error);
    return NextResponse.json(
      { error: `Music generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
