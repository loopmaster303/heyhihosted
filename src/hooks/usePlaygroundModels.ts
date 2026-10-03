'use client';
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useProviderMode } from '@/hooks/useProviderMode';
import { usePollenKey } from '@/hooks/usePollenKey';
import { useShowCommunityModels } from '@/hooks/useShowCommunityModels';
import {
  buildPollinationsEntries,
  buildPrunaEntries,
  type PlaygroundModelEntry,
  type PollinationsLiveModel,
} from '@/lib/playground/model-source';
import { UNIFIED_IMAGE_MODELS } from '@/config/unified-image-models';
import { POLLEN_SERVER_KEY_FREE_IDS } from '@/lib/playground/pollen-model-catalog';
import { createResourceStore } from '@/lib/client-resource-store';

export interface UsePlaygroundModelsResult {
  entries: PlaygroundModelEntry[];
  loading: boolean;
  error: string | null;
  fallbackActive: boolean;
  reload: () => void;
}

/**
 * Der Modellkatalog kommt jetzt aus einem gemeinsamen Puffer: der Schluessel
 * bestimmt die Anfrage, nicht die Zahl der Instanzen. Fehlschlaege landen nicht
 * im Puffer, damit der naechste Aufruf es erneut versuchen darf.
 */
const MODELS_TTL = 60_000;

async function fetchLiveModels(pollenKey: string): Promise<PollinationsLiveModel[]> {
  const headers: Record<string, string> = {};
  if (pollenKey) headers['X-Pollen-Key'] = pollenKey;
  const res = await fetch('/api/pollen/image-models', { headers });
  if (!res.ok) throw new Error(`image-models ${res.status}`);
  const raw = (await res.json()) as PollinationsLiveModel[] | { data: PollinationsLiveModel[] };
  return Array.isArray(raw) ? raw : raw.data ?? [];
}

const liveModelsStore = createResourceStore<PollinationsLiveModel[]>({
  load: fetchLiveModels,
  ttlMs: MODELS_TTL,
});

/**
 * Ohne Live-Daten bleibt der konfigurierte, kostenlose Bestand — und zwar genau
 * der, den der Betreiber-Schluessel laut Live-Messung (2026-09-10) bedienen
 * darf. `isFree` allein reicht dafuer nicht: die Config pflegt das Flag gegen
 * die Registry (isFree ⇔ !paid_only), nicht gegen die Freigabe des Schluessels.
 */
function buildFreeFallback(): PlaygroundModelEntry[] {
  return buildPollinationsEntries(
    UNIFIED_IMAGE_MODELS
      .filter((m) => m.provider === 'pollinations' && m.enabled && m.isFree)
      .filter((m) => POLLEN_SERVER_KEY_FREE_IDS.includes(m.id))
      .map((m) => ({
        name: m.id,
        title: m.name,
        output_modalities: [m.kind],
        input_modalities: m.supportsReference ? ['text', 'image'] : ['text'],
        video_capabilities: m.supportsEndFrame ? ['end_frame'] : [],
        max_reference_images: m.maxImages ?? 0,
        paid_only: !m.isFree,
      }))
  );
}

export function usePlaygroundModels(): UsePlaygroundModelsResult {
  const { providerMode } = useProviderMode();
  const { pollenKey } = usePollenKey();
  const { showCommunity } = useShowCommunityModels();
  const key = pollenKey ?? '';

  const subscribe = useCallback(
    (onStoreChange: () => void) => liveModelsStore.subscribe(key, onStoreChange),
    [key],
  );
  const getSnapshot = useCallback(() => liveModelsStore.getSnapshot(key), [key]);
  const live = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (providerMode === 'pruna') return;
    void liveModelsStore.load(key);
  }, [providerMode, key]);

  const reload = useCallback(() => {
    if (providerMode === 'pruna') return;
    // Erzwingt einen frischen Abruf, auch wenn der Puffer noch gueltig ist.
    void liveModelsStore.load(key, { force: true });
  }, [providerMode, key]);

  const { entries, liveEmpty } = useMemo(() => {
    if (providerMode === 'pruna') {
      return { entries: buildPrunaEntries(), liveEmpty: false };
    }

    const models = live.data;
    if (models === null) {
      // Noch kein Ergebnis: weder Liste noch Rueckfall zeigen. Danach
      // entscheidet der Fehlschlag ueber den Rueckfall.
      return { entries: live.error ? buildFreeFallback() : [], liveEmpty: false };
    }

    const built = buildPollinationsEntries(models)
      .filter((e) => showCommunity || !e.community);
    if (built.length === 0) {
      return { entries: buildFreeFallback(), liveEmpty: true };
    }
    return { entries: built, liveEmpty: false };
  }, [providerMode, live.data, live.error, showCommunity]);

  const loading = providerMode === 'pruna'
    ? false
    : live.isLoading || (live.data === null && !live.error);
  const error = live.error
    ? live.error instanceof Error
      ? live.error.message
      : 'Failed to load models'
    : null;
  const fallbackActive = providerMode === 'pollinations' && (!!live.error || liveEmpty);

  return { entries, loading, error, fallbackActive, reload };
}
