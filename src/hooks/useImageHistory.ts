import { useState, useEffect, useCallback } from 'react';
import useLocalStorageState from './useLocalStorageState';
import { DatabaseService } from '@/lib/services/database';

export interface ImageHistoryItem {
  id: string;
  imageUrl: string;
  videoUrl?: string;
  prompt: string;
  model: string;
  timestamp: string;
  toolType: 'premium imagination' | 'nocost imagination' | 'visualize';
  conversationId?: string;
}

/**
 * useImageHistory Hook (Robust Hybrid Mode)
 * 1. Sanitizes LocalStorage: Removes dead 'blob:' URLs immediately on load.
 * 2. Hydrates from DB: Creates fresh Blob URLs from IndexedDB assets.
 * 3. Fallback: Uses remote URLs if available and DB is empty.
 */
export function useImageHistory() {
  // 1. Raw Data from LocalStorage
  const [localHistory, setLocalHistory] = useLocalStorageState<ImageHistoryItem[]>('imageHistory', []);
  
  // 2. Cleaned History (No dead blobs)
  const [displayHistory, setDisplayHistory] = useState<ImageHistoryItem[]>([]);
  
  // 3. Fresh Blob URLs from DB
  const [dbBlobUrls, setDbBlobUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Sanitize and Merge Logic
  useEffect(() => {
    const sanitized = localHistory.map(item => {
      // If it's a blob URL stored in LS, it's 100% dead after reload. Kill it.
      if (item.imageUrl && item.imageUrl.startsWith('blob:')) {
        return { ...item, imageUrl: '' }; // Mark as empty, waiting for DB or Remote
      }
      return item;
    });
    
    // Merge with active DB blobs
    const merged = sanitized.map(item => ({
      ...item,
      imageUrl: dbBlobUrls[item.id] || item.imageUrl // Prefer DB blob, then Remote, then Empty
    })).filter(item => item.imageUrl !== ''); // Only show items that have a valid URL (Remote or DB)

    setDisplayHistory(merged);
  }, [localHistory, dbBlobUrls]);

  // DB Loader
  const loadFromDb = useCallback(async () => {
    try {
      setIsLoading(true);
      const assets = await DatabaseService.getAllAssets();
      const newUrls: Record<string, string> = {};
      
      assets.forEach(asset => {
        if (asset.blob) {
          newUrls[asset.id] = URL.createObjectURL(asset.blob);
        }
      });

      setDbBlobUrls(prev => {
        // Cleanup old URLs that are gone/changed
        Object.entries(prev).forEach(([id, url]) => {
          if (!newUrls[id]) URL.revokeObjectURL(url);
        });
        return newUrls;
      });
    } catch (e) {
      console.error("DB Load failed:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial Load & Event Listener
  useEffect(() => {
    loadFromDb();

    const handleUpdate = () => {
      // Reload LS
      const existing = window.localStorage.getItem('imageHistory');
      if (existing) {
        try {
          setLocalHistory(JSON.parse(existing));
        } catch(e) {}
      }
      // Reload DB
      loadFromDb();
    };

    window.addEventListener('imageHistoryUpdated', handleUpdate);
    return () => window.removeEventListener('imageHistoryUpdated', handleUpdate);
  }, [loadFromDb, setLocalHistory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setDbBlobUrls(urls => {
        Object.values(urls).forEach(u => URL.revokeObjectURL(u));
        return {};
      });
    };
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    // 1. UI Optimistic Update
    setLocalHistory(prev => prev.filter(i => i.id !== id));
    // 2. DB Delete
    try {
      await DatabaseService.deleteAsset(id);
      // Revoke URL immediately
      if (dbBlobUrls[id]) {
        URL.revokeObjectURL(dbBlobUrls[id]);
        setDbBlobUrls(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    } catch (e) { console.error("Delete failed:", e); }
  }, [setLocalHistory, dbBlobUrls]);

  const clearHistory = useCallback(async () => {
    setLocalHistory([]);
    // Optional: Wipe DB too?
    // await DatabaseService.clearAssets(); // If method existed
  }, [setLocalHistory]);

  return {
    imageHistory: displayHistory,
    deleteItem,
    clearHistory,
    addImageToHistory: () => {},
    isHydrating: isLoading
  };
}
