import { NextResponse } from 'next/server';

/**
 * Legacy compatibility route.
 * S3 signed uploads were removed in favor of Pollinations Media Storage.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Deprecated endpoint. Use /api/media/upload.' },
    { status: 410 }
  );
}
