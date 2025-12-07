/**
 * Unified Image Generation API Layer
 * Abstracts Pollinations and Replicate APIs into a single interface
 */

import type { ImageGenerationResponse, ApiErrorResponse } from '@/types/api';
import { isApiErrorResponse } from '@/types/api';
import { getUnifiedModel, type UnifiedImageModel } from '@/config/unified-image-models';

export interface UnifiedImageGenerationRequest {
  prompt: string;
  modelId: string;
  // Pollinations-specific params
  width?: number;
  height?: number;
  seed?: number;
  aspectRatio?: string;
  duration?: number;
  audio?: boolean;
  isPrivate?: boolean;
  enhance?: boolean;
  // Replicate-specific params (will be passed through)
  [key: string]: any;
}

export interface UnifiedImageGenerationResponse {
  imageUrl?: string;
  videoUrl?: string;
  output?: string | string[]; // Replicate can return array
  error?: string;
}

/**
 * Generate image/video using unified API
 * Automatically routes to Pollinations or Replicate based on model
 */
export async function generateImage(
  request: UnifiedImageGenerationRequest
): Promise<UnifiedImageGenerationResponse> {
  const model = getUnifiedModel(request.modelId);
  
  if (!model) {
    throw new Error(`Unknown model: ${request.modelId}`);
  }

  // Route to appropriate provider
  if (model.provider === 'pollinations') {
    return generateWithPollinations(request, model);
  } else if (model.provider === 'replicate') {
    return generateWithReplicate(request, model);
  } else {
    throw new Error(`Unsupported provider for model: ${request.modelId}`);
  }
}

/**
 * Generate with Pollinations API
 */
async function generateWithPollinations(
  request: UnifiedImageGenerationRequest,
  model: UnifiedImageModel
): Promise<UnifiedImageGenerationResponse> {
  const endpoint = '/api/generate';
  
  const payload: Record<string, any> = {
    prompt: request.prompt,
    model: request.modelId,
    private: request.isPrivate ?? true,
  };

  // Add image-specific params
  if (model.kind === 'image') {
    if (request.width) payload.width = request.width;
    if (request.height) payload.height = request.height;
  } else {
    // Video-specific params
    if (request.aspectRatio) payload.aspectRatio = request.aspectRatio;
    if (request.duration) payload.duration = request.duration;
    if (request.audio) payload.audio = request.audio;
  }

  if (request.seed !== undefined) payload.seed = request.seed;
  if (request.enhance) payload.enhance = request.enhance;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result: ImageGenerationResponse | ApiErrorResponse = await response.json();

  if (!response.ok || isApiErrorResponse(result)) {
    const errorMsg = isApiErrorResponse(result) ? result.error : 'Failed to generate image.';
    throw new Error(errorMsg);
  }

  const imageResult = result as ImageGenerationResponse;
  return {
    imageUrl: imageResult.imageUrl,
  };
}

/**
 * Generate with Replicate API
 */
async function generateWithReplicate(
  request: UnifiedImageGenerationRequest,
  model: UnifiedImageModel
): Promise<UnifiedImageGenerationResponse> {
  const endpoint = '/api/replicate';
  
  // Extract Replicate-specific params from request
  const replicateParams: Record<string, any> = {
    model: request.modelId,
    prompt: request.prompt,
  };

  // Pass through all other params (aspect_ratio, seed, etc.)
  Object.keys(request).forEach(key => {
    if (key !== 'modelId' && key !== 'prompt' && key !== 'isPrivate' && key !== 'enhance') {
      replicateParams[key] = (request as any)[key];
    }
  });

  // Map common params
  if (request.aspectRatio) replicateParams.aspect_ratio = request.aspectRatio;
  if (request.seed !== undefined) replicateParams.seed = request.seed;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(replicateParams),
  });

  const result: { output?: string | string[]; error?: string } | ApiErrorResponse = await response.json();

  if (!response.ok || isApiErrorResponse(result)) {
    const errorMsg = isApiErrorResponse(result) ? result.error : 'Failed to generate with Replicate.';
    throw new Error(errorMsg);
  }

  const output = (result as any).output;
  const isVideo = model.kind === 'video';
  
  // Replicate can return string or array
  const outputUrl = Array.isArray(output) ? output[0] : output;

  return {
    imageUrl: !isVideo ? outputUrl : undefined,
    videoUrl: isVideo ? outputUrl : undefined,
    output: outputUrl,
  };
}

