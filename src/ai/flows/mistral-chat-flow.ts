'use server';
/**
 * @fileOverview Direct integration with Mistral AI API for chat completions.
 * Used as fallback when Pollinations API is unavailable.
 * 
 * Exports:
 * - getMistralChatCompletion - Fetches a chat completion from Mistral AI.
 * - MistralChatInput - Type definition for the input to getMistralChatCompletion.
 * - MistralChatOutput - Type definition for the output from getMistralChatCompletion.
 */

import { z } from 'zod';
import {
    MISTRAL_CONFIG,
    mapPollinationsToMistralModel,
    type MistralChatRequest
} from '@/config/mistral-models';

// Input schema for Mistral chat completion
const MistralChatInputSchemaInternal = z.object({
    messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.union([
            z.string(),
            z.array(z.object({
                type: z.enum(['text', 'image_url']),
                text: z.string().optional(),
                image_url: z.object({ url: z.string() }).optional()
            }))
        ])
    })).min(1).describe('Array of message objects.'),
    modelId: z.string().describe('The original Pollinations model ID to map to Mistral.'),
    systemPrompt: z.string().optional().describe('An optional system prompt to guide the AI.'),
    apiKey: z.string().describe('The Mistral API key for authentication.'),
    maxCompletionTokens: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Optional cap for completion tokens.'),
    temperature: z.number().min(0).max(2).optional().describe('Optional temperature for response randomness.'),
});

export type MistralChatInput = z.infer<typeof MistralChatInputSchemaInternal>;

export interface MistralChatOutput {
    responseText: string;
    modelUsed: string;
    provider: 'mistral';
    tokensUsed?: {
        prompt: number;
        completion: number;
        total: number;
    };
}

/**
 * Main function to get a chat completion from Mistral AI.
 * Handles multimodal inputs (text and images) with proper error handling.
 */
export async function getMistralChatCompletion(
    input: MistralChatInput
): Promise<MistralChatOutput> {
    const { messages, modelId, systemPrompt, apiKey, maxCompletionTokens, temperature } = input;

    if (!apiKey) {
        throw new Error('Mistral API key is required for Mistral chat completion');
    }

    // Map Pollinations model to Mistral model
    const mistralModelId = mapPollinationsToMistralModel(modelId);

    // SAFE-MODE: Filter out images for Mistral as it doesn't support them via this endpoint
    const sanitizedMessages = messages.map(msg => {
        if (Array.isArray(msg.content)) {
            const textContent = msg.content
                .filter(part => part.type === 'text')
                .map(part => (part as any).text)
                .join('\n');
            return { ...msg, content: textContent };
        }
        return msg;
    });

    // Construct the final payload for the Mistral API
    const payload: MistralChatRequest = {
        model: mistralModelId,
        messages: sanitizedMessages,
        temperature: temperature || 0.7,
        max_tokens: maxCompletionTokens || 4096,
    };

    // Add system prompt if provided
    if (systemPrompt && systemPrompt.trim() !== "") {
        payload.messages = [{ role: 'system', content: systemPrompt.trim() }, ...sanitizedMessages];
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MISTRAL_CONFIG.maxRetries + 1; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), MISTRAL_CONFIG.timeout);

        try {
            const response = await fetch(`${MISTRAL_CONFIG.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Mistral API request failed with status ${response.status}`;

                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error?.message || errorMessage;
                } catch {
                    errorMessage = `${errorMessage}: ${errorText}`;
                }

                const error = new Error(errorMessage);
                (error as any).statusCode = response.status;

                // Check if we should retry
                if (attempt <= MISTRAL_CONFIG.maxRetries && MISTRAL_CONFIG.retryCondition(error)) {
                    console.warn(`Mistral API attempt ${attempt} failed (${response.status}), retrying in ${MISTRAL_CONFIG.retryDelay}ms...`);
                    lastError = error;
                    await new Promise(resolve => setTimeout(resolve, MISTRAL_CONFIG.retryDelay));
                    continue;
                } else {
                    throw error;
                }
            }

            const result = await response.json();

            // Extract response text from Mistral format
            const replyText = result.choices?.[0]?.message?.content;
            if (!replyText) {
                throw new Error('Mistral API returned a response but no content was found');
            }

            return {
                responseText: replyText.trim(),
                modelUsed: mistralModelId,
                provider: 'mistral',
                tokensUsed: result.usage ? {
                    prompt: result.usage.prompt_tokens,
                    completion: result.usage.completion_tokens,
                    total: result.usage.total_tokens
                } : undefined
            };

        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Mistral API request timed out after ${MISTRAL_CONFIG.timeout}ms`);
            }

            if (error instanceof Error) {
                throw error;
            }

            throw new Error(`Unexpected error calling Mistral API: ${String(error)}`);
        }
    }

    // If we get here, all retries failed
    throw lastError || new Error('All Mistral API attempts failed');
}

/**
 * Streaming version for Mistral API (future enhancement)
 */
export async function getMistralChatCompletionStream(
    input: MistralChatInput,
    onChunk: (chunk: string) => void
): Promise<string> {
    const { messages, modelId, systemPrompt, apiKey, maxCompletionTokens, temperature } = input;

    if (!apiKey) {
        throw new Error('Mistral API key is required for Mistral chat completion');
    }

    const mistralModelId = mapPollinationsToMistralModel(modelId);

    // SAFE-MODE: Filter out images for Mistral
    const sanitizedMessages = messages.map(msg => {
        if (Array.isArray(msg.content)) {
            const textContent = msg.content
                .filter(part => part.type === 'text')
                .map(part => (part as any).text)
                .join('\n');
            return { ...msg, content: textContent };
        }
        return msg;
    });

    const payload: MistralChatRequest = {
        model: mistralModelId,
        messages: sanitizedMessages,
        temperature: temperature || 0.7,
        max_tokens: maxCompletionTokens || 4096,
        stream: true,
    };

    if (systemPrompt && systemPrompt.trim() !== "") {
        payload.messages = [{ role: 'system', content: systemPrompt.trim() }, ...sanitizedMessages];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MISTRAL_CONFIG.timeout);

    try {
        const response = await fetch(`${MISTRAL_CONFIG.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Mistral API stream failed with status ${response.status}: ${errorText}`);
        }

        if (!response.body) {
            throw new Error('Mistral API stream response has no body');
        }

        let fullContent = '';
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            fullContent += content;
                            onChunk(fullContent);
                        }
                    } catch (e) {
                        // Ignore parsing errors in streaming
                        continue;
                    }
                }
            }
        }

        return fullContent;

    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Mistral API stream timed out after ${MISTRAL_CONFIG.timeout}ms`);
        }

        throw error;
    }
}
