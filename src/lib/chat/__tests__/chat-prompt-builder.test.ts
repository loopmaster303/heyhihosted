import { CODE_REASONING_SYSTEM_PROMPT } from '@/config/chat-options';

import { buildChatSystemPrompt, buildSystemPromptForRequest } from '../chat-prompt-builder';

describe('chat prompt builder', () => {
  it('injects username, language, custom instructions, and hidden reasoning for supported models', () => {
    const prompt = buildChatSystemPrompt({
      baseStylePrompt: 'Hello {{USERNAME}}',
      selectedModelId: 'claude-fast',
      language: 'de',
      userDisplayName: 'John',
      customSystemPrompt: 'Be nice to {userDisplayName}',
    });

    expect(prompt).toContain('Hello John');
    expect(prompt).toContain('<language_preference>User interface language: German. Default response language: German.</language_preference>');
    expect(prompt).toContain('<user_custom_instruction>\nBe nice to John\n</user_custom_instruction>');
    expect(prompt).toContain('<internal_protocol>');
    expect(prompt).toContain('Environment: hey.hi web-interface');
  });

  it('omits hidden reasoning block for unsupported models', () => {
    const prompt = buildChatSystemPrompt({
      baseStylePrompt: 'Base',
      selectedModelId: 'deepseek',
      language: 'en',
    });

    expect(prompt).not.toContain('<internal_protocol>');
    expect(prompt).toContain('User interface language: English. Default response language: English.');
  });

  it('replaces default User display name with an empty username token', () => {
    const prompt = buildChatSystemPrompt({
      baseStylePrompt: 'Hello {{USERNAME}}',
      selectedModelId: 'claude-fast',
      language: 'en',
      userDisplayName: 'User',
    });

    expect(prompt).toContain('Hello ');
    expect(prompt).not.toContain('Hello User');
  });

  it('prefixes regeneration instruction before the assembled prompt', () => {
    const prompt = buildChatSystemPrompt({
      baseStylePrompt: 'Base',
      selectedModelId: 'claude-fast',
      language: 'de',
      isRegeneration: true,
    });

    expect(prompt.startsWith('Generiere eine neue, alternative Antwort auf die letzte Anfrage des Benutzers.')).toBe(true);
  });

  it('uses code reasoning prompt for code requests and prepends older summary block', () => {
    const prompt = buildSystemPromptForRequest({
      effectiveSystemPrompt: 'Base prompt',
      isCodeMode: true,
      olderSummaryBlock: '<conversation_summary>old</conversation_summary>',
    });

    expect(prompt).toBe(`<conversation_summary>old</conversation_summary>\n${CODE_REASONING_SYSTEM_PROMPT}`);
  });

  it('keeps effective prompt when not in code mode', () => {
    const prompt = buildSystemPromptForRequest({
      effectiveSystemPrompt: 'Base prompt',
      isCodeMode: false,
    });

    expect(prompt).toBe('Base prompt');
  });
});
