import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, validateRequest, ApiError } from '@/lib/api-error-handler';
import { imageUrl, videoUrl } from '@/lib/pollinations-sdk';
import { generatePollinationsImage } from '@/lib/pollinations-image-v1';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';
import { resolvePrunaKey } from '@/lib/resolve-pruna-key';
import { fetchAndStoreRemoteMedia } from '@/lib/media/server-media-ingest';
import {
  getUnifiedModel,
  getReferenceMode,
  resolvePollinationsVisualModelId,
  toPollinationsVisualApiModelId,
} from '@/config/unified-image-models';
import { isPrunaModel } from '@/config/pruna-models';
import { generateViaPruna, downloadPrunaResult } from '@/lib/pruna/client';
import { MEDIA_UPLOAD_URL } from '@/lib/upload/constants';
import { pixelsForAspect, QUALITY_MODELS } from '@/lib/playground/pollinations-caps';
import {
  findRegistryModel,
  registryModelIsVideo,
  registryMaxImages,
  type RegistryModel,
} from '@/lib/pollinations-registry';

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
  guidance: z.number().optional(),
  steps: z.number().int().positive().optional(),
  image: z.union([z.string().url(), z.array(z.string().url())]).optional(),
  srcRefImages: z.array(z.string().url()).optional(),
  video: z.string().url().optional(),
  resolution: z.enum(['480p', '720p', '1080p']).optional(),
  params: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
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
      guidance,
      steps,
      image,
      srcRefImages,
      video,
      resolution,
      params,
    } = validateRequest(ImageGenerationSchema, body);

    // --- SDK Migration ---
    // BYOP: Resolve API key (user key from header → env var fallback)
    const apiKey = resolvePollenKey(request);
    const hasToken = !!apiKey && apiKey.trim() !== '';
    const userHeader = request.headers.get('X-Pollen-Key');
    console.log('[Pollinations] Key source:', userHeader ? 'BYOP (X-Pollen-Key header)' : 'env fallback');

    // Model Logic
    // Die lokale Config ist eine handgepflegte Auswahl. Der Playground zeigt die
    // volle Live-Registry, also darf ein dort bekanntes Modell hier nicht an
    // einer veralteten Liste scheitern. Chat schickt nur Modelle aus der Config,
    // trifft diesen Zweig also nie.
    let canonicalModelId = resolvePollinationsVisualModelId(model || 'flux');
    let liveModel: RegistryModel | undefined;
    if (!canonicalModelId) {
      liveModel = model ? await findRegistryModel(model, apiKey) : undefined;
      if (!liveModel) {
        throw new ApiError(400, `Unknown or unavailable Pollinations image/video model: ${model}`);
      }
      canonicalModelId = liveModel.name;
    }

    const modelInfo = getUnifiedModel(canonicalModelId);
    const modelId = toPollinationsVisualApiModelId(canonicalModelId);
    // Fehlt der Config-Eintrag, liefert die Registry dieselben Angaben.
    const isVideoModel = modelInfo ? modelInfo.kind === 'video' : !!liveModel && registryModelIsVideo(liveModel);
    const maxImages = modelInfo?.maxImages ?? (liveModel ? registryMaxImages(liveModel) : undefined);
    const supportsReference = modelInfo ? modelInfo.supportsReference === true : (maxImages ?? 0) > 0;
    const referenceMode = modelInfo ? getReferenceMode(modelInfo) : 'multi-image';
    const referenceImages = image ? (Array.isArray(image) ? image : [image]) : [];

    if (referenceImages.length > 0 && !supportsReference) {
      throw new ApiError(400, `Model ${canonicalModelId} does not support reference images`);
    }
    if (referenceMode === 'start-frame' && referenceImages.length > 1) {
      throw new ApiError(400, `Model ${canonicalModelId} does not support an end frame`);
    }
    if (maxImages !== undefined && referenceImages.length > maxImages) {
      throw new ApiError(400, `Model ${canonicalModelId} accepts a maximum ${maxImages} reference image${maxImages === 1 ? '' : 's'}`);
    }

    // Auto-enhance for z-image-turbo (restored regression fix).
    // `enhance` is a Pollinations image-API parameter and only applies to the
    // Pollinations dispatch below; the Pruna API has no prompt-enhance field.
    // User-facing prompt enhancement is a separate step that always runs
    // through /api/enhance-prompt, independent of the visualize provider.
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
    const prunaApiKey = resolvePrunaKey(request);
    const hasPrunaKey = !!prunaApiKey;
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
          guidance,
          steps,
          image,
          srcRefImages,
          video,
          duration,
          audio,
          params,
        };

        const result = await generateViaPruna(canonicalModelId, prunaFields, request.signal, prunaApiKey);
        const downloaded = await downloadPrunaResult(
          result.generationUrl,
          prunaApiKey,
          request.signal,
        );

        if (!hasToken) {
          return new Response(new Uint8Array(downloaded.buffer), {
            status: 200,
            headers: {
              'Content-Type': downloaded.contentType,
              'Cache-Control': 'no-store',
              'X-HeyHi-Media-Kind': isVideoModel ? 'video' : 'image',
            },
          });
        }

        // Past the early return above, a token is guaranteed to exist.
        // Pollinations Media Storage requires multipart/form-data (field `file`);
        // a raw binary body is rejected with "Unsupported content type".
        const uploadHeaders: Record<string, string> = {
          Authorization: `Bearer ${apiKey}`,
        };

        const uploadForm = new FormData();
        const prunaFileName = isVideoModel ? `pruna-${Date.now()}.mp4` : `pruna-${Date.now()}.png`;
        uploadForm.append('file', new Blob([downloaded.buffer], { type: downloaded.contentType }), prunaFileName);

        const uploadResponse = await fetch(MEDIA_UPLOAD_URL, {
          method: 'POST',
          headers: uploadHeaders,
          body: uploadForm,
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

    // Translate aspectRatio to pixels for image models
    let effectiveWidth = width;
    let effectiveHeight = height;
    let effectiveAspectRatio = aspectRatio;
    if (!isVideoModel && aspectRatio) {
      const pixels = pixelsForAspect(aspectRatio);
      if (pixels) {
        effectiveWidth = pixels.width;
        effectiveHeight = pixels.height;
        effectiveAspectRatio = undefined;
      }
    }

    const imageOptions = {
        model: modelId,
        width: effectiveWidth,
        height: effectiveHeight,
        aspectRatio: isVideoModel ? effectiveAspectRatio : undefined,
        seed,
        nologo,
        enhance: effectiveEnhance,
        private: safePrivate,
        safe,
        transparent,
        negativePrompt: negative_prompt,
        guidance,
        steps,
        referenceImage: image,
        ...(QUALITY_MODELS.has(modelId) ? { quality: 'hd' as const } : {}),
    };

    const hasReferenceImage = !!image && (Array.isArray(image) ? image.length > 0 : true);

    if (isVideoModel || hasReferenceImage) {
        // Pollinations v1 POST endpoint does NOT accept reference images, and video
        // generation only exists as a GET endpoint. The API key must never appear in
        // a URL that reaches the client, so we resolve the generation server-side
        // (Authorization header) and return the permanent media URL instead.
        const generationUrl = isVideoModel
            ? await videoUrl(prompt, { ...imageOptions, duration, audio, resolution })
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
