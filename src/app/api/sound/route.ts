import { NextRequest, NextResponse } from 'next/server';
import { ApiError, handleApiError } from '@/lib/api-error-handler';
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

function requireModalConfig(): void {
  if (!MODAL_BASE || !MODAL_KEY) {
    throw new ApiError(503, 'Sound generation is not configured (missing Modal endpoint)', 'SOUND_NOT_CONFIGURED');
  }
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
        { error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    requireModalConfig();

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw new ApiError(400, 'Request body must be JSON', 'VALIDATION_ERROR');
    }

    const { prompt, lyrics, duration, batch, instrumental } = body as {
      prompt?: unknown;
      lyrics?: unknown;
      duration?: unknown;
      batch?: unknown;
      instrumental?: unknown;
    };

    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new ApiError(400, 'Prompt (tags) is required', 'VALIDATION_ERROR', { field: 'tags' });
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      throw new ApiError(
        400,
        `Prompt too long (max ${MAX_PROMPT_LENGTH} characters)`,
        'SOUND_FIELD_TOO_LONG',
        { field: 'tags', limit: MAX_PROMPT_LENGTH },
      );
    }
    if (lyrics !== undefined && lyrics !== null && typeof lyrics !== 'string') {
      throw new ApiError(400, 'Lyrics must be a string', 'VALIDATION_ERROR', { field: 'lyrics' });
    }
    if (typeof lyrics === 'string' && lyrics.length > MAX_LYRICS_LENGTH) {
      throw new ApiError(
        400,
        `Lyrics too long (max ${MAX_LYRICS_LENGTH} characters)`,
        'SOUND_FIELD_TOO_LONG',
        { field: 'lyrics', limit: MAX_LYRICS_LENGTH },
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
      // 5xx vom Anbieter ist ein Ausfall, alles andere ein fehlerhafter Vertrag.
      throw new ApiError(
        upstream.status === 200 ? 502 : upstream.status,
        payload.error ?? `Sound backend error (HTTP ${upstream.status})`,
        upstream.status >= 500 ? 'PROVIDER_UNAVAILABLE' : 'SOUND_BACKEND_ERROR',
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
    requireModalConfig();

    const taskId = new URL(request.url).searchParams.get('taskId');
    if (!taskId || !/^[a-f0-9-]{10,64}$/i.test(taskId)) {
      throw new ApiError(400, 'Valid taskId required', 'VALIDATION_ERROR', { field: 'taskId' });
    }

    const upstream = await fetch(`${MODAL_BASE}/query_result`, {
      method: 'POST',
      headers: modalHeaders(),
      body: JSON.stringify({ task_id_list: [taskId] }),
    });

    const payload = await readJson<SoundTaskResponse>(upstream);

    if (!upstream.ok || payload.error) {
      console.error('[Sound] query_result failed:', upstream.status, payload.error);
      throw new ApiError(
        upstream.status === 200 ? 502 : upstream.status,
        payload.error ?? `Sound backend error (HTTP ${upstream.status})`,
        upstream.status >= 500 ? 'PROVIDER_UNAVAILABLE' : 'SOUND_BACKEND_ERROR',
      );
    }

    // Pass through the raw task payload; the client interprets status flags.
    return NextResponse.json({ data: payload.data ?? null });
  } catch (error) {
    return handleApiError(error);
  }
}
