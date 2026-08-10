import type { PlaygroundState } from '@/hooks/usePlaygroundState';
import type { PlaygroundModelEntry } from './model-source';
import type { ModelParamSchema } from './param-schema';

export interface GenerateBody {
  prompt: string;
  model: string;
  aspectRatio?: string;
  duration?: number;
  audio?: boolean;
  seed?: number;
  negative_prompt?: string;
  guidance?: number;
  steps?: number;
  image?: string | string[];
  srcRefImages?: string[];
  video?: string;
  params?: Record<string, string | number | boolean>;
}

export function buildGenerateBody(
  state: PlaygroundState,
  model: PlaygroundModelEntry,
  schema?: ModelParamSchema,
): GenerateBody {
  const body: GenerateBody = { prompt: state.prompt, model: model.id };

  // Send params from the schema
  if (state.params && Object.keys(state.params).length > 0) {
    body.params = state.params;
  }

  // Legacy support for fields that the server route still expects directly
  const seedVal = state.params?.seed;
  if (typeof seedVal === 'number') body.seed = seedVal;

  const durationVal = state.params?.duration;
  if (typeof durationVal === 'number') body.duration = durationVal;

  const audioVal = state.params?.audio ?? state.params?.save_audio;
  if (typeof audioVal === 'boolean') body.audio = audioVal;

  const aspectVal = state.params?.aspect_ratio;
  if (typeof aspectVal === 'string') body.aspectRatio = aspectVal;

  // Handle reference images
  if (model.supportsReference && state.uploads.length > 0) {
    body.image = state.uploads.length === 1 ? state.uploads[0] : [...state.uploads];
  }

  // Handle source video
  if (state.sourceVideo) body.video = state.sourceVideo;

  return body;
}

export function buildGenerateHeaders(pollenKey?: string, prunaKey?: string): Record<string, string> {
  const h: Record<string, string> = {};
  if (pollenKey) h['X-Pollen-Key'] = pollenKey;
  if (prunaKey) h['X-Pruna-Key'] = prunaKey;
  return h;
}
