import { NextRequest, NextResponse } from 'next/server';

/**
 * Streamt Audio vom Modal-Endpunkt an den Browser, ohne den Endpoint-Key
 * preiszugeben. Der Client holt Ergebnisse immer ueber diese Route — nie
 * direkt gegen Modal.
 */

const MODAL_BASE = process.env.MODAL_ACESTEP_URL ?? '';
const MODAL_KEY = process.env.MODAL_ACESTEP_KEY ?? '';

export async function GET(request: NextRequest) {
  if (!MODAL_BASE || !MODAL_KEY) {
    return NextResponse.json(
      { error: 'Sound generation is not configured (missing Modal endpoint)' },
      { status: 503 },
    );
  }

  const path = new URL(request.url).searchParams.get('path');
  if (!path || !path.startsWith('/')) {
    return NextResponse.json({ error: 'Valid path required' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${MODAL_BASE}${path}`, {
      headers: { Authorization: `Bearer ${MODAL_KEY}` },
    });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `Sound backend error (HTTP ${upstream.status})` },
        { status: upstream.status === 200 ? 502 : upstream.status },
      );
    }
    const headers = new Headers({
      'Content-Type': upstream.headers.get('content-type') ?? 'audio/mpeg',
      'Cache-Control': 'no-store',
    });
    const length = upstream.headers.get('content-length');
    if (length) headers.set('Content-Length', length);
    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error('[Sound/audio] proxy failed:', error);
    return NextResponse.json({ error: 'Sound backend unreachable' }, { status: 502 });
  }
}
