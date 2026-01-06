import { get, set, del, keys } from 'idb-keyval';

/**
 * Local Image Storage Service
 * Handles persisting generated AI images to IndexedDB 
 * to ensure they remain consistent in history/gallery.
 */

export interface StoredImage {
  id: string;
  blob: Blob;
  contentType: string;
  timestamp: number;
}

const IMAGE_STORE_PREFIX = 'hi-image-';

/**
 * Saves an image URL to local IndexedDB
 */
export async function persistRemoteImage(id: string, url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image for persistence');
    
    const blob = await response.blob();
    const stored: StoredImage = {
      id,
      blob,
      contentType: blob.type,
      timestamp: Date.now()
    };
    
    await set(`${IMAGE_STORE_PREFIX}${id}`, stored);
    
    // Create a local URL for immediate use
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error persisting image:', error);
    return url; // Fallback to original URL
  }
}

/**
 * Retrieves a local blob URL for a stored image
 */
export async function getLocalImageUrl(id: string): Promise<string | null> {
  try {
    const stored = await get<StoredImage>(`${IMAGE_STORE_PREFIX}${id}`);
    if (!stored) return null;
    return URL.createObjectURL(stored.blob);
  } catch (error) {
    console.error('Error getting local image:', error);
    return null;
  }
}

/**
 * Cleanup images older than X days
 */
export async function cleanupOldImages(days: number = 3) {
  const now = Date.now();
  const maxAge = days * 24 * 60 * 60 * 1000;
  
  try {
    const allKeys = await keys();
    for (const key of allKeys) {
      if (typeof key === 'string' && key.startsWith(IMAGE_STORE_PREFIX)) {
        const stored = await get<StoredImage>(key);
        if (stored && now - stored.timestamp > maxAge) {
          await del(key);
        }
      }
    }
  } catch (error) {
    console.error('Error during image cleanup:', error);
  }
}
