
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { handleApiError, validateRequest } from '@/lib/api-error-handler';
import { DEFAULT_TTS_SPEED, isSupportedTtsSpeed } from '@/lib/chat/audio-settings';

const TTSSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  voice: z.string().min(1, 'Voice is required'),
  speed: z.number().optional().refine(
    (value) => value === undefined || isSupportedTtsSpeed(value),
    'Unsupported TTS speed',
  ),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request
    const { text, voice, speed } = validateRequest(TTSSchema, body);

    const result = await textToSpeech(text, voice, speed ?? DEFAULT_TTS_SPEED);
    return NextResponse.json(result);

  } catch (error) {
    return handleApiError(error);
  }
}
