
/**
 * @fileOverview Defines the data structures (schemas and types) for the centralized agent chat.
 * This keeps the data definitions separate from server-side logic.
 */

import { z } from 'zod';
import type { ChatMessageContentPart } from '.';

// This schema defines a single message part, which can be text or an image URL.
const ApiContentPartSchema = z.union([
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({
    type: z.literal('image_url'),
    image_url: z.object({ 
      url: z.string(),
      altText: z.string().optional(),
      isGenerated: z.boolean().optional(),
      isUploaded: z.boolean().optional(),
    }),
  }),
]);

// This schema defines a single message in the conversation.
// The roles 'user' and 'assistant' are expected by the API.
const ApiChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.union([z.string(), z.array(ApiContentPartSchema)]),
});
export type ApiChatMessage = z.infer<typeof ApiChatMessageSchema>;


export const AgentChatInputSchema = z.object({
  messages: z.array(ApiChatMessageSchema).min(1).describe('Array of user/assistant message objects.'),
  modelId: z.string().describe('The model ID to use (e.g., openai, mistral).'),
  systemPrompt: z.string().optional().describe('An optional system prompt to guide the AI.'),
});
export type AgentChatInput = z.infer<typeof AgentChatInputSchema>;

export const AgentChatOutputSchema = z.object({
  // The response can now be an array of parts (text, image, etc.)
  response: z.array(z.custom<ChatMessageContentPart>()),
});
export type AgentChatOutput = z.infer<typeof AgentChatOutputSchema>;
