"use client";

import { useEffect, useState } from 'react';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import type { ImageProvider } from '@/config/unified-image-models';

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
  const [prunaAvailable, setPrunaAvailable] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/capabilities')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const available = !!data.prunaAvailable;
        setPrunaAvailable(available);
        if (!available && providerMode === 'pruna') {
          setProviderMode('pollinations');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPrunaAvailable(false);
          setProviderMode('pollinations');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [providerMode, setProviderMode]);

  return { providerMode, setProviderMode, prunaAvailable };
}
