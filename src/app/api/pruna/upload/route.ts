import { NextResponse } from 'next/server';
import { ApiError, handleApiError } from '@/lib/api-error-handler';
import { resolvePrunaKey } from '@/lib/resolve-pruna-key';
import { uploadPrunaFile } from '@/lib/pruna/client';
import { readBodyWithLimit } from '@/lib/upload/read-body-with-limit';

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const apiKey = resolvePrunaKey(request);
    if (!apiKey) throw new ApiError(503, 'A Pruna API key is required', 'MISSING_PRUNA_KEY');

    const contentType = request.headers.get('content-type')?.split(';')[0].trim() || '';
    if (!contentType.startsWith('image/') && !contentType.startsWith('video/')) {
      throw new ApiError(400, 'Only image or video uploads are supported', 'INVALID_MEDIA_TYPE');
    }

    const buffer = await readBodyWithLimit(request, MAX_UPLOAD_BYTES, 'Upload exceeds the 100 MB limit');
    if (buffer.length === 0) throw new ApiError(400, 'Upload body is empty', 'EMPTY_UPLOAD');

    const requestedName = new URL(request.url).searchParams.get('filename') || 'upload.bin';
    const filename = requestedName.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 180) || 'upload.bin';
    const url = await uploadPrunaFile(buffer, filename, apiKey);
    return NextResponse.json({ url });
  } catch (error) {
    return handleApiError(error);
  }
}
