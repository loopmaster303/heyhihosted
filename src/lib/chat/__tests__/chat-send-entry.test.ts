import type { ChatMessage, Conversation, UploadedReference } from '@/types';

import { executeChatSendCoordinator } from '../chat-send-coordinator';

describe('chat send entry coordinator', () => {
  it('runs text send flow and finalizes conversation state through injected callbacks', async () => {
    const stateUpdates: Array<Partial<Conversation>> = [];
    const conversation: Conversation = {
      id: 'conv-1',
      title: 'New Chat',
      messages: [
        { id: 'u1', role: 'user', content: 'hello', timestamp: '2026-01-01T00:00:00.000Z', toolType: 'long language loops' },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      toolType: 'long language loops',
      selectedModelId: 'claude-fast',
      selectedResponseStyleName: 'Basic',
      isCodeMode: false,
      webBrowsingEnabled: false,
    };

    await executeChatSendCoordinator({
      conversation,
      messageText: 'hello',
      chatInputValue: 'hello',
      selectedImageModelId: 'nanobanana',
      language: 'en',
      customSystemPrompt: '',
      userDisplayName: 'John',
      newConversationTitle: 'New Chat',
      options: {},
      availableResponseStyles: [{ name: 'Basic', systemPrompt: 'Base {{USERNAME}}' }],
      resolveRequestCapabilities: () => ({
        selectedModelId: 'claude-fast',
        selectedModel: { id: 'claude-fast', name: 'Claude', vision: false } as any,
        requiresVisionModel: false,
        didFallbackToVisionModel: false,
        isImageModeIntent: false,
        isCodeMode: false,
      }),
      buildChatSystemPrompt: () => 'prompt',
      splitMessagesForApiContext: (messages: ChatMessage[]) => ({ older: [], recent: messages }),
      buildOlderMessagesSummary: () => '',
      normalizeRecentMessagesForApi: () => [{ role: 'user', content: 'hello' }],
      buildSystemPromptForRequest: () => 'prompt',
      runTextChatCompletionFlow: async ({ updatedMessagesForState }: { updatedMessagesForState: ChatMessage[] }) => ({
        assistantMessage: { id: 'a1', role: 'assistant', content: 'hi', timestamp: '2026-01-01T00:00:01.000Z', toolType: 'long language loops' },
        finalMessages: [...updatedMessagesForState, { id: 'a1', role: 'assistant', content: 'hi', timestamp: '2026-01-01T00:00:01.000Z', toolType: 'long language loops' }],
      }),
      runImageGenerationFlow: async () => {
        throw new Error('should not run image flow');
      },
      shouldUpdateTitleAfterSend: () => true,
      updateConversationTitle: async () => 'Renamed Chat',
      buildSendFailureState: () => {
        throw new Error('should not build failure state');
      },
      buildFinalConversationState: ({ finalMessages, finalTitle }: { finalMessages: ChatMessage[]; finalTitle: string }) => ({
        finalConversationState: {
          messages: finalMessages,
          title: finalTitle,
          updatedAt: '2026-01-01T00:00:02.000Z',
          uploadedFile: null,
          uploadedFilePreview: null,
        },
        shouldExtractMemories: true,
      }),
      setIsAiResponding: () => {},
      setChatInputValue: () => {},
      setLastUserMessageId: () => {},
      setLastFailedRequest: () => {},
      setActiveConversation: (updater: (prev: Conversation | null) => Conversation | null) => {
        const next = updater(conversation);
        if (next) stateUpdates.push(next);
      },
      toast: () => {},
      extractMemories: async () => {},
      saveUploadedAsset: async () => {},
      uploadFileToS3: async () => '',
      resolveReferenceUrls: async (refs: UploadedReference[]) => refs.map((ref) => ref.url),
      getUnifiedModel: () => undefined,
      generateImage: async () => '',
      saveGeneratedAsset: async () => undefined,
      createId: () => 'generated-id',
      createTimestamp: () => '2026-01-01T00:00:03.000Z',
      getSessionId: () => 'session-1',
      onError: () => {},
    });

    expect(stateUpdates.at(-1)).toMatchObject({
      title: 'Renamed Chat',
      messages: [
        { id: 'u1', role: 'user', content: 'hello' },
        { id: 'generated-id', role: 'user', content: 'hello' },
        { id: 'a1', role: 'assistant', content: 'hi' },
      ],
      uploadedFile: null,
      uploadedFilePreview: null,
    });
  });
});
