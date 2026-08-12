import { PRUNA_MODEL_IDS, isPrunaModel } from '@/config/pruna-models';
import { getUnifiedModel } from '@/config/unified-image-models';

export interface PlaygroundModelEntry {
  id: string;
  name: string;
  provider: 'pollinations' | 'pruna';
  kind: 'image' | 'video';
  supportsReference: boolean;
  requiresReference: boolean;
  maxImages: number;
  referenceMode?: 'multi-image' | 'start-frame' | 'start-end-frame';
  unmapped: boolean;
  supportsEndFrame: boolean;
  supportsAudio: boolean;
  resolutions?: Array<string>;
  paidOnly: boolean;
  /** Von der Community beigesteuert und als experimentell markiert. */
  community: boolean;
}

export interface PollinationsLiveModel {
  name?: string;
  aliases?: Array<string>;
  title?: string;
  description?: string;
  brand?: string;
  brand_url?: string;
  category?: string;
  input_modalities?: Array<string>;
  output_modalities?: Array<string>;
  video_capabilities?: Array<string>;
  max_reference_images?: number;
  resolutions?: Array<string>;
  paid_only?: boolean;
  alpha?: boolean;
  community?: boolean;
}

export const PRUNA_HIDDEN_IN_PLAYGROUND: ReadonlySet<string> = new Set(['p-image-try-on', 'p-video-avatar']);

const PRUNA_REQUIRES_REF: ReadonlySet<string> = new Set([
  'qwen-image-edit-plus',
  'p-image-edit',
  'p-image-upscale',
  'wan-i2v',
]);

const PRUNA_SUPPORTS_END_FRAME: ReadonlySet<string> = new Set(['wan-i2v', 'p-video']);
const PRUNA_SUPPORTS_AUDIO: ReadonlySet<string> = new Set(['p-video']);

export function buildPrunaEntries(): PlaygroundModelEntry[] {
  return PRUNA_MODEL_IDS
    .filter((id) => !PRUNA_HIDDEN_IN_PLAYGROUND.has(id))
    .map((id) => {
      const cfg = getUnifiedModel(id);
      const isVideo = id.includes('video') || (id.startsWith('wan-') && id.endsWith('v'));
      const kind: 'image' | 'video' = cfg?.kind ?? (isVideo ? 'video' : 'image');
      return {
        id,
        name: cfg?.name ?? id,
        provider: 'pruna' as const,
        kind,
        supportsReference: cfg?.supportsReference ?? false,
        requiresReference: PRUNA_REQUIRES_REF.has(id),
        maxImages: cfg?.maxImages ?? (cfg?.supportsReference ? 1 : 0),
        referenceMode: cfg?.referenceMode,
        unmapped: !cfg,
        supportsEndFrame: PRUNA_SUPPORTS_END_FRAME.has(id),
        supportsAudio: PRUNA_SUPPORTS_AUDIO.has(id),
        paidOnly: true,
        community: false,
      };
    });
}

export function buildPollinationsEntries(live: PollinationsLiveModel[]): PlaygroundModelEntry[] {
  return live
    .filter((m) => !isPrunaModel(m.name ?? ''))
    .map((m) => {
      const cfg = getUnifiedModel(m.name ?? '');
      const out = m.output_modalities ?? [];
      const inp = m.input_modalities ?? [];
      const caps = m.video_capabilities ?? [];
      const isVideo = out.includes('video');
      const maxImages = m.max_reference_images ?? (inp.includes('image') ? 1 : 0);
      return {
        id: m.name ?? '',
        name: m.title ?? cfg?.name ?? (m.name ?? ''),
        provider: 'pollinations' as const,
        kind: isVideo ? ('video' as const) : ('image' as const),
        supportsReference: maxImages > 0,
        requiresReference: isVideo && inp.includes('image') && !inp.includes('text'),
        maxImages,
        referenceMode: caps.includes('end_frame') ? ('start-end-frame' as const) : undefined,
        unmapped: !cfg,
        supportsEndFrame: caps.includes('end_frame'),
        supportsAudio: caps.includes('audio_output'),
        resolutions: m.resolutions,
        paidOnly: m.paid_only ?? false,
        community: m.community ?? false,
      };
    });
}
