import { generateText, Message } from 'ai';
import { createPollinations } from 'ai-sdk-pollinations';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { handleApiError, validateRequest, ApiError } from '@/lib/api-error-handler';
import { SmartRouter } from '@/lib/services/smart-router';
import { WebContextService } from '@/lib/services/web-context-service';

// Initialize Pollinations Provider with API Key
const pollinations = createPollinations({
  apiKey: process.env.POLLEN_API_KEY,
});

// Validation schema
const ChatCompletionSchema = z.object({
  messages: z.array(z.any()).min(1, 'At least one message is required'),
  modelId: z.string().min(1, 'Model ID is required'),
  systemPrompt: z.string().optional(),
  webBrowsingEnabled: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request
    const { messages, modelId, systemPrompt, webBrowsingEnabled } = validateRequest(ChatCompletionSchema, body);

    // === SMART ROUTING & DEEP RESEARCH ===
    let routedModelId = modelId;
    let isSearchRouted = false;

    const lastMessage = messages[messages.length - 1];
    let userQuery = '';
    if (typeof lastMessage?.content === 'string') {
      userQuery = lastMessage.content;
    } else if (Array.isArray(lastMessage?.content)) {
      userQuery = lastMessage.content
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join(' ');
    }

    if (webBrowsingEnabled) {
      console.log('🔍 Deep Research Mode Activated (NomNom)');
      routedModelId = 'nomnom';
      isSearchRouted = true;
    } else {
      if (SmartRouter.shouldRouteToSearch(userQuery)) {
        console.log(`⚡️ Smart Router: Live Data Triggered (Sona) for query "${userQuery.substring(0, 50)}"...`);
        routedModelId = SmartRouter.getLiveSearchModel();
        isSearchRouted = true;
      }
    }

    const currentDate = new Date().toISOString().split('T')[0];
    let systemDateBlock: string;
    if (isSearchRouted) {
      systemDateBlock = `Current Date: ${currentDate}.\nYOU ARE IN LIVE DATA MODE. Use browsing capabilities confidently.`;
    } else {
      systemDateBlock = `Current Date: ${currentDate}.\nYou have access to real-time information.`;
    }

    let finalSystemPrompt = systemPrompt ? `${systemDateBlock}\n\n${systemPrompt}` : systemDateBlock;

    if (!isSearchRouted && userQuery.trim().length > 3) {
      try {
        const webContext = await WebContextService.getContext(userQuery, 'light');
        if (webContext && webContext.facts.length > 0) {
          finalSystemPrompt = WebContextService.injectIntoSystemPrompt(finalSystemPrompt, webContext);
        }
      } catch (error) {
        console.warn('Failed to fetch web context:', error);
      }
    }

    // === EXECUTE GENERATION (BLOCKING) ===
    console.log('[API] Executing generateText (non-streaming)...');
    const result = await generateText({
      model: pollinations(routedModelId),
      messages: messages as Message[],
      system: finalSystemPrompt,
    });

    console.log('[API] Generation complete. Length:', result.text.length);

    return NextResponse.json({
        choices: [
            {
                message: {
                    content: result.text,
                    role: 'assistant'
                }
            }
        ]
    });

  } catch (error) {
    console.error('API Route Error:', error);
    return handleApiError(error);
  }
}
