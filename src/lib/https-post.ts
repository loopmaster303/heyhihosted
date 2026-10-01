/**
 * Ausgehende Server-Requests an Pollinations und Co.
 *
 * Bis 2026-10-01 startete jeder Aufruf einen eigenen Node-Kindprozess
 * (`public/scripts/auth-proxy.js`), weil Next 16 beim `fetch` Header entfernt
 * haben sollte. Am 2026-10-01 unter Next 16.3 geprueft, im Dev-Server und im
 * Produktions-Build: eine Route schickt per `fetch` `Authorization` und
 * `X-Pollen-Key` an einen Echo-Server — beide kommen unveraendert an. Bild
 * (`pollinations-image-v1.ts`) und Stimme (`tts-flow.ts`) liefen ohnehin schon
 * mit `fetch` gegen denselben Host. Der Kindprozess kostete einen Prozessstart
 * pro Chat-Nachricht und deckelte jeden Aufruf hart auf 30 s — daran scheiterte
 * Musik von Pollinations, die laenger rechnet.
 *
 * Die Exportnamen bleiben, damit die Aufrufer unveraendert bleiben. Jeder
 * Aufrufer kann sein eigenes Zeitlimit setzen.
 */

/** Wie lange ein gewoehnlicher Aufruf warten darf. */
export const DEFAULT_TIMEOUT_MS = 30_000;

/** Musik rechnet Minuten; Vercel erlaubt der Funktion 300 s (vercel.json). */
export const LONG_RUNNING_TIMEOUT_MS = 290_000;

function timeoutError(ms: number): Error {
  return new Error(`Upstream request timed out after ${ms}ms`);
}

async function request(
  method: 'GET' | 'POST',
  url: string,
  headers: Record<string, string>,
  body: string | undefined,
  timeoutMs: number,
): Promise<Response> {
  try {
    return await fetch(url, {
      method,
      headers,
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw timeoutError(timeoutMs);
    }
    throw error;
  }
}

export async function httpsPost(
  url: string,
  headers: Record<string, string>,
  body: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<{ status: number; body: string }> {
  const res = await request('POST', url, headers, body, timeoutMs);
  return { status: res.status, body: await res.text() };
}

export async function httpsGet(
  url: string,
  headers: Record<string, string> = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<{ status: number; body: string }> {
  const res = await request('GET', url, headers, undefined, timeoutMs);
  return { status: res.status, body: await res.text() };
}

export async function httpsFetchBinary(
  url: string,
  headers: Record<string, string> = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<{ status: number; buffer: Buffer; contentType: string }> {
  const res = await request('GET', url, headers, undefined, timeoutMs);
  const buffer = Buffer.from(await res.arrayBuffer());
  return { status: res.status, buffer, contentType: res.headers.get('content-type') || 'application/octet-stream' };
}

/**
 * Streamender POST. Das Zeitlimit gilt bis zum Eintreffen der Antwort-Header —
 * danach fliesst der Body so lange, wie die Funktion lebt.
 */
export async function httpsPostStream(
  url: string,
  headers: Record<string, string>,
  body: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<{ status: number; headers: Record<string, string>; stream: ReadableStream<Uint8Array> }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', headers, body, cache: 'no-store', signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) throw timeoutError(timeoutMs);
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const responseHeaders: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });
  const stream = res.body ?? new ReadableStream<Uint8Array>({ start: (c) => c.close() });
  return { status: res.status, headers: responseHeaders, stream };
}
