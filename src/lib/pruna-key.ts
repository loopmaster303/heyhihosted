import { getStoredPrunaKey } from '@/lib/client-pruna-key';

export function getPrunaHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const key = getStoredPrunaKey();
  return key ? { 'X-Pruna-Key': key } : {};
}
