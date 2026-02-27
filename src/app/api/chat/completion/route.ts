import { z } from 'zod';
import { NextResponse } from 'next/server';
import { handleApiError, validateRequest, ApiError } from '@/lib/api-error-handler';
import { WebContextService } from '@/lib/services/web-context-service';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';
import { httpsPost } from '@/lib/https-post';

// Validation schema
const ChatCompletionSchema = z.object({
  messages: z.array(z.any()).min(1, 'At least one message is required'),
  modelId: z.string().min(1, 'Model ID is required'),
  systemPrompt: z.string().optional(),
  webBrowsingEnabled: z.boolean().optional(),
  skipSmartRouter: z.boolean().optional(),
});

const POLLINATIONS_API_URL = 'https://gen.pollinations.ai/v1/chat/completions';
const DEFAULT_CHAT_MAX_TOKENS = 1200;

/**
 * Sanitize messages for the Pollinations OpenAI-compatible API.
 */
function sanitizeMessagesForApi(rawMessages: any[]): any[] {
  return rawMessages.map((msg: any) => {
    const role = msg.role;

    if (typeof msg.content === 'string') {
      return { role, content: msg.content };
    }

    if (Array.isArray(msg.content)) {
      const parts = msg.content.map((part: any) => {
        if (part.type === 'text') {
          return { type: 'text', text: part.text || '' };
        }
        if (part.type === 'image_url' && part.image_url?.url) {
          return {
            type: 'image_url',
            image_url: { url: part.image_url.remoteUrl || part.image_url.url }
          };
        }
        return { type: 'text', text: part.text || '' };
      });
      return { role, content: parts };
    }

    return { role, content: String(msg.content ?? '') };
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // BYOP: Resolve API key (user key from header → env var fallback)
    const apiKey = resolvePollenKey(request);
    if (!apiKey) {
      throw new ApiError(500, 'No Pollinations API key configured. Set POLLEN_API_KEY in .env.local or provide a BYOP key.');
    }

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
      userQuery.trim().length > 3;
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

    // Sanitize messages
    const sanitizedMessages = sanitizeMessagesForApi(messages);

    // Build final messages array with system prompt
    const apiMessages = [
      { role: 'system', content: finalSystemPrompt },
      ...sanitizedMessages,
    ];

    // === CALL POLLINATIONS API via curl child_process (bypasses Next.js fetch patching) ===
    // Next.js 16 completely intercepts outgoing http/https requests and strips Authorization headers.
    // Using execSync('curl ...') is the only reliable way to bypass this interception.
    
    console.log(`[API] Pollinations: model=${modelId}, msgs=${apiMessages.length}`);

    const pollinationsResponse = await httpsPost(
      POLLINATIONS_API_URL,
      {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      JSON.stringify({
        model: modelId,
        messages: apiMessages,
        max_tokens: DEFAULT_CHAT_MAX_TOKENS,
      })
    );

    if (pollinationsResponse.status !== 200) {
      let detail = pollinationsResponse.body;
      try {
        const errorJson = JSON.parse(pollinationsResponse.body);
        detail = errorJson.error?.message || errorJson.error || pollinationsResponse.body;
      } catch { }
      console.error(`[API] Pollinations ${pollinationsResponse.status}:`, detail);
      throw new ApiError(pollinationsResponse.status, `Pollinations API error: ${detail}`);
    }

    const result = JSON.parse(pollinationsResponse.body);
    const responseText = result.choices?.[0]?.message?.content || '';

    console.log('[API] Generation complete. Length:', responseText.length);

    return NextResponse.json({
      choices: [
        {
          message: {
            content: responseText,
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
