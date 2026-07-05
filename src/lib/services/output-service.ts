import { DatabaseService } from '@/lib/services/database';
import { ingestGeneratedAsset } from '@/lib/upload/ingest';
import { generateUUID } from '@/lib/uuid';
import { resolveAssetUrl } from '@/lib/services/asset-fallback-service';
import { SMALL_BLOB_SKIP_BYTES } from '@/lib/upload/constants';

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
 * Asset facade for generation flows. Thin pass-through CRUD lives on
 * DatabaseService directly; this module only owns generation-specific
 * save (with Pollinations ingest backfill) and resolved-URL lookup.
 */
export const OutputService = {
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
          ingestGeneratedAsset(url, isVideo ? 'video' : 'image')
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

        if (blob.size < SMALL_BLOB_SKIP_BYTES) {
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
