import { CODE_REASONING_SYSTEM_PROMPT } from '@/config/chat-options';
import { buildChatSystemPrompt, buildSystemPromptForRequest } from '../chat-prompt-builder';

 

describe('sendMessage adjacent contracts (regression-safe prompts)', () => {
  it('regeneration path injects regeneration instruction and preserves username', () => {
    const prompt = buildChatSystemPrompt({
      baseStylePrompt: 'Hello {{USERNAME}}',
      selectedModelId: 'grok',
      language: 'en',
      userDisplayName: 'Alice',
      customSystemPrompt: '',
      isRegeneration: true,
    });

    expect(prompt.startsWith('Generiere eine neue, alternative Antwort auf die letzte Anfrage des Benutzers.')).toBe(true);
    expect(prompt).toContain('Alice');
  });

  it('code-mode path uses CODE_REASONING_SYSTEM_PROMPT', () => {
    const prompt = buildSystemPromptForRequest({
      effectiveSystemPrompt: 'Base',
      isCodeMode: true,
    });
    expect(prompt).toBe(CODE_REASONING_SYSTEM_PROMPT);
  });

  it('older-summary prefix path prepends older conversation summary', () => {
    const summary = '<conversation_summary>old</conversation_summary>';
    const prompt = buildSystemPromptForRequest({
      effectiveSystemPrompt: 'Base prompt',
      isCodeMode: false,
      olderSummaryBlock: summary,
    });
    expect(prompt).toBe(`${summary}\nBase prompt`);
  });

  it('older-summary + code-mode path prefixes older summary before code prompt', () => {
    const summary = '<conversation_summary>old</conversation_summary>';
    const prompt = buildSystemPromptForRequest({
      effectiveSystemPrompt: 'Base',
      isCodeMode: true,
      olderSummaryBlock: summary,
    });
    expect(prompt.startsWith(summary)).toBe(true);
    expect(prompt).toContain(CODE_REASONING_SYSTEM_PROMPT);
  });
});
