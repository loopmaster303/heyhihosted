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
  'seedream5': {
    id: 'seedream5',
    name: 'Seedream 5',
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
  'nanobanana-2': {
    id: 'nanobanana-2',
    name: 'Nano Banana 2',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
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
};

export function getUnifiedModelConfig(modelId: string): UnifiedModelConfig | undefined {
  return unifiedModelConfigs[modelId];
}
