'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getStoredPrunaKey,
  PRUNA_KEY_CHANGED_EVENT,
  removeStoredPrunaKey,
  storePrunaKey,
} from '@/lib/client-pruna-key';

export interface UsePrunaKeyReturn {
  prunaKey: string | null;
  isConnected: boolean;
  connect: (key: string) => boolean;
  disconnect: () => void;
}

export function usePrunaKey(): UsePrunaKeyReturn {
  const [prunaKey, setPrunaKey] = useState<string | null>(() => getStoredPrunaKey());

  useEffect(() => {
    const sync = () => setPrunaKey(getStoredPrunaKey());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(PRUNA_KEY_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(PRUNA_KEY_CHANGED_EVENT, sync);
    };
  }, []);

  const connect = useCallback((rawKey: string) => {
    const storedKey = storePrunaKey(rawKey);
    if (!storedKey) return false;
    setPrunaKey(storedKey);
    return true;
  }, []);

  const disconnect = useCallback(() => {
    removeStoredPrunaKey();
    setPrunaKey(null);
  }, []);

  return { prunaKey, isConnected: !!prunaKey, connect, disconnect };
}
