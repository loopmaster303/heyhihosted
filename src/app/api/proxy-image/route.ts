import { NextResponse } from 'next/server';
import { validateRemoteMediaUrl } from '@/lib/media/remote-fetch-policy';
import { handleApiError } from '@/lib/api-error-handler';
import { MAX_UPLOAD_BYTES } from '@/lib/upload/constants';

const PROXY_IMAGE_TOO_LARGE_ERROR = 'Image too large for proxy (max 10MB)';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
  }

  const urlPolicy = validateRemoteMediaUrl(imageUrl);
  if (!urlPolicy.allowed) {
    return NextResponse.json({ error: 'URL is not allowed for image proxy' }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, { redirect: 'error' });
    if (!response.ok) throw new Error('Failed to fetch image');

    const contentType = response.headers.get('content-type') || 'image/png';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return NextResponse.json({ error: 'Proxy target is not an image' }, { status: 415 });
    }

    const contentLengthHeader = response.headers.get('content-length');
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null;
    if (contentLength !== null && Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: PROXY_IMAGE_TOO_LARGE_ERROR }, { status: 413 });
    }

    const blob = await response.arrayBuffer();
    if (blob.byteLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: PROXY_IMAGE_TOO_LARGE_ERROR }, { status: 413 });
    }

    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
