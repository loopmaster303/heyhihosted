import { useState, useEffect, useCallback, useRef } from 'react';
import { resolveAssetUrl, refreshAssetUrl } from '@/lib/services/asset-fallback-service';
import { BlobManager } from '@/lib/blob-manager';

/**
 * Hook to safely retrieve and manage a Blob URL for an asset.
 * Automatically revokes the Object URL on unmount or ID change.
 * Uses AssetFallbackService for comprehensive fallback logic with retry.
 */
export function useAssetUrl(assetId?: string, initialUrl?: string) {
  const [url, setUrl] = useState<string | null>(initialUrl || null);
  const [isLoading, setIsLoading] = useState(!!assetId);
  const [error, setError] = useState<string | null>(null);

  // Track if we need to cleanup a blob URL
  const [needsCleanup, setNeedsCleanup] = useState(false);
  const activeUrlRef = useRef<{ url: string | null; needsCleanup: boolean }>({
    url: initialUrl || null,
    needsCleanup: false,
  });

  useEffect(() => {
    if (!assetId) {
      // If the previous resolved URL was blob-backed, release it when asset binding disappears.
      if (activeUrlRef.current.url && activeUrlRef.current.needsCleanup) {
        BlobManager.releaseURL(activeUrlRef.current.url);
      }

      activeUrlRef.current = { url: initialUrl || null, needsCleanup: false };
      setUrl(initialUrl || null);
      setNeedsCleanup(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    let currentUrl: string | null = null;
    let currentNeedsCleanup = false;

    const loadAsset = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await resolveAssetUrl(assetId, {
          maxRetries: 3,
          downloadMissingBlob: true,
        });

        if (result.url && isMounted) {
          currentUrl = result.url;
          currentNeedsCleanup = result.needsCleanup;
          activeUrlRef.current = { url: result.url, needsCleanup: result.needsCleanup };
          setUrl(result.url);
          setNeedsCleanup(result.needsCleanup);
        } else if (isMounted) {
          setError('Asset URL could not be resolved');
        }
      } catch (err) {
        if (isMounted) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          console.error(`Failed to load asset URL for ${assetId}:`, errorMsg);
          setError(errorMsg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAsset();

    return () => {
      isMounted = false;
      // Cleanup the current active blob URL tracked by this hook.
      if (activeUrlRef.current.url && activeUrlRef.current.needsCleanup) {
        BlobManager.releaseURL(activeUrlRef.current.url);
      }
      // Keep local vars consistent for safety/debugging.
      currentUrl = null;
      currentNeedsCleanup = false;
    };
  }, [assetId, initialUrl]);

  // Allow manual refresh for expired URLs
  const refresh = useCallback(async () => {
    if (!assetId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await refreshAssetUrl(assetId);
      if (result.url) {
        // Cleanup old URL if needed
        if (activeUrlRef.current.url && activeUrlRef.current.needsCleanup) {
          BlobManager.releaseURL(activeUrlRef.current.url);
        }
        activeUrlRef.current = { url: result.url, needsCleanup: result.needsCleanup };
        setUrl(result.url);
        setNeedsCleanup(result.needsCleanup);
      } else {
        setError('Failed to refresh asset URL');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to refresh asset URL for ${assetId}:`, errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [assetId]);

  return { url, isLoading, error, refresh };
}
