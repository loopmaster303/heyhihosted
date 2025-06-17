
'use server';
/**
 * @fileOverview Interacts with the Pollinations AI API for chat completions.
 * Supports text and limited multimodal inputs (text part of image uploads).
 *
 * Exports:
 * - getPollinationsChatCompletion - Fetches a chat completion from Pollinations AI.
 * - PollinationsChatInput - Type definition for the input to getPollinationsChatCompletion.
 * - PollinationsChatOutput - Type definition for the output from getPollinationsChatCompletion.
 */

import { z } from 'zod';
import type { ChatMessageContentPart } from '@/types'; // Import for structured content

// Internal Zod schema for input validation - simplified as content is processed to string
const PollinationsApiChatMessageSchemaInternal = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  // content will be processed to string before API call.
  content: z.union([z.string(), z.array(z.union([
    z.object({ type: z.literal('text'), text: z.string() }),
    z.object({ type: z.literal('image_url'), image_url: z.object({ url: z.string(), altText: z.string().optional(), isGenerated: z.boolean().optional(), isUploaded: z.boolean().optional() }) })
  ]))]),
});


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
const API_TOKEN = process.env.POLLINATIONS_API_TOKEN || 'uI8ZTSLs84zigEv2'; 

let tokenWarningLogged = false;
if (API_TOKEN === 'uI8ZTSLs84zigEv2' && !process.env.POLLINATIONS_API_TOKEN && !tokenWarningLogged) {
    console.warn('\nPOLLINATIONS_API_TOKEN is hardcoded in pollinations-chat-flow.ts. ' +
                 'Please move it to your .env file (e.g., POLLINATIONS_API_TOKEN=YOUR_REAL_TOKEN) for security and to ensure it is being used properly.\n' +
                 'Make sure to restart your development server after updating the .env file.\n');
    tokenWarningLogged = true;
}


