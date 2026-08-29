/**
 * Unified Image Model Registry
 * Pollinations-only model catalog for image/video generation.
 */

export type ImageProvider = 'pollinations' | 'pruna';
export type ImageKind = 'image' | 'video';
export type ImageCategory = 'Standard' | 'Advanced';
export type ReferenceMode = 'multi-image' | 'start-frame' | 'start-end-frame';
export type TemporalControl =
  | { mode: 'seconds'; min: number; max: number; step: number; options?: number[]; defaultSeconds: number }
  | {
      mode: 'frame-backed-seconds';
      fps: number;
      minFrames: number;
      maxFrames: number;
      secondOptions: number[];
      defaultSeconds: number;
    }
  | { mode: 'speech-driven' }
  | { mode: 'source-video-driven' }
  | { mode: 'fixed-frames'; frames: number };

export interface UnifiedImageModel {
  id: string;
  name: string;
  provider: ImageProvider;
  kind: ImageKind;
  category?: ImageCategory;
  description?: string;
  supportsReference?: boolean;
  maxImages?: number;
  isFree?: boolean;
  enabled?: boolean;
  byopVisible?: boolean;
  supportsAudio?: boolean;
  supportsPromptEnhance?: boolean;
  supportsEndFrame?: boolean;
  referenceMode?: ReferenceMode;
  temporalControl?: TemporalControl;
  durationRange?: {
    min?: number;
    max?: number;
    step?: number;
    options?: number[];
  };
}

export interface VisualModelVisibilityOptions {
  includeByopHidden?: boolean;
}

export interface ProviderEntitlements {
  hasPollenKey: boolean;
  prunaAvailable: boolean;
}

export function shouldIncludeByopHidden(
  provider: ImageProvider,
  entitlements: ProviderEntitlements,
): boolean {
  return provider === 'pruna' ? entitlements.prunaAvailable : entitlements.hasPollenKey;
}

export function getDurationOptionsSeconds(model?: UnifiedImageModel): number[] {
  const temporalControl = model?.temporalControl;
  if (temporalControl?.mode === 'seconds') {
    if (temporalControl.options) return temporalControl.options;
    const count = Math.floor((temporalControl.max - temporalControl.min) / temporalControl.step) + 1;
    return Array.from({ length: count }, (_, index) =>
      temporalControl.min + index * temporalControl.step
    );
  }
  if (temporalControl?.mode === 'frame-backed-seconds') {
    return temporalControl.secondOptions;
  }
  if (temporalControl) return [];
  return model?.durationRange?.options ?? [];
}

export function getDefaultDurationSeconds(
  model?: UnifiedImageModel,
  legacyConfigDefault?: number,
): number | undefined {
  const temporalControl = model?.temporalControl;
  if (temporalControl?.mode === 'seconds' || temporalControl?.mode === 'frame-backed-seconds') {
    return temporalControl.defaultSeconds;
  }
  if (temporalControl) return undefined;
  return legacyConfigDefault ?? model?.durationRange?.options?.[0];
}

