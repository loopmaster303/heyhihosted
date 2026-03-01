import { ApiChatMessage } from '@/types';
import {
    PollinationsChatCompletionResponse,
    TitleGenerationResponse,
    ApiErrorResponse,
    isPollinationsChatResponse,
    isApiErrorResponse
} from '@/types/api';
import { getUnifiedModel } from '@/config/unified-image-models';
import { processSseStream } from '@/utils/chatHelpers';
import { getPollenHeaders } from '@/lib/pollen-key';

export interface SendMessageOptions {
    messages: ApiChatMessage[];
    modelId: string;
    systemPrompt?: string;
    webBrowsingEnabled?: boolean;
    skipSmartRouter?: boolean;
}

export interface GenerateImageOptions {
    prompt: string;
    modelId: string;
    width?: number;
    height?: number;
    negative_prompt?: string;
    num_inference_steps?: number;
    guidance_scale?: number;
    image_url?: string;
    image?: string | string[];
    first_frame_image?: string;
    last_frame_image?: string;
    frames?: number;
    fps?: number;
    aspect_ratio?: string;
    duration?: number;
    audio?: boolean;
    resolution?: string;
    output_format?: string;
    input_images?: string[];
    input_image?: string;
    password?: string;
}

export class ChatService {
    // Service initialized
    static async sendChatCompletion(
        options: SendMessageOptions,
        onStream?: (chunk: string) => void
    ): Promise<string> {
        console.log('[ChatService v3] Requesting completion for model:', options.modelId);
        
        const body: Record<string, unknown> = {
            messages: options.messages,
            modelId: options.modelId,
            systemPrompt: options.systemPrompt,
            webBrowsingEnabled: options.webBrowsingEnabled,
            stream: !!onStream,
        };
        if (options.skipSmartRouter) {
            body.skipSmartRouter = true;
        }

        const response = await fetch('/api/chat/completion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getPollenHeaders() },
            body: JSON.stringify(body),
        });

        // 1. Handle HTTP Errors first
        if (!response.ok) {
            let errorMsg = `API request failed with status ${response.status}`;
            try {
                const errorJson = await response.json();
                if (isApiErrorResponse(errorJson)) {
                    errorMsg = errorJson.error;
                }
            } catch { }
            throw new Error(`API error: ${errorMsg}`);
        }

        // 2. Handle Standard JSON Response (generateText)
        const jsonResult = await response.json();
        
        if (isPollinationsChatResponse(jsonResult)) {
            const content = jsonResult.choices[0]?.message?.content || "";
            if (onStream) onStream(content); // Simulate stream for UI compatibility
            return content;
        }

        throw new Error('Invalid API response format');
    }

    static async generateImage(options: GenerateImageOptions): Promise<string> {
        const modelInfo = getUnifiedModel(options.modelId);
        const endpoint = '/api/generate';

        let body: any = {
            prompt: options.prompt,
            model: options.modelId,
            private: true
        };

        if (modelInfo?.kind === 'video' || options.duration !== undefined || options.audio !== undefined) {
            if (options.aspect_ratio) body.aspectRatio = options.aspect_ratio;
            if (options.duration !== undefined) {
                body.duration = options.duration;
            } else if (options.frames) {
                body.duration = options.frames;
            } else if (modelInfo?.durationRange?.options && modelInfo.durationRange.options.length > 0) {
                body.duration = modelInfo.durationRange.options[0];
            } else {
                body.duration = 5;
            }
            if (options.audio !== undefined) body.audio = options.audio;
        } else {
            body.width = options.width;
            body.height = options.height;
        }

        if (options.image) body.image = options.image;
        if (options.image_url) body.image = options.image_url;
        if (options.input_image) body.image = options.input_image;
        if (options.input_images) body.image = options.input_images;
        if (options.negative_prompt) body.negative_prompt = options.negative_prompt;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getPollenHeaders() },
            body: JSON.stringify(body),
        });

        if (response.status === 404) {
            throw new Error('The Model is currently not available. Try another one like z-image (Das Modell ist anscheinend im Moment nicht verfügbar probiere ein anders zB zimage)');
        }

        const result: any = await response.json();
        if (!response.ok || isApiErrorResponse(result)) {
            const errorMsg = isApiErrorResponse(result) ? result.error : 'Failed to generate image.';
            throw new Error(errorMsg);
        }

        if (result.videoUrl) return result.videoUrl;
        if (result.imageUrl) return result.imageUrl;
        if (result.output) {
            return Array.isArray(result.output) ? result.output[0] : result.output;
        }

        return result.imageUrl || '';
    }

    static async generateTitle(
        messages: string | ApiChatMessage[]
    ): Promise<string> {
        const messagesArray = typeof messages === 'string'
            ? [{ role: 'user' as const, content: messages }]
            : messages;

        const response = await fetch('/api/chat/title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getPollenHeaders() },
            body: JSON.stringify({
                messages: messagesArray
            }),
        });

        const result: TitleGenerationResponse | ApiErrorResponse = await response.json();
        if (!response.ok || isApiErrorResponse(result)) {
            const errorMsg = isApiErrorResponse(result) ? result.error : 'Failed to generate title.';
            throw new Error(errorMsg);
        }

        const titleResult = result as TitleGenerationResponse;
        return titleResult.title || "Chat";
    }
}
