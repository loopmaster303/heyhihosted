import type { ChatMessage } from '@/types';

import {
  buildOlderMessagesSummary,
  isAssistantAssetOutput,
  splitMessagesForApiContext,
} from '../chat-context-window';

function makeMessage(overrides: Partial<ChatMessage>): ChatMessage {
  return {
    id: overrides.id || Math.random().toString(36).slice(2),
    role: overrides.role || 'user',
    content: overrides.content || 'x',
    timestamp: overrides.timestamp || new Date().toISOString(),
    ...overrides,
  };
}

describe('chat context window', () => {
  it('excludes assistant asset outputs from API context splitting', () => {
    const messages: ChatMessage[] = [
      makeMessage({ role: 'user', content: 'hello' }),
      makeMessage({ role: 'assistant', content: [{ type: 'image_url', image_url: { url: 'https://cdn.example.com/image.png' } }] }),
      makeMessage({ role: 'assistant', content: 'text reply' }),
    ];

    const { older, recent } = splitMessagesForApiContext(messages);

    expect(older).toEqual([]);
    expect(recent).toHaveLength(2);
    expect(recent[0]?.role).toBe('user');
    expect(recent[1]?.content).toBe('text reply');
  });

  it('keeps only the last eight user turns and their following assistant replies in recent context', () => {
    const messages: ChatMessage[] = [];
    for (let i = 1; i <= 10; i++) {
      messages.push(makeMessage({ id: `u${i}`, role: 'user', content: `user ${i}` }));
      messages.push(makeMessage({ id: `a${i}`, role: 'assistant', content: `assistant ${i}` }));
    }

    const { older, recent } = splitMessagesForApiContext(messages);

    expect(older.map((m) => m.id)).toEqual(['u1', 'a1', 'u2', 'a2']);
    expect(recent.map((m) => m.id)).toEqual([
      'u3', 'a3', 'u4', 'a4', 'u5', 'a5', 'u6', 'a6', 'u7', 'a7', 'u8', 'a8', 'u9', 'a9', 'u10', 'a10',
    ]);
  });

  it('builds a compressed summary with multimodal markers', () => {
    const summary = buildOlderMessagesSummary([
      makeMessage({ role: 'user', content: [{ type: 'text', text: 'describe this' }, { type: 'image_url', image_url: { url: 'https://cdn.example.com/x.png' } }] }),
      makeMessage({ role: 'assistant', content: [{ type: 'text', text: 'done' }, { type: 'video_url', video_url: { url: 'https://cdn.example.com/x.mp4' } }] }),
    ]);

    expect(summary).toContain('<conversation_summary>');
    expect(summary).toContain('U: describe this [image]');
    expect(summary).toContain('A: done [video]');
  });

  it('returns empty summary for empty older messages', () => {
    expect(buildOlderMessagesSummary([])).toBe('');
  });

  it('treats legacy assistant data-uri strings as asset outputs', () => {
    expect(
      isAssistantAssetOutput(
        makeMessage({
          role: 'assistant',
          content: 'data:image/png;base64,abc',
        }),
      ),
    ).toBe(true);
  });

  it('keeps a lone user message in recent context', () => {
    const userMessage = makeMessage({ id: 'u1', role: 'user', content: 'hello' });

    const { older, recent } = splitMessagesForApiContext([userMessage]);

    expect(older).toEqual([]);
    expect(recent).toEqual([userMessage]);
  });
});
