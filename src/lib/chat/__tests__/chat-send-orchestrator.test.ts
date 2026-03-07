import type { ChatMessage } from '@/types';

import { runTextChatCompletionFlow } from '../chat-send-orchestrator';

type SendChatCompletionMock = (
  options: {
    messages: unknown[];
    modelId: string;
    systemPrompt?: string;
    webBrowsingEnabled?: boolean;
    skipSmartRouter?: boolean;
  },
  onStream?: (delta: string) => void,
) => Promise<string>;

describe('chat send orchestrator', () => {
  it('streams assistant updates and finalizes the completed message', async () => {
    const updates: ChatMessage[][] = [];
    const updatedMessagesForState: ChatMessage[] = [
      { id: 'u1', role: 'user', content: 'hello', timestamp: '2026-01-01T00:00:00.000Z' },
    ];

    const result = await runTextChatCompletionFlow({
      updatedMessagesForState,
      modelIdForRequest: 'claude-fast',
      systemPromptForRequest: 'base prompt',
      webBrowsingEnabled: true,
      skipSmartRouter: true,
      createMessageId: () => 'assistant-stream',
      createTimestamp: () => '2026-01-01T00:00:01.000Z',
      sendChatCompletion: (async (_options, onStream) => {
        onStream?.('Hello');
        onStream?.('Hello world');
        return 'Hello world';
      }) as SendChatCompletionMock,
      onConversationMessagesUpdate: (messages: ChatMessage[]) => {
        updates.push(messages);
      },
    });

    expect(updates).toHaveLength(4);
    expect(updates[0]?.[1]).toMatchObject({ id: 'assistant-stream', isStreaming: true, content: '' });
    expect(updates[1]?.[1]).toMatchObject({ id: 'assistant-stream', isStreaming: true, content: 'Hello' });
    expect(updates[2]?.[1]).toMatchObject({ id: 'assistant-stream', isStreaming: true, content: 'Hello world' });
    expect(updates[3]?.[1]).toMatchObject({ id: 'assistant-stream', isStreaming: false, content: 'Hello world' });
    expect(result.finalMessages[1]).toMatchObject({ id: 'assistant-stream', isStreaming: false, content: 'Hello world' });
  });

  it('uses fallback copy when completion returns blank content', async () => {
    const result = await runTextChatCompletionFlow({
      updatedMessagesForState: [
        { id: 'u1', role: 'user', content: 'hello', timestamp: '2026-01-01T00:00:00.000Z' },
      ],
      modelIdForRequest: 'claude-fast',
      systemPromptForRequest: 'base prompt',
      webBrowsingEnabled: false,
      createMessageId: () => 'assistant-stream',
      createTimestamp: () => '2026-01-01T00:00:01.000Z',
      sendChatCompletion: (async () => '') as SendChatCompletionMock,
      onConversationMessagesUpdate: () => {},
    });

    expect(result.assistantMessage.content).toBe("Sorry, I couldn't get a response.");
    expect(result.assistantMessage.isStreaming).toBe(false);
  });
});
