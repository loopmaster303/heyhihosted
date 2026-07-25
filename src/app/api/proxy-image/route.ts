import { NextResponse } from 'next/server';
import { validateRemoteMediaUrl } from '@/lib/media/remote-fetch-policy';
import { handleApiError } from '@/lib/api-error-handler';
import { MAX_UPLOAD_BYTES } from '@/lib/upload/constants';
import { readBodyWithLimit } from '@/lib/upload/read-body-with-limit';
import { isActiveContentType } from '@/lib/upload/content-type-policy';

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
    if (!contentType.toLowerCase().startsWith('image/') || isActiveContentType(contentType)) {
      return NextResponse.json({ error: 'Proxy target is not an image' }, { status: 415 });
    }

    const blob = await readBodyWithLimit(response, MAX_UPLOAD_BYTES, PROXY_IMAGE_TOO_LARGE_ERROR);

    return new NextResponse(new Uint8Array(blob), {
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
