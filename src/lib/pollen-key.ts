import { getStoredPollenKey } from '@/lib/client-pollen-key';

/**
 * Client-side BYOP key helper.
 *
 * Reads the user's Pollinations API key from localStorage
 * and returns a headers object to spread into fetch() calls.
 *
 * Usage:
 *   headers: { 'Content-Type': 'application/json', ...getPollenHeaders() }
 */

export function getPollenHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const key = getStoredPollenKey();
  if (key) return { 'X-Pollen-Key': key };
  return {};
}
