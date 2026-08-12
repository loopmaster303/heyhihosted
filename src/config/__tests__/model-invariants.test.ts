import {
  AVAILABLE_POLLINATIONS_MODELS,
  DEEP_RESEARCH_MODEL_CANDIDATES,
  LIVE_SEARCH_MODEL_CANDIDATES,
  VISIBLE_POLLINATIONS_MODEL_IDS,
  getVisiblePollinationsModels,
} from '@/config/chat-options';
import {
  UNIFIED_IMAGE_MODELS,
  getDefaultDurationSeconds,
  getDurationOptionsSeconds,
  getChatImageModels,
  getImageModels,
  getUnifiedModel,
  getVisualizeModelGroups,
  resolvePollinationsVisualModelId,
  shouldIncludeByopHidden,
} from '@/config/unified-image-models';
import { unifiedModelConfigs } from '@/config/unified-model-configs';
import { getPrunaModelMapping } from '@/config/pruna-models';

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

  test('Pruna video models expose their individual duration semantics in seconds', () => {
    expect(getUnifiedModel('p-video')).toEqual(expect.objectContaining({
      temporalControl: { mode: 'seconds', min: 1, max: 20, step: 1, defaultSeconds: 5 },
    }));

    for (const modelId of ['wan-fast', 'wan-t2v', 'wan-i2v']) {
      expect(getUnifiedModel(modelId)).toEqual(expect.objectContaining({
        temporalControl: {
          mode: 'frame-backed-seconds',
          fps: 16,
          minFrames: 81,
          maxFrames: 121,
          secondOptions: [5, 6, 7, 7.5],
          defaultSeconds: 5,
        },
      }));
    }

    expect(getUnifiedModel('p-video-avatar')).toEqual(expect.objectContaining({
      temporalControl: { mode: 'speech-driven' },
    }));
    expect(getUnifiedModel('p-video-animate')).toEqual(expect.objectContaining({
      temporalControl: { mode: 'source-video-driven' },
    }));
    expect(getUnifiedModel('p-video-replace')).toEqual(expect.objectContaining({
      temporalControl: { mode: 'source-video-driven' },
    }));
    expect(getUnifiedModel('vace')).toEqual(expect.objectContaining({
      temporalControl: { mode: 'fixed-frames', frames: 81 },
    }));
  });

  test('Pruna model capabilities do not advertise unsupported duration or audio controls', () => {
    for (const modelId of ['p-video', 'p-video-avatar', 'p-video-animate', 'p-video-replace', 'wan-fast', 'wan-t2v', 'wan-i2v', 'vace']) {
      expect(getUnifiedModel(modelId)?.durationRange).toBeUndefined();
    }

    expect(getUnifiedModel('wan-fast')?.supportsAudio).toBe(false);
    expect(getUnifiedModel('wan-t2v')?.supportsAudio).toBe(false);
    expect(getUnifiedModel('wan-i2v')?.supportsAudio).toBe(false);
    expect(getUnifiedModel('p-video-avatar')?.supportsAudio).toBe(false);
  });

  test('shared provider visibility uses only the selected provider entitlement', () => {
    expect(shouldIncludeByopHidden('pruna', { prunaAvailable: true, hasPollenKey: false })).toBe(true);
    expect(shouldIncludeByopHidden('pruna', { prunaAvailable: false, hasPollenKey: true })).toBe(false);
    expect(shouldIncludeByopHidden('pollinations', { prunaAvailable: true, hasPollenKey: false })).toBe(false);
    expect(shouldIncludeByopHidden('pollinations', { prunaAvailable: false, hasPollenKey: true })).toBe(true);
  });

  test('shared duration helpers derive Pruna seconds and preserve legacy Pollinations defaults', () => {
    const pVideo = getUnifiedModel('p-video');
    const wan = getUnifiedModel('wan-t2v');
    const legacyPollinations = getUnifiedModel('ltx-2');

    expect(getDurationOptionsSeconds(pVideo)).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
    expect(getDefaultDurationSeconds(pVideo)).toBe(5);
    expect(getDurationOptionsSeconds(wan)).toEqual([5, 6, 7, 7.5]);
    expect(getDefaultDurationSeconds(wan)).toBe(5);
    expect(getDurationOptionsSeconds(legacyPollinations)).toEqual([6, 8, 10]);
    expect(getDefaultDurationSeconds(legacyPollinations, 8)).toBe(8);
    expect(getDefaultDurationSeconds(legacyPollinations)).toBe(6);
    expect(getDefaultDurationSeconds(getUnifiedModel('vace'))).toBeUndefined();
  });

  test('migrated Pruna video configs contain no generic duration input', () => {
    for (const modelId of ['p-video', 'p-video-avatar', 'p-video-animate', 'p-video-replace', 'wan-fast', 'wan-t2v', 'wan-i2v', 'vace']) {
      expect(unifiedModelConfigs[modelId].inputs.map(input => input.name)).not.toContain('duration');
    }
  });

  test('Pruna video configs expose aspect ratio only when the adapter accepts it', () => {
    for (const modelId of ['wan-fast', 'wan-i2v', 'vace', 'p-video-avatar', 'p-video-animate', 'p-video-replace']) {
      expect(unifiedModelConfigs[modelId].inputs.map(input => input.name)).not.toContain('aspect_ratio');
    }

    for (const modelId of ['p-video', 'wan-t2v']) {
      expect(unifiedModelConfigs[modelId].inputs.map(input => input.name)).toContain('aspect_ratio');
    }
  });

  test('every unified Pruna model has an explicit Pruna adapter mapping', () => {
    for (const model of UNIFIED_IMAGE_MODELS.filter(({ provider }) => provider === 'pruna')) {
      expect(getPrunaModelMapping(model.id)).toBeDefined();
    }
  });

  test('Wan I2V accepts distinct start and end frames', () => {
    expect(getUnifiedModel('wan-i2v')).toEqual(expect.objectContaining({
      supportsReference: true,
      maxImages: 2,
      supportsEndFrame: true,
    }));
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
