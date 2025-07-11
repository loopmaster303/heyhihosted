
'use server';
/**
 * @fileOverview A centralized agent for handling chat conversations.
 * This flow acts as a router to different chat models and capabilities.
 *
 * Exports:
 * - agentChat - The primary function to call for a chat response.
 */

import type { AgentChatInput, AgentChatOutput } from '@/types/agent-chat';

const POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';
const API_TOKEN = process.env.POLLINATIONS_API_TOKEN;


/**
 * The new central agent for handling chat.
 * For now, it directly uses the Pollinations API logic.
 * Later, this can be expanded into a more intelligent Genkit flow.
 */
export async function agentChat(input: AgentChatInput): Promise<AgentChatOutput> {
  // This logic is directly migrated from getPollinationsChatCompletion
  const { messages, modelId, systemPrompt } = input;

  const payload: Record<string, any> = {
    model: modelId,
    messages: messages,
  };

  if (systemPrompt && systemPrompt.trim() !== '') {
    payload.system = systemPrompt;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  try {
    const response = await fetch(POLLINATIONS_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = responseText;
      }
      const detail = typeof errorData === 'string' ? errorData : errorData.error?.message || JSON.stringify(errorData);
      throw new Error(`Pollinations API request failed with status ${response.status}: ${detail}`);
    }

    const result = JSON.parse(responseText);

    if (result.error) {
        const detail = typeof result.error === 'string' ? result.error : result.error.message || JSON.stringify(result.error);
        throw new Error(`Pollinations API returned an error: ${detail}`);
    }
    
    let replyText: string | null = null;
    if (result.choices && Array.isArray(result.choices) && result.choices.length > 0) {
        const choice = result.choices[0];
        if (choice.message && typeof choice.message.content === 'string') {
            replyText = choice.message.content;
        }
    }

    if (replyText !== null) {
      return { responseText: replyText.trim() };
    } else {
      console.error('Pollinations API - Unexpected response structure:', JSON.stringify(result, null, 2));
      throw new Error('Pollinations API returned a 200 OK but the reply content could not be extracted.');
    }

  } catch (error) {
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown error occurred while contacting the Pollinations API.');
  }
}
