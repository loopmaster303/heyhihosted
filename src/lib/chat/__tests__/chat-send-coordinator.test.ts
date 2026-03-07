import type { ChatMessage } from '@/types';

import {
  buildFinalConversationState,
  buildSendFailureState,
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

  it('builds final conversation state and skips memory extraction for image prompts', () => {
    const finalMessages: ChatMessage[] = [
      { id: 'u1', role: 'user', content: 'hello', timestamp: '2026-01-01T00:00:00.000Z' },
      { id: 'a1', role: 'assistant', content: 'hi', timestamp: '2026-01-01T00:00:01.000Z' },
    ];

    const result = buildFinalConversationState({
      finalMessages,
      finalTitle: 'Done',
      isImagePrompt: true,
      createTimestamp: () => '2026-01-01T00:00:03.000Z',
    });

    expect(result.finalConversationState).toEqual({
      messages: finalMessages,
      title: 'Done',
      updatedAt: '2026-01-01T00:00:03.000Z',
      uploadedFile: null,
      uploadedFilePreview: null,
    });
    expect(result.shouldExtractMemories).toBe(false);
  });
});
