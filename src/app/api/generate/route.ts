import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, validateRequest } from '@/lib/api-error-handler';

/**
 * Pollinations Generation Route (Safe Mode)
 * Uses the stable 'gen.pollinations.ai' endpoint.
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

const VIDEO_MODELS = new Set(['veo', 'seedance', 'seedance-pro']);

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

    const baseUrl = "https://gen.pollinations.ai/image";
    const safePrompt = encodeURIComponent(prompt.trim());
    
    // --- Model Logic ---
    let modelId: string = model || 'flux';
    if (model === 'zimage') modelId = 'z-image-turbo';

    const isVideoModel = VIDEO_MODELS.has(modelId);
    
    // Auto-enhance for z-image-turbo unless explicitly disabled
    const effectiveEnhance = (modelId === 'z-image-turbo') ? true : enhance;

    const params = new URLSearchParams();
    params.append('model', modelId);
    if (!isVideoModel) {
      params.append('width', String(width));
      params.append('height', String(height));
      params.append('nologo', String(nologo));
      params.append('enhance', String(effectiveEnhance));
    }
    params.append('private', String(isPrivate));
    params.append('safe', String(safe));

    if (isVideoModel) {
      if (aspectRatio) params.append('aspectRatio', aspectRatio);
      if (duration !== undefined) params.append('duration', String(duration));
      if (audio !== undefined) params.append('audio', String(audio));
    } else {
      if (negative_prompt) params.append('negative_prompt', negative_prompt);
      if (transparent) params.append('transparent', 'true');
    }
    if (seed) params.append('seed', String(seed));
    
    // Handle multiple images (comma-separated for Pollinations)
    if (image) {
      const imageUrls = Array.isArray(image) ? image : [image];
      params.append('image', imageUrls.join(','));
    }

    // Always use HD for best results
    if (!isVideoModel) params.append('quality', 'hd');

    const finalUrl = `${baseUrl}/${safePrompt}?${params.toString()}`;
    
    // Add API key only if available and non-empty
    const token = process.env.POLLEN_API_KEY;
    const hasToken = token && token.trim() !== '';

    // Fallback: If no token is present, we CANNOT allow 'private=true' as it causes 401
    if (isPrivate && !hasToken) {
        console.warn('[Pollinations] Private mode requested but no POLLEN_API_KEY found. Forcing private=false to prevent 401.');
        params.set('private', 'false');
    }

    const correctFinalUrl = `${baseUrl}/${safePrompt}?${params.toString()}`;
    const authenticatedUrl = hasToken 
      ? `${correctFinalUrl}&key=${token}` 
      : correctFinalUrl;

    console.log('[Pollinations] Dispatching:', hasToken ? 'Authenticated Request' : 'Public Request');

    return NextResponse.json({ imageUrl: authenticatedUrl, videoUrl: isVideoModel ? authenticatedUrl : undefined });

  } catch (error) {
    return handleApiError(error);
  }
}
