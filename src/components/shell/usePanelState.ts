'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { SHELL_PANELS, type ShellPanel } from './ShellContext';

function readPanel(value: string | null): ShellPanel | null {
  return value && (SHELL_PANELS as readonly string[]).includes(value) ? (value as ShellPanel) : null;
}

/**
 * Welches Sheet offen ist, steht in der Adresse (`?panel=settings`). Damit
 * schliesst der Zurueck-Knopf das Sheet, statt aus der App zu springen — das
 * Verhalten, das man von einer App auf dem Telefon erwartet. Ein Link wie
 * `/?panel=settings` oeffnet es direkt.
 *
 * Next 16 bindet natives `history.pushState` in seinen Router ein: kein
 * Neuladen, `useSearchParams` folgt (docs: linking-and-navigating, Native
 * History API).
 */
export function usePanelState() {
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const panel = readPanel(searchParams?.get('panel') ?? null);
  // Ob WIR den Eintrag gepusht haben. Nur dann darf Schliessen `back()` sein —
  // kam der Nutzer per Link mit ?panel=, fuehrte back() aus der App heraus.
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!panel) pushedRef.current = false;
  }, [panel]);

  const urlWith = useCallback((next: ShellPanel | null) => {
    const params = new URLSearchParams(window.location.search);
    if (next) params.set('panel', next);
    else params.delete('panel');
    const query = params.toString();
    return `${pathname}${query ? `?${query}` : ''}`;
  }, [pathname]);

  const openPanel = useCallback((next: ShellPanel) => {
    if (panel === next) return;
    if (panel) {
      // Von einem Sheet ins naechste: ersetzen, nicht stapeln.
      window.history.replaceState(null, '', urlWith(next));
      return;
    }
    window.history.pushState(null, '', urlWith(next));
    pushedRef.current = true;
  }, [panel, urlWith]);

  const closePanel = useCallback(() => {
    if (!panel) return;
    if (pushedRef.current) {
      pushedRef.current = false;
      window.history.back();
      return;
    }
    window.history.replaceState(null, '', urlWith(null));
  }, [panel, urlWith]);

  return { panel, openPanel, closePanel };
}
