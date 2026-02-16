/**
 * Client-side BYOP key helper.
 *
 * Reads the user's Pollinations API key from localStorage
 * and returns a headers object to spread into fetch() calls.
 *
 * Usage:
 *   headers: { 'Content-Type': 'application/json', ...getPollenHeaders() }
 */

const STORAGE_KEY = 'pollenApiKey';

export function getPollenHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const key = localStorage.getItem(STORAGE_KEY);
    if (key && key.trim()) return { 'X-Pollen-Key': key.trim() };
  } catch {
    // localStorage blocked (e.g. incognito) — ignore
  }
  return {};
}
