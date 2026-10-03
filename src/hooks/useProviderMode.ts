'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import type { ImageProvider } from '@/config/unified-image-models';
import { useHasPrunaKey } from '@/hooks/useHasPrunaKey';
import { createResourceStore } from '@/lib/client-resource-store';

export interface UseProviderModeResult {
  providerMode: ImageProvider;
  setProviderMode: (mode: ImageProvider) => void;
  prunaAvailable: boolean;
}

interface Capabilities {
  prunaAvailable: boolean;
}

/**
 * Vorher holte jede Instanz ihre eigene Antwort: Popover, Seitenleiste und
 * Werkzeug kamen so auf mehrere Anfragen an /api/capabilities pro Sekunde.
 * Jetzt teilen sie sich einen Abruf mit kurzer Haltbarkeit.
 */
const CAPABILITIES_KEY = 'capabilities';
const CAPABILITIES_TTL = 60_000;

async function fetchCapabilities(): Promise<Capabilities> {
  const res = await fetch('/api/capabilities');
  const data = await res.json();
  return { prunaAvailable: !!data?.prunaAvailable };
}

const capabilitiesStore = createResourceStore<Capabilities>({
  load: fetchCapabilities,
  ttlMs: CAPABILITIES_TTL,
});

const subscribeCapabilities = (onStoreChange: () => void) =>
  capabilitiesStore.subscribe(CAPABILITIES_KEY, onStoreChange);
const getCapabilitiesSnapshot = () => capabilitiesStore.getSnapshot(CAPABILITIES_KEY);

/**
 * Shared source of truth for the image provider (Pollinations vs Pruna).
 *
 * Backed by localStorage (`heyhi-provider-mode`) so every consumer — the Visualize
 * tool state and the config sidebar — stays live-synced via the storage event.
 * Reads Pruna availability through the shared capabilities resource and falls
 * back to Pollinations when Pruna is unavailable.
 */
export function useProviderMode(): UseProviderModeResult {
  const [providerMode, setProviderMode] = useLocalStorageState<ImageProvider>(
    'heyhi-provider-mode',
    'pollinations'
  );
  const hasPrunaKey = useHasPrunaKey();
  const capabilities = useSyncExternalStore(
    subscribeCapabilities,
    getCapabilitiesSnapshot,
    getCapabilitiesSnapshot
  );

  // Fehlschlag zaehlt wie "nicht verfuegbar"; ungeladen bleibt es offen, damit
  // die Entscheidung unten nicht auf einer Vermutung fusst.
  const serverPrunaAvailable = capabilities.data
    ? capabilities.data.prunaAvailable
    : capabilities.error
      ? false
      : null;
  const prunaAvailable = hasPrunaKey || serverPrunaAvailable === true;

  useEffect(() => {
    void capabilitiesStore.load(CAPABILITIES_KEY);
  }, []);

  useEffect(() => {
    if (!hasPrunaKey && serverPrunaAvailable === false && providerMode === 'pruna') {
      setProviderMode('pollinations');
    }
  }, [hasPrunaKey, providerMode, serverPrunaAvailable, setProviderMode]);

  return { providerMode, setProviderMode, prunaAvailable };
}
