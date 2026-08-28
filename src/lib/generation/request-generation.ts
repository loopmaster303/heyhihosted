/**
 * Ein Generierungslauf aus Sicht des Browsers.
 *
 * `/api/generate` antwortet auf lange Pruna-Laeufe sofort mit 202 und einer
 * Lauf-Id, statt auf das Ergebnis zu warten — VACE braucht 6 bis 12 Minuten und
 * sprengt damit jedes Function-Timeout. Das Warten passiert hier, im Tab des
 * Nutzers. Der Aufrufer sieht am Ende dieselbe `Response`, die er frueher
 * direkt von `/api/generate` bekommen haette.
 */

const POLL_INTERVAL_MS = 3_000;
/** Reissleine: der langsamste gemessene VACE-Lauf lag bei rund 12 Minuten. */
const POLL_MAX_MS = 30 * 60 * 1000;

interface PendingDispatch {
  pending?: boolean;
  predictionId?: string;
  model?: string;
}

export async function requestGeneration(
  body: unknown,
  options: { headers: Record<string, string>; signal?: AbortSignal },
): Promise<Response> {
  const { headers, signal } = options;

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

  const statusUrl = `/api/pruna/status?id=${encodeURIComponent(dispatch.predictionId)}`
    + `&model=${encodeURIComponent(dispatch.model)}`;
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

  throw new Error(`Generierung nach ${POLL_MAX_MS / 60_000} Minuten abgebrochen`);
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
