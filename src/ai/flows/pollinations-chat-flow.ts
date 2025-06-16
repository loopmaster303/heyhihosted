
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
    // Construct a more detailed error message from Zod issues
    throw new Error(`Invalid input: ${validationResult.error.issues.map(i => i.path + ': ' + i.message).join(', ')}`);
  }
  
  const { messages: historyMessages, modelId, systemPrompt } = validationResult.data;

  // Prepare messages for the API: Prepend system prompt if provided
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
    private: true, // Keep requests private by default as per user's old example
    temperature: 1.0, // Default temperature
    stream: false, // Explicitly set stream to false
    // Note: max_tokens removed to align with POST endpoint docs (not in common params)
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
      // Attempt to parse error response from API if not OK
      const errorBody = await response.text(); // Get error as text first
      let errorData;
      try {
        errorData = JSON.parse(errorBody); // Try to parse it as JSON
      } catch (e) {
        errorData = errorBody; // If not JSON, use the raw text
      }
      console.error('Pollinations API Error (non-200 status):', response.status, errorData, 'Request Payload:', payload);
      throw new Error(
        `Pollinations API request failed with status ${response.status}: ${typeof errorData === 'string' ? errorData : JSON.stringify(errorData)}`
      );
    }

    const result = await response.json();
    let replyText = '';

    // Robustly attempt to extract reply from common structures
    if (result.choices && Array.isArray(result.choices) && result.choices.length > 0) {
      const choice = result.choices[0];
      if (choice && typeof choice === 'object') {
        if (choice.message && typeof choice.message === 'object' && choice.message.hasOwnProperty('content')) {
          if (typeof choice.message.content === 'string') {
            replyText = choice.message.content.trim();
          } else if (choice.message.content === null) {
            console.warn('Pollinations API: choices[0].message.content is null. No reply extracted from this path.');
          } else {
            console.warn(`Pollinations API: choices[0].message.content is not a string or null, it's a ${typeof choice.message.content}. No reply extracted from this path.`);
          }
        } else if (typeof choice.text === 'string') { // Fallback within choice object if message.content is not the source
          replyText = choice.text.trim();
          if (replyText) console.log("Extracted reply from choice.text");
        } else {
          console.warn('Pollinations API: choices[0] exists but lacks expected message.content or text structure.');
        }
      }
    }
    
    // Secondary fallbacks for less common, top-level structures if replyText is still empty
    if (!replyText && result && typeof result === 'object') {
        if (typeof result.reply === 'string') {
            replyText = result.reply.trim();
            if (replyText) console.log("Extracted reply from result.reply");
        } else if (typeof result.content === 'string') { // Check for top-level content
            replyText = result.content.trim();
            if (replyText) console.log("Extracted reply from result.content");
        }
    }

    if (replyText) {
      return { responseText: replyText };
    } else {
      // This is critical: log the exact response and payload when parsing fails.
      console.error('Pollinations API - Successful response (200 OK), but unexpected JSON structure or empty content. Full response:', JSON.stringify(result, null, 2), 'Request Payload:', JSON.stringify(payload, null, 2));
      throw new Error('Pollinations API returned a 200 OK but the reply content could not be extracted from the JSON structure.');
    }
  } catch (error) {
    // Log the payload in case of any error during fetch or processing
    console.error('Error calling Pollinations API or processing its response:', error, 'Request Payload:', payload);
    if (error instanceof Error) {
        // Re-throw the original error or a more specific one
        throw new Error(`Failed to get completion from Pollinations API: ${error.message}`);
    }
    // Fallback for non-Error objects
    throw new Error('An unknown error occurred while contacting the Pollinations API.');
  }
}
