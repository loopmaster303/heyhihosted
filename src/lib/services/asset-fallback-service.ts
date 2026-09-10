/**
 * AssetFallbackService
 *
 * Handles fallback logic for asset URL resolution.
 * Ensures assets are always accessible even when local output metadata is incomplete or URLs expire.
 */

import { DatabaseService } from '@/lib/services/database';
import { BlobManager } from '@/lib/blob-manager';
import { resolvePollinationsMediaUrl } from '@/lib/upload/pollinations-media';
import { getPollenHeaders } from '@/lib/pollen-key';
import { isAllowedRemoteMediaUrl } from '@/lib/media/remote-fetch-policy';
import { SMALL_BLOB_SKIP_BYTES } from '@/lib/upload/constants';

interface FallbackOptions {
  downloadMissingBlob?: boolean;
}

export interface AssetUrlResult {
  url: string | null;
  source: 'blob' | 'remote' | 'media' | 'downloaded';
  needsCleanup: boolean;
}

const DEFAULT_OPTIONS: Required<FallbackOptions> = {
  downloadMissingBlob: true,
};

/**
 * Comprehensive fallback chain for asset URL resolution.
 *
 * Priority order:
 * 1. Local blob (fastest, no network)
 * 2. Remote URL (if provided)
 * 3. Media URL via storageKey/hash
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

  // 3. Media-URL aus dem storageKey bauen
  if (asset.storageKey) {
    const mediaUrl = await fetchMediaUrl(asset.storageKey);
    if (mediaUrl) {
      // Optionally download and cache for offline use
      if (opts.downloadMissingBlob) {
        downloadAndCacheAsset(assetId, mediaUrl, asset.contentType).catch(err => {
          console.warn(`[AssetFallback] Background cache failed for ${assetId}:`, err);
        });
      }
      return { url: mediaUrl, source: 'media', needsCleanup: false };
    }
  }

  console.error(`[AssetFallback] All fallback methods failed for ${assetId}`);
  return { url: null, source: 'blob', needsCleanup: false };
}

/**
 * Media-URL aus storageKey/hash bauen.
 *
 * `resolvePollinationsMediaUrl` ist ein reiner String-Bauer: kein Netzwerk,
 * kein Werfen. Ein Wiederholungs-Zweig hatte hier nie etwas zu tun.
 *
 * Der catch haelt den bisherigen Vertrag: ein Fehler beim URL-Bau fuehrt zu
 * null statt zu einem geworfenen Fehler (die Aufrufer verarbeiten null).
 */
async function fetchMediaUrl(storageKey: string): Promise<string | null> {
  try {
    const data = await resolvePollinationsMediaUrl(storageKey);
    return data.mediaUrl || null;
  } catch (error) {
    console.warn(`[AssetFallback] Media-URL nicht baubar fuer ${storageKey}:`, error);
    return null;
  }
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

    // Only send Pollinations auth headers to Pollinations hosts to avoid
    // leaking the user's key to third-party origins.
    const headers = isAllowedRemoteMediaUrl(url) ? getPollenHeaders() : {};
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const blob = await response.blob();

    if (blob.size < SMALL_BLOB_SKIP_BYTES) {
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
 * Useful when a displayed asset URL suddenly fails.
 */
export async function refreshAssetUrl(assetId: string): Promise<AssetUrlResult> {
  return resolveAssetUrl(assetId, {
    downloadMissingBlob: true,
  });
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
