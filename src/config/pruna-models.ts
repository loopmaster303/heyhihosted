/**
 * Pruna AI Model Registry
 *
 * Maps HeyHi model IDs to Pruna API model names and defines per-model
 * parameter translation from HeyHi form fields to Pruna input payloads.
 *
 * Pruna API: POST https://api.pruna.ai/v1/predictions
 * Auth: `apikey` header (server-side ENV PRUNA_API_KEY)
 * Sync (Try-Sync: true) for fast image models, async polling for video.
 * VACE uses a separate subdomain: api.sharedservices.pruna.ai
 */

export type PrunaEndpoint = 'default' | 'shared';
export type PrunaMode = 'sync' | 'async';

export interface PrunaModelMapping {
  /** Pruna API model name (sent as `Model` header). For smart-dispatch models, override via resolveModel. */
  prunaModel: string;
  /** API endpoint — 'shared' uses api.sharedservices.pruna.ai */
  endpoint: PrunaEndpoint;
  /** 'sync' = Try-Sync for fast models, 'async' = submit + poll */
  mode: PrunaMode;
  /** Whether this model is a video model (affects result key) */
  isVideo: boolean;
  /** Documented registry defaults for review/UI hints; buildInput is the source of truth for submitted payloads. */
  defaultParams: Record<string, unknown>;
  /**
   * Translates HeyHi form fields to a Pruna input payload.
   * Returns the `input` object for the POST /v1/predictions body.
   */
  buildInput: (fields: PrunaFieldInput) => Record<string, unknown>;
  /**
   * Optional: resolves the actual Pruna model name at call time (for smart-dispatch).
   * If absent, uses `prunaModel` as-is.
   */
  resolveModel?: (fields: PrunaFieldInput) => string;
}

export interface PrunaFieldInput {
  prompt: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  seed?: number;
  outputFormat?: string;
  negativePrompt?: string;
  image?: string | string[];
  video?: string;
  duration?: number;
  audio?: boolean;
  // VACE-specific
  srcRefImages?: string[];
  size?: string;
  frameNum?: number;
  speedMode?: string;
  sampleSteps?: number;
}

/** HeyHi IDs routed through Pruna. */
export const PRUNA_MODEL_IDS = [
  'zimage',
  'qwen-image',
  'qwen-image-edit-plus',
  'wan-t2v',
  'wan-i2v',
  'vace',
  'wan-fast',
  'p-image',
  'p-image-edit',
  'p-video',
  'p-image-try-on',
  'p-image-upscale',
  'p-video-avatar',
  'p-video-animate',
  'p-video-replace',
  'wan-image-small',
] as const;

const IMAGE_ASPECT_RATIOS = new Set(['1:1', '3:4', '4:3', '16:9', '9:16', '3:2', '2:3']);
const P_IMAGE_ASPECT_RATIOS = new Set([...IMAGE_ASPECT_RATIOS, 'custom']);
const QWEN_EDIT_ASPECT_RATIOS = new Set([...IMAGE_ASPECT_RATIOS, 'match_input_image']);
const WAN_VIDEO_ASPECT_RATIOS = new Set(['16:9', '9:16']);
const WAN_IMAGE_SMALL_ASPECT_RATIOS = new Set([...IMAGE_ASPECT_RATIOS, '21:9']);
const WAN_IMAGE_SMALL_MIN_DIMENSION = 256;
const WAN_IMAGE_SMALL_MAX_DIMENSION = 896;
const P_IMAGE_MIN_DIMENSION = 256;
const P_IMAGE_MAX_DIMENSION = 1440;
const DIMENSION_STEP = 16;

function clampToMultipleOf16(value: number, min: number, max: number): number {
  const rounded = Math.round(value / DIMENSION_STEP) * DIMENSION_STEP;
  return Math.max(min, Math.min(max, rounded));
}

function normalizeWanImageSmallCustomSize(width?: number, height?: number): { width: number; height: number } {
  const rawWidth = width ?? WAN_IMAGE_SMALL_MAX_DIMENSION;
  const rawHeight = height ?? WAN_IMAGE_SMALL_MAX_DIMENSION;
  const maxSide = Math.max(rawWidth, rawHeight);
  const scale = maxSide > WAN_IMAGE_SMALL_MAX_DIMENSION ? WAN_IMAGE_SMALL_MAX_DIMENSION / maxSide : 1;

  return {
    width: clampToMultipleOf16(rawWidth * scale, WAN_IMAGE_SMALL_MIN_DIMENSION, WAN_IMAGE_SMALL_MAX_DIMENSION),
    height: clampToMultipleOf16(rawHeight * scale, WAN_IMAGE_SMALL_MIN_DIMENSION, WAN_IMAGE_SMALL_MAX_DIMENSION),
  };
}

