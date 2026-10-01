import {
  normalizeChatModeState,
  resolveEffectiveTextModel,
  resolveRequestCapabilities,
  resolveStartNewChatState,
} from '../chat-capability-resolution';
import { VISIBLE_POLLINATIONS_MODEL_IDS } from '@/config/chat-options';

describe('chat capability resolution', () => {
  it('falls back to the default text model when no id is provided', () => {
    expect(resolveEffectiveTextModel(undefined)).toBe('deepseek');
  });

  it('falls back to the default text model for unknown ids', () => {
    expect(resolveEffectiveTextModel('definitely-not-real')).toBe('deepseek');
  });

  it('falls back to the default text model for hidden legacy ids', () => {
    expect(resolveEffectiveTextModel('openai')).toBe('deepseek');
  });

  it('carries only code and web flags — image and compose modes are gone', () => {
    expect(
      normalizeChatModeState({ isCodeMode: true, webBrowsingEnabled: false })
    ).toEqual({ isCodeMode: true, webBrowsingEnabled: false });
  });

  it('preserves code and web flags when starting a new chat', () => {
    expect(
      resolveStartNewChatState({
        initialModelId: 'claude-fast',
        isCodeMode: true,
        webBrowsingEnabled: true,
      })
    ).toEqual({
      selectedModelId: 'claude-fast',
      isCodeMode: true,
      webBrowsingEnabled: true,
    });
  });

  it('switches upload requests to a vision-capable fallback model', () => {
    expect(
      resolveRequestCapabilities({
        selectedModelId: 'deepseek',
        hasUploadedFile: true,
      })
    ).toMatchObject({
      selectedModelId: 'claude-fast',
      requiresVisionModel: true,
      didFallbackToVisionModel: true,
    });
  });

  it('exposes the originally requested model when falling back to a vision model', () => {
    const resolution = resolveRequestCapabilities({
      selectedModelId: 'deepseek',
      hasUploadedFile: true,
    });

    expect(resolution.requestedModel.id).toBe('deepseek');
    expect(resolution.selectedModel.id).not.toBe('deepseek');
  });

  it('never resolves request capabilities to a non-visible text model id', () => {
    const resolution = resolveRequestCapabilities({
      selectedModelId: 'openai',
      hasUploadedFile: false,
    });

    expect(VISIBLE_POLLINATIONS_MODEL_IDS).toContain(resolution.selectedModelId);
  });

  it('passes code mode through', () => {
    expect(
      resolveRequestCapabilities({
        selectedModelId: 'qwen-coder',
        hasUploadedFile: false,
        isCodeMode: true,
      })
    ).toMatchObject({ isCodeMode: true, requiresVisionModel: false });
  });
});
