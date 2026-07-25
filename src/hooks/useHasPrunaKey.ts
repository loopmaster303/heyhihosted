'use client';

import { usePrunaKey } from '@/hooks/usePrunaKey';

export function useHasPrunaKey(): boolean {
  return usePrunaKey().isConnected;
}
