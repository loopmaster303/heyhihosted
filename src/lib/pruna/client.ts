/**
 * Pruna AI API Client
 *
 * Server-side client for the Pruna AI prediction API.
 * - Sync mode (Try-Sync: true) for fast image models (<60s)
 * - Anything not finished at that point returns a prediction id; the browser
 *   polls `/api/pruna/status` until it is done. Nichts wartet mehr im Request:
 *   VACE braucht 6-12 Minuten und sprengt jedes Function-Timeout.
 *
 * Auth: `apikey` header from PRUNA_API_KEY env var.
 */

import { getPrunaModelMapping, getPrunaModelName, type PrunaFieldInput } from '@/config/pruna-models';
import { ApiError } from '@/lib/api-error-handler';
import { validateRemoteMediaFetchUrl } from '@/lib/media/remote-fetch-policy';

const MAX_PRUNA_DOWNLOAD_REDIRECTS = 5;

const PRUNA_BASE_URL = 'https://api.pruna.ai/v1';

export interface PrunaPredictionResult {
  generationUrl: string;
  contentType: string;
}

/** Der Lauf steht noch aus — der Browser fragt ihn ueber seine id weiter ab. */
export interface PrunaPendingPrediction {
  predictionId: string;
}

export type PrunaDispatchResult = PrunaPredictionResult | PrunaPendingPrediction;

export function isPendingPrediction(result: PrunaDispatchResult): result is PrunaPendingPrediction {
  return 'predictionId' in result;
}

