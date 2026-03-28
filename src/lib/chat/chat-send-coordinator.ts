import type {
  ApiChatMessage,
  ChatMessage,
  ChatMessageContentPart,
  Conversation,
  UploadedReference,
} from '@/types';
import type { GenerateImageOptions } from '@/lib/services/chat-service';
import type { ToastActionElement } from '@/components/ui/toast';

interface SendOptionsLike {
  isRegeneration?: boolean;
}

interface BuildSendFailureStateInput {
  error: unknown;
  updatedMessagesForState: ChatMessage[];
  userInputText: string;
  options: SendOptionsLike;
  createMessageId: () => string;
  createTimestamp: () => string;
}

interface BuildFinalConversationStateInput {
  finalMessages: ChatMessage[];
  finalTitle: string;
  isImagePrompt: boolean;
  createTimestamp: () => string;
}

interface SelectedStyleLike {
  name: string;
  systemPrompt: string;
}

interface RequestCapabilitiesLike {
  selectedModelId: string;
  selectedModel: {
    id: string;
    name: string;
    vision?: boolean;
  };
  requiresVisionModel: boolean;
  didFallbackToVisionModel: boolean;
  fallbackModel?: {
    id: string;
    name: string;
    vision?: boolean;
  };
  isImageModeIntent: boolean;
  isCodeMode: boolean;
}

interface SendImageConfig {
  formFields: Record<string, unknown>;
  uploadedImages: UploadedReference[];
  selectedModelId: string;
}

interface SendMessageOptionsLike extends SendOptionsLike {
  isImageModeIntent?: boolean;
  messagesForApi?: ChatMessage[];
  imageConfig?: SendImageConfig;
}

interface ExecuteChatSendCoordinatorInput {
  conversation: Conversation;
  messageText: string;
  chatInputValue: string;
  selectedImageModelId: string;
  language: string;
  customSystemPrompt?: string;
  userDisplayName?: string;
  newConversationTitle: string;
  options: SendMessageOptionsLike;
  availableResponseStyles: SelectedStyleLike[];
  resolveRequestCapabilities: (input: {
    selectedModelId?: string;
    hasUploadedFile: boolean;
    isImageModeIntent?: boolean;
    isCodeMode?: boolean;
  }) => RequestCapabilitiesLike;
  buildChatSystemPrompt: (input: {
    baseStylePrompt: string;
    selectedModelId: string;
    language: string;
    userDisplayName?: string;
    customSystemPrompt?: string;
    isRegeneration?: boolean;
  }) => string;
  splitMessagesForApiContext: (messages: ChatMessage[]) => { older: ChatMessage[]; recent: ChatMessage[] };
  buildOlderMessagesSummary: (olderMessages: ChatMessage[]) => string;
  normalizeRecentMessagesForApi: (messages: ChatMessage[], modelSupportsVision: boolean) => ApiChatMessage[];
  buildSystemPromptForRequest: (input: {
    effectiveSystemPrompt: string;
    isCodeMode: boolean;
    olderSummaryBlock?: string;
  }) => string;
  runTextChatCompletionFlow: (input: {
    updatedMessagesForState: ChatMessage[];
    modelIdForRequest: string;
    systemPromptForRequest: string;
    webBrowsingEnabled: boolean;
    skipSmartRouter?: boolean;
    createMessageId: () => string;
    createTimestamp: () => string;
    sendChatCompletion: (options: {
      messages: ApiChatMessage[];
      modelId: string;
      systemPrompt?: string;
      webBrowsingEnabled?: boolean;
      skipSmartRouter?: boolean;
    }, onStream?: (delta: string) => void) => Promise<string>;
    onConversationMessagesUpdate: (messages: ChatMessage[]) => void;
    historyForApiRecent?: ApiChatMessage[];
  }) => Promise<{ assistantMessage: ChatMessage; finalMessages: ChatMessage[] }>;
  runImageGenerationFlow: (input: {
    imageParams: GenerateImageOptions;
    selectedImageModelId: string;
    conversationId: string;
    sessionId: string;
    prompt: string;
    isVideo: boolean;
    generateImage: (options: GenerateImageOptions) => Promise<string>;
    saveGeneratedAsset: (input: {
      url: string;
      prompt: string;
      modelId: string;
      conversationId: string;
      sessionId: string;
      isVideo: boolean;
      isPollinations: boolean;
    }) => Promise<string | undefined>;
    createMessageId: () => string;
    createTimestamp: () => string;
  }) => Promise<{ imageUrl: string; generatedAssetId?: string; aiMessage: ChatMessage }>;
  shouldUpdateTitleAfterSend: typeof shouldUpdateTitleAfterSend;
  updateConversationTitle: (conversationId: string, messagesForTitleGen: ChatMessage[]) => Promise<string>;
  buildSendFailureState: typeof buildSendFailureState;
  buildFinalConversationState: typeof buildFinalConversationState;
  setIsAiResponding: (value: boolean) => void;
  setChatInputValue: (value: string) => void;
  setLastUserMessageId: (value: string | null) => void;
  setLastFailedRequest: (value: ReturnType<typeof buildSendFailureState>['lastFailedRequest']) => void;
  setActiveConversation: (updater: (prev: Conversation | null) => Conversation | null) => void;
  toast: (input: { title: string; description?: string; variant?: 'default' | 'destructive'; duration?: number; action?: ToastActionElement }) => unknown;
  getRetryAction?: () => ToastActionElement;
  extractMemories: (conversationId: string, messages: ChatMessage[]) => Promise<void>;
  saveUploadedAsset: (input: {
    id: string;
    blob: File;
    contentType: string;
    timestamp: number;
    conversationId: string;
  }) => Promise<unknown>;
  uploadFileToPollinationsMediaUrl: (file: File, fileName: string, contentType: string, options: { sessionId: string; folder: string }) => Promise<string>;
  resolveReferenceUrls: (references: UploadedReference[]) => Promise<string[]>;
  getUnifiedModel: (modelId: string) => { kind?: string } | undefined;
  generateImage: (options: GenerateImageOptions) => Promise<string>;
  saveGeneratedAsset: (input: {
    url: string;
    prompt: string;
    modelId: string;
    conversationId: string;
    sessionId: string;
    isVideo: boolean;
    isPollinations: boolean;
  }) => Promise<string | undefined>;
  createId: () => string;
  createTimestamp: () => string;
  getSessionId: () => string;
  onError: (error: unknown) => void;
  sendChatCompletion?: (options: {
    messages: ApiChatMessage[];
    modelId: string;
    systemPrompt?: string;
    webBrowsingEnabled?: boolean;
    skipSmartRouter?: boolean;
  }, onStream?: (delta: string) => void) => Promise<string>;
}

