'use client';

/* eslint-disable react-hooks/exhaustive-deps */

import React, { useCallback, useContext, createContext } from 'react';
import { useToast } from "@/hooks/use-toast";
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useLanguage } from './LanguageProvider';
import { generateUUID } from '@/lib/uuid';

import type { ChatMessage, Conversation, ChatMessageContentPart, ApiChatMessage, ImageHistoryItem } from '@/types';
import type {
  PollinationsChatCompletionResponse,
  ImageGenerationResponse,
  TitleGenerationResponse,
  ApiErrorResponse,
} from '@/types/api';
import { isApiErrorResponse, isPollinationsChatResponse } from '@/types/api';
import { DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME, AVAILABLE_RESPONSE_STYLES, AVAILABLE_POLLINATIONS_MODELS, CODE_REASONING_SYSTEM_PROMPT } from '@/config/chat-options';
import { getUnifiedModel } from '@/config/unified-image-models';

// Import extracted hooks and helpers
import { useChatState } from '@/hooks/useChatState';
import { useChatAudio } from '@/hooks/useChatAudio';
import { useChatRecording } from '@/hooks/useChatRecording';
import { useChatEffects } from '@/hooks/useChatEffects';
import { ChatService } from '@/lib/services/chat-service';
import { MemoryService } from '@/lib/services/memory-service';
import { DatabaseService } from '@/lib/services/database';
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
    persistedActiveConversationId,
    setPersistedActiveConversationId,
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
    mistralFallbackEnabled,
    setMistralFallbackEnabled,
  } = state;

  const { toast } = useToast();
  const { t } = useLanguage();

  const addChatImageToHistory = useCallback(async (imageUrl: string, prompt: string, model: string, conversationId?: string) => {
    if (typeof window === 'undefined') return;
    try {
      const assetId = generateUUID();
      
      // 1. In die History eintragen (Remote URL als Fallback, ID ist der Anker)
      const existing = window.localStorage.getItem('imageHistory');
      const history = existing ? (JSON.parse(existing) as ImageHistoryItem[]) : [];
      const newItem: ImageHistoryItem = {
        id: assetId,
        imageUrl: imageUrl, 
        prompt,
        model,
        timestamp: new Date().toISOString(),
        toolType: 'visualize',
        conversationId,
      };
      const next = [newItem, ...history].slice(0, 100);
      window.localStorage.setItem('imageHistory', JSON.stringify(next));

      // 2. Bild via Proxy herunterladen und im Vault sichern
      try {
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) {
          const blob = await response.blob();
          await DatabaseService.saveAsset({
            id: assetId,
            blob,
            contentType: blob.type,
            prompt,
            modelId: model,
            conversationId,
            timestamp: Date.now()
          });
          console.log(`🖼️ Bild via Proxy im Vault gesichert: ${assetId}`);
        }
      } catch (e) {
        console.warn("Vault sync failed even with proxy:", e);
      }

      // 3. UI triggern
      window.dispatchEvent(new Event('imageHistoryUpdated'));
    } catch (error) {
      console.error('Failed to update image history:', error);
    }
  }, []);

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

  const closeHistoryPanel = useCallback(() => setIsHistoryPanelOpen(false), []);
  const closeAdvancedPanel = useCallback(() => setIsAdvancedPanelOpen(false), []);

  const toggleImageMode = useCallback(() => {
    if (!activeConversation) return;
    const newImageModeState = !(activeConversation.isImageMode ?? false);
    setActiveConversation(prev => prev ? { ...prev, isImageMode: newImageModeState } : prev);
    if (newImageModeState) {
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
        setActiveConversation(prev => prev ? { ...prev, title: fallbackFromUser } : null);
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
            messagesForTitleApi,
            activeConversation?.mistralFallbackEnabled
          );

          const titleToSet = finalTitle && finalTitle.toLowerCase() !== 'chat' && finalTitle.length > 2
            ? finalTitle
            : (fallbackFromUser || "Chat");

          if (titleToSet && titleToSet !== convToUpdate.title) {
            setActiveConversation(prev => prev ? { ...prev, title: titleToSet } : null);
          }
          return titleToSet;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('[updateConversationTitle] Failed to generate title:', errorMessage);
          const titleToSet = fallbackFromUser || convToUpdate.title;
          if (titleToSet && titleToSet !== convToUpdate.title) {
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
      imageConfig?: {
        formFields: Record<string, any>;
        uploadedImages: string[];
        selectedModelId: string;
      };
    } = {}
  ) => {
    if (!activeConversation || activeConversation.toolType !== 'long language loops') return;

    const { id: convId, selectedModelId, selectedResponseStyleName, messages } = activeConversation;
    let currentModel = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_POLLINATIONS_MODELS[0];

    const now = new Date();
    const runtimeContext = `
<runtime_context>
    Current Date: ${now.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    Current Time: ${now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
    Environment: hey.hi web-interface
</runtime_context>`;

    const internalReasoningDirective = `
<internal_protocol>
    - You are equipped with vision capabilities. If the user provides an image, analyze it accurately.
    - Before responding, perform a brief internal analysis of the user's intent.
    - You MAY use hidden reasoning, but do not output any <thought> or <analysis> tags to the user.
    - Final output must be clean and follow the selected persona's style.
</internal_protocol>`;

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

    const userMemoriesContext = await MemoryService.getMemoriesAsContext();
    
    let globalContext = "";
    const lowerText = (messageText || chatInputValue).toLowerCase();
    const isAskingAboutPast = lowerText.includes("erinnerst") || lowerText.includes("remember") || lowerText.includes("früher") || lowerText.includes("vergangene");
    
    if (messages.length === 0 || isAskingAboutPast || messages.length % 50 === 0) {
      globalContext = await MemoryService.getGlobalContextSummary();
    }

    effectiveSystemPrompt = `${effectiveSystemPrompt}\n${userMemoriesContext}\n${globalContext}\n${runtimeContext}\n${internalReasoningDirective}`;

    if (options.isRegeneration) {
      const regenerationInstruction = "Generiere eine neue, alternative Antwort auf die letzte Anfrage des Benutzers. Wiederhole deine vorherige Antwort nicht. Biete eine andere Perspektive oder einen anderen Stil.";
      effectiveSystemPrompt = `${regenerationInstruction}\n\n${effectiveSystemPrompt}`;
    }

    setIsAiResponding(true);
    if (!options.isRegeneration) {
      setChatInputValue('');
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

        const formData = new FormData();
        formData.append('file', activeConversation.uploadedFile);
        const uploadRes = await fetch('/api/upload/temp', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        
        if (uploadData.url) {
          publicImageUrl = uploadData.url;
          console.log(`🔗 Temporäre URL für Pollen: ${publicImageUrl}`);
        } else {
          throw new Error("Relay upload failed");
        }
      } catch (e) {
        console.error("Vision preparation failed", e);
        toast({ title: "Vision Error", description: "Could not prepare image for AI.", variant: "destructive" });
        setIsAiResponding(false);
        return;
      }
    }

    if (!options.isRegeneration) {
      const textContent = messageText.trim() || chatInputValue.trim();
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
          options.imageConfig?.uploadedImages.forEach((url, i) => {
            contentParts.push({
              type: 'image_url',
              image_url: {
                url: url,
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
        const isPollinationsModel = modelInfo?.provider === 'pollinations';

        let enrichedPrompt = effectivePrompt;
        if (imageConfig && imageConfig.uploadedImages.length > 0) {
            const imageList = imageConfig.uploadedImages.map((url, i) => `IMAGE_${i+1}: ${url}`).join('\n');
            enrichedPrompt = `User provided the following reference images:\n${imageList}\n\nTask: ${effectivePrompt}`;
        }

        const imageParams: any = {
          prompt: enrichedPrompt.trim(),
          modelId: selectedImageModelId,
        };

        if (imageConfig) {
          const { formFields, uploadedImages } = imageConfig;
          if (uploadedImages.length > 0) {
            if (selectedImageModelId === 'flux-2-pro') {
              imageParams.input_images = uploadedImages;
            } else if (selectedImageModelId === 'flux-kontext-pro') {
              imageParams.input_image = uploadedImages[0];
            } else if (selectedImageModelId === 'wan-video' || selectedImageModelId === 'veo-3.1-fast') {
              imageParams.image = uploadedImages[0];
            } else if (isPollinationsModel) {
              imageParams.image = uploadedImages; 
            }
          }

          if (isPollinationsModel) {
            if (modelInfo?.kind === 'video') {
              if (formFields.aspect_ratio) imageParams.aspect_ratio = formFields.aspect_ratio;
              if (formFields.duration) imageParams.duration = Number(formFields.duration);
            } else {
              imageParams.width = formFields.width || 1024;
              imageParams.height = formFields.height || 1024;
            }
          } else if (selectedImageModelId === 'z-image-turbo') {
            const aspectRatio = formFields.aspect_ratio || '1:1';
            const aspectRatioMap: Record<string, { width: number; height: number }> = {
              '1:1': { width: 1024, height: 1024 },
              '4:3': { width: 1024, height: 768 },
              '3:4': { width: 768, height: 1024 },
              '16:9': { width: 1344, height: 768 },
              '9:16': { width: 768, height: 1344 },
            };
            const dims = aspectRatioMap[aspectRatio] || { width: 1024, height: 1024 };
            imageParams.width = dims.width;
            imageParams.height = dims.height;
          } else {
             if (formFields.aspect_ratio) imageParams.aspect_ratio = formFields.aspect_ratio;
             if (formFields.resolution) imageParams.resolution = formFields.resolution;
             if (formFields.duration) imageParams.duration = Number(formFields.duration);
          }

          if (!isPollinationsModel) {
             imageParams.output_format = formFields.output_format;
             if (selectedImageModelId === 'flux-2-pro') {
                imageParams.safety_tolerance = 5;
                imageParams.output_quality = 100;
             }
          }
        } 

        const imageUrl = await ChatService.generateImage(imageParams);

        if (isPollinationsModel && imageUrl) {
            const startTime = Date.now();
            const POLL_TIMEOUT = 120000;
            const pollResource = async (): Promise<boolean> => {
               while (Date.now() - startTime < POLL_TIMEOUT) {
                 try {
                   const res = await fetch(imageUrl, { method: 'HEAD' });
                   if (res.ok) {
                     const contentType = res.headers.get('content-type');
                     if (contentType && (contentType.startsWith('image/') || contentType.startsWith('video/'))) {
                       return true; 
                     }
                   }
                 } catch (e) {}
                 await new Promise(r => setTimeout(r, 2000));
               }
               return false;
            };
            await pollResource();
        }

        addChatImageToHistory(
          imageUrl,
          effectivePrompt.replace(/--ar \d+:\d+/g, '').trim(),
          selectedImageModelId,
          activeConversation?.id 
        );

        const aiResponseContent: ChatMessageContentPart[] = [
          { type: 'text', text: `Your image generation with model "${selectedImageModelId}" started.` },
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

        finalMessages = [...updatedMessagesForState, baseAssistantMessage];
        setActiveConversation(prev => prev ? { ...prev, messages: finalMessages } : null);

        let streamedContent = '';
        await ChatService.sendChatCompletion({
          messages: historyForApi,
          modelId: modelIdForRequest,
          systemPrompt: systemPromptForRequest,
          webBrowsingEnabled,
          mistralFallbackEnabled: mistralFallbackEnabled,
        }, (delta: string) => {
          streamedContent = delta;
          const updatedAssistantMessage: ChatMessage = { ...baseAssistantMessage, content: streamedContent, isStreaming: true };
          setActiveConversation(prev => {
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
        setActiveConversation(prev => prev ? { ...prev, messages: finalMessages } : null);
      }

      const userMessageCount = finalMessages.filter(m => m.role === 'user').length;
      const assistantMessageCount = finalMessages.filter(m => m.role === 'assistant') .length;
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
      const finalConversationState = { messages: finalMessages, title: finalTitle, updatedAt: new Date().toISOString(), uploadedFile: null, uploadedFilePreview: null };

      if (finalMessages.length >= 2) {
        MemoryService.extractMemories(convId, finalMessages).catch(console.error);
      }

      setActiveConversation(prev => prev ? { ...prev, ...finalConversationState } : null);
      setIsAiResponding(false);
    }
  }, [activeConversation, customSystemPrompt, userDisplayName, toast, chatInputValue, updateConversationTitle, setActiveConversation, setLastUserMessageId, selectedImageModelId, webBrowsingEnabled, addChatImageToHistory]);

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
        mistralFallbackEnabled: conversationToSelect.mistralFallbackEnabled ?? false,
        uploadedFile: null,
        uploadedFilePreview: null
      });
      setLastUserMessageId(null); 
    }
  }, [allConversations, setActiveConversation, setLastUserMessageId]);

  const startNewChat = useCallback((initialModelId?: string) => {
    if (activeConversation && activeConversation.messages.length === 0) {
      if (initialModelId) {
        setActiveConversation(prev => prev ? { ...prev, selectedModelId: initialModelId } : null);
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
      isImageMode: false,
      isCodeMode: false,
      webBrowsingEnabled: false,
      mistralFallbackEnabled: false,
      selectedModelId: initialModelId || DEFAULT_POLLINATIONS_MODEL_ID,
      selectedResponseStyleName: DEFAULT_RESPONSE_STYLE_NAME,
    };

    if (allConversations.length >= MAX_STORED_CONVERSATIONS) {
      const sortedConvs = [...allConversations].sort((a, b) => toDate(a.updatedAt).getTime() - toDate(b.updatedAt).getTime());
      const oldestConversation = sortedConvs[0];
      if (oldestConversation) {
        setAllConversations(prev => prev.filter(c => c.id !== oldestConversation.id));
      }
    }

    setActiveConversation(newConversationData);
    setLastUserMessageId(null); 

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
        startNewChat(); 
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

  const toggleMistralFallback = useCallback(() => {
    setActiveConversation(prev => prev ? { ...prev, mistralFallbackEnabled: !(prev.mistralFallbackEnabled ?? false) } : prev);
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
  }, [lastFailedRequest, sendMessage, setChatInputValue]);

  const openCamera = useCallback(() => setIsCameraOpen(true), []);
  const closeCamera = useCallback(() => setIsCameraOpen(false), []);

  // --- Effects Hook ---
  useChatEffects({
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
    lastUserMessageId, 
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
    toggleMistralFallback, mistralFallbackEnabled,
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

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userDisplayName] = useLocalStorageState<string>("userDisplayName", "User");
  const [customSystemPrompt] = useLocalStorageState<string>("customSystemPrompt", "");
  const chatLogic = useChatLogic({ userDisplayName, customSystemPrompt });

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
