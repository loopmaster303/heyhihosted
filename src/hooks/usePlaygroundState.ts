"use client";
import { useCallback } from 'react';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import type { ParamValues } from '@/lib/playground/param-schema';

export type PlaygroundMode = 't2i' | 'i2i' | 't2v' | 'i2v';

export interface PlaygroundState {
  mode: PlaygroundMode;
  modelId: string | null;
  prompt: string;
  params: ParamValues;
  uploads: string[];
  sourceVideo: string | null;
}

const DEFAULT_STATE: PlaygroundState = {
  mode: 't2i',
  modelId: null,
  prompt: '',
  params: {},
  uploads: [],
  sourceVideo: null,
};

/**
 * Ein gespeicherter Zustand ersetzt die Vorgabe vollständig. Ältere Einträge
 * kennen die Felder von heute nicht — vor dem Parameter-Umbau gab es statt
 * `params` noch seed/negativePrompt/guidance/steps. Ein solcher Eintrag ließ
 * `state.params` undefined werden und riss ParamControls mit.
 */
function withDefaults(stored: PlaygroundState): PlaygroundState {
  return {
    ...DEFAULT_STATE,
    ...stored,
    params: stored?.params ?? {},
    uploads: Array.isArray(stored?.uploads) ? stored.uploads : [],
  };
}

export function usePlaygroundState() {
  const [raw, setState] = useLocalStorageState<PlaygroundState>('playgroundState', DEFAULT_STATE);
  const state = withDefaults(raw);

  const patch = useCallback(
    // Auch beim Schreiben normalisieren, damit ein alter Eintrag beim ersten
    // Zugriff geheilt statt fortgeschrieben wird.
    (p: Partial<PlaygroundState>) => setState((prev) => ({ ...withDefaults(prev), ...p })),
    [setState],
  );

  return {
    state,
    setMode: (mode: PlaygroundMode) => patch({ mode }),
    setModelId: (modelId: string | null) => patch({ modelId }),
    setPrompt: (prompt: string) => patch({ prompt }),
    setParams: (params: ParamValues) => patch({ params }),
    setUploads: (uploads: string[]) => patch({ uploads }),
    setSourceVideo: (sourceVideo: string | null) => patch({ sourceVideo }),
    resetForModel: (defaults: Partial<PlaygroundState>) => patch(defaults),
  };
}
