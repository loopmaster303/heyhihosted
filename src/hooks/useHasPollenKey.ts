'use client';

import { useEffect, useState } from 'react';
import {
  POLLEN_KEY_CHANGED_EVENT,
  getStoredPollenKey,
} from '@/lib/client-pollen-key';

export function useHasPollenKey(): boolean {
  const [hasPollenKey, setHasPollenKey] = useState<boolean>(() => !!getStoredPollenKey());

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
