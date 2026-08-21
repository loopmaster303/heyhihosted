import crypto from 'node:crypto';
import type { PollinationsLiveModel } from '@/lib/playground/model-source';

const UPSTREAM = 'https://gen.pollinations.ai/image/models';
const TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 32;

interface CacheEntry {
  at: number;
  body: string;
  contentType: string;
  status: number;
}

const cache = new Map<string, CacheEntry>();

export function _clearRegistryCacheForTesting() {
  cache.clear();
}

function keyHash(key: string | undefined): string {
  return key ? crypto.createHash('sha256').update(key).digest('hex').slice(0, 16) : 'anon';
}

/**
 * Holt die Live-Registry als Rohtext. Der Cache ist bewusst pro Key: die
 * Antwort unterscheidet sich je nach Berechtigung, und ohne Grenze wuechse die
 * Map mit jedem neuen Key.
 */
export async function fetchImageModelsRaw(
  apiKey?: string,
): Promise<{ body: string; contentType: string; status: number }> {
  const hash = keyHash(apiKey);
  const now = Date.now();
  const hit = cache.get(hash);
  if (hit && now - hit.at < TTL_MS) {
    return { body: hit.body, contentType: hit.contentType, status: hit.status };
  }

  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const upstream = await fetch(UPSTREAM, { headers });
  const body = await upstream.text();
  const contentType = upstream.headers.get('content-type') ?? 'application/json';

  if (upstream.ok) {
    if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
    cache.set(hash, { at: now, body, contentType, status: upstream.status });
  }
  return { body, contentType, status: upstream.status };
}

function parseModels(body: string): PollinationsLiveModel[] {
  try {
    const raw = JSON.parse(body) as PollinationsLiveModel[] | { data?: PollinationsLiveModel[] };
    return Array.isArray(raw) ? raw : raw.data ?? [];
  } catch {
    return [];
  }
}

/**
 * Sucht einen Registry-Eintrag anhand seiner ID oder eines seiner Aliase.
 * Gibt `null` zurueck, wenn die Registry nicht erreichbar ist — der Aufrufer
 * muss ohne Metadaten weiterarbeiten koennen.
 */
export async function findLiveImageModel(
  modelId: string,
  apiKey?: string,
): Promise<PollinationsLiveModel | null> {
  try {
    const { body, status } = await fetchImageModelsRaw(apiKey);
    if (status < 200 || status >= 300) return null;
    const models = parseModels(body);
    const needle = modelId.toLowerCase();
    return (
      models.find((m) => m.name?.toLowerCase() === needle)
      ?? models.find((m) => m.aliases?.some((a) => a.toLowerCase() === needle))
      ?? null
    );
  } catch {
    return null;
  }
}
