/**
 * Unified Image Model Registry
 * Combines Pollinations and Replicate models into a single registry
 */

export type ImageProvider = 'pollinations' | 'replicate' | 'mistral';
export type ImageKind = 'image' | 'video';
export type ImageCategory = 'Standard' | 'Advanced';

export interface UnifiedImageModel {
  id: string; // Unique model identifier
  name: string; // Display name
  provider: ImageProvider;
  kind: ImageKind;
  category?: ImageCategory; // Standard = featured, Advanced = expanded popup
  description?: string;
  supportsReference?: boolean; // Can use reference images
  isFree?: boolean; // Free tier available (Pollinations)
  requiresPassword?: boolean; // Requires password (Replicate premium)
  enabled?: boolean; // Whether the model is enabled (default true)
}

/**
 * Pollinations Models (Free tier)
 * Standard: seedream, gpt-image, nanobanana, zimage
 * Advanced: kontext, nanobanana-pro, seedream-pro
 */
const POLLINATIONS_MODELS: UnifiedImageModel[] = [
  // STANDARD Image Models
  { id: 'seedream', name: 'Seedream', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, isFree: true, enabled: true, description: 'ByteDance ARK' },
  { id: 'gpt-image', name: 'GPT-Image', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, isFree: true, enabled: true, description: 'OpenAI Image' },
  { id: 'nanobanana', name: 'Nano Banana', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, isFree: true, enabled: true, description: 'Gemini 2.5 Flash' },
  { id: 'zimage', name: 'Z-Image Turbo', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: false, isFree: true, enabled: true, description: 'Fast 6B' },

  // ADVANCED Image Models
  { id: 'kontext', name: 'Kontext', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: true, isFree: true, enabled: true, description: 'Context-aware' },
  { id: 'nanobanana-pro', name: 'Nano Banana Pro', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: true, isFree: true, enabled: true, description: 'Gemini 3 Pro 4K' },
  { id: 'seedream-pro', name: 'Seedream Pro', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: true, isFree: true, enabled: true, description: 'ByteDance 4K' },

  // STANDARD Video Models
  { id: 'veo', name: 'Veo 3.1', provider: 'pollinations', kind: 'video', category: 'Standard', supportsReference: true, isFree: true, enabled: true, description: 'Google Video' },

  // ADVANCED Video Models
  { id: 'seedance-pro', name: 'Seedance Pro', provider: 'pollinations', kind: 'video', category: 'Advanced', supportsReference: true, isFree: true, enabled: true, description: 'ByteDance Pro' },
];

/**
 * Replicate Models (Premium tier)
 * All Advanced category
 */
const REPLICATE_MODELS: UnifiedImageModel[] = [
  // Video Generation (Advanced)
  { id: 'wan-2.5-t2v', name: 'Wan 2.5 T2V', provider: 'replicate', kind: 'video', category: 'Advanced', supportsReference: false, requiresPassword: false, description: 'Text to Video' },
  { id: 'wan-video', name: 'Wan 2.5 I2V', provider: 'replicate', kind: 'video', category: 'Advanced', supportsReference: true, requiresPassword: false, description: 'Image to Video' },
  { id: 'veo-3.1-fast', name: 'Veo 3.1 Fast', provider: 'replicate', kind: 'video', category: 'Advanced', supportsReference: true, requiresPassword: false, description: 'Fast Video' },

  // Image Generation (Standard - flux-kontext is featured)
  { id: 'flux-kontext-pro', name: 'Flux Kontext Pro', provider: 'replicate', kind: 'image', category: 'Standard', supportsReference: true, requiresPassword: false, description: 'Context Edit' },

  // Image Generation (Advanced)
  { id: 'flux-2-pro', name: 'Flux 2 Pro', provider: 'replicate', kind: 'image', category: 'Advanced', supportsReference: true, requiresPassword: false, description: 'High Quality' },
  { id: 'z-image-turbo', name: 'Z-Image Turbo (Replicate)', provider: 'replicate', kind: 'image', category: 'Advanced', supportsReference: true, requiresPassword: false, description: 'Fast Image', enabled: false },
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

/**
 * Get Standard (featured) models by kind
 */
export function getStandardModels(kind?: ImageKind): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m =>
    m.category === 'Standard' &&
    (m.enabled ?? true) &&
    (kind ? m.kind === kind : true)
  );
}

/**
 * Get Advanced models by kind
 */
export function getAdvancedModels(kind?: ImageKind): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m =>
    m.category === 'Advanced' &&
    (m.enabled ?? true) &&
    (kind ? m.kind === kind : true)
  );
}

/**
 * Chat-only image models (limited selection)
 * Only: seedream, zimage, nanobanana
 */
const CHAT_IMAGE_MODEL_IDS = ['seedream', 'zimage', 'nanobanana'];
export function getChatImageModels(): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m =>
    CHAT_IMAGE_MODEL_IDS.includes(m.id) &&
    m.kind === 'image' &&
    (m.enabled ?? true)
  );
}
