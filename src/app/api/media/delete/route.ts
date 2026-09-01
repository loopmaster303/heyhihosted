import { NextResponse } from 'next/server';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';
import { handleApiError, ApiError } from '@/lib/api-error-handler';

export const runtime = 'nodejs';

/**
 * Zeichenvorrat echter ingest.key-Werte (Media-Storage-Hash): Buchstaben,
 * Ziffern, Punkt, Unterstrich, Bindestrich. Schliesst Pfad-Tricks (/ .. %2e)
 * und URL-Sonderzeichen aus, bevor der Wert an die Upstream-URL gehaengt wird.
 */
const MEDIA_KEY_PATTERN = /^[A-Za-z0-9._-]+$/;

export async function DELETE(request: Request) {
  try {
    const key = new URL(request.url).searchParams.get('key');
    if (!key || key.includes('..') || !MEDIA_KEY_PATTERN.test(key)) {
      return NextResponse.json({ error: 'Invalid or missing media key' }, { status: 400 });
    }

    const apiKey = resolvePollenKey(request);
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Pollinations API key' }, { status: 401 });
    }

    const upstreamResponse = await fetch(
      `https://media.pollinations.ai/${encodeURIComponent(key)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    // 404 heisst der Blob ist schon weg — fuer den Aufrufer das Gleiche wie Erfolg.
    if (upstreamResponse.ok || upstreamResponse.status === 404) {
      return NextResponse.json({ deleted: true });
    }

    if (upstreamResponse.status === 401 || upstreamResponse.status === 403) {
      throw new ApiError(
        upstreamResponse.status,
        'Not authorized to delete this media asset',
        upstreamResponse.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
      );
    }

    console.error('[media/delete] Upstream error:', upstreamResponse.status);
    return NextResponse.json(
      { error: `Upstream media delete failed (${upstreamResponse.status})` },
      { status: 502 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
