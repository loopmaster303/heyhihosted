import { ApiError } from '@/lib/api-error-handler';
import {
  validateRemoteMediaFetchUrl,
  validateRemoteMediaUrl,
} from '@/lib/media/remote-fetch-policy';
import { MEDIA_UPLOAD_URL, MAX_UPLOAD_BYTES, SMALL_BLOB_SKIP_BYTES } from '@/lib/upload/constants';

const MIN_BYTES = SMALL_BLOB_SKIP_BYTES;
const MAX_REDIRECTS = 5;

export interface FetchAndStoreRemoteMediaOptions {
  sourceUrl: string;
  apiKey?: string;
  kind?: 'image' | 'video';
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
  maxRedirects: number = MAX_REDIRECTS,
): Promise<Response> {
  let currentUrl = url;

  for (let redirects = 0; redirects <= maxRedirects; redirects++) {
    const allowAuth = validateRemoteMediaUrl(currentUrl).allowed;
    const response = await fetch(currentUrl, {
      redirect: 'manual',
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
  const { sourceUrl, apiKey, kind } = options;

  const urlPolicy = validateRemoteMediaUrl(sourceUrl);
  if (!urlPolicy.allowed) {
    throw new ApiError(
      400,
      `Source URL is not allowed for media ingest: ${urlPolicy.reason || 'unsafe-host'}`,
    );
  }

  const startTime = Date.now();
  const pollTimeout = kind === 'video' ? 180000 : 60000;
  const pollDelay = kind === 'video' ? 4000 : 2000;

  let buffer: Buffer | null = null;
  let contentType: string | null = null;

  while (Date.now() - startTime < pollTimeout) {
    const response = await fetchWithSafeRedirects(sourceUrl, apiKey);
    if (response.ok) {
      const contentLength = Number(response.headers.get('content-length'));
      if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
        throw new ApiError(413, 'Generated media exceeds Pollinations Media Storage limit (max 10MB)');
      }
      contentType = response.headers.get('content-type');
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > MIN_BYTES) {
        buffer = Buffer.from(arrayBuffer);
        break;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, pollDelay));
  }

  if (!buffer) {
    throw new ApiError(504, 'Timed out waiting for media');
  }

  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new ApiError(413, 'Generated media exceeds Pollinations Media Storage limit (max 10MB)');
  }

  const normalizedContentType = contentType || fallbackContentType(kind);
  const uploadResponse = await fetch(MEDIA_UPLOAD_URL, {
    method: 'POST',
    headers: {
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      'Content-Type': normalizedContentType,
    },
    body: buffer,
  });

  const rawBody = await uploadResponse.text();
  let uploadData: any = null;
  try {
    uploadData = JSON.parse(rawBody);
  } catch {
    uploadData = { error: rawBody || 'Upstream media ingest failed' };
  }

  if (!uploadResponse.ok) {
    const errorMessage = uploadData?.error || `Upstream media ingest failed (${uploadResponse.status})`;
    throw new ApiError(uploadResponse.status, errorMessage);
  }

  return {
    key: uploadData.id,
    url: uploadData.url,
    contentType: uploadData.contentType || normalizedContentType,
  };
}
