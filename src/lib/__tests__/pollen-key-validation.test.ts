import { normalizePollenKey } from '../pollen-key-validation';

describe('normalizePollenKey', () => {
  it('returns a trimmed key for valid token-shaped values', () => {
    expect(normalizePollenKey('  sk_test_123  ')).toBe('sk_test_123');
    expect(normalizePollenKey('pollinations.token-abc_123')).toBe('pollinations.token-abc_123');
  });

  it('rejects empty, whitespace-containing, control-character, and oversized values', () => {
    expect(normalizePollenKey('')).toBeUndefined();
    expect(normalizePollenKey('   ')).toBeUndefined();
    expect(normalizePollenKey('sk bad')).toBeUndefined();
    expect(normalizePollenKey('sk_bad\nnext')).toBeUndefined();
    expect(normalizePollenKey(`sk_${'a'.repeat(513)}`)).toBeUndefined();
  });
});
