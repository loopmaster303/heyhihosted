const MAX_POLLEN_KEY_LENGTH = 512;
const POLLEN_KEY_PATTERN = /^[A-Za-z0-9._-]+$/;

export function normalizePollenKey(rawKey: string | null | undefined): string | undefined {
  if (typeof rawKey !== 'string') return undefined;

  const trimmed = rawKey.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > MAX_POLLEN_KEY_LENGTH) return undefined;
  if (!POLLEN_KEY_PATTERN.test(trimmed)) return undefined;

  return trimmed;
}
