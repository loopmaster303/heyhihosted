import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, validateRequest, ApiError } from '@/lib/api-error-handler';
import { imageUrl, videoUrl } from '@/lib/pollinations-sdk';
import { generatePollinationsImage } from '@/lib/pollinations-image-v1';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';
import { fetchAndStoreRemoteMedia } from '@/lib/media/server-media-ingest';
import {
  getUnifiedModel,
  resolvePollinationsVisualModelId,
  toPollinationsVisualApiModelId,
} from '@/config/unified-image-models';
import { isPrunaModel } from '@/config/pruna-models';
import { generateViaPruna, downloadPrunaResult } from '@/lib/pruna/client';
import { MEDIA_UPLOAD_URL } from '@/lib/upload/constants';

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
  srcRefImages: z.array(z.string().url()).optional(),
  video: z.string().url().optional(),
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
      image,
      srcRefImages,
      video,
    } = validateRequest(ImageGenerationSchema, body);

    // --- SDK Migration ---
    // BYOP: Resolve API key (user key from header → env var fallback)
    const apiKey = resolvePollenKey(request);
    const hasToken = !!apiKey && apiKey.trim() !== '';
    const userHeader = request.headers.get('X-Pollen-Key');
    console.log('[Pollinations] Key source:', userHeader ? 'BYOP (X-Pollen-Key header)' : 'env fallback');

    // Model Logic
    const canonicalModelId = resolvePollinationsVisualModelId(model || 'flux');
    if (!canonicalModelId) {
      throw new ApiError(400, `Unknown or unavailable Pollinations image/video model: ${model}`);
    }

    const modelInfo = getUnifiedModel(canonicalModelId);
    const modelId = toPollinationsVisualApiModelId(canonicalModelId);
    const isVideoModel = modelInfo?.kind === 'video';

    // Auto-enhance for z-image-turbo (restored regression fix)
    const effectiveEnhance = modelId === 'z-image-turbo' ? true : enhance;

    // Validate I2V models require an image
    const referenceImageProvided = !!image && (Array.isArray(image) ? image.length > 0 : true);
    const I2V_MODELS = new Set(['wan-i2v']);
    if (I2V_MODELS.has(canonicalModelId) && !referenceImageProvided) {
      throw new ApiError(400, `Model ${canonicalModelId} requires a reference image. Please upload an image first.`);
    }

    const SOURCE_VIDEO_MODELS = new Set(['p-video-animate', 'p-video-replace']);
    if (SOURCE_VIDEO_MODELS.has(canonicalModelId) && !video) {
      throw new ApiError(400, `Model ${canonicalModelId} requires a source video. Please upload a video first.`);
    }

    // ── Pruna AI dispatch ─────────────────────────────────────────────
    const hasPrunaKey = !!process.env.PRUNA_API_KEY;
    const prunaEligible = isPrunaModel(canonicalModelId);
    const PRUNA_FALLBACK_MODELS = new Set(['zimage']);

    if (prunaEligible && hasPrunaKey) {
      try {
        const prunaFields = {
          prompt,
          width,
          height,
          aspectRatio,
          seed,
          negativePrompt: negative_prompt,
          image,
          srcRefImages,
          video,
          duration,
          audio,
        };

        const result = await generateViaPruna(canonicalModelId, prunaFields, request.signal);
        const downloaded = await downloadPrunaResult(
          result.generationUrl,
          process.env.PRUNA_API_KEY,
          request.signal,
        );

        const uploadHeaders: Record<string, string> = {
          'Content-Type': downloaded.contentType,
        };
        if (hasToken) {
          uploadHeaders['Authorization'] = `Bearer ${apiKey}`;
        }

        const uploadResponse = await fetch(MEDIA_UPLOAD_URL, {
          method: 'POST',
          headers: uploadHeaders,
          body: downloaded.buffer,
          signal: request.signal,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text().catch(() => 'Unknown error');
          throw new ApiError(
            uploadResponse.status >= 500 ? 502 : 400,
            `Media upload failed (${uploadResponse.status}): ${errorText}`,
            'MEDIA_UPLOAD_ERROR'
          );
        }

        const uploadData = await uploadResponse.json();
        if (!uploadData?.url) {
          throw new ApiError(
            502,
            'Media upload succeeded but returned no URL',
            'MEDIA_UPLOAD_MISSING_URL'
          );
        }

        console.log('[Pruna] Dispatch succeeded for', canonicalModelId);
        return NextResponse.json({
          imageUrl: isVideoModel ? undefined : uploadData.url,
          videoUrl: isVideoModel ? uploadData.url : undefined,
        });
      } catch (prunaError) {
        if (PRUNA_FALLBACK_MODELS.has(canonicalModelId)) {
          console.warn('[Pruna] Failed for', canonicalModelId, '— falling back to Pollinations:', prunaError);
        } else {
          throw prunaError;
        }
      }
    } else if (prunaEligible && !hasPrunaKey && !PRUNA_FALLBACK_MODELS.has(canonicalModelId)) {
      throw new ApiError(503, `Model ${canonicalModelId} requires PRUNA_API_KEY which is not set`);
    }

    // ── Pollinations dispatch (fallback or non-Pruna models) ────────

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
    };

    const hasReferenceImage = !!image && (Array.isArray(image) ? image.length > 0 : true);

    if (isVideoModel || hasReferenceImage) {
        // Pollinations v1 POST endpoint does NOT accept reference images, and video
        // generation only exists as a GET endpoint. The API key must never appear in
        // a URL that reaches the client, so we resolve the generation server-side
        // (Authorization header) and return the permanent media URL instead.
        const generationUrl = isVideoModel
            ? await videoUrl(prompt, { ...imageOptions, duration, audio })
            : await imageUrl(prompt, imageOptions);

        const stored = await fetchAndStoreRemoteMedia({
            sourceUrl: generationUrl,
            apiKey: hasToken ? apiKey : undefined,
            kind: isVideoModel ? 'video' : 'image',
        });
        resultUrl = stored.url;
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
