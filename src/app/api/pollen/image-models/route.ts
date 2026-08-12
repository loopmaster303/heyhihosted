import { NextResponse } from 'next/server';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';
import crypto from 'node:crypto';

const UPSTREAM = 'https://gen.pollinations.ai/image/models';
const TTL_MS = 60_000;
const cache = new Map<string, { at: number; body: string; contentType: string }>();

export function _clearCacheForTesting() {
  cache.clear();
}

function keyHash(key: string | undefined): string {
  return key ? crypto.createHash('sha256').update(key).digest('hex').slice(0, 16) : 'anon';
}

export async function GET(request: Request) {
  const apiKey = resolvePollenKey(request);
  const hash = keyHash(apiKey);
  const now = Date.now();
  const hit = cache.get(hash);
  if (hit && now - hit.at < TTL_MS) {
    return new Response(hit.body, { status: 200, headers: { 'content-type': hit.contentType } });
  }
  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const upstream = await fetch(UPSTREAM, { headers });
  const body = await upstream.text();
  const contentType = upstream.headers.get('content-type') ?? 'application/json';
  if (upstream.ok) cache.set(hash, { at: now, body, contentType });
  return new Response(body, { status: upstream.status, headers: { 'content-type': contentType } });
}
