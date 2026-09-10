import { ApiError } from '@/lib/api-error-handler';
import { isBudgetExhaustedError } from '@/lib/pollen-cost-guard';
import { isContentRejection } from '@/lib/errors/upstream-rejection';
import {
  validateRemoteMediaFetchUrl,
  validateRemoteMediaUrl,
} from '@/lib/media/remote-fetch-policy';
import { MEDIA_UPLOAD_URL, MAX_UPLOAD_BYTES, SMALL_BLOB_SKIP_BYTES } from '@/lib/upload/constants';

const MIN_BYTES = SMALL_BLOB_SKIP_BYTES;
const MAX_REDIRECTS = 5;
/**
 * Ein Bild mit Referenz (Edit-Modell) braucht bei Pollinations regelmaessig
 * ueber eine Minute. Die alten 60s rissen Laeufe ab, die kurz danach fertig
 * waren, und der Nutzer sah nur "Timed out waiting for media".
 */
const IMAGE_POLL_TIMEOUT_MS = 120_000;
const VIDEO_POLL_TIMEOUT_MS = 180_000;
/** Zweimal derselbe Fehlschlag ist kein Zwischenstand mehr, sondern ein Fehler. */
const FAST_FAIL_REPEATS = 2;
/** Grenzen fuer den Body-Auszug in der Fehlermeldung. */
const SNAPSHOT_MAX_BYTES = 4096;
const SNAPSHOT_MAX_CHARS = 160;

export interface FetchAndStoreRemoteMediaOptions {
  sourceUrl: string;
  apiKey?: string;
  kind?: 'image' | 'video';
  signal?: AbortSignal;
  /**
   * Darf der Server-Schluessel einmal weggelassen werden, wenn er kein Budget
   * hat? Der Aufrufer setzt das, wenn der Schluessel nicht vom Nutzer kam.
   * Live belegt am 2026-09-10: mit leerem Betreiber-Schluessel antwortet
   * Pollinations auf jede Medien-URL mit 402, ohne ihn liefert dasselbe freie
   * Modell ein image/jpeg. Bis dahin lief die Abfrage 120 s in den Timeout,
   * statt den einen Versuch ohne Schluessel zu machen.
   */
  fallbackToAnonymous?: boolean;
  /**
   * Anzeigename des Modells, das die Quelle erzeugt. Ein abgelehnter Prompt
   * ist ein Satz ueber genau dieses Modell — ohne Namen liest der Nutzer nur
   * "Der Anbieter" und weiss nicht, welches der 82 Modelle gemeint ist.
   */
  modelLabel?: string;
}

function abortError(): ApiError {
  return new ApiError(499, 'Media ingest aborted by client');
}

/**
 * Was ein Poll-Durchlauf tatsaechlich geliefert hat. Die Schleife verwarf diese
 * Angaben frueher komplett: nach 62s Wartezeit stand im Log und in der Antwort
 * nur "Timed out waiting for media" — ohne Status, Content-Type oder Hinweis,
 * ob das Gateway HTML, ein 404 oder schlicht Nullen geschickt hat.
 */
interface MediaPollObservation {
  status: number;
  contentType: string | null;
  bytes: number;
  snippet: string | null;
}

function isTextualContentType(contentType: string | null): boolean {
  return !!contentType && /^(text\/|application\/(json|xml|javascript))/.test(contentType);
}

function bodySnippet(body: Buffer, contentType: string | null): string | null {
  if (body.byteLength === 0 || body.byteLength > SNAPSHOT_MAX_BYTES) return null;
  if (!isTextualContentType(contentType)) return null;
  const text = body.toString('utf8').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, SNAPSHOT_MAX_CHARS) : null;
}

function describePollObservation(observation: MediaPollObservation): string {
  const parts = [`status ${observation.status}`];
  if (observation.contentType) parts.push(`content-type ${observation.contentType}`);
  parts.push(`${observation.bytes} bytes`);
  if (observation.snippet) parts.push(`body: ${observation.snippet}`);
  return parts.join(', ');
}

export interface StoredRemoteMedia {
  key: string;
  url: string;
  contentType: string;
}

