/**
 * AssetFallbackService
 *
 * Handles fallback logic for asset URL resolution with retry mechanisms.
 * Ensures assets are always accessible even when vault data is missing or URLs expire.
 */

import { DatabaseService, type Asset } from '@/lib/services/database';
import { BlobManager } from '@/lib/blob-manager';

interface FallbackOptions {
  maxRetries?: number;
  retryDelay?: number;
  downloadMissingBlob?: boolean;
}

interface AssetUrlResult {
  url: string | null;
  source: 'blob' | 'remote' | 's3-signed' | 'downloaded';
  needsCleanup: boolean;
}

const DEFAULT_OPTIONS: Required<FallbackOptions> = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  downloadMissingBlob: true,
};

/**
 * Comprehensive fallback chain for asset URL resolution.
 *
 * Priority order:
 * 1. Local blob (fastest, no network)
 * 2. Remote URL (if provided)
 * 3. S3 signed URL via storageKey (with retry)
 * 4. Download and cache if only remote URL exists
 *
 * @param assetId The asset ID to resolve
 * @param options Fallback configuration options
 * @returns Promise resolving to URL and metadata
 */
export async function resolveAssetUrl(
  assetId: string,
  options: FallbackOptions = {}
): Promise<AssetUrlResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const asset = await DatabaseService.getAsset(assetId);
  if (!asset) {
    console.warn(`[AssetFallback] Asset not found: ${assetId}`);
    return { url: null, source: 'blob', needsCleanup: false };
  }

  // 1. Try local blob first (fastest)
  if (asset.blob) {
    const url = BlobManager.createURL(asset.blob, `asset:${assetId.slice(0, 8)}`);
    return { url, source: 'blob', needsCleanup: true };
  }

  // 2. Try remote URL (direct, no signing needed)
  if (asset.remoteUrl && isValidUrl(asset.remoteUrl)) {
    // Optionally download and cache
    if (opts.downloadMissingBlob) {
      downloadAndCacheAsset(assetId, asset.remoteUrl, asset.contentType).catch(err => {
        console.warn(`[AssetFallback] Background cache failed for ${assetId}:`, err);
      });
    }
    return { url: asset.remoteUrl, source: 'remote', needsCleanup: false };
  }

  // 3. Try S3 signed URL with retry
  if (asset.storageKey) {
    const signedUrl = await fetchSignedUrlWithRetry(asset.storageKey, opts.maxRetries, opts.retryDelay);
    if (signedUrl) {
      // Optionally download and cache for offline use
      if (opts.downloadMissingBlob) {
        downloadAndCacheAsset(assetId, signedUrl, asset.contentType).catch(err => {
          console.warn(`[AssetFallback] Background cache failed for ${assetId}:`, err);
        });
      }
      return { url: signedUrl, source: 's3-signed', needsCleanup: false };
    }
  }

  console.error(`[AssetFallback] All fallback methods failed for ${assetId}`);
  return { url: null, source: 'blob', needsCleanup: false };
}

/**
 * Fetch S3 signed URL with exponential backoff retry.
 */
async function fetchSignedUrlWithRetry(
  storageKey: string,
  maxRetries: number,
  baseDelay: number
): Promise<string | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('/api/upload/sign-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: storageKey }),
      });

      if (!response.ok) {
        throw new Error(`Sign-read API failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data?.downloadUrl) {
        if (attempt > 0) {
          console.log(`[AssetFallback] S3 signed URL retrieved on retry ${attempt + 1}`);
        }
        return data.downloadUrl;
      }

      throw new Error('No downloadUrl in response');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.warn(`[AssetFallback] Retry ${attempt + 1}/${maxRetries} after ${delay}ms:`, lastError.message);
        await sleep(delay);
      }
    }
  }

  console.error(`[AssetFallback] Failed to fetch signed URL after ${maxRetries} attempts:`, lastError);
  return null;
}

/**
 * Download remote asset and cache it in IndexedDB for offline use.
 * Runs in background, doesn't block URL resolution.
 */
async function downloadAndCacheAsset(
  assetId: string,
  url: string,
  contentType: string
): Promise<void> {
  try {
    console.log(`[AssetFallback] Downloading asset for cache: ${assetId}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const blob = await response.blob();

    if (blob.size < 100) {
      console.warn(`[AssetFallback] Downloaded blob too small (${blob.size} bytes), skipping cache`);
      return;
    }

    // Update asset with blob
    const existingAsset = await DatabaseService.getAsset(assetId);
    if (existingAsset && !existingAsset.blob) {
      await DatabaseService.saveAsset({
        ...existingAsset,
        blob,
        contentType: blob.type || contentType,
      });
      console.log(`[AssetFallback] Cached ${blob.size} bytes for ${assetId}`);
    }
  } catch (error) {
    throw new Error(`Cache download failed: ${error}`);
  }
}

/**
 * Refresh an expired or invalid asset URL.
 * Useful when a displayed asset URL suddenly fails (e.g., S3 URL expired).
 */
export async function refreshAssetUrl(assetId: string): Promise<string | null> {
  const result = await resolveAssetUrl(assetId, {
    maxRetries: 2,
    downloadMissingBlob: true,
  });
  return result.url;
}

/**
 * Pre-cache multiple assets in the background.
 * Useful for gallery pre-loading.
 */
export async function precacheAssets(assetIds: string[]): Promise<void> {
  const promises = assetIds.map(async (id) => {
    try {
      await resolveAssetUrl(id, { downloadMissingBlob: true });
    } catch (error) {
      console.warn(`[AssetFallback] Precache failed for ${id}:`, error);
    }
  });

  await Promise.all(promises);
  console.log(`[AssetFallback] Precached ${assetIds.length} assets`);
}

/**
 * Validate if a URL is properly formed and not a blob URL.
 */
function isValidUrl(url: string): boolean {
  if (!url || url.startsWith('blob:')) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sleep utility for retry delays.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get fallback statistics for monitoring.
 */
export async function getFallbackStats() {
  // Could be extended to track success/failure rates
  return {
    // Placeholder for future metrics
  };
}
