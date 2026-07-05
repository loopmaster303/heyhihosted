import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-error-handler';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';
import { fetchAndStoreRemoteMedia } from '@/lib/media/server-media-ingest';

const IngestSchema = z.object({
  sourceUrl: z.string().url(),
  kind: z.enum(['image', 'video']).optional(),
});

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const apiKey = resolvePollenKey(request);
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Pollinations API key' }, { status: 401 });
    }

    const body = await request.json();
    const { sourceUrl, kind } = IngestSchema.parse(body);

    const stored = await fetchAndStoreRemoteMedia({ sourceUrl, apiKey, kind, signal: request.signal });

    return NextResponse.json({
      key: stored.key,
      url: stored.url,
      contentType: stored.contentType,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
