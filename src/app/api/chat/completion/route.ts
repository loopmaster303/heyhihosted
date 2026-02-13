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

    // === WEB CONTEXT (Light/Deep) ===
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

    const currentDate = new Date().toISOString().split('T')[0];
    const shouldFetchWebContext =
      !skipSmartRouter &&
      userQuery.trim().length > 3 &&
      (webBrowsingEnabled || SmartRouter.shouldRouteToSearch(userQuery));
    const webContextMode = webBrowsingEnabled ? 'deep' : 'light';

    const systemDateBlock = shouldFetchWebContext
      ? `Current Date: ${currentDate}.\nWEB CONTEXT MODE: ${webContextMode}. If <web_context> facts are provided, use them. If none are provided, do not invent live data; ask one clarifying question.`
      : `Current Date: ${currentDate}.\nIf asked for current/live information and no <web_context> facts are provided, do not invent; ask one clarifying question.`;

    let finalSystemPrompt = systemPrompt ? `${systemDateBlock}\n\n${systemPrompt}` : systemDateBlock;

    if (shouldFetchWebContext) {
      try {
        const webContext = await WebContextService.getContext(userQuery, webContextMode);
        if (webContext && webContext.facts.length > 0) {
          finalSystemPrompt = WebContextService.injectIntoSystemPrompt(finalSystemPrompt, webContext);
        }
      } catch (error) {
        console.warn('Failed to fetch web context:', error);
      }
    }

    // NOTE: We no longer route the main completion to search models.
    // Web context is injected (when enabled) and the user's selected model is used for generation.
    const sanitizedMessages = messages;

    // === EXECUTE GENERATION (BLOCKING) ===
    console.log('[API] Executing generateText (non-streaming)...');
    const result = await generateText({
      model: pollinations(modelId),
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
