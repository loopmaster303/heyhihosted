/**
 * Unified Image Model Registry
 * Combines Pollinations and Replicate models into a single registry
 */

export type ImageProvider = 'pollinations' | 'replicate';
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
}

/**
 * Pollinations Models (Free tier)
 */
const POLLINATIONS_MODELS: UnifiedImageModel[] = [
  { id: 'kontext', name: 'Kontext', provider: 'pollinations', kind: 'image', supportsReference: true, isFree: true },
  { id: 'nanobanana', name: 'Nano Banana', provider: 'pollinations', kind: 'image', supportsReference: true, isFree: true },
  { id: 'nanobanana-pro', name: 'Nano Banana Pro', provider: 'pollinations', kind: 'image', supportsReference: true, isFree: true },
  { id: 'seedream', name: 'Seedream', provider: 'pollinations', kind: 'image', supportsReference: true, isFree: true },
  { id: 'seedream-pro', name: 'Seedream Pro', provider: 'pollinations', kind: 'image', supportsReference: true, isFree: true },
  { id: 'gpt-image', name: 'GPT-Image', provider: 'pollinations', kind: 'image', supportsReference: true, isFree: true },
  // Video models excluded for chat, but available for image-gen tools
  { id: 'seedance', name: 'Seedance', provider: 'pollinations', kind: 'video', supportsReference: true, isFree: true },
  { id: 'seedance-pro', name: 'Seedance Pro', provider: 'pollinations', kind: 'video', supportsReference: true, isFree: true },
  { id: 'veo', name: 'Veo', provider: 'pollinations', kind: 'video', supportsReference: true, isFree: true },
];

/**
 * Replicate Models (Premium tier)
 */
const REPLICATE_MODELS: UnifiedImageModel[] = [
  // New Unified Models (for /visualizepro)
  // Image Models - Replicate
  { id: 'flux-2-pro', name: 'Flux 2 Pro', provider: 'replicate', kind: 'image', supportsReference: true, requiresPassword: true },
  { id: 'nano-banana-pro', name: 'Nano Banana Pro', provider: 'replicate', kind: 'image', supportsReference: true, requiresPassword: true },
  { id: 'z-image-turbo', name: 'Z-Image-Turbo', provider: 'replicate', kind: 'image', requiresPassword: true },
  { id: 'qwen-image-edit-plus', name: 'Qwen Image Edit Plus', provider: 'replicate', kind: 'image', supportsReference: true, requiresPassword: true },
  { id: 'flux-kontext-pro', name: 'Flux Kontext Pro', provider: 'replicate', kind: 'image', supportsReference: true, requiresPassword: true },
  
  // Video Models - Replicate
  { id: 'wan-2.5-t2v', name: 'Wan 2.5 T2V', provider: 'replicate', kind: 'video', requiresPassword: true },
  { id: 'wan-video', name: 'Wan 2.5 I2V', provider: 'replicate', kind: 'video', supportsReference: true, requiresPassword: true },
  { id: 'veo-3.1-fast', name: 'Veo 3.1 Fast', provider: 'replicate', kind: 'video', supportsReference: true, requiresPassword: true },
  
  // Image Models - Pollinations
  { id: 'seedream-pro', name: 'Seedream Pro', provider: 'pollinations', kind: 'image', supportsReference: true, isFree: true },
  
  // Video Models - Pollinations
  { id: 'seedance-pro', name: 'Seedance Pro', provider: 'pollinations', kind: 'video', supportsReference: true, isFree: true },
  { id: 'veo', name: 'Veo', provider: 'pollinations', kind: 'video', isFree: true },
  
  // Old Models (for /image-gen/raw - kept for backward compatibility)
  { id: 'wan-2.2-image', name: 'WAN 2.2 Image', provider: 'replicate', kind: 'image', requiresPassword: true },
  { id: 'flux-krea-dev', name: 'Flux Krea Dev', provider: 'replicate', kind: 'image', requiresPassword: true },
  { id: 'flux-kontext-pro', name: 'Flux Kontext Pro', provider: 'replicate', kind: 'image', supportsReference: true, requiresPassword: true },
  { id: 'qwen-image', name: 'Qwen Image', provider: 'replicate', kind: 'image', requiresPassword: true },
  { id: 'nano-banana', name: 'Nano Banana', provider: 'replicate', kind: 'image', supportsReference: true, requiresPassword: true },
  { id: 'runway-gen4', name: 'Runway Gen4', provider: 'replicate', kind: 'image', supportsReference: true, requiresPassword: true },
  { id: 'ideogram-character', name: 'Ideogram Character', provider: 'replicate', kind: 'image', supportsReference: true, requiresPassword: true },
  
  // Image Editors
  { id: 'qwen-image-edit', name: 'Qwen Image Edit', provider: 'replicate', kind: 'image', supportsReference: true, requiresPassword: true },
  
  // Video Generators
  { id: 'wan-video', name: 'WAN Video', provider: 'replicate', kind: 'video', requiresPassword: true },
  { id: 'wan-2.5-t2v', name: 'WAN 2.5 T2V', provider: 'replicate', kind: 'video', requiresPassword: true },
  { id: 'veo-3-fast', name: 'Veo 3 Fast', provider: 'replicate', kind: 'video', requiresPassword: true },
  { id: 'hailuo-02', name: 'Hailuo 02', provider: 'replicate', kind: 'video', requiresPassword: true },
];

/**
 * All unified models
 */
export const UNIFIED_IMAGE_MODELS: UnifiedImageModel[] = [
  ...POLLINATIONS_MODELS,
  ...REPLICATE_MODELS,
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
  return UNIFIED_IMAGE_MODELS.filter(m => m.provider === provider);
}

/**
 * Get models by kind
 */
export function getModelsByKind(kind: ImageKind): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.kind === kind);
}

/**
 * Get image-only models (for chat)
 */
export function getImageModels(): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.kind === 'image');
}

/**
 * Get free models (Pollinations)
 */
export function getFreeModels(): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.isFree === true);
}

/**
 * Get premium models (Replicate)
 */
export function getPremiumModels(): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.provider === 'replicate');
}
