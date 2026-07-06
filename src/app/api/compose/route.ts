import { NextRequest, NextResponse } from 'next/server';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';
import { httpsFetchBinary } from '@/lib/https-post';
import { handleApiError } from '@/lib/api-error-handler';

const POLLINATIONS_BASE = 'https://gen.pollinations.ai';
type ComposeModel = 'elevenmusic' | 'acestep' | 'stable-audio-3-medium';
const VALID_COMPOSE_MODELS: readonly ComposeModel[] = ['elevenmusic', 'acestep', 'stable-audio-3-medium'];
const FREE_TIER_MODELS: readonly ComposeModel[] = ['acestep'];
const MAX_COMPOSE_URL_LENGTH = 2000;
const DEFAULT_DURATION = 60;

export async function POST(request: NextRequest) {
  try {
    const { prompt, duration, instrumental = false, model = 'acestep' } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (typeof model !== 'string' || !VALID_COMPOSE_MODELS.includes(model as ComposeModel)) {
      return NextResponse.json(
        { error: `Unknown or unavailable Pollinations compose model: ${String(model)}` },
        { status: 400 }
      );
    }

    const selectedModel = model as ComposeModel;

    // BYOP: Resolve API key (user key from header → env var fallback)
    const apiKey = resolvePollenKey(request);

    // Free tier (no key): only acestep is allowed. Paid models require a Pollinations API key.
    if (!apiKey && !FREE_TIER_MODELS.includes(selectedModel)) {
      return NextResponse.json(
        { error: 'This model requires a Pollinations API key' },
        { status: 403 }
      );
    }

    // Free tier (ACE-Step, no key): max 1 min. Own Pollen key: full 300s (5 min).
    const maxDuration = apiKey ? 300 : 60;
    const numericDuration = Number(duration ?? DEFAULT_DURATION);
    const safeDuration = Number.isFinite(numericDuration)
      ? Math.max(3, Math.min(maxDuration, numericDuration))
      : Math.min(maxDuration, DEFAULT_DURATION);
    const isInstrumental = Boolean(instrumental);

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    let resp: { status: number; buffer: Buffer; contentType: string };
    // ElevenMusic uses the Pollinations universal audio GET endpoint.
    // The OpenAI-compatible POST /v1/audio/speech endpoint does not support
    // the music-specific `duration` and `instrumental` params.
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `${POLLINATIONS_BASE}/audio/${encodedPrompt}?model=${encodeURIComponent(selectedModel)}&duration=${safeDuration}&instrumental=${isInstrumental}`;
    if (url.length > MAX_COMPOSE_URL_LENGTH) {
      return NextResponse.json(
        { error: 'Compose prompt too long for Pollinations audio GET endpoint. Shorten the prompt and try again.' },
        { status: 414 }
      );
    }

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
      duration: safeDuration,
      instrumental: isInstrumental,
      model: selectedModel,
    });

  } catch (error) {
    return handleApiError(error);
  }
}
