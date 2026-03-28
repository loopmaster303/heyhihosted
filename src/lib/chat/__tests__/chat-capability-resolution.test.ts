import {
  normalizeChatModeState,
  resolveEffectiveTextModel,
  resolveRequestCapabilities,
  resolveStartNewChatState,
} from '../chat-capability-resolution';
import { VISIBLE_POLLINATIONS_MODEL_IDS } from '@/config/chat-options';

describe('chat capability resolution', () => {
  it('falls back to the default text model when no id is provided', () => {
    expect(resolveEffectiveTextModel(undefined)).toBe('gemini-fast');
  });

  it('falls back to the default text model for unknown ids', () => {
    expect(resolveEffectiveTextModel('definitely-not-real')).toBe('gemini-fast');
  });

  it('falls back to the default text model for hidden legacy ids', () => {
    expect(resolveEffectiveTextModel('openai')).toBe('gemini-fast');
  });

  it('keeps compose and visualize mutually exclusive when compose wins', () => {
    expect(
      normalizeChatModeState({
        isImageMode: true,
        isComposeMode: true,
        isCodeMode: false,
        webBrowsingEnabled: false,
      })
    ).toEqual({
      isImageMode: false,
      isComposeMode: true,
      isCodeMode: false,
      webBrowsingEnabled: false,
    });
  });

  it('preserves code and web flags when starting a new chat', () => {
    expect(
      resolveStartNewChatState({
        initialModelId: 'claude-fast',
        isImageMode: false,
        isComposeMode: false,
        isCodeMode: true,
        webBrowsingEnabled: true,
      })
    ).toEqual({
      selectedModelId: 'claude-fast',
      isImageMode: false,
      isComposeMode: false,
      isCodeMode: true,
      webBrowsingEnabled: true,
    });
  });

  it('switches upload requests to a vision-capable fallback model', () => {
    expect(
      resolveRequestCapabilities({
        selectedModelId: 'deepseek',
        hasUploadedFile: true,
        isImageModeIntent: false,
      })
    ).toMatchObject({
      selectedModelId: 'claude-fast',
      requiresVisionModel: true,
      didFallbackToVisionModel: true,
    });
  });

  it('never resolves request capabilities to a non-visible text model id', () => {
    const resolution = resolveRequestCapabilities({
      selectedModelId: 'openai',
      hasUploadedFile: false,
      isImageModeIntent: false,
    });

    expect(VISIBLE_POLLINATIONS_MODEL_IDS).toContain(resolution.selectedModelId);
  });

  it('does not force code mode during visualize requests', () => {
    expect(
      resolveRequestCapabilities({
        selectedModelId: 'qwen-coder',
        hasUploadedFile: false,
        isImageModeIntent: true,
        isCodeMode: true,
      })
    ).toMatchObject({
      isImageModeIntent: true,
      isCodeMode: false,
      requiresVisionModel: false,
    });
  });
});