const POLLINATIONS_MODELS: UnifiedImageModel[] = [
  // STANDARD Image Models
  { id: 'flux', name: 'Flux.1 Fast', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: false, maxImages: 4, isFree: true, enabled: true, description: 'Classic. Fast. Quality!' },
  { id: 'zimage', name: 'Z-Image Turbo', provider: 'pruna', kind: 'image', category: 'Standard', supportsReference: false, maxImages: 0, isFree: false, enabled: false, byopVisible: true, description: 'ByteDance Z-Image Turbo (Seedream-family)' },
  // Pruna ist BYOP-only (Entscheidung 2026-08-28): kein PRUNA_API_KEY auf Vercel.
  // isFree: true war hier ein falsches Versprechen — ohne eigenen Schluessel
  // antwortet der Pruna-Dispatch mit 503. Die Registry fuehrt zimage zwar als
  // kostenlos (und der Server-Key liefe darauf), aber der Dispatch haengt am
  // Modell, nicht am Schalter; eine Pollinations-Anbindung waere eine
  // Provider-Entscheidung und gehoert nicht in diese Phase.
  { id: 'gpt-image', name: 'GPT Image 1 Mini', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 16, isFree: true, enabled: true, description: 'OpenAI image generation with reference support' },
  { id: 'klein', name: 'Flux.2 Klein 4B', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 10, isFree: true, enabled: true, description: 'FLUX.2 Klein — fast, dense prose prompts, I2I capable' },
  { id: 'kontext', name: 'Flux.1 Kontext', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 1, isFree: true, enabled: false, description: 'Context-aware frame editing' },
  // kontext ist registry-frei, aber nicht auf der Allowlist des Server-Keys:
  // live geprueft 2026-08-28 → 403 "Model 'kontext' is not allowed for this
  // API key". Fuer keylose Nutzer war das FREE-Gruppe mit Garantie-Fehler.
  // Wieder freigeben, sobald der Server-Key das Modell erlaubt.
  { id: 'gptimage-large', name: 'GPT-Image 1.5', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 16, isFree: true, enabled: false, description: 'Advanced OpenAI Image' },
  // gptimage-large: derselbe live-Beleg wie kontext — 403 am Server-Key
  // (2026-08-28), obwohl registry-frei. Nach Allowlist-Erweiterung aktivieren.
  { id: 'seedream', name: 'Seedream 5', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 10, isFree: false, enabled: false, byopVisible: false, description: 'Seedream 5.0 Lite - ByteDance (stale — use seedream5 via BYOP when re-enabled)' },
  { id: 'nanobanana', name: 'Nano Banana', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 3, isFree: false, enabled: false, byopVisible: true, description: 'Gemini 2.5 Flash Image' },
  { id: 'qwen-image', name: 'Qwen Image', provider: 'pruna', kind: 'image', category: 'Advanced', supportsReference: true, maxImages: 1, isFree: false, enabled: false, byopVisible: true, description: 'Qwen image generation and edit model' },
  // Auch hier E-A: Pruna-Dispatch braucht immer einen eigenen Schluessel
  // (BYOP-only, 2026-08-28). isFree: true versprach kostenlos, geliefert wurde 503.
  { id: 'grok-imagine-pro', name: 'Grok Imagine Pro', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: true, maxImages: 1, isFree: false, enabled: false, byopVisible: true, description: 'Grok premium image generation' },
  { id: 'wan-image', name: 'Wan 2.7 Image', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: true, maxImages: 9, isFree: false, enabled: false, byopVisible: true, description: 'Alibaba Wan 2.7 image generation' },
  { id: 'wan-image-pro', name: 'Wan 2.7 Image Pro', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: true, maxImages: 9, isFree: false, enabled: false, byopVisible: true, description: 'Alibaba Wan 2.7 Pro image generation' },
   { id: 'p-image', name: 'P-Image', provider: 'pruna', kind: 'image', category: 'Advanced', supportsReference: false, maxImages: 0, isFree: false, enabled: true, byopVisible: true, description: 'Pruna P-Image — performance text-to-image, <1s inference' },
   { id: 'p-image-edit', name: 'P-Image Edit', provider: 'pruna', kind: 'image', category: 'Advanced', supportsReference: true, maxImages: 5, isFree: false, enabled: true, byopVisible: true, description: 'Pruna P-Image-Edit — multi-image editing with text rendering' },

  // ADVANCED Image Models
  { id: 'nanobanana-pro', name: 'Nano Banana Pro', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: true, maxImages: 14, isFree: false, enabled: false, byopVisible: true, description: 'Gemini 3 Pro Image (4K)' },
  { id: 'nanobanana-2', name: 'Nano Banana 2', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: true, maxImages: 14, isFree: false, enabled: false, byopVisible: true, description: 'Gemini 3.1 Flash Image' },
  { id: 'grok-imagine', name: 'Grok Imagine', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: true, maxImages: 1, isFree: false, enabled: false, byopVisible: true, description: 'Grok Aurora — autoregressive architecture' },
  // grok-imagine/ideogram-v4-turbo sind live paid_only (2026-08-28) — sie standen
  // unter "FREE" und liefen in 402/403. Mit Pollen-Schluessel via BYOP sichtbar.
  { id: 'qwen-image-edit-plus', name: 'Qwen Image Edit Plus', provider: 'pruna', kind: 'image', category: 'Advanced', supportsReference: true, maxImages: 2, isFree: false, enabled: true, byopVisible: true, description: 'Qwen Image Edit Plus — multi-image editing with pose transfer' },
  { id: 'ideogram-v4-turbo', name: 'Ideogram V4 Turbo', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: false, maxImages: 0, isFree: false, enabled: false, byopVisible: true, description: 'Ideogram V4 Turbo — fast text rendering' },
  { id: 'ideogram-v4-quality', name: 'Ideogram V4 Quality', provider: 'pollinations', kind: 'image', category: 'Advanced', supportsReference: false, maxImages: 0, isFree: false, enabled: false, byopVisible: true, description: 'Ideogram V4 Quality — highest-quality text rendering' },
   { id: 'nanobanana-2-lite', name: 'Nano Banana 2 Lite', provider: 'pollinations', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 14, isFree: false, enabled: false, byopVisible: true, description: 'Gemini Flash Lite Image' },
   { id: 'wan-image-small', name: 'Wan Image Small', provider: 'pruna', kind: 'image', category: 'Standard', supportsReference: false, maxImages: 0, isFree: false, enabled: false, byopVisible: true, description: 'Fast, efficient image generation via Pruna' },
  // Letzter E-A-Fall: das Modell existiert bei Pollinations nicht mehr (auch
  // nicht als Alias), der Pruna-Dispatch ist BYOP-only. Ohne eigenen
  // Schluessel war "kostenlos" schlicht falsch.
   { id: 'p-image-try-on', name: 'P-Image Try-On', provider: 'pruna', kind: 'image', category: 'Advanced', supportsReference: true, maxImages: 7, isFree: false, enabled: true, byopVisible: true, description: 'Virtual garment try-on (person + up to 6 garments)' },
   { id: 'p-image-ideogram', name: 'P-Image Ideogram', provider: 'pruna', kind: 'image', category: 'Advanced', supportsReference: false, maxImages: 0, isFree: false, enabled: true, byopVisible: true, description: 'Pruna Ideogram — advanced text rendering and illustration' },
   { id: 'p-flux-klein', name: 'Flux 2 Klein 4B (Pruna)', provider: 'pruna', kind: 'image', category: 'Standard', supportsReference: true, maxImages: 5, isFree: false, enabled: true, byopVisible: true, description: 'Pruna FLUX.2 Klein 4B — fast, dense prose prompts, up to 5 reference images' },
   { id: 'p-image-upscale', name: 'P-Image Upscale', provider: 'pruna', kind: 'image', category: 'Advanced', supportsReference: true, maxImages: 1, isFree: false, enabled: true, byopVisible: true, description: 'AI image upscaling 1-128 MP with detail enhancement' },

  // STANDARD Video Models
  {
    id: 'seedance-pro',
    name: 'Seedance Pro',
    provider: 'pollinations',
    kind: 'video',
    category: 'Standard',
    supportsReference: true,
    maxImages: 1,
    isFree: false,
    enabled: false,
    description: 'Seedance Pro (BytePlus) (T2V / optional I2V)',
    supportsAudio: false,
    durationRange: { options: [5, 10] },
  },

  // ADVANCED Video Models
  {
    id: 'wan',
    name: 'Wan 2.6',
    provider: 'pollinations',
    kind: 'video',
    category: 'Advanced',
    supportsReference: true,
    isFree: false,
    enabled: false,
    description: '2-15s, 1080p (Alibaba Wan 2.6) (T2V / optional I2V)',
    maxImages: 1,
    supportsAudio: true,
    supportsEndFrame: false,
    durationRange: { options: [5, 10, 15] },
  },
  {
    // Namenskollision bewusst dokumentiert statt umbenannt: die ID `wan-fast`
    // ist im Repo an den Pruna-Dispatch gebunden (PRUNA_MODEL_MAP), das
    // Pollinations-Modell `wan-fast` (paid) ist davon ein anderes und wird im
    // Playground als Pruna-Kopie herausgefiltert. Umbenennen wuerde Dispatch,
    // Regler und Icons anfassen — kein Verhaltensgewinn bei einem
    // deaktivierten Eintrag.
    id: 'wan-fast',
    name: 'Wan Pruna',
    provider: 'pruna',
    kind: 'video',
    category: 'Advanced',
    supportsReference: true,
    isFree: false,
    enabled: false,
    description: 'Wan video via Pruna — seconds are translated to provider frames',
    maxImages: 2,
    supportsAudio: false,
    supportsEndFrame: true,
    temporalControl: {
      mode: 'frame-backed-seconds',
      fps: 16,
      minFrames: 81,
      maxFrames: 121,
      secondOptions: [5, 6, 7, 7.5],
      defaultSeconds: 5,
    },
  },
  // ltx-2 entfernt (2026-08-28): existiert nicht mehr in der Live-Registry
  // (weder Name noch Alias). Regler, Icon und Enhancement-Prompt wurden mit
  // entfernt; gespeicherte Auswahlen fallen aufs Vorgabemodell zurueck.
  {
    id: 'grok-video-pro',
    name: 'Grok Imagine Pro Video',
    provider: 'pollinations',
    kind: 'video',
    category: 'Advanced',
    supportsReference: true,
    maxImages: 1,
    isFree: false,
    enabled: false,
    byopVisible: true,
    description: 'Grok premium video generation',
    supportsAudio: true,
    supportsEndFrame: false,
    durationRange: { options: [5, 10] },
  },
  {
    id: 'p-video',
    name: 'P-Video',
    provider: 'pruna',
    kind: 'video',
    category: 'Advanced',
    supportsReference: true,
    maxImages: 2,
    isFree: false,
    enabled: true,
    byopVisible: true,
    description: 'Pruna P-Video — performance video generation with audio sync',
    supportsAudio: true,
    supportsEndFrame: true,
    temporalControl: { mode: 'seconds', min: 1, max: 20, step: 1, defaultSeconds: 5 },
  },
  {
    id: 'p-video-avatar',
    name: 'P-Video Avatar',
    provider: 'pruna',
    kind: 'video',
    category: 'Advanced',
    supportsReference: true,
    maxImages: 1,
    isFree: false,
    enabled: true,
    byopVisible: true,
    description: 'Talking head avatar video from image + script/audio',
    supportsAudio: false,
    temporalControl: { mode: 'speech-driven' },
  },
  {
    id: 'p-video-animate',
    name: 'P-Video Animate',
    provider: 'pruna',
    kind: 'video',
    category: 'Advanced',
    supportsReference: true,
    maxImages: 1,
    isFree: false,
    enabled: true,
    byopVisible: true,
    description: 'Animate subject with motion from source video',
    supportsAudio: true,
    temporalControl: { mode: 'source-video-driven' },
  },
  {
    id: 'p-video-replace',
    name: 'P-Video Replace',
    provider: 'pruna',
    kind: 'video',
    category: 'Advanced',
    supportsReference: true,
    maxImages: 3,
    isFree: false,
    enabled: true,
    byopVisible: true,
    description: 'Replace characters in video while preserving motion',
    supportsAudio: true,
    referenceMode: 'multi-image',
    temporalControl: { mode: 'source-video-driven' },
  },

  // New video models from 2026-06-01 Pollinations API audit (disabled until BYOP flow ready)
  {
    id: 'veo',
    name: 'Veo',
    provider: 'pollinations',
    kind: 'video',
    category: 'Advanced',
    supportsReference: true,
    maxImages: 2,
    isFree: false,
    enabled: false,
    byopVisible: true,
    description: 'Google Veo — highest quality, native audio + end frame',
    supportsAudio: true,
    supportsEndFrame: true,
    durationRange: { options: [4, 6, 8] },
  },
  // veo-1080p entfernt (2026-08-28): Registry-Alias von `veo` — als eigenes
  // Modell gefuehrt schlug der Registry-Lookup fehl. Der interne Alias unten
  // haelt gespeicherte Auswahlen am Leben.
  {
    id: 'seedance-2.0',
    name: 'Seedance 2.0',
    provider: 'pollinations',
    kind: 'video',
    category: 'Advanced',
    supportsReference: true,
    maxImages: 2,
    isFree: false,
    enabled: false,
    byopVisible: true,
    description: 'Seedance 2.0 — native audio + end frame support',
    supportsAudio: true,
    supportsEndFrame: true,
    durationRange: { options: [4, 8, 12, 15] },
  },
  // pollinations-wan-fast entfernt (2026-08-28): existiert in der Registry
  // nicht (weder Name noch Alias) — `wan-fast` ist ein eigenes, anderes
  // Pollinations-Modell und die ID im Repo vom Pruna-Dispatch belegt.
  {
    id: 'wan-pro',
    name: 'Wan Pro',
    provider: 'pollinations',
    kind: 'video',
    category: 'Advanced',
    supportsReference: true,
    maxImages: 2,
    isFree: false,
    enabled: false,
    byopVisible: true,
    description: 'Wan 2.7 Pro — 1080p, native audio',
    supportsAudio: true,
    supportsEndFrame: true,
    durationRange: { options: [5, 10, 15] },
  },
  {
    id: 'wan-pro-1080p', name: 'Wan Pro 1080p', provider: 'pollinations', kind: 'video', category: 'Advanced',
    supportsReference: true, maxImages: 2, isFree: false, enabled: false, byopVisible: true,
    description: 'Wan Pro 1080p — start and end frame', supportsAudio: true, supportsEndFrame: true,
    durationRange: { options: [5, 10, 15] },
  },
  {
    id: 'nova-reel',
    name: 'Nova Reel',
    provider: 'pollinations',
    kind: 'video',
    category: 'Advanced',
    supportsReference: true,
    maxImages: 1,
    isFree: false,
    enabled: false,
    description: 'Nova Reel — long-form video (up to 120s)',
    supportsAudio: false,
    durationRange: { options: [6, 12, 18, 24, 30] },
  },
  // nova-reel ist registry-frei, bleibt aber aus: live geprueft 2026-08-28 —
  // ein 6s-Lauf brach nach 125s mit 524 ab, bevor das Ergebnis da war. Der
  // Dispatch laeuft synchron; das 202-Protokoll deckt nur Pruna ab. Damit ist
  // das Modell ohne weitere Arbeit (Phase 4) nicht anbietbar, auch wenn die
  // Registry es als kostenlos fuehrt.
  {
    id: 'wan-t2v',
    name: 'Wan T2V',
    provider: 'pruna',
    kind: 'video',
    category: 'Advanced',
    supportsReference: false,
    maxImages: 0,
    isFree: false,
    enabled: true,
    description: 'Wan T2V — text-to-video via Pruna',
    supportsAudio: false,
    temporalControl: {
      mode: 'frame-backed-seconds',
      fps: 16,
      minFrames: 81,
      maxFrames: 121,
      secondOptions: [5, 6, 7, 7.5],
      defaultSeconds: 5,
    },
  },
  {
    id: 'wan-i2v',
    name: 'Wan I2V',
    provider: 'pruna',
    kind: 'video',
    category: 'Advanced',
    supportsReference: true,
    maxImages: 2,
    isFree: false,
    enabled: true,
    description: 'Wan I2V — image-to-video via Pruna',
    supportsAudio: false,
    supportsEndFrame: true,
    temporalControl: {
      mode: 'frame-backed-seconds',
      fps: 16,
      minFrames: 81,
      maxFrames: 121,
      secondOptions: [5, 6, 7, 7.5],
      defaultSeconds: 5,
    },
  },
  {
    id: 'vace',
    name: 'VACE',
    provider: 'pruna',
    kind: 'video',
    category: 'Advanced',
    supportsReference: true,
    maxImages: 3,
    isFree: false,
    // Ausgeblendet: ein VACE-Lauf dauert 6-12 Minuten (gemessen 2026-08-26),
    // wovon die Oberflaeche nichts zeigen kann ausser einer wartenden Karte.
    // byopVisible: false, sonst holt ein Pruna-Schluessel es wieder hervor.
    enabled: false,
    byopVisible: false,
    description: 'VACE — video with character consistency via Pruna',
    supportsAudio: false,
    referenceMode: 'multi-image',
    temporalControl: {
      mode: 'frame-backed-seconds',
      fps: 16,
      minFrames: 1,
      maxFrames: 81,
      secondOptions: [1, 2, 3, 4, 5],
      defaultSeconds: 5,
    },
  },
];

