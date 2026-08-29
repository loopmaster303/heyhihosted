/**
 * Serverseitiger Zugriff auf die Pollinations-Modellregistry.
 *
 * `unified-image-models.ts` ist eine handgepflegte Auswahl und kennt nur einen
 * Teil dessen, was Pollinations tatsächlich anbietet. Der Playground zeigt die
 * volle Liste, also muss `/api/generate` Modelle akzeptieren, die dort fehlen —
 * sonst bietet die Oberfläche Modelle an, die die Route mit 400 abweist.
 *
 * Die Registry ist die Wahrheit; die lokale Config bleibt der Schnellweg.
 *
 * Fetch und Cache liegen zentral in `pollinations/image-model-registry.ts`;
 * dieses Modul liefert nur die typisierte Sicht für `/api/generate`.
 */

import { fetchImageModelsRaw, _clearRegistryCacheForTesting } from '@/lib/pollinations/image-model-registry';

export interface RegistryModel {
  name: string;
  title?: string;
  aliases?: string[];
  input_modalities?: string[];
  output_modalities?: string[];
  video_capabilities?: string[];
  max_reference_images?: number;
  resolutions?: string[];
  paid_only?: boolean;
}

export { _clearRegistryCacheForTesting };

async function loadRegistry(apiKey?: string): Promise<RegistryModel[]> {
  const { body, status } = await fetchImageModelsRaw(apiKey);
  if (status < 200 || status >= 300) throw new Error(`image/models ${status}`);
  const raw = JSON.parse(body) as RegistryModel[] | { data?: RegistryModel[] };
  return Array.isArray(raw) ? raw : raw.data ?? [];
}

/**
 * Sucht ein Modell in der Registry — unter dem Namen oder einem Anbieter-Alias
 * (z. B. löst `gpt-image` zu `gptimage` auf, `veo-1080p` zu `veo`). Schlägt der
 * Abruf fehl, gilt das Modell als unbekannt — ein Ausfall der Registry darf
 * keine 500er aus einer ohnehin fehlerhaften Anfrage machen.
 */
export async function findRegistryModel(
  modelId: string,
  apiKey?: string,
): Promise<RegistryModel | undefined> {
  try {
    const models = await loadRegistry(apiKey);
    return (
      models.find((m) => m.name === modelId) ??
      models.find((m) => m.aliases?.includes(modelId))
    );
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
