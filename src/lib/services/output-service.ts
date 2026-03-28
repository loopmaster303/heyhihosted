import { DatabaseService, type Asset } from '@/lib/services/database';
import { ingestGeneratedAsset } from '@/lib/upload/ingest';
import { generateUUID } from '@/lib/uuid';
import { resolveAssetUrl } from '@/lib/services/asset-fallback-service';

export interface SaveGeneratedAssetOptions {
  url: string;
  prompt: string;
  modelId: string;
  conversationId?: string;
  sessionId?: string;
  isVideo?: boolean;
  isPollinations?: boolean;
}

/**
 * OutputService
 *
 * Wrapper around DatabaseService for output asset management.
 */
export const OutputService = {
  /**
   * Save an asset to the local output store (Dexie DB).
   */
  async saveAsset(asset: Asset): Promise<string> {
    return DatabaseService.saveAsset(asset);
  },

  /**
   * Retrieve an asset by ID.
   */
  async getAsset(id: string): Promise<Asset | undefined> {
    return DatabaseService.getAsset(id);
  },

  /**
   * Get a blob URL or remote URL for an asset.
   */
  async getAssetUrl(id: string): Promise<string | null> {
    return DatabaseService.getAssetUrl(id);
  },

  /**
   * Delete an asset from the local output store.
   */
  async deleteAsset(id: string): Promise<void> {
    return DatabaseService.deleteAsset(id);
  },

  /**
   * Get a resolved asset URL with full fallback chain.
   * Uses AssetFallbackService for retry logic and auto-caching.
   */
  async getResolvedAssetUrl(id: string): Promise<string | null> {
    const result = await resolveAssetUrl(id, {
      maxRetries: 3,
      downloadMissingBlob: true,
    });
    return result.url;
  },

  /**
   * Verify and repair assets with missing blobs.
   * Downloads and caches assets that only have storageKey or remoteUrl.
   *
   * @param assetIds Array of asset IDs to verify
   * @returns Number of assets repaired
   */
  async verifyAndRepairAssets(assetIds: string[]): Promise<number> {
    let repaired = 0;

    for (const id of assetIds) {
      try {
        const asset = await DatabaseService.getAsset(id);
        if (!asset) continue;

        // Skip if blob already exists
        if (asset.blob) continue;

        // Only repair if we have a way to fetch the asset
        if (!asset.storageKey && !asset.remoteUrl) {
          console.warn(`[OutputService] No source to repair asset: ${id}`);
          continue;
        }

        // Use fallback service to download and cache
        await resolveAssetUrl(id, {
          maxRetries: 2,
          downloadMissingBlob: true,
        });

        repaired++;
      } catch (error) {
        console.warn(`[OutputService] Failed to repair asset ${id}:`, error);
      }
    }

    if (repaired > 0) {
      console.log(`[OutputService] Repaired ${repaired} assets`);
    }

    return repaired;
  },

  /**
   * Save a generated asset to the local output store.
   * Handles Pollinations Media Storage ingest and local/direct fetch flows.
   *
   * @returns The asset ID if successfully saved, undefined otherwise
   */
  async saveGeneratedAsset(options: SaveGeneratedAssetOptions): Promise<string | undefined> {
    const { url, prompt, modelId, conversationId, sessionId, isVideo = false, isPollinations = true } = options;

    if (!url) {
      console.warn('[OutputService] No URL provided for asset save');
      return undefined;
    }

    const assetId = generateUUID();
    const fallbackContentType = isVideo ? 'video/mp4' : 'image/jpeg';
    const baseAsset = {
      id: assetId,
      contentType: fallbackContentType,
      prompt: prompt.trim(),
      modelId,
      conversationId,
      timestamp: Date.now(),
    };

    try {
      if (isPollinations) {
        // Save immediately with remoteUrl so the UI never waits on media ingest.
        await DatabaseService.saveAsset({
          ...baseAsset,
          remoteUrl: url,
        });

        if (sessionId) {
          ingestGeneratedAsset(url, sessionId, isVideo ? 'video' : 'image')
            .then(async (ingest) => {
              await DatabaseService.saveAsset({
                ...baseAsset,
                contentType: ingest.contentType,
                storageKey: ingest.key,
                remoteUrl: url,
              });
              console.log(`📸 Pollinations asset backfilled: ${assetId} (media hash: ${ingest.key})`);
            })
            .catch((error) => {
              console.warn('[OutputService] Media ingest failed, keeping remoteUrl fallback:', error);
            });
        } else {
          console.warn('[OutputService] sessionId missing, keeping remoteUrl fallback only');
        }

        console.log(`📸 Pollinations asset saved with immediate remoteUrl fallback: ${assetId}`);
        return assetId;
      } else {
        // Direct/local flow: fetch blob or data URL and store locally
        const response = await fetch(url);

        if (!response.ok) {
          console.warn(`⚠️ Failed to fetch asset: ${response.status} ${response.statusText}`);
          return undefined;
        }

        const blob = await response.blob();

        if (blob.size < 1000) {
          console.warn(`⚠️ Asset too small (${blob.size} bytes), skipping`);
          return undefined;
        }

        await DatabaseService.saveAsset({
          ...baseAsset,
          blob,
          contentType: blob.type,
        });

        console.log(`📸 Local asset saved: ${assetId} (${blob.size} bytes)`);
        return assetId;
      }
    } catch (error) {
      console.error('[OutputService] Failed to save generated asset:', error);
      return undefined;
    }
  }
};
