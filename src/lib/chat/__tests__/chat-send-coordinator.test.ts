import type { ChatMessage, Conversation } from '@/types';

import { MEMORY_EXTRACTION_ENABLED } from '@/lib/services/memory-service';

import {
  buildFinalConversationState,
  buildSendFailureState,
  executeChatSendCoordinator,
  shouldUpdateTitleAfterSend,
} from '../chat-send-coordinator';

describe('chat send coordinator', () => {
  it('requests a title refresh for the first user/assistant pair', () => {
    const finalMessages: ChatMessage[] = [
      { id: 'u1', role: 'user', content: 'hello', timestamp: '2026-01-01T00:00:00.000Z' },
      { id: 'a1', role: 'assistant', content: 'hi', timestamp: '2026-01-01T00:00:01.000Z' },
    ];

    expect(shouldUpdateTitleAfterSend(finalMessages, 'Saved Chat', 'Neue Unterhaltung')).toBe(true);
  });

  it('requests a title refresh for default titles even after multiple messages', () => {
    const finalMessages: ChatMessage[] = [
      { id: 'u1', role: 'user', content: 'hello', timestamp: '2026-01-01T00:00:00.000Z' },
      { id: 'a1', role: 'assistant', content: 'hi', timestamp: '2026-01-01T00:00:01.000Z' },
      { id: 'u2', role: 'user', content: 'next', timestamp: '2026-01-01T00:00:02.000Z' },
    ];

    expect(shouldUpdateTitleAfterSend(finalMessages, 'Chat', 'Neue Unterhaltung')).toBe(true);
  });

  it('builds retry state and user-visible error message after send failure', () => {
    const updatedMessagesForState: ChatMessage[] = [
      { id: 'u1', role: 'user', content: 'hello', timestamp: '2026-01-01T00:00:00.000Z' },
    ];

    const result = buildSendFailureState({
      error: new Error('Boom'),
      updatedMessagesForState,
      userInputText: 'hello',
      options: { isRegeneration: false },
      createMessageId: () => 'err-1',
      createTimestamp: () => '2026-01-01T00:00:02.000Z',
    });

    expect(result.errorMessage).toBe('Boom');
    expect(result.lastFailedRequest).toEqual({
      messageText: 'hello',
      options: { isRegeneration: false },
      timestamp: expect.any(Number),
    });
    expect(result.finalMessages[1]).toMatchObject({
      id: 'err-1',
      role: 'assistant',
      content: 'Sorry, an error occurred: Boom',
    });
  });

  it('builds final conversation state and extracts memories once a pair exists', () => {
    const finalMessages: ChatMessage[] = [
      { id: 'u1', role: 'user', content: 'hello', timestamp: '2026-01-01T00:00:00.000Z' },
      { id: 'a1', role: 'assistant', content: 'hi', timestamp: '2026-01-01T00:00:01.000Z' },
    ];

    const result = buildFinalConversationState({
      finalMessages,
      finalTitle: 'Done',
      createTimestamp: () => '2026-01-01T00:00:03.000Z',
    });

    expect(result.finalConversationState).toEqual({
      messages: finalMessages,
      title: 'Done',
      updatedAt: '2026-01-01T00:00:03.000Z',
      uploadedFile: null,
      uploadedFilePreview: null,
    });
    expect(result.shouldExtractMemories).toBe(true);
  });

  it('laesst die Gedaechtnis-Extraktion aus, solange die Konstante stillgelegt ist', async () => {
    const extractMemories = jest.fn(async () => {});
    const stateUpdates: Array<Partial<Conversation>> = [];
    const respondingStates: boolean[] = [];
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
      language: 'de',
      customSystemPrompt: '',
      userDisplayName: 'John',
      newConversationTitle: 'New Chat',
      options: {},
      availableResponseStyles: [{ name: 'Basic', systemPrompt: 'Base' }],
      resolveRequestCapabilities: () => ({
        selectedModelId: 'claude-fast',
        selectedModel: { id: 'claude-fast', name: 'Claude', vision: false },
        requestedModel: { id: 'claude-fast', name: 'Claude', vision: false },
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
      runTextChatCompletionFlow: async ({ updatedMessagesForState }: { updatedMessagesForState: ChatMessage[] }) => {
        const assistantMessage: ChatMessage = {
          id: 'a1',
          role: 'assistant',
          content: 'hi',
          timestamp: '2026-01-01T00:00:01.000Z',
          toolType: 'long language loops',
        };
        return { assistantMessage, finalMessages: [...updatedMessagesForState, assistantMessage] };
      },
      shouldUpdateTitleAfterSend,
      updateConversationTitle: async () => 'Renamed Chat',
      buildSendFailureState,
      buildFinalConversationState,
      setIsAiResponding: (value: boolean) => {
        respondingStates.push(value);
      },
      setChatInputValue: () => {},
      setLastUserMessageId: () => {},
      setLastFailedRequest: () => {},
      setActiveConversation: (updater: (prev: Conversation | null) => Conversation | null) => {
        const next = updater(conversation);
        if (next) stateUpdates.push(next);
      },
      toast: () => {},
      extractMemories,
      saveUploadedAsset: async () => {},
      uploadFileToPollinationsMediaUrl: async () => '',
      createId: () => 'generated-id',
      createTimestamp: () => '2026-01-01T00:00:03.000Z',
      getSessionId: () => 'session-1',
      onError: () => {},
    });

    // Der Send entscheidet weiterhin, dass eine Extraktion anstünde ...
    const decision = buildFinalConversationState({
      finalMessages: [
        { id: 'u1', role: 'user', content: 'hello', timestamp: '2026-01-01T00:00:00.000Z' },
        { id: 'a1', role: 'assistant', content: 'hi', timestamp: '2026-01-01T00:00:01.000Z' },
      ],
      finalTitle: 'New Chat',
      createTimestamp: () => '2026-01-01T00:00:03.000Z',
    });
    expect(decision.shouldExtractMemories).toBe(true);

    // ... aber der Schalter verhindert den Anbieteraufruf.
    expect(MEMORY_EXTRACTION_ENABLED).toBe(false);
    expect(extractMemories).not.toHaveBeenCalled();

    // Die Sendekette selbst läuft unverändert durch.
    expect(respondingStates).toEqual([true, false]);
    expect(stateUpdates.at(-1)).toMatchObject({
      title: 'Renamed Chat',
      messages: [
        { id: 'u1', role: 'user', content: 'hello' },
        { id: 'generated-id', role: 'user', content: 'hello' },
        { id: 'a1', role: 'assistant', content: 'hi' },
      ],
    });
  });
});
