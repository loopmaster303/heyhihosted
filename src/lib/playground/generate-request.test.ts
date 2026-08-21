import { buildGenerateBody, buildGenerateHeaders } from './generate-request';

const modelPruna: any = { id: 'wan-i2v', provider: 'pruna', kind: 'video', supportsReference: true, requiresReference: true, maxImages: 2, referenceMode: 'start-end-frame', unmapped: false, name: 'Wan I2V', supportsEndFrame: true, supportsAudio: false, paidOnly: true };
const modelPollen: any = { id: 'flux', provider: 'pollinations', kind: 'image', supportsReference: false, requiresReference: false, maxImages: 0, unmapped: false, name: 'Flux', supportsEndFrame: false, supportsAudio: false, paidOnly: false };

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

describe('buildGenerateHeaders', () => {
  it('sends both headers when both keys are set', () => {
    expect(buildGenerateHeaders('p', 'q')).toEqual({ 'X-Pollen-Key': 'p', 'X-Pruna-Key': 'q' });
  });
  it('omits headers when a key is empty', () => {
    expect(buildGenerateHeaders(undefined, 'q')).toEqual({ 'X-Pruna-Key': 'q' });
  });
});
