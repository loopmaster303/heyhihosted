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
import { AVAILABLE_POLLINATIONS_MODELS, DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME, AVAILABLE_RESPONSE_STYLES, CODE_REASONING_SYSTEM_PROMPT, isKnownPollinationsTextModelId } from '@/config/chat-options';
import { getUnifiedModel } from '@/config/unified-image-models';

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
    if (currentId && !isKnownPollinationsTextModelId(currentId)) {
      setActiveConversation((prev: Conversation | null) => prev ? { ...prev, selectedModelId: DEFAULT_POLLINATIONS_MODEL_ID } : prev);
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
    setActiveConversation((prev: Conversation | null) => prev ? {
      ...prev,
      isImageMode: newImageModeState,
      ...(newImageModeState ? { isComposeMode: false } : {})
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
    setActiveConversation((prev: Conversation | null) => prev ? {
      ...prev,
      isComposeMode: newComposeModeState,
      ...(newComposeModeState ? { isImageMode: false } : {})
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

    const { id: convId, selectedModelId: selectedModelIdRaw, selectedResponseStyleName, messages } = activeConversation;
    const selectedModelId = (selectedModelIdRaw && isKnownPollinationsTextModelId(selectedModelIdRaw))
      ? selectedModelIdRaw
      : DEFAULT_POLLINATIONS_MODEL_ID;
    let currentModel = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_POLLINATIONS_MODELS[0];

    // Hard token budget (cost control):
    // Never send full conversation history. Only send:
    // 1) A short summary of older messages (local, capped)
    // 2) The last N user turns (and their assistant replies)
    const MAX_CONTEXT_USER_TURNS = 8;
    const SUMMARY_CHAR_BUDGET = 1800;

    const toPlainTextForSummary = (content: any): string => {
      if (typeof content === 'string') return content;
      if (!Array.isArray(content)) return '';
      // Collapse multimodal content to short text markers
      return content.map((p: any) => {
        if (p?.type === 'text') return String(p.text || '');
        if (p?.type === 'image_url') return '[image]';
        if (p?.type === 'video_url') return '[video]';
        return '';
      }).filter(Boolean).join('\n');
    };

    const buildOlderMessagesSummary = (older: ChatMessage[]): string => {
      if (!older.length) return '';

      // Compressed transcript-style "summary" (deterministic, cheap, capped).
      // This is intentionally NOT an extra LLM call to avoid additional cost.
      const lines: string[] = [];
      // Only consider the most recent chunk of the older history to avoid O(n) work on very long chats.
      const tail = older.slice(-80);
      for (const msg of tail) {
        const prefix = msg.role === 'user' ? 'U' : 'A';
        const text = toPlainTextForSummary(msg.content)
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 240);
        if (text) lines.push(`${prefix}: ${text}`);
      }

      let summary = lines.join('\n').trim();
      if (summary.length > SUMMARY_CHAR_BUDGET) {
        summary = summary.slice(summary.length - SUMMARY_CHAR_BUDGET);
        // Ensure we don't start mid-line after truncation.
        const firstNewline = summary.indexOf('\n');
        if (firstNewline > 0) summary = summary.slice(firstNewline + 1);
      }

      if (!summary.trim()) return '';
      return `\n<conversation_summary>\nOlder messages (compressed, truncated):\n${summary}\n</conversation_summary>\n`;
    };

    const isAssistantAssetOutput = (m: ChatMessage): boolean => {
      if (m.role !== 'assistant') return false;
      if (Array.isArray(m.content)) {
        return m.content.some((p: any) => p?.type === 'image_url' || p?.type === 'video_url' || p?.type === 'audio_url');
      }
      const s = typeof m.content === 'string' ? m.content : '';
      return s.startsWith('data:audio/') || s.startsWith('data:image/') || s.startsWith('data:video/');
    };

    const splitMessagesForApiContext = (allMsgs: ChatMessage[]) => {
      const ua = allMsgs.filter(m => (m.role === 'user' || m.role === 'assistant') && !isAssistantAssetOutput(m));
      if (ua.length === 0) return { older: [] as ChatMessage[], recent: [] as ChatMessage[] };

      let userTurns = 0;
      let startIndex = 0;
      for (let i = ua.length - 1; i >= 0; i--) {
        if (ua[i].role === 'user') userTurns++;
        if (userTurns >= MAX_CONTEXT_USER_TURNS) {
          startIndex = i;
          break;
        }
      }
      return {
        older: ua.slice(0, startIndex),
        recent: ua.slice(startIndex),
      };
    };

    // Date/time is injected server-side in /api/chat/completion to avoid duplication
    const runtimeContext = `
<runtime_context>
    Environment: hey.hi web-interface
</runtime_context>`;

    // Only inject hidden-reasoning directive for models that support it.
    // With the user-visible allowlist, this effectively means OpenAI Nano.
    // Other models may leak <thought>/<analysis> tags into output.
    const supportsHiddenReasoning =
      selectedModelId.startsWith('claude') ||
      selectedModelId.startsWith('openai') ||
      selectedModelId === 'grok';
    const internalReasoningDirective = supportsHiddenReasoning ? `
<internal_protocol>
    - You are equipped with vision capabilities. If the user provides an image, analyze it accurately.
    - Before responding, perform a brief internal analysis of the user's intent.
    - You MAY use hidden reasoning, but do not output any <thought> or <analysis> tags to the user.
    - Final output must be clean and follow the selected persona's style.
</internal_protocol>` : '';

    const basicStylePrompt = (AVAILABLE_RESPONSE_STYLES.find(s => s.name === 'Basic') || AVAILABLE_RESPONSE_STYLES[0]).systemPrompt;
    const selectedStyle = AVAILABLE_RESPONSE_STYLES.find(s => s.name === selectedResponseStyleName);
    let effectiveSystemPrompt = selectedStyle ? selectedStyle.systemPrompt : basicStylePrompt;

    // Replace {{USERNAME}} token in style prompt (used by Companion mode)
    effectiveSystemPrompt = effectiveSystemPrompt.replace(
      /\{\{USERNAME\}\}/g,
      userDisplayName && userDisplayName !== 'User' ? userDisplayName : ''
    );

    const languageHint = language === 'de'
      ? 'User interface language: German. Default response language: German.'
      : 'User interface language: English. Default response language: English.';

    // Custom instructions placed AFTER memories/context for higher LLM priority (later = stronger)
    let customInstructionBlock = '';
    if (customSystemPrompt && customSystemPrompt.trim()) {
      const userInstruction = customSystemPrompt.replace(/{userDisplayName}/gi, userDisplayName || "User");
      customInstructionBlock = `\n<user_custom_instruction>\n${userInstruction}\n</user_custom_instruction>`;
    }

    // Context policy: Only use current-chat history. No cross-chat memory injection.
    // NOTE: Conversation summary (older messages) is injected later (after we know the final message list).
    effectiveSystemPrompt = `${effectiveSystemPrompt}\n${runtimeContext}\n<language_preference>${languageHint}</language_preference>${customInstructionBlock}\n${internalReasoningDirective}`;

    if (options.isRegeneration) {
      const regenerationInstruction = "Generiere eine neue, alternative Antwort auf die letzte Anfrage des Benutzers. Wiederhole deine vorherige Antwort nicht. Biete eine andere Perspektive oder einen anderen Stil.";
      effectiveSystemPrompt = `${regenerationInstruction}\n\n${effectiveSystemPrompt}`;
    }

    setIsAiResponding(true);
    if (!options.isRegeneration) {
      setChatInputValue('');
    }

    const userInputText = messageText.trim() || chatInputValue.trim();
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
        currentModel = fallbackModel;
      } else {
        toast({ title: "Model Incompatibility", description: `No available models support images.`, variant: "destructive" });
        setIsAiResponding(false);
        return;
      }
    }

    let updatedMessagesForState = options.messagesForApi || messages;
    let newUserMessageId: string | null = null;

    // --- VISION UPLOAD LOGIC ---
    let publicImageUrl: string | null = null;
    let localAssetId: string | null = null;

    if (isFileUpload && activeConversation.uploadedFile) {
      try {
        toast({ title: "Processing image...", description: "Saving locally and preparing for AI." });
        localAssetId = generateUUID();
        await DatabaseService.saveAsset({
          id: localAssetId,
          blob: activeConversation.uploadedFile,
          contentType: activeConversation.uploadedFile.type,
          timestamp: Date.now(),
          conversationId: convId
        });

        const sessionId = getClientSessionId();
        const fileName = activeConversation.uploadedFile.name || `upload-${Date.now()}.bin`;
        const contentType = activeConversation.uploadedFile.type || 'application/octet-stream';
        publicImageUrl = await uploadFileToS3(activeConversation.uploadedFile, fileName, contentType, {
          sessionId,
          folder: 'uploads',
        });
        console.log(`🔗 Temporäre URL für Pollen: ${publicImageUrl}`);
      } catch (e) {
        console.error("Vision preparation failed", e);
        toast({ title: "Vision Error", description: "Could not prepare image for AI.", variant: "destructive" });
        setIsAiResponding(false);
        return;
      }
    }

    if (!options.isRegeneration) {
      const textContent = userInputText;
      let userMessageContent: string | ChatMessageContentPart[] = textContent;
      
      const hasStudioImages = options.imageConfig && options.imageConfig.uploadedImages.length > 0;

      if (isFileUpload || hasStudioImages) {
        const contentParts: ChatMessageContentPart[] = [];
        let labelText = "Vision Context:\n";

        if (isFileUpload && (activeConversation.uploadedFilePreview || localAssetId)) {
          contentParts.push({
            type: 'image_url',
            image_url: {
              url: activeConversation.uploadedFilePreview || '',
              remoteUrl: publicImageUrl || undefined,
              altText: activeConversation.uploadedFile?.name,
              isUploaded: true,
              metadata: { assetId: localAssetId }
            }
          });
          labelText += `- IMAGE_0: Current Upload\n`;
        }

        if (hasStudioImages) {
          options.imageConfig?.uploadedImages.forEach((ref, i) => {
            contentParts.push({
              type: 'image_url',
              image_url: {
                url: ref.url,
                altText: `Studio Image ${i+1}`,
                isUploaded: true
              }
            });
            labelText += `- IMAGE_${i+1}: Reference Image\n`;
          });
        }

        contentParts.unshift({ type: 'text', text: `${labelText}\n${textContent || "Analyze these images."}` });
        userMessageContent = contentParts;
      }

      const userMessage: ChatMessage = { id: generateUUID(), role: 'user', content: userMessageContent, timestamp: new Date().toISOString(), toolType: 'long language loops' };
      newUserMessageId = userMessage.id;

      updatedMessagesForState = [...messages, userMessage];
      setActiveConversation((prev: Conversation | null) => prev ? { ...prev, messages: updatedMessagesForState } : null);
      setLastUserMessageId(newUserMessageId);
    } else {
      const lastUserMsg = updatedMessagesForState.slice().reverse().find((m: ChatMessage) => m.role === 'user');
      if (lastUserMsg) {
        newUserMessageId = lastUserMsg.id;
        setActiveConversation((prev: Conversation | null) => prev ? { ...prev, messages: updatedMessagesForState } : null);
        setLastUserMessageId(lastUserMsg.id);
      }
    }

    const { older: olderMessages, recent: recentMessages } = splitMessagesForApiContext(updatedMessagesForState);
    const olderSummaryBlock = buildOlderMessagesSummary(olderMessages);

    const historyForApiRecent: ApiChatMessage[] = recentMessages
      .map(msg => {
        let content: string | ChatMessageContentPart[] = msg.content;
        
        if (Array.isArray(content)) {
          if (!currentModel.vision || msg.role === 'assistant') {
            const textParts = content.filter(part => part.type === 'text');
            content = textParts.map(p => (p as any).text).join('\n');
          } else {
            content = content.map(part => {
              if (part.type === 'image_url') {
                return {
                  type: 'image_url',
                  image_url: { url: part.image_url.remoteUrl || part.image_url.url }
                };
              }
              return part;
            });
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

      const effectivePrompt = messageText.trim() || chatInputValue.trim();
      if (isImagePrompt && effectivePrompt) {
        const imageConfig = options.imageConfig;
        const modelInfo = getUnifiedModel(selectedImageModelId);
        const isPollinationsModel = true;
        const isPollinationsVideo = modelInfo?.kind === 'video';

        const resolvedReferenceUrls = imageConfig
          ? await resolveReferenceUrls(imageConfig.uploadedImages)
          : [];

        const enrichedPrompt = effectivePrompt;

        const imageParams: any = {
          prompt: enrichedPrompt.trim(),
          modelId: selectedImageModelId,
        };

        if (imageConfig) {
          const { formFields } = imageConfig;
          if (resolvedReferenceUrls.length > 0) {
            // Pollinations: Always use 'image'
            imageParams.image = resolvedReferenceUrls;
          }

          if (modelInfo?.kind === 'video' || selectedImageModelId.includes('wan') || formFields.duration) {
            if (formFields.aspect_ratio) imageParams.aspect_ratio = formFields.aspect_ratio;

            // Duration: Safe Parsing
            if (formFields.duration !== undefined && formFields.duration !== null) {
              imageParams.duration = Number(formFields.duration);
            }

            // Audio: Explicit Boolean Check
            if (formFields.audio !== undefined) {
              imageParams.audio = formFields.audio;
            }
          } else {
            imageParams.width = formFields.width || 1024;
            imageParams.height = formFields.height || 1024;
            if (formFields.resolution) imageParams.resolution = formFields.resolution;
          }
        } 

        const imageUrl = await ChatService.generateImage(imageParams);
        let localAssetId: string | undefined;

        console.log(`🎨 Generated Image URL: ${imageUrl}`);

        if (imageUrl) {
            const isVideo = modelInfo?.kind === 'video';

            // Use centralized asset saving logic
            localAssetId = await GalleryService.saveGeneratedAsset({
                url: imageUrl,
                prompt: enrichedPrompt,
                modelId: selectedImageModelId,
                conversationId: convId,
                sessionId: getClientSessionId(),
                isVideo,
                isPollinations: isPollinationsModel
            });
        }

        // Show ephemeral status instead of permanent text message
        toast({ title: "Generation started", description: `Creating image with ${selectedImageModelId}...`, duration: 3000 });

        const isVideo = modelInfo?.kind === 'video';
        const aiResponseContent: ChatMessageContentPart[] = isVideo
          ? [
              {
                type: 'video_url',
                video_url: {
                  url: imageUrl,
                  altText: `Generated video (${selectedImageModelId})`,
                  isGenerated: true,
                  metadata: localAssetId ? { assetId: localAssetId } : undefined
                }
              }
            ]
          : [
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  altText: `Generated image (${selectedImageModelId})`,
                  isGenerated: true,
                  metadata: localAssetId ? { assetId: localAssetId } : undefined
                }
              }
            ];
        aiMessage = { id: generateUUID(), role: 'assistant', content: aiResponseContent, timestamp: new Date().toISOString(), toolType: 'long language loops' };
        finalMessages = [...updatedMessagesForState, aiMessage];
      } else {

        const isCodeMode = !!activeConversation.isCodeMode && !isImagePrompt;
        const modelIdForRequest = currentModel.id;

        let systemPromptForRequest = effectiveSystemPrompt;
        if (isCodeMode) {
          systemPromptForRequest = CODE_REASONING_SYSTEM_PROMPT;
        }
        // Inject capped summary of older messages to preserve minimal continuity without sending full history.
        if (olderSummaryBlock) {
          systemPromptForRequest = `${olderSummaryBlock}\n${systemPromptForRequest}`;
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

        finalMessages = [...updatedMessagesForState, baseAssistantMessage];
        setActiveConversation((prev: Conversation | null) => prev ? { ...prev, messages: finalMessages } : null);

        let streamedContent = '';
        await ChatService.sendChatCompletion({
          messages: historyForApiRecent,
          modelId: modelIdForRequest,
          systemPrompt: systemPromptForRequest,
          webBrowsingEnabled,
        }, (delta: string) => {
          streamedContent = delta;
          const updatedAssistantMessage: ChatMessage = { ...baseAssistantMessage, content: streamedContent, isStreaming: true };
          setActiveConversation((prev: Conversation | null) => {
            if (!prev) return null;
            const paramsMessages = [...prev.messages];
            if (paramsMessages.length > 0 && paramsMessages[paramsMessages.length - 1].id === streamingMessageId) {
              paramsMessages[paramsMessages.length - 1] = updatedAssistantMessage;
              return { ...prev, messages: paramsMessages };
            }
            return { ...prev, messages: [...paramsMessages, updatedAssistantMessage] };
          });
          finalMessages = [...updatedMessagesForState, updatedAssistantMessage];
        });

        const completedAssistantMessage: ChatMessage = {
          ...baseAssistantMessage,
          content: streamedContent.trim() || "Sorry, I couldn't get a response.",
          isStreaming: false
        };
        aiMessage = completedAssistantMessage;
        finalMessages = [...updatedMessagesForState, completedAssistantMessage];
        setActiveConversation((prev: Conversation | null) => prev ? { ...prev, messages: finalMessages } : null);
      }

      const userMessageCount = finalMessages.filter((m: ChatMessage) => m.role === 'user').length;
      const assistantMessageCount = finalMessages.filter((m: ChatMessage) => m.role === 'assistant') .length;
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
        messageText: options.isRegeneration ? '' : userInputText,
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
      const finalConversationState = { messages: finalMessages, title: finalTitle, updatedAt: new Date().toISOString(), uploadedFile: null, uploadedFilePreview: null };

      if (finalMessages.length >= 2 && !isImagePrompt) {
        MemoryService.extractMemories(convId, finalMessages).catch(console.error);
      }

      setActiveConversation((prev: Conversation | null) => prev ? { ...prev, ...finalConversationState } : null);
      setIsAiResponding(false);
    }
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
        const safeInitialModelId = isKnownPollinationsTextModelId(initialModelId) ? initialModelId : DEFAULT_POLLINATIONS_MODEL_ID;
        setActiveConversation((prev: Conversation | null) => prev ? { 
            ...prev, 
            selectedModelId: safeInitialModelId,
            isImageMode: initialImageMode || prev.isImageMode, // Preserve or Override
            isComposeMode: initialComposeMode,
            isCodeMode: initialCodeMode || prev.isCodeMode,
            webBrowsingEnabled: initialWebBrowsing || prev.webBrowsingEnabled
        } : null);
      }
      return;
    }

    const newConversationId = generateUUID();
    const newConversationData: Conversation = {
      id: newConversationId,
      title: t('nav.newConversation'),
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      toolType: 'long language loops',
      isImageMode: initialImageMode,
      isComposeMode: initialComposeMode,
      isCodeMode: initialCodeMode,
      webBrowsingEnabled: initialWebBrowsing,
      selectedModelId: (
        (initialModelId && isKnownPollinationsTextModelId(initialModelId) ? initialModelId : undefined) ||
        (defaultTextModelId && isKnownPollinationsTextModelId(defaultTextModelId) ? defaultTextModelId : undefined) ||
        DEFAULT_POLLINATIONS_MODEL_ID
      ),
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
      const safeModelId = isKnownPollinationsTextModelId(modelId) ? modelId : DEFAULT_POLLINATIONS_MODEL_ID;
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

    const lastMessageIndex = activeConversation.messages.length - 1;
    const lastMessage = activeConversation.messages[lastMessageIndex];

    if (!lastMessage || lastMessage.role !== 'assistant') {
      toast({ title: "Action Not Available", description: "You can only regenerate the AI's most recent response.", variant: "destructive" });
      return;
    }

    const messagesForRegeneration = activeConversation.messages.slice(0, lastMessageIndex);

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


const ChatContext = createContext<ChatContextValue | undefined>(undefined);

function normalizeLegacyTextModelId(id: string): string {
  if (!id) return id;
  if (id === 'kimi-k2-thinking') return 'kimi';
  if (id === 'nomnom') return 'perplexity-fast';
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
