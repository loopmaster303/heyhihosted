/**
 * Auslieferung eines fertigen Pruna-Ergebnisses.
 *
 * Zwei Routen brauchen exakt dieselbe Antwort: `/api/generate`, wenn Pruna
 * sofort fertig war, und `/api/pruna/status`, wenn der Browser einen langen
 * Lauf zu Ende gepollt hat. Die Form der Antwort ist Teil des Vertrags mit dem
 * Client — JSON mit `imageUrl`/`videoUrl`, oder rohe Medien ohne Pollen-Token.
 */

import { NextResponse } from 'next/server';
import { ApiError } from '@/lib/api-error-handler';
import { downloadPrunaResult, type PrunaPredictionResult } from '@/lib/pruna/client';
import { MEDIA_UPLOAD_URL } from '@/lib/upload/constants';

export async function deliverPrunaResult(options: {
  result: PrunaPredictionResult;
  prunaApiKey: string;
  pollenKey?: string;
  isVideo: boolean;
  signal?: AbortSignal;
}): Promise<Response> {
  const { result, prunaApiKey, pollenKey, isVideo, signal } = options;

  const downloaded = await downloadPrunaResult(result.generationUrl, prunaApiKey, signal);

  if (!pollenKey) {
    return new Response(new Uint8Array(downloaded.buffer), {
      status: 200,
      headers: {
        'Content-Type': downloaded.contentType,
        'Cache-Control': 'no-store',
        'X-HeyHi-Media-Kind': isVideo ? 'video' : 'image',
      },
    });
  }

  // Pollinations Media Storage requires multipart/form-data (field `file`);
  // a raw binary body is rejected with "Unsupported content type".
  const uploadForm = new FormData();
  const prunaFileName = isVideo ? `pruna-${Date.now()}.mp4` : `pruna-${Date.now()}.png`;
  uploadForm.append('file', new Blob([downloaded.buffer], { type: downloaded.contentType }), prunaFileName);

  const uploadResponse = await fetch(MEDIA_UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pollenKey}` },
    body: uploadForm,
    signal,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text().catch(() => 'Unknown error');
    console.error('[generate] Media upload failed:', uploadResponse.status, errorText);
    throw new ApiError(
      uploadResponse.status >= 500 ? 502 : 400,
      `Media upload failed (${uploadResponse.status})`,
      'MEDIA_UPLOAD_ERROR',
    );
  }

  const uploadData = await uploadResponse.json();
  if (!uploadData?.url) {
    throw new ApiError(502, 'Media upload succeeded but returned no URL', 'MEDIA_UPLOAD_MISSING_URL');
  }

  return NextResponse.json({
    imageUrl: isVideo ? undefined : uploadData.url,
    videoUrl: isVideo ? uploadData.url : undefined,
  });
}
