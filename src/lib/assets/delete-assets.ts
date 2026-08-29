import { db } from '@/lib/services/database';
import { isInScope, type AssetOrigin } from '@/lib/assets/asset-origin';

/**
 * Die gemeinsame AUSWAHL fuer beide Loeschwege.
 *
 * Vor Phase 5 hatten Einzel- und Massenloeschen getrennte Praedikate
 * (`db.assets.delete(id)` gegen `db.assets.filter(isGalleryAsset).delete()`).
 * Sobald Loeschen mehr tut als die Zeile zu entfernen — seit E5.6 gibt es
 * Object-URLs freizugeben — driften zwei Praedikate auseinander.
 */
export async function assetIdsInScope(origins?: readonly AssetOrigin[]): Promise<string[]> {
  const keys = await db.assets.filter((a) => isInScope(a, origins)).primaryKeys();
  return keys as string[];
}

/**
 * Loescht eine Zeile. Der Blob ist ein Feld dieser Zeile (database.ts) —
 * es gibt keinen zweiten Speicher, aus dem eine Waise bleiben koennte.
 * Die zugehoerige Object-URL gibt der Aufrufer frei; nur er kennt sie.
 */
export async function deleteAssetById(id: string): Promise<void> {
  await db.assets.delete(id);
}

/** Loescht alles im Bereich. Gibt die Anzahl der geloeschten Zeilen zurueck. */
export async function deleteAssetsInScope(origins?: readonly AssetOrigin[]): Promise<number> {
  const ids = await assetIdsInScope(origins);
  if (ids.length === 0) return 0;
  await db.assets.bulkDelete(ids);
  return ids.length;
}
