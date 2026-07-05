import { NextResponse } from 'next/server';
import { validateRemoteMediaUrl } from '@/lib/media/remote-fetch-policy';
import { handleApiError } from '@/lib/api-error-handler';

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

    const blob = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

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
