
/**
 * @fileOverview Defines the data structures (schemas and types) for the centralized agent chat.
 * This keeps the data definitions separate from server-side logic.
 */

import { z } from 'zod';
import type { ChatMessageContentPart } from '.';

export const AgentChatInputSchema = z.object({
  // The history is now passed as a single pre-formatted string.
  chatHistory: z.string().describe('The entire chat history, pre-formatted as a single string.'),
  modelId: z.string().describe('The model ID to use (e.g., openai, mistral).'),
  systemPrompt: z.string().optional().describe('An optional system prompt to guide the AI.'),
});
export type AgentChatInput = z.infer<typeof AgentChatInputSchema>;

export const AgentChatOutputSchema = z.object({
  // The response can now be an array of parts (text, image, etc.)
  response: z.array(z.custom<ChatMessageContentPart>()),
});
export type AgentChatOutput = z.infer<typeof AgentChatOutputSchema>;
