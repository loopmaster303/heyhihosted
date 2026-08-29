/**
 * Ein Generierungslauf aus Sicht des Browsers.
 *
 * `/api/generate` antwortet auf lange Pruna-Laeufe sofort mit 202 und einer
 * Lauf-Id, statt auf das Ergebnis zu warten — VACE braucht 6 bis 12 Minuten und
 * sprengt damit jedes Function-Timeout. Das Warten passiert hier, im Tab des
 * Nutzers. Der Aufrufer sieht am Ende dieselbe `Response`, die er frueher
 * direkt von `/api/generate` bekommen haette.
 *
 * Laufstabilitaet (L3): Mit `context` schreibt ein 202 einen Eintrag in den
 * run-store (localStorage), damit ein Reload den Lauf wiederaufnehmen kann.
 * Ergebnis, Fehler und Abbruch loeschen den Eintrag — nur ein Reload laesst
 * ihn liegen, und genau dafuer ist er da.
 */

import { removeStoredRun, saveStoredRun, type StoredRun } from './run-store';

const POLL_INTERVAL_MS = 3_000;
/** Reissleine: der langsamste gemessene VACE-Lauf lag bei rund 12 Minuten. */
const POLL_MAX_MS = 30 * 60 * 1000;

interface PendingDispatch {
  pending?: boolean;
  predictionId?: string;
  model?: string;
}

export interface RunContext {
  runId: string;
  prompt: string;
  params: Record<string, string | number | boolean>;
  isVideo: boolean;
  aspectRatio?: string;
}

export interface GenerationOptions {
  headers: Record<string, string>;
  signal?: AbortSignal;
  /** Setzt der Playground: erst damit ueberlebt der Lauf einen Reload. */
  context?: RunContext;
}

export async function requestGeneration(
  body: unknown,
  options: GenerationOptions,
): Promise<Response> {
  const { headers, signal, context } = options;

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (response.status !== 202) return response;

  const dispatch = (await response.json()) as PendingDispatch;
  if (!dispatch.predictionId || !dispatch.model) {
    throw new Error('generate response missing predictionId/model');
  }

  if (context) {
    const stored: StoredRun = {
      runId: context.runId,
      predictionId: dispatch.predictionId,
      model: dispatch.model,
      prompt: context.prompt,
      params: context.params,
      isVideo: context.isVideo,
      aspectRatio: context.aspectRatio,
      startedAt: Date.now(),
      body,
    };
    saveStoredRun(stored);
  }

  try {
    return await pollPrediction(dispatch.predictionId, dispatch.model, { headers, signal });
  } finally {
    // Ergebnis, Fehler oder Abbruch — in allen drei Faellen ist der Eintrag
    // sein Geld nicht mehr wert. Nur der Reload hat ihn ueberlebt.
    if (context) removeStoredRun(context.runId);
  }
}

/**
 * Eine einzelne Statusabfrage-Runde, bis der Lauf endet. Von requestGeneration
 * im Polling genutzt — und vom PlaygroundShell-Mount, um einen nach einem
 * Reload wiederaufgenommenen Lauf weiterzufragen, OHNE ihn neu zu dispatchen.
 */
export async function pollPrediction(
  predictionId: string,
  model: string,
  { headers, signal }: { headers: Record<string, string>; signal?: AbortSignal },
): Promise<Response> {
  const statusUrl = `/api/pruna/status?id=${encodeURIComponent(predictionId)}`
    + `&model=${encodeURIComponent(model)}`;
  // Nur die Key-Header wandern mit; Content-Type gehoert nicht an ein GET.
  const pollHeaders = Object.fromEntries(
    Object.entries(headers).filter(([name]) => name.toLowerCase() !== 'content-type'),
  );

  const deadline = Date.now() + POLL_MAX_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS, signal);
    const polled = await fetch(statusUrl, { headers: pollHeaders, signal });
    if (polled.status !== 202) return polled;
  }

  // Tabelle Zeile 14: der Abbruch wird benannt, nicht beschoenigt — der Lauf
  // kann bei Pruna weiterlaufen und trotzdem abgerechnet werden.
  throw new Error(
    'Der Lauf läuft seit 30 Minuten ohne Ergebnis und wurde hier aufgegeben. '
    + 'Bei Pruna kann er weiterlaufen und trotzdem abgerechnet werden.',
  );
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
