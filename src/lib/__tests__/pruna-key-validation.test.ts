import { normalizePrunaKey } from '../pruna-key-validation';

describe('normalizePrunaKey', () => {
  it('trims plausible keys without requiring a vendor prefix', () => {
    expect(normalizePrunaKey('  pruna_live_1234567890  ')).toBe('pruna_live_1234567890');
    expect(normalizePrunaKey('custom-token.1234567890')).toBe('custom-token.1234567890');
  });

  it('rejects empty, short, control-character, whitespace, and oversized values', () => {
    expect(normalizePrunaKey('')).toBeUndefined();
    expect(normalizePrunaKey('short')).toBeUndefined();
    expect(normalizePrunaKey('valid key with spaces')).toBeUndefined();
    expect(normalizePrunaKey('valid-key-123456\nnext')).toBeUndefined();
    expect(normalizePrunaKey('a'.repeat(513))).toBeUndefined();
  });
});
