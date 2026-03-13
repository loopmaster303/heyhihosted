import {
  AVAILABLE_POLLINATIONS_MODELS,
  DEFAULT_IMAGE_MODEL,
  VISIBLE_POLLINATIONS_MODEL_IDS,
  getVisiblePollinationsModels,
} from '@/config/chat-options';
import { UNIFIED_IMAGE_MODELS } from '@/config/unified-image-models';
import { pollinationUploadModels } from '@/hooks/useUnifiedImageToolState';

describe('model invariants', () => {
  test('manual visible text model policy matches the exported visible selector list', () => {
    expect(getVisiblePollinationsModels().map(model => model.id)).toEqual(VISIBLE_POLLINATIONS_MODEL_IDS);
    expect(AVAILABLE_POLLINATIONS_MODELS.map(model => model.id)).toEqual(VISIBLE_POLLINATIONS_MODEL_IDS);
  });

  test('text selector exposes current free chat models and hides paid/safety-only entries', () => {
    const visibleTextModelIds = AVAILABLE_POLLINATIONS_MODELS.map(model => model.id);

    expect(visibleTextModelIds).toEqual(expect.arrayContaining([
      'claude-airforce',
      'claude-fast',
      'gemini-fast',
      'gemini-search',
      'nova-fast',
      'step-3.5-flash',
      'mistral',
      'deepseek',
      'perplexity-fast',
      'perplexity-reasoning',
      'kimi',
      'glm',
      'minimax',
      'qwen-coder',
      'qwen-character',
      'nomnom',
    ]));

    expect(visibleTextModelIds).not.toEqual(expect.arrayContaining([
      'claude',
      'claude-large',
      'gemini',
      'gemini-large',
      'openai',
      'openai-fast',
      'qwen-safety',
      'nova-lite',
    ]));
  });

  test('visualize registry exposes only current free image and video models', () => {
    const enabledModelIds = UNIFIED_IMAGE_MODELS
      .filter(model => model.enabled ?? true)
      .map(model => model.id);

    expect(enabledModelIds).toEqual(expect.arrayContaining([
      'flux',
      'zimage',
      'imagen-4',
      'gpt-image',
      'grok-image',
      'grok-video',
    ]));

    expect(enabledModelIds).not.toEqual(expect.arrayContaining([
      'flux-2-dev',
      'dirtberry',
      'klein-large',
      'kontext',
      'nanobanana',
      'nanobanana-2',
      'nanobanana-pro',
      'seedream5',
      'gptimage-large',
      'seedance',
      'wan',
      'ltx-2',
    ]));
  });

  test('all pollinations models with supportsReference=true are present in pollinationUploadModels', () => {
    const expected = UNIFIED_IMAGE_MODELS
      .filter(m => m.provider === 'pollinations' && m.supportsReference === true && (m.enabled ?? true))
      .map(m => m.id)
      .sort();

    const actual = [...new Set(pollinationUploadModels)].sort();

    // Every supportsReference model must be in the upload list.
    const missing = expected.filter(id => !actual.includes(id));
    expect(missing).toEqual([]);
  });

  test('seedance supports optional reference image (I2V)', () => {
    const m = UNIFIED_IMAGE_MODELS.find(x => x.id === 'seedance');
    expect(m).toBeTruthy();
    expect(m?.supportsReference).toBe(true);
    expect(m?.maxImages).toBe(1);
  });

  test('default in-chat image model remains zimage after paid models are hidden', () => {
    expect(DEFAULT_IMAGE_MODEL).toBe('zimage');
  });
});
