import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';

const IngestSchema = z.object({
  sourceUrl: z.string().url(),
  sessionId: z.string().optional(),
  kind: z.enum(['image', 'video']).optional(),
});

const MEDIA_UPLOAD_URL = 'https://media.pollinations.ai/upload';
const MIN_BYTES = 1000;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // Pollinations OpenAPI currently documents 10MB.

function fallbackContentType(kind?: 'image' | 'video') {
  return kind === 'video' ? 'video/mp4' : 'image/jpeg';
}

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const apiKey = resolvePollenKey(request);
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Pollinations API key' }, { status: 401 });
    }

    const body = await request.json();
    const { sourceUrl, kind } = IngestSchema.parse(body);

    const startTime = Date.now();
    const pollTimeout = kind === 'video' ? 180000 : 60000;
    const pollDelay = kind === 'video' ? 4000 : 2000;

    let buffer: Buffer | null = null;
    let contentType: string | null = null;

    while (Date.now() - startTime < pollTimeout) {
      const response = await fetch(sourceUrl);
      if (response.ok) {
        contentType = response.headers.get('content-type');
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > MIN_BYTES) {
          buffer = Buffer.from(arrayBuffer);
          break;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, pollDelay));
    }

    if (!buffer) {
      return NextResponse.json({ error: 'Timed out waiting for media' }, { status: 504 });
    }

    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Generated media exceeds Pollinations Media Storage limit (max 10MB)' },
        { status: 413 }
      );
    }

    const normalizedContentType = contentType || fallbackContentType(kind);
    const uploadResponse = await fetch(MEDIA_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': normalizedContentType,
      },
      body: buffer,
    });

    const rawBody = await uploadResponse.text();
    let uploadData: any = null;
    try {
      uploadData = JSON.parse(rawBody);
    } catch {
      uploadData = { error: rawBody || 'Upstream media ingest failed' };
    }

    if (!uploadResponse.ok) {
      const errorMessage = uploadData?.error || `Upstream media ingest failed (${uploadResponse.status})`;
      return NextResponse.json({ error: errorMessage }, { status: uploadResponse.status });
    }

    return NextResponse.json({
      key: uploadData.id,
      url: uploadData.url,
      contentType: uploadData.contentType || normalizedContentType,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to ingest media' },
      { status: 500 }
    );
  }
}
