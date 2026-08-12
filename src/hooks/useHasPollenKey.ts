'use client';

import { useEffect, useState } from 'react';
import {
  POLLEN_KEY_CHANGED_EVENT,
  getStoredPollenKey,
} from '@/lib/client-pollen-key';

export function useHasPollenKey(): boolean {
  // Bewusst NICHT synchron aus dem localStorage initialisieren: Der Server
  // rendert mit false, der Client mit hinterlegtem Key mit true — und die
  // Hydration bricht. Der Effekt synchronisiert direkt nach dem Mount.
  const [hasPollenKey, setHasPollenKey] = useState<boolean>(false);

  useEffect(() => {
    const sync = () => {
      setHasPollenKey(!!getStoredPollenKey());
    };

    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(POLLEN_KEY_CHANGED_EVENT, sync);

    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(POLLEN_KEY_CHANGED_EVENT, sync);
    };
  }, []);

  return hasPollenKey;
}
