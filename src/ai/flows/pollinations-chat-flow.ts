
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

// This schema defines a single message part, which can be text or an image URL.
const ApiContentPartSchema = z.union([
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({ type: z.literal('image_url'), image_url: z.object({ url: z.string() }) })
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

const POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';

/**
 * Main function to get a chat completion from Pollinations.
 * Handles multimodal inputs (text and images).
 */
export async function getPollinationsChatCompletion(
  input: PollinationsChatInput
): Promise<PollinationsChatOutput> {
  const { messages: historyMessages, modelId, systemPrompt, apiKey, maxCompletionTokens } = input;
  
  if (!apiKey) {
      console.warn('getPollinationsChatCompletion called without an apiKey. Requests may fail or be rate-limited.');
  }

  // 1. Construct the final payload for the API
  const payload: Record<string, any> = {
    model: modelId,
    messages: historyMessages, // Directly use the history messages
  };

  if (typeof maxCompletionTokens === 'number') {
    payload.max_completion_tokens = maxCompletionTokens;
  }

  // Add system prompt as a top-level parameter if it exists and is not empty
  // This is more compatible across different Pollinations models than using role: 'system'
  if (systemPrompt && systemPrompt.trim() !== "") {
    payload.system = systemPrompt;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  // 2. Make the API call
  try {
    const response = await fetch(POLLINATIONS_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = responseText;
      }
      const detail = typeof errorData === 'string'
          ? errorData
          : errorData.error?.message || JSON.stringify(errorData);

      // Pass the specific error message from the API back to the caller
      throw new Error(`Pollinations API request failed with status ${response.status}: ${detail}`);
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
      throw new Error(`Pollinations API returned an error: ${detail}`);
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
      console.error('Pollinations API - Unexpected response structure:', JSON.stringify(result, null, 2));
      throw new Error('Pollinations API returned a 200 OK but the reply content could not be extracted.');
    }
  } catch (error) {
    if (error instanceof Error) {
        // Re-throw the original error, which now contains specific API details
        throw error;
    }
    throw new Error('An unknown error occurred while contacting the Pollinations API.');
  }
}
