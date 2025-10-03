
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateChatTitle, type GenerateChatTitleInput } from '@/ai/flows/generate-chat-title';
import { handleApiError, validateRequest } from '@/lib/api-error-handler';

const GenerateTitleSchema = z.object({
  messages: z.string().min(1, 'Messages cannot be empty'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedBody = validateRequest(GenerateTitleSchema, body);

    const result = await generateChatTitle(validatedBody);
    return NextResponse.json(result);

  } catch (error) {
    return handleApiError(error);
  }
}
