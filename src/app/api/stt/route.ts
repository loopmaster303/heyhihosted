import { NextResponse } from 'next/server';
import { speechToText } from '@/ai/flows/stt-flow';
import { handleApiError, apiErrors } from '@/lib/api-error-handler';
import { resolveSttLanguageHint } from '@/lib/chat/audio-settings';
import { checkRateLimit } from '@/lib/rate-limit';

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(request, { name: 'stt', limit: 15, windowMs: 60_000 });
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    // request.formData() buffers the whole payload before its size can be
    // checked, so reject oversized uploads via the declared length up front.
    const declaredLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_AUDIO_BYTES) {
      throw apiErrors.badRequest('Audio file too large (max 15MB)');
    }

    const formData = await request.formData();
    const audioFileRaw = formData.get('audioFile');
    const language = resolveSttLanguageHint(formData.get('language')?.toString());

    if (!audioFileRaw) {
      throw apiErrors.badRequest('Missing required field: audioFile');
    }
    if (!(audioFileRaw instanceof File)) {
      throw apiErrors.badRequest('audioFile must be a file');
    }
    const audioFile = audioFileRaw;
    if (!audioFile.type.startsWith('audio/')) {
      throw apiErrors.badRequest('audioFile must be an audio MIME type');
    }
    if (audioFile.size > MAX_AUDIO_BYTES) {
      throw apiErrors.badRequest('Audio file too large (max 15MB)');
    }

    const result = await speechToText(audioFile, language);
    return NextResponse.json(result);

  } catch (error) {
    return handleApiError(error);
  }
}
