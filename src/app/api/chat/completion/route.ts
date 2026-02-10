import { generateText } from 'ai';
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
  skipSmartRouter: z.boolean().optional(),
});

/**
 * Perplexity models require strict user↔assistant alternation.
 * This merges consecutive same-role messages and ensures the
 * history starts with a user message.
 */
function ensureMessageAlternation(messages: any[]): any[] {
  const cleaned: any[] = [];

  for (const msg of messages) {
    const last = cleaned[cleaned.length - 1];

    if (last && last.role === msg.role) {
      // Merge consecutive same-role messages
      const lastContent = typeof last.content === 'string' ? last.content : JSON.stringify(last.content);
      const msgContent = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      last.content = `${lastContent}\n\n${msgContent}`;
    } else {
      cleaned.push({ ...msg });
    }
  }

  // Perplexity requires first non-system message to be 'user'
  if (cleaned.length > 0 && cleaned[0].role !== 'user') {
    cleaned.unshift({ role: 'user', content: '(Continue)' });
  }

  // Ensure last message is 'user' (required for completion)
  if (cleaned.length > 0 && cleaned[cleaned.length - 1].role !== 'user') {
    cleaned.push({ role: 'user', content: '(Continue)' });
  }

  return cleaned;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request
    const { messages, modelId, systemPrompt, webBrowsingEnabled, skipSmartRouter } = validateRequest(ChatCompletionSchema, body);

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
    } else if (!skipSmartRouter) {
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

    // === MESSAGE SANITIZATION FOR PERPLEXITY MODELS ===
    const isPerplexityModel = routedModelId.includes('perplexity') || routedModelId === 'nomnom';
    const sanitizedMessages = isPerplexityModel
      ? ensureMessageAlternation(messages)
      : messages;

    if (isPerplexityModel && sanitizedMessages.length !== messages.length) {
      console.log(`🔧 Message alternation fixed: ${messages.length} → ${sanitizedMessages.length} messages`);
    }

    // === EXECUTE GENERATION (BLOCKING) ===
    console.log('[API] Executing generateText (non-streaming)...');
    const result = await generateText({
      model: pollinations(routedModelId),
      messages: sanitizedMessages as any,
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
