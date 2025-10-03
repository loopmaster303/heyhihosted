
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { handleApiError, validateRequest } from '@/lib/api-error-handler';

const TTSSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  voice: z.string().min(1, 'Voice is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request
    const { text, voice } = validateRequest(TTSSchema, body);

    const result = await textToSpeech(text, voice);
    return NextResponse.json(result);

  } catch (error) {
    return handleApiError(error);
  }
}
