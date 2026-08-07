"use client";
import { useCallback, useEffect, useState } from 'react';
import { useProviderMode } from '@/hooks/useProviderMode';
import { usePollenKey } from '@/hooks/usePollenKey';
import {
  buildPollinationsEntries,
  buildPrunaEntries,
  type PlaygroundModelEntry,
  type PollinationsLiveModel,
} from '@/lib/playground/model-source';
import { UNIFIED_IMAGE_MODELS } from '@/config/unified-image-models';

export interface UsePlaygroundModelsResult {
  entries: PlaygroundModelEntry[];
  loading: boolean;
  error: string | null;
  fallbackActive: boolean;
  reload: () => void;
}

export function usePlaygroundModels(): UsePlaygroundModelsResult {
  const { providerMode } = useProviderMode();
  const { pollenKey } = usePollenKey();
  const [entries, setEntries] = useState<PlaygroundModelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackActive, setFallbackActive] = useState(false);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFallbackActive(false);

    if (providerMode === 'pruna') {
      setEntries(buildPrunaEntries());
      setLoading(false);
      return () => {};
    }

    (async () => {
      try {
        const headers: Record<string, string> = {};
        if (pollenKey) headers['X-Pollen-Key'] = pollenKey;
        const res = await fetch('/api/pollen/image-models', { headers });
        if (!res.ok) throw new Error(`image-models ${res.status}`);
        const raw = (await res.json()) as PollinationsLiveModel[] | { data: PollinationsLiveModel[] };
        const live = Array.isArray(raw) ? raw : raw.data ?? [];
        if (cancelled) return;
        setEntries(buildPollinationsEntries(live));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load models');
        setFallbackActive(true);
        setEntries(
          buildPollinationsEntries(
            UNIFIED_IMAGE_MODELS
              .filter((m) => m.provider === 'pollinations' && m.enabled && m.isFree)
              .map((m) => ({ id: m.id, outputModalities: [m.kind], inputModalities: m.supportsReference ? ['text', 'image'] : ['text'], name: m.name }))
          ),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [providerMode, pollenKey, nonce]);

  return { entries, loading, error, fallbackActive, reload };
}
