import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, validateRequest, ApiError } from '@/lib/api-error-handler';
import { imageUrl, videoUrl } from '@/lib/pollinations-sdk';
import { generatePollinationsImage } from '@/lib/pollinations-image-v1';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';
import {
  getUnifiedModel,
  resolvePollinationsVisualModelId,
  toPollinationsVisualApiModelId,
} from '@/config/unified-image-models';

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
    // BYOP: Resolve API key (user key from header → env var fallback)
    const apiKey = resolvePollenKey(request);
    const hasToken = !!apiKey && apiKey.trim() !== '';

    // Model Logic
    const canonicalModelId = resolvePollinationsVisualModelId(model || 'flux');
    if (!canonicalModelId) {
      throw new ApiError(400, `Unknown or unavailable Pollinations image/video model: ${model}`);
    }

    const modelInfo = getUnifiedModel(canonicalModelId);
    const modelId = toPollinationsVisualApiModelId(canonicalModelId);
    const isVideoModel = modelInfo?.kind === 'video';

    // Auto-enhance for z-image-turbo
    const effectiveEnhance = (modelId === 'z-image-turbo') ? true : enhance;

    // Safety Force: Private requires Token
    const safePrivate = isPrivate && hasToken ? true : false;
    if (isPrivate && !hasToken) {
         console.warn('[Pollinations] Private mode requested but no POLLEN_API_KEY found. Forcing private=false.');
    }

    let resultUrl: string;

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

    const hasReferenceImage = !!image && (Array.isArray(image) ? image.length > 0 : true);

    if (isVideoModel) {
        resultUrl = await videoUrl(prompt, {
            ...imageOptions,
            duration,
            audio,
        });
    } else if (hasReferenceImage) {
        // Pollinations v1 POST endpoint does NOT accept reference images.
        // Use legacy GET URL (gen.pollinations.ai/image/{prompt}?image=...) which is the
        // documented path for I2I via the `image` query param.
        resultUrl = await imageUrl(prompt, imageOptions);
    } else {
        resultUrl = await generatePollinationsImage({
          prompt,
          model: modelId,
          width,
          height,
          seed,
          nologo,
          enhance: effectiveEnhance,
          safe,
          transparent,
          negative_prompt,
          image,
          apiKey: hasToken ? apiKey : undefined,
        });
    }

    console.log('[Pollinations] SDK Dispatch:', hasToken ? 'Authenticated' : 'Public', { model: modelId, isVideo: isVideoModel, urlLength: resultUrl.length });

    // Standard JSON response
    return NextResponse.json({ imageUrl: resultUrl, videoUrl: isVideoModel ? resultUrl : undefined });

  } catch (error) {
    return handleApiError(error);
  }
}
