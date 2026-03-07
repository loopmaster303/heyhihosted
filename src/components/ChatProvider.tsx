'use client';

import React, { useCallback, useContext, createContext, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useLanguage } from './LanguageProvider';
import { generateUUID } from '@/lib/uuid';

import type { ChatMessage, Conversation, ChatMessageContentPart, ApiChatMessage, ImageHistoryItem, UploadedReference } from '@/types';
import type {
  PollinationsChatCompletionResponse,
  ImageGenerationResponse,
  TitleGenerationResponse,
  ApiErrorResponse,
} from '@/types/api';
import { isApiErrorResponse, isPollinationsChatResponse } from '@/types/api';
import { AVAILABLE_POLLINATIONS_MODELS, DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME, AVAILABLE_RESPONSE_STYLES } from '@/config/chat-options';
import { getUnifiedModel } from '@/config/unified-image-models';
import {
  normalizeChatModeState,
  resolveEffectiveTextModel,
  resolveRequestCapabilities,
  resolveStartNewChatState,
} from '@/lib/chat/chat-capability-resolution';
import {
  buildOlderMessagesSummary,
  splitMessagesForApiContext,
} from '@/lib/chat/chat-context-window';
import { normalizeRecentMessagesForApi } from '@/lib/chat/chat-message-normalization';
import { buildChatSystemPrompt, buildSystemPromptForRequest } from '@/lib/chat/chat-prompt-builder';
import {
  buildFinalConversationState,
  buildSendFailureState,
  executeChatSendCoordinator,
  shouldUpdateTitleAfterSend,
} from '@/lib/chat/chat-send-coordinator';
import { buildChatContextGroups, buildChatContextGroupsWithOverrides, mergeChatContextGroups } from '@/lib/chat/chat-context-groups';
import { runImageGenerationFlow, runTextChatCompletionFlow } from '@/lib/chat/chat-send-orchestrator';

// Import extracted hooks and helpers
import { useChatState } from '@/hooks/useChatState';
import { useChatAudio } from '@/hooks/useChatAudio';
import { useChatRecording } from '@/hooks/useChatRecording';
import { useChatEffects } from '@/hooks/useChatEffects';
import { ChatService } from '@/lib/services/chat-service';
import { MemoryService } from '@/lib/services/memory-service';
import { DatabaseService } from '@/lib/services/database';
import { GalleryService } from '@/lib/services/gallery-service';
import { uploadFileToS3 } from '@/lib/upload/s3-upload';
import { getClientSessionId } from '@/lib/session';
import { resolveReferenceUrls } from '@/lib/upload/reference-utils';
import { toDate } from '@/utils/chatHelpers';

export interface UseChatLogicProps {
  userDisplayName?: string;
  customSystemPrompt?: string;
  defaultTextModelId?: string;
}

const MAX_STORED_CONVERSATIONS = 50;

