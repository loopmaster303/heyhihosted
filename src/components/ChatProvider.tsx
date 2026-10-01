'use client';

import React, { useCallback, useContext, createContext, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useLanguage } from './LanguageProvider';
import { generateUUID } from '@/lib/uuid';

import type { ChatMessage, Conversation, ApiChatMessage, ChatMessageContentPart } from '@/types';
import { DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME, AVAILABLE_RESPONSE_STYLES } from '@/config/chat-options';
import {
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
import { runTextChatCompletionFlow, type AssistantMediaHooks } from '@/lib/chat/chat-send-orchestrator';
import { prepareAssistantMedia, resolveImagePart } from '@/lib/chat/chat-media-intent-handler';

import { useChatState } from '@/hooks/useChatState';
import { useChatAudio } from '@/hooks/useChatAudio';
import { useChatRecording } from '@/hooks/useChatRecording';
import { useChatEffects } from '@/hooks/useChatEffects';
import { useVisiblePollinationsTextModels } from '@/hooks/useVisiblePollinationsTextModels';
import { ChatService } from '@/lib/services/chat-service';
import { MemoryService } from '@/lib/services/memory-service';
import { DatabaseService } from '@/lib/services/database';
import { OutputService } from '@/lib/services/output-service';
import { uploadFileToPollinationsMediaUrl } from '@/lib/upload/pollinations-media';
import { getClientSessionId } from '@/lib/session';
import { toDate } from '@/utils/chatHelpers';

export interface UseChatLogicProps {
  userDisplayName?: string;
  customSystemPrompt?: string;
  defaultTextModelId?: string;
}

const MAX_STORED_CONVERSATIONS = 50;

export interface StartNewChatInput {
  initialModelId?: string;
  isCodeMode?: boolean;
  webBrowsingEnabled?: boolean;
}

export function useChatLogic({ userDisplayName, customSystemPrompt, defaultTextModelId }: UseChatLogicProps) {
  const { visibleModels: visibleTextModels } = useVisiblePollinationsTextModels();
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
    chatInputValue,
    setChatInputValue,
    playingMessageId,
    setPlayingMessageId,
    isTtsLoadingForId,
    setIsTtsLoadingForId,
    audioRef,
    selectedVoice,
    setSelectedVoice,
    selectedTtsSpeed,
    setSelectedTtsSpeed,
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
    chatImageModelId,
    lastFailedRequest,
    setLastFailedRequest,
    retryLastRequestRef,
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
    const safeModelId = resolveEffectiveTextModel(currentId, visibleTextModels);
    if (currentId && currentId !== safeModelId) {
      setActiveConversation((prev: Conversation | null) => prev ? { ...prev, selectedModelId: safeModelId } : prev);
    }
  }, [activeConversation, setActiveConversation, visibleTextModels]);

  const { handlePlayAudio } = useChatAudio({
    playingMessageId,
    setPlayingMessageId,
    isTtsLoadingForId,
    setIsTtsLoadingForId,
    audioRef,
    selectedVoice,
    selectedTtsSpeed,
  });

  const { startRecording, stopRecording } = useChatRecording({
    isRecording,
    setIsRecording,
    isTranscribing,
    setIsTranscribing,
    mediaRecorderRef,
    audioChunksRef,
    setChatInputValue,
    language,
  });

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

  const handleFileSelect = useCallback((fileOrDataUri: File | string | null, _fileType?: string | null) => {
    if (!activeConversation) return;
    if (fileOrDataUri) {
      if (typeof fileOrDataUri === 'string') {
        const file = dataURItoFile(fileOrDataUri, `capture-${Date.now()}.jpg`);
        setActiveConversation((prev: Conversation | null) => prev ? { ...prev, uploadedFile: file, uploadedFilePreview: fileOrDataUri } : null);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setActiveConversation((prev: Conversation | null) => prev ? { ...prev, uploadedFile: fileOrDataUri, uploadedFilePreview: reader.result as string } : null);
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

    const extractText = (msg?: ChatMessage) => {
      if (!msg) return '';
      if (typeof msg.content === 'string') return msg.content;
      const textPart = msg.content.find(p => p.type === 'text');
      return textPart && textPart.type === 'text' ? textPart.text : '';
    };

    const fallbackFromUser = extractText(messagesForTitleGen.find((msg) => msg.role === 'user'))
      .split(/\s+/).slice(0, 6).join(' ');

    if (messagesForTitleGen.length >= 1 && isDefaultTitle) {
      const userText = extractText(messagesForTitleGen.find((msg) => msg.role === 'user')).trim();
      const assistantText = extractText(messagesForTitleGen.find((msg) => msg.role === 'assistant')).trim();

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
          if (userText) messagesForTitleApi.push({ role: 'user', content: userText });
          if (assistantText) messagesForTitleApi.push({ role: 'assistant', content: assistantText });

          const finalTitle = await ChatService.generateTitle(messagesForTitleApi);
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

  /**
   * Die Bild-Hooks fuer eine Unterhaltung: der Marker wird sofort zum
   * Platzhalter, das Bild entsteht danach an genau dieser Stelle.
   */
  const buildMediaHooks = useCallback((conversationId: string): AssistantMediaHooks => ({
    prepare: (rawText) => prepareAssistantMedia(rawText, chatImageModelId),
    resolve: (part) => resolveImagePart(part, {
      conversationId,
      sessionId: getClientSessionId(),
      generateImage: ChatService.generateImage,
      saveGeneratedAsset: OutputService.saveGeneratedAsset,
    }),
  }), [chatImageModelId]);

  const sendMessage = useCallback(async (
    messageText: string,
    options: {
      isRegeneration?: boolean;
      messagesForApi?: ChatMessage[];
    } = {}
  ) => {
    if (!activeConversation || activeConversation.toolType !== 'long language loops') return;
    await executeChatSendCoordinator({
      conversation: activeConversation,
      messageText,
      chatInputValue,
      language,
      customSystemPrompt,
      userDisplayName,
      newConversationTitle: t('nav.newConversation'),
      options,
      availableResponseStyles: AVAILABLE_RESPONSE_STYLES,
      resolveRequestCapabilities: (input) => resolveRequestCapabilities(input, { visibleModels: visibleTextModels }),
      buildChatSystemPrompt,
      splitMessagesForApiContext,
      buildOlderMessagesSummary,
      normalizeRecentMessagesForApi,
      buildSystemPromptForRequest,
      runTextChatCompletionFlow,
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
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Erneut versuchen
        </button>
      ),
      extractMemories: MemoryService.extractMemories,
      saveUploadedAsset: DatabaseService.saveAsset,
      uploadFileToPollinationsMediaUrl,
      createId: generateUUID,
      createTimestamp: () => new Date().toISOString(),
      getSessionId: getClientSessionId,
      onError: (error) => {
        console.error('Chat API Error:', error);
      },
      sendChatCompletion: ChatService.sendChatCompletion,
      media: buildMediaHooks(activeConversation.id),
    });
  }, [activeConversation, customSystemPrompt, userDisplayName, toast, chatInputValue, updateConversationTitle, setActiveConversation, setLastUserMessageId, language, retryLastRequestRef, setChatInputValue, setIsAiResponding, setLastFailedRequest, t, visibleTextModels, buildMediaHooks]);

  /**
   * Ein gescheitertes oder unterbrochenes Bild an Ort und Stelle neu erzeugen —
   * mit seinem eigenen Prompt, nicht mit dem, was gerade in der Eingabe steht.
   */
  const retryMediaPart = useCallback(async (messageId: string, partIndex: number) => {
    if (!activeConversation) return;
    const conversationId = activeConversation.id;
    const message = activeConversation.messages.find((m) => m.id === messageId);
    if (!message || typeof message.content === 'string') return;
    const part = message.content[partIndex];
    if (!part || part.type !== 'image_url') return;

    const setPart = (next: ChatMessageContentPart) => {
      setActiveConversation((prev) => {
        if (!prev || prev.id !== conversationId) return prev;
        return {
          ...prev,
          messages: prev.messages.map((m) => {
            if (m.id !== messageId || typeof m.content === 'string') return m;
            const content = [...m.content];
            content[partIndex] = next;
            return { ...m, content };
          }),
        };
      });
    };

    const pending: ChatMessageContentPart = {
      type: 'image_url',
      image_url: { ...part.image_url, url: '', status: 'pending', error: undefined, modelId: part.image_url.modelId ?? chatImageModelId },
    };
    setPart(pending);
    setPart(await buildMediaHooks(conversationId).resolve(pending));
  }, [activeConversation, buildMediaHooks, chatImageModelId, setActiveConversation]);

  const selectChat = useCallback(async (conversationId: string | null) => {
    if (conversationId === null) {
      setActiveConversation(null);
      return;
    }
    await loadConversation(conversationId);
    setLastUserMessageId(null);
  }, [loadConversation, setActiveConversation, setLastUserMessageId]);

  const startNewChat = useCallback((initialOptionsOrModelId?: string | StartNewChatInput) => {
    const options: StartNewChatInput = typeof initialOptionsOrModelId === 'string'
      ? { initialModelId: initialOptionsOrModelId }
      : (initialOptionsOrModelId ?? {});

    if (activeConversation && activeConversation.messages.length === 0) {
      if (options.initialModelId) {
        setActiveConversation((prev: Conversation | null) => prev ? {
          ...prev,
          ...resolveStartNewChatState({
            initialModelId: options.initialModelId,
            isCodeMode: options.isCodeMode || prev.isCodeMode,
            webBrowsingEnabled: options.webBrowsingEnabled || prev.webBrowsingEnabled,
          }, defaultTextModelId, visibleTextModels),
        } : null);
      }
      return;
    }

    const resolvedState = resolveStartNewChatState(options, defaultTextModelId, visibleTextModels);
    const newConversationData: Conversation = {
      id: generateUUID(),
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
  }, [allConversations, defaultTextModelId, deleteConversation, setActiveConversation, setLastUserMessageId, activeConversation, t, visibleTextModels]);

  const deleteChat = useCallback((conversationId: string) => {
    const wasActive = activeConversation?.id === conversationId;
    deleteConversation(conversationId);

    if (wasActive) {
      const nextChat = allConversations
        .filter(c => c.id !== conversationId && c.toolType === 'long language loops')
        .sort((a, b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime())[0] ?? null;

      if (nextChat) {
        selectChat(nextChat.id);
      } else {
        startNewChat();
      }
    }

    toast({ title: 'Unterhaltung gelöscht' });
  }, [activeConversation?.id, allConversations, selectChat, deleteConversation, toast, startNewChat]);

  const handleModelChange = useCallback((modelId: string) => {
    if (activeConversation) {
      const safeModelId = resolveEffectiveTextModel(modelId, visibleTextModels);
      setActiveConversation((prev: Conversation | null) => prev ? { ...prev, selectedModelId: safeModelId } : null);
    }
  }, [activeConversation, setActiveConversation, visibleTextModels]);

  const handleStyleChange = useCallback((styleName: string) => {
    if (activeConversation) {
      setActiveConversation((prev: Conversation | null) => prev ? { ...prev, selectedResponseStyleName: styleName } : null);
    }
  }, [activeConversation, setActiveConversation]);

  const handleVoiceChange = useCallback((voiceId: string) => {
    setSelectedVoice(voiceId);
  }, [setSelectedVoice]);

  const handleTtsSpeedChange = useCallback((speed: number) => {
    setSelectedTtsSpeed(speed);
  }, [setSelectedTtsSpeed]);

  const toggleWebBrowsing = useCallback((forcedState?: boolean) => {
    setActiveConversation((prev: Conversation | null) => prev ? {
      ...prev,
      webBrowsingEnabled: forcedState !== undefined ? forcedState : !(prev.webBrowsingEnabled ?? false)
    } : prev);
  }, [setActiveConversation]);

  const toggleCodeMode = useCallback((forcedState?: boolean) => {
    setActiveConversation((prev: Conversation | null) => prev ? {
      ...prev,
      isCodeMode: forcedState !== undefined ? forcedState : !(prev.isCodeMode ?? false)
    } : prev);
  }, [setActiveConversation]);

  const handleCopyToClipboard = useCallback((text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'Kopiert' });
    }).catch(err => {
      console.error("Failed to copy text: ", err);
      toast({ title: 'Kopieren hat nicht geklappt', variant: "destructive" });
    });
  }, [toast]);

  const regenerateLastResponse = useCallback(async () => {
    if (!activeConversation || isAiResponding) return;

    const lastAssistantIndex = activeConversation.messages
      .map((message, index) => ({ message, index }))
      .reverse()
      .find(({ message }) => message.role === 'assistant')?.index ?? -1;

    if (lastAssistantIndex === -1) return;

    const messagesForRegeneration = activeConversation.messages.slice(0, lastAssistantIndex);
    await sendMessage("", {
      isRegeneration: true,
      messagesForApi: messagesForRegeneration
    });
  }, [isAiResponding, activeConversation, sendMessage]);

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

  useChatEffects({
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
  });

  return {
    activeConversation, allConversations,
    isAiResponding, setIsAiResponding,
    playingMessageId, isTtsLoadingForId, chatInputValue,
    selectedVoice, selectedTtsSpeed,
    isInitialLoadComplete,
    lastUserMessageId,
    isRecording, isTranscribing,
    isCameraOpen,
    chatImageModelId,
    selectChat, startNewChat, deleteChat, sendMessage,
    handleFileSelect, clearUploadedImage, handleModelChange, handleStyleChange,
    handleVoiceChange, handleTtsSpeedChange,
    toggleWebBrowsing, toggleCodeMode, webBrowsingEnabled,
    handlePlayAudio,
    setChatInputValue,
    handleCopyToClipboard,
    regenerateLastResponse,
    retryLastRequest,
    retryMediaPart,
    startRecording, stopRecording,
    openCamera, closeCamera,
    toDate,
    setActiveConversation,
  };
}


type ChatContextValue = ReturnType<typeof useChatLogic>;

type ChatContextGroups = ReturnType<typeof buildChatContextGroups<ChatContextValue>>;

const ConversationContext = createContext<ChatContextGroups['conversation'] | undefined>(undefined);
const ComposerContext = createContext<ChatContextGroups['composer'] | undefined>(undefined);
const ModesContext = createContext<ChatContextGroups['modes'] | undefined>(undefined);
const MediaContext = createContext<ChatContextGroups['media'] | undefined>(undefined);

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

  const chatContextGroups = buildChatContextGroupsWithOverrides(chatLogic, {
    composer: {
      setChatInputValue: setChatInputValueWrapper,
    },
  });

  return (
    <ConversationContext.Provider value={chatContextGroups.conversation}>
      <ComposerContext.Provider value={chatContextGroups.composer}>
        <ModesContext.Provider value={chatContextGroups.modes}>
          <MediaContext.Provider value={chatContextGroups.media}>
            {children}
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

  return mergeChatContextGroups({ conversation, composer, modes, media }) as ChatContextValue;
};

export const useChatConversation = () => useRequiredChatContext(ConversationContext, 'useChatConversation');

export const useChatComposer = () => useRequiredChatContext(ComposerContext, 'useChatComposer');

export const useChatModes = () => useRequiredChatContext(ModesContext, 'useChatModes');

export const useChatMedia = () => useRequiredChatContext(MediaContext, 'useChatMedia');
