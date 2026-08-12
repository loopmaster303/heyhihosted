import { modesFor, isModelInMode } from './mode-mapping';

describe('mode-mapping', () => {
  it('pure T2I model lands only in T2I', () => {
    expect(modesFor({ id: 'flux', kind: 'image', supportsReference: false, requiresReference: false })).toEqual(['t2i']);
  });
  it('image model with optional ref lands in T2I and I2I', () => {
    expect(modesFor({ id: 'klein', kind: 'image', supportsReference: true, requiresReference: false }).sort()).toEqual(['i2i', 't2i']);
  });
  it('I2I-only model lands only in I2I', () => {
    expect(modesFor({ id: 'qwen-image-edit-plus', kind: 'image', supportsReference: true, requiresReference: true })).toEqual(['i2i']);
  });
  it('T2V model lands only in T2V', () => {
    expect(modesFor({ id: 'wan-t2v', kind: 'video', supportsReference: false, requiresReference: false })).toEqual(['t2v']);
  });
  it('smart video model lands in both T2V and I2V', () => {
    expect(modesFor({ id: 'p-video', kind: 'video', supportsReference: true, requiresReference: false }).sort()).toEqual(['i2v', 't2v']);
  });
  it('I2V-only model lands only in I2V', () => {
    expect(modesFor({ id: 'wan-i2v', kind: 'video', supportsReference: true, requiresReference: true })).toEqual(['i2v']);
  });
  it('isModelInMode agrees with modesFor', () => {
    const m: any = { id: 'p-video', kind: 'video', supportsReference: true, requiresReference: false };
    expect(isModelInMode(m, 't2v')).toBe(true);
    expect(isModelInMode(m, 'i2v')).toBe(true);
    expect(isModelInMode(m, 't2i')).toBe(false);
  });
});
