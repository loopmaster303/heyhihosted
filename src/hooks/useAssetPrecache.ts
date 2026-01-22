import { useEffect, useState } from 'react';
import { precacheAssets } from '@/lib/services/asset-fallback-service';

/**
 * Hook to precache multiple assets in the background.
 * Useful for gallery views to ensure assets are available offline.
 *
 * @param assetIds Array of asset IDs to precache
 * @param enabled Whether precaching is enabled (default: true)
 */
export function useAssetPrecache(assetIds: string[], enabled: boolean = true) {
  const [isPrecaching, setIsPrecaching] = useState(false);
  const [precachedCount, setPrecachedCount] = useState(0);

  useEffect(() => {
    if (!enabled || assetIds.length === 0) {
      return;
    }

    let isMounted = true;

    const doPrecache = async () => {
      setIsPrecaching(true);
      setPrecachedCount(0);

      try {
        await precacheAssets(assetIds);
        if (isMounted) {
          setPrecachedCount(assetIds.length);
        }
      } catch (error) {
        console.error('[useAssetPrecache] Precache failed:', error);
      } finally {
        if (isMounted) {
          setIsPrecaching(false);
        }
      }
    };

    // Debounce precaching to avoid rapid re-runs
    const timeoutId = setTimeout(doPrecache, 500);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [assetIds, enabled]);

  return { isPrecaching, precachedCount };
}
