
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
// import type { ChatMessage } from '@/types'; // Not directly used in this simplified version for API call

const PollinationsApiChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

// Define the Zod schema for input, but do not export it directly
const PollinationsChatInputSchema = z.object({
  messages: z.array(PollinationsApiChatMessageSchema).min(1).describe('Array of message objects (role: system, user, assistant).'),
  modelId: z.string().describe('The Pollinations model ID to use (e.g., openai, mistral).'),
  systemPrompt: z.string().optional().describe('An optional system prompt to guide the AI.'),
  // Add other parameters like temperature, seed if needed in the future
  // temperature: z.number().min(0.0).max(3.0).optional(),
  // seed: z.number().optional(),
});
export type PollinationsChatInput = z.infer<typeof PollinationsChatInputSchema>;

// Define the Zod schema for output, but do not export it directly
const PollinationsChatOutputSchema = z.object({
  responseText: z.string().describe('The AI-generated text response.'),
});
export type PollinationsChatOutput = z.infer<typeof PollinationsChatOutputSchema>;

const POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';

export async function getPollinationsChatCompletion(
  input: PollinationsChatInput
): Promise<PollinationsChatOutput> {
  // Validate input with Zod schema (optional, good practice for server actions)
  const validationResult = PollinationsChatInputSchema.safeParse(input);
  if (!validationResult.success) {
    console.error("Invalid input to getPollinationsChatCompletion:", validationResult.error.issues);
    throw new Error(`Invalid input: ${validationResult.error.issues.map(i => i.path + ': ' + i.message).join(', ')}`);
  }
  
  const { messages, modelId, systemPrompt } = validationResult.data;

  const apiMessages = [];

  // Pollinations API expects system prompt as the first message if provided.
  // The 'systemPrompt' parameter now takes precedence.
  if (systemPrompt && systemPrompt.trim() !== "") {
    apiMessages.push({ role: 'system', content: systemPrompt });
  }

  // Add the rest of the messages, ensuring not to duplicate system prompt if it was already handled.
  messages.forEach(msg => {
    // If a specific systemPrompt is provided (and pushed above), skip any 'system' roles from 'messages'.
    // Otherwise (if no specific systemPrompt), include system messages from the history.
    if (msg.role === 'system') {
      if (!systemPrompt || systemPrompt.trim() === "") {
        apiMessages.push(msg);
      }
    } else {
      apiMessages.push(msg);
    }
  });


  const payload = {
    model: modelId,
    messages: apiMessages,
    // stream: false, // Explicitly false, or remove if default is false
    private: true, // Good practice to keep chats private
    // referrer: "FluxFlowAI", // Optional: identify your app
    // temperature: input.temperature, // Assuming these are not yet implemented based on current schema
    // seed: input.seed,
  };

  try {
    const response = await fetch(POLLINATIONS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Pollinations API Error:', response.status, errorBody);
      throw new Error(
        `Pollinations API request failed with status ${response.status}: ${errorBody}`
      );
    }

    const result = await response.json();

    // Standard OpenAI API response structure for chat completions
    if (result.choices && result.choices.length > 0 && result.choices[0].message && result.choices[0].message.content) {
      return { responseText: result.choices[0].message.content.trim() };
    } else {
      console.error('Pollinations API - Unexpected response structure:', result);
      throw new Error('Pollinations API returned an unexpected response structure.');
    }
  } catch (error) {
    console.error('Error calling Pollinations API:', error);
    if (error instanceof Error) {
        // Re-throw the original error or a new one with more context
        throw new Error(`Failed to get completion from Pollinations API: ${error.message}`);
    }
    throw new Error('An unknown error occurred while contacting the Pollinations API.');
  }
}

