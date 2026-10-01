/**
 * Chat Effects Hook
 * Handles all useEffect logic for chat functionality
 */

import { useEffect } from 'react';
import { toDate } from '@/utils/chatHelpers';
import type { Conversation } from '@/types';
import { DatabaseService } from '@/lib/services/database';
import { interruptPendingMedia } from '@/lib/chat/chat-media-intent-handler';

interface UseChatEffectsProps {
    // State
    isInitialLoadComplete: boolean;
    allConversations: Conversation[];
    activeConversation: Conversation | null;
    persistedActiveConversationId: string | null;

    // Setters
    setActiveConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
    setPersistedActiveConversationId: (id: string | null) => void;

    // Actions
    startNewChat: () => Conversation | undefined;
    retryLastRequest: () => Promise<void>;
    retryLastRequestRef: React.MutableRefObject<(() => Promise<void>) | null>;
    saveConversation: (conv: any) => Promise<void>;
    deleteConversation: (id: string) => Promise<void>;
}

export function useChatEffects({
    isInitialLoadComplete,
    allConversations,
    activeConversation,
    persistedActiveConversationId,
    setActiveConversation,
    setPersistedActiveConversationId,
    startNewChat,
    retryLastRequest,
    retryLastRequestRef,
    saveConversation,
    deleteConversation,
}: UseChatEffectsProps) {
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
                setActiveConversation(interruptPendingMedia(conversationToRestore));
            } else if (allConversations.length > 0) {
                const full = await DatabaseService.getFullConversation(allConversations[0].id);
                setActiveConversation(full ? interruptPendingMedia(full as Conversation) : (full as any));
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
