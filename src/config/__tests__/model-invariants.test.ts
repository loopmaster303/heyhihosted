import {
  AVAILABLE_POLLINATIONS_MODELS,
  DEEP_RESEARCH_MODEL_CANDIDATES,
  LIVE_SEARCH_MODEL_CANDIDATES,
  VISIBLE_POLLINATIONS_MODEL_IDS,
  getVisiblePollinationsModels,
} from '@/config/chat-options';
import {
  getImageModels,
  getVisualizeModelGroups,
  resolvePollinationsVisualModelId,
} from '@/config/unified-image-models';

describe('model invariants', () => {
  test('manual visible text model policy matches the exported visible selector list', () => {
    expect(getVisiblePollinationsModels().map(model => model.id)).toEqual(VISIBLE_POLLINATIONS_MODEL_IDS);
    expect(AVAILABLE_POLLINATIONS_MODELS.map(model => model.id)).toEqual(VISIBLE_POLLINATIONS_MODEL_IDS);
  });

  test('text selector exposes current free chat models and hides paid/safety-only entries', () => {
    const visibleTextModelIds = AVAILABLE_POLLINATIONS_MODELS.map(model => model.id);

    expect(visibleTextModelIds).toEqual(expect.arrayContaining([
      'claude-fast',
      'gemini-fast',
      'gemini-search',
      'nova-fast',
      'mistral',
      'deepseek',
      'perplexity-fast',
      'perplexity-reasoning',
      'kimi',
      'glm',
      'minimax',
      'qwen-coder',
    ]));

    expect(visibleTextModelIds).not.toEqual(expect.arrayContaining([
      'claude',
      'claude-large',
      'gemini',
      'gemini-large',
      'openai',
      'openai-fast',
      'step-3.5-flash',
      'nomnom',
      'qwen-character',
      'qwen-safety',
      'nova-lite',
    ]));
  });

  test('smart-router candidate lists only reference visible text models', () => {
    const visibleTextModelIds = new Set(VISIBLE_POLLINATIONS_MODEL_IDS);

    for (const modelId of [...LIVE_SEARCH_MODEL_CANDIDATES, ...DEEP_RESEARCH_MODEL_CANDIDATES]) {
      expect(visibleTextModelIds.has(modelId)).toBe(true);
    }
  });

  test('smart-router fallback chains include at least one visible web model', () => {
    const visibleWebModelIds = new Set(
      AVAILABLE_POLLINATIONS_MODELS
        .filter((model) => model.webBrowsing)
        .map((model) => model.id)
    );

    expect(LIVE_SEARCH_MODEL_CANDIDATES.some((modelId) => visibleWebModelIds.has(modelId))).toBe(true);
    expect(DEEP_RESEARCH_MODEL_CANDIDATES.some((modelId) => visibleWebModelIds.has(modelId))).toBe(true);
  });

  test('visual registry exposes approved upstream models and hides stale drift ids', () => {
    const visibleImageModelIds = getImageModels({ includeByopHidden: true }).map((model) => model.id);
    const visibleGroupModelIds = getVisualizeModelGroups({ includeByopHidden: true })
      .flatMap((group) => group.modelIds);

    expect(visibleImageModelIds).toEqual(expect.arrayContaining([
      'qwen-image',
      'grok-imagine-pro',
      'p-image',
      'p-image-edit',
    ]));

    expect(visibleGroupModelIds).toEqual(expect.arrayContaining([
      'wan-fast',
      'qwen-image',
      'grok-imagine-pro',
      'p-image',
      'p-image-edit',
      'p-video',
    ]));

    expect(visibleImageModelIds).not.toEqual(expect.arrayContaining([
      'klein',
      'dirtberry',
      'flux-2-dev',
      'imagen-4',
      'klein-large',
      'seedream',
      'seedream-pro',
    ]));

    expect(visibleGroupModelIds).not.toEqual(expect.arrayContaining([
      'dirtberry',
      'flux-2-dev',
      'imagen-4',
      'klein-large',
      'seedream',
      'seedream-pro',
    ]));
  });

  test('visual registry keeps video models separate from image models while still exposing them with Pollen key access', () => {
    const visibleVideoModelIds = getVisualizeModelGroups({ includeByopHidden: true })
      .filter((group) => group.kind === 'video')
      .flatMap((group) => group.modelIds);

    expect(visibleVideoModelIds).toEqual(expect.arrayContaining([
      'wan-fast',
      'p-video',
    ]));

    expect(getImageModels({ includeByopHidden: true }).map((model) => model.id)).not.toEqual(expect.arrayContaining([
      'wan-fast',
      'p-video',
    ]));
  });

  test('approved upstream visual models resolve directly and stale ids no longer resolve', () => {
    expect(resolvePollinationsVisualModelId('wan-fast')).toBe('wan-fast');
    expect(resolvePollinationsVisualModelId('qwen-image')).toBe('qwen-image');
    expect(resolvePollinationsVisualModelId('grok-imagine-pro')).toBe('grok-imagine-pro');
    expect(resolvePollinationsVisualModelId('p-image')).toBe('p-image');
    expect(resolvePollinationsVisualModelId('p-image-edit')).toBe('p-image-edit');
    expect(resolvePollinationsVisualModelId('p-video')).toBe('p-video');

    expect(resolvePollinationsVisualModelId('dirtberry')).toBeUndefined();
    expect(resolvePollinationsVisualModelId('flux-2-dev')).toBeUndefined();
    expect(resolvePollinationsVisualModelId('imagen-4')).toBeUndefined();
    expect(resolvePollinationsVisualModelId('klein-large')).toBeUndefined();
    expect(resolvePollinationsVisualModelId('seedream')).toBeUndefined();
    expect(resolvePollinationsVisualModelId('seedream-pro')).toBeUndefined();
  });
});
