
'use server';

/**
 * @fileOverview Generates a title for a chat conversation using the Pollinations API.
 *
 * - generateChatTitle - A function that generates the chat title.
 * - GenerateChatTitleInput - The input type for the generateChatTitle function.
 * - GenerateChatTitleOutput - The return type for the generateChatTitle function.
 */
import { getPollinationsChatCompletion, type PollinationsChatInput } from './pollinations-chat-flow';
import { z } from 'zod';

const GenerateChatTitleInputSchema = z.object({
  messages: z.string().describe('The first few messages of the chat conversation, formatted as a single string.'),
});
export type GenerateChatTitleInput = z.infer<typeof GenerateChatTitleInputSchema>;

export interface GenerateChatTitleOutput {
  title: string;
}

const DEFAULT_FALLBACK_TITLE = "Chat";

const TITLE_GENERATION_SYSTEM_PROMPT = `You are an expert at creating concise chat titles. Based on the following messages, generate a very short title (ideally 2-4 words, maximum 5 words). Only return the title itself, with no prefixes like "Title:", no explanations, and no quotation marks. Just the plain text title.`;


export async function generateChatTitle(input: GenerateChatTitleInput): Promise<GenerateChatTitleOutput> {
  if (!input || !input.messages || input.messages.trim() === "") {
    console.warn("generateChatTitle called with empty messages, returning fallback title.");
    return { title: DEFAULT_FALLBACK_TITLE };
  }

  try {
    const apiInput: PollinationsChatInput = {
      modelId: 'openai-fast', // Use a fast and cheap model for this task
      systemPrompt: TITLE_GENERATION_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Conversation messages:\n\n${input.messages}\n\nConcise Title:`
      }],
      maxCompletionTokens: 60,
    };

    const { responseText } = await getPollinationsChatCompletion(apiInput);

    // Basic cleanup
    let title = responseText.replace(/^"|"$/g, '').trim();
    if (title.split(' ').length > 6) {
        title = title.split(' ').slice(0, 5).join(' ') + '...';
    }

    return { title: title || DEFAULT_FALLBACK_TITLE };

  } catch (error) {
    console.error("Error in generateChatTitle (Pollinations):", error);
    return { title: DEFAULT_FALLBACK_TITLE };
  }
}
