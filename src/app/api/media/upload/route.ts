import { NextResponse } from 'next/server';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';
import { handleApiError } from '@/lib/api-error-handler';
import { MEDIA_UPLOAD_URL, MAX_UPLOAD_BYTES } from '@/lib/upload/constants';
import { readBodyWithLimit } from '@/lib/upload/read-body-with-limit';
import { isActiveContentType } from '@/lib/upload/content-type-policy';

export const runtime = 'nodejs';

const UPLOAD_TOO_LARGE_ERROR = 'File too large for Pollinations Media Storage (max 10MB)';

export async function POST(request: Request) {
  try {
    const apiKey = resolvePollenKey(request);
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Pollinations API key' }, { status: 401 });
    }

    const requestContentType = request.headers.get('content-type')?.trim() || 'application/octet-stream';

    // The only client sends the file as a raw body; multipart is no longer
    // accepted because request.formData() buffers without an enforceable limit.
    if (requestContentType.toLowerCase().startsWith('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Send the file as a raw request body, not multipart/form-data' },
        { status: 415 }
      );
    }

    if (isActiveContentType(requestContentType)) {
      return NextResponse.json(
        { error: 'This content type is not allowed for media uploads' },
        { status: 415 }
      );
    }

    const body = await readBodyWithLimit(request, MAX_UPLOAD_BYTES, UPLOAD_TOO_LARGE_ERROR);

    if (body.length === 0) {
      return NextResponse.json({ error: 'Empty file is not allowed' }, { status: 400 });
    }

    const file = new File([body], `upload-${Date.now()}.bin`, { type: requestContentType });

    const upstreamForm = new FormData();
    upstreamForm.append('file', file, file.name);

    const upstreamResponse = await fetch(MEDIA_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upstreamForm,
    });

    const rawBody = await upstreamResponse.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = { error: rawBody || 'Upstream media upload failed' };
    }

    if (!upstreamResponse.ok) {
      console.error('[media/upload] Upstream error:', upstreamResponse.status, rawBody);
      return NextResponse.json(
        { error: `Upstream media upload failed (${upstreamResponse.status})` },
        { status: upstreamResponse.status }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    return handleApiError(error);
  }
}