function normalizePImageCustomSize(width?: number, height?: number): { width: number; height: number } {
  return {
    width: clampToMultipleOf16(width ?? 1024, P_IMAGE_MIN_DIMENSION, P_IMAGE_MAX_DIMENSION),
    height: clampToMultipleOf16(height ?? 1024, P_IMAGE_MIN_DIMENSION, P_IMAGE_MAX_DIMENSION),
  };
}

function allowedAspectRatio(value: string | undefined, allowed: Set<string>, fallback: string): string {
  return value && allowed.has(value) ? value : fallback;
}

function resolveSupportedAspectRatio(
  f: PrunaFieldInput,
  allowed: Set<string>,
  fallback: string,
): string {
  if (f.aspectRatio && allowed.has(f.aspectRatio)) {
    return f.aspectRatio;
  }

  if (f.width && f.height) {
    const ratio = f.width / f.height;
    const candidates = [
      ['1:1', 1],
      ['16:9', 16 / 9],
      ['9:16', 9 / 16],
      ['4:3', 4 / 3],
      ['3:4', 3 / 4],
      ['3:2', 3 / 2],
      ['2:3', 2 / 3],
      ['21:9', 21 / 9],
    ] as const;
    const closest = candidates
      .filter(([value]) => allowed.has(value))
      .map(([value, target]) => ({ value, delta: Math.abs(ratio - target) }))
      .sort((a, b) => a.delta - b.delta)[0];
    if (closest && closest.delta < 0.08) {
      return closest.value;
    }
  }

  return fallback;
}

function resolveWanImageSmallAspectRatio(f: PrunaFieldInput): string {
  if (f.aspectRatio && WAN_IMAGE_SMALL_ASPECT_RATIOS.has(f.aspectRatio)) {
    return f.aspectRatio;
  }
  if (f.aspectRatio === 'custom') {
    return 'custom';
  }
  return resolveSupportedAspectRatio(f, WAN_IMAGE_SMALL_ASPECT_RATIOS, '1:1');
}

