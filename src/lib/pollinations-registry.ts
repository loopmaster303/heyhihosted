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

let cache: { at: number; models: RegistryModel[] } | null = null;

export function _clearRegistryCacheForTesting(): void {
  cache = null;
}

async function loadRegistry(apiKey?: string): Promise<RegistryModel[]> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.models;

  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const res = await fetch(UPSTREAM, { headers });
  if (!res.ok) throw new Error(`image/models ${res.status}`);
  const raw = (await res.json()) as RegistryModel[] | { data?: RegistryModel[] };
  const models = Array.isArray(raw) ? raw : raw.data ?? [];
  cache = { at: now, models };
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
