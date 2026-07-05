import { NextResponse } from 'next/server';
import { speechToText } from '@/ai/flows/stt-flow';
import { handleApiError, apiErrors } from '@/lib/api-error-handler';
import { resolveSttLanguageHint } from '@/lib/chat/audio-settings';

export async function POST(request: Request) {
  try {
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

    const result = await speechToText(audioFile, language);
    return NextResponse.json(result);

  } catch (error) {
    return handleApiError(error);
  }
}
