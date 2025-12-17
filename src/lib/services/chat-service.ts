import {
    ChatMessage,
    ApiChatMessage,
    ChatMessageContentPart
} from '@/types';
import {
    PollinationsChatCompletionResponse,
    ImageGenerationResponse,
    TitleGenerationResponse,
    ApiErrorResponse,
    isPollinationsChatResponse,
    isApiErrorResponse
} from '@/types/api';
import { getUnifiedModel } from '@/config/unified-image-models';
import { processSseStream } from '@/utils/chatHelpers';

export interface SendMessageOptions {
    messages: ApiChatMessage[];
    modelId: string;
    systemPrompt?: string;
    webBrowsingEnabled?: boolean;
    mistralFallbackEnabled?: boolean;
}

export interface GenerateImageOptions {
    prompt: string;
    modelId: string;
    width?: number;
    height?: number;
    // Generic params matching UnifiedImageTool interface
    negative_prompt?: string;
    num_inference_steps?: number;
    guidance_scale?: number;
    image_url?: string; // For i2v or img2img
    first_frame_image?: string; // For Veo/Wan start frame
    last_frame_image?: string; // For Veo end frame
    frames?: number; // Video specific: length/frames (e.g. 81)
    fps?: number; // Video specific: frames per second
    aspect_ratio?: string; // Explicit override
    password?: string; // For protected routes (Replicate)
}

export class ChatService {
    /**
     * Sends a chat message to the API.
     * Supports streaming if onStream is provided.
     */
    static async sendChatCompletion(
        options: SendMessageOptions,
        onStream?: (chunk: string) => void
    ): Promise<string> {
        const { messages, modelId, systemPrompt, webBrowsingEnabled, mistralFallbackEnabled } = options;

        const body = {
            messages,
            modelId,
            systemPrompt,
            webBrowsingEnabled,
            mistralFallbackEnabled,
            stream: !!onStream,
        };

        const response = await fetch('/api/chat/completion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const contentType = response.headers.get('content-type') || '';
        const isStreamResponse = contentType.includes('text/event-stream');

        if (!response.ok) {
            let errorMsg = 'API request failed';
            try {
                const errorJson = await response.json();
                if (isApiErrorResponse(errorJson)) {
                    errorMsg = errorJson.error;
                }
            } catch {
                try {
                    errorMsg = await response.text();
                } catch { }
            }
            throw new Error(`API error: ${errorMsg}`);
        }

        if (isStreamResponse && onStream) {
            if (!response.body) throw new Error('Streaming response missing body');

            let fullContent = '';
            await processSseStream(response.body, async (delta) => {
                fullContent += delta;
                onStream(fullContent);
            });
            return fullContent;
        } else {
            const result: PollinationsChatCompletionResponse | ApiErrorResponse = await response.json();

            if (isApiErrorResponse(result)) {
                throw new Error(`API error: ${result.error}`);
            }
            if (!isPollinationsChatResponse(result)) {
                throw new Error('Invalid API response format');
            }

            let aiResponseText = result.choices[0]?.message?.content || "";

            // Post-processing for specific models (legacy logic moved here)
            if (modelId === "gpt-oss-120b") {
                aiResponseText = aiResponseText
                    .replace(/\n\s*\n\s*\n/g, '\n\n')
                    .replace(/\s+/g, ' ')
                    .trim();
            }

            // If streaming was requested but we got a non-streaming response,
            // call the onStream callback with the full content to simulate streaming
            if (onStream) {

                onStream(aiResponseText);
            }

            return aiResponseText;
        }
    }

    static async generateImage(options: GenerateImageOptions): Promise<string> {
        const modelInfo = getUnifiedModel(options.modelId);

        // Default to Pollinations if unknown (safe fallback)
        const isReplicate = modelInfo?.provider === 'replicate';
        const endpoint = isReplicate ? '/api/replicate' : '/api/generate';

        let body: any = {
            prompt: options.prompt,
            model: options.modelId,
            private: true
        };

        if (isReplicate) {
            // Replicate-specific logic
            // Add optional params if they exist
            if (options.negative_prompt) body.negative_prompt = options.negative_prompt;
            if (options.num_inference_steps) body.num_inference_steps = options.num_inference_steps;
            if (options.guidance_scale) body.guidance_scale = options.guidance_scale;
            // Video specific
            if (options.frames) body.frames = options.frames; // Some use 'video_length' or 'frames'
            if (options.fps) body.fps = options.fps;

            // Image Inputs
            // Standardize usage: 'image' is commonly used for reference/first frame in Replicate API
            // Veo might use first_frame_image / last_frame_image
            if (modelInfo?.kind === 'video') {
                // Map specific params for Veo
                if (options.modelId.includes('veo')) {
                    if (options.first_frame_image) body.image = options.first_frame_image; // Veo 3 often uses 'image' or 'input_image' for start
                    // If explict first_frame field exists in specific model definition (rare), we can map it, but 'image' is safest default
                    if (options.last_frame_image) body.last_frame_image = options.last_frame_image; // Veo 3 suppports this
                } else if (options.modelId.includes('wan')) {
                    // Wan Image-to-Video
                    if (options.image_url) body.image = options.image_url;
                    if (options.first_frame_image) body.image = options.first_frame_image; // Treat first frame as the main input image
                } else {
                    // Generic fallback
                    if (options.image_url) body.image = options.image_url;
                }
            } else {
                if (options.image_url) body.image = options.image_url;
            }


            // Resolution/Aspect Ratio Logic ... (existing logic below)
            const isVideo = modelInfo?.kind === 'video';
            const isWan = options.modelId.includes('wan');

            if (options.aspect_ratio) {
                // Explicit override
                body.aspect_ratio = options.aspect_ratio;
            } else if (options.width && options.height) {
                // Heuristic to convert w/h to aspect_ratio string
                const ratio = options.width / options.height;
                let arString = "1:1";
                if (Math.abs(ratio - 16 / 9) < 0.1) arString = "16:9";
                else if (Math.abs(ratio - 9 / 16) < 0.1) arString = "9:16";
                else if (Math.abs(ratio - 4 / 3) < 0.1) arString = "4:3";
                else if (Math.abs(ratio - 3 / 4) < 0.1) arString = "3:4";

                body.aspect_ratio = arString;
            } else {
                body.aspect_ratio = "1:1"; // Default
            }

            // Special handling for Wan Video quirks if needed in future
            // For now, most wrappers map aspect_ratio to the underlying dimension logic.
        } else {
            // Pollinations
            body.width = options.width;
            body.height = options.height;
            // Also supports extras like negative_prompt in some endpoints, added for completeness
            if (options.negative_prompt) body.negative_prompt = options.negative_prompt;
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const result: ImageGenerationResponse | ApiErrorResponse = await response.json();
        if (!response.ok || isApiErrorResponse(result)) {
            const errorMsg = isApiErrorResponse(result) ? result.error : 'Failed to generate image.';
            throw new Error(errorMsg);
        }

        return (result as ImageGenerationResponse).imageUrl;
    }

    static async generateTitle(
        messages: string | ApiChatMessage[],
        mistralFallbackEnabled?: boolean
    ): Promise<string> {
        // Convert string to messages array if needed
        const messagesArray = typeof messages === 'string'
            ? [{ role: 'user' as const, content: messages }]
            : messages;

        const response = await fetch('/api/chat/title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messagesArray,
                mistralFallbackEnabled
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
