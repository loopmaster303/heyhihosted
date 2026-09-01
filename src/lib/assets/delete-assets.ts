import { db } from '@/lib/services/database';
import { isInScope, type AssetOrigin } from '@/lib/assets/asset-origin';
import { getPollenHeaders } from '@/lib/pollen-key';

const MEDIA_DELETE_PROXY_PATH = '/api/media/delete';

/**
 * Wie viele externe Loeschungen gleichzeitig laufen duerfen.
 *
 * Massenloeschen war vor dieser Grenze eine Schleife mit einer Netzrunde je
 * Zeile — bei ein paar hundert Assets ein paar hundert serielle Anfragen
 * gegen media.pollinations.ai, hinter einem einzigen confirm(). Unbegrenzt
 * parallel waere die andere Falle. Sechs ist die uebliche Browser-Grenze
 * gleichzeitiger Verbindungen pro Host.
 */
const MEDIA_DELETE_CONCURRENCY = 6;

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
 * Loescht eine Zeile. Der Blob ist ein Feld dieser Zeile (database.ts); der
 * einzige zweite Speicher ist die externe Kopie im Pollinations Media Storage
 * (10 Jahre Ablauf), wenn das Asset per Media-Storage-Session erzeugt wurde.
 * Diese Kopie wird ueber den Proxy optimistisch geloescht — ein Fehler blockiert
 * nicht das lokale Loeschen.
 * Die zugehoerige Object-URL gibt der Aufrufer frei; nur er kennt sie.
 *
 * Der BYOP-Schluessel MUSS mit: das Asset liegt unter dem Schluessel, mit dem
 * es hochgeladen wurde. Ohne Header faellt `resolvePollenKey` serverseitig auf
 * den Betreiber-Schluessel zurueck — der hat an fremden Medien keine Rechte,
 * die Loeschung scheitert still, und die externe Kopie bleibt zehn Jahre
 * liegen. Genau dieser Fehler ist dem Upload-Pfad schon einmal passiert
 * (CLAUDE.md, "Upload Hardening").
 */
export async function deleteAssetById(id: string): Promise<void> {
  const asset = await db.assets.get(id);
  if (asset?.storageKey) {
    try {
      await fetch(`${MEDIA_DELETE_PROXY_PATH}?key=${encodeURIComponent(asset.storageKey)}`, {
        method: 'DELETE',
        headers: getPollenHeaders(),
      });
    } catch (error) {
      console.warn('[delete-assets] Externer Media-Storage-Blob blieb zurueck:', error);
    }
  }
  await db.assets.delete(id);
}

/**
 * Loescht alles im Bereich. Gibt die Anzahl der geloeschten Zeilen zurueck.
 *
 * `onProgress` meldet nach jeder fertigen Zeile (erledigt, gesamt) — der
 * Aufrufer kann waehrend eines langen Laufs anzeigen, wie weit er ist. Ohne
 * Rueckmeldung sieht ein Nutzer bei hunderten Assets nur eine haengende
 * Oberflaeche.
 */
export async function deleteAssetsInScope(
  origins?: readonly AssetOrigin[],
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  const ids = await assetIdsInScope(origins);
  const total = ids.length;
  if (total === 0) return 0;

  let done = 0;
  let next = 0;

  const worker = async () => {
    while (next < total) {
      const id = ids[next++];
      await deleteAssetById(id);
      done += 1;
      onProgress?.(done, total);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(MEDIA_DELETE_CONCURRENCY, total) }, worker),
  );

  return total;
}
