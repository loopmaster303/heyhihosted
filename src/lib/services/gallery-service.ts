import { DatabaseService, type Asset } from '@/lib/services/database';

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
  }
};
