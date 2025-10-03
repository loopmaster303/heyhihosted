
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, validateRequest, apiErrors } from '@/lib/api-error-handler';

// This route handles Pollinations.ai API calls for image generation with context support
// Supports models: flux, turbo, kontext

const ImageGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().default('flux'),
  width: z.number().positive().default(1024),
  height: z.number().positive().default(1024),
  seed: z.number().optional(),
  nologo: z.boolean().default(true),
  enhance: z.boolean().default(false),
  private: z.boolean().default(false),
  transparent: z.boolean().default(false),
});

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
    } = validateRequest(ImageGenerationSchema, body);

    const token = process.env.POLLINATIONS_API_TOKEN;
    if (!token) {
        console.warn("POLLINATIONS_API_TOKEN is not set. Image generation might fail.");
    }

    // --- Pollinations.ai API Logic ---
    const params = new URLSearchParams();
    params.append('width', String(width));
    params.append('height', String(height));
    params.append('model', model || 'flux');
    if (seed !== undefined && seed !== null && String(seed).trim() !== '') {
        const seedNum = parseInt(String(seed).trim(), 10);
        if (!isNaN(seedNum)) {
             params.append('seed', String(seedNum));
        }
    }
    if (nologo) params.append('nologo', 'true');
    if (enhance) params.append('enhance', 'true');
    if (isPrivate) params.append('private', 'true');
    if (transparent) params.append('transparent', 'true'); // For Pollinations models that support it

    const encodedPrompt = encodeURIComponent(prompt.trim());
    let imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;

    // Add API token if available
    if (token) {
      imageUrl += `&token=${token}`;
    }

    console.log(`Requesting image from Pollinations (model: ${model}):`, imageUrl);

    // Return the image URL with token for authenticated access
    return NextResponse.json({ imageUrl });

  } catch (error) {
    return handleApiError(error);
  }
}
