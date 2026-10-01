'use client';

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAsciiFrames } from './useAsciiFrames';

/**
 * Das Feld, aus dem ein Bild entsteht. Ein ASCII-Raster in genau der Groesse
 * des kommenden Bildes: es pulsiert, solange der Lauf laeuft, und verdichtet
 * sich mit der Zeit. Die Farben sind der hey.hi-Verlauf — die Farben des
 * echten Bildes kennt vorher niemand.
 *
 * Bewegung kommt aus `useAsciiFrames`: reduzierte Bewegung friert auf einem
 * Frame ein (der Zustand bleibt sichtbar), ein Tab im Hintergrund rechnet nicht.
 */

const RAMP = ' .·:;-=+*x#%@';
const FRAME_MS = 70;
/** Ein grosser Zyklus — die Bewegung soll sich nicht sichtbar wiederholen. */
const CYCLE = 100_000;
const CHAR_ASPECT = 0.6; // Breite / Hoehe eines Monospace-Zeichens
const CELL_PX = 9;

function hash(x: number, y: number, z: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Ein Bild des Feldes. `density` waechst von 0 (lose Ringe) Richtung 1 (zwei
 * dichte, langsam wandernde Kerne) — das Gefuehl, dass etwas Gestalt annimmt.
 */
export function asciiFieldFrame(cols: number, rows: number, t: number, density: number): string {
  let out = '';
  const breathe = 0.82 + 0.18 * Math.sin(t * 1.7);
  const tick = Math.floor(t * 12);
  const ax = -0.38 + 0.12 * Math.sin(t * 0.35);
  const ay = -0.4 + 0.1 * Math.cos(t * 0.29);
  const bx = 0.42 + 0.1 * Math.cos(t * 0.31);
  const by = 0.48 + 0.12 * Math.sin(t * 0.27);
  for (let y = 0; y < rows; y += 1) {
    const ny = rows > 1 ? (y / (rows - 1)) * 2 - 1 : 0;
    for (let x = 0; x < cols; x += 1) {
      const nx = cols > 1 ? (x / (cols - 1)) * 2 - 1 : 0;
      const d = Math.hypot(nx * 0.9, ny * 1.1);
      const pulse = 0.5 + 0.5 * Math.sin(d * 8 - t * 3.2);
      const shape = Math.max(
        Math.exp(-((nx - ax) ** 2 + (ny - ay) ** 2) * 3.2),
        Math.exp(-((nx - bx) ** 2 + (ny - by) ** 2) * 3.0),
      );
      const n = hash(x, y, tick);
      let v = (1 - density) * (pulse * 0.6 * breathe + n * 0.14)
        + density * (0.22 + 0.78 * shape) * (0.75 + 0.25 * pulse)
        + (n - 0.5) * 0.08;
      v = Math.max(0, Math.min(0.999, v));
      out += RAMP[Math.floor(v * RAMP.length)];
    }
    out += '\n';
  }
  return out;
}

/** Waechst mit der Zeit gegen 0,85 — das Feld wird nie "fertig", das Bild schon. */
export function densityAt(seconds: number): number {
  return 0.85 * (1 - Math.exp(-seconds / 6));
}

interface GenerationFieldProps {
  /** Laeuft die Erzeugung? Ein stehendes Feld zeigt einen abgebrochenen Lauf. */
  active: boolean;
  className?: string;
}

export const GenerationField: React.FC<GenerationFieldProps> = ({ active, className }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState({ cols: 0, rows: 0 });
  const frame = useAsciiFrames(CYCLE, FRAME_MS, active);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      const { width, height } = box.getBoundingClientRect();
      setGrid({
        cols: Math.max(6, Math.ceil(width / (CELL_PX * CHAR_ASPECT))),
        rows: Math.max(6, Math.ceil(height / CELL_PX)),
      });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // useAsciiFrames zaehlt je Instanz ab 0 — der Frame ist zugleich die
  // Laufzeit seit dem Mount, und damit die Verdichtung.
  const text = useMemo(() => {
    if (grid.cols === 0) return '';
    const t = frame * (FRAME_MS / 1000);
    return asciiFieldFrame(grid.cols, grid.rows, t, densityAt(t));
  }, [frame, grid]);

  return (
    <div ref={boxRef} className={cn('relative overflow-hidden', className)} aria-hidden="true">
      <pre
        className="absolute inset-0 m-0 select-none overflow-hidden whitespace-pre font-mono leading-[9px] text-transparent [-webkit-background-clip:text] [background-clip:text]"
        style={{
          fontSize: `${CELL_PX}px`,
          letterSpacing: 0,
          backgroundImage:
            'radial-gradient(circle at 30% 30%, hsl(var(--mode-visualize)), transparent 58%),'
            + ' radial-gradient(circle at 70% 75%, hsl(200 90% 55%), transparent 62%),'
            + ' linear-gradient(hsl(var(--primary)), hsl(var(--primary)))',
        }}
      >
        {text}
      </pre>
    </div>
  );
};
