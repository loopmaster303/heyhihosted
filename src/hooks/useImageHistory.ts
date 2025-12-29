"use client";

import { useState, useCallback, useEffect } from 'react';
import useLocalStorageState from './useLocalStorageState';
import { generateUUID } from '@/lib/uuid';
import type { ImageHistoryItem } from '@/types';

const MAX_HISTORY_ITEMS = 100;

export function useImageHistory() {
    const [imageHistory, setImageHistory] = useLocalStorageState<ImageHistoryItem[]>('imageHistory', []);

    const addImageToHistory = useCallback((item: Omit<ImageHistoryItem, 'id' | 'timestamp'>) => {
        const newItem: ImageHistoryItem = {
            ...item,
            id: generateUUID(),
            timestamp: new Date().toISOString(),
        };

        setImageHistory(prevHistory => {
            const newHistory = [newItem, ...prevHistory];
            // Keep only the most recent items
            return newHistory.slice(0, MAX_HISTORY_ITEMS);
        });
    }, [setImageHistory]);

    // Listen for external updates (e.g. from UnifiedImageTool)
    // using a custom event since 'storage' event only works across tabs
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleExternalUpdate = () => {
                try {
                    const item = window.localStorage.getItem('imageHistory');
                    if (item) {
                        setImageHistory(JSON.parse(item));
                    }
                } catch (e) {
                    console.error("Failed to sync image history:", e);
                }
            };
            
            window.addEventListener('imageHistoryUpdated', handleExternalUpdate);
            return () => window.removeEventListener('imageHistoryUpdated', handleExternalUpdate);
        }
    }, [setImageHistory]);

    const clearImageHistory = useCallback(() => {
        setImageHistory([]);
    }, [setImageHistory]);

    const removeImageFromHistory = useCallback((id: string) => {
        setImageHistory(prevHistory => prevHistory.filter(item => item.id !== id));
    }, [setImageHistory]);

    return {
        imageHistory,
        addImageToHistory,
        clearImageHistory,
        removeImageFromHistory,
    };
}