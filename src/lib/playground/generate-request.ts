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

type ParamValue = string | number | boolean;
type LiftableField = 'seed' | 'duration' | 'audio' | 'aspectRatio' | 'quality' | 'transparent' | 'resolution';

/**
 * Felder, die die Server-Route direkt erwartet (Legacy) — und alles, was
 * Pollinations als eigenes Feld braucht: der params-Bag geht serverseitig nur
 * an Pruna, ohne das Heraufheben blieben die Regler wirkungslos.
 * Reihenfolge der Quellen = Vorrang (audio vor save_audio).
 */
const LIFTED_FIELDS: ReadonlyArray<{ field: LiftableField; sources: string[]; type: 'number' | 'string' | 'boolean' }> = [
  { field: 'seed', sources: ['seed'], type: 'number' },
  { field: 'duration', sources: ['duration'], type: 'number' },
  { field: 'audio', sources: ['audio', 'save_audio'], type: 'boolean' },
  { field: 'aspectRatio', sources: ['aspect_ratio'], type: 'string' },
  { field: 'quality', sources: ['quality'], type: 'string' },
  { field: 'transparent', sources: ['transparent'], type: 'boolean' },
  { field: 'resolution', sources: ['resolution'], type: 'string' },
];

function liftTopLevelFields(body: GenerateBody, params: Record<string, ParamValue>, modelId: string): void {
  for (const { field, sources, type } of LIFTED_FIELDS) {
    const source = sources.find((name) => params[name] !== undefined);
    const value = source === undefined ? undefined : params[source];
    if (typeof value === type) (body as Record<LiftableField, ParamValue>)[field] = value as ParamValue;
  }
  // The global request schema only accepts Pollinations resolutions. Pro's
  // 768p value belongs exclusively in its Pruna params bag.
  if (modelId === 'p-video-2-pro') delete body.resolution;
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

  if (params) liftTopLevelFields(body, params, model.id);

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
