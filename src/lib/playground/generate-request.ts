import type { PlaygroundState } from '@/hooks/usePlaygroundState';
import type { PlaygroundModelEntry } from './model-source';

export interface GenerateBody {
  prompt: string;
  model: string;
  aspectRatio?: string;
  duration?: number;
  audio?: boolean;
  seed?: number;
  negative_prompt?: string;
  image?: string | string[];
  srcRefImages?: string[];
  video?: string;
}

export function buildGenerateBody(state: PlaygroundState, model: PlaygroundModelEntry): GenerateBody {
  const body: GenerateBody = { prompt: state.prompt, model: model.id };
  if (state.aspectRatio) body.aspectRatio = state.aspectRatio;
  if (state.durationSeconds != null) body.duration = state.durationSeconds;
  const seedNum = state.seed.trim() ? parseInt(state.seed.trim(), 10) : NaN;
  if (!Number.isNaN(seedNum)) body.seed = seedNum;
  if (state.negativePrompt.trim()) body.negative_prompt = state.negativePrompt.trim();
  if (state.uploads.length > 0) {
    body.image = state.uploads.length === 1 ? state.uploads[0] : [...state.uploads];
  }
  if (state.sourceVideo) body.video = state.sourceVideo;
  return body;
}

export function buildGenerateHeaders(pollenKey?: string, prunaKey?: string): Record<string, string> {
  const h: Record<string, string> = {};
  if (pollenKey) h['X-Pollen-Key'] = pollenKey;
  if (prunaKey) h['X-Pruna-Key'] = prunaKey;
  return h;
}
