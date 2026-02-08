/**
 * Chat State Management Hook
 * Manages all useState and useRef declarations for chat functionality
 */

import { useState, useRef, useEffect } from 'react';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import type { ChatMessage } from '@/types';
import { DEFAULT_IMAGE_MODEL } from '@/config/chat-options';
import { MigrationService } from '@/lib/services/migration';
import { useChatPersistence } from './useChatPersistence';
import { useChatUI } from './useChatUI';
import { useChatMedia } from './useChatMedia';

export function useChatState() {
    // Specialized Hooks
    const persistence = useChatPersistence();
    const ui = useChatUI();
    const media = useChatMedia();

    // Migration logic
    useEffect(() => {
        const init = async () => {
            await MigrationService.migrateIfNeeded();
        };
        init();
    }, []);

    // Global Settings (that still live in localStorage for now)
    const [persistedActiveConversationId, setPersistedActiveConversationId] = useLocalStorageState<string | null>('activeConversationId', null);
    const [defaultImageModelId] = useLocalStorageState<string>('defaultImageModelId', DEFAULT_IMAGE_MODEL);
    const [selectedImageModelId, setSelectedImageModelId] = useLocalStorageState<string>('chatSelectedImageModel', defaultImageModelId);

    // Local-only logic (Ephemeral)
    const [chatInputValue, setChatInputValue] = useState('');
    const [lastUserMessageId, setLastUserMessageId] = useState<string | null>(null);
    const [availableImageModels, setAvailableImageModels] = useState<string[]>([]);

    // Retry State
    const [lastFailedRequest, setLastFailedRequest] = useState<{
        messageText: string;
        options?: { isImageModeIntent?: boolean; isRegeneration?: boolean; messagesForApi?: ChatMessage[] };
        timestamp: number;
    } | null>(null);
    const retryLastRequestRef = useRef<(() => Promise<void>) | null>(null);

    // Sync persisted active ID with persistence hook
    useEffect(() => {
        if (persistedActiveConversationId && !persistence.activeConversation) {
            persistence.loadConversation(persistedActiveConversationId);
        }
    }, [persistedActiveConversationId, persistence]);

    // Computed values
    const isImageMode = persistence.activeConversation?.isImageMode ?? false;
    const webBrowsingEnabled = persistence.activeConversation?.webBrowsingEnabled ?? false;
    const isComposeMode = persistence.activeConversation?.isComposeMode ?? false;

    useEffect(() => {
        if (defaultImageModelId) {
            setSelectedImageModelId(defaultImageModelId);
        }
    }, [defaultImageModelId, setSelectedImageModelId]);

    return {
        // Persistence
        ...persistence,
        persistedActiveConversationId,
        setPersistedActiveConversationId,

        // UI
        ...ui,

        // Media
        ...media,

        // Input & Settings
        chatInputValue,
        setChatInputValue,
        lastUserMessageId,
        setLastUserMessageId,
        availableImageModels,
        setAvailableImageModels,
        selectedImageModelId,
        setSelectedImageModelId,

        // Error handling
        lastFailedRequest,
        setLastFailedRequest,
        retryLastRequestRef,

        // Computed
        isImageMode,
        isComposeMode,
        webBrowsingEnabled,
    };
}
