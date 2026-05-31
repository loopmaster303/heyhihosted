import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, validateRequest, ApiError, requireEnv } from '@/lib/api-error-handler';

export const runtime = 'nodejs';
export const maxDuration = 300;

const PRUNA_BASE = 'https://api.pruna.ai';

const DURATION_TO_FRAMES: Record<number, number> = { 7: 113 };

const PRUNA_MODEL_MAP: Record<string, string> = {
  'pruna-p-image': 'p-image',
  'pruna-p-image-edit': 'p-image-edit',
  'pruna-wan-i2v': 'wan-i2v',
  'pruna-wan-t2v': 'wan-t2v',
  'pruna-qwen-image': 'qwen-image',
  'pruna-qwen-image-edit': 'qwen-image-edit-plus',
  'pruna-p-video': 'p-video',
};

const VIDEO_MODELS = new Set(['wan-i2v', 'wan-t2v', 'p-video']);

const PrunaRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.string(),
  aspect_ratio: z.string().optional(),
  seed: z.number().optional(),
  duration: z.number().optional(),
  enhance_prompt: z.boolean().optional(),
  image: z.union([z.string().url(), z.array(z.string().url())]).optional(),
});

async function uploadToPruna(imageUrl: string, apiKey: string): Promise<string> {
  const fetchRes = await fetch(imageUrl);
  if (!fetchRes.ok) throw new ApiError(400, `Failed to fetch reference image: ${imageUrl}`);

  const blob = await fetchRes.blob();
  const contentType = blob.type || 'image/jpeg';
  const ext = contentType.split('/')[1] || 'jpg';

  const formData = new FormData();
  formData.append('content', new File([blob], `ref-${Date.now()}.${ext}`, { type: contentType }));

  const uploadRes = await fetch(`${PRUNA_BASE}/v1/files`, {
    method: 'POST',
    headers: { apikey: apiKey },
    body: formData,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new ApiError(uploadRes.status, `Pruna file upload failed: ${err}`);
  }

  const data = await uploadRes.json();
  return data.urls.get as string;
}

function buildInput(
  prunaModelId: string,
  params: z.infer<typeof PrunaRequestSchema>,
  prunaImageUrls: string[],
): object {
  const { prompt, aspect_ratio = '1:1', seed, duration, enhance_prompt } = params;
  const numFrames = DURATION_TO_FRAMES[duration ?? 5] ?? 81;

  switch (prunaModelId) {
    case 'p-image':
      return { prompt, aspect_ratio, seed, disable_safety_checker: true };

    case 'p-image-edit':
      return { prompt, images: prunaImageUrls, aspect_ratio, seed, disable_safety_checker: true };

    case 'wan-i2v':
      return {
        image: prunaImageUrls[0],
        prompt,
        num_frames: numFrames,
        resolution: '720p',
        sample_shift: 12,
        frames_per_second: 16,
        interpolate_output: true,
        lora_scale_transformer: 1,
        lora_scale_transformer_2: 1,
        disable_safety_checker: true,
      };

    case 'wan-t2v':
      return {
        prompt,
        num_frames: numFrames,
        resolution: '480p',
        aspect_ratio: aspect_ratio === '1:1' ? '16:9' : aspect_ratio,
        sample_shift: 12,
        frames_per_second: 16,
        optimize_prompt: false,
        interpolate_output: true,
        lora_scale_transformer: 1,
        lora_scale_transformer_2: 1,
        disable_safety_checker: true,
      };

    case 'qwen-image':
      return {
        prompt,
        enhance_prompt: enhance_prompt ?? false,
        aspect_ratio,
        image_size: 'optimize_for_quality',
        go_fast: true,
        num_inference_steps: 30,
        guidance: 3,
        seed,
        output_format: 'webp',
        negative_prompt: ' ',
        disable_safety_checker: true,
      };

    case 'qwen-image-edit-plus':
      return {
        prompt,
        image: prunaImageUrls,
        aspect_ratio,
        go_fast: true,
        seed,
        output_format: 'webp',
        disable_safety_checker: true,
      };

    case 'p-video':
      return {
        prompt,
        duration: duration ?? 5,
        aspect_ratio: aspect_ratio === '1:1' ? '16:9' : (aspect_ratio ?? '16:9'),
        resolution: '720p',
        prompt_upsampling: true,
        disable_safety_filter: true,
        ...(prunaImageUrls[0] ? { image: prunaImageUrls[0] } : {}),
      };

    default:
      throw new ApiError(400, `Unknown Pruna model: ${prunaModelId}`);
  }
}

async function pollUntilDone(predictionId: string, apiKey: string): Promise<string> {
  for (let i = 0; i < 48; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const res = await fetch(`${PRUNA_BASE}/v1/predictions/status/${predictionId}`, {
      headers: { apikey: apiKey },
    });
    const data = await res.json();
    if (data.status === 'succeeded') return data.generation_url as string;
    if (data.status === 'failed' || data.status === 'canceled') {
      throw new ApiError(500, `Pruna prediction ${data.status}: ${data.error || data.message || 'unknown'}`);
    }
  }
  throw new ApiError(504, 'Pruna generation timed out (240 s).');
}

export async function POST(request: Request) {
  try {
    const apiKey = requireEnv('PRUNA_API_KEY');
    const body = await request.json();
    const params = validateRequest(PrunaRequestSchema, body);

    const prunaModelId = PRUNA_MODEL_MAP[params.model];
    if (!prunaModelId) throw new ApiError(400, `Unknown Pruna model: ${params.model}`);

    const rawImages = params.image
      ? (Array.isArray(params.image) ? params.image : [params.image])
      : [];

    if (prunaModelId === 'wan-i2v' && rawImages.length === 0) {
      throw new ApiError(400, 'wan-i2v requires a reference image.');
    }

    const prunaImageUrls = rawImages.length > 0
      ? await Promise.all(rawImages.map(url => uploadToPruna(url, apiKey)))
      : [];

    const input = buildInput(prunaModelId, params, prunaImageUrls);
    const isVideo = VIDEO_MODELS.has(prunaModelId);

    const submitRes = await fetch(`${PRUNA_BASE}/v1/predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
        Model: prunaModelId,
      },
      body: JSON.stringify({ input }),
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      throw new ApiError(submitRes.status, `Pruna submission failed: ${err}`);
    }

    const submitData = await submitRes.json();
    if (!submitData.id) {
      throw new ApiError(500, 'Pruna did not return a prediction ID.');
    }

    const generationUrl = await pollUntilDone(submitData.id, apiKey);

    const deliveryRes = await fetch(generationUrl, {
      headers: { apikey: apiKey },
    });

    if (!deliveryRes.ok) {
      throw new ApiError(502, `Pruna delivery failed (${deliveryRes.status}).`);
    }

    const contentType = deliveryRes.headers.get('content-type')
      || (isVideo ? 'video/mp4' : 'image/jpeg');
    const buffer = await deliveryRes.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(buffer.byteLength),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
