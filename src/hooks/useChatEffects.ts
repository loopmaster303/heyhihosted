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
    isInitialLoadComplete: boolean;
    allConversations: Conversation[];
    activeConversation: Conversation | null;
    persistedActiveConversationId: string | null;
    selectedImageModelId: string;

    // Setters
    setIsInitialLoadComplete: (complete: boolean) => void;
    setIsHistoryPanelOpen: (open: boolean) => void;
    setIsAdvancedPanelOpen: (open: boolean) => void;
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
    isInitialLoadComplete,
    allConversations,
    activeConversation,
    persistedActiveConversationId,
    selectedImageModelId,
    setIsInitialLoadComplete,
    setIsHistoryPanelOpen,
    setIsAdvancedPanelOpen,
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
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isHistoryPanelOpen, isAdvancedPanelOpen, setIsHistoryPanelOpen, setIsAdvancedPanelOpen]);

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
            // Filter out empty chats immediately (Zombie Cleanup)
            const validConversations = allConversations.filter(c => c.messages.length > 0 && c.toolType === 'long language loops');
            
            // If we found empty ones, clean up localStorage
            if (validConversations.length !== allConversations.filter(c => c.toolType === 'long language loops').length) {
                 setAllConversations(prev => prev.filter(c => c.messages.length > 0 || c.toolType !== 'long language loops'));
            }

            let conversationToRestore: Conversation | undefined;

            // Try to restore from persisted ID
            if (persistedActiveConversationId) {
                conversationToRestore = validConversations.find(c => c.id === persistedActiveConversationId);
            }

            if (conversationToRestore) {
                setActiveConversation(conversationToRestore);
            } else if (validConversations.length > 0) {
                // Default to most recent if no ID or ID invalid
                const sortedConvs = [...validConversations].sort((a, b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime());
                setActiveConversation(sortedConvs[0]);
            } else {
                // Only start new chat if truly nothing valid exists
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
            // Only persist if it has messages OR if it already exists in history (to allow deleting messages back to empty?)
            // Actually, we want to prevent empty "New Chat" spam.
            if (activeConversation.messages.length === 0) {
                // If it's a new empty chat, do NOT add it to allConversations yet.
                // If it was already there (cleared manually), we might want to keep it or remove it?
                // Let's go with: Auto-delete empty chats from history list.
                setAllConversations(prevAll => {
                    const exists = prevAll.find(c => c.id === activeConversation.id);
                    if (exists) {
                        // If it exists but is now empty, remove it? Or keep it?
                        // User preference: "empty chats not kept". So remove it.
                        return prevAll.filter(c => c.id !== activeConversation.id);
                    }
                    return prevAll;
                });
                return;
            }

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