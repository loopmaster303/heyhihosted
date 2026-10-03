import crypto from 'node:crypto';
import type { PollinationsLiveModel } from '@/lib/playground/model-source';

const UPSTREAM = 'https://gen.pollinations.ai/image/models';
const TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 32;

/**
 * Ein haengender Abruf hat vorher die ganze Generierung mitgenommen: der
 * fetch lief ohne Grenze, `/api/generate` wartete mit. 6 s sind grosszuegig —
 * der Anbieter antwortet normalerweise in ~300 ms.
 */
const TIMEOUT_MS = 6_000;

/**
 * Fehlschlaege werden nur kurz gemerkt. Ohne das feuert jede Generierung
 * waehrend eines Ausfalls einen eigenen Abruf und laeuft in denselben Timeout.
 */
const FAILURE_TTL_MS = 5_000;

/** Warum keine verwertbare Registry-Antwort vorliegt. */
export type RegistryFailure = 'timeout' | 'network' | 'upstream' | 'parse' | 'empty';

export interface ImageModelsRaw {
  body: string;
  contentType: string;
  status: number;
  /** Gesetzt, wenn die Antwort keine Modellliste ist. */
  failure?: RegistryFailure;
}

interface CacheEntry extends ImageModelsRaw {
  at: number;
}

const cache = new Map<string, CacheEntry>();

export function _clearRegistryCacheForTesting() {
  cache.clear();
}

function keyHash(key: string | undefined): string {
  return key ? crypto.createHash('sha256').update(key).digest('hex').slice(0, 16) : 'anon';
}

function snapshot(entry: CacheEntry): ImageModelsRaw {
  return { body: entry.body, contentType: entry.contentType, status: entry.status, failure: entry.failure };
}

function unavailable(failure: RegistryFailure, status: number, body?: string): CacheEntry {
  return {
    at: Date.now(),
    body: body ?? JSON.stringify({ error: 'Pollinations model registry unavailable', code: 'PROVIDER_UNAVAILABLE' }),
    contentType: 'application/json',
    status,
    failure,
  };
}

/**
 * Holt die Live-Registry als Rohtext. Der Cache ist bewusst pro Key: die
 * Antwort unterscheidet sich je nach Berechtigung, und ohne Grenze wuechse die
 * Map mit jedem neuen Key.
 *
 * Wichtig fuer alle Aufrufer: **ohne Schluessel** kommt der vollstaendige
 * Katalog (live belegt 2026-09-10: 82 Modelle), **mit** Schluessel nur das, was
 * dieser Schluessel auch bezahlen kann (derselbe Tag, Betreiber-Schluessel ohne
 * Guthaben: 2 Modelle). Ein fehlender Eintrag in der gefilterten Sicht heisst
 * also nicht, dass es das Modell nicht gibt.
 *
 * Die Funktion wirft nie. Ein Ausfall steht als `failure` im Ergebnis, damit
 * Aufrufer "kenne ich nicht" von "konnte nicht fragen" unterscheiden koennen.
 */
export async function fetchImageModelsRaw(apiKey?: string): Promise<ImageModelsRaw> {
  const hash = keyHash(apiKey);
  const now = Date.now();
  const hit = cache.get(hash);
  if (hit && now - hit.at < (hit.failure ? FAILURE_TTL_MS : TTL_MS)) {
    return snapshot(hit);
  }

  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = 'Bearer ' + apiKey;

  // `AbortSignal.timeout` fehlt in jsdom, deshalb Controller plus Timer.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let entry: CacheEntry;
  try {
    const upstream = await fetch(UPSTREAM, { headers, signal: controller.signal });
    const body = await upstream.text();
    const contentType = upstream.headers.get('content-type') ?? 'application/json';
    entry = upstream.ok
      ? { at: now, body, contentType, status: upstream.status }
      : unavailable('upstream', upstream.status, body);
  } catch (error) {
    const abgebrochen = (error as { name?: string } | null)?.name === 'AbortError';
    const grund: RegistryFailure = abgebrochen ? 'timeout' : 'network';
    entry = unavailable(grund, 503);
    console.warn('[Registry] Abruf fehlgeschlagen (' + grund + '):', error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timer);
  }

  if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
  cache.set(hash, entry);
  return snapshot(entry);
}

function parseModels(body: string): PollinationsLiveModel[] {
  try {
    const raw = JSON.parse(body) as PollinationsLiveModel[] | { data?: PollinationsLiveModel[] };
    return Array.isArray(raw) ? raw : raw.data ?? [];
  } catch {
    return [];
  }
}

export interface RegistryListing {
  models: PollinationsLiveModel[];
  /** Gesetzt, wenn mindestens eine Sicht nicht geantwortet hat. */
  failure?: RegistryFailure;
}

/**
 * Die Sicht des Schluessels **plus** die Freigabe, die sie beschreibt.
 *
 * WARUM das Set dazugehoert: die Liste allein ist nur eine Liste. Wer wissen
 * will, ob ein Modell wirklich laeuft, muss Name UND Alias pruefen — live belegt
 * am 2026-09-10 liefert der Betreiber-Schluessel
 * `black-forest-labs/flux.2-klein-4b` mit den Aliasen `flux-klein` und `klein`;
 * ein Vergleich nur ueber `name` haelt "klein" faelschlich fuer gesperrt und
 * blendet ein Modell aus, das einwandfrei laeuft.
 */
