import { buildGenerateBody, buildGenerateHeaders } from './generate-request';

const modelPruna: any = { id: 'wan-i2v', provider: 'pruna', kind: 'video', supportsReference: true, requiresReference: true, maxImages: 2, referenceMode: 'start-end-frame', unmapped: false, name: 'Wan I2V', supportsEndFrame: true, supportsAudio: false, paidOnly: true };
const modelPollen: any = { id: 'flux', provider: 'pollinations', kind: 'image', supportsReference: false, requiresReference: false, maxImages: 0, unmapped: false, name: 'Flux', supportsEndFrame: false, supportsAudio: false, paidOnly: false };
const modelPVideo2: any = { id: 'p-video-2', provider: 'pruna', kind: 'video', supportsReference: true, requiresReference: false, maxImages: 2, referenceMode: 'start-end-frame', unmapped: false, name: 'P-Video 2', supportsEndFrame: true, supportsAudio: true, paidOnly: true };
const modelPVideo2Pro: any = { id: 'p-video-2-pro', provider: 'pruna', kind: 'video', supportsReference: true, requiresReference: false, maxImages: 2, referenceMode: 'start-end-frame', unmapped: false, name: 'P-Video 2 Pro', supportsEndFrame: true, supportsAudio: true, paidOnly: true };

const baseState: any = { mode: 't2i', modelId: null, prompt: 'hi', params: {}, uploads: [], sourceVideo: null };

describe('buildGenerateBody', () => {
  it('passes uploads as image array for start-end-frame', () => {
    const body = buildGenerateBody(
      { ...baseState, uploads: ['a', 'b'], params: { duration: 5 } },
      modelPruna
    );
    expect(body.image).toEqual(['a', 'b']);
    expect(body.params).toEqual({ duration: 5 });
  });

  it('omits image when no uploads', () => {
    const body = buildGenerateBody(baseState, modelPollen);
    expect(body.image).toBeUndefined();
  });

  it('omits image for models without reference support even when uploads exist', () => {
    const body = buildGenerateBody({ ...baseState, uploads: ['a'] }, modelPollen);
    expect(body.image).toBeUndefined();
  });

  it('extracts seed from params', () => {
    const withSeed = buildGenerateBody({ ...baseState, params: { seed: 42 } }, modelPollen);
    expect(withSeed.seed).toBe(42);
  });

  it('extracts duration from params', () => {
    const withDur = buildGenerateBody({ ...baseState, params: { duration: 10 } }, modelPollen);
    expect(withDur.duration).toBe(10);
  });

  it('lifts quality, transparent and resolution out of the params bag', () => {
    const body = buildGenerateBody(
      { ...baseState, params: { quality: 'high', transparent: true, resolution: '1080p' } },
      modelPollen
    );
    expect(body.quality).toBe('high');
    expect(body.transparent).toBe(true);
    expect(body.resolution).toBe('1080p');
  });

  it('leaves the lifted fields undefined when the model has no such controls', () => {
    const body = buildGenerateBody(baseState, modelPollen);
    expect(body.quality).toBeUndefined();
    expect(body.transparent).toBeUndefined();
    expect(body.resolution).toBeUndefined();
  });

  it('passes sourceVideo when set', () => {
    const withVideo = buildGenerateBody({ ...baseState, sourceVideo: 'https://a/v.mp4' }, modelPruna);
    expect(withVideo.video).toBe('https://a/v.mp4');
  });
});

describe('buildGenerateBody for p-video-2', () => {
  it('transports a fixed duration unchanged and drops the UI-only duration_auto flag from params', () => {
    const state: any = { ...baseState, params: { duration: 10, duration_auto: false, resolution: '720p' } };
    const body = buildGenerateBody(state, modelPVideo2);
    expect(body.duration).toBe(10);
    expect(body.params).toEqual({ duration: 10, resolution: '720p' });
  });

  it('removes duration entirely when duration_auto is true, without mutating state.params', () => {
    const state: any = { ...baseState, params: { duration: 10, duration_auto: true, resolution: '720p' } };
    const originalParams = state.params;
    const body = buildGenerateBody(state, modelPVideo2);
    expect(body.duration).toBeUndefined();
    expect(body.params).toEqual({ resolution: '720p' });
    expect(body.params).not.toHaveProperty('duration_auto');
    expect(body.params).not.toHaveProperty('duration');
    // Originalzustand bleibt unveraendert — fuer Wiederholung/Bedienelemente.
    expect(state.params).toBe(originalParams);
    expect(state.params).toEqual({ duration: 10, duration_auto: true, resolution: '720p' });
  });

  it('keeps the chosen seconds when switching back to manual', () => {
    const state: any = { ...baseState, params: { duration: 12, duration_auto: false } };
    const body = buildGenerateBody(state, modelPVideo2);
    expect(body.duration).toBe(12);
    expect(body.params).toEqual({ duration: 12 });
  });

  it('does not clean params for other models', () => {
    const body = buildGenerateBody(
      { ...baseState, params: { duration: 10, duration_auto: true } },
      modelPruna,
    );
    expect(body.params).toEqual({ duration: 10, duration_auto: true });
    expect(body.duration).toBe(10);
  });
});

describe('buildGenerateBody for p-video-2-pro', () => {
  it('keeps Pro resolution in params and preserves the selected contract fields', () => {
    const state: any = {
      ...baseState,
      mode: 'i2v',
      uploads: ['start', 'end'],
      params: {
        duration: 8,
        resolution: '768p',
        aspect_ratio: '3:2',
        mode: 'quality',
        prompt_upsampler: 'off',
        seed: 0,
      },
    };
    const body = buildGenerateBody(state, modelPVideo2Pro);

    expect(body.model).toBe('p-video-2-pro');
    expect(body.params).toEqual(state.params);
    expect(body.params?.resolution).toBe('768p');
    expect(body.resolution).toBeUndefined();
    expect(body.duration).toBe(8);
    expect(body.seed).toBe(0);
    expect(body.aspectRatio).toBe('3:2');
    expect(body.image).toEqual(['start', 'end']);
    expect(state.params).toEqual({
      duration: 8,
      resolution: '768p',
      aspect_ratio: '3:2',
      mode: 'quality',
      prompt_upsampler: 'off',
      seed: 0,
    });
  });

  it('does not apply p-video-2 auto-duration cleanup', () => {
    const state: any = {
      ...baseState,
      params: { duration: 7, duration_auto: true, resolution: '480p' },
    };
    const body = buildGenerateBody(state, modelPVideo2Pro);
    expect(body.duration).toBe(7);
    expect(body.params).toEqual(state.params);
    expect(body.resolution).toBeUndefined();
  });
});

describe('buildGenerateHeaders', () => {
  it('sends both headers when both keys are set', () => {
    expect(buildGenerateHeaders('p', 'q')).toEqual({ 'X-Pollen-Key': 'p', 'X-Pruna-Key': 'q' });
  });
  it('omits headers when a key is empty', () => {
    expect(buildGenerateHeaders(undefined, 'q')).toEqual({ 'X-Pruna-Key': 'q' });
  });
});
