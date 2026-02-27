export type UnifiedOutputType = 'image' | 'video';

export interface UnifiedModelInput {
  name: string;
  default?: any;
  isPrompt?: boolean;
  hidden?: boolean;
}

export interface UnifiedModelConfig {
  id: string;
  name: string;
  inputs: UnifiedModelInput[];
  outputType?: UnifiedOutputType;
}

export const unifiedModelConfigs: Record<string, UnifiedModelConfig> = {
  // Pollinations first (priority in selector)
  'gpt-image': {
    id: 'gpt-image',
    name: 'GPT-Image',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'gptimage-large': {
    id: 'gptimage-large',
    name: 'GPT-Image 1.5',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'flux': {
    id: 'flux',
    name: 'Flux.1 Fast',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '1:1' },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'kontext': {
    id: 'kontext',
    name: 'Flux.1 Kontext',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '1:1' },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'seedream-pro': {
    id: 'seedream-pro',
    name: 'Seedream Pro',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'seedream': {
    id: 'seedream',
    name: 'Seedream',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'nanobanana': {
    id: 'nanobanana',
    name: 'Nano Banana',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'nanobanana-pro': {
    id: 'nanobanana-pro',
    name: 'Nano Banana Pro',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '1:1' },
      { name: 'resolution', default: '2K' },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'seedance': {
    id: 'seedance',
    name: 'Seedance',
    outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '16:9' },
      { name: 'duration', default: 5 },
      { name: 'output_format', default: 'mp4' },
      { name: 'seed' },
    ],
  },
  'ltx-2': {
    id: 'ltx-2',
    name: 'LTX 2 Fast',
    outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '16:9' },
      { name: 'duration', default: 6 },
      { name: 'audio', default: true },
      { name: 'output_format', default: 'mp4' },
      { name: 'seed' },
    ],
  },
  'grok-video': {
    id: 'grok-video',
    name: 'Grok Imagine Video',
    outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '16:9' },
      { name: 'duration', default: 6 },
      { name: 'output_format', default: 'mp4' },
      { name: 'seed' },
    ],
  },

  // Replicate models (image)

  // Pollinations zimage (different from Replicate z-image-turbo)
  'zimage': {
    id: 'zimage',
    name: 'Z-Image Turbo',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'grok-imagine': {
    id: 'grok-imagine',
    name: 'Grok Imagine',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '1:1' },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'z-image-turbo': {
    id: 'z-image-turbo',
    name: 'Z-Image-Turbo',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '1:1' },
      { name: 'output_format', default: 'jpg' },
      { name: 'seed' },
    ],
  },
  'flux-kontext-pro': {
    id: 'flux-kontext-pro',
    name: 'Flux Kontext Pro',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '1:1' },
      { name: 'output_format', default: 'webp' },
      { name: 'seed' },
    ],
  },

  // Replicate models (video)
  'wan-2.5-t2v': {
    id: 'wan-2.5-t2v',
    name: 'Wan 2.5 T2V',
    outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '16:9' },
      { name: 'duration', default: 5 },
      { name: 'audio', default: true },
      { name: 'output_format', default: 'mp4' },
      { name: 'seed' },
    ],
  },
  'wan-video': {
    id: 'wan-video',
    name: 'Wan 2.5 I2V',
    outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '16:9' },
      { name: 'duration', default: 5 },
      { name: 'audio', default: true },
      { name: 'output_format', default: 'mp4' },
      { name: 'seed' },
    ],
  },
  'wan': {
    id: 'wan',
    name: 'Wan 2.6',
    outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '16:9' },
      { name: 'duration', default: 5 },
      { name: 'audio', default: false },
      { name: 'output_format', default: 'mp4' },
      { name: 'seed' },
    ],
  },
  'klein-large': {
    id: 'klein-large',
    name: 'Flux.2 klein 9B',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '1:1' },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },

  // NEW Replicate Models
  'flux-2-max': {
    id: 'flux-2-max',
    name: 'Flux 2 Max (Replicate)',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '1:1' },
      { name: 'resolution', default: '1 MP' },
      { name: 'seed' },
      { name: 'output_quality', default: 100, hidden: true },
      { name: 'safety_tolerance', default: 5, hidden: true },
    ],
  },
  'flux-2-klein-9b': {
    id: 'flux-2-klein-9b',
    name: 'Flux 2 Klein 9B (Replicate)',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '1:1' },
      { name: 'output_megapixels', default: '1' },
      { name: 'output_format', default: 'jpg' },
      { name: 'seed' },
      { name: 'output_quality', default: 100, hidden: true },
      { name: 'disable_safety_checker', default: true, hidden: true },
      { name: 'go_fast', default: false, hidden: true },
    ],
  },
  'grok-imagine-video': {
    id: 'grok-imagine-video',
    name: 'Grok Imagine Video (Replicate)',
    outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '16:9' },
      { name: 'duration', default: 5 },
      { name: 'resolution', default: '720p' },
      { name: 'seed' },
    ],
  },
};

export function getUnifiedModelConfig(modelId: string): UnifiedModelConfig | undefined {
  return unifiedModelConfigs[modelId];
}
