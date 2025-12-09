
'use client';

/* eslint-disable react-hooks/exhaustive-deps */

import React, { useCallback, useContext, createContext } from 'react';
import { useToast } from "@/hooks/use-toast";
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useLanguage } from './LanguageProvider';
import { generateUUID } from '@/lib/uuid';

import type { ChatMessage, Conversation, ChatMessageContentPart, ApiChatMessage } from '@/types';
import type {
  PollinationsChatCompletionResponse,
  ImageGenerationResponse,
  TitleGenerationResponse,
  ApiErrorResponse,
} from '@/types/api';
import { isApiErrorResponse, isPollinationsChatResponse } from '@/types/api';
import { DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME, AVAILABLE_RESPONSE_STYLES, AVAILABLE_POLLINATIONS_MODELS, CODE_REASONING_SYSTEM_PROMPT } from '@/config/chat-options';

// Import extracted hooks and helpers
import { useChatState } from '@/hooks/useChatState';
import { useChatAudio } from '@/hooks/useChatAudio';
import { useChatRecording } from '@/hooks/useChatRecording';
import { useChatEffects } from '@/hooks/useChatEffects';
import { ChatService } from '@/lib/services/chat-service';
import { toDate } from '@/utils/chatHelpers';

export interface UseChatLogicProps {
  userDisplayName?: string;
  customSystemPrompt?: string;
}

const MAX_STORED_CONVERSATIONS = 50;

