
'use server';
/**
 * @fileOverview Interacts with the Pollinations AI API for chat completions.
 *
 * Exports:
 * - getPollinationsChatCompletion - Fetches a chat completion from Pollinations AI.
 * - PollinationsChatInput - Type definition for the input to getPollinationsChatCompletion.
 * - PollinationsChatOutput - Type definition for the output from getPollinationsChatCompletion.
 */

import { z } from 'zod';

// Internal Zod schema for input validation
const PollinationsApiChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

const PollinationsChatInputSchemaInternal = z.object({
  messages: z.array(PollinationsApiChatMessageSchema.extend({
    // Allow only user and assistant roles in the historical messages for the API call
    // System prompt is handled separately before sending to API
    role: z.enum(['user', 'assistant']),
  })).min(1).describe('Array of historical message objects (role: user, assistant).'),
  modelId: z.string().describe('The Pollinations model ID to use (e.g., openai, mistral).'),
  systemPrompt: z.string().optional().describe('An optional system prompt to guide the AI.'),
});

// Exported TypeScript type for input
export type PollinationsChatInput = z.infer<typeof PollinationsChatInputSchemaInternal>;

// Exported TypeScript type for output
export interface PollinationsChatOutput {
  responseText: string;
}

const POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';

export async function getPollinationsChatCompletion(
  input: PollinationsChatInput
): Promise<PollinationsChatOutput> {
  const validationResult = PollinationsChatInputSchemaInternal.safeParse(input);
  if (!validationResult.success) {
    console.error("Invalid input to getPollinationsChatCompletion:", validationResult.error.issues);
    const errorMessage = `Invalid input: ${validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`;
    throw new Error(errorMessage);
  }

  const { messages: historyMessages, modelId, systemPrompt } = validationResult.data;

  // Prepare messages for the API: Prepend system prompt if provided and it's not empty
  let apiMessagesToSend: {role: string; content: string}[] = [];

  if (systemPrompt && systemPrompt.trim() !== "") {
    apiMessagesToSend.push({ role: 'system', content: systemPrompt });
  }

  // Add historical messages (already validated to be 'user' or 'assistant')
  apiMessagesToSend = [...apiMessagesToSend, ...historyMessages];


  // Construct the payload for Pollinations API
  const payload: Record<string, any> = {
    model: modelId,
    messages: apiMessagesToSend,
    private: true, // Keep requests private as per earlier examples
    temperature: 1.0, // A common default, adjust if needed
    stream: false, // We are not handling streaming responses here
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (process.env.POLLINATIONS_API_TOKEN) {
    console.log('Using POLLINATIONS_API_TOKEN for authorization.');
    headers['Authorization'] = `Bearer ${process.env.POLLINATIONS_API_TOKEN}`;
  } else {
    console.warn('POLLINATIONS_API_TOKEN not set, API requests might be rate-limited or restricted.');
  }

  try {
    const response = await fetch(POLLINATIONS_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorBody);
      } catch (e) {
        errorData = errorBody;
      }
      console.error('Pollinations API Error (non-200 status):', response.status, errorData, 'Request Payload:', JSON.stringify(payload, null, 2));
      const detail = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
      throw new Error(
        `Pollinations API request failed with status ${response.status}: ${detail}`
      );
    }

    const result = await response.json();
    let replyText: string | null = null;

    // Robustly attempt to extract reply from common structures
    if (result.choices && Array.isArray(result.choices) && result.choices.length > 0) {
      const choice = result.choices[0];
      if (choice && typeof choice === 'object') {
        if (choice.message && typeof choice.message === 'object' && choice.message.hasOwnProperty('content')) {
          if (typeof choice.message.content === 'string') {
            replyText = choice.message.content; // No trim here yet, preserve original
          } else if (choice.message.content === null) {
            console.warn('Pollinations API: choices[0].message.content is null. Interpreting as empty reply.');
            replyText = ""; // Treat null content as an empty string reply
          } else {
            console.warn(`Pollinations API: choices[0].message.content is not a string or null, it's a ${typeof choice.message.content}. Path: choices[0].message.content`);
          }
        } else if (typeof choice.text === 'string') {
          replyText = choice.text; // No trim here yet
          console.log("Extracted reply from choice.text");
        } else {
          console.warn('Pollinations API: choices[0] exists but lacks expected message.content or text structure.');
        }
      } else {
        console.warn('Pollinations API: choices[0] is not a valid object or is missing.');
      }
    }

    // Secondary fallbacks for less common, top-level structures if replyText is still null
    if (replyText === null && result && typeof result === 'object') {
        if (typeof result.reply === 'string') {
            replyText = result.reply; // No trim here yet
            console.log("Extracted reply from result.reply");
        } else if (typeof result.content === 'string') {
            replyText = result.content; // No trim here yet
            console.log("Extracted reply from result.content");
        }
    }

    if (replyText !== null) { // A string was assigned (could be empty or just whitespace)
      const trimmedReply = replyText.trim();
      if (trimmedReply === "" && replyText !== "") { // It was only whitespace
         console.warn('Pollinations API: Successfully parsed response, content was only whitespace. Original content: "' + replyText + '". Request Payload:', JSON.stringify(payload, null, 2), 'Full API Response:', JSON.stringify(result, null, 2));
      } else if (trimmedReply === "") { // It was genuinely an empty string
         console.warn('Pollinations API: Successfully parsed response, but content is an empty string. Request Payload:', JSON.stringify(payload, null, 2), 'Full API Response:', JSON.stringify(result, null, 2));
      }
      return { responseText: trimmedReply }; // Return the trimmed reply
    } else {
      console.error('Pollinations API - Successful response (200 OK), but the reply content could not be extracted from the JSON structure. Full response:', JSON.stringify(result, null, 2), 'Request Payload:', JSON.stringify(payload, null, 2));
      throw new Error('Pollinations API returned a 200 OK but the reply content could not be extracted from the JSON structure.');
    }
  } catch (error) {
    console.error('Error calling Pollinations API or processing its response:', error, 'Request Payload (if available):', JSON.stringify(payload, null, 2));
    if (error instanceof Error && error.message.startsWith('Pollinations API request failed')) {
        throw error; // Re-throw the more specific error from non-200 status
    }
    if (error instanceof Error && error.message.startsWith('Pollinations API returned a 200 OK but the reply content could not be extracted')) {
        throw error; // Re-throw the specific error for unextractable content
    }
    if (error instanceof Error) {
        throw new Error(`Failed to get completion from Pollinations API: ${error.message}`);
    }
    throw new Error('An unknown error occurred while contacting the Pollinations API.');
  }
}
