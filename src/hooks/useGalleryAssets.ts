import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/services/database';
import { DatabaseService } from '@/lib/services/database';
import type { Asset } from '@/lib/services/database';

/**
 * Hook for managing Gallery Assets (IndexedDB / Dexie)
 * Provides a reactive list of all generated and uploaded images.
 */
export function useGalleryAssets() {
  const assets = useLiveQuery(
    async () => {
      const all = await db.assets
        .orderBy('timestamp')
        .reverse()
        .limit(50)
        .toArray();

      // Keep Dexie's timestamp ordering, but float starred items to the top.
      return all.sort((a, b) => {
        if (a.starred && !b.starred) return -1;
        if (!a.starred && b.starred) return 1;
        return 0;
      });
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

  const toggleStarred = async (id: string) => {
    await DatabaseService.toggleStarred(id);
  };

  return {
    assets: assets || [],
    isLoading,
    deleteAsset,
    clearAllAssets,
    toggleStarred,
  };
}
