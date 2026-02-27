
'use server';
/**
 * @fileOverview Interacts with the Pollinations AI API for chat completions.
 * Supports text and multimodal inputs (text part of image uploads).
 *
 * Exports:
 * - getPollinationsChatCompletion - Fetches a chat completion from Pollinations AI.
 * - PollinationsChatInput - Type definition for the input to getPollinationsChatCompletion.
 * - PollinationsChatOutput - Type definition for the output from getPollinationsChatCompletion.
 */

import { z } from 'zod';
import { httpsPost } from '@/lib/https-post';

// This schema defines a single message part, which can be text or an image URL.
const ApiContentPartSchema = z.union([
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({ 
    type: z.literal('image_url'), 
    image_url: z.object({ url: z.string() }).passthrough() 
  })
]);

// This schema defines a single message in the conversation.
// NOTE: We only expect 'user' and 'assistant' roles from our ChatProvider history.
// The 'system' role is handled separately as a top-level parameter for broad compatibility.
const PollinationsApiChatMessageSchemaInternal = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.union([z.string(), z.array(ApiContentPartSchema)]),
});

// This is the schema for the entire input to our main function.
const PollinationsChatInputSchemaInternal = z.object({
  messages: z.array(PollinationsApiChatMessageSchemaInternal).min(1).describe('Array of message objects.'),
  modelId: z.string().describe('The Pollinations model ID to use (e.g., openai, mistral).'),
  systemPrompt: z.string().optional().describe('An optional system prompt to guide the AI.'),
  // New field to pass the token securely
  apiKey: z.string().optional().describe('The API key for authentication.'),
  maxCompletionTokens: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Optional cap for completion tokens (Azure models expect max_completion_tokens).'),
});

export type PollinationsChatInput = z.infer<typeof PollinationsChatInputSchemaInternal>;

export interface PollinationsChatOutput {
  responseText: string;
}

const POLLEN_CHAT_API_URL = 'https://gen.pollinations.ai/v1/chat/completions';
const LEGACY_POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';
const LEGACY_FALLBACK_MODELS = new Set(['openai-large', 'openai-reasoning', 'gemini-search']);
const DEFAULT_CHAT_MAX_TOKENS = 1200;

/**
 * Main function to get a chat completion from Pollinations.
 * Handles multimodal inputs (text and images).
 */
