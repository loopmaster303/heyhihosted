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
    name: 'Flux1 Kontext',
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
  'seedance-fast': {
    id: 'seedance-fast',
    name: 'Seedance Fast',
    outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '16:9' },
      { name: 'duration', default: 5 },
      { name: 'output_format', default: 'mp4' },
      { name: 'seed' },
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
  'ltx-video': {
    id: 'ltx-video',
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
  'veo': {
    id: 'veo',
    name: 'Veo',
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
  'veo-3.1-fast': {
    id: 'veo-3.1-fast',
    name: 'Veo 3.1 Fast',
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
  'flux-2-dev': {
    id: 'flux-2-dev',
    name: 'Flux 2 Dev',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '1:1' },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'klein-large': {
    id: 'klein-large',
    name: 'Flux.2 klein 9b',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '1:1' },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
};

export function getUnifiedModelConfig(modelId: string): UnifiedModelConfig | undefined {
  return unifiedModelConfigs[modelId];
}