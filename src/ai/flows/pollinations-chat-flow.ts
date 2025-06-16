
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
    throw new Error(`Invalid input: ${validationResult.error.issues.map(i => i.path + ': ' + i.message).join(', ')}`);
  }
  
  const { messages: historyMessages, modelId, systemPrompt } = validationResult.data;

  let apiMessagesToSend: {role: string; content: string}[] = [];

  if (systemPrompt && systemPrompt.trim() !== "") {
    apiMessagesToSend.push({ role: 'system', content: systemPrompt });
  }
  
  apiMessagesToSend = [...apiMessagesToSend, ...historyMessages];


  const payload: Record<string, any> = {
    model: modelId,
    messages: apiMessagesToSend,
    private: true, 
    temperature: 1.0, 
    stream: false, // Explicitly set stream to false
    // max_tokens: 500, // Removing max_tokens to align more strictly with provided POST endpoint docs
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
      console.error('Pollinations API Error (non-200 status):', response.status, errorData, 'Request Payload:', payload);
      throw new Error(
        `Pollinations API request failed with status ${response.status}: ${typeof errorData === 'string' ? errorData : JSON.stringify(errorData)}`
      );
    }

    const result = await response.json();
    let replyText = '';

    if (result.choices && Array.isArray(result.choices) && result.choices.length > 0) {
      const choice = result.choices[0];
      if (choice.message && typeof choice.message.content === 'string') {
        replyText = choice.message.content.trim();
      } else if (typeof choice.text === 'string') {
        replyText = choice.text.trim();
      }
    } else if (typeof result.reply === 'string') {
        replyText = result.reply.trim();
    } else if (typeof result.content === 'string') {
        replyText = result.content.trim();
    }

    if (replyText) {
      return { responseText: replyText };
    } else {
      console.error('Pollinations API - Successful response (200 OK), but unexpected JSON structure. Full response:', result, 'Request Payload:', payload);
      throw new Error('Pollinations API returned a 200 OK but with an unparseable JSON structure for the reply content.');
    }
  } catch (error) {
    console.error('Error calling Pollinations API or processing its response:', error, 'Request Payload:', payload);
    if (error instanceof Error) {
        throw new Error(`Failed to get completion from Pollinations API: ${error.message}`);
    }
    throw new Error('An unknown error occurred while contacting the Pollinations API.');
  }
}
