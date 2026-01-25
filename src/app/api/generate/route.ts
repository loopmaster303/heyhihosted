import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, validateRequest } from '@/lib/api-error-handler';
import { imageUrl, videoUrl } from '@/lib/pollinations-sdk';

/**
 * Pollinations Generation Route (Safe Mode)
 * Uses the stable 'gen.pollinations.ai' endpoint via SDK Shim.
 */

const ImageGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().default('flux'),
  width: z.number().positive().default(1024),
  height: z.number().positive().default(1024),
  aspectRatio: z.string().optional(),
  duration: z.number().optional(),
  audio: z.boolean().optional(),
  seed: z.number().optional(),
  nologo: z.boolean().default(true),
  enhance: z.boolean().default(false),
  private: z.boolean().default(false),
  transparent: z.boolean().default(false),
  safe: z.boolean().default(false),
  negative_prompt: z.string().optional(),
  image: z.union([z.string().url(), z.array(z.string().url())]).optional(),
});

const VIDEO_MODELS = new Set(['veo', 'seedance', 'seedance-pro', 'wan', 'wan-2.5-t2v', 'wan-video', 'veo-3.1-fast']);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      prompt,
      model,
      width,
      height,
      aspectRatio,
      duration,
      audio,
      seed,
      nologo,
      enhance,
      private: isPrivate,
      transparent,
      safe,
      negative_prompt,
      image
    } = validateRequest(ImageGenerationSchema, body);

    // --- SDK Migration ---
    const apiKey = process.env.POLLEN_API_KEY;
    const hasToken = !!apiKey && apiKey.trim() !== '';

    // Model Logic
    let modelId: string = model || 'flux';
    if (model === 'zimage') modelId = 'z-image-turbo';

    const isVideoModel = VIDEO_MODELS.has(modelId);
    
    // Auto-enhance for z-image-turbo
    const effectiveEnhance = (modelId === 'z-image-turbo') ? true : enhance;
    
    // Safety Force: Private requires Token
    const safePrivate = isPrivate && hasToken ? true : false;
    if (isPrivate && !hasToken) {
         console.warn('[Pollinations] Private mode requested but no POLLEN_API_KEY found. Forcing private=false.');
    }

    // 1. Generate URL first (optimistic)
    let resultUrl: string;
    
    // Helper to build options
    const imageOptions = {
        model: modelId,
        width,
        height,
        aspectRatio,
        seed,
        nologo,
        enhance: effectiveEnhance,
        private: safePrivate,
        safe,
        transparent,
        negativePrompt: negative_prompt,
        referenceImage: image,
        quality: 'hd' as const,
        apiKey: hasToken ? apiKey : undefined
    };

    if (isVideoModel) {
        resultUrl = await videoUrl(prompt, {
            ...imageOptions,
            duration,
            audio,
        });
    } else {
        resultUrl = await imageUrl(prompt, imageOptions);
    }

    console.log('[Pollinations] SDK Dispatch:', hasToken ? 'Authenticated' : 'Public', { model: modelId, isVideo: isVideoModel, urlLength: resultUrl.length });

    // 2. SAFETY VALVE: If URL is too long (likely due to Signed S3 URLs or Base64), switch to POST proxy
    // 2048 is safe limit for many proxies/browsers.
    if (!isVideoModel && resultUrl.length > 2000) {
        console.warn(`[Pollinations] URL massive (${resultUrl.length} chars). Switching to POST Proxy.`);
        
        // Import generateImage locally or assume it's available from lib
        // (We added it to lib/pollinations-sdk.ts)
        const { generateImage } = await import('@/lib/pollinations-sdk');
        
        const imageBuffer = await generateImage(prompt, imageOptions);
        
        // Return Binary Stream
        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': 'image/jpeg',
                // Add header to tell client this is a binary response, not JSON?
                // Or client just checks Content-Type.
            }
        });
    }

    // Standard JSON response
    return NextResponse.json({ imageUrl: resultUrl, videoUrl: isVideoModel ? resultUrl : undefined });

  } catch (error) {
    return handleApiError(error);
  }
}
