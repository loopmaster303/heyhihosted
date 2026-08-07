"use client";
import { useCallback } from 'react';
import useLocalStorageState from '@/hooks/useLocalStorageState';

export type PlaygroundMode = 't2i' | 'i2i' | 't2v' | 'i2v';

export interface PlaygroundState {
  mode: PlaygroundMode;
  modelId: string | null;
  prompt: string;
  aspectRatio: string | null;
  durationSeconds: number | null;
  seed: string;
  negativePrompt: string;
  guidance: string;
  steps: string;
  uploads: string[];
  sourceVideo: string | null;
}

const DEFAULT_STATE: PlaygroundState = {
  mode: 't2i',
  modelId: null,
  prompt: '',
  aspectRatio: null,
  durationSeconds: null,
  seed: '',
  negativePrompt: '',
  guidance: '',
  steps: '',
  uploads: [],
  sourceVideo: null,
};

export function usePlaygroundState() {
  const [state, setState] = useLocalStorageState<PlaygroundState>('playgroundState', DEFAULT_STATE);

  const patch = useCallback(
    (p: Partial<PlaygroundState>) => setState((prev) => ({ ...prev, ...p })),
    [setState],
  );

  return {
    state,
    setMode: (mode: PlaygroundMode) => patch({ mode }),
    setModelId: (modelId: string | null) => patch({ modelId }),
    setPrompt: (prompt: string) => patch({ prompt }),
    setAspectRatio: (aspectRatio: string | null) => patch({ aspectRatio }),
    setDurationSeconds: (durationSeconds: number | null) => patch({ durationSeconds }),
    setAdvanced: (advanced: Partial<Pick<PlaygroundState, 'seed'|'negativePrompt'|'guidance'|'steps'>>) => patch(advanced),
    setUploads: (uploads: string[]) => patch({ uploads }),
    setSourceVideo: (sourceVideo: string | null) => patch({ sourceVideo }),
    resetForModel: (defaults: Partial<PlaygroundState>) => patch(defaults),
  };
}
