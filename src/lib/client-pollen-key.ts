import { normalizePollenKey } from '@/lib/pollen-key-validation';

export const POLLEN_KEY_STORAGE_KEY = 'pollenApiKey';
export const POLLEN_KEY_CHANGED_EVENT = 'pollen-key-changed';

function dispatchPollenKeyChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(POLLEN_KEY_CHANGED_EVENT));
}

export function getStoredPollenKey(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const storedValue = localStorage.getItem(POLLEN_KEY_STORAGE_KEY);
    const normalized = normalizePollenKey(storedValue);

    if (!normalized && storedValue) {
      localStorage.removeItem(POLLEN_KEY_STORAGE_KEY);
    }

    return normalized ?? null;
  } catch {
    return null;
  }
}

export function storePollenKey(rawKey: string): string | null {
  if (typeof window === 'undefined') return null;

  const normalized = normalizePollenKey(rawKey);
  if (!normalized) return null;

  localStorage.setItem(POLLEN_KEY_STORAGE_KEY, normalized);
  dispatchPollenKeyChanged();
  return normalized;
}

export function removeStoredPollenKey(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(POLLEN_KEY_STORAGE_KEY);
  dispatchPollenKeyChanged();
}
