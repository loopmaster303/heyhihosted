import { NextResponse } from 'next/server';
import { httpsGet } from '@/lib/https-post';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';

const POLLINATIONS_MODELS_URL = 'https://gen.pollinations.ai/v1/models';

export async function GET(request: Request) {
  try {
    const apiKey = resolvePollenKey(request);
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Pollinations API key' }, { status: 401 });
    }

    const upstream = await httpsGet(
      POLLINATIONS_MODELS_URL,
      {
        Authorization: `Bearer ${apiKey}`,
      },
    );

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to proxy Pollinations models request' },
      { status: 500 },
    );
  }
}
