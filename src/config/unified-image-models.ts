/**
 * Unified Image Model Registry
 * Pollinations-only model catalog for image/video generation.
 */

export type ImageProvider = 'pollinations';
export type ImageKind = 'image' | 'video';
export type ImageCategory = 'Standard' | 'Advanced';

export interface UnifiedImageModel {
  id: string;
  name: string;
  provider: ImageProvider;
  kind: ImageKind;
  category?: ImageCategory;
  description?: string;
  supportsReference?: boolean;
  maxImages?: number;
  isFree?: boolean;
  enabled?: boolean;
  supportsAudio?: boolean;
  durationRange?: {
    min?: number;
    max?: number;
    step?: number;
    options?: number[];
  };
}

const POLLINATIONS_MODELS: UnifiedImageModel[] = [
  // STANDARD Image Models
  { id: 'flux', name: 'Flux.1 Fast', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: false, maxImages: 4, isFree: true, enabled: true, description: 'Classic. Fast. Quality!' },
  { id: 'klein-large', name: 'Flux.2 klein 9B', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 1, isFree: true, enabled: true, description: 'FLUX.2 Klein 9B' },
  // Internal fallback for klein-large (9B) when it is unavailable. Not shown in UI.
  { id: 'klein', name: 'Flux.2 klein 4B', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 1, isFree: true, enabled: false, description: 'FLUX.2 Klein 4B (internal fallback for 9B)' },
  { id: 'kontext', name: 'Flux.1 Kontext', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 1, isFree: true, enabled: true, description: 'Context-aware frame editing' },
  { id: 'gpt-image', name: 'GPT-Image', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 4, isFree: true, enabled: false, description: 'GPT Image 1 Mini' },
  { id: 'gptimage-large', name: 'GPT-Image 1.5', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 8, isFree: true, enabled: true, description: 'Advanced OpenAI Image' },
  { id: 'seedream', name: 'Seedream', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 10, isFree: true, enabled: false, description: 'Deprecated - use seedream5' },
  { id: 'seedream5', name: 'Seedream 5', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 10, isFree: true, enabled: false, description: 'Seedream 5.0 Lite - ByteDance' },
  { id: 'nanobanana', name: 'Nano Banana', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 14, isFree: true, enabled: true, description: 'Gemini 2.5 Flash Image' },
  { id: 'zimage', name: 'Z-Image Turbo', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: false, maxImages: 0, isFree: true, enabled: true, description: 'Fast 6B Flux' },

  // ADVANCED Image Models
  { id: 'nanobanana-pro', name: 'Nano Banana Pro', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: true, maxImages: 14, isFree: true, enabled: true, description: 'Gemini 3 Pro Image (4K)' },
  { id: 'nanobanana-2', name: 'Nano Banana 2', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: true, maxImages: 14, isFree: true, enabled: false, description: 'Gemini 3.1 Flash Image' },
  { id: 'seedream-pro', name: 'Seedream Pro', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: true, maxImages: 10, isFree: true, enabled: false, description: 'Deprecated - use seedream5' },

  // STANDARD Video Models
  {
    id: 'seedance',
    name: 'Seedance',
    provider: 'pollinations',
    kind: 'video',
    category: 'Standard',
    supportsReference: true,
    maxImages: 1,
    isFree: true,
    enabled: true,
    description: 'Seedance Lite (BytePlus) (T2V / optional I2V)',
    supportsAudio: false,
    durationRange: { options: [5, 10] },
  },

  // ADVANCED Video Models
  {
    id: 'wan',
    name: 'Wan 2.6',
    provider: 'pollinations',
    kind: 'video',
    category: 'Advanced',
    supportsReference: true,
    isFree: true,
    enabled: true,
    description: '2-15s, 1080p (Alibaba Wan 2.6) (T2V / optional I2V)',
    maxImages: 1,
    supportsAudio: true,
    durationRange: { options: [5, 10, 15] },
  },
  {
    id: 'ltx-2',
    name: 'LTX 2 Fast',
    provider: 'pollinations',
    kind: 'video',
    category: 'Advanced',
    supportsReference: false,
    isFree: true,
    enabled: true,
    description: 'Lightricks LTX 2 (T2V)',
    maxImages: 0,
    supportsAudio: true,
    durationRange: { options: [6, 8, 10] },
  },
];

export const UNIFIED_IMAGE_MODELS: UnifiedImageModel[] = [
  ...POLLINATIONS_MODELS,
];

export interface VisualizeModelGroup {
  key: string;
  label: string;
  category: ImageCategory;
  kind: ImageKind;
  modelIds: string[];
}

const VISUALIZE_MODEL_GROUPS: VisualizeModelGroup[] = [
  {
    key: 'image-free',
    label: 'FREE',
    category: 'Standard',
    kind: 'image',
    modelIds: ['flux', 'zimage'],
  },
  {
    key: 'image-editing',
    label: 'EDITING',
    category: 'Standard',
    kind: 'image',
    modelIds: ['kontext', 'klein-large', 'gptimage-large', 'nanobanana'],
  },
  {
    key: 'image-advanced',
    label: 'ADVANCED',
    category: 'Advanced',
    kind: 'image',
    modelIds: ['nanobanana-pro', 'nanobanana-2', 'seedream5'],
  },
  {
    key: 'video',
    label: 'VIDEO',
    category: 'Advanced',
    kind: 'video',
    modelIds: ['seedance', 'wan', 'ltx-2'],
  },
];

export function getVisualizeModelGroups(): Array<VisualizeModelGroup & { models: UnifiedImageModel[] }> {
  return VISUALIZE_MODEL_GROUPS.map(group => ({
    ...group,
    models: group.modelIds
      .map(id => UNIFIED_IMAGE_MODELS.find(model => model.id === id))
      .filter((model): model is UnifiedImageModel => model !== undefined && (model.enabled ?? true)),
  })).filter(group => group.models.length > 0);
}

export function getUnifiedModel(modelId: string): UnifiedImageModel | undefined {
  return UNIFIED_IMAGE_MODELS.find(m => m.id === modelId);
}

export function getModelsByProvider(provider: ImageProvider): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.provider === provider && (m.enabled ?? true));
}

export function getModelsByKind(kind: ImageKind): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.kind === kind && (m.enabled ?? true));
}

export function getImageModels(): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.kind === 'image' && (m.enabled ?? true));
}

export function getFreeModels(): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.isFree === true && (m.enabled ?? true));
}

export function getStandardModels(kind?: ImageKind): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m =>
    m.category === 'Standard' &&
    (m.enabled ?? true) &&
    (kind ? m.kind === kind : true)
  );
}

export function getAdvancedModels(kind?: ImageKind): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m =>
    m.category === 'Advanced' &&
    (m.enabled ?? true) &&
    (kind ? m.kind === kind : true)
  );
}

const CHAT_IMAGE_MODEL_IDS = ['seedream5', 'zimage', 'nanobanana'];
export function getChatImageModels(): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m =>
    CHAT_IMAGE_MODEL_IDS.includes(m.id) &&
    m.kind === 'image' &&
    (m.enabled ?? true)
  );
}
