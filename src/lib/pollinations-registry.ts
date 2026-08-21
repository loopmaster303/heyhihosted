/**
 * Serverseitiger Zugriff auf die Pollinations-Modellregistry.
 *
 * `unified-image-models.ts` ist eine handgepflegte Auswahl und kennt nur einen
 * Teil dessen, was Pollinations tatsächlich anbietet. Der Playground zeigt die
 * volle Liste, also muss `/api/generate` Modelle akzeptieren, die dort fehlen —
 * sonst bietet die Oberfläche Modelle an, die die Route mit 400 abweist.
 *
 * Die Registry ist die Wahrheit; die lokale Config bleibt der Schnellweg.
 */

import { createHash } from 'node:crypto';

const UPSTREAM = 'https://gen.pollinations.ai/image/models';
const TTL_MS = 60_000;

export interface RegistryModel {
  name: string;
  title?: string;
  input_modalities?: string[];
  output_modalities?: string[];
  video_capabilities?: string[];
  max_reference_images?: number;
  resolutions?: string[];
  paid_only?: boolean;
}

/**
 * Pro Key getrennt: die Registry antwortet je nach Konto unterschiedlich
 * (paid_only). Ein gemeinsamer Eintrag hiesse, dass ein anonymer Aufruf
 * eine Minute lang auch fuer Key-Inhaber gilt — und umgekehrt. Der Key selbst
 * wird gehasht, damit er nicht als Map-Schluessel herumliegt.
 */
const MAX_CACHE_ENTRIES = 32;
const cache = new Map<string, { at: number; models: RegistryModel[] }>();

function cacheKey(apiKey?: string): string {
  return apiKey ? createHash('sha256').update(apiKey).digest('hex').slice(0, 16) : 'anon';
}

export function _clearRegistryCacheForTesting(): void {
  cache.clear();
}

async function loadRegistry(apiKey?: string): Promise<RegistryModel[]> {
  const now = Date.now();
  const key = cacheKey(apiKey);
  const hit = cache.get(key);
  if (hit && now - hit.at < TTL_MS) return hit.models;

  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const res = await fetch(UPSTREAM, { headers });
  if (!res.ok) throw new Error(`image/models ${res.status}`);
  const raw = (await res.json()) as RegistryModel[] | { data?: RegistryModel[] };
  const models = Array.isArray(raw) ? raw : raw.data ?? [];
  // Unbegrenztes Wachstum ist bei einem prozessweiten Cache kein Detail.
  if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
  cache.set(key, { at: now, models });
  return models;
}

/**
 * Sucht ein Modell in der Registry. Schlägt der Abruf fehl, gilt das Modell als
 * unbekannt — ein Ausfall der Registry darf keine 500er aus einer ohnehin
 * fehlerhaften Anfrage machen.
 */
export async function findRegistryModel(
  modelId: string,
  apiKey?: string,
): Promise<RegistryModel | undefined> {
  try {
    const models = await loadRegistry(apiKey);
    return models.find((m) => m.name === modelId);
  } catch (error) {
    console.warn('[Registry] Lookup failed:', error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

export function registryModelIsVideo(m: RegistryModel): boolean {
  return (m.output_modalities ?? []).includes('video');
}

export function registryMaxImages(m: RegistryModel): number {
  return m.max_reference_images ?? ((m.input_modalities ?? []).includes('image') ? 1 : 0);
}