const PRUNA_MODEL_MAP: Record<string, PrunaModelMapping> = {
  // ── Z-Image Turbo ──────────────────────────────────────────────────
  zimage: {
    prunaModel: 'z-image-turbo',
    endpoint: 'default',
    mode: 'sync',
    isVideo: false,
    defaultParams: {
      width: 1024,
      height: 1024,
      num_inference_steps: 8,
      guidance_scale: 0,
      go_fast: false,
      output_format: 'jpg',
      output_quality: 80,
    },
    buildInput: (f) => ({
      prompt: f.prompt,
      width: f.width ?? 1024,
      height: f.height ?? 1024,
      seed: f.seed,
      output_format: f.outputFormat ?? 'jpg',
    }),
  },

  // ── Qwen-Image ─────────────────────────────────────────────────────
  'qwen-image': {
    prunaModel: 'qwen-image',
    endpoint: 'default',
    mode: 'sync',
    isVideo: false,
    defaultParams: {
      go_fast: true,
      guidance: 3,
      num_inference_steps: 30,
      output_format: 'webp',
      output_quality: 80,
    },
    buildInput: (f) => {
      const input: Record<string, unknown> = {
        prompt: f.prompt,
        go_fast: true,
        guidance: 3,
        num_inference_steps: 30,
        output_format: f.outputFormat ?? 'webp',
        output_quality: 80,
      };
      if (f.aspectRatio) input.aspect_ratio = resolveSupportedAspectRatio(f, IMAGE_ASPECT_RATIOS, '16:9');
      if (f.negativePrompt) input.negative_prompt = f.negativePrompt;
      if (f.seed !== undefined) input.seed = f.seed;
      if (f.image) {
        const imgs = Array.isArray(f.image) ? f.image : [f.image];
        if (imgs.length > 0) {
          input.image = imgs[0];
          input.strength = 0.9;
        }
      }
      return input;
    },
  },

  // ── Qwen-Image-Edit-Plus ───────────────────────────────────────────
  'qwen-image-edit-plus': {
    prunaModel: 'qwen-image-edit-plus',
    endpoint: 'default',
    mode: 'sync',
    isVideo: false,
    defaultParams: {
      go_fast: true,
      aspect_ratio: 'match_input_image',
      output_format: 'webp',
      output_quality: 95,
    },
    buildInput: (f) => {
      const input: Record<string, unknown> = {
        prompt: f.prompt,
        go_fast: true,
        aspect_ratio: allowedAspectRatio(f.aspectRatio, QWEN_EDIT_ASPECT_RATIOS, 'match_input_image'),
        output_format: f.outputFormat ?? 'webp',
        output_quality: 95,
      };
      if (f.seed !== undefined) input.seed = f.seed;
      if (f.image) {
        input.image = Array.isArray(f.image) ? f.image : [f.image];
      }
      return input;
    },
  },

  // ── Wan T2V (Text-to-Video) ───────────────────────────────────────
  'wan-t2v': {
    prunaModel: 'wan-t2v',
    endpoint: 'default',
    mode: 'async',
    isVideo: true,
    defaultParams: {
      num_frames: 81,
      resolution: '480p',
      aspect_ratio: '16:9',
      frames_per_second: 16,
      interpolate_output: true,
      go_fast: true,
    },
    buildInput: (f) => {
      const fps = 16;
      const rawFrames = f.duration ? Math.round(f.duration * fps) : 81;
      const numFrames = Math.max(81, Math.min(121, rawFrames));
      return {
        prompt: f.prompt,
        num_frames: numFrames,
        resolution: '480p',
        aspect_ratio: resolveSupportedAspectRatio(f, WAN_VIDEO_ASPECT_RATIOS, '16:9'),
        frames_per_second: fps,
        interpolate_output: true,
        go_fast: true,
        ...(f.seed !== undefined ? { seed: f.seed } : {}),
      };
    },
  },

  // ── Wan I2V (Image-to-Video) ──────────────────────────────────────
  'wan-i2v': {
    prunaModel: 'wan-i2v',
    endpoint: 'default',
    mode: 'async',
    isVideo: true,
    defaultParams: {
      num_frames: 81,
      resolution: '480p',
      aspect_ratio: '16:9',
      frames_per_second: 16,
      interpolate_output: false,
      go_fast: true,
    },
    buildInput: (f) => {
      const fps = 16;
      const rawFrames = f.duration ? Math.round(f.duration * fps) : 81;
      const numFrames = Math.max(81, Math.min(121, rawFrames));
      const input: Record<string, unknown> = {
        prompt: f.prompt,
        image: Array.isArray(f.image) ? f.image[0] : f.image,
        num_frames: numFrames,
        resolution: '480p',
        aspect_ratio: resolveSupportedAspectRatio(f, WAN_VIDEO_ASPECT_RATIOS, '16:9'),
        frames_per_second: fps,
        interpolate_output: false,
        go_fast: true,
      };
      if (f.seed !== undefined) input.seed = f.seed;
      return input;
    },
  },

  // ── VACE (Video with character consistency) ───────────────────────
  vace: {
    prunaModel: 'vace',
    endpoint: 'shared',
    mode: 'async',
    isVideo: true,
    defaultParams: {
      size: '832*480',
      frame_num: 81,
      speed_mode: 'Lightly Juiced 🍊 (more consistent)',
      sample_steps: 50,
      sample_solver: 'unipc',
      sample_guide_scale: 5,
      sample_shift: 16,
    },
    buildInput: (f) => {
      const input: Record<string, unknown> = {
        prompt: f.prompt,
        size: f.size ?? '832*480',
        frame_num: f.frameNum ?? 81,
        speed_mode: f.speedMode ?? 'Lightly Juiced 🍊 (more consistent)',
        sample_steps: f.sampleSteps ?? 50,
        sample_solver: 'unipc',
        sample_guide_scale: 5,
        sample_shift: 16,
      };
      if (f.srcRefImages && f.srcRefImages.length > 0) {
        input.src_ref_images = f.srcRefImages;
      }
      if (f.seed !== undefined) input.seed = f.seed;
      return input;
    },
  },

  // ── Wan Fast (smart dispatch: T2V or I2V) ────────────────────────
  'wan-fast': {
    prunaModel: 'wan-t2v',
    endpoint: 'default',
    mode: 'async',
    isVideo: true,
    defaultParams: {
      num_frames: 81,
      resolution: '480p',
      aspect_ratio: '16:9',
      frames_per_second: 16,
      interpolate_output: true,
      go_fast: true,
    },
    resolveModel: (f) => {
      const hasRef = !!f.image && (Array.isArray(f.image) ? f.image.length > 0 : true);
      return hasRef ? 'wan-i2v' : 'wan-t2v';
    },
    buildInput: (f) => {
      const hasRef = !!f.image && (Array.isArray(f.image) ? f.image.length > 0 : true);
      const model = hasRef ? PRUNA_MODEL_MAP['wan-i2v'] : PRUNA_MODEL_MAP['wan-t2v'];
      return model.buildInput(f);
    },
  },

  // ── P-Image (Pruna performance T2I) ───────────────────────────────
  'p-image': {
    prunaModel: 'p-image',
    endpoint: 'default',
    mode: 'sync',
    isVideo: false,
    defaultParams: {
      aspect_ratio: '1:1',
    },
    buildInput: (f) => {
      const input: Record<string, unknown> = {
        prompt: f.prompt,
        aspect_ratio: allowedAspectRatio(f.aspectRatio, P_IMAGE_ASPECT_RATIOS, '1:1'),
      };
      if (input.aspect_ratio === 'custom') {
        Object.assign(input, normalizePImageCustomSize(f.width, f.height));
      }
      if (f.seed !== undefined) input.seed = f.seed;
      return input;
    },
  },

  // ── P-Image-Edit (Pruna performance I2I) ──────────────────────────
  'p-image-edit': {
    prunaModel: 'p-image-edit',
    endpoint: 'default',
    mode: 'sync',
    isVideo: false,
    defaultParams: {
      aspect_ratio: '1:1',
    },
    buildInput: (f) => {
      const input: Record<string, unknown> = {
        prompt: f.prompt,
        aspect_ratio: resolveSupportedAspectRatio(f, QWEN_EDIT_ASPECT_RATIOS, '1:1'),
      };
      if (f.seed !== undefined) input.seed = f.seed;
      if (f.image) {
        const imgs = Array.isArray(f.image) ? f.image : [f.image];
        if (imgs.length > 0) {
          input.images = imgs;
          input.reference_image = '1';
        }
      }
      return input;
    },
  },

  // ── P-Video (Pruna performance T2V/I2V) ───────────────────────────
  'p-video': {
    prunaModel: 'p-video',
    endpoint: 'default',
    mode: 'async',
    isVideo: true,
    defaultParams: {
      aspect_ratio: '16:9',
      duration: 5,
    },
    buildInput: (f) => {
      const input: Record<string, unknown> = {
        prompt: f.prompt,
        aspect_ratio: resolveSupportedAspectRatio(f, WAN_VIDEO_ASPECT_RATIOS, '16:9'),
      };
      if (f.duration !== undefined) input.duration = f.duration;
      if (f.seed !== undefined) input.seed = f.seed;
      input.save_audio = f.audio ?? true;
      if (f.image) {
        input.image = Array.isArray(f.image) ? f.image[0] : f.image;
      }
      return input;
    },
  },

  // ── P-Image-Try-On (virtual garment fitting) ───────────────────────
  'p-image-try-on': {
    prunaModel: 'p-image-try-on',
    endpoint: 'default',
    mode: 'sync',
    isVideo: false,
    defaultParams: {
      output_format: 'jpg',
      output_quality: 95,
      preserve_input_size: true,
    },
    buildInput: (f) => {
      const input: Record<string, unknown> = {
        prompt: f.prompt || '',
        output_format: f.outputFormat ?? 'jpg',
        output_quality: 95,
        preserve_input_size: true,
      };
      if (f.seed !== undefined) input.seed = f.seed;
      if (f.image) {
        const imgs = Array.isArray(f.image) ? f.image : [f.image];
        if (imgs.length > 0) {
          input.person_image = imgs[0];
          if (imgs.length > 1) {
            input.garment_images = imgs.slice(1);
          }
        }
      }
      return input;
    },
  },

  // ── P-Image-Upscale (AI image upscaling) ─────────────────────────
  'p-image-upscale': {
    prunaModel: 'p-image-upscale',
    endpoint: 'default',
    mode: 'sync',
    isVideo: false,
    defaultParams: {
      target: 4,
      output_format: 'jpg',
      output_quality: 80,
      enhance_details: false,
      enhance_realism: false,
    },
    buildInput: (f) => {
      const target = Math.max(1, Math.min(128, f.width ? Math.round((f.width * (f.height || 1024)) / 1_000_000) : 4));
      const input: Record<string, unknown> = {
        target,
        output_format: f.outputFormat ?? 'jpg',
        output_quality: 80,
        enhance_details: false,
        enhance_realism: false,
      };
      if (f.seed !== undefined) input.seed = f.seed;
      if (f.image) {
        input.image = Array.isArray(f.image) ? f.image[0] : f.image;
      }
      return input;
    },
  },

  // ── P-Video-Avatar (talking head from image) ───────────────────────
  'p-video-avatar': {
    prunaModel: 'p-video-avatar',
    endpoint: 'default',
    mode: 'async',
    isVideo: true,
    defaultParams: {
      voice: 'Zephyr (Female)',
      voice_language: 'English (US)',
      video_prompt: 'The person is talking.',
      voice_prompt: 'Say the following.',
      resolution: '720p',
      disable_safety_filter: true,
    },
    buildInput: (f) => {
      const input: Record<string, unknown> = {
        voice: 'Zephyr (Female)',
        voice_language: 'English (US)',
        video_prompt: f.prompt || 'The person is talking.',
        voice_prompt: 'Say the following.',
        resolution: '720p',
        disable_safety_filter: true,
      };
      if (f.seed !== undefined) input.seed = f.seed;
      if (f.image) {
        input.image = Array.isArray(f.image) ? f.image[0] : f.image;
      }
      return input;
    },
  },

  // ── P-Video-Animate (motion transfer) ─────────────────────────────
  'p-video-animate': {
    prunaModel: 'p-video-animate',
    endpoint: 'default',
    mode: 'async',
    isVideo: true,
    defaultParams: {
      resolution: '720p',
      save_audio: true,
      target_fps: 'original',
    },
    buildInput: (f) => {
      const input: Record<string, unknown> = {
        resolution: '720p',
        save_audio: f.audio ?? true,
        target_fps: 'original',
      };
      if (f.prompt) input.instruction_prompt = f.prompt;
      if (f.seed !== undefined) input.seed = f.seed;
      if (f.video) {
        input.video = f.video; // motion source
      }
      if (f.image) {
        input.image = Array.isArray(f.image) ? f.image[0] : f.image; // subject reference
      }
      return input;
    },
  },

  // ── P-Video-Replace (character replacement in video) ───────────────
  'p-video-replace': {
    prunaModel: 'p-video-replace',
    endpoint: 'default',
    mode: 'async',
    isVideo: true,
    defaultParams: {
      resolution: '720p',
      save_audio: true,
    },
    buildInput: (f) => {
      const input: Record<string, unknown> = {
        resolution: '720p',
        save_audio: f.audio ?? true,
      };
      if (f.prompt) input.instruction_prompt = f.prompt;
      if (f.seed !== undefined) input.seed = f.seed;
      if (f.video) {
        input.video = f.video; // source video
      }
      if (f.image) {
        const imgs = Array.isArray(f.image) ? f.image : [f.image];
        if (imgs.length > 0) {
          input.image = imgs[0]; // source video frame reference
          if (imgs.length > 1) {
            input.reference_images = imgs.slice(1);
          }
        }
      }
      return input;
    },
  },

  // ── Wan-Image-Small (fast image generation) ───────────────────────
  'wan-image-small': {
    prunaModel: 'wan-image-small',
    endpoint: 'default',
    mode: 'sync',
    isVideo: false,
    defaultParams: {
      aspect_ratio: '1:1',
      output_format: 'jpg',
      output_quality: 80,
    },
    buildInput: (f) => {
      const aspectRatio = resolveWanImageSmallAspectRatio(f);
      const input: Record<string, unknown> = {
        prompt: f.prompt,
        aspect_ratio: aspectRatio,
        output_format: f.outputFormat ?? 'jpg',
        output_quality: 80,
      };
      if (aspectRatio === 'custom') {
        Object.assign(input, normalizeWanImageSmallCustomSize(f.width, f.height));
      }
      if (f.seed !== undefined) input.seed = f.seed;
      return input;
    },
  },
};

export function getPrunaModelMapping(modelId: string): PrunaModelMapping | undefined {
  return PRUNA_MODEL_MAP[modelId];
}

export function isPrunaModel(modelId: string): boolean {
  return modelId in PRUNA_MODEL_MAP;
}

export function getPrunaModelName(modelId: string, fields?: PrunaFieldInput): string | undefined {
  const mapping = PRUNA_MODEL_MAP[modelId];
  if (!mapping) return undefined;
  if (mapping.resolveModel && fields) return mapping.resolveModel(fields);
  return mapping.prunaModel;
}
