import { z } from 'zod';
import { NextResponse } from 'next/server';
import { handleApiError, validateRequest, ApiError } from '@/lib/api-error-handler';
import { WebContextService } from '@/lib/services/web-context-service';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';
import { httpsPost, httpsPostStream } from '@/lib/https-post';
import { resolveChatSearchStrategy } from '@/lib/chat/chat-search-strategy';
import { isKnownPollinationsTextModelId } from '@/config/chat-options';

// Validation schema
const ChatCompletionSchema = z.object({
  messages: z.array(z.any()).min(1, 'At least one message is required'),
  modelId: z.string().min(1, 'Model ID is required'),
  systemPrompt: z.string().optional(),
  webBrowsingEnabled: z.boolean().optional(),
  skipSmartRouter: z.boolean().optional(),
  stream: z.boolean().optional(),
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

async function readStreamAsText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        result += decoder.decode(value, { stream: true });
      }
    }
    result += decoder.decode();
    return result;
  } finally {
    reader.releaseLock();
  }
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
    const { messages, modelId, systemPrompt, webBrowsingEnabled, skipSmartRouter, stream } = validateRequest(ChatCompletionSchema, body);
    if (!isKnownPollinationsTextModelId(modelId)) {
      throw new ApiError(400, `Unknown or unavailable Pollinations text model: ${modelId}`);
    }

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
    const smartRouterEnabled = !skipSmartRouter;
    const searchStrategy = resolveChatSearchStrategy({
      modelId,
      userQuery,
      smartRouterEnabled,
      webBrowsingEnabled: !!webBrowsingEnabled,
    });
    const { routedModelId, shouldFetchWebContext, webContextMode, strategy } = searchStrategy;
    if (!isKnownPollinationsTextModelId(routedModelId)) {
      throw new ApiError(400, `Unknown or unavailable Pollinations text model: ${routedModelId}`);
    }

    const systemDateBlock =
      strategy === 'delegated-live-search' || strategy === 'delegated-deep-research'
        ? `Current Date: ${currentDate}.\nThis request is routed to a live web model. Use current web information when needed. If the request is ambiguous, ask one clarifying question.`
        : shouldFetchWebContext
          ? `Current Date: ${currentDate}.\nWEB CONTEXT MODE: ${webContextMode}. If <web_context> facts are provided, use them. If none are provided, do not invent live data; ask one clarifying question.`
          : `Current Date: ${currentDate}.\nIf asked for current/live information and no <web_context> facts are provided, do not invent; ask one clarifying question.`;

    let finalSystemPrompt = systemPrompt ? `${systemDateBlock}\n\n${systemPrompt}` : systemDateBlock;

    if (shouldFetchWebContext) {
      try {
        const webContext = await WebContextService.getContext(userQuery, webContextMode, apiKey);
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

    // === CALL POLLINATIONS API via Node https helper ===
    // Next.js 16 can patch outbound fetch behavior; we use httpsPost for deterministic headers.
    
    console.log(
      `[API] Pollinations: model=${routedModelId}, original=${modelId}, strategy=${strategy}, webContext=${shouldFetchWebContext ? webContextMode : 'off'}, msgs=${apiMessages.length}`
    );

    const upstreamPayload = JSON.stringify({
      model: routedModelId,
      messages: apiMessages,
      max_tokens: DEFAULT_CHAT_MAX_TOKENS,
      ...(stream ? { stream: true } : {}),
    });

    const upstreamHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    if (stream) {
      const streamRequest =
        typeof httpsPostStream === 'function'
          ? httpsPostStream(
              POLLINATIONS_API_URL,
              upstreamHeaders,
              upstreamPayload,
            )
          : null;

      if (!streamRequest) {
        console.warn('[API] httpsPostStream unavailable in current runtime; falling back to buffered SSE proxy.');
        const fallbackResponse = await httpsPost(
          POLLINATIONS_API_URL,
          upstreamHeaders,
          upstreamPayload,
        );

        if (fallbackResponse.status !== 200) {
          let detail = fallbackResponse.body;
          try {
            const errorJson = JSON.parse(fallbackResponse.body);
            detail = errorJson.error?.message || errorJson.error || fallbackResponse.body;
          } catch { }
          console.error(`[API] Pollinations ${fallbackResponse.status}:`, detail);
          throw new ApiError(fallbackResponse.status, `Pollinations API error: ${detail}`);
        }

        return new Response(fallbackResponse.body, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
          },
        });
      }

      const pollinationsResponse = await streamRequest;

      if (pollinationsResponse.status !== 200) {
        const detail = await readStreamAsText(pollinationsResponse.stream);
        let normalizedDetail = detail;
        try {
          const errorJson = JSON.parse(detail);
          normalizedDetail = errorJson.error?.message || errorJson.error || detail;
        } catch { }
        console.error(`[API] Pollinations ${pollinationsResponse.status}:`, normalizedDetail);
        throw new ApiError(pollinationsResponse.status, `Pollinations API error: ${normalizedDetail}`);
      }

      return new Response(pollinationsResponse.stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    const pollinationsResponse = await httpsPost(
      POLLINATIONS_API_URL,
      upstreamHeaders,
      upstreamPayload,
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