export function shouldUpdateTitleAfterSend(
  finalMessages: ChatMessage[],
  activeTitle: string,
  newConversationTitle: string,
): boolean {
  const userMessageCount = finalMessages.filter((message) => message.role === 'user').length;
  const assistantMessageCount = finalMessages.filter((message) => message.role === 'assistant').length;
  const isFirstMessagePair = userMessageCount === 1 && assistantMessageCount === 1;
  const isDefaultTitle =
    activeTitle === newConversationTitle ||
    activeTitle.toLowerCase().startsWith('new ') ||
    activeTitle === 'Chat';

  return isFirstMessagePair || isDefaultTitle;
}

export function buildSendFailureState(input: BuildSendFailureStateInput) {
  const errorMessage = input.error instanceof Error ? input.error.message : 'An unknown error occurred.';
  const errorAssistantMessage: ChatMessage = {
    id: input.createMessageId(),
    role: 'assistant',
    content: `Sorry, an error occurred: ${errorMessage}`,
    timestamp: input.createTimestamp(),
    toolType: 'long language loops',
  };

  return {
    errorMessage,
    finalMessages: [...input.updatedMessagesForState, errorAssistantMessage],
    lastFailedRequest: {
      messageText: input.options.isRegeneration ? '' : input.userInputText,
      options: input.options,
      timestamp: Date.now(),
    },
  };
}

export function buildFinalConversationState(input: BuildFinalConversationStateInput) {
  return {
    finalConversationState: {
      messages: input.finalMessages,
      title: input.finalTitle,
      updatedAt: input.createTimestamp(),
      uploadedFile: null,
      uploadedFilePreview: null,
    },
    shouldExtractMemories: input.finalMessages.length >= 2 && !input.isImagePrompt,
  };
}

