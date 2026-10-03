import { MEMORY_EXTRACTION_ENABLED } from '@/lib/services/memory-service';
import type {
  ApiChatMessage,
  ChatMessage,
  Conversation,
} from '@/types';
import type { ToastActionElement } from '@/components/ui/toast';
import type { AssistantMediaHooks } from './chat-send-orchestrator';

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
  requestedModel: {
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
  isCodeMode: boolean;
}

interface SendMessageOptionsLike extends SendOptionsLike {
  messagesForApi?: ChatMessage[];
}

interface ExecuteChatSendCoordinatorInput {
  conversation: Conversation;
  messageText: string;
  chatInputValue: string;
  language: string;
  customSystemPrompt?: string;
  userDisplayName?: string;
  newConversationTitle: string;
  options: SendMessageOptionsLike;
  availableResponseStyles: SelectedStyleLike[];
  resolveRequestCapabilities: (input: {
    selectedModelId?: string;
    hasUploadedFile: boolean;
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
    media?: AssistantMediaHooks;
  }) => Promise<{ assistantMessage: ChatMessage; finalMessages: ChatMessage[] }>;
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
  media?: AssistantMediaHooks;
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
    shouldExtractMemories: input.finalMessages.length >= 2,
  };
}

export async function executeChatSendCoordinator(input: ExecuteChatSendCoordinatorInput): Promise<void> {
  const activeConversation = input.conversation;
  const { id: convId, selectedModelId: selectedModelIdRaw, selectedResponseStyleName, messages } = activeConversation;

  const userInputText = input.messageText.trim() || input.chatInputValue.trim();
  const requestCapabilities = input.resolveRequestCapabilities({
    selectedModelId: selectedModelIdRaw,
    hasUploadedFile: !!activeConversation.uploadedFile,
    isCodeMode: activeConversation.isCodeMode,
  });
  const isFileUpload = requestCapabilities.requiresVisionModel;
  const currentModel = requestCapabilities.selectedModel;

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
      // currentModel already holds the fallback; name the originally requested model.
      input.toast({
        title: 'Modell gewechselt',
        description: `${requestCapabilities.requestedModel.name} kann keine Bilder lesen. Diese Anfrage beantwortet ${fallbackModel.name}.`,
        variant: 'default',
      });
    } else {
      input.toast({ title: 'Kein passendes Modell', description: 'Gerade kann kein verfügbares Modell Bilder lesen.', variant: 'destructive' });
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
      input.toast({ title: 'Bild nicht lesbar', description: 'Das Bild konnte nicht für die Antwort vorbereitet werden.', variant: 'destructive' });
      input.setIsAiResponding(false);
      return;
    }
  }

  if (!input.options.isRegeneration) {
    const textContent = userInputText;
    let userMessageContent: ChatMessage['content'] = textContent;

    if (isFileUpload) {
      const contentParts: Exclude<ChatMessage['content'], string> = [];
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
    {
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
        media: input.media,
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
      createTimestamp: input.createTimestamp,
    });
    if (MEMORY_EXTRACTION_ENABLED && shouldExtractMemories) {
      void input.extractMemories(convId, finalMessages).catch(input.onError);
    }
    input.setActiveConversation((prev) => (prev ? { ...prev, ...finalConversationState } : null));
    input.setIsAiResponding(false);
  }
}
