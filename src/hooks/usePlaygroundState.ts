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
    setParams: (params: ParamValues) => patch({ params }),
    setUploads: (uploads: string[]) => patch({ uploads }),
    setSourceVideo: (sourceVideo: string | null) => patch({ sourceVideo }),
    resetForModel: (defaults: Partial<PlaygroundState>) => patch(defaults),
  };
}
