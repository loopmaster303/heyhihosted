import { useState, useEffect, useCallback } from 'react';
import useLocalStorageState from './useLocalStorageState';

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
 * useImageHistory Hook
 * Verfaltet nur noch die Liste der Einträge. 
 * Die eigentliche Bild-Hydrierung passiert jetzt in der GalleryImage Komponente.
 */
export function useImageHistory() {
  const [history, setHistory] = useLocalStorageState<ImageHistoryItem[]>('imageHistory', []);

  // Wir brauchen keine interne hydratedHistory mehr, da die Komponenten selbst laden.
  
  const addImageToHistory = useCallback((item: ImageHistoryItem) => {
    setHistory(prev => {
      // Dubletten-Check
      if (prev.find(i => i.id === item.id)) return prev;
      return [item, ...prev];
    });
  }, [setHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  const deleteItem = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, [setHistory]);

  return {
    imageHistory: history,
    addImageToHistory,
    clearHistory,
    deleteItem,
    isHydrating: false // Immer false, da Komponenten on-demand laden
  };
}
