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

  it('persists the returned completion even when onStream is never called', async () => {
    const result = await runTextChatCompletionFlow({
      updatedMessagesForState: [
        { id: 'u1', role: 'user', content: 'hello', timestamp: '2026-01-01T00:00:00.000Z' },
      ],
      modelIdForRequest: 'claude-fast',
      systemPromptForRequest: 'base prompt',
      webBrowsingEnabled: false,
      createMessageId: () => 'assistant-stream',
      createTimestamp: () => '2026-01-01T00:00:01.000Z',
      sendChatCompletion: (async () => 'Full response without streaming') as SendChatCompletionMock,
      onConversationMessagesUpdate: () => {},
    });

    expect(result.assistantMessage.content).toBe('Full response without streaming');
    expect(result.assistantMessage.isStreaming).toBe(false);
  });

  it('prefers the returned completion over a shorter last stream callback', async () => {
    const result = await runTextChatCompletionFlow({
      updatedMessagesForState: [
        { id: 'u1', role: 'user', content: 'hello', timestamp: '2026-01-01T00:00:00.000Z' },
      ],
      modelIdForRequest: 'claude-fast',
      systemPromptForRequest: 'base prompt',
      webBrowsingEnabled: false,
      createMessageId: () => 'assistant-stream',
      createTimestamp: () => '2026-01-01T00:00:01.000Z',
      sendChatCompletion: (async (_options, onStream) => {
        onStream?.('Hello');
        return 'Hello world, complete';
      }) as SendChatCompletionMock,
      onConversationMessagesUpdate: () => {},
    });

    expect(result.assistantMessage.content).toBe('Hello world, complete');
  });

  it('never shows the image marker and places the image in two steps (E15)', async () => {
    const updates: ChatMessage[][] = [];
    let resolveImage: (part: unknown) => void = () => {};

    const flow = runTextChatCompletionFlow({
      updatedMessagesForState: [{ id: 'u1', role: 'user', content: 'Mal mir einen Fuchs', timestamp: 't0' }],
      modelIdForRequest: 'deepseek',
      systemPromptForRequest: 'p',
      webBrowsingEnabled: false,
      createMessageId: () => 'a1',
      createTimestamp: () => 't1',
      sendChatCompletion: (async (_options, onStream) => {
        // Der JSON-Pfad meldet den vollen Rohtext einmal als "Stream".
        onStream?.('Hier dein Fuchs.\n[IMAGE_GEN: a red fox]');
        return 'Hier dein Fuchs.\n[IMAGE_GEN: a red fox]';
      }) as SendChatCompletionMock,
      onConversationMessagesUpdate: (messages: ChatMessage[]) => updates.push(messages),
      media: {
        prepare: () => ({
          cleanText: 'Hier dein Fuchs.',
          pendingParts: [{ type: 'image_url', image_url: { url: '', status: 'pending', prompt: 'a red fox', modelId: 'flux' } }],
        }),
        resolve: () => new Promise((resolve) => { resolveImage = resolve as (part: unknown) => void; }),
      },
    });

    // Kein Zwischenstand traegt den Marker.
    await Promise.resolve();
    await Promise.resolve();
    for (const messages of updates) {
      expect(JSON.stringify(messages[1]?.content ?? '')).not.toContain('IMAGE_GEN');
    }

    // Schritt 1: Text und Platzhalter stehen, bevor das Bild fertig ist.
    const beforeImage = updates[updates.length - 1][1];
    expect(beforeImage).toMatchObject({ isStreaming: false });
    expect(beforeImage.content).toEqual([
      { type: 'text', text: 'Hier dein Fuchs.' },
      { type: 'image_url', image_url: expect.objectContaining({ status: 'pending' }) },
    ]);

    // Schritt 2: das Bild setzt sich an seinen Platz.
    resolveImage({ type: 'image_url', image_url: { url: 'https://x/fox.png', prompt: 'a red fox', modelId: 'flux' } });
    const result = await flow;
    expect(result.assistantMessage.content).toEqual([
      { type: 'text', text: 'Hier dein Fuchs.' },
      { type: 'image_url', image_url: { url: 'https://x/fox.png', prompt: 'a red fox', modelId: 'flux' } },
    ]);
  });
});
