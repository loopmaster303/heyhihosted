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
  quality?: string;
  transparent?: boolean;
  resolution?: string;
  image?: string | string[];
  srcRefImages?: string[];
  video?: string;
  params?: Record<string, string | number | boolean>;
}

/**
 * p-video-2 traegt zwei UI-only-Felder, die nie upstream landen duerfen:
 * `duration_auto` selbst, und bei `duration_auto === true` auch `duration`
 * (der Provider bestimmt die Laenge dann selbst). Der Originalzustand bleibt
 * unveraendert — er dient weiter Wiederholung und Bedienelementen.
 */
function cleanedPVideo2Params(
  params: Record<string, string | number | boolean> | undefined,
): Record<string, string | number | boolean> | undefined {
  if (!params) return params;
  const { duration_auto, ...rest } = params;
  if (duration_auto === true) {
    const { duration: _dropDuration, ...withoutDuration } = rest;
    return withoutDuration;
  }
  return rest;
}

export function buildGenerateBody(
  state: PlaygroundState,
  model: PlaygroundModelEntry,
  schema?: ModelParamSchema,
): GenerateBody {
  const body: GenerateBody = { prompt: state.prompt, model: model.id };

  const params = model.id === 'p-video-2' ? cleanedPVideo2Params(state.params) : state.params;

  // Send params from the schema
  if (params && Object.keys(params).length > 0) {
    body.params = params;
  }

  // Legacy support for fields that the server route still expects directly
  const seedVal = params?.seed;
  if (typeof seedVal === 'number') body.seed = seedVal;

  const durationVal = params?.duration;
  if (typeof durationVal === 'number') body.duration = durationVal;

  const audioVal = params?.audio ?? params?.save_audio;
  if (typeof audioVal === 'boolean') body.audio = audioVal;

  const aspectVal = params?.aspect_ratio;
  if (typeof aspectVal === 'string') body.aspectRatio = aspectVal;

  // Der params-Bag geht serverseitig nur an Pruna. Was Pollinations als eigenes
  // Feld erwartet, muss hier heraufgehoben werden, sonst bleiben die Regler wirkungslos.
  const qualityVal = params?.quality;
  if (typeof qualityVal === 'string') body.quality = qualityVal;

  const transparentVal = params?.transparent;
  if (typeof transparentVal === 'boolean') body.transparent = transparentVal;

  const resolutionVal = params?.resolution;
  // The global request schema only accepts Pollinations resolutions. Pro's
  // 768p value belongs exclusively in its Pruna params bag.
  if (model.id !== 'p-video-2-pro' && typeof resolutionVal === 'string') body.resolution = resolutionVal;

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
