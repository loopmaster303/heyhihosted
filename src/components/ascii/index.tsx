'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useAsciiFrames } from './useAsciiFrames';

/**
 * Die Effektsprache aus dem democrabs-Onboarding, uebertragen auf hey.hi.
 *
 * Die Regel dahinter, und sie gilt fuer jede Ergaenzung hier:
 * **ASCII macht, was sich bewegt und vergeht. CSS macht, was steht und
 * angefasst wird.** Rahmen, Kaesten und Schalter bleiben deshalb draussen —
 * Zeichenrahmen brechen beim Zeilenumbruch, und ein Schalter aus `[x]` liefert
 * weder Trefferflaeche noch einen Zustand, den man ohne Lesen erkennt.
 *
 * Jeder Effekt ist `aria-hidden`. Wo ein echter Zustand dranhaengt, gehoert er
 * als Text in eine `aria-live`-Region des Aufrufers — `label` erledigt das.
 */

interface GlyphProps {
  className?: string;
  /** Sichtbarer Text neben dem Effekt; wandert in die aria-live-Region. */
  label?: string;
  /** Anhalten, ohne den Effekt auszubauen. */
  active?: boolean;
}

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/** Kurze Wartezeiten mit unbekanntem Ende. Ersetzt das rotierende Icon. */
export const AsciiSpinner: React.FC<GlyphProps> = ({ className, label, active = true }) => {
  const frame = useAsciiFrames(SPINNER.length, 80, active);
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span aria-hidden="true" className="font-mono">{SPINNER[frame]}</span>
      {label && <span aria-live="polite">{label}</span>}
    </span>
  );
};

const WAVE_BASE = '▁▂▃▄▅▆▇▆▅▄▃▂';

/**
 * Lange Laeufe ohne Prozentwert — Bildgenerierung, Recherche. Zeigt, dass
 * etwas fliesst, nicht wie weit. Genau deshalb nie durch einen Balken
 * ersetzen, dessen Fuellstand geraten waere.
 */
export const AsciiWave: React.FC<GlyphProps & { width?: number }> = ({
  className,
  label,
  active = true,
  width = 12,
}) => {
  const frame = useAsciiFrames(WAVE_BASE.length, 110, active);
  const shifted = (WAVE_BASE.slice(frame) + WAVE_BASE.slice(0, frame)).slice(0, width);
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span aria-hidden="true" className="font-mono tracking-tight">{shifted}</span>
      {label && <span aria-live="polite">{label}</span>}
    </span>
  );
};

/** Nur wenn ein echter Prozentwert existiert. Sonst die Welle. */
export const AsciiProgress: React.FC<{ value: number; className?: string; width?: number }> = ({
  value,
  className,
  width = 20,
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  const filled = Math.round((clamped / 100) * width);
  return (
    <span className={cn('inline-flex items-center gap-2 font-mono tabular-nums', className)}>
      <span aria-hidden="true">
        {'█'.repeat(filled)}
        <span className="opacity-40">{'░'.repeat(width - filled)}</span>
      </span>
      <span aria-live="polite">{clamped}%</span>
    </span>
  );
};

const MARKER = ['▸', '▹', '▸', '▸'];

/** Aktive Zeile in einer Auswahl. Der Pfeil atmet, statt dass eine Flaeche leuchtet. */
export const AsciiMarker: React.FC<GlyphProps> = ({ className, active = true }) => {
  const frame = useAsciiFrames(MARKER.length, 420, active);
  return (
    <span aria-hidden="true" className={cn('font-mono', className)}>
      {active ? MARKER[frame] : MARKER[0]}
    </span>
  );
};

/**
 * Laeuft einmal durch und bleibt dann stehen — unter einem geoeffneten Chip
 * oder als Modus-Signatur. `pattern` gibt dem Modus seine eigene Textur.
 */
export const AsciiSignature: React.FC<{
  pattern: string;
  className?: string;
  active?: boolean;
}> = ({ pattern, className, active = true }) => {
  const frame = useAsciiFrames(pattern.length, 130, active);
  const shifted = pattern.slice(frame) + pattern.slice(0, frame);
  return (
    <span aria-hidden="true" className={cn('font-mono whitespace-nowrap overflow-hidden', className)}>
      {active ? shifted : pattern}
    </span>
  );
};

const DONE = ['·', '∘', '○', '◍', '◉'];

/** Ein Zeichen, kein Konfetti. Laeuft einmal hoch und bleibt auf dem letzten Frame. */
export const AsciiDone: React.FC<GlyphProps> = ({ className, label }) => {
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setStep(DONE.length - 1);
      return;
    }
    const timer = setInterval(
      () => setStep((s) => (s >= DONE.length - 1 ? (clearInterval(timer), s) : s + 1)),
      130,
    );
    return () => clearInterval(timer);
  }, []);
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span aria-hidden="true" className="font-mono">{DONE[step]}</span>
      {label && <span aria-live="polite">{label}</span>}
    </span>
  );
};
