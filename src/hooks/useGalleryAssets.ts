import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/services/database';
import type { Asset } from '@/lib/services/database';

/**
 * Hook for managing Gallery Assets (IndexedDB / Dexie)
 * Provides a reactive list of all generated and uploaded images.
 */
export function useGalleryAssets() {
  const assets = useLiveQuery(
    async () => {
      // Query assets, sort by timestamp descending, and limit to 50 for performance
      return await db.assets
        .orderBy('timestamp')
        .reverse()
        .limit(50)
        .toArray();
    },
    []
  );

  const isLoading = assets === undefined;

  const deleteAsset = async (id: string) => {
    await db.assets.delete(id);
  };

  const clearAllAssets = async () => {
    await db.assets.clear();
  };

  return {
    assets: assets || [],
    isLoading,
    deleteAsset,
    clearAllAssets
  };
}
