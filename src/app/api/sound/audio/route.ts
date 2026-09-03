import { NextRequest, NextResponse } from 'next/server';
import { ApiError, handleApiError } from '@/lib/api-error-handler';

/**
 * Streamt Audio vom Modal-Endpunkt an den Browser, ohne den Endpoint-Key
 * preiszugeben. Der Client holt Ergebnisse immer ueber diese Route — nie
 * direkt gegen Modal.
 */

const MODAL_BASE = process.env.MODAL_ACESTEP_URL ?? '';
const MODAL_KEY = process.env.MODAL_ACESTEP_KEY ?? '';

/**
 * Welche Pfade diese Route weiterleiten darf.
 *
 * Bis 2026-09-03 stand hier nur `startsWith('/')`. Damit war JEDER
 * GET-Endpunkt des ACE-Step-Servers oeffentlich erreichbar — authentifiziert
 * mit dem Schluessel des Betreibers, den der Aufrufer nie zu sehen bekommt.
 * Ein Proxy, der einen fremden Schluessel traegt, braucht eine Allowlist;
 * `remote-fetch-policy.ts` macht dasselbe fuer `/api/proxy-image`.
 *
 * ACE-Step liefert Ergebnisse als `/v1/audio?path=…` (siehe
 * modal-acestep/README.md). Nur dieses Praefix wird durchgelassen.
 */
const ALLOWED_PATH_PREFIXES = ['/v1/audio'] as const;

export function isAllowedAudioPath(path: string): boolean {
  if (!path.startsWith('/')) return false;
  // Kein `//host`, kein Protokoll-Wechsel, kein Aufstieg aus dem Praefix.
  if (path.startsWith('//') || path.includes('..')) return false;
  return ALLOWED_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}?`) || path.startsWith(`${prefix}/`),
  );
}

export async function GET(request: NextRequest) {
  try {
    if (!MODAL_BASE || !MODAL_KEY) {
      throw new ApiError(
        503,
        'Sound generation is not configured (missing Modal endpoint)',
        'SOUND_NOT_CONFIGURED',
      );
    }

    const path = new URL(request.url).searchParams.get('path');
    if (!path || !isAllowedAudioPath(path)) {
      // Die Allowlist ist auf `/v1/audio` geschnitten, weil das
      // modal-acestep/README diese Form als Ergebnis nennt. Welche Form
      // `entry.file` aus `query_result` wirklich traegt, ist ungeprueft —
      // ein echter Lauf kostet GPU-Zeit. Deshalb wird ein blockierter Pfad
      // geloggt: der erste echte Lauf sagt dann, ob die Regel zu eng ist,
      // statt dass jemand raet.
      console.warn('[Sound/audio] Pfad blockiert, nicht auf der Allowlist:', path);
      throw new ApiError(400, 'Path is not an allowed audio result path', 'SOUND_INVALID_PATH');
    }

    const upstream = await fetch(`${MODAL_BASE}${path}`, {
      headers: { Authorization: `Bearer ${MODAL_KEY}` },
    });
    if (!upstream.ok || !upstream.body) {
      throw new ApiError(
        upstream.status === 200 ? 502 : upstream.status,
        `Sound backend error (HTTP ${upstream.status})`,
        upstream.status >= 500 ? 'PROVIDER_UNAVAILABLE' : 'SOUND_BACKEND_ERROR',
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
    if (error instanceof ApiError) return handleApiError(error);
    console.error('[Sound/audio] proxy failed:', error);
    return handleApiError(
      new ApiError(502, 'Sound backend unreachable', 'PROVIDER_UNAVAILABLE'),
    );
  }
}
