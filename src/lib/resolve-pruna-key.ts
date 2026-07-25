import { normalizePrunaKey } from '@/lib/pruna-key-validation';

export function resolvePrunaKey(request: Request): string | undefined {
  return normalizePrunaKey(request.headers.get('X-Pruna-Key'))
    ?? normalizePrunaKey(process.env.PRUNA_API_KEY);
}

export function hasUserProvidedPrunaKey(request: Request): boolean {
  return !!normalizePrunaKey(request.headers.get('X-Pruna-Key'));
}
