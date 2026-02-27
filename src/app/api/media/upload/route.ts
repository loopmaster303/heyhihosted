import { NextResponse } from 'next/server';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';

const MEDIA_UPLOAD_URL = 'https://media.pollinations.ai/upload';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // Pollinations OpenAPI currently documents 10MB.

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const apiKey = resolvePollenKey(request);
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Pollinations API key' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file field in multipart form-data' }, { status: 400 });
    }

    if (!file.size || file.size <= 0) {
      return NextResponse.json({ error: 'Empty file is not allowed' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'File too large for Pollinations Media Storage (max 10MB)' },
        { status: 413 }
      );
    }

    const upstreamForm = new FormData();
    upstreamForm.append('file', file, file.name || `upload-${Date.now()}.bin`);

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
      const errorMessage = parsed?.error || `Upstream media upload failed (${upstreamResponse.status})`;
      return NextResponse.json({ error: errorMessage }, { status: upstreamResponse.status });
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to upload media' },
      { status: 500 }
    );
  }
}
