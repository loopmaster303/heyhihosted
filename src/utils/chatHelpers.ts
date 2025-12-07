/**
 * Helper functions for chat functionality
 * Extracted from ChatProvider for better organization
 */

import type { ChatMessage } from '@/types';

/**
 * Helper to ensure dates are handled correctly
 */
export const toDate = (timestamp: Date | string | undefined | null): Date => {
    if (!timestamp) return new Date();
    if (typeof timestamp === 'string') return new Date(timestamp);
    return timestamp as Date;
};

/**
 * Extract text from content parts (handles string, array, and nested structures)
 */
export const getTextFromContentParts = (content: unknown): string => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return (content as Array<any>).map(part => {
            if (!part) return '';
            if (typeof part === 'string') return part;
            if (typeof part.text === 'string') return part.text;
            if (part.content) return getTextFromContentParts(part.content);
            return '';
        }).join('');
    }
    if (typeof content === 'object' && content !== null) {
        const maybeText = (content as Record<string, unknown>).text;
        if (typeof maybeText === 'string') return maybeText;
        const nested = (content as Record<string, unknown>).content;
        if (nested) return getTextFromContentParts(nested);
    }
    return '';
};

/**
 * Extract text from SSE payload
 */
export const extractTextFromSsePayload = (payload: any): string => {
    const choices = payload?.choices;
    if (!Array.isArray(choices) || choices.length === 0) return '';
    const target = choices[0]?.delta ?? choices[0]?.message;
    if (!target) return '';
    const content = target.content ?? target;
    return getTextFromContentParts(content);
};

/**
 * Process SSE stream and call onChunk for each text delta
 */
export const processSseStream = async (
    stream: ReadableStream<Uint8Array>,
    onChunk: (text: string) => void | Promise<void>
) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let delimiterIndex;
            while ((delimiterIndex = buffer.indexOf('\n\n')) !== -1) {
                let rawEvent = buffer.slice(0, delimiterIndex);
                buffer = buffer.slice(delimiterIndex + 2);
                rawEvent = rawEvent.replace(/\r/g, '').trim();
                if (!rawEvent) continue;
                const dataLines = rawEvent
                    .split('\n')
                    .filter(line => line.startsWith('data:'))
                    .map(line => line.replace(/^data:\s*/, ''));
                if (dataLines.length === 0) continue;
                const payload = dataLines.join('\n').trim();
                if (!payload) continue;
                if (payload === '[DONE]') {
                    return;
                }
                try {
                    const parsed = JSON.parse(payload);
                    const text = extractTextFromSsePayload(parsed);
                    if (text) {
                        await onChunk(text);
                    }
                } catch (error) {
                    console.warn('Failed to parse SSE payload', payload, error);
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
};

/**
 * Extract text from a ChatMessage
 */
export const extractTextFromMessage = (message: ChatMessage): string => {
    if (typeof message.content === 'string') return message.content;
    if (Array.isArray(message.content)) {
        const textPart = message.content.find(p => p.type === 'text');
        return textPart?.text || '';
    }
    return '';
};