export async function getPollinationsChatCompletion(
  input: PollinationsChatInput
): Promise<PollinationsChatOutput> {
  const validationResult = PollinationsChatInputSchemaInternal.safeParse(input);
  if (!validationResult.success) {
    console.error("Invalid input to getPollinationsChatCompletion:", validationResult.error.issues);
    const errorMessage = `Invalid input: ${validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`;
    throw new Error(errorMessage);
  }

  const { messages: historyMessages, modelId, systemPrompt: systemPromptText } = validationResult.data;

  const apiMessagesToSend: Array<{role: 'system' | 'user' | 'assistant'; content: string}> = [];

  // Add system prompt first if it exists
  if (systemPromptText && systemPromptText.trim() !== "") {
    apiMessagesToSend.push({ role: 'system', content: systemPromptText });
  }

  // Process history messages
  for (const msg of historyMessages) {
    let messageContentString: string;

    if (typeof msg.content === 'string') {
      messageContentString = msg.content;
    } else {
      // msg.content is ChatMessageContentPart[]
      // For Pollinations /openai endpoint, it seems to expect only string content per message.
      // We will concatenate text parts and warn if image parts are present, as they'll be omitted.
      const textParts = msg.content
        .filter(part => part.type === 'text')
        .map(part => (part as { type: 'text'; text: string }).text);
      messageContentString = textParts.join('\n');

      const imageParts = msg.content.filter(part => part.type === 'image_url');
      if (imageParts.length > 0) {
        console.warn(`Pollinations API (model: ${modelId}): Message (role: ${msg.role}) contained image parts. These are being omitted as the /openai endpoint expects string content. Text sent: "${messageContentString}"`);
      }
      // If only image parts were present and no text, provide a placeholder.
      if (!messageContentString && imageParts.length > 0) {
          messageContentString = "[User uploaded an image or image content was present but could not be sent as text to this model via Pollinations /openai endpoint]";
      }
    }

    // Add to API payload if role is user or assistant
    if (msg.role === 'user' || msg.role === 'assistant') {
      // Ensure content is not empty after processing, especially if only an image was "sent"
      if (messageContentString.trim() === "" && msg.content !== "" && typeof msg.content !== 'string' && msg.content.some(p => p.type === 'image_url')) {
        apiMessagesToSend.push({
          role: msg.role,
          content: "[User uploaded an image]" 
        });
      } else if (messageContentString.trim() !== "") {
         apiMessagesToSend.push({
          role: msg.role,
          content: messageContentString
        });
      }
    } else if (msg.role === 'system' && apiMessagesToSend.length === 0 && (!systemPromptText || systemPromptText.trim() === "")) {
      // This handles if the first message in history is 'system' and no systemPromptText was directly provided.
      if (messageContentString.trim() !== "") {
        apiMessagesToSend.push({ role: 'system', content: messageContentString });
      }
    }
  }

  if (apiMessagesToSend.length === 0 || (apiMessagesToSend.length === 1 && apiMessagesToSend[0].role === 'system' && apiMessagesToSend[0].content.trim() === "")) {
    console.warn("getPollinationsChatCompletion: No meaningful messages to send after processing. Aborting API call.");
    return { responseText: "[No actionable content to send to AI after processing input.]" };
  }


  const payload: Record<string, any> = {
    model: modelId,
    messages: apiMessagesToSend,
    temperature: 1.0, 
    max_tokens: 500, // Aligned with user's working example
    // stream: false, // Removed to align with user's working example (rely on Pollinations default)
    // private: true, // Already removed in previous steps
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  } else {
    console.warn('POLLINATIONS_API_TOKEN not set. API requests might be rate-limited or restricted.');
  }

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
      const detail = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
      throw new Error(
        `Pollinations API request failed with status ${response.status}: ${detail}`
      );
    }

    const result = JSON.parse(responseText);
    fullApiResponseForLogging = result; 

    let replyText: string | null = null;

    if (result.choices && Array.isArray(result.choices) && result.choices.length > 0) {
      const choice = result.choices[0];
      if (choice && typeof choice === 'object') {
        if (choice.message && typeof choice.message === 'object' && choice.message.hasOwnProperty('content')) {
          if (typeof choice.message.content === 'string') {
            replyText = choice.message.content;
          } else if (choice.message.content === null) {
            console.warn('Pollinations API: choices[0].message.content is null. Interpreting as empty reply. Request Payload:', JSON.stringify(payload, null, 2), 'Full API Response:', JSON.stringify(result, null, 2));
            replyText = ""; 
          } else {
            console.warn(`Pollinations API: choices[0].message.content is not a string or null (it's ${typeof choice.message.content}). This flow expects a text reply. Full API Response:`, JSON.stringify(result, null, 2));
          }
        } else if (typeof choice.text === 'string') { // Fallback for some models
          replyText = choice.text;
          console.log("Extracted reply from choice.text. Full API Response:", JSON.stringify(result, null, 2));
        } else {
          console.warn('Pollinations API: choices[0] exists but lacks expected message.content or text structure for a text reply. Full API Response:', JSON.stringify(result, null, 2));
        }
      } else {
        console.warn('Pollinations API: choices[0] is not a valid object or is missing. Full API Response:', JSON.stringify(result, null, 2));
      }
    }
    
    // Additional fallbacks based on observed Pollinations structures and user's example
    if (replyText === null && result && typeof result === 'object') {
        if (typeof result.reply === 'string') { // Common for some models
            replyText = result.reply;
            console.log("Extracted reply from result.reply. Full API Response:", JSON.stringify(result, null, 2));
        } else if (typeof result.content === 'string') { // Less common but possible
            replyText = result.content;
            console.log("Extracted reply from result.content. Full API Response:", JSON.stringify(result, null, 2));
        }
    }
    
    if (replyText !== null) {
      const trimmedReply = replyText.trim();
      if (trimmedReply === "" && replyText.length > 0) { 
         console.warn('Pollinations API: Successfully parsed response, content was only whitespace. Original content: "' + replyText + '". Request Payload:', JSON.stringify(payload, null, 2), 'Full API Response:', JSON.stringify(result, null, 2));
      } else if (trimmedReply === "") { 
         console.warn('Pollinations API: Successfully parsed response, but content is an empty string. Request Payload:', JSON.stringify(payload, null, 2), 'Full API Response:', JSON.stringify(result, null, 2));
      }
      return { responseText: trimmedReply };
    } else {
      console.error('Pollinations API - Successful response (200 OK), but the reply content could not be extracted from the JSON structure. Full API Response:', JSON.stringify(result, null, 2), 'Request Payload:', JSON.stringify(payload, null, 2));
      throw new Error(
        'Pollinations API returned a 200 OK but the reply content could not be extracted from the JSON structure.'
      );
    }
  } catch (error) {
    if (error instanceof Error && !(error.message.startsWith('Pollinations API request failed') || error.message.startsWith('Pollinations API returned a 200 OK but the reply content could not be extracted'))) {
      console.error('Error calling Pollinations API or processing its response:', error, 'Request Payload:', JSON.stringify(payload, null, 2), 'Raw API Response (if available):', fullApiResponseForLogging);
    } else if (!(error instanceof Error)) {
      console.error('Unknown error calling Pollinations API or processing its response:', error, 'Request Payload:', JSON.stringify(payload, null, 2), 'Raw API Response (if available):', fullApiResponseForLogging);
    }
    
    if (error instanceof Error) {
        throw new Error(`Failed to get completion from Pollinations API: ${error.message}`);
    }
    throw new Error('An unknown error occurred while contacting the Pollinations API.');
  }
}
