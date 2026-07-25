import { hasUserProvidedPrunaKey, resolvePrunaKey } from './resolve-pruna-key';

describe('resolvePrunaKey', () => {
  const originalKey = process.env.PRUNA_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.PRUNA_API_KEY;
    else process.env.PRUNA_API_KEY = originalKey;
  });

  it('prefers a valid request key over the environment fallback', () => {
    process.env.PRUNA_API_KEY = 'environment_key_123456';
    const request = new Request('http://localhost/api/generate', {
      headers: { 'X-Pruna-Key': 'user_key_1234567890' },
    });

    expect(resolvePrunaKey(request)).toBe('user_key_1234567890');
    expect(hasUserProvidedPrunaKey(request)).toBe(true);
  });

  it('falls back to the environment and ignores invalid request values', () => {
    process.env.PRUNA_API_KEY = 'environment_key_123456';
    const request = new Request('http://localhost/api/generate', {
      headers: { 'X-Pruna-Key': 'short' },
    });

    expect(resolvePrunaKey(request)).toBe('environment_key_123456');
    expect(hasUserProvidedPrunaKey(request)).toBe(false);
  });
});
