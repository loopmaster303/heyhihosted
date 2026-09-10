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

import {
  fetchImageModelsRaw,
  _clearRegistryCacheForTesting,
  type RegistryFailure,
} from '@/lib/pollinations/image-model-registry';

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

/** Was eine Modellsuche ergeben kann: gefunden, sicher nicht vorhanden, oder nicht beantwortbar. */
export type RegistryLookup =
  | { status: 'found'; model: RegistryModel }
  | { status: 'missing' }
  | { status: 'unavailable'; reason: RegistryFailure };

type RegistryLoad = { models: RegistryModel[] } | { failure: RegistryFailure };

async function loadRegistry(apiKey?: string): Promise<RegistryLoad> {
  const { body, status, failure } = await fetchImageModelsRaw(apiKey);
  if (failure) return { failure };
  if (status < 200 || status >= 300) return { failure: 'upstream' };
  let models: RegistryModel[];
  try {
    const raw = JSON.parse(body) as RegistryModel[] | { data?: RegistryModel[] };
    models = Array.isArray(raw) ? raw : raw.data ?? [];
  } catch {
    // HTML statt JSON (etwa eine Challenge-Seite) ist keine Aussage ueber
    // Modelle, sondern ein Ausfall.
    return { failure: 'parse' };
  }
  // Eine leere Liste ist keine Aussage der Art "es gibt keine Modelle" —
  // sondern eine kaputte Antwort. Sie darf nie zu "Modell unbekannt" werden.
  if (models.length === 0) return { failure: 'empty' };
  return { models };
}

function findModel(models: RegistryModel[], modelId: string): RegistryModel | undefined {
  return (
    models.find((m) => m.name === modelId)
    ?? models.find((m) => m.aliases?.includes(modelId))
  );
}

/**
 * Sucht ein Modell in der Registry — unter dem Namen oder einem Anbieter-Alias
 * (z. B. loest `gpt-image` zu `gptimage` auf, `veo-1080p` zu `veo`).
 *
 * Gefragt werden zwei Sichten, weil eine allein die Frage nicht beantwortet:
 * zuerst die Sicht des Aufrufers (sie kennt Freigaben, die der oeffentliche
 * Katalog nicht kennt), danach der Abruf **ohne** Schluessel. Der ist der
 * vollstaendige Katalog — die Sicht mit Schluessel ist berechtigungsgefiltert:
 * ein Schluessel ohne Guthaben sieht in ihr nur die kostenlosen Modelle (live
 * belegt am 2026-09-10: Betreiber-Schluessel 2 Eintraege, ohne Schluessel 82).
 *
 * Genau diese Filterung liess jedes Modell ausserhalb der lokalen Config zu
 * "Unknown model" werden — auch Modelle, die eine Sekunde vorher noch Bilder
 * geliefert hatten. `missing` heisst deshalb nur noch: eine Sicht hat
 * geantwortet und kennt das Modell nicht. Konnte keine Sicht antworten, ist das
 * Ergebnis `unavailable`; der Aufrufer reicht dann durch, statt zu behaupten,
 * das Modell gebe es nicht.
 */
export async function lookupRegistryModel(
  modelId: string,
  apiKey?: string,
): Promise<RegistryLookup> {
  const fehlschlaege: RegistryFailure[] = [];

  if (apiKey) {
    const keyed = await loadRegistry(apiKey);
    if ('models' in keyed) {
      const model = findModel(keyed.models, modelId);
      if (model) return { status: 'found', model };
    } else {
      fehlschlaege.push(keyed.failure);
    }
  }

  const katalog = await loadRegistry(undefined);
  if ('models' in katalog) {
    const model = findModel(katalog.models, modelId);
    if (model) return { status: 'found', model };
  } else {
    fehlschlaege.push(katalog.failure);
  }

  if (fehlschlaege.length > 0) return { status: 'unavailable', reason: fehlschlaege[0] };
  return { status: 'missing' };
}

export function registryModelIsVideo(m: RegistryModel): boolean {
  return (m.output_modalities ?? []).includes('video');
}

export function registryMaxImages(m: RegistryModel): number {
  return m.max_reference_images ?? ((m.input_modalities ?? []).includes('image') ? 1 : 0);
}
