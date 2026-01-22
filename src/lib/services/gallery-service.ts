import { DatabaseService, type Asset } from '@/lib/services/database';
import { ingestGeneratedAsset } from '@/lib/upload/ingest';
import { generateUUID } from '@/lib/uuid';

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
 * GalleryService
 *
 * Wrapper around DatabaseService for Asset management.
 * Kept for backward compatibility and potential future specialized gallery logic.
 */
export const GalleryService = {
  /**
   * Save an asset to the local Vault (Dexie DB).
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
   * Delete an asset from the vault.
   */
  async deleteAsset(id: string): Promise<void> {
    return DatabaseService.deleteAsset(id);
  },

  /**
   * Save a generated asset (from Pollinations/Replicate) to the vault.
   * Handles both Pollinations (S3 ingest) and Replicate (direct fetch) flows.
   *
   * @returns The asset ID if successfully saved, undefined otherwise
   */
  async saveGeneratedAsset(options: SaveGeneratedAssetOptions): Promise<string | undefined> {
    const { url, prompt, modelId, conversationId, sessionId, isVideo = false, isPollinations = true } = options;

    if (!url) {
      console.warn('[GalleryService] No URL provided for asset save');
      return undefined;
    }

    const assetId = generateUUID();

    try {
      if (isPollinations) {
        // Pollinations flow: ingest to S3, store storageKey
        if (!sessionId) {
          console.warn('[GalleryService] sessionId required for Pollinations assets');
          return undefined;
        }

        const ingest = await ingestGeneratedAsset(url, sessionId, isVideo ? 'video' : 'image');

        await DatabaseService.saveAsset({
          id: assetId,
          contentType: ingest.contentType,
          prompt: prompt.trim(),
          modelId,
          conversationId,
          timestamp: Date.now(),
          storageKey: ingest.key,
        });

        console.log(`📸 Pollinations asset saved: ${assetId} (key: ${ingest.key})`);
        return assetId;
      } else {
        // Replicate flow: fetch blob, store locally
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
          id: assetId,
          blob,
          contentType: blob.type,
          prompt: prompt.trim(),
          modelId,
          conversationId,
          timestamp: Date.now(),
        });

        console.log(`📸 Replicate asset saved: ${assetId} (${blob.size} bytes)`);
        return assetId;
      }
    } catch (error) {
      console.error('[GalleryService] Failed to save generated asset:', error);
      return undefined;
    }
  }
};
