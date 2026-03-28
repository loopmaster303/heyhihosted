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
  byopVisible?: boolean;
  supportsAudio?: boolean;
  durationRange?: {
    min?: number;
    max?: number;
    step?: number;
    options?: number[];
  };
}

export interface VisualModelVisibilityOptions {
  includeByopHidden?: boolean;
}

const POLLINATIONS_MODELS: UnifiedImageModel[] = [
  // STANDARD Image Models
  { id: 'flux', name: 'Flux.1 Fast', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: false, maxImages: 4, isFree: true, enabled: true, description: 'Classic. Fast. Quality!' },
  { id: 'zimage', name: 'Z-Image Turbo', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: false, maxImages: 0, isFree: true, enabled: true, description: 'Fast 6B Flux' },
  { id: 'gpt-image', name: 'GPT Image 1 Mini', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 4, isFree: true, enabled: true, description: 'OpenAI image generation with reference support' },
  { id: 'klein', name: 'Flux.2 Klein 4B', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 1, isFree: true, enabled: true, description: 'FLUX.2 Klein — fast, dense prose prompts, I2I capable' },
  { id: 'kontext', name: 'Flux.1 Kontext', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 1, isFree: false, enabled: false, description: 'Context-aware frame editing' },
  { id: 'gptimage-large', name: 'GPT-Image 1.5', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 8, isFree: false, enabled: false, description: 'Advanced OpenAI Image' },
  { id: 'seedream5', name: 'Seedream 5', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 10, isFree: false, enabled: false, description: 'Seedream 5.0 Lite - ByteDance' },
  { id: 'nanobanana', name: 'Nano Banana', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 14, isFree: false, enabled: false, description: 'Gemini 2.5 Flash Image' },
  { id: 'qwen-image', name: 'Qwen Image', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: true, maxImages: 1, isFree: false, enabled: false, description: 'Qwen image generation and edit model' },
  { id: 'grok-imagine-pro', name: 'Grok Imagine Pro', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: false, maxImages: 0, isFree: false, enabled: false, description: 'Grok premium image generation' },
  { id: 'p-image', name: 'P-Image', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: false, maxImages: 0, isFree: false, enabled: false, description: 'Pollinations image generation' },
  { id: 'p-image-edit', name: 'P-Image Edit', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: true, maxImages: 1, isFree: false, enabled: false, description: 'Pollinations image editing' },

  // ADVANCED Image Models
  { id: 'nanobanana-pro', name: 'Nano Banana Pro', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: true, maxImages: 14, isFree: false, enabled: false, description: 'Gemini 3 Pro Image (4K)' },
  { id: 'nanobanana-2', name: 'Nano Banana 2', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: true, maxImages: 14, isFree: false, enabled: false, description: 'Gemini 3.1 Flash Image' },
  { id: 'grok-image', name: 'Grok Imagine', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: false, maxImages: 0, isFree: true, enabled: true, description: 'Grok Aurora — autoregressive architecture (API alias: grok-imagine)' },

  // STANDARD Video Models
  {
    id: 'seedance',
    name: 'Seedance',
    provider: 'pollinations',
    kind: 'video',
    category: 'Standard',
    supportsReference: true,
    maxImages: 1,
    isFree: false,
    enabled: false,
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
    isFree: false,
    enabled: false,
    description: '2-15s, 1080p (Alibaba Wan 2.6) (T2V / optional I2V)',
    maxImages: 1,
    supportsAudio: true,
    durationRange: { options: [5, 10, 15] },
  },
  {
    id: 'wan-fast',
    name: 'Wan Fast',
    provider: 'pollinations',
    kind: 'video',
    category: 'Advanced',
    supportsReference: true,
    isFree: false,
    enabled: false,
    description: 'Fast Alibaba Wan video generation (T2V / optional I2V)',
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
    isFree: false,
    enabled: false,
    description: 'Lightricks LTX 2 (T2V)',
    maxImages: 0,
    supportsAudio: true,
    durationRange: { options: [6, 8, 10] },
  },
  {
    id: 'grok-video',
    name: 'Grok Video',
    provider: 'pollinations',
    kind: 'video',
    category: 'Advanced',
    supportsReference: true,
    maxImages: 1,
    isFree: true,
    enabled: true,
    description: 'Grok Video — native audio, T2V + I2V',
    supportsAudio: true,
    durationRange: { options: [5, 10] },
  },
  {
    id: 'p-video',
    name: 'P-Video',
    provider: 'pollinations',
    kind: 'video',
    category: 'Advanced',
    supportsReference: true,
    maxImages: 1,
    isFree: false,
    enabled: false,
    description: 'Pollinations video generation',
    supportsAudio: true,
    durationRange: { options: [5, 10] },
  },
];