export function useChatLogic({ userDisplayName, customSystemPrompt, defaultTextModelId }: UseChatLogicProps) {
  // --- State Management (extracted to hook) ---
  const state = useChatState();
  const {
    allConversations,
    activeConversation,
    setActiveConversation,
    loadConversation,
    saveConversation,
    deleteConversation,
    persistedActiveConversationId,
    setPersistedActiveConversationId,
    isInitialLoadComplete,
    isAiResponding,
    setIsAiResponding,
    isHistoryPanelOpen,
    setIsHistoryPanelOpen,
    isAdvancedPanelOpen,
    setIsAdvancedPanelOpen,
    chatInputValue,
    setChatInputValue,
    playingMessageId,
    setPlayingMessageId,
    isTtsLoadingForId,
    setIsTtsLoadingForId,
    audioRef,
    selectedVoice,
    setSelectedVoice,
    isRecording,
    setIsRecording,
    isTranscribing,
    setIsTranscribing,
    mediaRecorderRef,
    audioChunksRef,
    isCameraOpen,
    setIsCameraOpen,
    lastUserMessageId,
    setLastUserMessageId,
    availableImageModels,
    setAvailableImageModels,
    selectedImageModelId,
    setSelectedImageModelId,
    lastFailedRequest,
    setLastFailedRequest,
    retryLastRequestRef,
    isImageMode,
    isComposeMode,
    webBrowsingEnabled,
  } = state;

  const { toast } = useToast();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (!activeConversation) return;
    if (!AVAILABLE_RESPONSE_STYLES.some(style => style.name === activeConversation.selectedResponseStyleName)) {
      setActiveConversation((prev: Conversation | null) => prev ? { ...prev, selectedResponseStyleName: DEFAULT_RESPONSE_STYLE_NAME } : prev);
    }
  }, [activeConversation, setActiveConversation]);

  // Clamp selected text model to the known registry (prevents stale localStorage from using removed ids).
  useEffect(() => {
    if (!activeConversation) return;
    const currentId = activeConversation.selectedModelId;
    const safeModelId = resolveEffectiveTextModel(currentId);
    if (currentId && currentId !== safeModelId) {
      setActiveConversation((prev: Conversation | null) => prev ? { ...prev, selectedModelId: safeModelId } : prev);
    }
  }, [activeConversation, setActiveConversation]);

  // --- Audio Hook ---
  const { handlePlayAudio } = useChatAudio({
    playingMessageId,
    setPlayingMessageId,
    isTtsLoadingForId,
    setIsTtsLoadingForId,
    audioRef,
    selectedVoice,
  });

  // --- Recording Hook ---
  const { startRecording, stopRecording } = useChatRecording({
    isRecording,
    setIsRecording,
    isTranscribing,
    setIsTranscribing,
    mediaRecorderRef,
    audioChunksRef,
    setChatInputValue,
  });

  // --- Helper Functions / Callbacks (defined early for dependencies) ---

  const dataURItoFile = useCallback((dataURI: string, filename: string): File => {
    const arr = dataURI.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }, []);

  const handleFileSelect = useCallback((fileOrDataUri: File | string | null, fileType: string | null) => {
    if (!activeConversation) return; 
    if (fileOrDataUri) {
      if (typeof fileOrDataUri === 'string') {
        const file = dataURItoFile(fileOrDataUri, `capture-${Date.now()}.jpg`);
        setActiveConversation((prev: Conversation | null) => prev ? { ...prev, isImageMode: false, uploadedFile: file, uploadedFilePreview: fileOrDataUri } : null);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setActiveConversation((prev: Conversation | null) => prev ? { ...prev, isImageMode: false, uploadedFile: fileOrDataUri, uploadedFilePreview: reader.result as string } : null);
        };
        reader.readAsDataURL(fileOrDataUri);
      }
    } else {
      setActiveConversation((prev: Conversation | null) => prev ? { ...prev, uploadedFile: null, uploadedFilePreview: null } : null);
    }
  }, [activeConversation, dataURItoFile, setActiveConversation]);

  const clearUploadedImage = useCallback(() => {
    if (activeConversation) {
      setActiveConversation((prev: Conversation | null) => prev ? { ...prev, uploadedFile: null, uploadedFilePreview: null } : null);
    }
  }, [activeConversation, setActiveConversation]);

  const closeHistoryPanel = useCallback(() => setIsHistoryPanelOpen(false), [setIsHistoryPanelOpen]);
  const closeAdvancedPanel = useCallback(() => setIsAdvancedPanelOpen(false), [setIsAdvancedPanelOpen]);

  const toggleImageMode = useCallback((forcedState?: boolean, modelId?: string) => {
    if (!activeConversation) return;
    const newImageModeState = forcedState !== undefined ? forcedState : !(activeConversation.isImageMode ?? false);
    const normalizedModes = normalizeChatModeState({
      isImageMode: newImageModeState,
      isComposeMode: activeConversation.isComposeMode,
      isCodeMode: activeConversation.isCodeMode,
      webBrowsingEnabled: activeConversation.webBrowsingEnabled,
    });
    setActiveConversation((prev: Conversation | null) => prev ? {
      ...prev,
      ...normalizedModes,
    } : prev);
    if (newImageModeState) {
      handleFileSelect(null, null);
      if (modelId) {
        setSelectedImageModelId(modelId);
      }
    }
  }, [activeConversation, handleFileSelect, setActiveConversation, setSelectedImageModelId]);

  const toggleComposeMode = useCallback((forcedState?: boolean) => {
    if (!activeConversation) return;
    const newComposeModeState = forcedState !== undefined ? forcedState : !(activeConversation.isComposeMode ?? false);
    const normalizedModes = normalizeChatModeState({
      isImageMode: activeConversation.isImageMode,
      isComposeMode: newComposeModeState,
      isCodeMode: activeConversation.isCodeMode,
      webBrowsingEnabled: activeConversation.webBrowsingEnabled,
    });
    setActiveConversation((prev: Conversation | null) => prev ? {
      ...prev,
      ...normalizedModes,
    } : prev);
    if (newComposeModeState) {
      handleFileSelect(null, null);
    }
  }, [activeConversation, handleFileSelect, setActiveConversation]);

  const updateConversationTitle = useCallback(async (conversationId: string, messagesForTitleGen: ChatMessage[]): Promise<string> => {
    const convToUpdate = allConversations.find(c => c.id === conversationId) ?? activeConversation;
    if (!convToUpdate || convToUpdate.toolType !== 'long language loops') {
      return activeConversation?.title || t('nav.newConversation');
    }

    const isDefaultTitle =
      convToUpdate.title === t('nav.newConversation') ||
      convToUpdate.title.toLowerCase().startsWith("new ") ||
      convToUpdate.title === "Chat";

    if (!isDefaultTitle && convToUpdate.title && convToUpdate.title.length > 2) {
      return convToUpdate.title;
    }

    const fallbackFromUser = (() => {
      const firstUser = messagesForTitleGen.find((msg: ChatMessage) => msg.role === 'user');
      if (!firstUser) return '';
      if (typeof firstUser.content === 'string') return firstUser.content.split(/\s+/).slice(0, 6).join(' ');
      const textPart = firstUser.content.find(p => p.type === 'text');
      return textPart?.text?.split(/\s+/).slice(0, 6).join(' ') || '';
    })();

    if (messagesForTitleGen.length >= 1 && isDefaultTitle) {
      const firstUserMessage = messagesForTitleGen.find((msg: ChatMessage) => msg.role === 'user');
      const firstAssistantMessage = messagesForTitleGen.find((msg: ChatMessage) => msg.role === 'assistant');

      const extractText = (msg?: ChatMessage) => {
        if (!msg) return '';
        if (typeof msg.content === 'string') return msg.content;
        const textPart = msg.content.find(p => p.type === 'text');
        return textPart?.text || '';
      };

      const userText = extractText(firstUserMessage).trim();
      const assistantText = extractText(firstAssistantMessage).trim();

      const isErrorResponse = assistantText && (
        assistantText.includes("couldn't get a response") ||
        assistantText.includes("error occurred") ||
        assistantText.includes("Sorry") ||
        assistantText.includes("failed") ||
        assistantText.length < 10 
      );

      let contextForTitle = userText;
      if (assistantText && !isErrorResponse) {
        contextForTitle += '\n' + assistantText;
      }

      if (!contextForTitle && fallbackFromUser) {
        setActiveConversation((prev: Conversation | null) => prev ? { ...prev, title: fallbackFromUser } : null);
        return fallbackFromUser;
      }

      if (contextForTitle) {
        try {
          const messagesForTitleApi: ApiChatMessage[] = [];

          if (userText) {
            messagesForTitleApi.push({ role: 'user', content: userText });
          }
          if (assistantText) {
            messagesForTitleApi.push({ role: 'assistant', content: assistantText });
          }

          const finalTitle = await ChatService.generateTitle(
            messagesForTitleApi
          );

          const titleToSet = finalTitle && finalTitle.toLowerCase() !== 'chat' && finalTitle.length > 2
            ? finalTitle
            : (fallbackFromUser || "Chat");

          if (titleToSet && titleToSet !== convToUpdate.title) {
            setActiveConversation((prev: Conversation | null) => prev ? { ...prev, title: titleToSet } : null);
          }
          return titleToSet;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('[updateConversationTitle] Failed to generate title:', errorMessage);
          const titleToSet = fallbackFromUser || convToUpdate.title;
          if (titleToSet && titleToSet !== convToUpdate.title) {
            setActiveConversation((prev: Conversation | null) => prev ? { ...prev, title: titleToSet } : null);
          }
          return titleToSet;
        }
      }
    }

    if (isDefaultTitle && fallbackFromUser) {
      setActiveConversation((prev: Conversation | null) => prev ? { ...prev, title: fallbackFromUser } : null);
      return fallbackFromUser;
    }

    return convToUpdate.title;
  }, [allConversations, activeConversation, setActiveConversation, t]);

  const sendMessage = useCallback(async (
    messageText: string,
    options: {
      isImageModeIntent?: boolean;
      isRegeneration?: boolean;
      messagesForApi?: ChatMessage[];
      imageConfig?: {
        formFields: Record<string, any>;
        uploadedImages: UploadedReference[];
        selectedModelId: string;
      };
    } = {}
  ) => {
    if (!activeConversation || activeConversation.toolType !== 'long language loops') return;
    await executeChatSendCoordinator({
      conversation: activeConversation,
      messageText,
      chatInputValue,
      selectedImageModelId,
      language,
      customSystemPrompt,
      userDisplayName,
      newConversationTitle: t('nav.newConversation'),
      options,
      availableResponseStyles: AVAILABLE_RESPONSE_STYLES,
      resolveRequestCapabilities,
      buildChatSystemPrompt,
      splitMessagesForApiContext,
      buildOlderMessagesSummary,
      normalizeRecentMessagesForApi,
      buildSystemPromptForRequest,
      runTextChatCompletionFlow,
      runImageGenerationFlow,
      shouldUpdateTitleAfterSend,
      updateConversationTitle,
      buildSendFailureState,
      buildFinalConversationState,
      setIsAiResponding,
      setChatInputValue,
      setLastUserMessageId,
      setLastFailedRequest,
      setActiveConversation,
      toast,
      getRetryAction: () => (
        <button
          onClick={() => retryLastRequestRef.current?.()}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          Erneut versuchen
        </button>
      ),
      extractMemories: MemoryService.extractMemories,
      saveUploadedAsset: DatabaseService.saveAsset,
      uploadFileToS3,
      resolveReferenceUrls,
      getUnifiedModel,
      generateImage: ChatService.generateImage,
      saveGeneratedAsset: GalleryService.saveGeneratedAsset,
      createId: generateUUID,
      createTimestamp: () => new Date().toISOString(),
      getSessionId: getClientSessionId,
      onError: (error) => {
        console.error('Chat API Error:', error);
      },
      sendChatCompletion: ChatService.sendChatCompletion,
    });
  }, [activeConversation, customSystemPrompt, userDisplayName, toast, chatInputValue, updateConversationTitle, setActiveConversation, setLastUserMessageId, selectedImageModelId, webBrowsingEnabled, language, retryLastRequestRef, setChatInputValue, setIsAiResponding, setLastFailedRequest, t]);

  const selectChat = useCallback(async (conversationId: string | null) => {
    if (conversationId === null) {
      setActiveConversation(null);
      return;
    }
    await loadConversation(conversationId);
    setLastUserMessageId(null); 
  }, [loadConversation, setActiveConversation, setLastUserMessageId]);

  const startNewChat = useCallback((initialOptionsOrModelId?: string | {
    initialModelId?: string;
    isImageMode?: boolean;
    isComposeMode?: boolean;
    isCodeMode?: boolean;
    webBrowsingEnabled?: boolean;
  }) => {
    // Parse arguments
    let initialModelId: string | undefined;
    let initialImageMode = false;
    let initialComposeMode = false;
    let initialCodeMode = false;
    let initialWebBrowsing = false;

    if (typeof initialOptionsOrModelId === 'string') {
        initialModelId = initialOptionsOrModelId;
    } else if (typeof initialOptionsOrModelId === 'object') {
        initialModelId = initialOptionsOrModelId.initialModelId;
        initialImageMode = !!initialOptionsOrModelId.isImageMode;
        initialComposeMode = !!initialOptionsOrModelId.isComposeMode;
        initialCodeMode = !!initialOptionsOrModelId.isCodeMode;
        initialWebBrowsing = !!initialOptionsOrModelId.webBrowsingEnabled;
    }

    if (activeConversation && activeConversation.messages.length === 0) {
      if (initialModelId) {
        setActiveConversation((prev: Conversation | null) => prev ? { 
            ...prev, 
            ...resolveStartNewChatState({
              initialModelId,
              isImageMode: initialImageMode || prev.isImageMode,
              isComposeMode: initialComposeMode,
              isCodeMode: initialCodeMode || prev.isCodeMode,
              webBrowsingEnabled: initialWebBrowsing || prev.webBrowsingEnabled,
            }, defaultTextModelId),
        } : null);
      }
      return;
    }

    const newConversationId = generateUUID();
    const resolvedState = resolveStartNewChatState({
      initialModelId,
      isImageMode: initialImageMode,
      isComposeMode: initialComposeMode,
      isCodeMode: initialCodeMode,
      webBrowsingEnabled: initialWebBrowsing,
    }, defaultTextModelId);
    const newConversationData: Conversation = {
      id: newConversationId,
      title: t('nav.newConversation'),
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      toolType: 'long language loops',
      ...resolvedState,
      selectedResponseStyleName: DEFAULT_RESPONSE_STYLE_NAME,
    };

    if (allConversations.length >= MAX_STORED_CONVERSATIONS) {
      const sortedConvs = [...allConversations].sort((a, b) => toDate(a.updatedAt).getTime() - toDate(b.updatedAt).getTime());
      const oldestConversation = sortedConvs[0];
      if (oldestConversation) {
        deleteConversation(oldestConversation.id);
      }
    }

    setActiveConversation(newConversationData);
    setLastUserMessageId(null); 

    return newConversationData;
  }, [allConversations, defaultTextModelId, deleteConversation, setActiveConversation, setLastUserMessageId, activeConversation, t]);

    const deleteChat = useCallback((conversationId: string) => {

      const wasActive = activeConversation?.id === conversationId;

  

      deleteConversation(conversationId);

  

      if (wasActive) {

        const nextChat = allConversations.filter(c => c.id !== conversationId && c.toolType === 'long language loops')

          .sort((a, b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime())[0] ?? null;

  

        if (nextChat) {

          selectChat(nextChat.id);

        } else {

          startNewChat();

        }

      }

      toast({ title: "Chat Deleted" });

    }, [activeConversation?.id, allConversations, selectChat, deleteConversation, toast, startNewChat]);

  

  const handleModelChange = useCallback((modelId: string) => {
    if (activeConversation) {
      const safeModelId = resolveEffectiveTextModel(modelId);
      setActiveConversation((prev: Conversation | null) => prev ? { ...prev, selectedModelId: safeModelId } : null);
    }
  }, [activeConversation, setActiveConversation]);

  const handleImageModelChange = useCallback((modelId: string) => {
    setSelectedImageModelId(modelId);
  }, [setSelectedImageModelId]);

  const handleStyleChange = useCallback((styleName: string) => {
    if (activeConversation) {
      setActiveConversation((prev: Conversation | null) => prev ? { ...prev, selectedResponseStyleName: styleName } : null);
    }
  }, [activeConversation, setActiveConversation]);

  const handleVoiceChange = useCallback((voiceId: string) => {
    setSelectedVoice(voiceId);
  }, [setSelectedVoice]);

  const toggleHistoryPanel = useCallback(() => setIsHistoryPanelOpen(prev => !prev), [setIsHistoryPanelOpen]);
  const toggleAdvancedPanel = useCallback(() => setIsAdvancedPanelOpen(prev => !prev), [setIsAdvancedPanelOpen]);
  const toggleWebBrowsing = useCallback((forcedState?: boolean) => {
    setActiveConversation((prev: Conversation | null) => prev ? {
      ...prev,
      webBrowsingEnabled: forcedState !== undefined ? forcedState : !(prev.webBrowsingEnabled ?? false)
    } : prev);
  }, [setActiveConversation]);

  const handleCopyToClipboard = useCallback((text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied to Clipboard" });
    }).catch(err => {
      console.error("Failed to copy text: ", err);
      toast({ title: "Copy Failed", variant: "destructive" });
    });
  }, [toast]);

  const regenerateLastResponse = useCallback(async () => {
    if (!activeConversation || isAiResponding) return;

    const lastAssistantIndex = activeConversation.messages
      .map((message, index) => ({ message, index }))
      .reverse()
      .find(({ message }) => message.role === 'assistant')?.index ?? -1;

    if (lastAssistantIndex === -1) {
      toast({
        title: "Action Not Available",
        description: "There is no assistant response to regenerate yet.",
        variant: "destructive"
      });
      return;
    }

    const messagesForRegeneration = activeConversation.messages.slice(0, lastAssistantIndex);

    await sendMessage("", { 
      isRegeneration: true,
      messagesForApi: messagesForRegeneration
    });

  }, [isAiResponding, activeConversation, sendMessage, toast]);

  const retryLastRequest = useCallback(async () => {
    if (!lastFailedRequest) return;

    const requestToRetry = { ...lastFailedRequest };
    setLastFailedRequest(null); 

    if (!requestToRetry.options?.isRegeneration && requestToRetry.messageText) {
      setChatInputValue(requestToRetry.messageText);
    }

    await sendMessage(requestToRetry.messageText, requestToRetry.options);
  }, [lastFailedRequest, sendMessage, setChatInputValue, setLastFailedRequest]);

  const openCamera = useCallback(() => setIsCameraOpen(true), [setIsCameraOpen]);
  const closeCamera = useCallback(() => setIsCameraOpen(false), [setIsCameraOpen]);

  // --- Effects Hook ---
  useChatEffects({
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
  });


  // --- Return Value ---
  return {
    activeConversation, allConversations,
    isAiResponding, setIsAiResponding, isImageMode, isComposeMode,
    isHistoryPanelOpen, isAdvancedPanelOpen,
    playingMessageId, isTtsLoadingForId, chatInputValue,
    selectedVoice,
    isInitialLoadComplete,
    lastUserMessageId, 
    isRecording, isTranscribing,
    isCameraOpen,
    availableImageModels, selectedImageModelId,
    selectChat, startNewChat, deleteChat, sendMessage,
    toggleImageMode,
    toggleComposeMode,
    handleFileSelect, clearUploadedImage, handleModelChange, handleStyleChange,
    handleVoiceChange, handleImageModelChange,
    toggleHistoryPanel, closeHistoryPanel,
    toggleAdvancedPanel, closeAdvancedPanel,
    toggleWebBrowsing, webBrowsingEnabled,
    handlePlayAudio,
    setChatInputValue,
    handleCopyToClipboard,
    regenerateLastResponse, 
    retryLastRequest,
    startRecording, stopRecording,
    openCamera, closeCamera,
    toDate,
    setActiveConversation,

  };
}


