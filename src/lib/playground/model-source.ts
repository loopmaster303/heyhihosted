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
}

export interface PollinationsLiveModel {
  id: string;
  outputModalities?: string[];
  inputModalities?: string[];
  name?: string;
}

export const PRUNA_HIDDEN_IN_PLAYGROUND: ReadonlySet<string> = new Set(['p-image-try-on', 'p-video-avatar']);

const PRUNA_REQUIRES_REF: ReadonlySet<string> = new Set(['qwen-image-edit-plus', 'p-image-edit', 'p-image-upscale', 'wan-i2v', 'p-video-animate', 'p-video-replace']);

export function buildPrunaEntries(): PlaygroundModelEntry[] {
  return PRUNA_MODEL_IDS
    .filter((id) => !PRUNA_HIDDEN_IN_PLAYGROUND.has(id))
    .map((id) => {
      const cfg = getUnifiedModel(id);
      const kind: 'image' | 'video' = cfg?.kind ?? (id.includes('video') || (id.startsWith('wan-') && id.endsWith('v')) ? 'video' : 'image');
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
      };
    });
}

export function buildPollinationsEntries(live: PollinationsLiveModel[]): PlaygroundModelEntry[] {
  return live
    .filter((m) => !isPrunaModel(m.id))
    .map((m) => {
      const cfg = getUnifiedModel(m.id);
      const isVideo = (m.outputModalities ?? []).includes('video');
      const acceptsImage = (m.inputModalities ?? []).includes('image');
      return {
        id: m.id,
        name: cfg?.name ?? m.name ?? m.id,
        provider: 'pollinations' as const,
        kind: cfg?.kind ?? (isVideo ? 'video' : 'image'),
        supportsReference: cfg?.supportsReference ?? acceptsImage,
        requiresReference: isVideo && acceptsImage && (m.inputModalities ?? []).length === 1 && (m.inputModalities ?? [])[0] === 'image',
        maxImages: cfg?.maxImages ?? (acceptsImage ? 1 : 0),
        referenceMode: cfg?.referenceMode,
        unmapped: !cfg,
      };
    });
}
