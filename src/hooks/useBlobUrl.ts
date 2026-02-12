import { useMemo, useEffect } from 'react';
import { BlobManager } from '@/lib/blob-manager';

/**
 * Hook to create and automatically manage a blob URL.
 * Automatically releases the URL on component unmount or when blob changes.
 *
 * @param blob The blob to create a URL for
 * @param context Optional context string for debugging
 * @returns The blob URL or null if no blob provided
 */
export function useBlobUrl(blob: Blob | null, context?: string): string | null {
  const url = useMemo(() => {
    if (!blob) return null;
    return BlobManager.createURL(blob, context);
  }, [blob, context]);

  useEffect(() => {
    return () => {
      if (url) {
        BlobManager.releaseURL(url);
      }
    };
  }, [url]);

  return url;
}

/**
 * Hook to manage multiple blob URLs.
 * Useful for galleries or lists of images.
 *
 * @param blobs Array of blobs to create URLs for
 * @param context Optional context string for debugging
 * @returns Array of blob URLs in the same order as input blobs
 */
export function useBlobUrls(blobs: (Blob | null)[], context?: string): (string | null)[] {
  const urls = useMemo(() => {
    return blobs.map((blob, index) => {
      if (!blob) return null;
      return BlobManager.createURL(blob, context ? `${context}[${index}]` : undefined);
    });
  }, [blobs, context]);

  useEffect(() => {
    return () => {
      urls.forEach(url => {
        if (url) BlobManager.releaseURL(url);
      });
    };
  }, [urls]);

  return urls;
}
