import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/services/database';
import { DatabaseService } from '@/lib/services/database';
import type { Asset } from '@/lib/services/database';
import { isInScope, type AssetOrigin } from '@/lib/assets/asset-origin';
import { deleteAssetById, deleteAssetsInScope } from '@/lib/assets/delete-assets';

const PREVIEW_LIMIT = 50;

/** Keep Dexie's timestamp ordering, but float starred items to the top. */
function sortStarredFirst(a: Asset, b: Asset): number {
  if (a.starred && !b.starred) return -1;
  if (!a.starred && b.starred) return 1;
  return 0;
}

/**
 * Reaktive Liste der Assets im gewaehlten Herkunftsbereich.
 *
 * `origins` undefined = kein Filter (so liest /gallery, siehe E5.4).
 *
 * `assets` ist auf 50 begrenzt — Dexie filtert VOR dem Limit, eine Oberflaeche
 * mit gesetztem Filter bekommt also weiterhin 50 aus ihrer eigenen Herkunft.
 * `totalInScope` ist NICHT begrenzt: die Loeschbestaetigung braucht die echte
 * Zahl (F12), und `assets.length` war dafuer nie geeignet.
 */
export function useGalleryAssets(origins?: readonly AssetOrigin[]) {
  // Ein Array-Literal aendert bei jedem Render seine Identitaet und wuerde die
  // Query in einer Schleife neu ausloesen.
  const key = origins ? [...origins].sort().join(',') : '';

  const assets = useLiveQuery(
    async () => {
      const all = await db.assets
        .orderBy('timestamp')
        .reverse()
        .filter((a) => isInScope(a, origins))
        .limit(PREVIEW_LIMIT)
        .toArray();

      return all.sort(sortStarredFirst);
    },
    [key]
  );

  const totalInScope = useLiveQuery(
    async () => db.assets.filter((a) => isInScope(a, origins)).count(),
    [key]
  );

  const isLoading = assets === undefined;

  const deleteAsset = async (id: string) => {
    await deleteAssetById(id);
  };

  const clearAllAssets = async () => {
    await deleteAssetsInScope(origins);
  };

  const toggleStarred = async (id: string) => {
    await DatabaseService.toggleStarred(id);
  };

  return {
    assets: useMemo(() => assets || [], [assets]),
    totalInScope: totalInScope ?? 0,
    isLoading,
    deleteAsset,
    clearAllAssets,
    toggleStarred,
  };
}
