'use server';

/**
 * @fileOverview Automatically generates a title for a chat conversation based on the first few messages,
 * using the Genkit AI framework.
 *
 * - generateChatTitle - A function that generates the chat title.
 * - GenerateChatTitleInput - The input type for the generateChatTitle function.
 * - GenerateChatTitleOutput - The return type for the generateChatTitle function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema for the title generation flow
const GenerateChatTitleInputSchema = z.object({
  messages: z.string().describe('The first few messages of the chat conversation, formatted as a single string.'),
});
export type GenerateChatTitleInput = z.infer<typeof GenerateChatTitleInputSchema>;

// Output schema for the title generation flow
const GenerateChatTitleOutputSchema = z.object({
  title: z.string().describe('The generated title for the chat conversation, concise and under 5 words.'),
});
export type GenerateChatTitleOutput = z.infer<typeof GenerateChatTitleOutputSchema>;

const DEFAULT_FALLBACK_TITLE = "Chat";

// Exported wrapper function that calls the Genkit flow
export async function generateChatTitle(input: GenerateChatTitleInput): Promise<GenerateChatTitleOutput> {
  // Add a simple check for empty input to avoid unnecessary API calls
  if (!input || !input.messages || input.messages.trim() === "") {
    console.warn("generateChatTitle called with empty messages, returning fallback title.");
    return { title: DEFAULT_FALLBACK_TITLE };
  }
  
  try {
    const output = await generateChatTitleFlow(input);
    // Basic cleanup in case the model doesn't perfectly follow instructions
    let title = output.title.replace(/^title:\s*/i, '').replace(/^"|"$/g, '').trim();
    if (title.split(' ').length > 6) {
        title = title.split(' ').slice(0, 5).join(' ') + '...';
    }
    return { title: title || DEFAULT_FALLBACK_TITLE };
  } catch (error) {
    console.error("Error in generateChatTitleFlow:", error);
    return { title: DEFAULT_FALLBACK_TITLE };
  }
}

// Genkit prompt definition
const titleGenerationPrompt = ai.definePrompt({
  name: 'generateChatTitlePrompt',
  input: { schema: GenerateChatTitleInputSchema },
  output: { schema: GenerateChatTitleOutputSchema },
  prompt: `You are an expert at creating concise chat titles. Based on the following messages, generate a very short title (ideally 2-4 words, maximum 5 words) that captures the main topic or question. Only return the title itself, with no prefixes like "Title:", no explanations, and no quotation marks. Just the plain text title.

Conversation messages:
{{{messages}}}

Concise Title:`,
  config: {
      temperature: 0.4, // Keep the temperature low for more focused titles
  }
});

// Genkit flow definition
const generateChatTitleFlow = ai.defineFlow(
  {
    name: 'generateChatTitleFlow',
    inputSchema: GenerateChatTitleInputSchema,
    outputSchema: GenerateChatTitleOutputSchema,
  },
  async (input) => {
    const { output } = await titleGenerationPrompt(input);
    // Genkit will throw if the output doesn't match the schema, so we can assert non-null.
    return output!;
  }
);
