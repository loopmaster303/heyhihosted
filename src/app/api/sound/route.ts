import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-error-handler';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Proxy to the self-hosted ACE-Step 1.5 endpoint on Modal.
 *
 * POST        → /release_task   (start a generation task)
 * GET ?taskId → /query_result   (poll task status)
 *
 * The Modal endpoint key stays server-side; the client only ever talks
 * to this route and never sees the Modal URL or key.
 */

const MODAL_BASE = process.env.MODAL_ACESTEP_URL ?? '';
const MODAL_KEY = process.env.MODAL_ACESTEP_KEY ?? '';

const MAX_DURATION_SECONDS = 240;
const DEFAULT_DURATION_SECONDS = 30;
const MAX_BATCH_SIZE = 8;
const MAX_PROMPT_LENGTH = 512;
const MAX_LYRICS_LENGTH = 5000;

interface SoundTaskResponse {
  data?: {
    task_id?: string;
    status?: string;
    queue_position?: number;
  };
  code?: number;
  error?: string | null;
}

function requireModalConfig(): NextResponse | null {
  if (!MODAL_BASE || !MODAL_KEY) {
    return NextResponse.json(
      { error: 'Sound generation is not configured (missing Modal endpoint)' },
      { status: 503 }
    );
  }
  return null;
}

function modalHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${MODAL_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(`Modal endpoint returned invalid JSON (HTTP ${response.status})`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const rate = checkRateLimit(request, { name: 'sound', limit: 10, windowMs: 60_000 });
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const configError = requireModalConfig();
    if (configError) return configError;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 });
    }

    const { prompt, lyrics, duration, batch, instrumental } = body as {
      prompt?: unknown;
      lyrics?: unknown;
      duration?: unknown;
      batch?: unknown;
      instrumental?: unknown;
    };

    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt (tags) is required' }, { status: 400 });
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt too long (max ${MAX_PROMPT_LENGTH} characters)` },
        { status: 400 }
      );
    }
    if (lyrics !== undefined && lyrics !== null && typeof lyrics !== 'string') {
      return NextResponse.json({ error: 'Lyrics must be a string' }, { status: 400 });
    }
    if (typeof lyrics === 'string' && lyrics.length > MAX_LYRICS_LENGTH) {
      return NextResponse.json(
        { error: `Lyrics too long (max ${MAX_LYRICS_LENGTH} characters)` },
        { status: 400 }
      );
    }

    const numericDuration = Number(duration ?? DEFAULT_DURATION_SECONDS);
    const safeDuration = Number.isFinite(numericDuration)
      ? Math.max(5, Math.min(MAX_DURATION_SECONDS, numericDuration))
      : DEFAULT_DURATION_SECONDS;

    const numericBatch = Number(batch ?? 4);
    const safeBatch = Number.isFinite(numericBatch)
      ? Math.max(1, Math.min(MAX_BATCH_SIZE, Math.floor(numericBatch)))
      : 4;

    // ACE-Step is instrumental when no lyrics are provided.
    const isInstrumental =
      typeof instrumental === 'boolean'
        ? instrumental
        : typeof lyrics !== 'string' || lyrics.trim().length === 0;

    const upstreamBody = {
      prompt: prompt.trim(),
      lyrics: typeof lyrics === 'string' ? lyrics : '',
      audio_duration: safeDuration,
      batch_size: safeBatch,
      thinking: false,
    };

    const upstream = await fetch(`${MODAL_BASE}/release_task`, {
      method: 'POST',
      headers: modalHeaders(),
      body: JSON.stringify(upstreamBody),
    });

    const payload = await readJson<SoundTaskResponse>(upstream);

    if (!upstream.ok || payload.error || !payload.data?.task_id) {
      console.error('[Sound] release_task failed:', upstream.status, payload.error);
      return NextResponse.json(
        { error: payload.error ?? `Sound backend error (HTTP ${upstream.status})` },
        { status: upstream.status === 200 ? 502 : upstream.status }
      );
    }

    return NextResponse.json({
      taskId: payload.data.task_id,
      status: payload.data.status ?? 'queued',
      queuePosition: payload.data.queue_position ?? null,
      duration: safeDuration,
      batch: safeBatch,
      instrumental: isInstrumental,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const configError = requireModalConfig();
    if (configError) return configError;

    const taskId = new URL(request.url).searchParams.get('taskId');
    if (!taskId || !/^[a-f0-9-]{10,64}$/i.test(taskId)) {
      return NextResponse.json({ error: 'Valid taskId required' }, { status: 400 });
    }

    const upstream = await fetch(`${MODAL_BASE}/query_result`, {
      method: 'POST',
      headers: modalHeaders(),
      body: JSON.stringify({ task_id_list: [taskId] }),
    });

    const payload = await readJson<SoundTaskResponse>(upstream);

    if (!upstream.ok || payload.error) {
      console.error('[Sound] query_result failed:', upstream.status, payload.error);
      return NextResponse.json(
        { error: payload.error ?? `Sound backend error (HTTP ${upstream.status})` },
        { status: upstream.status === 200 ? 502 : upstream.status }
      );
    }

    // Pass through the raw task payload; the client interprets status flags.
    return NextResponse.json({ data: payload.data ?? null });
  } catch (error) {
    return handleApiError(error);
  }
}
