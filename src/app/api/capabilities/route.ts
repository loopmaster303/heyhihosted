import { NextResponse } from 'next/server';

/**
 * Server capabilities endpoint.
 * Exposes feature flags that depend on server-side environment configuration.
 * Never leaks the actual API key.
 */
export async function GET() {
  return NextResponse.json({
    prunaAvailable: !!process.env.PRUNA_API_KEY && process.env.PRUNA_API_KEY.trim() !== '',
  });
}