export const UNIFIED_IMAGE_MODELS: UnifiedImageModel[] = [
  ...POLLINATIONS_MODELS,
];

const POLLINATIONS_IMAGE_MODEL_ALIASES: Record<string, string> = {
  'z-image': 'zimage',
  'z-image-turbo': 'zimage',
  'grok-imagine': 'grok-image',
  'grok-imagine-video': 'grok-video',
  'wan2.6': 'wan',
  'wan-i2v': 'wan',
  'ltxvideo': 'ltx-2',
  'ltx-video': 'ltx-2',
};

export function resolvePollinationsVisualModelId(modelId?: string): string | undefined {
  if (!modelId) return undefined;

  const canonicalModelId = POLLINATIONS_IMAGE_MODEL_ALIASES[modelId] || modelId;
  const model = UNIFIED_IMAGE_MODELS.find((entry) => entry.provider === 'pollinations' && entry.id === canonicalModelId);

  return model?.id;
}

export function isKnownPollinationsVisualModelId(modelId?: string): boolean {
  return !!resolvePollinationsVisualModelId(modelId);
}

export function toPollinationsVisualApiModelId(modelId: string): string {
  switch (modelId) {
    case 'zimage':
      return 'z-image-turbo';
    case 'gpt-image':
      return 'gptimage';
    case 'grok-image':
      return 'grok-imagine';
    default:
      return modelId;
  }
}

export interface VisualizeModelGroup {
  key: string;
  label: string;
  category: ImageCategory;
  kind: ImageKind;
  modelIds: string[];
}

const VISUALIZE_GROUP_DEFINITIONS: VisualizeModelGroup[] = [
  {
    key: 'image-free',
    label: 'IMAGE FREE',
    category: 'Standard',
    kind: 'image',
    modelIds: [],
  },
  {
    key: 'video-free',
    label: 'VIDEO FREE',
    category: 'Standard',
    kind: 'video',
    modelIds: [],
  },
  {
    key: 'image-advanced',
    label: 'IMAGE ADVANCED',
    category: 'Advanced',
    kind: 'image',
    modelIds: [],
  },
  {
    key: 'video-advanced',
    label: 'VIDEO ADVANCED',
    category: 'Advanced',
    kind: 'video',
    modelIds: [],
  },
];

function isVisibleVisualModel(model: UnifiedImageModel, options: VisualModelVisibilityOptions = {}): boolean {
  if (model.enabled ?? true) {
    return true;
  }

  return !!options.includeByopHidden && model.byopVisible !== false;
}

export function getVisualizeModelGroups(
  options: VisualModelVisibilityOptions = {},
): Array<VisualizeModelGroup & { models: UnifiedImageModel[] }> {
  const visibleModels = UNIFIED_IMAGE_MODELS.filter((model) => isVisibleVisualModel(model, options));

  return VISUALIZE_GROUP_DEFINITIONS.map((group) => {
    const models = visibleModels.filter((model) => {
      if (model.kind !== group.kind) {
        return false;
      }

      const isFree = model.isFree === true;
      if (group.key.endsWith('-free')) {
        return isFree;
      }

      return !isFree;
    });

    return {
      ...group,
      modelIds: models.map((model) => model.id),
      models,
    };
  }).filter((group) => group.models.length > 0);
}

export function getUnifiedModel(modelId: string): UnifiedImageModel | undefined {
  return UNIFIED_IMAGE_MODELS.find(m => m.id === modelId);
}

export function getModelsByProvider(provider: ImageProvider, options: VisualModelVisibilityOptions = {}): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.provider === provider && isVisibleVisualModel(m, options));
}

export function getModelsByKind(kind: ImageKind, options: VisualModelVisibilityOptions = {}): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.kind === kind && isVisibleVisualModel(m, options));
}

export function getImageModels(options: VisualModelVisibilityOptions = {}): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.kind === 'image' && isVisibleVisualModel(m, options));
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

const CHAT_IMAGE_MODEL_IDS = ['zimage', 'flux', 'gpt-image'];
export function getChatImageModels(): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m =>
    CHAT_IMAGE_MODEL_IDS.includes(m.id) &&
    m.kind === 'image' &&
    (m.enabled ?? true)
  );
}
