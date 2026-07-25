import { useMemo, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  const store = useMemo(() => {
    const getSnapshot = () => window.matchMedia(query).matches;
    const subscribe = (onStoreChange: () => void) => {
      const mql = window.matchMedia(query);
      const handler = () => onStoreChange();

      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    };

    return { getSnapshot, subscribe };
  }, [query]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => false);
}
