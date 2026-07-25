import { normalizePrunaKey } from '@/lib/pruna-key-validation';

export const PRUNA_KEY_STORAGE_KEY = 'prunaApiKey';
export const PRUNA_KEY_CHANGED_EVENT = 'pruna-key-changed';

function dispatchPrunaKeyChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(PRUNA_KEY_CHANGED_EVENT));
}

export function getStoredPrunaKey(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const storedValue = localStorage.getItem(PRUNA_KEY_STORAGE_KEY);
    const normalized = normalizePrunaKey(storedValue);
    if (!normalized && storedValue) localStorage.removeItem(PRUNA_KEY_STORAGE_KEY);
    return normalized ?? null;
  } catch {
    return null;
  }
}

export function storePrunaKey(rawKey: string): string | null {
  if (typeof window === 'undefined') return null;

  const normalized = normalizePrunaKey(rawKey);
  if (!normalized) return null;
  localStorage.setItem(PRUNA_KEY_STORAGE_KEY, normalized);
  dispatchPrunaKeyChanged();
  return normalized;
}

export function removeStoredPrunaKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PRUNA_KEY_STORAGE_KEY);
  dispatchPrunaKeyChanged();
}
