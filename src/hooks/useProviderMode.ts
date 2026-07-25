"use client";

import { useEffect, useState } from 'react';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import type { ImageProvider } from '@/config/unified-image-models';
import { useHasPrunaKey } from '@/hooks/useHasPrunaKey';

export interface UseProviderModeResult {
  providerMode: ImageProvider;
  setProviderMode: (mode: ImageProvider) => void;
  prunaAvailable: boolean;
}

/**
 * Shared source of truth for the image provider (Pollinations vs Pruna).
 *
 * Backed by localStorage (`heyhi-provider-mode`) so every consumer — the Visualize
 * tool state and the config sidebar — stays live-synced via the storage event.
 * Fetches `/api/capabilities` for Pruna availability and falls back to Pollinations
 * when Pruna is unavailable.
 */
export function useProviderMode(): UseProviderModeResult {
  const [providerMode, setProviderMode] = useLocalStorageState<ImageProvider>(
    'heyhi-provider-mode',
    'pollinations'
  );
  const hasPrunaKey = useHasPrunaKey();
  const [serverPrunaAvailable, setServerPrunaAvailable] = useState<boolean | null>(null);
  const prunaAvailable = hasPrunaKey || serverPrunaAvailable === true;

  useEffect(() => {
    let cancelled = false;
    fetch('/api/capabilities')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setServerPrunaAvailable(!!data.prunaAvailable);
      })
      .catch(() => {
        if (!cancelled) {
          setServerPrunaAvailable(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasPrunaKey && serverPrunaAvailable === false && providerMode === 'pruna') {
      setProviderMode('pollinations');
    }
  }, [hasPrunaKey, providerMode, serverPrunaAvailable, setProviderMode]);

  return { providerMode, setProviderMode, prunaAvailable };
}
