import type { ChatMessage } from '@/types';

import { resolveRequestCapabilities } from '../chat-capability-resolution';
import { splitMessagesForApiContext, buildOlderMessagesSummary } from '../chat-context-window';
import { normalizeRecentMessagesForApi } from '../chat-message-normalization';
import { buildChatSystemPrompt, buildSystemPromptForRequest } from '../chat-prompt-builder';

describe('chat request pipeline', () => {
  it('composes summary, prompt, capability resolution, and normalized messages into the expected request shape', () => {
    const storedMessages: ChatMessage[] = [];
    for (let i = 1; i <= 9; i++) {
      storedMessages.push({
        id: `u${i}`,
        role: 'user',
        content: `user ${i}`,
        timestamp: `2026-01-01T00:00:${String(i).padStart(2, '0')}.000Z`,
      });
      storedMessages.push({
        id: `a${i}`,
        role: 'assistant',
        content: `reply ${i}`,
        timestamp: `2026-01-01T00:01:${String(i).padStart(2, '0')}.000Z`,
      });
    }
    storedMessages.push({
      id: 'u10',
      role: 'user',
      content: [
        { type: 'text', text: 'analyze upload' },
        { type: 'image_url', image_url: { url: 'data:image/png;base64,abc', remoteUrl: 'https://cdn.example.com/upload.png' } },
      ],
      timestamp: '2026-01-01T00:02:00.000Z',
    });

    const requestCapabilities = resolveRequestCapabilities({
      selectedModelId: 'deepseek',
      hasUploadedFile: true,
      isImageModeIntent: false,
      isCodeMode: false,
    });

    const { older, recent } = splitMessagesForApiContext(storedMessages);
    const olderSummaryBlock = buildOlderMessagesSummary(older);
    const effectiveSystemPrompt = buildChatSystemPrompt({
      baseStylePrompt: 'Base {{USERNAME}}',
      selectedModelId: requestCapabilities.selectedModelId,
      language: 'en',
      userDisplayName: 'John',
      customSystemPrompt: 'Stay concise for {userDisplayName}',
    });
    const systemPromptForRequest = buildSystemPromptForRequest({
      effectiveSystemPrompt,
      isCodeMode: requestCapabilities.isCodeMode,
      olderSummaryBlock,
    });
    const messages = normalizeRecentMessagesForApi(recent, !!requestCapabilities.selectedModel.vision);

    expect(requestCapabilities.didFallbackToVisionModel).toBe(true);
    expect(systemPromptForRequest).toContain('Base John');
    expect(systemPromptForRequest).toContain('Stay concise for John');
    expect(systemPromptForRequest).toContain('<language_preference>User interface language: English. Default response language: English.</language_preference>');
    expect(systemPromptForRequest).toContain('<conversation_summary>');
    expect(messages.at(-1)).toEqual({
      role: 'user',
      content: [
        { type: 'text', text: 'analyze upload' },
        { type: 'image_url', image_url: { url: 'https://cdn.example.com/upload.png' } },
      ],
    });
  });
});
