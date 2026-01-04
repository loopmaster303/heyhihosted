/**
 * Chat Effects Hook
 * Handles all useEffect logic for chat functionality
 */

import { useEffect, useRef } from 'react';
import { toDate } from '@/utils/chatHelpers';
import type { Conversation } from '@/types';
import { FALLBACK_IMAGE_MODELS, DEFAULT_IMAGE_MODEL } from '@/config/chat-options';

interface UseChatEffectsProps {
    // State
    isHistoryPanelOpen: boolean;
    isAdvancedPanelOpen: boolean;
    isGalleryPanelOpen: boolean;
    isInitialLoadComplete: boolean;
    allConversations: Conversation[];
    activeConversation: Conversation | null;
    persistedActiveConversationId: string | null;
    selectedImageModelId: string;

    // Setters
    setIsInitialLoadComplete: (complete: boolean) => void;
    setIsHistoryPanelOpen: (open: boolean) => void;
    setIsAdvancedPanelOpen: (open: boolean) => void;
    setIsGalleryPanelOpen: (open: boolean) => void;
    setActiveConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
    setPersistedActiveConversationId: (id: string | null) => void;
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
    allConversations,
    activeConversation,
    persistedActiveConversationId,
    selectedImageModelId,
    setIsInitialLoadComplete,
    setIsHistoryPanelOpen,
    setIsAdvancedPanelOpen,
    setIsGalleryPanelOpen,
    setActiveConversation,
    setPersistedActiveConversationId,
    setAllConversations,
    setAvailableImageModels,
    setSelectedImageModelId,
    setLastUserMessageId,
    startNewChat,
    retryLastRequest,
    retryLastRequestRef,
}: UseChatEffectsProps) {
    // ESC Key handler for all panels
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
            
            let conversationToRestore: Conversation | undefined;

            // Try to restore from persisted ID
            if (persistedActiveConversationId) {
                conversationToRestore = relevantConversations.find(c => c.id === persistedActiveConversationId);
            }

            if (conversationToRestore) {
                setActiveConversation(conversationToRestore);
            } else if (activeConversation === null && relevantConversations.length > 0 && !persistedActiveConversationId) {
                // Default to most recent ONLY if we don't have a persisted ID preference
                const sortedConvs = [...relevantConversations].sort((a, b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime());
                setActiveConversation(sortedConvs[0]);
            } else if (activeConversation === null && relevantConversations.length === 0) {
                startNewChat();
            }
            setIsInitialLoadComplete(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allConversations, isInitialLoadComplete, activeConversation, startNewChat, setIsInitialLoadComplete, setActiveConversation, persistedActiveConversationId]);

    // Sync active conversation ID to persistence
    useEffect(() => {
        if (activeConversation) {
            setPersistedActiveConversationId(activeConversation.id);
        }
    }, [activeConversation, setPersistedActiveConversationId]);

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