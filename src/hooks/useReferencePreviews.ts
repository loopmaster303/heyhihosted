"use client";

import { useEffect, useRef, useState } from 'react';
import { BlobManager } from '@/lib/blob-manager';
import { getPrunaReferencePreviews, isPrunaReferenceUrl } from '@/lib/upload/pruna-reference-preview';

/**
 * Anzeigbare Vorschauen fuer Pruna-Referenzen.
 *
 * Pruna antwortet auf den Upload mit `urls.get` — einer API-Referenz, die nur
 * Pruna selbst aufloest. Ein GET darauf endet mit 404, im Slot stand deshalb
 * ein Broken-Image. Die Bytes lagen beim Upload im Browser, also liegt dort
 * auch die Vorschau; dieser Hook holt sie aus IndexedDB und gibt Objekt-URLs
 * zurueck, die die Oberflaeche direkt rendern kann.
 *
 * Adressiert wird nach Handle, nicht nach Position: faellt Slot 1 weg, wandert
 * die Vorschau von Slot 2 einfach mit.
 *
 * Aufgeraeumt werden hier nur die Objekt-URLs; der Cache-Eintrag bleibt. Das
 * Entfernen einer Referenz loescht ihn ausdruecklich, der blosse Wechsel der
 * Ansicht nicht: derselbe Handle kann in einer anderen Liste noch haengen.
 */
export function useReferencePreviews(urls: readonly string[]): Record<string, string> {
  // Die Handle-Liste als Zeichenkette ist die Abhaengigkeit: das Array selbst
  // entsteht bei jedem Rendern neu.
  const handleKey = urls.filter(isPrunaReferenceUrl).join('\n');

  const [previews, setPreviews] = useState<Record<string, string>>({});
  const ownedRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const wanted = handleKey ? handleKey.split('\n') : [];

    // Ohne Pruna-Handles gibt es nichts nachzuladen. Die alten Objekt-URLs
    // gehen zurueck, der Zustand bleibt stehen: was nicht in der Liste steht,
    // rendert ohnehin niemand. So loest der haeufige Fall keinen Render aus.
    if (wanted.length === 0) {
      const stale = Object.values(ownedRef.current);
      ownedRef.current = {};
      stale.forEach((url) => BlobManager.releaseURL(url));
      return;
    }

    let cancelled = false;

    void getPrunaReferencePreviews(wanted).then((found) => {
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const [handle, blob] of found) {
        next[handle] =
          ownedRef.current[handle] ?? BlobManager.createURL(blob, 'reference-preview');
      }
      for (const [handle, url] of Object.entries(ownedRef.current)) {
        if (!next[handle]) BlobManager.releaseURL(url);
      }
      ownedRef.current = next;
      setPreviews(next);
    });

    return () => {
      cancelled = true;
    };
  }, [handleKey]);

  useEffect(
    () => () => {
      Object.values(ownedRef.current).forEach((url) => BlobManager.releaseURL(url));
      ownedRef.current = {};
    },
    []
  );

  return previews;
}
