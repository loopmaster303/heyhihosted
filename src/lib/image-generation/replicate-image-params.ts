/**
 * Centralized mapping of Replicate model IDs to their expected reference image parameter names.
 * Each Replicate model has its own API schema — this mapping ensures the correct parameter
 * name is used when passing S3 signed URLs as reference images.
 *
 * Single Source of Truth — used by both UnifiedImageTool.tsx and ChatProvider.tsx.
 */
export const REPLICATE_IMAGE_PARAM: Record<string, string> = {
  'flux-2-max': 'input_images',
  'flux-2-klein-9b': 'input_images',
  'flux-2-pro': 'input_images',
  'flux-kontext-pro': 'input_image',
  'grok-imagine-video': 'image_url',
  'wan-video': 'image',
};

/** Models that expect an array of image URLs (vs a single URL string). */
const ARRAY_IMAGE_MODELS = new Set(['flux-2-max', 'flux-2-klein-9b', 'flux-2-pro']);

/**
 * Get the correct image parameter name and value for a Replicate model.
 * Returns null if the model has no mapping (i.e. doesn't support reference images via Replicate).
 */
export function getReplicateImageParam(
  modelId: string,
  referenceUrls: string[]
): { paramName: string; paramValue: string | string[] } | null {
  if (referenceUrls.length === 0) return null;

  const paramName = REPLICATE_IMAGE_PARAM[modelId];
  if (!paramName) return null;

  // Models expecting an array get the full list; others get the first URL as a string
  if (ARRAY_IMAGE_MODELS.has(modelId)) {
    return { paramName, paramValue: referenceUrls };
  }

  return { paramName, paramValue: referenceUrls[0] };
}