export const UNIFIED_IMAGE_MODELS: UnifiedImageModel[] = POLLINATIONS_MODELS;

const POLLINATIONS_IMAGE_MODEL_ALIASES: Record<string, string> = {
  'z-image': 'zimage',
  'z-image-turbo': 'zimage',
  'grok-image': 'grok-imagine',
  'grok-imagine-video': 'grok-video-pro',
  // Entfernte eigene Eintraege, die in der Registry (oder als deren Alias)
  // weiterexistieren — gespeicherte Auswahlen bleiben so bedienbar.
  'grok-video': 'grok-video-pro',
  'veo-1080p': 'veo',
  'wan2.6': 'wan',
  'ideogram': 'ideogram-v4-turbo',
  'nanobanana-lite': 'nanobanana-2-lite',
};

export function resolvePollinationsVisualModelId(modelId?: string): string | undefined {
  if (!modelId) return undefined;

  const canonicalModelId = POLLINATIONS_IMAGE_MODEL_ALIASES[modelId] || modelId;
  const model = UNIFIED_IMAGE_MODELS.find((entry) => (entry.provider === 'pollinations' || entry.provider === 'pruna') && entry.id === canonicalModelId);

  if (!model || !isVisibleVisualModel(model, { includeByopHidden: true })) {
    return undefined;
  }

  return model.id;
}

