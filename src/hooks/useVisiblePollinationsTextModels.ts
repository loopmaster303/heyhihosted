'use client';

import { useMemo } from 'react';
import {
  getVisiblePollinationsModels,
  isKnownPollinationsTextModelId,
} from '@/config/chat-options';
import { useHasPollenKey } from './useHasPollenKey';

export function useVisiblePollinationsTextModels() {
  const hasByopKey = useHasPollenKey();
  const visibleModels = useMemo(() => getVisiblePollinationsModels(), []);
  const visibleModelIds = useMemo(
    () => visibleModels.map((model) => model.id),
    [visibleModels],
  );

  return {
    hasByopKey,
    visibleModels,
    visibleModelIds,
    findModelById: (id?: string) => visibleModels.find((model) => model.id === id),
    isKnownModelId: (id?: string) => !!id && isKnownPollinationsTextModelId(id),
  };
}
