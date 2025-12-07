
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

const TITLE_GENERATION_SYSTEM_PROMPT = `You are a title generator for chat conversations.
Your task: Create a concise, descriptive title (2-5 words) based on the conversation content.

Rules:
- Extract the main topic or key action from the messages
- Use concrete nouns and verbs from the conversation
- Avoid generic words: "Chat", "Conversation", "Discussion", "Talk", "Question", "Help"
- Be specific and descriptive
- Output ONLY the title text, no quotes, no prefixes, no explanations`;

// Generic words that indicate a poor title
const GENERIC_TITLE_WORDS = new Set([
  'chat', 'conversation', 'discussion', 'talk', 'question', 'help', 
  'assistant', 'ai', 'message', 'reply', 'response', 'answer'
]);

function isValidTitle(title: string): boolean {
  if (!title || title.trim().length === 0) return false;
  
  const lowerTitle = title.toLowerCase().trim();
  const words = lowerTitle.split(/\s+/);
  
  // Check if title is too generic
  const genericWordCount = words.filter(w => GENERIC_TITLE_WORDS.has(w)).length;
  if (genericWordCount === words.length && words.length <= 2) {
    return false; // All words are generic
  }
  
  // Check minimum length
  if (lowerTitle.length < 3) return false;
  
  // Check if it's just punctuation or numbers
  if (/^[\d\s\-_.,;:!?]+$/.test(lowerTitle)) return false;
  
  return true;
}

export async function generateChatTitle(input: GenerateChatTitleInput): Promise<GenerateChatTitleOutput> {
  if (!input || !input.messages || input.messages.trim() === "") {
    console.warn("[generateChatTitle] Empty messages, returning fallback title.");
    return { title: DEFAULT_FALLBACK_TITLE };
  }

  try {
    // Use 'openai-large' to enable Legacy fallback if Pollen API fails
    const apiInput: PollinationsChatInput = {
      modelId: 'openai-large', // Enables Legacy fallback, better reliability
      systemPrompt: TITLE_GENERATION_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Generate a concise title (2-5 words) for this conversation:\n\n${input.messages.trim()}`
      }],
      maxCompletionTokens: 24,
    };

    console.log("[generateChatTitle] Requesting title generation for conversation snippet:", input.messages.substring(0, 100) + '...');
    
    const { responseText } = await getPollinationsChatCompletion(apiInput);

    if (!responseText || responseText.trim().length === 0) {
      console.warn("[generateChatTitle] Empty response from API, using fallback.");
      return { title: DEFAULT_FALLBACK_TITLE };
    }

    // Clean up the response
    let title = responseText
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^Title:\s*/i, '') // Remove "Title:" prefix if present
      .replace(/^[:\-]\s*/, '') // Remove leading colons/dashes
      .trim();

    // Validate the title
    if (!isValidTitle(title)) {
      console.warn("[generateChatTitle] Generated title is too generic or invalid:", title, "using fallback.");
      return { title: DEFAULT_FALLBACK_TITLE };
    }

    // Truncate if too long (max 6 words)
    const words = title.split(/\s+/);
    if (words.length > 6) {
      title = words.slice(0, 5).join(' ') + '...';
    }

    console.log("[generateChatTitle] Successfully generated title:", title);
    return { title };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[generateChatTitle] Error generating title:", errorMessage, error);
    return { title: DEFAULT_FALLBACK_TITLE };
  }
}
