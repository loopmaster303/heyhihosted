const MIN_PRUNA_KEY_LENGTH = 12;
const MAX_PRUNA_KEY_LENGTH = 512;
const PRUNA_KEY_PATTERN = /^[A-Za-z0-9._-]+$/;

export function normalizePrunaKey(rawKey: string | null | undefined): string | undefined {
  if (typeof rawKey !== 'string') return undefined;

  const trimmed = rawKey.trim();
  if (trimmed.length < MIN_PRUNA_KEY_LENGTH || trimmed.length > MAX_PRUNA_KEY_LENGTH) {
    return undefined;
  }
  if (!PRUNA_KEY_PATTERN.test(trimmed)) return undefined;

  return trimmed;
}
