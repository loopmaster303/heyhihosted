import { NextResponse } from 'next/server';
import { z } from 'zod';
import { httpsPost } from '@/lib/https-post';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';
import { handleApiError } from '@/lib/api-error-handler';
import { checkRateLimit } from '@/lib/rate-limit';

const POLLY_CHAT_URL = 'https://gen.pollinations.ai/v1/chat/completions';
const POLLY_MODEL_ID = 'polly';

// Only forward a known-safe subset of the OpenAI-compatible chat payload;
// anything else is rejected instead of passed through verbatim.
const PollyRequestSchema = z
  .object({
    model: z.literal(POLLY_MODEL_ID),
    messages: z
      .array(
        z.object({
          role: z.enum(['system', 'user', 'assistant', 'tool']),
          content: z.union([z.string().max(100_000), z.array(z.unknown()).max(20)]),
        })
      )
      .min(1)
      .max(100),
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().int().positive().max(8192).optional(),
    top_p: z.number().min(0).max(1).optional(),
    stop: z.union([z.string().max(200), z.array(z.string().max(200)).max(4)]).optional(),
  })
  .strict();

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(request, { name: 'polly', limit: 30, windowMs: 60_000 });
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const apiKey = resolvePollenKey(request);
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Pollinations API key' }, { status: 401 });
    }

    const body = await request.json();
    if (body?.model !== POLLY_MODEL_ID) {
      return NextResponse.json({ error: 'Proxy only supports model polly' }, { status: 400 });
    }

    const parsed = PollyRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid Polly request payload' }, { status: 400 });
    }

    const upstream = await httpsPost(
      POLLY_CHAT_URL,
      {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      JSON.stringify(parsed.data),
    );

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
