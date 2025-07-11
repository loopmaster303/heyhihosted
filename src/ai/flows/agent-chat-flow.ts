
'use server';
/**
 * @fileOverview A centralized agent for handling chat conversations.
 * This flow acts as a router to different chat models and capabilities,
 * including text chat and image generation.
 *
 * Exports:
 * - agentChat - The primary function to call for a chat response.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { AgentChatInput, AgentChatOutput, ApiChatMessage } from '@/types/agent-chat';

const POLLINATIONS_TEXT_API_URL = 'https://text.pollinations.ai/openai';
const POLLINATIONS_IMAGE_API_URL = 'https://image.pollinations.ai/prompt';
const API_TOKEN = process.env.POLLINATIONS_API_TOKEN;


/**
 * A Genkit tool to generate an image using the Pollinations.ai API with the 'gptimage' model.
 * This tool is intended to be called by the main chat flow when the user asks for an image.
 */
const generateImageTool = ai.defineTool(
  {
    name: 'generateImage',
    description: 'Generates an image based on a user prompt. Use this tool ONLY when the user explicitly asks to draw, create, generate, or visualize an image, picture, or photo.',
    inputSchema: z.object({
      prompt: z.string().describe("The user's detailed description of the image to generate."),
    }),
    outputSchema: z.object({
      imageUrl: z.string().describe("The URL of the generated image."),
    }),
  },
  async (input) => {
    const { prompt } = input;
    const params = new URLSearchParams();
    // Use the specific model user requested for chat-based generation
    params.append('model', 'gptimage');
    params.append('width', '1024');
    params.append('height', '1024');
    params.append('nologo', 'true');
    params.append('private', 'true'); // Keep generated images private by default

    const encodedPrompt = encodeURIComponent(prompt.trim());
    const finalUrl = `${POLLINATIONS_IMAGE_API_URL}/${encodedPrompt}?${params.toString()}`;

    // For gptimage, we must proxy the request to include the auth token.
    // Instead of returning the direct pollinations URL, we fetch it and return a data URI.
    const imageResponse = await fetch(finalUrl, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
      },
    });

    if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error(`Pollinations Image API Error: ${imageResponse.status}`, errorText);
        throw new Error(`Failed to fetch image. Status: ${imageResponse.status}.`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/png';
    const dataUri = `data:${mimeType};base64,${base64Image}`;
    
    return { imageUrl: dataUri };
  }
);


/**
 * The Genkit prompt that defines the agent's behavior, including its personality
 * and the tools it has available.
 */
const agentPrompt = ai.definePrompt({
    name: 'agentPrompt',
    tools: [generateImageTool],
    input: {
        schema: z.object({
            systemPrompt: z.string(),
            chatHistory: z.array(z.custom<ApiChatMessage>()),
        }),
    },
    prompt: `{{systemPrompt}}

    Here is the chat history, with the most recent message at the end:
    {{#each chatHistory}}
    {{role}}: {{content}}
    {{/each}}
    `,
});


/**
 * The main agent flow. It takes the chat input, calls the LLM with the defined prompt
 * and tools, and returns the AI's response, which can be text or a tool call result.
 */
const agentChatFlow = ai.defineFlow(
    {
        name: 'agentChatFlow',
        inputSchema: z.custom<AgentChatInput>(),
        outputSchema: z.custom<AgentChatOutput>(),
    },
    async (input) => {
        const { messages, modelId, systemPrompt } = input;

        // The Pollinations text models don't support system prompts as a message role.
        // Instead, we inject it into our Handlebars prompt template.
        const llmResponse = await ai.generate({
            model: `googleai/gemini-2.0-flash`, // Using a smart model to decide when to use tools
            prompt: await agentPrompt({ systemPrompt: systemPrompt || "You are a helpful assistant.", chatHistory: messages }),
            config: {
                // We use a Google model for tool orchestration, but can use Pollinations for the final text response.
            },
            tools: [generateImageTool],
        });

        const output = llmResponse.output();

        if (output?.choices[0].finishReason === 'toolCode' && output.choices[0].message.toolCode) {
            const toolCode = output.choices[0].message.toolCode;
            if (toolCode.tool.name === 'generateImage') {
                const toolOutput = toolCode.output as { imageUrl: string };
                return {
                    response: [
                        { type: 'text', text: `Here is the image you requested for: "${toolCode.tool.input.prompt}"` },
                        { type: 'image_url', image_url: { url: toolOutput.imageUrl, altText: `Generated image for ${toolCode.tool.input.prompt}`, isGenerated: true } }
                    ]
                };
            }
        }

        // If no tool was called, we fall back to a standard text generation call to Pollinations
        // This keeps the user's preferred text models in play.
        const payload: Record<string, any> = { model: modelId, messages };
        if (systemPrompt && systemPrompt.trim() !== '') {
            payload.system = systemPrompt;
        }
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (API_TOKEN) {
            headers['Authorization'] = `Bearer ${API_TOKEN}`;
        }
        
        const response = await fetch(POLLINATIONS_TEXT_API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        if (!response.ok) {
            throw new Error(`Pollinations API request failed with status ${response.status}: ${responseText}`);
        }
        const result = JSON.parse(responseText);

        let replyText: string | null = null;
        if (result.choices?.[0]?.message?.content) {
            replyText = result.choices[0].message.content;
        }

        if (replyText !== null) {
            return { response: [{ type: 'text', text: replyText.trim() }] };
        } else {
            throw new Error('Pollinations API returned a 200 OK but the reply content could not be extracted.');
        }
    }
);

/**
 * The exported function that the application will call. It invokes the Genkit flow.
 */
export async function agentChat(input: AgentChatInput): Promise<AgentChatOutput> {
  return await agentChatFlow(input);
}