export function isKnownPollinationsVisualModelId(modelId?: string): boolean {
  return !!resolvePollinationsVisualModelId(modelId);
}

export function toPollinationsVisualApiModelId(modelId: string): string {
  switch (modelId) {
    case 'zimage':
      return 'z-image-turbo';
    case 'gpt-image':
      return 'gptimage';
    case 'grok-image':
      return 'grok-imagine';
    case 'grok-imagine':
      return 'grok-imagine';
    case 'pollinations-wan-fast':
      return 'wan-fast';
    default:
      return modelId;
  }
}

export interface VisualizeModelGroup {
  key: string;
  label: string;
  category: ImageCategory;
  kind: ImageKind;
  modelIds: string[];
}

const VISUALIZE_GROUP_DEFINITIONS: VisualizeModelGroup[] = [
  { key: 'image-free', label: 'IMAGE FREE', category: 'Standard', kind: 'image', modelIds: [] },
  { key: 'video-free', label: 'VIDEO FREE', category: 'Standard', kind: 'video', modelIds: [] },
  { key: 'image-advanced', label: 'IMAGE ADVANCED', category: 'Advanced', kind: 'image', modelIds: [] },
  { key: 'video-advanced', label: 'VIDEO ADVANCED', category: 'Advanced', kind: 'video', modelIds: [] },
];

