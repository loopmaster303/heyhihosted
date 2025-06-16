
'use server';

/**
 * @fileOverview Automatically generates a title for a chat conversation based on the first few messages.
 *
 * - generateChatTitle - A function that generates the chat title.
 * - GenerateChatTitleInput - The input type for the generateChatTitle function.
 * - GenerateChatTitleOutput - The return type for the generateChatTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateChatTitleInputSchema = z.object({
  messages: z
    .string()
    .describe('The first few messages of the chat conversation, formatted as a single string.'),
});
export type GenerateChatTitleInput = z.infer<typeof GenerateChatTitleInputSchema>;

const GenerateChatTitleOutputSchema = z.object({
  title: z.string().describe('The generated title for the chat conversation, concise and under 5 words.'),
});
export type GenerateChatTitleOutput = z.infer<typeof GenerateChatTitleOutputSchema>;

export async function generateChatTitle(input: GenerateChatTitleInput): Promise<GenerateChatTitleOutput> {
  return generateChatTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChatTitlePrompt',
  input: {schema: GenerateChatTitleInputSchema},
  output: {schema: GenerateChatTitleOutputSchema},
  prompt: `Generate a very concise title (under 5 words, ideally 2-3 words) for a chat conversation based on the following messages. Focus on the main topic or question.

Messages:
{{{messages}}}

Concise Title:`,
});

const generateChatTitleFlow = ai.defineFlow(
  {
    name: 'generateChatTitleFlow',
    inputSchema: GenerateChatTitleInputSchema,
    outputSchema: GenerateChatTitleOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      // Fallback in case the LLM doesn't return a structured output as expected.
      // This could happen if the response is empty or doesn't match the schema.
      console.warn('GenerateChatTitleFlow received no structured output, returning default title.');
      return { title: "Chat" };
    }
    return output;
  }
);