export function useChatLogic({ userDisplayName, customSystemPrompt }: UseChatLogicProps) {
  // --- State Management (extracted to hook) ---
  const state = useChatState();
  const {
    allConversations,
    setAllConversations,
    activeConversation,
    setActiveConversation,
    isInitialLoadComplete,
    setIsInitialLoadComplete,
    isAiResponding,
    setIsAiResponding,
    isHistoryPanelOpen,
    setIsHistoryPanelOpen,
    isAdvancedPanelOpen,
    setIsAdvancedPanelOpen,
    isEditTitleDialogOpen,
    setIsEditTitleDialogOpen,
    chatToEditId,
    setChatToEditId,
    editingTitle,
    setEditingTitle,
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
    webBrowsingEnabled,
  } = state;

  const { toast } = useToast();
  const { t } = useLanguage();

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

  // Callback for file handling (used by toggleImageMode, clearUploadedImage)
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
    if (!activeConversation) return; // Stellen Sie sicher, dass activeConversation existiert
    if (fileOrDataUri) {
      if (typeof fileOrDataUri === 'string') {
        const file = dataURItoFile(fileOrDataUri, `capture-${Date.now()}.jpg`);
        setActiveConversation(prev => prev ? { ...prev, isImageMode: false, uploadedFile: file, uploadedFilePreview: fileOrDataUri } : null);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setActiveConversation(prev => prev ? { ...prev, isImageMode: false, uploadedFile: fileOrDataUri, uploadedFilePreview: reader.result as string } : null);
        };
        reader.readAsDataURL(fileOrDataUri);
      }
    } else {
      setActiveConversation(prev => prev ? { ...prev, uploadedFile: null, uploadedFilePreview: null } : null);
    }
  }, [activeConversation, dataURItoFile, setActiveConversation]);

  const clearUploadedImage = useCallback(() => {
    if (activeConversation) {
      setActiveConversation(prev => prev ? { ...prev, uploadedFile: null, uploadedFilePreview: null } : null);
    }
  }, [activeConversation]);

  // Callbacks for panel toggles (used by other toggle functions)
  const closeHistoryPanel = useCallback(() => setIsHistoryPanelOpen(false), []);
  const closeAdvancedPanel = useCallback(() => setIsAdvancedPanelOpen(false), []);

  // Core Chat Logic Functions (can now reference helpers defined above)

  const toggleImageMode = useCallback(() => {
    if (!activeConversation) return;
    const newImageModeState = !(activeConversation.isImageMode ?? false);
    setActiveConversation(prev => prev ? { ...prev, isImageMode: newImageModeState } : prev);
    if (newImageModeState) {
      handleFileSelect(null, null); // handleFileSelect ist jetzt bekannt
    }
  }, [activeConversation, handleFileSelect, setActiveConversation]);

  const updateConversationTitle = useCallback(async (conversationId: string, messagesForTitleGen: ChatMessage[]): Promise<string> => {
    const convToUpdate = allConversations.find(c => c.id === conversationId) ?? activeConversation;
    if (!convToUpdate || convToUpdate.toolType !== 'long language loops') {
      return activeConversation?.title || t('nav.newConversation');
    }

    // Early return if title is already good (not default)
    const isDefaultTitle =
      convToUpdate.title === t('nav.newConversation') ||
      convToUpdate.title.toLowerCase().startsWith("new ") ||
      convToUpdate.title === "Chat";

    if (!isDefaultTitle && convToUpdate.title && convToUpdate.title.length > 2) {
      return convToUpdate.title;
    }

    const fallbackFromUser = (() => {
      const firstUser = messagesForTitleGen.find(msg => msg.role === 'user');
      if (!firstUser) return '';
      if (typeof firstUser.content === 'string') return firstUser.content.split(/\s+/).slice(0, 6).join(' ');
      const textPart = firstUser.content.find(p => p.type === 'text');
      return textPart?.text?.split(/\s+/).slice(0, 6).join(' ') || '';
    })();

    if (messagesForTitleGen.length >= 1 && isDefaultTitle) {
      const firstUserMessage = messagesForTitleGen.find(msg => msg.role === 'user');
      const firstAssistantMessage = messagesForTitleGen.find(msg => msg.role === 'assistant');

      const extractText = (msg?: ChatMessage) => {
        if (!msg) return '';
        if (typeof msg.content === 'string') return msg.content;
        const textPart = msg.content.find(p => p.type === 'text');
        return textPart?.text || '';
      };

      const userText = extractText(firstUserMessage).trim();
      const assistantText = extractText(firstAssistantMessage).trim();
      const contextForTitle = [userText, assistantText].filter(Boolean).join('\n');

      if (!contextForTitle && fallbackFromUser) {
        setActiveConversation(prev => prev ? { ...prev, title: fallbackFromUser } : null);
        return fallbackFromUser;
      }

      if (contextForTitle) {
        try {
          const finalTitle = await ChatService.generateTitle(contextForTitle);

          // Use fallback if title is generic or empty
          const titleToSet = finalTitle && finalTitle.toLowerCase() !== 'chat' && finalTitle.length > 2
            ? finalTitle
            : (fallbackFromUser || "Chat");

          if (titleToSet && titleToSet !== convToUpdate.title) {
            console.log('[updateConversationTitle] Title updated:', titleToSet);
            setActiveConversation(prev => prev ? { ...prev, title: titleToSet } : null);
          }
          return titleToSet;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('[updateConversationTitle] Failed to generate title:', errorMessage);
          const titleToSet = fallbackFromUser || convToUpdate.title;
          if (titleToSet && titleToSet !== convToUpdate.title) {
            console.log('[updateConversationTitle] Using fallback title:', titleToSet);
            setActiveConversation(prev => prev ? { ...prev, title: titleToSet } : null);
          }
          return titleToSet;
        }
      }
    }

    if (isDefaultTitle && fallbackFromUser) {
      setActiveConversation(prev => prev ? { ...prev, title: fallbackFromUser } : null);
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
    } = {}
  ) => {
    if (!activeConversation || activeConversation.toolType !== 'long language loops') return;

    const { id: convId, selectedModelId, selectedResponseStyleName, messages } = activeConversation;
    let currentModel = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_POLLINATIONS_MODELS[0];

    let effectiveSystemPrompt = '';
    const basicStylePrompt = (AVAILABLE_RESPONSE_STYLES.find(s => s.name === 'Basic') || AVAILABLE_RESPONSE_STYLES[0]).systemPrompt;

    if (selectedResponseStyleName === "User's Default") {
      if (customSystemPrompt && customSystemPrompt.trim()) {
        effectiveSystemPrompt = customSystemPrompt.replace(/{userDisplayName}/gi, userDisplayName || "User");
      } else {
        effectiveSystemPrompt = basicStylePrompt;
      }
    } else {
      const selectedStyle = AVAILABLE_RESPONSE_STYLES.find(s => s.name === selectedResponseStyleName);
      effectiveSystemPrompt = selectedStyle ? selectedStyle.systemPrompt : basicStylePrompt;
    }

    if (options.isRegeneration) {
      const regenerationInstruction = "Generiere eine neue, alternative Antwort auf die letzte Anfrage des Benutzers. Wiederhole deine vorherige Antwort nicht. Biete eine andere Perspektive oder einen anderen Stil.";
      effectiveSystemPrompt = `${regenerationInstruction}\n\n${effectiveSystemPrompt}`;
    }

    setIsAiResponding(true);
    if (!options.isRegeneration) {
      setChatInputValue('');
      // Mark that user has interacted (persists across new chats, resets on page reload)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('hasInteracted', 'true');
      }
    }

    const isImagePrompt = options.isImageModeIntent || false;
    const isFileUpload = !!activeConversation.uploadedFile && !isImagePrompt;

    if (isFileUpload && !currentModel.vision) {
      const fallbackModel = AVAILABLE_POLLINATIONS_MODELS.find(m => m.vision);
      if (fallbackModel) {
        toast({
          title: "Model Switched",
          description: `Model '${currentModel.name}' doesn't support images. Using '${fallbackModel.name}' for this request.`,
          variant: "default"
        });
        currentModel = fallbackModel; // Use fallback model for this request only
      } else {
        toast({ title: "Model Incompatibility", description: `No available models support images.`, variant: "destructive" });
        setIsAiResponding(false);
        return;
      }
    }

    let updatedMessagesForState = options.messagesForApi || messages;
    let newUserMessageId: string | null = null;

    if (!options.isRegeneration) {
      const textContent = messageText.trim() || chatInputValue.trim();
      let userMessageContent: string | ChatMessageContentPart[] = textContent;
      if (isFileUpload && activeConversation.uploadedFilePreview) {
        userMessageContent = [
          { type: 'text', text: textContent || "Describe this image." },
          { type: 'image_url', image_url: { url: activeConversation.uploadedFilePreview, altText: activeConversation.uploadedFile?.name, isUploaded: true } }
        ];
      }

      // Check if we have valid content to send
      if (!userMessageContent && !isFileUpload) {
        // Should usually be caught by UI, but as safety
        setIsAiResponding(false);
        return;
      }

      const userMessage: ChatMessage = { id: generateUUID(), role: 'user', content: userMessageContent, timestamp: new Date().toISOString(), toolType: 'long language loops' };
      newUserMessageId = userMessage.id;

      updatedMessagesForState = [...messages, userMessage];
      setActiveConversation(prev => prev ? { ...prev, messages: updatedMessagesForState } : null);
      setLastUserMessageId(userMessage.id);
    } else {
      const lastUserMsg = updatedMessagesForState.slice().reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        newUserMessageId = lastUserMsg.id;
        setActiveConversation(prev => prev ? { ...prev, messages: updatedMessagesForState } : null);
        setLastUserMessageId(lastUserMsg.id);
      }
    }

    const historyForApi: ApiChatMessage[] = updatedMessagesForState
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => {
        let content: string | ChatMessageContentPart[] = msg.content;
        // If model doesn't support vision OR if the message is from assistant, filter out images.
        if (!currentModel.vision || msg.role === 'assistant') {
          if (Array.isArray(content)) {
            const textParts = content.filter(part => part.type === 'text');
            content = textParts.map(p => p.text).join('\n');
          }
        }
        return {
          role: msg.role as 'user' | 'assistant',
          content: content,
        };
      });

    let finalMessages = updatedMessagesForState;
    let finalTitle = activeConversation.title;

    try {
      let aiMessage: ChatMessage;

      // Image Mode and Code Mode are mutually exclusive - Image Mode takes precedence
      const effectivePrompt = messageText.trim() || chatInputValue.trim();
      if (isImagePrompt && effectivePrompt) {
        // Parse aspect ratio from prompt if present (simple check)
        const promptText = effectivePrompt;
        let width = 1024;
        let height = 1024;

        if (promptText.includes('--ar 16:9')) {
          width = 1216; height = 832; // Flux approximate landscape
        } else if (promptText.includes('--ar 9:16')) {
          width = 832; height = 1216; // Flux approximate portrait
        }

        const imageUrl = await ChatService.generateImage({
          prompt: promptText.replace(/--ar \d+:\d+/g, '').trim(), // Clean prompt
          modelId: selectedImageModelId,
          width,
          height
        });

        const aiResponseContent: ChatMessageContentPart[] = [
          { type: 'text', text: `Your image generation with model "${selectedImageModelId}" started. It may take a few seconds to arrive.` },
          { type: 'image_url', image_url: { url: imageUrl, altText: `Generated image (${selectedImageModelId})`, isGenerated: true } }
        ];
        aiMessage = { id: generateUUID(), role: 'assistant', content: aiResponseContent, timestamp: new Date().toISOString(), toolType: 'long language loops' };
        finalMessages = [...updatedMessagesForState, aiMessage];
      } else {

        const isCodeMode = !!activeConversation.isCodeMode && !isImagePrompt;
        const modelIdForRequest = isCodeMode ? 'qwen-coder' : currentModel.id;
        let systemPromptForRequest = effectiveSystemPrompt;
        if (isCodeMode) {
          systemPromptForRequest = CODE_REASONING_SYSTEM_PROMPT;
        }

        const streamingMessageId = generateUUID();
        const baseAssistantMessage: ChatMessage = {
          id: streamingMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          toolType: 'long language loops',
          isStreaming: true,
        };

        // We'll optimistically add empty message for streaming
        finalMessages = [...updatedMessagesForState, baseAssistantMessage];
        setActiveConversation(prev => prev ? { ...prev, messages: finalMessages } : null);

        let streamedContent = '';
        await ChatService.sendChatCompletion({
          messages: historyForApi,
          modelId: modelIdForRequest,
          systemPrompt: systemPromptForRequest,
          webBrowsingEnabled,
        }, (delta: string) => {
          // onStream callback
          streamedContent = delta;
          const updatedAssistantMessage: ChatMessage = { ...baseAssistantMessage, content: streamedContent, isStreaming: true };
          // Update state on each chunk - optimizations might be needed for very large streams but this matches previous logic
          // We re-create the array to force re-render
          setActiveConversation(prev => {
            if (!prev) return null;
            const paramsMessages = [...prev.messages];
            // Replace the last message which is our streaming message
            if (paramsMessages.length > 0 && paramsMessages[paramsMessages.length - 1].id === streamingMessageId) {
              paramsMessages[paramsMessages.length - 1] = updatedAssistantMessage;
              return { ...prev, messages: paramsMessages };
            }
            return { ...prev, messages: [...paramsMessages, updatedAssistantMessage] };
          });
          // Also update local finalMessages for final state
          finalMessages = [...updatedMessagesForState, updatedAssistantMessage];
        });

        // Finalize message
        const completedAssistantMessage: ChatMessage = {
          ...baseAssistantMessage,
          content: streamedContent.trim() || "Sorry, I couldn't get a response.",
          isStreaming: false
        };
        aiMessage = completedAssistantMessage;

        // Ensure final state update
        finalMessages = [...updatedMessagesForState, completedAssistantMessage];
        setActiveConversation(prev => prev ? { ...prev, messages: finalMessages } : null);
      }

      // Title generation logic
      const userMessageCount = finalMessages.filter(m => m.role === 'user').length;
      const assistantMessageCount = finalMessages.filter(m => m.role === 'assistant').length;
      const isFirstMessagePair = userMessageCount === 1 && assistantMessageCount === 1;
      const isDefaultTitle = activeConversation.title === t('nav.newConversation') ||
        activeConversation.title.toLowerCase().startsWith("new ") ||
        activeConversation.title === "Chat";

      if (isFirstMessagePair || isDefaultTitle) {
        finalTitle = await updateConversationTitle(convId, finalMessages);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      console.error("Chat API Error:", error);

      setLastFailedRequest({
        messageText: options.isRegeneration ? '' : chatInputValue.trim(),
        options,
        timestamp: Date.now()
      });

      toast({
        title: "Fehler beim Senden",
        description: errorMessage,
        variant: "destructive",
        action: (
          <button
            onClick={() => retryLastRequestRef.current?.()}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Erneut versuchen
          </button>
        )
      });
      const errorMsg: ChatMessage = { id: generateUUID(), role: 'assistant', content: `Sorry, an error occurred: ${errorMessage}`, timestamp: new Date().toISOString(), toolType: 'long language loops' };
      finalMessages = [...updatedMessagesForState, errorMsg];
    } finally {
      const finalConversationState = { messages: finalMessages, title: finalTitle, updatedAt: new Date().toISOString(), isImageMode: false, uploadedFile: null, uploadedFilePreview: null };

      setActiveConversation(prev => prev ? { ...prev, ...finalConversationState } : null);
      setIsAiResponding(false);
    }
  }, [activeConversation, customSystemPrompt, userDisplayName, toast, chatInputValue, updateConversationTitle, setActiveConversation, setLastUserMessageId, selectedImageModelId, webBrowsingEnabled]);

  const selectChat = useCallback((conversationId: string | null) => {
    if (conversationId === null) {
      setActiveConversation(null);
      return;
    }
    const conversationToSelect = allConversations.find(c => c.id === conversationId);
    if (conversationToSelect) {
      setActiveConversation({
        ...conversationToSelect,
        isImageMode: conversationToSelect.isImageMode ?? false,
        isCodeMode: conversationToSelect.isCodeMode ?? false,
        webBrowsingEnabled: conversationToSelect.webBrowsingEnabled ?? false,
        uploadedFile: null,
        uploadedFilePreview: null
      });
      setLastUserMessageId(null); // Reset scroll target on chat switch
    }
  }, [allConversations, setActiveConversation, setLastUserMessageId]);

  // startNewChat muss vor dem useEffect definiert werden, der es aufruft
  const startNewChat = useCallback(() => {
    const newConversationId = generateUUID();
    const newConversationData: Conversation = {
      id: newConversationId,
      title: t('nav.newConversation'),
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      toolType: 'long language loops',
      isImageMode: false,
      isCodeMode: false,
      webBrowsingEnabled: false,
      selectedModelId: DEFAULT_POLLINATIONS_MODEL_ID,
      selectedResponseStyleName: DEFAULT_RESPONSE_STYLE_NAME,
    };

    // Prune old conversations if necessary
    if (allConversations.length >= MAX_STORED_CONVERSATIONS) {
      const sortedConvs = [...allConversations].sort((a, b) => toDate(a.updatedAt).getTime() - toDate(b.updatedAt).getTime());
      const oldestConversation = sortedConvs[0];
      if (oldestConversation) {
        setAllConversations(prev => prev.filter(c => c.id !== oldestConversation.id));
      }
    }

    setActiveConversation(newConversationData);
    setLastUserMessageId(null); // Reset scroll target on new chat

    return newConversationData;
  }, [allConversations, setAllConversations, setActiveConversation, setLastUserMessageId]);

  const requestEditTitle = useCallback((conversationId: string) => {
    const convToEdit = allConversations.find(c => c.id === conversationId);
    if (!convToEdit) return;
    setChatToEditId(conversationId);
    setEditingTitle(convToEdit.title);
    setIsEditTitleDialogOpen(true);
  }, [allConversations]);

  const confirmEditTitle = useCallback(() => {
    if (!chatToEditId || !editingTitle.trim()) {
      toast({ title: "Invalid Title", description: "Title cannot be empty.", variant: "destructive" });
      return;
    }
    const newTitle = editingTitle.trim();

    setAllConversations(prev => prev.map(c => c.id === chatToEditId ? { ...c, title: newTitle } : c));
    setActiveConversation(prev => (prev?.id === chatToEditId) ? { ...prev, title: newTitle } : prev);

    toast({ title: "Title Updated" });
    setIsEditTitleDialogOpen(false);
  }, [chatToEditId, editingTitle, setAllConversations, setActiveConversation, toast]);

  const cancelEditTitle = useCallback(() => setIsEditTitleDialogOpen(false), []);

  const deleteChat = useCallback((conversationId: string) => {
    const wasActive = activeConversation?.id === conversationId;

    setAllConversations(prev => prev.filter(c => c.id !== conversationId));

    if (wasActive) {
      const nextChat = allConversations.filter(c => c.id !== conversationId && c.toolType === 'long language loops')
        .sort((a, b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime())[0] ?? null;

      if (nextChat) {
        selectChat(nextChat.id);
      } else {
        startNewChat(); // startNewChat ist jetzt bekannt
      }
    }

    toast({ title: "Chat Deleted" });
  }, [activeConversation?.id, allConversations, selectChat, setAllConversations, toast, startNewChat]);

  const handleModelChange = useCallback((modelId: string) => {
    if (activeConversation) {
      setActiveConversation(prev => prev ? { ...prev, selectedModelId: modelId } : null);
    }
  }, [activeConversation, setActiveConversation]);

  const handleImageModelChange = useCallback((modelId: string) => {
    setSelectedImageModelId(modelId);
  }, [setSelectedImageModelId]);



  const handleStyleChange = useCallback((styleName: string) => {
    if (activeConversation) {
      setActiveConversation(prev => prev ? { ...prev, selectedResponseStyleName: styleName } : null);
    }
  }, [activeConversation, setActiveConversation]);

  const handleVoiceChange = useCallback((voiceId: string) => {
    setSelectedVoice(voiceId);
  }, []);

  const toggleHistoryPanel = useCallback(() => setIsHistoryPanelOpen(prev => !prev), []);
  const toggleAdvancedPanel = useCallback(() => setIsAdvancedPanelOpen(prev => !prev), []);
  const toggleWebBrowsing = useCallback(() => {
    setActiveConversation(prev => prev ? { ...prev, webBrowsingEnabled: !(prev.webBrowsingEnabled ?? false) } : prev);
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

    const lastMessageIndex = activeConversation.messages.length - 1;
    const lastMessage = activeConversation.messages[lastMessageIndex];

    if (!lastMessage || lastMessage.role !== 'assistant') {
      toast({ title: "Action Not Available", description: "You can only regenerate the AI's most recent response.", variant: "destructive" });
      return;
    }

    const messagesForRegeneration = activeConversation.messages.slice(0, lastMessageIndex);

    await sendMessage("", { // `sendMessage` ist jetzt in Scope
      isRegeneration: true,
      messagesForApi: messagesForRegeneration
    });

  }, [isAiResponding, activeConversation, sendMessage, toast]);

  const retryLastRequest = useCallback(async () => {
    if (!lastFailedRequest) return;

    const requestToRetry = { ...lastFailedRequest };
    setLastFailedRequest(null); // Clear before retry

    // Re-populate the input with the failed message (only if not regeneration)
    if (!requestToRetry.options?.isRegeneration && requestToRetry.messageText) {
      setChatInputValue(requestToRetry.messageText);
    }

    // Send the message again with original options
    await sendMessage(requestToRetry.messageText, requestToRetry.options);
  }, [lastFailedRequest, sendMessage, setChatInputValue]);

  const openCamera = useCallback(() => setIsCameraOpen(true), []);
  const closeCamera = useCallback(() => setIsCameraOpen(false), []);

  // --- Effects Hook ---
  useChatEffects({
    isHistoryPanelOpen,
    isAdvancedPanelOpen,
    isInitialLoadComplete,
    setIsInitialLoadComplete,
    allConversations,
    activeConversation,
    selectedImageModelId,
    setIsHistoryPanelOpen,
    setIsAdvancedPanelOpen,
    setActiveConversation,
    setAllConversations,
    setAvailableImageModels,
    setSelectedImageModelId,
    setLastUserMessageId,
    startNewChat,
    retryLastRequest,
    retryLastRequestRef,
  });


  // --- Return Value ---
  return {
    activeConversation, allConversations,
    isAiResponding, isImageMode,
    isHistoryPanelOpen, isAdvancedPanelOpen,
    isEditTitleDialogOpen, editingTitle,
    playingMessageId, isTtsLoadingForId, chatInputValue,
    selectedVoice,
    isInitialLoadComplete,
    lastUserMessageId, // Expose for the view
    isRecording, isTranscribing,
    isCameraOpen,
    availableImageModels, selectedImageModelId,
    selectChat, startNewChat, deleteChat, sendMessage,
    requestEditTitle, confirmEditTitle, cancelEditTitle, setEditingTitle,
    toggleImageMode,
    handleFileSelect, clearUploadedImage, handleModelChange, handleStyleChange,
    handleVoiceChange, handleImageModelChange,
    toggleHistoryPanel, closeHistoryPanel,
    toggleAdvancedPanel, closeAdvancedPanel,
    toggleWebBrowsing, webBrowsingEnabled,
    handlePlayAudio,
    setChatInputValue,
    handleCopyToClipboard,
    regenerateLastResponse, // regenerateLastResponse ist jetzt in Scope
    retryLastRequest,
    startRecording, stopRecording,
    openCamera, closeCamera,
    toDate,
    setActiveConversation,

  };
}


interface ChatContextValue extends ReturnType<typeof useChatLogic> {
  // No extra fields needed, everything is in useChatLogic
}


const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userDisplayName] = useLocalStorageState<string>("userDisplayName", "User");
  const [customSystemPrompt] = useLocalStorageState<string>("customSystemPrompt", "");
  // The API token is no longer needed on the client, it's handled by the backend API route.
  const chatLogic = useChatLogic({ userDisplayName, customSystemPrompt });

  // This is a bit of a workaround to satisfy TypeScript's strictness
  // for the setChatInputValue function passed to the input component.
  const setChatInputValueWrapper = useCallback((value: string | ((prev: string) => string)) => {
    chatLogic.setChatInputValue(value);
  }, [chatLogic]);

  const chatContextValue: ChatContextValue = {
    ...chatLogic,
    setChatInputValue: setChatInputValueWrapper,
  };

  return (
    <ChatContext.Provider value={chatContextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};






