'use client';

import { useEffect, useState } from 'react';

/**
 * Ein Frame-Zaehler fuer alle ASCII-Effekte. Drei Dinge sind hier zentral
 * geloest, weil sie sonst in jedem Effekt einzeln vergessen werden:
 *
 * - `prefers-reduced-motion` friert auf Frame 0 ein statt den Effekt zu
 *   verstecken. Ein Ladezustand muss sichtbar bleiben, auch wenn er stillsteht.
 * - Ein Tab im Hintergrund animiert nicht. Das ist der Unterschied zwischen
 *   Ambiente und Batteriefresser.
 * - `active: false` haelt an, ohne dass der Aufrufer den Hook bedingt aufruft.
 */
export function useAsciiFrames(length: number, intervalMs: number, active = true): number {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!active || length <= 0) return;

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer !== null) return;
      timer = setInterval(() => setFrame((f) => (f + 1) % length), intervalMs);
    };
    const stop = () => {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
    };

    const onVisibility = () => (document.hidden ? stop() : start());

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [length, intervalMs, active]);

  return frame;
}
