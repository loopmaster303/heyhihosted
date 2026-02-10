import { z } from 'zod';

/**
 * Pollinations SDK Shim
 * Imitates the official @pollinations/sdk interface while using the stable gen.pollinations.ai backend.
 * This allows us to migrate to the clean SDK patterns immediately, ensuring robust type safety.
 */

const BASE_URL = "https://gen.pollinations.ai/image";

export interface PollinationsOptions {
    model?: string;
    seed?: number;
    json?: boolean;
    nologo?: boolean;
    private?: boolean;
    safe?: boolean;
    enhance?: boolean;
    apiKey?: string;
}

export interface ImageOptions extends PollinationsOptions {
    width?: number;
    height?: number;
    aspectRatio?: string;
    negativePrompt?: string;
    referenceImage?: string | string[]; // URL(s)
    transparent?: boolean;
    quality?: 'medium' | 'high' | 'hd';
}

export interface VideoOptions extends PollinationsOptions {
    aspectRatio?: string;
    duration?: number;
    audio?: boolean;
    referenceImage?: string | string[]; // URL(s)
}

/**
 * Generates an image URL using the Pollinations API
 */
export async function imageUrl(prompt: string, options: ImageOptions = {}): Promise<string> {
    const params = new URLSearchParams();
    const model = options.model || 'flux';
    
    // Core
    params.append('model', model);
    if (options.seed) params.append('seed', String(options.seed));
    params.append('nologo', String(options.nologo ?? true));
    params.append('private', String(options.private ?? false));
    params.append('safe', String(options.safe ?? false));
    
    // Image Specific
    if (options.width) params.append('width', String(options.width));
    if (options.height) params.append('height', String(options.height));
    if (options.aspectRatio) params.append('aspectRatio', options.aspectRatio);
    if (options.negativePrompt) params.append('negative_prompt', options.negativePrompt);
    if (options.enhance !== undefined) params.append('enhance', String(options.enhance));
    if (options.transparent) params.append('transparent', 'true');
    params.append('quality', options.quality || 'hd');

    // Reference Images
    if (options.referenceImage) {
        const refs = Array.isArray(options.referenceImage) ? options.referenceImage : [options.referenceImage];
        params.append('image', refs.join(','));
    }

    const safePrompt = encodeURIComponent(prompt.trim());
    let url = `${BASE_URL}/${safePrompt}?${params.toString()}`;

    // API Key (should be handled by caller or default env, but SDK allows passing)
    if (options.apiKey) {
        url += `&key=${options.apiKey}`;
    }

    return url;
}


/**
 * Generates a video URL using the Pollinations API
 */
export async function videoUrl(prompt: string, options: VideoOptions = {}): Promise<string> {
    const params = new URLSearchParams();
    const model = options.model || 'veo';

    // Core
    params.append('model', model);
    if (options.seed) params.append('seed', String(options.seed));
    params.append('private', String(options.private ?? false));
    params.append('safe', String(options.safe ?? false));
    params.append('nologo', String(options.nologo ?? true)); // Check if video supports
    
    // Video Specific
    if (options.aspectRatio) params.append('aspectRatio', options.aspectRatio);
    if (options.duration) params.append('duration', String(options.duration));
    if (options.audio !== undefined) params.append('audio', String(options.audio));
    
    // Reference Images
    if (options.referenceImage) {
        const refs = Array.isArray(options.referenceImage) ? options.referenceImage : [options.referenceImage];
        params.append('image', refs.join(','));
    }

    const safePrompt = encodeURIComponent(prompt.trim());
    let url = `${BASE_URL}/${safePrompt}?${params.toString()}`;

    // API Key
    if (options.apiKey) {
        url += `&key=${options.apiKey}`;
    }

    return url;
}

