'use client';

import { useCallback, useEffect, useState } from 'react';
import { readLocal, writeLocal } from '@/lib/safe-storage';

const STORAGE_KEY = 'playgroundShowCommunityModels';
export const COMMUNITY_MODELS_CHANGED_EVENT = 'playground-community-models-changed';

/**
 * Pollinations führt neben den eigenen Modellen auch von der Community
 * beigesteuerte, die als experimentell gelten. Sie bleiben standardmäßig
 * ausgeblendet und lassen sich in den Einstellungen zuschalten.
 *
 * Der gespeicherte Wert wird erst nach dem Mounten gelesen, nicht schon im
 * Initialisierer: sonst liefert der Server false und der Client womöglich true,
 * und die Hydration bricht.
 */
export function useShowCommunityModels(): { showCommunity: boolean; setShowCommunity: (v: boolean) => void } {
  const [showCommunity, setLocal] = useState(false);

  useEffect(() => {
    const sync = () => setLocal(readLocal(STORAGE_KEY) === 'true');
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(COMMUNITY_MODELS_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(COMMUNITY_MODELS_CHANGED_EVENT, sync);
    };
  }, []);

  const setShowCommunity = useCallback((v: boolean) => {
    writeLocal(STORAGE_KEY, String(v));
    setLocal(v);
    // Weckt die anderen Verbraucher im selben Tab; 'storage' feuert nur über Tabs hinweg.
    window.dispatchEvent(new Event(COMMUNITY_MODELS_CHANGED_EVENT));
  }, []);

  return { showCommunity, setShowCommunity };
}
