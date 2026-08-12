import { durationOptionsFor, pixelsForAspect, ASPECT_TO_PIXELS, DURATION_OPTIONS } from './pollinations-caps';

describe('pollinations-caps', () => {
  it('every pixel pair is between 0.8 and 1.2 megapixels', () => {
    for (const [ratio, { width, height }] of Object.entries(ASPECT_TO_PIXELS)) {
      const mp = (width * height) / 1_000_000;
      expect(mp).toBeGreaterThanOrEqual(0.8);
      expect(mp).toBeLessThanOrEqual(1.2);
      expect(width % 16).toBe(0);
      expect(height % 16).toBe(0);
    }
  });

  it('durationOptionsFor returns empty array for unknown model', () => {
    expect(durationOptionsFor('totally-unknown-model')).toEqual([]);
  });

  it('durationOptionsFor returns correct values for known models', () => {
    expect(durationOptionsFor('veo')).toEqual([4, 6, 8]);
    expect(durationOptionsFor('nova-reel')).toEqual([6, 12, 18, 24, 30, 60, 120]);
  });

  it('pixelsForAspect returns correct dimensions', () => {
    expect(pixelsForAspect('1:1')).toEqual({ width: 1024, height: 1024 });
    expect(pixelsForAspect('16:9')).toEqual({ width: 1344, height: 768 });
    expect(pixelsForAspect('nonexistent')).toBeUndefined();
  });
});
