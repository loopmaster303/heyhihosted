/**
 * Chat State Management Hook
 * Manages all useState and useRef declarations for chat functionality
 */

import { useState, useRef, useEffect } from 'react';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import type { Conversation, ChatMessage } from '@/types';
import { AVAILABLE_TTS_VOICES, FALLBACK_IMAGE_MODELS, DEFAULT_IMAGE_MODEL } from '@/config/chat-options';
import { DatabaseService } from '@/lib/services/database';
import { MigrationService } from '@/lib/services/migration';

const CHAT_HISTORY_STORAGE_KEY = 'fluxflow-chatHistory';

export function useChatState() {
    // --- Database Integration ---
    const [allConversations, setAllConversations] = useState<Conversation[]>([]);
    const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

    // Initial Load & Migration
    useEffect(() => {
        const initStorage = async () => {
            try {
                // 1. Migration prüfen/ausführen
                await MigrationService.migrateIfNeeded();
                
                // 2. Daten aus IndexedDB laden
                const dbConversations = await DatabaseService.getAllFullConversations();
                setAllConversations(dbConversations as any);
                
                console.log(`📦 ${dbConversations.length} Chats aus IndexedDB geladen.`);
            } catch (err) {
                console.error("Failed to initialize IndexedDB storage:", err);
            } finally {
                setIsInitialLoadComplete(true);
            }
        };
        initStorage();
    }, []);

    // Persistence: Save to IndexedDB when allConversations changes
    useEffect(() => {
        if (!isInitialLoadComplete) return;

        const persist = async () => {
            try {
                // Wir speichern nur die Conversations, die sich geändert haben könnten
                // Für den Anfang speichern wir bei jeder Änderung alles (einfachheitshalber)
                for (const conv of allConversations) {
                    await DatabaseService.saveFullConversation(conv);
                }
            } catch (err) {
                console.error("Failed to persist changes to IndexedDB:", err);
            }
        };
        persist();
    }, [allConversations, isInitialLoadComplete]);

    // Legacy State (Commented out for safety)
    // const [allConversations, setAllConversations] = useLocalStorageState<Conversation[]>(CHAT_HISTORY_STORAGE_KEY, []);
    
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [persistedActiveConversationId, setPersistedActiveConversationId] = useLocalStorageState<string | null>('activeConversationId', null);
    // const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

    // UI State
    const [isAiResponding, setIsAiResponding] = useState(false);
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
    const [isGalleryPanelOpen, setIsGalleryPanelOpen] = useState(false);
    const [isAdvancedPanelOpen, setIsAdvancedPanelOpen] = useState(false);
    const [isEditTitleDialogOpen, setIsEditTitleDialogOpen] = useState(false);
    const [chatToEditId, setChatToEditId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');

    // Input State
    const [chatInputValue, setChatInputValue] = useState('');

    // Audio State
    const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
    const [isTtsLoadingForId, setIsTtsLoadingForId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [selectedVoice, setSelectedVoice] = useState<string>(AVAILABLE_TTS_VOICES[0].id);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Camera State
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    // Scroll State
    const [lastUserMessageId, setLastUserMessageId] = useState<string | null>(null);

    // Image Model State
    const [availableImageModels, setAvailableImageModels] = useState<string[]>([]);
    const [selectedImageModelId, setSelectedImageModelId] = useLocalStorageState<string>('chatSelectedImageModel', DEFAULT_IMAGE_MODEL);

    // Mistral Fallback State
    const [mistralFallbackEnabled, setMistralFallbackEnabled] = useLocalStorageState<boolean>('mistralFallbackEnabled', false);

    // Retry State
    const [lastFailedRequest, setLastFailedRequest] = useState<{
        messageText: string;
        options?: { isImageModeIntent?: boolean; isRegeneration?: boolean; messagesForApi?: ChatMessage[] };
        timestamp: number;
    } | null>(null);

    // Retry Ref
    const retryLastRequestRef = useRef<(() => Promise<void>) | null>(null);

    // Computed values
    const isImageMode = activeConversation?.isImageMode ?? false;
    const webBrowsingEnabled = activeConversation?.webBrowsingEnabled ?? false;
    const mistralFallbackEnabledComputed = activeConversation?.mistralFallbackEnabled ?? false;

    return {
        // Conversation State
        allConversations,
        setAllConversations,
        activeConversation,
        setActiveConversation,
        persistedActiveConversationId,
        setPersistedActiveConversationId,
        isInitialLoadComplete,
        setIsInitialLoadComplete,

        // UI State
        isAiResponding,
        setIsAiResponding,
        isHistoryPanelOpen,
        setIsHistoryPanelOpen,
        setIsGalleryPanelOpen,
        isGalleryPanelOpen,
        isAdvancedPanelOpen,
        setIsAdvancedPanelOpen,
        isEditTitleDialogOpen,
        setIsEditTitleDialogOpen,
        chatToEditId,
        setChatToEditId,
        editingTitle,
        setEditingTitle,

        // Input State
        chatInputValue,
        setChatInputValue,

        // Audio State
        playingMessageId,
        setPlayingMessageId,
        isTtsLoadingForId,
        setIsTtsLoadingForId,
        audioRef,
        selectedVoice,
        setSelectedVoice,

        // Recording State
        isRecording,
        setIsRecording,
        isTranscribing,
        setIsTranscribing,
        mediaRecorderRef,
        audioChunksRef,

        // Camera State
        isCameraOpen,
        setIsCameraOpen,

        // Scroll State
        lastUserMessageId,
        setLastUserMessageId,

        // Image Model State
        availableImageModels,
        setAvailableImageModels,
        selectedImageModelId,
        setSelectedImageModelId,

        // Mistral Fallback State
        mistralFallbackEnabled: mistralFallbackEnabledComputed,
        setMistralFallbackEnabled,

        // Retry State
        lastFailedRequest,
        setLastFailedRequest,
        retryLastRequestRef,

        // Computed
        isImageMode,
        webBrowsingEnabled,
    };
}
