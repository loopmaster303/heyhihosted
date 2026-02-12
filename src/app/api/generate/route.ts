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

const VIDEO_MODELS = new Set(['seedance', 'seedance-pro', 'seedance-fast', 'wan', 'wan-2.5-t2v', 'wan-video', 'grok-video', 'ltx-video']);

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

    // Pollinations only supports GET — no POST endpoint exists.
    // Even with shortened reference URLs, enhanced prompts can push over the limit.
    // Server-side fetch avoids browser URL limits; Pollinations still needs <8K.
    if (!isVideoModel && resultUrl.length > 2000) {
        console.warn(`[Pollinations] URL long (${resultUrl.length} chars). Server-side fetch.`);

        const imgResponse = await fetch(resultUrl);
        if (!imgResponse.ok) {
            throw new Error(`Pollinations API Error: ${imgResponse.status} ${imgResponse.statusText}`);
        }
        const buffer = await imgResponse.arrayBuffer();
        const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
        const base64 = Buffer.from(buffer).toString('base64');
        return NextResponse.json({ imageUrl: `data:${contentType};base64,${base64}` });
    }

    // Standard JSON response
    return NextResponse.json({ imageUrl: resultUrl, videoUrl: isVideoModel ? resultUrl : undefined });

  } catch (error) {
    return handleApiError(error);
  }
}