function isVisibleVisualModel(model: UnifiedImageModel, options: VisualModelVisibilityOptions = {}): boolean {
  if (model.enabled ?? true) {
    return true;
  }

  return !!options.includeByopHidden && model.byopVisible !== false;
}

export function getVisualizeModelGroups(
  options: VisualModelVisibilityOptions = {},
): Array<VisualizeModelGroup & { models: UnifiedImageModel[] }> {
  const visibleModels = UNIFIED_IMAGE_MODELS.filter((model) => isVisibleVisualModel(model, options));

  return VISUALIZE_GROUP_DEFINITIONS.map((group) => {
    const models = visibleModels.filter((model) => {
      if (model.kind !== group.kind) {
        return false;
      }

      const isFree = model.isFree === true;
      if (group.key.endsWith('-free')) {
        return isFree;
      }

      return !isFree;
    });

    return {
      ...group,
      modelIds: models.map((model) => model.id),
      models,
    };
  }).filter((group) => group.models.length > 0);
}

export function getVisualizeModelGroupsForProvider(
  provider: ImageProvider,
  options: VisualModelVisibilityOptions = {},
): Array<VisualizeModelGroup & { models: UnifiedImageModel[] }> {
  const visibleModels = UNIFIED_IMAGE_MODELS.filter(
    (model) => model.provider === provider && isVisibleVisualModel(model, options)
  );

  return VISUALIZE_GROUP_DEFINITIONS.map((group) => {
    const models = visibleModels.filter((model) => {
      if (model.kind !== group.kind) {
        return false;
      }

      const isFree = model.isFree === true;
      if (group.key.endsWith('-free')) {
        return isFree;
      }

      return !isFree;
    });

    return {
      ...group,
      modelIds: models.map((model) => model.id),
      models,
    };
  }).filter((group) => group.models.length > 0);
}

