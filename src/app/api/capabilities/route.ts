import { NextResponse } from 'next/server';
import { normalizePrunaKey } from '@/lib/pruna-key-validation';

/**
 * Server capabilities endpoint.
 * Exposes feature flags that depend on server-side environment configuration.
 * Never leaks the actual API key.
 */
export async function GET() {
  return NextResponse.json({
    prunaAvailable: !!normalizePrunaKey(process.env.PRUNA_API_KEY),
  });
}
