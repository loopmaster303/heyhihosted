import { buildGenerateBody, buildGenerateHeaders } from './generate-request';

const modelPruna: any = { id: 'wan-i2v', provider: 'pruna', kind: 'video', supportsReference: true, requiresReference: true, maxImages: 2, referenceMode: 'start-end-frame', unmapped: false, name: 'Wan I2V' };
const modelPollen: any = { id: 'flux', provider: 'pollinations', kind: 'image', supportsReference: false, requiresReference: false, maxImages: 0, unmapped: false, name: 'Flux' };

const baseState: any = { mode: 't2i', modelId: null, prompt: 'hi', aspectRatio: '1:1', durationSeconds: null, seed: '', negativePrompt: '', guidance: '', steps: '', uploads: [], sourceVideo: null };

describe('buildGenerateBody', () => {
  it('passes uploads as `image` array for start-end-frame', () => {
    const body = buildGenerateBody({ ...baseState, uploads: ['a', 'b'], durationSeconds: 5 }, modelPruna);
    expect(body.image).toEqual(['a', 'b']);
    expect(body.duration).toBe(5);
  });
  it('omits image when no uploads', () => {
    const body = buildGenerateBody(baseState, modelPollen);
    expect(body.image).toBeUndefined();
  });
  it('parses seed as number and drops it when empty', () => {
    const withSeed = buildGenerateBody({ ...baseState, seed: '42' }, modelPollen);
    expect(withSeed.seed).toBe(42);
    const noSeed = buildGenerateBody(baseState, modelPollen);
    expect(noSeed.seed).toBeUndefined();
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
