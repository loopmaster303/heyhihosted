
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, validateRequest, ApiError, requireEnv } from '@/lib/api-error-handler';
import { WebContextService } from '@/lib/services/web-context-service';
import { AVAILABLE_POLLINATIONS_MODELS } from '@/config/chat-options';

const POLLEN_CHAT_API_URL = 'https://enter.pollinations.ai/api/generate/v1/chat/completions';
const LEGACY_POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';
const LEGACY_FALLBACK_MODELS = new Set(['openai-large', 'openai-reasoning', 'gemini-search']);

// Validation schema
const ChatCompletionSchema = z.object({
  messages: z.array(z.any()).min(1, 'At least one message is required'),
  modelId: z.string().min(1, 'Model ID is required'),
  systemPrompt: z.string().optional(),
  webBrowsingEnabled: z.boolean().optional(),
  stream: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request
    const { messages, modelId, systemPrompt, webBrowsingEnabled, stream } = validateRequest(ChatCompletionSchema, body);

    // Always use the user's chosen model
    const effectiveModelId = modelId;

    // === ALWAYS-ON WEB CONTEXT ===
    // Fetch web context in parallel (Light mode by default, Deep if toggle enabled)
    const lastUserMessage = messages[messages.length - 1];
    const userQuery = typeof lastUserMessage?.content === 'string'
      ? lastUserMessage.content
      : '';

    // Fetch context (will timeout gracefully)
    const webContextMode = webBrowsingEnabled ? 'deep' : 'light';
    let webContext = await WebContextService.getContext(userQuery, webContextMode);

    // Messages remain unchanged
    let enhancedMessages = messages;
    const streamEnabled = Boolean(stream) && effectiveModelId !== "gpt-oss-120b";

    // Handle GPT-OSS-120b model with Replicate API
    if (effectiveModelId === "gpt-oss-120b") {


      const REPLICATE_API_TOKEN = requireEnv('REPLICATE_API_TOKEN');

      const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "openai/gpt-oss-120b",
          input: {
            prompt: enhancedMessages.map((m: any) => `${m.role}: ${m.content}`).join('\n'),
            system_prompt: systemPrompt || "",
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 1000,
            reasoning: "medium" // Default reasoning level
          }
        })
      });

      if (!replicateResponse.ok) {
        const errorText = await replicateResponse.text();
        console.error("Replicate API error:", errorText);
        throw new ApiError(
          502,
          `Replicate API error: ${replicateResponse.status}`,
          'REPLICATE_API_ERROR'
        );
      }

      const replicateData = await replicateResponse.json();

      // Poll for completion
      let result = null;
      let attempts = 0;
      const maxAttempts = 30;

      while (!result && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const statusResponse = await fetch(replicateData.urls.get, {
          headers: {
            "Authorization": `Token ${REPLICATE_API_TOKEN}`,
          }
        });

        const statusData = await statusResponse.json();

        if (statusData.status === "succeeded") {
          result = statusData.output;
        } else if (statusData.status === "failed") {
          throw new ApiError(500, "Replicate prediction failed", 'PREDICTION_FAILED');
        }

        attempts++;
      }

      if (!result) {
        throw new ApiError(504, "Replicate prediction timed out", 'PREDICTION_TIMEOUT');
      }

      // Log result for debugging


      // Clean up response text
      let cleanedResult = Array.isArray(result) ? result.join('\n') : result;

      // Remove excessive whitespace and normalize line breaks
      cleanedResult = cleanedResult
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove multiple consecutive empty lines
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim(); // Remove leading/trailing whitespace

      return NextResponse.json({
        choices: [{
          message: {
            content: cleanedResult,
            role: "assistant"
          }
        }],
        model: "gpt-oss-120b"
      });
    }

    const pollenApiKey = process.env.POLLEN_API_KEY;
    const legacyApiKey = process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_API_TOKEN;

    if (!pollenApiKey && !legacyApiKey) {
      throw new ApiError(500, 'Server configuration error: POLLEN_API_KEY is not set', 'MISSING_ENV_VAR');
    }

    const payload: Record<string, any> = {
      model: effectiveModelId,
      messages: enhancedMessages, // Use enhanced messages with search results
    };

    if (systemPrompt && systemPrompt.trim() !== "") {
      // Inject web context into existing system prompt (additive)
      const enhancedSystemPrompt = WebContextService.injectIntoSystemPrompt(
        systemPrompt.trim(),
        webContext
      );
      payload.messages = [{ role: 'system', content: enhancedSystemPrompt }, ...enhancedMessages];
    } else if (webContext.facts.length > 0) {
      // No system prompt but we have web context - add it as system message
      const webContextBlock = WebContextService.buildContextBlock(webContext);
      payload.messages = [{ role: 'system', content: webContextBlock }, ...enhancedMessages];
    }

    if (streamEnabled) {
      payload.stream = true;
    }

    let lastError: Error | null = null;

    const mapModelForLegacy = (model: string) => {
      if (model === 'openai-large') return 'openai';
      if (model === 'openai-reasoning') return 'openai';
      if (model === 'gemini-search') return 'gemini';
      return model;
    };

    type EndpointTarget = {
      name: 'pollen' | 'legacy';
      url: string;
      apiKey: string;
      modelId: string;
    };

    const availableModelIds = new Set(AVAILABLE_POLLINATIONS_MODELS.map(model => model.id));
    const googleModelIds = ['gemini', 'gemini-fast', 'gemini-large', 'gemini-search']
      .filter(modelId => availableModelIds.has(modelId));
    const fallbackOrder = ['deepseek', 'glm', ...googleModelIds];
    const modelCandidates = [effectiveModelId, ...fallbackOrder].filter((modelId, index, list) => (
      modelId && list.indexOf(modelId) === index
    ));
    const filteredCandidates = modelCandidates.filter(modelId => (
      modelId === effectiveModelId || availableModelIds.has(modelId)
    ));

    const shouldFallbackForResponse = (status: number, detail: string) => {
      if (status >= 500) return true;
      if (status === 404 || status === 429) return true;
      if (status === 400) {
        const lowered = detail.toLowerCase();
        return lowered.includes('model') || lowered.includes('not found') || lowered.includes('unknown model');
      }
      return false;
    };

    for (const modelId of filteredCandidates) {
      const targets: EndpointTarget[] = [];
      if (pollenApiKey) {
        targets.push({ name: 'pollen', url: POLLEN_CHAT_API_URL, apiKey: pollenApiKey, modelId });
      }
      if (legacyApiKey && LEGACY_FALLBACK_MODELS.has(modelId)) {
        targets.push({
          name: 'legacy',
          url: LEGACY_POLLINATIONS_API_URL,
          apiKey: legacyApiKey,
          modelId: mapModelForLegacy(modelId),
        });
      }

      if (targets.length === 0) {
        continue;
      }

      for (const target of targets) {
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${target.apiKey}`,
          };

          if (streamEnabled) {
            headers['Accept'] = 'text/event-stream';
          }

          const payloadForTarget = {
            ...payload,
            model: target.modelId,
          };

          const response = await fetch(target.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payloadForTarget),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Chat API (${target.name}) error (${response.status}):`, errorText);
            const detail = errorText || 'Unknown error';

            const apiError = new ApiError(
              response.status,
              `Chat API (${target.name}) returned status ${response.status}: ${detail}`,
              `${target.name.toUpperCase()}_CHAT_API_ERROR`
            );

            if (shouldFallbackForResponse(response.status, detail)) {
              lastError = apiError;
              continue;
            }

            throw apiError;
          }

          if (streamEnabled) {
            const bodyStream = response.body;
            if (!bodyStream) {
              throw new ApiError(502, `Chat API (${target.name}) stream did not return a body`, `${target.name.toUpperCase()}_CHAT_STREAM_ERROR`);
            }
            return new Response(bodyStream, {
              status: 200,
              headers: {
                'Content-Type': response.headers.get('content-type') ?? 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
              },
            });
          }

          const result = await response.json();
          return NextResponse.json(result);
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }
    }

    if (lastError) {
      throw lastError;
    }

    throw new ApiError(503, 'No chat backend available', 'CHAT_BACKEND_UNAVAILABLE');

  } catch (error) {
    return handleApiError(error);
  }
}
