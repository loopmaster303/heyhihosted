import { CODE_REASONING_SYSTEM_PROMPT } from '@/config/chat-options';
import { buildChatSystemPrompt, buildRuntimeContext, buildSystemPromptForRequest } from '../chat-prompt-builder';

 

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

  it('code-mode path uses CODE_REASONING_SYSTEM_PROMPT plus the runtime context', () => {
    const prompt = buildSystemPromptForRequest({
      effectiveSystemPrompt: 'Base',
      isCodeMode: true,
      now: new Date('2026-08-22T08:12:00Z'),
      timeZone: 'Europe/Berlin',
    });
    // Code mode drops the persona enrichments but keeps the date: "the latest
    // version of X" is exactly the question that goes wrong on a stale year.
    expect(prompt).toBe(`${CODE_REASONING_SYSTEM_PROMPT}\n${buildRuntimeContext(new Date('2026-08-22T08:12:00Z'), 'Europe/Berlin')}`);
    expect(prompt).not.toContain('Base');
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
