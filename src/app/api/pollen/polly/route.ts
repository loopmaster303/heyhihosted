import { NextResponse } from 'next/server';
import { httpsPost } from '@/lib/https-post';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';

const POLLY_CHAT_URL = 'https://gen.pollinations.ai/v1/chat/completions';
const POLLY_MODEL_ID = 'polly';

export async function POST(request: Request) {
  try {
    const apiKey = resolvePollenKey(request);
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Pollinations API key' }, { status: 401 });
    }

    const body = await request.json();
    if (body?.model !== POLLY_MODEL_ID) {
      return NextResponse.json({ error: 'Proxy only supports model polly' }, { status: 400 });
    }

    const upstream = await httpsPost(
      POLLY_CHAT_URL,
      {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      JSON.stringify(body),
    );

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to proxy Polly request' },
      { status: 500 },
    );
  }
}
