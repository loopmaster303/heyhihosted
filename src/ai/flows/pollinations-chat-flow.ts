
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

const PollinationsApiChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

const PollinationsChatInputSchema = z.object({
  messages: z.array(PollinationsApiChatMessageSchema.extend({
    // Allow role to be 'user' or 'assistant' specifically for history, system prompt is separate
    role: z.enum(['user', 'assistant']), 
  })).min(1).describe('Array of historical message objects (role: user, assistant).'),
  modelId: z.string().describe('The Pollinations model ID to use (e.g., openai, mistral).'),
  systemPrompt: z.string().optional().describe('An optional system prompt to guide the AI.'),
});
export type PollinationsChatInput = z.infer<typeof PollinationsChatInputSchema>;

const PollinationsChatOutputSchema = z.object({
  responseText: z.string().describe('The AI-generated text response.'),
});
export type PollinationsChatOutput = z.infer<typeof PollinationsChatOutputSchema>;

const POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';

export async function getPollinationsChatCompletion(
  input: PollinationsChatInput
): Promise<PollinationsChatOutput> {
  const validationResult = PollinationsChatInputSchema.safeParse(input);
  if (!validationResult.success) {
    console.error("Invalid input to getPollinationsChatCompletion:", validationResult.error.issues);
    throw new Error(`Invalid input: ${validationResult.error.issues.map(i => i.path + ': ' + i.message).join(', ')}`);
  }
  
  const { messages: historyMessages, modelId, systemPrompt } = validationResult.data;

  let apiMessagesToSend: {role: string; content: string}[] = [];

  if (systemPrompt && systemPrompt.trim() !== "") {
    apiMessagesToSend.push({ role: 'system', content: systemPrompt });
  }
  
  // Add history messages (already filtered to be user/assistant by page.tsx)
  apiMessagesToSend = [...apiMessagesToSend, ...historyMessages];


  const payload: Record<string, any> = {
    model: modelId,
    messages: apiMessagesToSend,
    private: true, 
    temperature: 1.0, // From user example
    max_tokens: 500,  // From user example
    // referrer: "FluxFlowAI", // Optional: identify your app
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
      const errorBody = await response.text(); // Use text first to avoid JSON parse error if body isn't JSON
      let errorData;
      try {
        errorData = JSON.parse(errorBody);
      } catch (e) {
        errorData = errorBody; // Keep as text if not valid JSON
      }
      console.error('Pollinations API Error:', response.status, errorData);
      throw new Error(
        `Pollinations API request failed with status ${response.status}: ${typeof errorData === 'string' ? errorData : JSON.stringify(errorData)}`
      );
    }

    const result = await response.json();

    if (result.choices && result.choices.length > 0 && result.choices[0].message && result.choices[0].message.content) {
      return { responseText: result.choices[0].message.content.trim() };
    } else if (typeof result.reply === 'string') { // Fallback for other possible response structures
        return { responseText: result.reply.trim() };
    } else if (typeof result.content === 'string') { // Another fallback
        return { responseText: result.content.trim() };
    }
     else {
      console.error('Pollinations API - Unexpected response structure:', result);
      throw new Error('Pollinations API returned an unexpected response structure.');
    }
  } catch (error) {
    console.error('Error calling Pollinations API:', error);
    if (error instanceof Error) {
        throw new Error(`Failed to get completion from Pollinations API: ${error.message}`);
    }
    throw new Error('An unknown error occurred while contacting the Pollinations API.');
  }
}
