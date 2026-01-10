/**
 * Chat Effects Hook
 * Handles all useEffect logic for chat functionality
 */

import { useEffect } from 'react';
import { toDate } from '@/utils/chatHelpers';
import type { Conversation } from '@/types';
import { FALLBACK_IMAGE_MODELS, DEFAULT_IMAGE_MODEL } from '@/config/chat-options';
import { DatabaseService } from '@/lib/services/database';

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
    setIsHistoryPanelOpen: (open: boolean) => void;
    setIsAdvancedPanelOpen: (open: boolean) => void;
    setActiveConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
    setPersistedActiveConversationId: (id: string | null) => void;
    setAvailableImageModels: (models: string[]) => void;
    setSelectedImageModelId: (modelId: string) => void;

    // Actions
    startNewChat: () => Conversation | undefined;
    retryLastRequest: () => Promise<void>;
    retryLastRequestRef: React.MutableRefObject<(() => Promise<void>) | null>;
    saveConversation: (conv: any) => Promise<void>;
    deleteConversation: (id: string) => Promise<void>;
}

export function useChatEffects({
    isHistoryPanelOpen,
    isAdvancedPanelOpen,
    isInitialLoadComplete,
    allConversations,
    activeConversation,
    persistedActiveConversationId,
    selectedImageModelId,
    setIsHistoryPanelOpen,
    setIsAdvancedPanelOpen,
    setActiveConversation,
    setPersistedActiveConversationId,
    setAvailableImageModels,
    setSelectedImageModelId,
    startNewChat,
    retryLastRequest,
    retryLastRequestRef,
    saveConversation,
    deleteConversation,
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

    // Initial restore logic
    useEffect(() => {
        if (!isInitialLoadComplete || activeConversation) return;

        const restore = async () => {
            // Filter out empty chats immediately (Zombie Cleanup)
            // Note: allConversations from liveQuery only has metadata, so we check messages existence differently if needed,
            // but for now let's assume metadata is enough or we clean up periodically.
            
            let conversationToRestore: Conversation | undefined;

            if (persistedActiveConversationId) {
                const full = await DatabaseService.getFullConversation(persistedActiveConversationId);
                if (full) conversationToRestore = full as any;
            }

            if (conversationToRestore) {
                setActiveConversation(conversationToRestore);
            } else if (allConversations.length > 0) {
                const full = await DatabaseService.getFullConversation(allConversations[0].id);
                setActiveConversation(full as any);
            } else {
                startNewChat();
            }
        };
        restore();
    }, [activeConversation, allConversations, isInitialLoadComplete, persistedActiveConversationId, startNewChat, setActiveConversation]);

    // Sync active conversation ID to persistence
    useEffect(() => {
        if (activeConversation) {
            setPersistedActiveConversationId(activeConversation.id);
        }
    }, [activeConversation, setPersistedActiveConversationId]);

    // Auto-save active conversation to DB
    useEffect(() => {
        if (activeConversation && isInitialLoadComplete) {
            // Logic to prevent empty chat spam
            if (activeConversation.messages.length === 0) {
                // If it's a new empty chat, we don't save it yet to allConversations list
                // (It stays in memory until first message)
                return;
            }
            
            saveConversation(activeConversation);
        }
    }, [activeConversation, isInitialLoadComplete, saveConversation]);

    // Update ref for toast callback
    useEffect(() => {
        retryLastRequestRef.current = retryLastRequest;
    }, [retryLastRequest, retryLastRequestRef]);
}
