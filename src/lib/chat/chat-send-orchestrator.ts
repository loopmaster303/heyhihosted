import type { ApiChatMessage, ChatMessage } from '@/types';
import type { GenerateImageOptions } from '@/lib/services/chat-service';

interface RunImageGenerationFlowInput {
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
}

interface RunImageGenerationFlowResult {
  imageUrl: string;
  generatedAssetId?: string;
  aiMessage: ChatMessage;
}

interface RunTextChatCompletionFlowInput {
  updatedMessagesForState: ChatMessage[];
  modelIdForRequest: string;
  systemPromptForRequest: string;
  webBrowsingEnabled: boolean;
  skipSmartRouter?: boolean;
  createMessageId: () => string;
  createTimestamp: () => string;
  sendChatCompletion: (
    options: {
      messages: ApiChatMessage[];
      modelId: string;
      systemPrompt?: string;
      webBrowsingEnabled?: boolean;
      skipSmartRouter?: boolean;
    },
    onStream?: (delta: string) => void,
  ) => Promise<string>;
  onConversationMessagesUpdate: (messages: ChatMessage[]) => void;
  historyForApiRecent?: ApiChatMessage[];
}

interface RunTextChatCompletionFlowResult {
  assistantMessage: ChatMessage;
  finalMessages: ChatMessage[];
}

export async function runTextChatCompletionFlow(
  input: RunTextChatCompletionFlowInput,
): Promise<RunTextChatCompletionFlowResult> {
  const streamingMessageId = input.createMessageId();
  const baseAssistantMessage: ChatMessage = {
    id: streamingMessageId,
    role: 'assistant',
    content: '',
    timestamp: input.createTimestamp(),
    toolType: 'long language loops',
    isStreaming: true,
  };

  let finalMessages = [...input.updatedMessagesForState, baseAssistantMessage];
  input.onConversationMessagesUpdate(finalMessages);

  let streamedContent = '';
  await input.sendChatCompletion(
    {
      messages: input.historyForApiRecent || [],
      modelId: input.modelIdForRequest,
      systemPrompt: input.systemPromptForRequest,
      webBrowsingEnabled: input.webBrowsingEnabled,
      skipSmartRouter: input.skipSmartRouter,
    },
    (delta: string) => {
      streamedContent = delta;
      const updatedAssistantMessage: ChatMessage = {
        ...baseAssistantMessage,
        content: streamedContent,
        isStreaming: true,
      };
      finalMessages = [...input.updatedMessagesForState, updatedAssistantMessage];
      input.onConversationMessagesUpdate(finalMessages);
    },
  );

  const assistantMessage: ChatMessage = {
    ...baseAssistantMessage,
    content: streamedContent.trim() || "Sorry, I couldn't get a response.",
    isStreaming: false,
  };

  finalMessages = [...input.updatedMessagesForState, assistantMessage];
  input.onConversationMessagesUpdate(finalMessages);

  return {
    assistantMessage,
    finalMessages,
  };
}

export async function runImageGenerationFlow(
  input: RunImageGenerationFlowInput,
): Promise<RunImageGenerationFlowResult> {
  const imageUrl = await input.generateImage(input.imageParams);

  let generatedAssetId: string | undefined;
  if (imageUrl) {
    generatedAssetId = await input.saveGeneratedAsset({
      url: imageUrl,
      prompt: input.prompt,
      modelId: input.selectedImageModelId,
      conversationId: input.conversationId,
      sessionId: input.sessionId,
      isVideo: input.isVideo,
      isPollinations: true,
    });
  }

  const aiMessage: ChatMessage = {
    id: input.createMessageId(),
    role: 'assistant',
    content: input.isVideo
      ? [
          {
            type: 'video_url',
            video_url: {
              url: imageUrl,
              altText: `Generated video (${input.selectedImageModelId})`,
              isGenerated: true,
              metadata: generatedAssetId ? { assetId: generatedAssetId } : undefined,
            },
          },
        ]
      : [
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
              altText: `Generated image (${input.selectedImageModelId})`,
              isGenerated: true,
              metadata: generatedAssetId ? { assetId: generatedAssetId } : undefined,
            },
          },
        ],
    timestamp: input.createTimestamp(),
    toolType: 'long language loops',
  };

  return {
    imageUrl,
    generatedAssetId,
    aiMessage,
  };
}
