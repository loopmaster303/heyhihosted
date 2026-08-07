import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/services/database';
import { DatabaseService } from '@/lib/services/database';
import type { Asset } from '@/lib/services/database';
import { PLAYGROUND_CONVERSATION_ID } from '@/lib/playground/constants';

/**
 * Predicate for the main gallery query: playground-generated assets (tagged
 * with PLAYGROUND_CONVERSATION_ID) live in the playground gallery only and
 * must not contaminate the vault / sidebar gallery / GallerySidebarSection.
 */
export function isGalleryAsset(a: Asset): boolean {
  return a.conversationId !== PLAYGROUND_CONVERSATION_ID;
}

/** Keep Dexie's timestamp ordering, but float starred items to the top. */
function sortStarredFirst(a: Asset, b: Asset): number {
  if (a.starred && !b.starred) return -1;
  if (!a.starred && b.starred) return 1;
  return 0;
}

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
        .filter(isGalleryAsset)
        .limit(50)
        .toArray();

      return all.sort(sortStarredFirst);
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
