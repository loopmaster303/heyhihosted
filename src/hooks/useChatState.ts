/**
 * Chat State Management Hook
 * Manages all useState and useRef declarations for chat functionality
 */

import { useState, useRef, useEffect } from 'react';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import type { ChatMessage } from '@/types';
import { DEFAULT_IMAGE_MODEL } from '@/config/chat-options';
import { readLocal } from '@/lib/safe-storage';
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
    // Der Rueckgabewert des Persistence-Hooks aendert sich, sobald Dexie neue
    // Metadaten liefert. Hinge der Effekt daran, koennte er pro Render ein
    // weiteres Laden starten (A8). Ausloeser ist deshalb nur die gespeicherte
    // Kennung, und den aktuellen Stand holt der Effekt aus einer Ref.
    const activeConversationRef = useRef(persistence.activeConversation);
    useEffect(() => {
        activeConversationRef.current = persistence.activeConversation;
    }, [persistence.activeConversation]);

    const { loadConversation } = persistence;
    useEffect(() => {
        if (persistedActiveConversationId && !activeConversationRef.current) {
            loadConversation(persistedActiveConversationId);
        }
    }, [persistedActiveConversationId, loadConversation]);

    // Computed values
    const isImageMode = persistence.activeConversation?.isImageMode ?? false;
    const webBrowsingEnabled = persistence.activeConversation?.webBrowsingEnabled ?? false;
    const isComposeMode = persistence.activeConversation?.isComposeMode ?? false;

    // Der Standard darf die Chat-Auswahl nicht ueberschreiben (A6). Er gilt
    // nur, solange im Chat noch nichts gewaehlt wurde; sobald der Schluessel
    // dort steht, entscheidet allein die Auswahl.
    //
    // Der erste Durchlauf wird uebersprungen: er laeuft, bevor
    // useLocalStorageState die gespeicherten Werte nachgezogen hat, und wuerde
    // den Code-Startwert festschreiben.
    const chatSelectionSeedPending = useRef(true);
    useEffect(() => {
        if (chatSelectionSeedPending.current) {
            chatSelectionSeedPending.current = false;
            return;
        }
        if (readLocal('chatSelectedImageModel') !== null) return;
        if (!defaultImageModelId) return;
        setSelectedImageModelId(defaultImageModelId);
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