export async function executeChatSendCoordinator(input: ExecuteChatSendCoordinatorInput): Promise<void> {
  const activeConversation = input.conversation;
  const { id: convId, selectedModelId: selectedModelIdRaw, selectedResponseStyleName, messages } = activeConversation;

  const userInputText = input.messageText.trim() || input.chatInputValue.trim();
  const requestCapabilities = input.resolveRequestCapabilities({
    selectedModelId: selectedModelIdRaw,
    hasUploadedFile: !!activeConversation.uploadedFile,
    isImageModeIntent: input.options.isImageModeIntent,
    isCodeMode: activeConversation.isCodeMode,
  });
  const isImagePrompt = requestCapabilities.isImageModeIntent;
  const isFileUpload = requestCapabilities.requiresVisionModel;
  let currentModel = requestCapabilities.selectedModel;

  const basicStylePrompt = (input.availableResponseStyles.find((style) => style.name === 'Basic') || input.availableResponseStyles[0]).systemPrompt;
  const selectedStyle = input.availableResponseStyles.find((style) => style.name === selectedResponseStyleName);
  const effectiveSystemPrompt = input.buildChatSystemPrompt({
    baseStylePrompt: selectedStyle ? selectedStyle.systemPrompt : basicStylePrompt,
    selectedModelId: currentModel.id,
    language: input.language,
    userDisplayName: input.userDisplayName,
    customSystemPrompt: input.customSystemPrompt,
    isRegeneration: input.options.isRegeneration,
  });

  input.setIsAiResponding(true);
  if (!input.options.isRegeneration) {
    input.setChatInputValue('');
  }

  if (requestCapabilities.didFallbackToVisionModel) {
    const fallbackModel = requestCapabilities.fallbackModel;
    if (fallbackModel) {
      input.toast({
        title: 'Model Switched',
        description: `Model '${currentModel.name}' doesn't support images. Using '${fallbackModel.name}' for this request.`,
        variant: 'default',
      });
      currentModel = fallbackModel;
    } else {
      input.toast({ title: 'Model Incompatibility', description: 'No available models support images.', variant: 'destructive' });
      input.setIsAiResponding(false);
      return;
    }
  }

  let updatedMessagesForState = input.options.messagesForApi || messages;
  let newUserMessageId: string | null = null;
  let publicImageUrl: string | null = null;
  let uploadedAssetId: string | null = null;

  if (isFileUpload && activeConversation.uploadedFile) {
    try {
      input.toast({ title: 'Processing image...', description: 'Saving locally and preparing for AI.' });
      uploadedAssetId = input.createId();
      await input.saveUploadedAsset({
        id: uploadedAssetId,
        blob: activeConversation.uploadedFile,
        contentType: activeConversation.uploadedFile.type,
        timestamp: Date.now(),
        conversationId: convId,
      });

      const sessionId = input.getSessionId();
      const fileName = activeConversation.uploadedFile.name || `upload-${Date.now()}.bin`;
      const contentType = activeConversation.uploadedFile.type || 'application/octet-stream';
      publicImageUrl = await input.uploadFileToPollinationsMediaUrl(activeConversation.uploadedFile, fileName, contentType, {
        sessionId,
        folder: 'uploads',
      });
    } catch (error) {
      input.onError(error);
      input.toast({ title: 'Vision Error', description: 'Could not prepare image for AI.', variant: 'destructive' });
      input.setIsAiResponding(false);
      return;
    }
  }

  if (!input.options.isRegeneration) {
    const textContent = userInputText;
    let userMessageContent: string | ChatMessageContentPart[] = textContent;
    const hasStudioImages = !!input.options.imageConfig && input.options.imageConfig.uploadedImages.length > 0;

    if (isFileUpload || hasStudioImages) {
      const contentParts: ChatMessageContentPart[] = [];
      let labelText = 'Vision Context:\n';

      if (isFileUpload && (activeConversation.uploadedFilePreview || uploadedAssetId)) {
        contentParts.push({
          type: 'image_url',
          image_url: {
            url: activeConversation.uploadedFilePreview || '',
            remoteUrl: publicImageUrl || undefined,
            altText: activeConversation.uploadedFile?.name,
            isUploaded: true,
            metadata: { assetId: uploadedAssetId },
          },
        });
        labelText += '- IMAGE_0: Current Upload\n';
      }

      if (hasStudioImages) {
        input.options.imageConfig?.uploadedImages.forEach((ref, index) => {
          contentParts.push({
            type: 'image_url',
            image_url: {
              url: ref.url,
              altText: `Studio Image ${index + 1}`,
              isUploaded: true,
            },
          });
          labelText += `- IMAGE_${index + 1}: Reference Image\n`;
        });
      }

      contentParts.unshift({ type: 'text', text: `${labelText}\n${textContent || 'Analyze these images.'}` });
      userMessageContent = contentParts;
    }

    const userMessage: ChatMessage = {
      id: input.createId(),
      role: 'user',
      content: userMessageContent,
      timestamp: input.createTimestamp(),
      toolType: 'long language loops',
    };
    newUserMessageId = userMessage.id;
    updatedMessagesForState = [...messages, userMessage];
    input.setActiveConversation((prev) => (prev ? { ...prev, messages: updatedMessagesForState } : null));
    input.setLastUserMessageId(newUserMessageId);
  } else {
    const lastUserMsg = updatedMessagesForState.slice().reverse().find((message) => message.role === 'user');
    if (lastUserMsg) {
      newUserMessageId = lastUserMsg.id;
      input.setActiveConversation((prev) => (prev ? { ...prev, messages: updatedMessagesForState } : null));
      input.setLastUserMessageId(lastUserMsg.id);
    }
  }

  const { older: olderMessages, recent: recentMessages } = input.splitMessagesForApiContext(updatedMessagesForState);
  const olderSummaryBlock = input.buildOlderMessagesSummary(olderMessages);
  const historyForApiRecent = input.normalizeRecentMessagesForApi(recentMessages, !!currentModel.vision);

  let finalMessages = updatedMessagesForState;
  let finalTitle = activeConversation.title;

  try {
    if (isImagePrompt && userInputText) {
      const imageConfig = input.options.imageConfig;
      const modelInfo = input.getUnifiedModel(input.selectedImageModelId);
      const resolvedReferenceUrls = imageConfig ? await input.resolveReferenceUrls(imageConfig.uploadedImages) : [];
      const imageParams: GenerateImageOptions = {
        prompt: userInputText.trim(),
        modelId: input.selectedImageModelId,
      };

      if (imageConfig) {
        const { formFields } = imageConfig;
        if (resolvedReferenceUrls.length > 0) imageParams.image = resolvedReferenceUrls;
        if (modelInfo?.kind === 'video' || input.selectedImageModelId.includes('wan') || formFields.duration) {
          if (typeof formFields.aspect_ratio === 'string') imageParams.aspect_ratio = formFields.aspect_ratio;
          if (formFields.duration !== undefined && formFields.duration !== null) imageParams.duration = Number(formFields.duration);
          if (typeof formFields.audio === 'boolean') imageParams.audio = formFields.audio;
        } else {
          imageParams.width = typeof formFields.width === 'number' ? formFields.width : 1024;
          imageParams.height = typeof formFields.height === 'number' ? formFields.height : 1024;
        }
      }

      const imageFlowResult = await input.runImageGenerationFlow({
        imageParams,
        selectedImageModelId: input.selectedImageModelId,
        conversationId: convId,
        sessionId: input.getSessionId(),
        prompt: userInputText,
        isVideo: modelInfo?.kind === 'video',
        generateImage: input.generateImage,
        saveGeneratedAsset: input.saveGeneratedAsset,
        createMessageId: input.createId,
        createTimestamp: input.createTimestamp,
      });
      input.toast({ title: 'Generation started', description: `Creating image with ${input.selectedImageModelId}...`, duration: 3000 });
      finalMessages = [...updatedMessagesForState, imageFlowResult.aiMessage];
    } else {
      const systemPromptForRequest = input.buildSystemPromptForRequest({
        effectiveSystemPrompt,
        isCodeMode: requestCapabilities.isCodeMode,
        olderSummaryBlock,
      });
      const textFlowResult = await input.runTextChatCompletionFlow({
        updatedMessagesForState,
        historyForApiRecent,
        modelIdForRequest: currentModel.id,
        systemPromptForRequest,
        webBrowsingEnabled: !!activeConversation.webBrowsingEnabled,
        skipSmartRouter: isFileUpload || undefined,
        createMessageId: input.createId,
        createTimestamp: input.createTimestamp,
        sendChatCompletion: input.sendChatCompletion || (async () => ''),
        onConversationMessagesUpdate: (messagesForConversation) => {
          finalMessages = messagesForConversation;
          input.setActiveConversation((prev) => (prev ? { ...prev, messages: messagesForConversation } : null));
        },
      });
      finalMessages = textFlowResult.finalMessages;
    }

    if (input.shouldUpdateTitleAfterSend(finalMessages, activeConversation.title, input.newConversationTitle)) {
      finalTitle = await input.updateConversationTitle(convId, finalMessages);
    }
  } catch (error) {
    input.onError(error);
    const failureState = input.buildSendFailureState({
      error,
      updatedMessagesForState,
      userInputText,
      options: input.options,
      createMessageId: input.createId,
      createTimestamp: input.createTimestamp,
    });
    input.setLastFailedRequest(failureState.lastFailedRequest);
    input.toast({
      title: 'Fehler beim Senden',
      description: failureState.errorMessage,
      variant: 'destructive',
      action: input.getRetryAction?.(),
    });
    finalMessages = failureState.finalMessages;
  } finally {
    const { finalConversationState, shouldExtractMemories } = input.buildFinalConversationState({
      finalMessages,
      finalTitle,
      isImagePrompt,
      createTimestamp: input.createTimestamp,
    });
    if (shouldExtractMemories) {
      void input.extractMemories(convId, finalMessages).catch(input.onError);
    }
    input.setActiveConversation((prev) => (prev ? { ...prev, ...finalConversationState } : null));
    input.setIsAiResponding(false);
  }
}
