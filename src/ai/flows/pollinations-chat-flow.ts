
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
});

export type PollinationsChatInput = z.infer<typeof PollinationsChatInputSchemaInternal>;

export interface PollinationsChatOutput {
  responseText: string;
}

const POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';
const API_TOKEN = process.env.POLLINATIONS_API_TOKEN;

let tokenWarningLogged = false;
if (!API_TOKEN && !tokenWarningLogged) {
    console.warn('\nPOLLINATIONS_API_TOKEN is not set in your .env file. ' +
                 'Certain models may not be available or requests might be rate-limited.\n' +
                 'Please create a .env file and add POLLINATIONS_API_TOKEN=YOUR_REAL_TOKEN.\n' +
                 'Make sure to restart your development server after updating the .env file.\n');
    tokenWarningLogged = true;
}

/**
 * Main function to get a chat completion from Pollinations.
 * Handles multimodal inputs (text and images).
 */
export async function getPollinationsChatCompletion(
  input: PollinationsChatInput
): Promise<PollinationsChatOutput> {
  const { messages: historyMessages, modelId, systemPrompt } = input;

  // 1. Construct the final payload for the API
  const payload: Record<string, any> = {
    model: modelId,
    messages: historyMessages, // Directly use the history messages
  };

  // Add system prompt as a top-level parameter if it exists and is not empty
  // This is more compatible across different Pollinations models than using role: 'system'
  if (systemPrompt && systemPrompt.trim() !== "") {
    payload.system = systemPrompt;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
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

    const result = JSON.parse(responseText);

    if (result.error) {
      const detail = typeof result.error === 'string'
          ? result.error
          : result.error.message || JSON.stringify(result.error);
      throw new Error(`Pollinations API returned an error: ${detail}`);
    }

    // 3. Extract the response text from the API result
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
