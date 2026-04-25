import { NextResponse } from 'next/server';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';

const POLLEN_ACCOUNT_URL = 'https://gen.pollinations.ai/account/balance';

export async function GET(request: Request) {
  try {
    const apiKey = resolvePollenKey(request);
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Pollinations API key' }, { status: 401 });
    }

    const response = await fetch(POLLEN_ACCOUNT_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: 'no-store',
    });

    const rawBody = await response.text();
    let data: any = null;
    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      data = { error: rawBody || 'Failed to fetch Pollinations account info' };
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || `Failed to fetch Pollinations account info (${response.status})` },
        { status: response.status },
      );
    }

    return NextResponse.json({
      balance: data.balance ?? data.pollen_count ?? null,
      expiresAt: data.expires_at ?? null,
      expiresIn: data.expires_in ?? null,
      valid: data.valid ?? true,
      keyType: data.key_type ?? null,
      pollenBudget: data.pollen_budget ?? null,
      rateLimitEnabled: data.rate_limit_enabled ?? false,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch Pollinations account info' },
      { status: 500 },
    );
  }
}
