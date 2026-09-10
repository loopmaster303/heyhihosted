import Dexie, { type Table } from 'dexie';

/**
 * Vorschau fuer Pruna-Referenzen.
 *
 * Prunas Upload antwortet mit `urls.get` — das ist eine API-Referenz, die nur
 * Pruna selbst aufloest, kein abrufbares Bild. Ein GET auf
 * `https://api.pruna.ai/v1/files/<id>` antwortet mit 404 ("no Route matched"):
 * Der Referenz-Slot blieb deshalb leer und zeigte nur das Broken-Image-Symbol.
 *
 * Die Bytes liegen beim Upload ohnehin im Browser. Also legen wir ein kleines
 * Vorschaubild unter genau dem Handle in IndexedDB ab und zeigen das an. Der
 * Handle selbst bleibt unveraendert im Generate-Request — dort ist er die
 * richtige Referenz, weil Pruna ihn serverseitig mit eigenen Credentials liest.
 *
 * Die Ablage ist ein Cache: fehlt ein Eintrag (etwa fuer eine Referenz von vor
 * diesem Fix), zeigt die Oberflaeche einen neutralen Platzhalter.
 */

/** Genug fuer den groessten Slot (rund 134 CSS-Pixel, auch auf Retina). */
const PREVIEW_MAX_EDGE = 256;

/** Obergrenze gegen Altlasten: aeltere Vorschauen fallen beim Schreiben weg. */
const MAX_PREVIEWS = 100;

const PRUNA_REFERENCE_PREFIX = 'https://api.pruna.ai/';

/** Nur Pruna-Handles brauchen die Vorschau; alles andere ist direkt ladbar. */
export function isPrunaReferenceUrl(url: string): boolean {
  return typeof url === 'string' && url.startsWith(PRUNA_REFERENCE_PREFIX);
}

interface ReferencePreviewRow {
  id: string;
  preview: Blob;
  createdAt: number;
}

class ReferencePreviewDatabase extends Dexie {
  previews!: Table<ReferencePreviewRow, string>;

  constructor() {
    super('HeyHiReferencePreviews');
    this.version(1).stores({ previews: 'id, createdAt' });
  }
}

let instance: ReferencePreviewDatabase | null = null;

/** Ohne IndexedDB (Server, jsdom) gibt es den Cache schlicht nicht. */
function previewDb(): ReferencePreviewDatabase | null {
  if (typeof indexedDB === 'undefined') return null;
  if (!instance) instance = new ReferencePreviewDatabase();
  return instance;
}

/** Verkleinert das Bild; scheitert das, bleibt das Original. */
async function buildPreview(file: Blob): Promise<Blob> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, PREVIEW_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    // PNG statt JPEG: eine Vorschau soll keine Transparenz verlieren.
    return (await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))) ?? file;
  } catch {
    return file;
  }
}

export async function rememberPrunaReferencePreview(handle: string, file: Blob): Promise<void> {
  const db = previewDb();
  if (!db || !isPrunaReferenceUrl(handle) || !file.type.startsWith('image/')) return;
  try {
    await db.previews.put({ id: handle, preview: await buildPreview(file), createdAt: Date.now() });
    await prunePreviews(db);
  } catch (error) {
    // Ein fehlgeschlagener Cache darf den Upload nicht kippen.
    console.warn('[reference-preview] Vorschau nicht gespeichert:', error);
  }
}

/** Halten wir die Ablage klein: wer Referenzen wegwirft, laesst sonst Bytes zurueck. */
async function prunePreviews(db: ReferencePreviewDatabase): Promise<void> {
  const count = await db.previews.count();
  if (count <= MAX_PREVIEWS) return;
  const oldest = await db.previews.orderBy('createdAt').limit(count - MAX_PREVIEWS).toArray();
  await db.previews.bulkDelete(oldest.map((row) => row.id));
}

export async function getPrunaReferencePreviews(handles: readonly string[]): Promise<Map<string, Blob>> {
  const previews = new Map<string, Blob>();
  const wanted = handles.filter(isPrunaReferenceUrl);
  const db = previewDb();
  if (!db || wanted.length === 0) return previews;
  try {
    const rows = await db.previews.bulkGet(wanted);
    rows.forEach((row, index) => {
      if (row?.preview) previews.set(wanted[index], row.preview);
    });
  } catch (error) {
    console.warn('[reference-preview] Vorschau nicht geladen:', error);
  }
  return previews;
}

export async function forgetPrunaReferencePreview(handle: string): Promise<void> {
  const db = previewDb();
  if (!db || !isPrunaReferenceUrl(handle)) return;
  try {
    await db.previews.delete(handle);
  } catch (error) {
    console.warn('[reference-preview] Vorschau nicht entfernt:', error);
  }
}
