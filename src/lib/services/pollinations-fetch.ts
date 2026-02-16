/**
 * Pollinations Fetch Wrapper
 *
 * Automatically injects the BYOP user API key (from sessionStorage)
 * into all requests to internal API routes that proxy to Pollinations.
 *
 * Usage: Replace `fetch('/api/...')` with `pollinationsFetch('/api/...')`
 * The wrapper adds `X-Pollen-User-Key` header when a user key is available.
 */

const STORAGE_KEY = 'pollen_user_key';

function getPollenUserKey(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

/**
 * Fetch wrapper that auto-injects BYOP user key header.
 * Drop-in replacement for fetch() on Pollinations API routes.
 */
export async function pollinationsFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const userKey = getPollenUserKey();

  if (!userKey) {
    // No BYOP key — pass through unchanged
    return fetch(input, init);
  }

  // Merge headers: preserve existing, add user key
  const existingHeaders = new Headers(init?.headers);
  existingHeaders.set('X-Pollen-User-Key', userKey);

  return fetch(input, {
    ...init,
    headers: existingHeaders,
  });
}
