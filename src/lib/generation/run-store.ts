/**
 * Laufende Pruna-Predictions ueberleben einen Reload.
 *
 * `/api/generate` quittiert lange Laeufe mit 202 + predictionId; das Polling
 * lebt im Tab. Stirbt der Tab, lief der Lauf bei Pruna weiter und wurde
 * abgerechnet, ohne dass jemand davon wusste. Der Eintrag hier ist die
 * Wiederaufnahme: beim Mount liest PlaygroundShell die Liste und haengt fuer
 * jeden Eintrag wieder eine laufende Karte an.
 *
 * Bewusst localStorage ueber safe-storage (Safari-gehärtet, wirft nie): der
 * Schreibvorgang liegt mitten im Generierungspfad. IndexedDB/Dexie waere das
 * zweite Speicher-Ensemble neben HeyHiVault — dafuer gibt es keinen Gegenwert.
 */

import { readLocal, removeLocal, writeLocal } from '@/lib/safe-storage';

const STORAGE_KEY = 'heyhi.prunaRuns.v1';

/** Reissleine: Eintraege, die aelter sind, werden beim Lesen verworfen. */
export const RUN_MAX_AGE_MS = 30 * 60 * 1000;

export interface StoredRun {
  runId: string;
  predictionId: string;
  model: string;
  prompt: string;
  params: Record<string, string | number | boolean>;
  isVideo: boolean;
  aspectRatio?: string;
  startedAt: number;
  /** Eingefrorener Retry-Kontext (R2 = a): "Erneut versuchen" wiederholt genau diesen Lauf. */
  body: unknown;
}

interface StoreShape {
  version: 1;
  runs: StoredRun[];
}

function readAll(): StoredRun[] {
  try {
    const raw = readLocal(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.runs)) return [];
    return parsed.runs.filter(
      (r) => r
        && typeof r.runId === 'string'
        && typeof r.predictionId === 'string'
        && typeof r.model === 'string'
        && typeof r.startedAt === 'number',
    );
  } catch {
    return [];
  }
}

function writeAll(runs: StoredRun[]): void {
  if (runs.length === 0) {
    removeLocal(STORAGE_KEY);
    return;
  }
  const shape: StoreShape = { version: 1, runs };
  writeLocal(STORAGE_KEY, JSON.stringify(shape));
}

export function saveStoredRun(run: StoredRun): void {
  writeAll([...readAll().filter((r) => r.runId !== run.runId), run]);
}

export function removeStoredRun(runId: string): void {
  writeAll(readAll().filter((r) => r.runId !== runId));
}

/** Abgelaufene Eintraege werden beim Lesen verworfen, nicht wiederaufgenommen. */
export function readStoredRuns(): StoredRun[] {
  const now = Date.now();
  const all = readAll();
  const alive = all.filter((r) => now - r.startedAt < RUN_MAX_AGE_MS);
  if (alive.length !== all.length) writeAll(alive);
  return alive;
}
