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
  getChatImageModelGroups,
  getChatImageModelIds,
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

  test.each(['veo', 'seedance-2.0', 'wan-pro', 'wan-pro-1080p'])(
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

    // Befund B5: not.toEqual(arrayContaining([...])) haelt schon, wenn nur
    // EIN Element fehlt. Aufgeloest in Einzelpruefungen — jede ID muss
    // einzeln abwesend sein. 'klein' gehoert nicht in die Verbotsliste:
    // es ist sichtbar und aktiv (der alte Test lief nur wegen 'dirtberry').
    for (const staleId of ['dirtberry', 'flux-2-dev', 'imagen-4', 'klein-large', 'seedream', 'seedream-pro']) {
      expect(visibleImageModelIds).not.toContain(staleId);
      expect(visibleGroupModelIds).not.toContain(staleId);
    }
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

  // VACE bleibt in der Registry stehen, darf aber auch mit Pruna-Schluessel
  // nirgends auftauchen: ein Lauf dauert 6-12 Minuten.
  test('disabled VACE stays hidden even for a user with a Pruna key', () => {
    const withKey = getVisualizeModelGroups({ includeByopHidden: true })
      .flatMap((group) => group.modelIds);

    expect(withKey).not.toContain('vace');
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
      temporalControl: {
        mode: 'frame-backed-seconds',
        fps: 16,
        minFrames: 1,
        maxFrames: 81,
        secondOptions: [1, 2, 3, 4, 5],
        defaultSeconds: 5,
      },
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
    // ltx-2 wurde entfernt (Phase 3) — 'wan-pro' traegt dieselbe
    // durationRange-Semantik fuer den Pollinations-Zweig.
    const legacyPollinations = getUnifiedModel('wan-pro');

    expect(getDurationOptionsSeconds(pVideo)).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
    expect(getDefaultDurationSeconds(pVideo)).toBe(5);
    expect(getDurationOptionsSeconds(wan)).toEqual([5, 6, 7, 7.5]);
    expect(getDefaultDurationSeconds(wan)).toBe(5);
    expect(getDurationOptionsSeconds(legacyPollinations)).toEqual([5, 10, 15]);
    expect(getDefaultDurationSeconds(legacyPollinations, 10)).toBe(10);
    expect(getDefaultDurationSeconds(legacyPollinations)).toBe(5);
    expect(getDurationOptionsSeconds(getUnifiedModel('vace'))).toEqual([1, 2, 3, 4, 5]);
    expect(getDefaultDurationSeconds(getUnifiedModel('vace'))).toBe(5);
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

  test('die Chat-Bildauswahl ist genau der schluesselfreie Pollinations-Bildtier', () => {
    // E7-1: eine Regel, keine Handliste. Wird der Free-Tier erweitert
    // (z. B. kontext nach Freischaltung der Allowlist), waechst diese
    // Erwartung mit — und genau dann soll der Test brechen und gelesen werden.
    expect([...getChatImageModelIds()].sort()).toEqual(['flux', 'gpt-image', 'klein']);
  });

  test('die Chat-Bildauswahl waechst mit keinem Schluessel', () => {
    // Die Funktion nimmt keine Optionen entgegen. Das ist die Zusicherung:
    // ein Pollen- oder Pruna-Schluessel kann die Chat-Liste nicht aufblaehen.
    expect(getChatImageModelGroups).toHaveLength(0);
    expect(getChatImageModelGroups().map((group) => group.key)).toEqual(['image-free']);
  });

  test('kein Video und kein Pruna in der Chat-Auswahl', () => {
    // E7-2 und E7-3, strukturell statt per Badge.
    const models = getChatImageModelGroups().flatMap((group) => group.models);
    expect(models.length).toBeGreaterThan(0);
    for (const model of models) {
      expect(model.kind).toBe('image');
      expect(model.provider).toBe('pollinations');
      expect(model.isFree).toBe(true);
      expect(model.enabled ?? true).toBe(true);
    }
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
