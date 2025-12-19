
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
    'zimage',
    'nanobanana',
    'nanobanana-pro',
    'seedream',
    'seedream-pro',
    'gptimage',
    'gpt-image',
    'veo',
    'seedance-pro',
    'wan-2.5-t2v',
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

const VIDEO_MODELS = new Set(['seedance-pro', 'veo', 'wan-2.5-t2v']);

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
      // Clamp sizes for gptimage (Azure GPT Image API only supports 1024x1024, 1024x1536, 1536x1024)
      const safeWidth = width ?? 1024;
      const safeHeight = height ?? 1024;
      let finalWidth = safeWidth;
      let finalHeight = safeHeight;
      if (modelId === 'gptimage') {
        const isPortrait = safeHeight > safeWidth;
        const isLandscape = safeWidth > safeHeight;
        if (isPortrait) {
          finalWidth = 1024;
          finalHeight = 1536;
        } else if (isLandscape) {
          finalWidth = 1536;
          finalHeight = 1024;
        } else {
          finalWidth = 1024;
          finalHeight = 1024;
        }
      }
      params.append('width', String(finalWidth));
      params.append('height', String(finalHeight));
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
