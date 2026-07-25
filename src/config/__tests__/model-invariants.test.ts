import {
  AVAILABLE_POLLINATIONS_MODELS,
  DEEP_RESEARCH_MODEL_CANDIDATES,
  LIVE_SEARCH_MODEL_CANDIDATES,
  VISIBLE_POLLINATIONS_MODEL_IDS,
  getVisiblePollinationsModels,
} from '@/config/chat-options';
import {
  getChatImageModels,
  getImageModels,
  getUnifiedModel,
  getVisualizeModelGroups,
  resolvePollinationsVisualModelId,
} from '@/config/unified-image-models';

  test('visual reference limits match enabled upstream model capabilities', () => {
    expect(getUnifiedModel('gpt-image')).toEqual(expect.objectContaining({ maxImages: 16 }));
    expect(getUnifiedModel('gptimage-large')).toEqual(expect.objectContaining({ maxImages: 16 }));
    expect(getUnifiedModel('klein')).toEqual(expect.objectContaining({ maxImages: 10 }));
    expect(getUnifiedModel('wan-image')).toEqual(expect.objectContaining({ maxImages: 9 }));
    expect(getUnifiedModel('nanobanana')).toEqual(expect.objectContaining({ maxImages: 3 }));
    expect(getUnifiedModel('grok-imagine-pro')).toEqual(expect.objectContaining({ maxImages: 1 }));
    expect(getUnifiedModel('ideogram-v4-turbo')).toEqual(expect.objectContaining({ supportsReference: false, maxImages: 0 }));
  });

  test.each(['veo', 'veo-1080p', 'seedance-2.0', 'pollinations-wan-fast', 'wan-pro', 'wan-pro-1080p'])(
    '%s exposes distinct start and end frames',
    (modelId) => {
      expect(getUnifiedModel(modelId)).toEqual(expect.objectContaining({
        kind: 'video',
        maxImages: 2,
        supportsEndFrame: true,
      }));
    },
  );

  test('Grok Imagine Pro Video stays start-frame-only', () => {
    expect(getUnifiedModel('grok-video-pro')).toEqual(expect.objectContaining({
      maxImages: 1,
      supportsEndFrame: false,
    }));
  });

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
      'grok-imagine',
      'grok-imagine-pro',
      'p-image',
      'p-image-edit',
    ]));

    expect(visibleGroupModelIds).toEqual(expect.arrayContaining([
      'wan-fast',
      'qwen-image',
      'grok-imagine',
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

  test('paid Pollinations models require Pollen key visibility', () => {
    const withoutKey = getVisualizeModelGroups().flatMap((group) => group.modelIds);
    const withKey = getVisualizeModelGroups({ includeByopHidden: true }).flatMap((group) => group.modelIds);
    expect(withoutKey).not.toContain('grok-video-pro');
    expect(withKey).toContain('grok-video-pro');
  });

  test('chat image model list stays curated and separate from the full Visualize registry', () => {
    expect(getChatImageModels().map((model) => model.id).sort()).toEqual([
      'flux',
      'gpt-image',
      'zimage',
    ].sort());
  });

  test('approved upstream visual models resolve directly and stale ids no longer resolve', () => {
    expect(resolvePollinationsVisualModelId('wan-fast')).toBe('wan-fast');
    expect(resolvePollinationsVisualModelId('qwen-image')).toBe('qwen-image');
    expect(resolvePollinationsVisualModelId('grok-imagine')).toBe('grok-imagine');
    expect(resolvePollinationsVisualModelId('grok-image')).toBe('grok-imagine');
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
