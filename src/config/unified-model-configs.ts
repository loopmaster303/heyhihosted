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
    name: 'GPT Image 1 Mini',
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
  'flux-2-dev': {
    id: 'flux-2-dev',
    name: 'Flux.2 Dev',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '1:1' },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'dirtberry': {
    id: 'dirtberry',
    name: 'Dirtberry',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '1:1' },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'imagen-4': {
    id: 'imagen-4',
    name: 'Imagen 4',
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
      { name: 'negative_prompt' },
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
  'qwen-image': {
    id: 'qwen-image',
    name: 'Qwen Image',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'grok-imagine-pro': {
    id: 'grok-imagine-pro',
    name: 'Grok Imagine Pro',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'p-image': {
    id: 'p-image',
    name: 'P-Image',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'p-image-edit': {
    id: 'p-image-edit',
    name: 'P-Image Edit',
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
      { name: 'seed' },
      { name: 'negative_prompt' },
      { name: 'output_format', default: 'mp4', hidden: true },
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
      { name: 'seed' },
      { name: 'negative_prompt' },
      { name: 'output_format', default: 'mp4', hidden: true },
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
      { name: 'seed' },
      { name: 'negative_prompt' },
      { name: 'output_format', default: 'mp4', hidden: true },
    ],
  },
  'wan-fast': {
    id: 'wan-fast',
    name: 'Wan Fast',
    outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '16:9' },
      { name: 'duration', default: 5 },
      { name: 'audio', default: true },
      { name: 'seed' },
      { name: 'negative_prompt' },
      { name: 'output_format', default: 'mp4', hidden: true },
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
  'klein': {
    id: 'klein',
    name: 'Flux.2 Klein 4B',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '1:1' },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'p-video': {
    id: 'p-video',
    name: 'P-Video',
    outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '16:9' },
      { name: 'duration', default: 5 },
      { name: 'audio', default: false },
      { name: 'seed' },
      { name: 'negative_prompt' },
      { name: 'output_format', default: 'mp4', hidden: true },
    ],
  },
  'grok-image': {
    id: 'grok-image',
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
  'grok-video': {
    id: 'grok-video',
    name: 'Grok Video',
    outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '16:9' },
      { name: 'duration', default: 5 },
      { name: 'audio', default: true },
      { name: 'seed' },
      { name: 'output_format', default: 'mp4', hidden: true },
    ],
  },
};

export function getUnifiedModelConfig(modelId: string): UnifiedModelConfig | undefined {
  return unifiedModelConfigs[modelId];
}
