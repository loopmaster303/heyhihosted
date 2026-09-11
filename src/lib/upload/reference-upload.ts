import { uploadFileToPollinationsMedia } from '@/lib/upload/pollinations-media';
import { uploadFileToPruna } from '@/lib/upload/pruna';
import { rememberPrunaReferencePreview } from '@/lib/upload/pruna-reference-preview';

export type ReferenceUploadProvider = 'pollinations' | 'pruna';

/**
 * Laedt ein Referenzbild hoch und liefert die Adresse, die im Generate-Request
 * stehen muss.
 *
 * Bei Pollinations ist das die oeffentliche media.pollinations.ai-Adresse.
 *
 * Bei Pruna ist es normalerweise der Handle aus `/api/pruna/upload` — den loest
 * nur Pruna auf, die Vorschau kommt deshalb aus dem lokalen Cache. Dieser Weg
 * haengt aber am Guthaben des Kontos: ohne Credit antwortet Pruna mit 403
 * "no more credit available". Das Referenzbild fehlte dann vollstaendig, der
 * Slot blieb leer und die Generierung lief ohne Vorlage — live belegt am
 * 2026-09-10.
 *
 * Deshalb der Ausweichpfad: scheitert der Pruna-Upload, geht dieselbe Datei zu
 * media.pollinations.ai und die oeffentliche Adresse wird zur Referenz. Sie ist
 * direkt anzeigbar (der Slot braucht dann keine lokale Vorschau) und wird wie
 * jede andere Fremd-URL behandelt.
 *
 * Nur wenn beide Wege scheitern, sieht der Aufrufer einen Fehler.
 */
export async function uploadReferenceImage(
  file: File,
  provider: ReferenceUploadProvider
): Promise<string> {
  if (provider === 'pollinations') {
    const { mediaUrl } = await uploadFileToPollinationsMedia(file, file.name, file.type);
    return mediaUrl;
  }

  try {
    const handle = await uploadFileToPruna(file, file.name);
    // Der Handle ist kein Bild. Die Bytes liegen hier, also entsteht die
    // Vorschau lokal unter genau diesem Handle.
    await rememberPrunaReferencePreview(handle, file);
    return handle;
  } catch (error) {
    // Kein harter Fehler: der Ausweichweg unten kann denselben Upload leisten.
    console.warn(
      '[reference-upload] Pruna-Upload nicht moeglich, weiche auf media.pollinations.ai aus:',
      error
    );
  }

  const { mediaUrl } = await uploadFileToPollinationsMedia(file, file.name, file.type);
  return mediaUrl;
}