export async function getPollinationsChatCompletion(
  input: PollinationsChatInput
): Promise<PollinationsChatOutput> {
  const { messages: historyMessages, modelId, systemPrompt, apiKey, maxCompletionTokens } = input;

  const pollenApiKey = apiKey || process.env.POLLEN_API_KEY;
  const legacyApiKey = process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_API_TOKEN;
  const allowLegacyFallback = LEGACY_FALLBACK_MODELS.has(modelId);

  if (!pollenApiKey && !(allowLegacyFallback && legacyApiKey)) {
    console.warn('getPollinationsChatCompletion called without POLLEN_API_KEY; falling back may fail.');
  }

  // 1. Construct the final payload for the API
  const payload: Record<string, any> = {
    model: modelId,
    messages: historyMessages, // Directly use the history messages
  };

  payload.max_tokens = typeof maxCompletionTokens === 'number'
    ? maxCompletionTokens
    : DEFAULT_CHAT_MAX_TOKENS;

  // Add system prompt as a top-level parameter if it exists and is not empty
  // This is more compatible across different Pollinations models than using role: 'system'
  if (systemPrompt && systemPrompt.trim() !== "") {
    payload.messages = [{ role: 'system', content: systemPrompt.trim() }, ...historyMessages];
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const mapModelForLegacy = (model: string) => {
    if (model === 'openai-large') return 'openai';
    if (model === 'openai-reasoning') return 'openai';
    if (model === 'gemini-search') return 'gemini';
    return model;
  };

  type EndpointTarget = { name: 'pollen' | 'legacy'; url: string; apiKey?: string };
  const targets: EndpointTarget[] = [];
  if (pollenApiKey) targets.push({ name: 'pollen', url: POLLEN_CHAT_API_URL, apiKey: pollenApiKey });
  if (allowLegacyFallback && legacyApiKey) targets.push({ name: 'legacy', url: LEGACY_POLLINATIONS_API_URL, apiKey: legacyApiKey });

  let lastError: Error | null = null;

  for (const target of targets) {
    try {
      if (!target.apiKey) {
        throw new Error(`Missing API key for target ${target.name}`);
      }

      // Use rawFetch to bypass Next.js 16 patched fetch
      headers['Authorization'] = `Bearer ${target.apiKey}`;

      const payloadForTarget = {
        ...payload,
        model: target.name === 'legacy' ? mapModelForLegacy(payload.model) : payload.model,
      };

      // Use httpsPost (Node.js https module) to bypass Next.js fetch patching
      const httpResp = await httpsPost(
        target.url,
        headers,
        JSON.stringify(payloadForTarget)
      );

      const responseText = httpResp.body;
      const responseStatus = httpResp.status;

      if (responseStatus < 200 || responseStatus >= 300) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = responseText;
        }
        const detail = typeof errorData === 'string'
          ? errorData
          : errorData.error?.message || JSON.stringify(errorData);

        // Check if this is a content filter error (Azure OpenAI content management policy)
        let isContentFilterError = false;
        if (responseStatus === 400) {
          const errorMessage = typeof errorData === 'string'
            ? errorData
            : errorData?.error?.message || errorData?.message || '';
          isContentFilterError = errorMessage.toLowerCase().includes('content management policy') ||
            errorMessage.toLowerCase().includes('content filtering') ||
            errorMessage.toLowerCase().includes('content filter');
        }

        // IMPORTANT: Do NOT silently fall back to expensive Anthropic models on content-filter errors.
        // Bubble the error up so the user can adjust the prompt or choose a different model explicitly.

        const error = new Error(`Pollinations (${target.name}) request failed with status ${responseStatus}: ${detail}`);

        // Only attempt legacy fallback if pollen returns 5xx; for 4xx bubble up immediately.
        if (target.name === 'pollen' && responseStatus >= 500) {
          console.warn(`[getPollinationsChatCompletion] Pollen API returned 5xx (${responseStatus}), attempting legacy fallback...`);
          lastError = error;
          continue;
        }

        if (responseStatus < 500) {
          console.error(`[getPollinationsChatCompletion] ${target.name} API returned 4xx (${responseStatus}):`, detail);
        } else {
          console.error(`[getPollinationsChatCompletion] ${target.name} API returned 5xx (${responseStatus}):`, detail);
        }
        throw error;
      }

      // 3. Try to parse as JSON, but fall back to plain text if that fails.
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        // If parsing fails, the response is likely plain text. Use it directly.
        return { responseText: responseText.trim() };
      }


      if (result.error) {
        const detail = typeof result.error === 'string'
          ? result.error
          : result.error.message || JSON.stringify(result.error);
        throw new Error(`Pollinations (${target.name}) returned an error: ${detail}`);
      }

      // 4. Extract the response text from the parsed JSON result
      let replyText: string | null = null;
      if (result.choices && Array.isArray(result.choices) && result.choices.length > 0) {
        const choice = result.choices[0];
        if (choice.message && typeof choice.message.content === 'string') {
          replyText = choice.message.content;
        }
      }

      if (replyText !== null) {
        return { responseText: replyText.trim() };
      } else {
        console.error(`[getPollinationsChatCompletion] ${target.name} API - Unexpected response structure:`, JSON.stringify(result, null, 2));
        throw new Error(`Pollinations (${target.name}) API returned a 200 OK but the reply content could not be extracted.`);
      }
    } catch (error) {
      // If this is a 4xx error that was thrown, don't catch it - let it bubble up
      if (error instanceof Error && error.message.includes('4xx')) {
        throw error;
      }
      lastError = error instanceof Error ? error : new Error(String(error));
      // Try next target if available
    }
  }

  if (lastError) {
    console.error('[getPollinationsChatCompletion] All targets failed, throwing last error:', lastError.message);
    throw lastError;
  }

  throw new Error('No chat backend available for Pollinations.');
}
