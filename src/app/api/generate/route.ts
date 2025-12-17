
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, validateRequest, apiErrors } from '@/lib/api-error-handler';

// This route handles Pollinations.ai API calls for image generation with context support
// Supports models: flux, turbo, nanobanana, seedream

const ImageGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.enum([
    'flux',
    'kontext',
    'turbo',
    'nanobanana',
    'nanobanana-pro',
    'seedream',
    'seedream-pro',
    'gptimage',
    'gpt-image',
    'veo',
    'seedance',
    'seedance-pro',
  ]),
  width: z.number().positive().default(1024),
  height: z.number().positive().default(1024),
  seed: z.number().optional(),
  nologo: z.boolean().default(true),
  enhance: z.boolean().default(false),
  private: z.boolean().default(false),
  transparent: z.boolean().default(false),
  aspectRatio: z.string().optional(),
  duration: z.number().optional(),
  audio: z.boolean().optional(),
  image: z.union([z.string().url(), z.array(z.string().url())]).optional(),
});

const VIDEO_MODELS = new Set(['seedance', 'seedance-pro', 'veo']);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request
    const {
      prompt,
      model,
      width,
      height,
      seed,
      nologo,
      enhance,
      private: isPrivate,
      transparent,
      aspectRatio,
      duration,
      audio,
    } = validateRequest(ImageGenerationSchema, body);

    // Map model aliases for Pollen endpoint
    const modelId = model === 'gpt-image' ? 'gptimage' : model;

    const token = process.env.POLLEN_API_KEY || process.env.POLLINATIONS_API_TOKEN;
    if (!token) {
      console.warn("POLLEN_API_KEY is not set. Image generation might fail.");
    }

    const isVideoModel = VIDEO_MODELS.has(model);

    // --- Pollinations Pollen API Logic ---
    const params = new URLSearchParams();
    params.append('model', modelId || 'flux');
    if (!isVideoModel) {
      params.append('width', String(width));
      params.append('height', String(height));
    }
    if (seed !== undefined && seed !== null && String(seed).trim() !== '') {
      const seedNum = parseInt(String(seed).trim(), 10);
      if (!isNaN(seedNum)) {
        params.append('seed', String(seedNum));
      }
    }
    if (nologo) params.append('nologo', 'true');
    if (enhance) params.append('enhance', 'true');
    if (isPrivate) params.append('private', 'true');
    if (transparent) params.append('transparent', 'true'); // For models that support it
    if (isVideoModel) {
      if (aspectRatio) params.append('aspectRatio', aspectRatio);
      if (typeof duration === 'number') params.append('duration', String(duration));
      if (audio) params.append('audio', 'true');
    }
    // Reference images (supports arrays or single URL)
    if (body.image) {
      const images = Array.isArray(body.image) ? body.image : [body.image];
      images.forEach((imgUrl: string) => {
        if (typeof imgUrl === 'string' && imgUrl.trim().length > 0) {
          params.append('image', imgUrl.trim());
        }
      });
    }

    const encodedPrompt = encodeURIComponent(prompt.trim());
    let imageUrl = `https://enter.pollinations.ai/api/generate/image/${encodedPrompt}?${params.toString()}`;

    // Add API token if available (passed as query for direct <img> access)
    if (token) {
      imageUrl += `&key=${token}`;
    }



    // Return the image URL with token for authenticated access
    return NextResponse.json({ imageUrl });

  } catch (error) {
    return handleApiError(error);
  }
}
