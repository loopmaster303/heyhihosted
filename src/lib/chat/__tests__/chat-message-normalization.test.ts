import type { ChatMessage } from '@/types';

import { normalizeRecentMessagesForApi } from '../chat-message-normalization';

describe('chat message normalization', () => {
  it('collapses assistant multimodal content to joined text', () => {
    const messages: ChatMessage[] = [
      {
        id: 'a1',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        content: [
          { type: 'text', text: 'First line' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,abc' } },
          { type: 'text', text: 'Second line' },
        ],
      },
    ];

    expect(normalizeRecentMessagesForApi(messages, false)).toEqual([
      { role: 'assistant', content: 'First line\nSecond line' },
    ]);
  });

  it('collapses user multimodal content to text for text-only models', () => {
    const messages: ChatMessage[] = [
      {
        id: 'u1',
        role: 'user',
        timestamp: new Date().toISOString(),
        content: [
          { type: 'text', text: 'Analyze this image' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,abc', remoteUrl: 'https://cdn.example.com/image.png' } },
        ],
      },
    ];

    expect(normalizeRecentMessagesForApi(messages, false)).toEqual([
      { role: 'user', content: 'Analyze this image' },
    ]);
  });

  it('uses remote image urls for vision-capable user requests', () => {
    const messages: ChatMessage[] = [
      {
        id: 'u2',
        role: 'user',
        timestamp: new Date().toISOString(),
        content: [
          { type: 'text', text: 'Analyze this image' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,abc', remoteUrl: 'https://cdn.example.com/image.png' } },
        ],
      },
    ];

    expect(normalizeRecentMessagesForApi(messages, true)).toEqual([
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this image' },
          { type: 'image_url', image_url: { url: 'https://cdn.example.com/image.png' } },
        ],
      },
    ]);
  });

  it('falls back to the original image url when remoteUrl is missing', () => {
    const messages: ChatMessage[] = [
      {
        id: 'u4',
        role: 'user',
        timestamp: new Date().toISOString(),
        content: [
          { type: 'text', text: 'Analyze this image' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,abc' } },
        ],
      },
    ];

    expect(normalizeRecentMessagesForApi(messages, true)).toEqual([
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this image' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,abc' } },
        ],
      },
    ]);
  });

  it('keeps non-image parts unchanged for vision-capable user requests', () => {
    const messages: ChatMessage[] = [
      {
        id: 'u3',
        role: 'user',
        timestamp: new Date().toISOString(),
        content: [
          { type: 'text', text: 'Listen' },
          { type: 'audio_url', audio_url: { url: 'https://cdn.example.com/audio.mp3' } },
        ],
      },
    ];

    expect(normalizeRecentMessagesForApi(messages, true)).toEqual([
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Listen' },
          { type: 'audio_url', audio_url: { url: 'https://cdn.example.com/audio.mp3' } },
        ],
      },
    ]);
  });
});
