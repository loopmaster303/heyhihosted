'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'playgroundShowCommunityModels';
export const COMMUNITY_MODELS_CHANGED_EVENT = 'playground-community-models-changed';

function read(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

/**
 * Pollinations führt neben den eigenen Modellen auch von der Community
 * beigesteuerte, die als experimentell gelten. Sie bleiben standardmäßig
 * ausgeblendet und lassen sich in den Einstellungen zuschalten.
 */
export function useShowCommunityModels(): { showCommunity: boolean; setShowCommunity: (v: boolean) => void } {
  const [showCommunity, setLocal] = useState<boolean>(read);

  useEffect(() => {
    const sync = () => setLocal(read());
    window.addEventListener('storage', sync);
    window.addEventListener(COMMUNITY_MODELS_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(COMMUNITY_MODELS_CHANGED_EVENT, sync);
    };
  }, []);

  const setShowCommunity = useCallback((v: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(v));
    setLocal(v);
    // Weckt die anderen Verbraucher im selben Tab; 'storage' feuert nur über Tabs hinweg.
    window.dispatchEvent(new Event(COMMUNITY_MODELS_CHANGED_EVENT));
  }, []);

  return { showCommunity, setShowCommunity };
}