/** Pruna-Ids sind undurchsichtige Tokens; alles andere gehoert nicht in eine URL. */
const PREDICTION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export async function generateViaPruna(
  modelId: string,
  fields: PrunaFieldInput,
  signal?: AbortSignal,
  requestApiKey?: string,
): Promise<PrunaDispatchResult> {
  const apiKey = requestApiKey ?? process.env.PRUNA_API_KEY;
  if (!apiKey) {
    throw new ApiError(503, 'PRUNA_API_KEY is not set', 'MISSING_PRUNA_KEY', { modelLabel: modelId });
  }

  const mapping = getPrunaModelMapping(modelId);
  if (!mapping) {
    throw new ApiError(400, `Unknown Pruna model: ${modelId}`, 'UNKNOWN_PRUNA_MODEL');
  }

  const prunaModel = getPrunaModelName(modelId, fields) ?? mapping.prunaModel;
  const input = mapping.buildInput(fields);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: apiKey,
    Model: prunaModel,
  };

  if (mapping.mode === 'sync') {
    headers['Try-Sync'] = 'true';
  }

  let submitResponse: Response;
  try {
    submitResponse = await fetch(`${PRUNA_BASE_URL}/predictions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ input }),
      signal,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (signal?.aborted) {
      throw new ApiError(499, 'Pruna prediction aborted', 'PRUNA_ABORTED');
    }
    throw new ApiError(
      502,
      `Unable to reach Pruna API while submitting ${modelId}`,
      'PRUNA_NETWORK_ERROR',
    );
  }

  if (!submitResponse.ok) {
    const errorText = await submitResponse.text().catch(() => 'Unknown error');
    // Der Feldname ist die einzige verwertbare Information in einer Pruna-400:
    // "property input validation failed: additional properties forbidden, found <feld>"
    const field = /additional properties forbidden, found ([A-Za-z0-9_.-]+)/.exec(errorText)?.[1];
    throw new ApiError(
      submitResponse.status >= 500 ? 502 : 400,
      `Pruna API error (${submitResponse.status}): ${errorText}`,
      'PRUNA_API_ERROR',
      field ? { field } : undefined
    );
  }

  const prediction = await submitResponse.json();

  const syncGenerationUrl = normalizeGenerationUrl(prediction.generation_url);
  if (mapping.mode === 'sync' && prediction.status === 'succeeded' && syncGenerationUrl) {
    return {
      generationUrl: syncGenerationUrl,
      contentType: inferContentType(syncGenerationUrl, mapping.isVideo),
    };
  }

  if (prediction.status === 'failed') {
    throw new ApiError(
      502,
      `Pruna prediction failed: ${prediction.error ?? prediction.message ?? 'Unknown error'}`,
      'PRUNA_PREDICTION_FAILED'
    );
  }

  const predictionId = predictionIdFrom(prediction);
  if (!predictionId) {
    throw new ApiError(502, 'Pruna API returned no prediction ID or status URL', 'PRUNA_MISSING_STATUS');
  }

  return { predictionId };
}

/**
 * Eine einzelne Statusabfrage. Der Aufrufer (die Status-Route) wiederholt sie,
 * damit kein Request auf ein Video wartet, das Minuten braucht.
 */
export async function fetchPrunaPredictionStatus(
  modelId: string,
  predictionId: string,
  requestApiKey?: string,
  signal?: AbortSignal,
): Promise<PrunaPredictionResult | 'pending'> {
  const apiKey = requestApiKey ?? process.env.PRUNA_API_KEY;
  if (!apiKey) {
    throw new ApiError(503, 'PRUNA_API_KEY is not set', 'MISSING_PRUNA_KEY', { modelLabel: modelId });
  }

  const mapping = getPrunaModelMapping(modelId);
  if (!mapping) {
    throw new ApiError(400, `Unknown Pruna model: ${modelId}`, 'UNKNOWN_PRUNA_MODEL');
  }

  if (!PREDICTION_ID_PATTERN.test(predictionId)) {
    throw new ApiError(400, 'Invalid Pruna prediction id', 'PRUNA_INVALID_ID');
  }

  let response: Response;
  try {
    response = await fetch(`${PRUNA_BASE_URL}/predictions/status/${predictionId}`, {
      headers: { apikey: apiKey },
      signal,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (signal?.aborted) {
      throw new ApiError(499, 'Pruna prediction aborted', 'PRUNA_ABORTED');
    }
    throw new ApiError(502, 'Unable to reach Pruna API while polling', 'PRUNA_NETWORK_ERROR');
  }

  if (!response.ok) {
    throw new ApiError(502, `Pruna status check failed (${response.status})`, 'PRUNA_STATUS_ERROR');
  }

  const status: PrunaPredictionStatus = await response.json();
  const generationUrl = normalizeGenerationUrl(status.generation_url);

  if (status.status === 'failed') {
    throw new ApiError(
      502,
      `Pruna prediction failed: ${status.error ?? status.message ?? 'Unknown error'}`,
      'PRUNA_PREDICTION_FAILED',
    );
  }

  if (status.status === 'succeeded') {
    if (!generationUrl) {
      throw new ApiError(
        502,
        'Pruna prediction succeeded but returned no generation URL',
        'PRUNA_MISSING_STATUS',
      );
    }
    return { generationUrl, contentType: inferContentType(generationUrl, mapping.isVideo) };
  }

  return 'pending';
}

/** Pruna liefert mal `id`, mal nur `get_url` — beides fuehrt auf dieselbe Id. */
function predictionIdFrom(prediction: { id?: unknown; get_url?: unknown }): string | undefined {
  if (typeof prediction.id === 'string' && PREDICTION_ID_PATTERN.test(prediction.id)) {
    return prediction.id;
  }
  if (typeof prediction.get_url === 'string') {
    const last = prediction.get_url.split('?')[0].split('/').filter(Boolean).pop();
    if (last && PREDICTION_ID_PATTERN.test(last)) return last;
  }
  return undefined;
}

export async function downloadPrunaResult(
  generationUrl: string,
  apiKey?: string,
  signal?: AbortSignal,
): Promise<{ buffer: Buffer; contentType: string }> {
  // The generation URL comes from Pruna's API response; validate it and every
  // redirect target so a poisoned/misconfigured URL cannot turn the apikey-bearing
  // download into an SSRF against internal hosts.
  const initialPolicy = validateRemoteMediaFetchUrl(generationUrl);
  if (!initialPolicy.allowed) {
    throw new ApiError(
      400,
      `Pruna generation URL is not allowed: ${initialPolicy.reason || 'unsafe-host'}`,
      'PRUNA_UNSAFE_URL',
    );
  }

  let currentUrl = generationUrl;
  let response: Response | null = null;

  for (let redirects = 0; redirects <= MAX_PRUNA_DOWNLOAD_REDIRECTS; redirects++) {
    // apikey is only sent to the validated Pruna host, never to a redirect target.
    const headers: Record<string, string> = {};
    if (apiKey && redirects === 0) headers.apikey = apiKey;

    const hop = await fetch(currentUrl, { headers, signal, redirect: 'manual' });

    if (hop.status >= 300 && hop.status < 400) {
      const location = hop.headers.get('location');
      if (!location) {
        throw new ApiError(502, 'Pruna download redirect missing Location header', 'PRUNA_DOWNLOAD_ERROR');
      }
      const resolvedUrl = new URL(location, currentUrl).href;
      const policy = validateRemoteMediaFetchUrl(resolvedUrl);
      if (!policy.allowed) {
        throw new ApiError(
          400,
          `Blocked unsafe Pruna download redirect: ${policy.reason || 'unsafe-host'}`,
          'PRUNA_UNSAFE_REDIRECT',
        );
      }
      currentUrl = resolvedUrl;
      continue;
    }

    response = hop;
    break;
  }

  if (!response) {
    throw new ApiError(502, 'Too many redirects while downloading Pruna result', 'PRUNA_DOWNLOAD_ERROR');
  }
  if (!response.ok) {
    throw new ApiError(502, `Failed to download Pruna result (${response.status})`, 'PRUNA_DOWNLOAD_ERROR');
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'application/octet-stream';

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
  };
}

export async function uploadPrunaFile(
  file: Blob | Buffer,
  filename: string,
  requestApiKey?: string,
): Promise<string> {
  const apiKey = requestApiKey ?? process.env.PRUNA_API_KEY;
  if (!apiKey) {
    throw new ApiError(503, 'PRUNA_API_KEY is not set', 'MISSING_PRUNA_KEY');
  }

  const formData = new FormData();
  const blob = file instanceof Blob ? file : new Blob([file]);
  formData.append('content', blob, filename);

  const response = await fetch(`${PRUNA_BASE_URL}/files`, {
    method: 'POST',
    headers: { apikey: apiKey },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new ApiError(
      response.status >= 500 ? 502 : 400,
      `Pruna file upload failed (${response.status}): ${errorText}`,
      'PRUNA_UPLOAD_ERROR'
    );
  }

  const data = await response.json();
  const url = data.urls?.get;
  if (typeof url !== 'string' || !url.trim()) {
    throw new ApiError(
      502,
      'Pruna file upload succeeded but returned no valid URL',
      'PRUNA_UPLOAD_MISSING_URL'
    );
  }
  return url;
}

interface PrunaPredictionStatus {
  status: 'starting' | 'processing' | 'succeeded' | 'failed';
  generation_url?: string | string[];
  message?: string;
  error?: string;
}

function inferContentType(url: string, isVideo: boolean): string {
  const lower = url.toLowerCase();
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return isVideo ? 'video/mp4' : 'image/jpeg';
}

function normalizeGenerationUrl(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.find((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  return undefined;
}
