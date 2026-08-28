import { CODE_REASONING_SYSTEM_PROMPT } from '@/config/chat-options';

import { buildChatSystemPrompt, buildRuntimeContext, buildSystemPromptForRequest } from '../chat-prompt-builder';

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
    const now = new Date('2026-08-22T08:12:00Z');
    const prompt = buildSystemPromptForRequest({
      effectiveSystemPrompt: 'Base prompt',
      isCodeMode: true,
      olderSummaryBlock: '<conversation_summary>old</conversation_summary>',
      now,
      timeZone: 'Europe/Berlin',
    });

    expect(prompt).toBe(`<conversation_summary>old</conversation_summary>\n${CODE_REASONING_SYSTEM_PROMPT}\n${buildRuntimeContext(now, 'Europe/Berlin')}`);
  });

  it('keeps effective prompt when not in code mode', () => {
    const prompt = buildSystemPromptForRequest({
      effectiveSystemPrompt: 'Base prompt',
      isCodeMode: false,
    });

    expect(prompt).toBe('Base prompt');
  });


  // D1: Die Marker-Mechanik war fertig gebaut, aber kein System-Prompt hat sie
  // je erwaehnt — der Handler lief bei jeder Antwort und fand nie etwas.
  it('teaches the media-generation markers', () => {
    const prompt = buildChatSystemPrompt({
      baseStylePrompt: '<system_prompt>base</system_prompt>',
      selectedModelId: 'deepseek',
      language: 'de',
    });

    expect(prompt).toContain('[IMAGE_GEN:');
    expect(prompt).toContain('[MUSIC_GEN:');
    expect(prompt).toContain('At most ONE marker per response');
    expect(prompt).toContain('own line');
    expect(prompt).toContain('Never illustrate an answer unasked');
  });
});