export interface AvailableImageModelsListing extends RegistryListing {
  /** Namen und Aliase der Schluessel-Sicht, kleingeschrieben. */
  runnable: ReadonlySet<string>;
}

/**
 * Beide Sichten der Registry als eine Liste — erst die des Aufrufers, dann der
 * oeffentliche Katalog.
 *
 * Eine Sicht allein beantwortet die Frage nicht: die Sicht **mit** Schluessel
 * ist berechtigungsgefiltert. Live belegt am 2026-09-10 lieferte der
 * Betreiber-Schluessel ohne Guthaben 2 Eintraege, der Abruf ohne Schluessel 82
 * (davon 25 kostenlose). Wer nur die gefilterte Sicht fragt, haelt 80 Modelle
 * fuer nicht vorhanden, die der Anbieter bedient. Erst die Vereinigung ist der
 * Katalog, den eine Auswahlliste zeigen darf; die Eintraege der Schluessel-Sicht
 * stehen vorn, weil sie die Freigaben des Aufrufers kennen.
 */
export async function listLiveImageModels(apiKey?: string): Promise<RegistryListing> {
  const sichten = apiKey ? [apiKey, undefined] : [undefined];
  const models: PollinationsLiveModel[] = [];
  const seen = new Set<string>();
  let failure: RegistryFailure | undefined;

  for (const schluessel of sichten) {
    const antwort = await fetchImageModelsRaw(schluessel);
    if (antwort.failure || antwort.status < 200 || antwort.status >= 300) {
      failure = failure ?? antwort.failure ?? 'upstream';
      continue;
    }
    for (const model of parseModels(antwort.body)) {
      const name = model.name;
      if (name) {
        if (seen.has(name)) continue;
        seen.add(name);
      }
      models.push(model);
    }
  }

  if (models.length === 0) return { models, failure: failure ?? 'empty' };
  return { models };
}

/**
 * Die Sicht des Aufrufers — und nur diese.
 *
 * Der Unterschied zu {@link listLiveImageModels} ist der Zweck: dort geht es um
 * Metadaten ("gibt es dieses Modell ueberhaupt?"), hier um die Frage "kann
 * dieser Aufrufer es auch bezahlen?". Die Antwort darauf kennt nur der Anbieter,
 * und er gibt sie selbst: laut Doku (gen.pollinations.ai/openapi.json,
 * `/image/models`) filtert die Liste bei authentifiziertem Abruf nach den
 * Rechten des Schluessels und blendet `paid_only` aus, solange kein bezahltes
 * Guthaben da ist.
 *
 * Ein Vereinigen beider Sichten ist deshalb die falsche Antwort fuer eine
 * Auswahlliste: sie zeigt dann 82 Modelle, von denen der Betreiber-Schluessel
 * live (2026-09-10) genau 5 bedienen darf. Der Nutzer waehlt ein Modell, das
 * nicht in seiner Freigabe steht, und bekommt vom Anbieter ein 403
 * ("Model 'flux' is not allowed for this API key") — ein Fehler, der wie ein
 * Defekt der App aussieht, aber keiner ist.
 *
 * Ohne Schluessel bleibt nur der oeffentliche Katalog; dann ist er die Antwort.
 */
export async function listAvailableImageModels(apiKey?: string): Promise<AvailableImageModelsListing> {
  const antwort = await fetchImageModelsRaw(apiKey);
  if (antwort.failure || antwort.status < 200 || antwort.status >= 300) {
    return { models: [], runnable: new Set<string>(), failure: antwort.failure ?? 'upstream' };
  }
  const models = parseModels(antwort.body);
  if (models.length === 0) return { models, runnable: new Set<string>(), failure: 'empty' };
  return { models, runnable: runnableModelNames(models, !!apiKey) };
}

/**
 * Alle Namen und Aliase einer Antwort als Freigabe-Set.
 *
 * Ohne Schluessel ist die Antwort der oeffentliche Katalog. Dann zaehlen nur die
 * nicht kostenpflichtigen Eintraege als nutzbar: `paid_only` verlangt laut
 * Anbieter ein zahlendes Konto, ein Aufruf ohne Schluessel bekaeme dort ein 402.
 * Alles als "laeuft" zu markieren waere die alte Luege in neuer Form.
 */
function runnableModelNames(models: readonly PollinationsLiveModel[], mitSchluessel: boolean): Set<string> {
  const namen = new Set<string>();
  for (const model of models) {
    if (!mitSchluessel && model.paid_only === true) continue;
    for (const name of [model.name, ...(model.aliases ?? [])]) {
      if (name) namen.add(name.toLowerCase());
    }
  }
  return namen;
}

/** Steht dieses Modell — ueber Name oder Alias — in der Freigabe des Schluessels? */
export function modelIsRunnable(model: PollinationsLiveModel, runnable: ReadonlySet<string>): boolean {
  return [model.name, ...(model.aliases ?? [])].some((name) => !!name && runnable.has(name.toLowerCase()));
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
    // Beide Sichten: die Metadaten eines Modells haengen nicht an der
    // Berechtigung des Fragenden.
    const { models } = await listLiveImageModels(apiKey);
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
