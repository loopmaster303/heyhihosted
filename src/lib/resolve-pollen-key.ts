import { normalizePollenKey } from '@/lib/pollen-key-validation';

/**
 * Server-side utility to resolve the Pollinations API key.
 *
 * Priority: BYOP user key (from X-Pollen-Key header) > server env vars.
 * This is the SINGLE source of truth for API key resolution on all server routes.
 */
export function resolvePollenKey(request: Request): string | undefined {
  const userKey = normalizePollenKey(request.headers.get('X-Pollen-Key'));
  if (userKey) return userKey;

  return normalizePollenKey(process.env.POLLEN_API_KEY)
    || normalizePollenKey(process.env.POLLINATIONS_API_KEY)
    || normalizePollenKey(process.env.POLLINATIONS_API_TOKEN);
}

export function hasUserProvidedPollenKey(request: Request): boolean {
  return !!normalizePollenKey(request.headers.get('X-Pollen-Key'));
}
