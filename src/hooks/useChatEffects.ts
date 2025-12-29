/**
 * Chat Effects Hook
 * Handles all useEffect logic for chat functionality
 */

import { useEffect, useRef, useCallback } from 'react';
import { toDate } from '@/utils/chatHelpers';
import type { Conversation } from '@/types';
import { FALLBACK_IMAGE_MODELS, DEFAULT_IMAGE_MODEL } from '@/config/chat-options';

const MAX_STORED_CONVERSATIONS = 50;

interface UseChatEffectsProps {
    // State
    isHistoryPanelOpen: boolean;
    isAdvancedPanelOpen: boolean;
    isGalleryPanelOpen: boolean;
    isInitialLoadComplete: boolean;
    setIsInitialLoadComplete: (complete: boolean) => void;
    allConversations: Conversation[];
    activeConversation: Conversation | null;
    selectedImageModelId: string;

    // Setters
    setIsHistoryPanelOpen: (open: boolean) => void;
    setIsAdvancedPanelOpen: (open: boolean) => void;
    setIsGalleryPanelOpen: (open: boolean) => void;
    setActiveConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
    setAllConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    setAvailableImageModels: (models: string[]) => void;
    setSelectedImageModelId: (modelId: string) => void;
    setLastUserMessageId: (id: string | null) => void;

    // Actions
    startNewChat: () => Conversation | undefined;
    retryLastRequest: () => Promise<void>;
    retryLastRequestRef: React.MutableRefObject<(() => Promise<void>) | null>;
}

export function useChatEffects({
    isHistoryPanelOpen,
    isAdvancedPanelOpen,
    isGalleryPanelOpen,
    isInitialLoadComplete,
    setIsInitialLoadComplete,
    allConversations,
    activeConversation,
    selectedImageModelId,
    setIsHistoryPanelOpen,
    setIsAdvancedPanelOpen,
    setIsGalleryPanelOpen,
    setActiveConversation,
    setAllConversations,
    setAvailableImageModels,
    setSelectedImageModelId,
    setLastUserMessageId,
    startNewChat,
    retryLastRequest,
    retryLastRequestRef,
}: UseChatEffectsProps) {
    // ESC Key handler for all panels (inline, replacing deleted useEscapeKey hook)
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (isHistoryPanelOpen) setIsHistoryPanelOpen(false);
            if (isAdvancedPanelOpen) setIsAdvancedPanelOpen(false);
            if (isGalleryPanelOpen) setIsGalleryPanelOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isHistoryPanelOpen, isAdvancedPanelOpen, isGalleryPanelOpen, setIsHistoryPanelOpen, setIsAdvancedPanelOpen, setIsGalleryPanelOpen]);

    // Initialize available image models from config
    useEffect(() => {
        setAvailableImageModels(FALLBACK_IMAGE_MODELS);
        // Ensure selected model is valid
        if (!FALLBACK_IMAGE_MODELS.includes(selectedImageModelId)) {
            setSelectedImageModelId(DEFAULT_IMAGE_MODEL);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Initial load from localStorage
    useEffect(() => {
        if (!isInitialLoadComplete) {
            const relevantConversations = allConversations.filter(c => c.toolType === 'long language loops');
            if (activeConversation === null && relevantConversations.length > 0) {
                const sortedConvs = [...relevantConversations].sort((a, b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime());
                setActiveConversation(sortedConvs[0]);
            } else if (activeConversation === null && relevantConversations.length === 0) {
                startNewChat();
            }
            setIsInitialLoadComplete(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allConversations, isInitialLoadComplete, activeConversation, startNewChat, setIsInitialLoadComplete, setActiveConversation]);

    // Effect to update the allConversations in localStorage whenever active one changes
    useEffect(() => {
        if (activeConversation && isInitialLoadComplete) {
            setAllConversations(prevAll => {
                const existingIndex = prevAll.findIndex(c => c.id === activeConversation.id);
                if (existingIndex > -1) {
                    const newAll = [...prevAll];
                    newAll[existingIndex] = { ...activeConversation, updatedAt: new Date().toISOString() };
                    return newAll.sort((a, b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime());
                } else {
                    const newAll = [activeConversation, ...prevAll];
                    return newAll.sort((a, b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime());
                }
            });
        }
    }, [activeConversation, setAllConversations, isInitialLoadComplete]);

    // Update ref for toast callback
    useEffect(() => {
        retryLastRequestRef.current = retryLastRequest;
    }, [retryLastRequest, retryLastRequestRef]);
}