function fallbackContentType(kind?: 'image' | 'video') {
  return kind === 'video' ? 'video/mp4' : 'image/jpeg';
}

/**
 * Fetch a URL without auto-following redirects. Every redirect target is
 * validated with the SSRF safety validator before it is fetched. The
 * Authorization header is only forwarded to URLs that pass the Pollinations
 * allowlist, so API keys are never leaked to arbitrary redirect targets.
 */
async function fetchWithSafeRedirects(
  url: string,
  apiKey: string | undefined,
  signal: AbortSignal | undefined,
  maxRedirects: number = MAX_REDIRECTS,
): Promise<Response> {
  let currentUrl = url;

  for (let redirects = 0; redirects <= maxRedirects; redirects++) {
    const allowAuth = validateRemoteMediaUrl(currentUrl).allowed;
    const response = await fetch(currentUrl, {
      redirect: 'manual',
      signal,
      headers: {
        ...(allowAuth && apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        throw new ApiError(502, 'Redirect response missing Location header');
      }

      const resolvedUrl = new URL(location, currentUrl).href;
      const policy = validateRemoteMediaFetchUrl(resolvedUrl);
      if (!policy.allowed) {
        throw new ApiError(
          400,
          `Blocked unsafe redirect target for media ingest: ${policy.reason || 'unsafe-host'}`,
        );
      }

      currentUrl = resolvedUrl;
      continue;
    }

    return response;
  }

  throw new ApiError(400, 'Too many redirects while fetching media');
}

/**
 * Server-side media ingest: fetches a remote media URL (authenticating via
 * Authorization header so the API key never appears in any URL) and uploads
 * the result to Pollinations Media Storage. Returns the permanent media URL.
 */
export async function fetchAndStoreRemoteMedia(
  options: FetchAndStoreRemoteMediaOptions,
): Promise<StoredRemoteMedia> {
  const { sourceUrl, apiKey, kind, signal, fallbackToAnonymous, modelLabel } = options;
  /**
   * Der Schluessel, mit dem tatsaechlich abgerufen wird. Er wird genau einmal
   * fallen gelassen, wenn der Server-Schluessel kein Budget mehr hat.
   */
  let abrufKey = apiKey;

  if (signal?.aborted) {
    throw abortError();
  }

  const urlPolicy = validateRemoteMediaUrl(sourceUrl);
  if (!urlPolicy.allowed) {
    throw new ApiError(
      400,
      `Source URL is not allowed for media ingest: ${urlPolicy.reason || 'unsafe-host'}`,
    );
  }

  const startTime = Date.now();
  const sourceHost = new URL(sourceUrl).host;
  const pollTimeout = kind === 'video' ? VIDEO_POLL_TIMEOUT_MS : IMAGE_POLL_TIMEOUT_MS;
  const pollDelay = kind === 'video' ? 4000 : 2000;

  let buffer: Buffer | null = null;
  let contentType: string | null = null;
  let lastObservation: MediaPollObservation | null = null;
  let lastObservationKey: string | null = null;
  let repeated = 0;

  try {
    while (Date.now() - startTime < pollTimeout) {
      if (signal?.aborted) throw abortError();
      const response = await fetchWithSafeRedirects(sourceUrl, abrufKey, signal);
      const responseContentType = response.headers.get('content-type');
      const contentLength = Number(response.headers.get('content-length'));
      if (response.ok && Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
        throw new ApiError(413, 'Generated media exceeds Pollinations Media Storage limit (max 10MB)');
      }

      const body = Buffer.from(await response.arrayBuffer());
      if (response.ok && body.byteLength > MIN_BYTES) {
        buffer = body;
        contentType = responseContentType;
        break;
      }

      if (fallbackToAnonymous && abrufKey && isBudgetExhaustedError(response.status, body.toString('utf8'))) {
        console.warn(
          `[media-ingest] Server-Schluessel ohne Budget (${response.status}) — neuer Abruf ohne Schluessel`,
        );
        abrufKey = undefined;
        continue;
      }

      const observation: MediaPollObservation = {
        status: response.status,
        contentType: responseContentType,
        bytes: body.byteLength,
        snippet: bodySnippet(body, responseContentType),
      };
      const observationKey = `${observation.status}|${observation.contentType}`;
      repeated = observationKey === lastObservationKey ? repeated + 1 : 1;
      lastObservationKey = observationKey;
      lastObservation = observation;

      // Ein wiederholtes 4xx/5xx kommt nicht mehr: die Quelle verwirft das
      // Ergebnis. Weiterzupollen kostet nur das restliche Zeitfenster, also
      // lieber in Sekunden den echten Grund melden als nach zwei Minuten ein
      // nacktes "Timed out".
      if (observation.status >= 400 && repeated >= FAST_FAIL_REPEATS) {
        console.warn(
          `[media-ingest] ${sourceHost} liefert wiederholt ${observation.status}: ${describePollObservation(observation)}`,
        );
        // Ein abgelehnter Inhalt ist kein Ausfall. Live belegt am 2026-09-10:
        // gpt-image antwortet 400 "rejected by the safety system", der Nutzer
        // las aber "Der Anbieter antwortet gerade nicht ... in ein paar Minuten
        // erneut versuchen" und haette denselben Prompt endlos wiederholt.
        const inhaltAbgelehnt = isContentRejection(observation.status, observation.snippet ?? '');
        throw new ApiError(
          inhaltAbgelehnt ? 400 : 502,
          `Media source ${sourceHost} rejected the result: ${describePollObservation(observation)}`,
          // Der Client uebersetzt nur unsere Codes in einen Satz; ohne Code
          // laese der Nutzer den englischen Rohtext mit Body-Auszug.
          inhaltAbgelehnt ? 'CONTENT_REJECTED' : 'PROVIDER_UNAVAILABLE',
          inhaltAbgelehnt && modelLabel ? { modelLabel } : undefined,
        );
      }

      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, pollDelay);
        signal?.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(abortError());
        }, { once: true });
      });
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw abortError();
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw abortError();
    }
    throw error;
  }

  if (!buffer) {
    const seconds = Math.round(pollTimeout / 1000);
    const detail = lastObservation
      ? `last response: ${describePollObservation(lastObservation)}`
      : 'no response received';
    console.warn(
      `[media-ingest] Zeitueberschreitung nach ${seconds}s fuer ${sourceHost} (${kind ?? 'image'}): ${detail}`,
    );
    throw new ApiError(
      504,
      `Timed out waiting for ${kind ?? 'image'} from ${sourceHost} after ${seconds}s (${detail})`,
      'PROVIDER_UNAVAILABLE',
    );
  }

  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new ApiError(413, 'Generated media exceeds Pollinations Media Storage limit (max 10MB)');
  }

  if (signal?.aborted) throw abortError();

  const normalizedContentType = contentType || fallbackContentType(kind);
  // Pollinations Media Storage only accepts multipart/form-data (field `file`) or
  // JSON base64 — a raw binary body is rejected with "Unsupported content type",
  // which breaks reference-image editing and video result storage.
  const uploadForm = new FormData();
  const uploadFileName = kind === 'video' ? `media-${Date.now()}.mp4` : `media-${Date.now()}.jpg`;
  uploadForm.append('file', new Blob([buffer], { type: normalizedContentType }), uploadFileName);
  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(MEDIA_UPLOAD_URL, {
      method: 'POST',
      signal,
      // Content-Type is intentionally omitted: fetch sets the multipart boundary.
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: uploadForm,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw abortError();
    }
    throw error;
  }

  const rawBody = await uploadResponse.text();
  let uploadData: any = null;
  try {
    uploadData = JSON.parse(rawBody);
  } catch {
    uploadData = { error: rawBody || 'Upstream media ingest failed' };
  }

  if (!uploadResponse.ok) {
    console.error('[media-ingest] Upstream error:', uploadResponse.status, rawBody);
    throw new ApiError(uploadResponse.status, `Upstream media ingest failed (${uploadResponse.status})`);
  }

  return {
    key: uploadData.id,
    url: uploadData.url,
    contentType: uploadData.contentType || normalizedContentType,
  };
}
