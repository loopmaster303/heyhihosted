"use client";

import { useEffect } from 'react';

/**
 * Setzt `--vvh` auf die Hoehe des *visual* viewport.
 *
 * Warum nicht `dvh`: Die Bildschirmtastatur verkleinert auf iOS Safari und
 * Android Chrome den visual viewport, nicht den layout viewport. `100dvh`
 * bleibt bei offener Tastatur so gross wie vorher — ein Grid mit `h-dvh`
 * schiebt seine untere Zeile damit unter die Tastatur, und weil der einzige
 * Scrollbereich innen liegt, kann der Browser sie nicht in Sicht scrollen.
 *
 * Ohne `visualViewport` (aeltere Browser, jsdom) wird nichts gesetzt; der
 * CSS-Fallback in `var(--vvh, 100dvh)` traegt dann.
 *
 * `offsetTop` bleibt bewusst unbeachtet: ob iOS den sichtbaren Bereich bei
 * offener Tastatur zusaetzlich verschiebt, ist ohne echtes Geraet nicht zu
 * entscheiden. Siehe docs/PLAN-phase-6-create-telefon.md, Abschnitt 8.
 */
export function useViewportHeight(): void {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const apply = () => root.style.setProperty('--vvh', `${vv.height}px`);
    apply();
    vv.addEventListener('resize', apply);
    return () => {
      vv.removeEventListener('resize', apply);
      root.style.removeProperty('--vvh');
    };
  }, []);
}
