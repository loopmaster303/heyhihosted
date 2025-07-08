
'use server';
/**
 * @fileOverview Interacts with the Pollinations AI API for chat completions.
 * Supports text and multimodal inputs (text part of image uploads).
 *
 * Exports:
 * - getPollinationsChatCompletion - Fetches a chat completion from Pollinations AI.
 * - PollinationsChatInput - Type definition for the input to getPollinationsChatCompletion.
 * - PollinationsChatOutput - Type definition for the output from getPollinationsChatCompletion.
 */

import { z } from 'zod';
import type { ChatMessageContentPart, ChatMessage } from '@/types'; // Import for structured content

// This schema defines a single message part, which can be text or an image URL.
// The image_url object is simplified to just the URL, which is what the API needs.
const ApiContentPartSchema = z.union([
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({ type: z.literal('image_url'), image_url: z.object({ url: z.string() }) })
]);

// This schema defines a single message in the conversation.
// The 'content' can be a simple string (for text-only messages) or an array of parts (for multimodal messages).
const PollinationsApiChatMessageSchemaInternal = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.union([z.string(), z.array(ApiContentPartSchema)]),
});

// This is the schema for the entire input to our main function.
const PollinationsChatInputSchemaInternal = z.object({
  messages: z.array(PollinationsApiChatMessageSchemaInternal).min(1).describe('Array of message objects.'),
  modelId: z.string().describe('The Pollinations model ID to use (e.g., openai, mistral).'),
  systemPrompt: z.string().optional().describe('An optional system prompt to guide the AI.'),
});

// Exported TypeScript type for input
export type PollinationsChatInput = z.infer<typeof PollinationsChatInputSchemaInternal>;

// Exported TypeScript type for output
export interface PollinationsChatOutput {
  responseText: string;
}

const POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';
const API_TOKEN = process.env.POLLINATIONS_API_TOKEN;

let tokenWarningLogged = false;
if (!API_TOKEN && !tokenWarningLogged) {
    console.warn('\nPOLLINATIONS_API_TOKEN is not set in your .env file. ' +
                 'Certain models may not be available or requests might be rate-limited.\n' +
                 'Please create a .env file and add POLLINATIONS_API_TOKEN=YOUR_REAL_TOKEN.\n' +
                 'Make sure to restart your development server after updating the .env file.\n');
    tokenWarningLogged = true;
}

/**
 * Main function to get a chat completion from Pollinations.
 * It now correctly handles multimodal inputs (text and images).
 * @param input - The structured input containing messages, model ID, and system prompt.
 * @returns A promise that resolves to the AI's response text.
 */
