/**
 * Server-side utility to resolve the Pollinations API key.
 *
 * Priority: BYOP user key (from X-Pollen-Key header) > server env vars.
 * This is the SINGLE source of truth for API key resolution on all server routes.
 */
export function resolvePollenKey(request: Request): string | undefined {
  const userKey = request.headers.get('X-Pollen-Key');
  if (userKey && userKey.trim()) return userKey.trim();
  return process.env.POLLEN_API_KEY
    || process.env.POLLINATIONS_API_KEY
    || process.env.POLLINATIONS_API_TOKEN;
}
