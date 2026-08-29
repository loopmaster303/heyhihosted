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
      { name: 'output_format', default: 'mp4', hidden: true },
    ],
  },
  // ltx-2, pollinations-wan-fast, veo-1080p und grok-video entfernt
  // (2026-08-28, Phase 3 Modellwahrheit) — die IDs existieren in der
  // Live-Registry nicht mehr bzw. sind nur noch Aliase der Kanoniker
  // (veo, grok-video-pro). Siehe Kommentar in unified-image-models.ts.
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
      { name: 'output_format', default: 'mp4', hidden: true },
    ],
  },
  'wan-fast': {
    id: 'wan-fast',
    name: 'Wan Fast',
    outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'seed' },
      { name: 'output_format', default: 'mp4', hidden: true },
    ],
  },
  'veo': {
    id: 'veo', name: 'Veo', outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true }, { name: 'aspect_ratio', default: '16:9' },
      { name: 'duration', default: 4 }, { name: 'audio', default: true }, { name: 'seed' },
      { name: 'output_format', default: 'mp4', hidden: true },
    ],
  },
  'seedance-2.0': {
    id: 'seedance-2.0', name: 'Seedance 2.0', outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true }, { name: 'aspect_ratio', default: '16:9' },
      { name: 'duration', default: 4 }, { name: 'audio', default: true }, { name: 'seed' },
      { name: 'output_format', default: 'mp4', hidden: true },
    ],
  },
  // Die vier fehlenden Regler-Eintraege ergaenzt (Phase 3, T4/F5):
  // p-image-ideogram, p-flux-klein, seedance-pro, nova-reel.
  'p-image-ideogram': {
    id: 'p-image-ideogram', name: 'P-Image Ideogram', outputType: 'image',
    inputs: [
      { name: 'prompt', isPrompt: true }, { name: 'aspect_ratio', default: '1:1' },
      { name: 'seed' }, { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'p-flux-klein': {
    id: 'p-flux-klein', name: 'Flux 2 Klein 4B (Pruna)', outputType: 'image',
    inputs: [
      { name: 'prompt', isPrompt: true }, { name: 'aspect_ratio', default: '1:1' },
      { name: 'seed' }, { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'seedance-pro': {
    id: 'seedance-pro', name: 'Seedance Pro', outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true }, { name: 'aspect_ratio', default: '16:9' },
      { name: 'duration', default: 5 }, { name: 'audio', default: true }, { name: 'seed' },
      { name: 'output_format', default: 'mp4', hidden: true },
    ],
  },
  'nova-reel': {
    id: 'nova-reel', name: 'Nova Reel', outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true }, { name: 'aspect_ratio', default: '16:9' },
      { name: 'duration', default: 6 }, { name: 'seed' },
      { name: 'output_format', default: 'mp4', hidden: true },
    ],
  },
  'wan-pro': {
    id: 'wan-pro', name: 'Wan Pro', outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true }, { name: 'aspect_ratio', default: '16:9' },
      { name: 'duration', default: 5 }, { name: 'audio', default: true }, { name: 'seed' },
      { name: 'output_format', default: 'mp4', hidden: true },
    ],
  },
  'wan-pro-1080p': {
    id: 'wan-pro-1080p', name: 'Wan Pro 1080p', outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true }, { name: 'aspect_ratio', default: '16:9' },
      { name: 'duration', default: 5 }, { name: 'audio', default: true }, { name: 'seed' },
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
      { name: 'audio', default: false },
      { name: 'seed' },
      { name: 'output_format', default: 'mp4', hidden: true },
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
  'grok-video-pro': {
    id: 'grok-video-pro',
    name: 'Grok Imagine Pro Video',
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
  'wan-image': {
    id: 'wan-image',
    name: 'Wan 2.7 Image',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '1:1' },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'wan-image-pro': {
    id: 'wan-image-pro',
    name: 'Wan 2.7 Image Pro',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '1:1' },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'qwen-image-edit-plus': {
    id: 'qwen-image-edit-plus',
    name: 'Qwen Image Edit Plus',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'image' },
      { name: 'aspect_ratio', default: 'match_input_image' },
      { name: 'seed' },
      { name: 'output_format', default: 'webp', hidden: true },
    ],
  },
  'ideogram-v4-turbo': {
    id: 'ideogram-v4-turbo',
    name: 'Ideogram V4 Turbo',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'ideogram-v4-quality': {
    id: 'ideogram-v4-quality',
    name: 'Ideogram V4 Quality',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'nanobanana-2-lite': {
    id: 'nanobanana-2-lite',
    name: 'Nano Banana 2 Lite',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'wan-t2v': {
    id: 'wan-t2v',
    name: 'Wan T2V',
    outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'aspect_ratio', default: '16:9' },
      { name: 'seed' },
      { name: 'output_format', default: 'mp4', hidden: true },
    ],
  },
  'wan-i2v': {
    id: 'wan-i2v',
    name: 'Wan I2V',
    outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'image' },
      { name: 'seed' },
      { name: 'output_format', default: 'mp4', hidden: true },
    ],
  },
  'vace': {
    id: 'vace',
    name: 'VACE',
    outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'image' },
      { name: 'seed' },
      { name: 'output_format', default: 'mp4', hidden: true },
    ],
  },
  'p-image-try-on': {
    id: 'p-image-try-on',
    name: 'P-Image Try-On',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'image' },
      { name: 'aspect_ratio', default: '1:1' },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'p-image-upscale': {
    id: 'p-image-upscale',
    name: 'P-Image Upscale',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'image' },
      { name: 'width', default: 1024 },
      { name: 'height', default: 1024 },
      { name: 'seed' },
      { name: 'output_format', default: 'jpg', hidden: true },
    ],
  },
  'p-video-avatar': {
    id: 'p-video-avatar',
    name: 'P-Video Avatar',
    outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'image' },
      { name: 'seed' },
      { name: 'output_format', default: 'mp4', hidden: true },
    ],
  },
  'p-video-animate': {
    id: 'p-video-animate',
    name: 'P-Video Animate',
    outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'image' },
      { name: 'seed' },
      { name: 'output_format', default: 'mp4', hidden: true },
    ],
  },
  'p-video-replace': {
    id: 'p-video-replace',
    name: 'P-Video Replace',
    outputType: 'video',
    inputs: [
      { name: 'prompt', isPrompt: true },
      { name: 'image' },
      { name: 'seed' },
      { name: 'output_format', default: 'mp4', hidden: true },
    ],
  },
  'wan-image-small': {
    id: 'wan-image-small',
    name: 'Wan Image Small',
    inputs: [
      { name: 'prompt', isPrompt: true },
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
