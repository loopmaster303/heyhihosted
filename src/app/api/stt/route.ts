import { NextResponse } from 'next/server';
import { speechToText } from '@/ai/flows/stt-flow';
import { handleApiError, apiErrors } from '@/lib/api-error-handler';
import { resolveSttLanguageHint } from '@/lib/chat/audio-settings';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audioFile') as File | null;
    const language = resolveSttLanguageHint(formData.get('language')?.toString());

    if (!audioFile) {
      throw apiErrors.badRequest('Missing required field: audioFile');
    }

    const result = await speechToText(audioFile, language);
    return NextResponse.json(result);

  } catch (error) {
    return handleApiError(error);
  }
}