export async function getPollinationsChatCompletion(
  input: PollinationsChatInput
): Promise<PollinationsChatOutput> {
  // 1. Validate the input against our Zod schema
  const validationResult = PollinationsChatInputSchemaInternal.safeParse(input);
  if (!validationResult.success) {
    console.error("Invalid input to getPollinationsChatCompletion:", validationResult.error.issues);
    const errorMessage = `Invalid input: ${validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`;
    throw new Error(errorMessage);
  }

  const { messages: historyMessages, modelId, systemPrompt: systemPromptText } = validationResult.data;

  // 2. Construct the messages array for the API payload
  const apiMessagesToSend: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
  }> = [];

  // Add system prompt first if it exists
  if (systemPromptText && systemPromptText.trim() !== "") {
    apiMessagesToSend.push({ role: 'system', content: systemPromptText });
  }

  // Process and format the history messages
  for (const msg of historyMessages) {
    if (msg.role === 'system' && apiMessagesToSend.length > 0) {
      // Avoid adding multiple system messages if one is already present
      continue;
    }

    let contentForApi: typeof msg.content;
    if (typeof msg.content === 'string') {
      if (msg.content.trim() === '') continue; // Skip empty text messages
      contentForApi = msg.content;
    } else {
      // For multimodal content, filter out empty text parts and format for the API
      const processedParts = msg.content
        .map(part => {
          if (part.type === 'text') {
            return { type: 'text' as const, text: part.text };
          }
          if (part.type === 'image_url' && part.image_url.url) {
            // Simplify the image_url object to what the API expects
            return { type: 'image_url' as const, image_url: { url: part.image_url.url } };
          }
          return null;
        })
        .filter(part => part !== null && (part.type !== 'text' || part.text.trim() !== ''));
      
      if (processedParts.length === 0) continue; // Skip if no valid parts remain
      contentForApi = processedParts as typeof ApiContentPartSchema._def.options[1]['_def']['type'];
    }

    apiMessagesToSend.push({ role: msg.role, content: contentForApi });
  }


  if (apiMessagesToSend.length === 0 || (apiMessagesToSend.length === 1 && apiMessagesToSend[0].role === 'system')) {
    console.warn("getPollinationsChatCompletion: No meaningful user/assistant messages to send. Aborting API call.");
    return { responseText: "[No actionable content was provided to the AI.]" };
  }


  // 3. Construct the final payload for the API
  const payload: Record<string, any> = {
    model: modelId,
    messages: apiMessagesToSend,
    temperature: 1.0, 
    max_tokens: 2048, // Increased max tokens for potentially detailed image descriptions
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  // 4. Make the API call
  let fullApiResponseForLogging: any = null; 

  try {
    const response = await fetch(POLLINATIONS_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    const responseText = await response.text(); 
    fullApiResponseForLogging = responseText; 

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = responseText; 
      }
      console.error('Pollinations API Error (non-200 status):', response.status, errorData, 'Request Payload:', JSON.stringify(payload, null, 2));
      const detail = typeof errorData === 'string' ? errorData : (errorData.error?.message || JSON.stringify(errorData));
      throw new Error(
        `Pollinations API request failed with status ${response.status}: ${detail}`
      );
    }

    const result = JSON.parse(responseText);
    fullApiResponseForLogging = result;

    if (result.error) {
        console.error('Pollinations API Error (in 200 OK response):', result.error);
        const detail = typeof result.error === 'string' ? result.error : (result.error.message || JSON.stringify(result.error));
        throw new Error(`Pollinations API returned an error: ${detail}`);
    }

    // 5. Extract the response text from the API result, trying various common structures
    let replyText: string | null = null;

    if (result.choices && Array.isArray(result.choices) && result.choices.length > 0) {
      const choice = result.choices[0];
      // Standard OpenAI format
      if (choice.message && typeof choice.message.content === 'string') {
        replyText = choice.message.content;
      }
      // NEW: Check for the special 'reasoning_content' field from DeepSeek based on user feedback
      else if (choice.message && typeof (choice.message as any).reasoning_content === 'string') {
        replyText = (choice.message as any).reasoning_content;
      }
      // Some models might have a 'text' property directly on the choice
      else if (typeof choice.text === 'string') {
        replyText = choice.text;
      }
      // Or maybe the whole message object is the text
      else if (typeof choice.message === 'string') {
        replyText = choice.message;
      }
    }
    // Fallback for non-standard APIs that might return a top-level 'text' or 'data'
    else if (typeof result.text === 'string') {
        replyText = result.text;
    } else if (typeof result.data === 'string') {
        replyText = result.data;
    }

    if (replyText !== null) {
      return { responseText: replyText.trim() };
    } else {
      console.error('Pollinations API - Unexpected response structure:', JSON.stringify(result, null, 2));
      throw new Error(
        'Pollinations API returned a 200 OK but the reply content could not be extracted. Please check the model compatibility or API response format.'
      );
    }
  } catch (error) {
    // Log detailed error information
    if (error instanceof Error && !(error.message.startsWith('Pollinations API'))) {
      console.error('Error calling Pollinations API or processing its response:', error, 'Request Payload:', JSON.stringify(payload, null, 2), 'Raw API Response (if available):', fullApiResponseForLogging);
    }
    
    // Rethrow a user-friendly error
    if (error instanceof Error) {
        // Prevent ugly "Failed to get completion from Pollinations API: Pollinations API..." message
        const finalErrorMessage = error.message.startsWith('Pollinations API') 
          ? error.message 
          : `Failed to get completion from Pollinations API: ${error.message}`;
        throw new Error(finalErrorMessage);
    }
    throw new Error('An unknown error occurred while contacting the Pollinations API.');
  }
}
