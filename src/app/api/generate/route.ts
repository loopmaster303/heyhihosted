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
import { getPrunaModelMapping } from '@/config/pruna-models';
import { generateViaPruna, isPendingPrediction } from '@/lib/pruna/client';
import { deliverPrunaResult } from '@/lib/pruna/deliver';
import { checkRateLimit } from '@/lib/rate-limit';
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
  quality: z.enum(['low', 'medium', 'high', 'hd']).optional(),
  params: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(request, { name: 'generate', limit: 20, windowMs: 60_000 });
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Too many requests', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

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
      quality,
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
        throw new ApiError(400, `Unknown or unavailable Pollinations image/video model: ${model}`, 'UNKNOWN_MODEL', { modelLabel: model ?? 'unbekannt' });
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
      throw new ApiError(400, `Model ${canonicalModelId} does not support reference images`, 'REFERENCE_NOT_SUPPORTED', { modelLabel: canonicalModelId });
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
    const prunaEligible = modelInfo?.provider === 'pruna';

    if (prunaEligible && !getPrunaModelMapping(canonicalModelId)) {
      throw new ApiError(
        500,
        `Pruna model ${canonicalModelId} is missing its adapter mapping`,
        'PRUNA_MODEL_CONFIG_ERROR',
      );
    }

    if (prunaEligible && duration !== undefined) {
      const temporalControl = modelInfo?.temporalControl;

      if (temporalControl?.mode === 'seconds') {
        const stepsFromMinimum = (duration - temporalControl.min) / temporalControl.step;
        const isStepAligned = Math.abs(stepsFromMinimum - Math.round(stepsFromMinimum)) < 1e-9;
        const isAllowedOption = !temporalControl.options || temporalControl.options.includes(duration);

        if (
          duration < temporalControl.min
          || duration > temporalControl.max
          || !isStepAligned
          || !isAllowedOption
        ) {
          throw new ApiError(
            400,
            `Invalid duration for ${canonicalModelId}: expected ${temporalControl.min}-${temporalControl.max} seconds in steps of ${temporalControl.step}`,
            'INVALID_DURATION',
          );
        }
      } else if (temporalControl?.mode === 'frame-backed-seconds') {
        if (!temporalControl.secondOptions.includes(duration)) {
          throw new ApiError(
            400,
            `Invalid duration for ${canonicalModelId}: expected one of ${temporalControl.secondOptions.join(', ')} seconds`,
            'INVALID_DURATION',
          );
        }
      } else if (temporalControl) {
        throw new ApiError(
          400,
          `Model ${canonicalModelId} does not accept a duration; its length is controlled by the source input or provider`,
          'INVALID_DURATION',
        );
      }
    }

    if (prunaEligible && hasPrunaKey) {
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

        // Nichts wartet hier auf ein Video. Wer nicht sofort fertig ist,
        // bekommt seine Lauf-Id — der Browser fragt sie ueber
        // /api/pruna/status ab, bis das Ergebnis da ist.
        if (isPendingPrediction(result)) {
          console.log('[Pruna] Dispatch pending for', canonicalModelId, result.predictionId);
          return NextResponse.json(
            { pending: true, predictionId: result.predictionId, model: canonicalModelId },
            { status: 202 },
          );
        }

        console.log('[Pruna] Dispatch succeeded for', canonicalModelId);
        return await deliverPrunaResult({
          result,
          prunaApiKey,
          pollenKey: hasToken ? apiKey : undefined,
          isVideo: isVideoModel,
          signal: request.signal,
        });
    } else if (prunaEligible && !hasPrunaKey) {
      // Der Satz beschreibt die Nutzersicht, nicht die Server-Umgebungsvariable.
      throw new ApiError(
        503,
        `Model ${canonicalModelId} requires a Pruna key which is not configured`,
        'MISSING_PRUNA_KEY',
        { modelLabel: canonicalModelId },
      );
    }

    // ── Pollinations dispatch (non-Pruna models only) ───────────────

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
        ...(QUALITY_MODELS.has(modelId) ? { quality: quality ?? ('hd' as const) } : {}),
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
        const generated = await generatePollinationsImage({
          prompt,
          model: modelId,
          width: effectiveWidth,
          height: effectiveHeight,
          seed,
          nologo,
          enhance: effectiveEnhance,
          safe,
          transparent,
          negative_prompt,
          image,
          ...(QUALITY_MODELS.has(modelId) ? { quality: quality ?? ('hd' as const) } : {}),
          apiKey: hasToken ? apiKey : undefined,
        });

        // Pollinations antwortet mit einer eigenen URL, die beim Abruf erneut
        // einen Key verlangt. Der Browser hat keinen — er bekäme 401 und das
        // Bild bliebe leer. Also hier serverseitig holen und ablegen, genau wie
        // im Video-Zweig darüber. Data-URLs tragen die Daten schon in sich.
        if (generated.startsWith('data:')) {
          resultUrl = generated;
        } else {
          const stored = await fetchAndStoreRemoteMedia({
            sourceUrl: generated,
            apiKey: hasToken ? apiKey : undefined,
            kind: 'image',
          });
          resultUrl = stored.url;
        }
    }

    console.log('[Pollinations] SDK Dispatch:', hasToken ? 'Authenticated' : 'Public', { model: modelId, isVideo: isVideoModel, urlLength: resultUrl.length });

    // Standard JSON response
    return NextResponse.json({ imageUrl: resultUrl, videoUrl: isVideoModel ? resultUrl : undefined });

  } catch (error) {
    return handleApiError(error);
  }
}
