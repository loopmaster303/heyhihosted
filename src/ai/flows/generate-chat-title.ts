
'use server';

/**
 * @fileOverview Automatically generates a title for a chat conversation based on the first few messages,
 * using the Pollinations AI API.
 *
 * - generateChatTitle - A function that generates the chat title.
 * - GenerateChatTitleInput - The input type for the generateChatTitle function.
 * - GenerateChatTitleOutput - The return type for the generateChatTitle function.
 */

// Define the Zod schema for input, but do not export it directly
export interface GenerateChatTitleInput {
  messages: string; // The first few messages of the chat conversation, formatted as a single string.
}

// Define the Zod schema for output, but do not export it directly
export interface GenerateChatTitleOutput {
  title: string; // The generated title for the chat conversation, concise and under 5 words.
}

const POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';
const DEFAULT_FALLBACK_TITLE = "Chat";

export async function generateChatTitle(input: GenerateChatTitleInput): Promise<GenerateChatTitleOutput> {
  if (!input || !input.messages || input.messages.trim() === "") {
    console.warn("generateChatTitle called with empty messages, returning fallback title.");
    return { title: DEFAULT_FALLBACK_TITLE };
  }

  const systemPromptForTitle = `You are an expert at creating concise chat titles. Based on the following messages, generate a very short title (ideally 2-4 words, maximum 5 words) that captures the main topic or question. Only return the title itself, with no prefixes like "Title:", no explanations, and no quotation marks. Just the plain text title.`;

  const userMessagesContent = `Conversation messages:\n\n${input.messages}\n\nConcise Title:`;

  const payload = {
    model: "openai-fast", // Use a fast and capable model for this simple task
    messages: [
      { role: "system", content: systemPromptForTitle },
      { role: "user", content: userMessagesContent }
    ],
    temperature: 0.4, // Lower temperature for more deterministic and focused titles
    max_tokens: 20,   // Sufficient for a short title, includes some buffer
    n: 1,             // We only need one title candidate
    private: true,    // Keep title generation requests private
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
      console.error('Pollinations API Error (generateChatTitle):', response.status, errorBody);
      return { title: DEFAULT_FALLBACK_TITLE };
    }

    const result = await response.json();

    if (result.choices && result.choices.length > 0 && result.choices[0].message && result.choices[0].message.content) {
      let title = result.choices[0].message.content.trim();
      
      // Clean up common prefixes or extra text the model might add despite instructions
      title = title.replace(/^title:\s*/i, ''); // Remove "Title: "
      title = title.replace(/^concise title:\s*/i, ''); // Remove "Concise Title: "
      title = title.replace(/^"|"$/g, ''); // Remove surrounding quotes

      // Ensure it's not too long and is sensible
      const words = title.split(' ').filter(Boolean);
      if (words.length === 0) {
        return { title: DEFAULT_FALLBACK_TITLE };
      }
      if (words.length > 6) { // Slightly more lenient on word count for flexibility
        title = words.slice(0, 5).join(' ') + '...';
      }
      
      return { title };
    } else {
      console.error('Pollinations API - Unexpected response structure (generateChatTitle):', result);
      return { title: DEFAULT_FALLBACK_TITLE };
    }
  } catch (error) {
    console.error('Error calling Pollinations API for title generation:', error);
    return { title: DEFAULT_FALLBACK_TITLE };
  }
}
