/**
 * Unified Image Model Registry
 * Combines Pollinations and Replicate models into a single registry
 */

export type ImageProvider = 'pollinations' | 'replicate' | 'mistral';
export type ImageKind = 'image' | 'video';

export interface UnifiedImageModel {
  id: string; // Unique model identifier
  name: string; // Display name
  provider: ImageProvider;
  kind: ImageKind;
  description?: string;
  supportsReference?: boolean; // Can use reference images
  isFree?: boolean; // Free tier available (Pollinations)
  requiresPassword?: boolean; // Requires password (Replicate premium)
  enabled?: boolean; // Whether the model is enabled (default true)
}

/**
 * Pollinations Models (Free tier)
 */
const POLLINATIONS_MODELS: UnifiedImageModel[] = [
  { id: 'kontext', name: 'Kontext', provider: 'pollinations', kind: 'image', supportsReference: true, isFree: true, enabled: false },
  { id: 'nanobanana', name: 'Nano Banana', provider: 'pollinations', kind: 'image', supportsReference: true, isFree: true, enabled: false },
  { id: 'nanobanana-pro', name: 'Nano Banana Pro', provider: 'pollinations', kind: 'image', supportsReference: true, isFree: true, enabled: false },
  { id: 'seedream', name: 'Seedream', provider: 'pollinations', kind: 'image', supportsReference: true, isFree: true, enabled: false },
  { id: 'seedream-pro', name: 'Seedream Pro', provider: 'pollinations', kind: 'image', supportsReference: true, isFree: true, enabled: false },
  { id: 'gpt-image', name: 'GPT-Image', provider: 'pollinations', kind: 'image', supportsReference: true, isFree: true, enabled: false },
  // Video models excluded for chat, but available for image-gen tools
  { id: 'seedance', name: 'Seedance', provider: 'pollinations', kind: 'video', supportsReference: true, isFree: true, enabled: false },
  { id: 'seedance-pro', name: 'Seedance Pro', provider: 'pollinations', kind: 'video', supportsReference: true, isFree: true, enabled: false },
  { id: 'veo', name: 'Veo', provider: 'pollinations', kind: 'video', supportsReference: true, isFree: true, enabled: false },
];

/**
 * Replicate Models (Premium tier)
 */
const REPLICATE_MODELS: UnifiedImageModel[] = [
  // --- New User Requested Models ---
  // Video Generation (Wan 2.5)
  { id: 'wan-2.5-t2v', name: 'Wan 2.5 T2V', provider: 'replicate', kind: 'video', requiresPassword: false, description: 'Text to Video' },
  { id: 'wan-video', name: 'Wan 2.5 I2V', provider: 'replicate', kind: 'video', supportsReference: true, requiresPassword: false, description: 'Image to Video' },

  // Video Generation (Veo)
  { id: 'veo-3.1-fast', name: 'Veo 3.1 Fast', provider: 'replicate', kind: 'video', supportsReference: true, requiresPassword: false, description: 'Fast Video Generation' },

  // Image Generation (Flux)
  { id: 'flux-2-pro', name: 'Flux 2 Pro', provider: 'replicate', kind: 'image', supportsReference: true, requiresPassword: false, description: 'High Quality Image Generation' },
  { id: 'flux-kontext-pro', name: 'Flux Kontext Pro', provider: 'replicate', kind: 'image', supportsReference: true, requiresPassword: false, description: 'Context Aware Generation' },

  // Image Generation (Turbo)
  { id: 'z-image-turbo', name: 'Z-Image Turbo', provider: 'replicate', kind: 'image', supportsReference: true, requiresPassword: false, description: 'Fast Image Generation' },


  // --- Legacy / Other Models (Kept for compatibility if needed, but deprioritized) ---
  // Note: nano-banana-pro is a Pollinations model, not Replicate
];

/**
 * Mistral Models (for image generation capabilities)
 * Note: Mistral models are primarily for text but can be used for prompt enhancement
 */
const MISTRAL_MODELS: UnifiedImageModel[] = [
  {
    id: 'mistral-large-3',
    name: 'Mistral Large 3',
    provider: 'mistral',
    kind: 'image',
    description: 'Advanced prompt enhancement for image generation',
    supportsReference: false,
    isFree: false,
    enabled: true
  },
  {
    id: 'mistral-medium-3.1',
    name: 'Mistral Medium 3.1',
    provider: 'mistral',
    kind: 'image',
    description: 'Balanced prompt enhancement for image generation',
    supportsReference: false,
    isFree: false,
    enabled: true
  },
  {
    id: 'mistral-small-3',
    name: 'Mistral Small 3',
    provider: 'mistral',
    kind: 'image',
    description: 'Fast prompt enhancement for image generation',
    supportsReference: false,
    isFree: false,
    enabled: true
  },
];

/**
 * All unified models
 */
export const UNIFIED_IMAGE_MODELS: UnifiedImageModel[] = [
  ...POLLINATIONS_MODELS,
  ...REPLICATE_MODELS,
  ...MISTRAL_MODELS,
];

/**
 * Get model by ID
 */
export function getUnifiedModel(modelId: string): UnifiedImageModel | undefined {
  return UNIFIED_IMAGE_MODELS.find(m => m.id === modelId);
}

/**
 * Get models by provider
 */
export function getModelsByProvider(provider: ImageProvider): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.provider === provider && (m.enabled ?? true));
}

/**
 * Get models by kind
 */
export function getModelsByKind(kind: ImageKind): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.kind === kind && (m.enabled ?? true));
}

/**
 * Get image-only models (for chat)
 */
export function getImageModels(): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.kind === 'image' && (m.enabled ?? true));
}

/**
 * Get free models (Pollinations)
 */
export function getFreeModels(): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.isFree === true && (m.enabled ?? true));
}

/**
 * Get premium models (Replicate)
 */
export function getPremiumModels(): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.provider === 'replicate' && (m.enabled ?? true));
}
