/**
 * Pruna AI API Client
 *
 * Server-side client for the Pruna AI prediction API.
 * - Sync mode (Try-Sync: true) for fast image models (<60s)
 * - Async mode (submit + poll) for video models
 * - VACE uses api.sharedservices.pruna.ai
 *
 * Auth: `apikey` header from PRUNA_API_KEY env var.
 */

import { getPrunaModelMapping, getPrunaModelName, type PrunaFieldInput } from '@/config/pruna-models';
import { ApiError } from '@/lib/api-error-handler';

const PRUNA_BASE_URL = 'https://api.pruna.ai/v1';
const PRUNA_SHARED_BASE_URL = 'https://api.sharedservices.pruna.ai/v1';

const ASYNC_POLL_MAX_MS = 180_000;
const ASYNC_POLL_INTERVAL_MS = 2_000;

export interface PrunaPredictionResult {
  generationUrl: string;
  contentType: string;
}

export async function generateViaPruna(
  modelId: string,
  fields: PrunaFieldInput,
  signal?: AbortSignal,
): Promise<PrunaPredictionResult> {
  const apiKey = process.env.PRUNA_API_KEY;
  if (!apiKey) {
    throw new ApiError(503, 'PRUNA_API_KEY is not set', 'MISSING_PRUNA_KEY');
  }

  const mapping = getPrunaModelMapping(modelId);
  if (!mapping) {
    throw new ApiError(400, `Unknown Pruna model: ${modelId}`, 'UNKNOWN_PRUNA_MODEL');
  }

  const prunaModel = getPrunaModelName(modelId, fields) ?? mapping.prunaModel;
  const input = mapping.buildInput(fields);
  const baseUrl = mapping.endpoint === 'shared' ? PRUNA_SHARED_BASE_URL : PRUNA_BASE_URL;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: apiKey,
    Model: prunaModel,
  };

  if (mapping.mode === 'sync') {
    headers['Try-Sync'] = 'true';
  }

  const submitResponse = await fetch(`${baseUrl}/predictions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ input }),
    signal,
  });

  if (!submitResponse.ok) {
    const errorText = await submitResponse.text().catch(() => 'Unknown error');
    throw new ApiError(
      submitResponse.status >= 500 ? 502 : 400,
      `Pruna API error (${submitResponse.status}): ${errorText}`,
      'PRUNA_API_ERROR'
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

  if (!prediction.get_url && !prediction.id) {
    throw new ApiError(502, 'Pruna API returned no prediction ID or status URL', 'PRUNA_MISSING_STATUS');
  }

  const statusUrl = prediction.get_url ?? `${baseUrl}/predictions/status/${prediction.id}`;
  const result = await pollPrediction(statusUrl, apiKey, signal);

  return {
    generationUrl: result.generation_url,
    contentType: inferContentType(result.generation_url, mapping.isVideo),
  };
}

export async function downloadPrunaResult(
  generationUrl: string,
  apiKey?: string,
  signal?: AbortSignal,
): Promise<{ buffer: Buffer; contentType: string }> {
  const headers: Record<string, string> = {};
  if (apiKey) headers.apikey = apiKey;

  const response = await fetch(generationUrl, { headers, signal });
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
): Promise<string> {
  const apiKey = process.env.PRUNA_API_KEY;
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

async function pollPrediction(
  statusUrl: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<{ generation_url: string }> {
  const startTime = Date.now();
  let consecutiveErrors = 0;
  const MAX_RETRIES = 3;

  while (Date.now() - startTime < ASYNC_POLL_MAX_MS) {
    if (signal?.aborted) {
      throw new ApiError(499, 'Pruna prediction aborted', 'PRUNA_ABORTED');
    }

    try {
      const response = await fetch(statusUrl, {
        headers: { apikey: apiKey },
        signal,
      });

      if (!response.ok) {
        const isTransient = response.status >= 502 && response.status <= 504;
        if (isTransient && consecutiveErrors < MAX_RETRIES) {
          consecutiveErrors++;
          const backoff = ASYNC_POLL_INTERVAL_MS * consecutiveErrors;
          await sleep(backoff);
          continue;
        }
        throw new ApiError(502, `Pruna status check failed (${response.status})`, 'PRUNA_STATUS_ERROR');
      }

      consecutiveErrors = 0;
      const status: PrunaPredictionStatus = await response.json();

      const generationUrl = normalizeGenerationUrl(status.generation_url);
      if (status.status === 'succeeded' && generationUrl) {
        return { generation_url: generationUrl };
      }

      if (status.status === 'succeeded' && !generationUrl) {
        throw new ApiError(
          502,
          'Pruna prediction succeeded but returned no generation URL',
          'PRUNA_MISSING_STATUS'
        );
      }

      if (status.status === 'failed') {
        throw new ApiError(502, `Pruna prediction failed: ${status.error ?? status.message ?? 'Unknown error'}`, 'PRUNA_PREDICTION_FAILED');
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (signal?.aborted) {
        throw new ApiError(499, 'Pruna prediction aborted', 'PRUNA_ABORTED');
      }
      throw new ApiError(502, `Pruna status check error: ${err instanceof Error ? err.message : 'Unknown'}`, 'PRUNA_STATUS_ERROR');
    }

    await sleep(ASYNC_POLL_INTERVAL_MS);
  }

  throw new ApiError(504, `Pruna prediction timed out after ${ASYNC_POLL_MAX_MS / 1000}s`, 'PRUNA_TIMEOUT');
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
