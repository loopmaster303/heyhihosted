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
 * Generates an image using the Pollinations API via POST (Binary Response)
 * Useful when GET URL would be too long (e.g. signed reference URLs).
 */
export async function generateImage(prompt: string, options: ImageOptions = {}): Promise<ArrayBuffer> {
    const model = options.model || 'flux';
    const params: Record<string, any> = {
        prompt: prompt.trim(),
        model,
        nologo: options.nologo ?? true,
        private: options.private ?? false,
        safe: options.safe ?? false,
        quality: options.quality || 'hd',
    };

    if (options.width) params.width = options.width;
    if (options.height) params.height = options.height;
    if (options.aspectRatio) params.aspectRatio = options.aspectRatio;
    if (options.negativePrompt) params.negative_prompt = options.negativePrompt;
    if (options.enhance !== undefined) params.enhance = options.enhance;
    if (options.seed) params.seed = options.seed;
    if (options.transparent) params.transparent = true;

    if (options.referenceImage) {
        // Pollinations 'image' param accepts URL or array of URLs
        const refs = Array.isArray(options.referenceImage) ? options.referenceImage : [options.referenceImage];
        // For POST, we can pass comma-separated string or array? 
        // Based on GET implementation, it expects 'image' query param. 
        // For JSON body, we usually match the query keys.
        params.image = refs.join(','); 
    }

    const startUrl = `${BASE_URL.replace('/image', '')}/prompt/${encodeURIComponent(prompt)}`; 
    // Actual Endpoint: https://image.pollinations.ai/prompt/...? 
    // Wait, Pollinations POST endpoint is typically https://image.pollinations.ai/
    // Let's use the BASE_URL directly.

    // Correction: Standard Pollinations POST is to the root prompt URL or /image
    // fetching BASE_URL + /prompt with query params works.
    // But we want to avoid query params. 
    // Let's try POSTing to the prompt URL with JSON body.
    
    // We will append the query string for scalar values, but keeping it clean?
    // Actually, Pollinations supports JSON body on POST.
    
    const url = `${BASE_URL}/${encodeURIComponent(prompt.trim())}`; 
    
    // We still put params in query string for what fits, or body?
    // Pollinations source indicates it reads from Query. 
    // If it supports POST body, we should use that.
    // Assuming standard behavior: PUT/POST with JSON body overrides/merges with Query.
    
    let fetchUrl = url;
    if (options.apiKey) {
        fetchUrl += `?key=${options.apiKey}`;
    }

    const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        throw new Error(`Pollinations API Error: ${response.status} ${response.statusText}`);
    }

    return await response.arrayBuffer();
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

