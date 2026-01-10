import { useState, useEffect } from 'react';
import { DatabaseService } from '@/lib/services/database';

/**
 * Hook to safely retrieve and manage a Blob URL for an asset.
 * Automatically revokes the Object URL on unmount or ID change.
 */
export function useAssetUrl(assetId?: string, initialUrl?: string) {
  const [url, setUrl] = useState<string | null>(initialUrl || null);
  const [isLoading, setIsLoading] = useState(!!assetId);

  useEffect(() => {
    if (!assetId) {
      setUrl(initialUrl || null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let objectUrl: string | null = null;

    const loadAsset = async () => {
      setIsLoading(true);
      try {
        const asset = await DatabaseService.getAsset(assetId);
        if (asset && isMounted) {
          if (asset.blob) {
            objectUrl = URL.createObjectURL(asset.blob);
            setUrl(objectUrl);
            return;
          }
          if (asset.remoteUrl) {
            setUrl(asset.remoteUrl);
            return;
          }
          if (asset.storageKey) {
            const res = await fetch('/api/upload/sign-read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key: asset.storageKey }),
            });
            const data = await res.json();
            if (res.ok && data?.downloadUrl) {
              setUrl(data.downloadUrl);
              return;
            }
          }
        }
      } catch (error) {
        console.error(`Failed to load asset URL for ${assetId}:`, error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadAsset();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [assetId, initialUrl]);

  return { url, isLoading };
}