export function getUnifiedModel(modelId: string): UnifiedImageModel | undefined {
  return UNIFIED_IMAGE_MODELS.find(m => m.id === modelId);
}

/**
 * Whether a generated asset for this model ends up in Pollinations Media Storage.
 * Pruna results are returned as raw media when no Pollen token is present, so
 * they have to be stored as a local blob instead of a remote URL.
 * Unknown models are treated as Pollinations-hosted (the historical default).
 */
export function isPollinationsHostedModel(modelId: string): boolean {
  const provider = getUnifiedModel(modelId)?.provider;
  return !provider || provider === 'pollinations';
}

export function getReferenceMode(model: UnifiedImageModel): ReferenceMode {
  if (model.referenceMode) return model.referenceMode;
  if (model.kind === 'image') return 'multi-image';
  return model.supportsEndFrame ? 'start-end-frame' : 'start-frame';
}

export function getModelsByProvider(provider: ImageProvider, options: VisualModelVisibilityOptions = {}): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.provider === provider && isVisibleVisualModel(m, options));
}

export function getModelsByKind(kind: ImageKind, options: VisualModelVisibilityOptions = {}): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.kind === kind && isVisibleVisualModel(m, options));
}

export function getImageModels(options: VisualModelVisibilityOptions = {}): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.kind === 'image' && isVisibleVisualModel(m, options));
}

export function getFreeModels(): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.isFree === true && (m.enabled ?? true));
}

export function getStandardModels(kind?: ImageKind): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m =>
    m.category === 'Standard' &&
    (m.enabled ?? true) &&
    (kind ? m.kind === kind : true)
  );
}

export function getAdvancedModels(kind?: ImageKind): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m =>
    m.category === 'Advanced' &&
    (m.enabled ?? true) &&
    (kind ? m.kind === kind : true)
  );
}

const CHAT_IMAGE_MODEL_IDS = ['zimage', 'flux', 'gpt-image'];
export function getChatImageModels(): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m =>
    CHAT_IMAGE_MODEL_IDS.includes(m.id) &&
    m.kind === 'image' &&
    (m.enabled ?? true)
  );
}