interface ChatContextValue extends ReturnType<typeof useChatLogic> {
}

type ChatContextGroups = ReturnType<typeof buildChatContextGroups<ChatContextValue>>;

const ConversationContext = createContext<ChatContextGroups['conversation'] | undefined>(undefined);
const ComposerContext = createContext<ChatContextGroups['composer'] | undefined>(undefined);
const ModesContext = createContext<ChatContextGroups['modes'] | undefined>(undefined);
const MediaContext = createContext<ChatContextGroups['media'] | undefined>(undefined);
const PanelsContext = createContext<ChatContextGroups['panels'] | undefined>(undefined);

function useRequiredChatContext<T>(context: React.Context<T | undefined>, hookName: string): T {
  const value = useContext(context);
  if (!value) {
    throw new Error(`${hookName} must be used within a ChatProvider`);
  }
  return value;
}

function normalizeLegacyTextModelId(id: string): string {
  if (!id) return id;
  if (id === 'kimi-k2-thinking') return 'kimi';
  if (id === 'nova-micro') return 'nova-fast';
  return id;
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userDisplayName] = useLocalStorageState<string>("userDisplayName", "User");
  const [customSystemPrompt] = useLocalStorageState<string>("customSystemPrompt", "");
  const [defaultTextModelId, setDefaultTextModelId] = useLocalStorageState<string>("defaultTextModelId", DEFAULT_POLLINATIONS_MODEL_ID);
  const normalizedDefaultTextModelId = normalizeLegacyTextModelId(defaultTextModelId);

  useEffect(() => {
    if (normalizedDefaultTextModelId !== defaultTextModelId) {
      setDefaultTextModelId(normalizedDefaultTextModelId);
    }
  }, [defaultTextModelId, normalizedDefaultTextModelId, setDefaultTextModelId]);

  const chatLogic = useChatLogic({ userDisplayName, customSystemPrompt, defaultTextModelId: normalizedDefaultTextModelId });

  const setChatInputValueWrapper = useCallback((value: string | ((prev: string) => string)) => {
    chatLogic.setChatInputValue(value);
  }, [chatLogic]);

  const chatContextGroups = buildChatContextGroupsWithOverrides(chatLogic as ChatContextValue, {
    composer: {
      setChatInputValue: setChatInputValueWrapper,
    },
  });

  return (
    <ConversationContext.Provider value={chatContextGroups.conversation}>
      <ComposerContext.Provider value={chatContextGroups.composer}>
        <ModesContext.Provider value={chatContextGroups.modes}>
          <MediaContext.Provider value={chatContextGroups.media}>
            <PanelsContext.Provider value={chatContextGroups.panels}>
              {children}
            </PanelsContext.Provider>
          </MediaContext.Provider>
        </ModesContext.Provider>
      </ComposerContext.Provider>
    </ConversationContext.Provider>
  );
};

export const useChat = (): ChatContextValue => {
  const conversation = useRequiredChatContext(ConversationContext, 'useChat');
  const composer = useRequiredChatContext(ComposerContext, 'useChat');
  const modes = useRequiredChatContext(ModesContext, 'useChat');
  const media = useRequiredChatContext(MediaContext, 'useChat');
  const panels = useRequiredChatContext(PanelsContext, 'useChat');

  return mergeChatContextGroups({ conversation, composer, modes, media, panels }) as ChatContextValue;
};

export const useChatConversation = () => useRequiredChatContext(ConversationContext, 'useChatConversation');

export const useChatComposer = () => useRequiredChatContext(ComposerContext, 'useChatComposer');

export const useChatModes = () => useRequiredChatContext(ModesContext, 'useChatModes');

export const useChatMedia = () => useRequiredChatContext(MediaContext, 'useChatMedia');

export const useChatPanels = () => useRequiredChatContext(PanelsContext, 'useChatPanels');
