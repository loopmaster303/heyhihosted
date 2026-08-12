/**
 * Pruna AI Model Registry
 *
 * Maps HeyHi model IDs to Pruna API model names and defines per-model
 * parameter translation from HeyHi form fields to Pruna input payloads.
 *
 * Pruna API: POST https://api.pruna.ai/v1/predictions
 * Auth: `apikey` header (server-side ENV PRUNA_API_KEY)
 * Sync (Try-Sync: true) for fast image models, async polling for video.
 */

export type PrunaMode = 'sync' | 'async';

export interface PrunaModelMapping {
  /** Pruna API model name (sent as `Model` header). For smart-dispatch models, override via resolveModel. */
  prunaModel: string;
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
  params?: Record<string, string | number | boolean>;
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
  'p-image-ideogram',
  'p-flux-klein',
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

const DISABLE_SAFETY_CHECKER = { disable_safety_checker: true };
const DISABLE_SAFETY_FILTER = { disable_safety_filter: true };

function clampToMultipleOf16(value: number, min: number, max: number): number {
  const rounded = Math.round(value / DIMENSION_STEP) * DIMENSION_STEP;
  return Math.max(min, Math.min(max, rounded));
}

/**
 * Die wan-Modelle kennen keine Dauer, nur num_frames bei fester Bildrate.
 * Die Oberfläche stellt Sekunden ein, hier wird umgerechnet und auf den
 * erlaubten Bereich geklemmt.
 */
export const WAN_FPS = 16;
const WAN_MIN_FRAMES = 81;
const WAN_MAX_FRAMES = 121;

export function wanFramesFor(seconds: unknown): number {
  const secs = typeof seconds === 'number' ? seconds : Number(seconds);
  if (!Number.isFinite(secs) || secs <= 0) return WAN_MIN_FRAMES;
  return Math.max(WAN_MIN_FRAMES, Math.min(WAN_MAX_FRAMES, Math.round(secs * WAN_FPS)));
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

// Pixel-Tabelle für zimage (z-image-turbo kennt nur Kantenlängen, die
// Oberfläche bietet Seitenverhältnisse). Alle Vielfache von 16, ~1-MP-Klasse.
const ZIMAGE_ASPECT_SIZES: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '4:3': { width: 1152, height: 864 },
  '3:4': { width: 864, height: 1152 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
};

const PRUNA_MODEL_MAP: Record<string, PrunaModelMapping> = {
  // ── Z-Image Turbo ──────────────────────────────────────────────────
  zimage: {
    prunaModel: 'z-image-turbo',
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
    buildInput: (f) => {
      // Der Playground schickt aspect_ratio im params-Bag — hier in Pixel
      // übersetzen; die API kennt das Feld selbst nicht, also abziehen.
      const rawAspect = f.params?.aspect_ratio ?? f.aspectRatio;
      const { aspect_ratio: _drop, ...rest } = f.params ?? {};
      const size = ZIMAGE_ASPECT_SIZES[String(rawAspect)] ?? ZIMAGE_ASPECT_SIZES["1:1"];
      return {
        prompt: f.prompt,
        ...DISABLE_SAFETY_CHECKER,
        width: f.width ?? size.width,
        height: f.height ?? size.height,
        seed: f.seed,
        output_format: f.outputFormat ?? 'jpg',
        ...rest,
      };
    },
  },

  // ── Qwen-Image ─────────────────────────────────────────────────────
  'qwen-image': {
    prunaModel: 'qwen-image',
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
        ...DISABLE_SAFETY_CHECKER,
        go_fast: true,
        guidance: 3,
        num_inference_steps: 30,
        output_format: f.outputFormat ?? 'webp',
        output_quality: 80,
        disable_safety_checker: true,
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
    mode: 'sync',
    isVideo: false,
    defaultParams: {
      go_fast: true,
      aspect_ratio: 'match_input_image',
      output_format: 'webp',
      output_quality: 95,
    },
    buildInput: (f) => {
      const { aspect_ratio: _dropAR, width: _dropW, height: _dropH, ...rest } = f.params ?? {};
      const input: Record<string, unknown> = {
        prompt: f.prompt,
        ...DISABLE_SAFETY_CHECKER,
        go_fast: true,
        aspect_ratio: allowedAspectRatio(f.aspectRatio, QWEN_EDIT_ASPECT_RATIOS, 'match_input_image'),
        output_format: f.outputFormat ?? 'webp',
        output_quality: 95,
        disable_safety_checker: true,
      };
      if (f.seed !== undefined) input.seed = f.seed;
      if (f.image) {
        input.image = Array.isArray(f.image) ? f.image : [f.image];
      }
      return { ...input, ...rest };
    },
  },

  // ── Wan T2V (Text-to-Video) ───────────────────────────────────────
  'wan-t2v': {
    prunaModel: 'wan-t2v',
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
      const { duration, ...rest } = f.params ?? {};
      const input: Record<string, unknown> = {
        prompt: f.prompt,
        num_frames: wanFramesFor(duration ?? f.duration),
        resolution: '480p',
        aspect_ratio: resolveSupportedAspectRatio(f, WAN_VIDEO_ASPECT_RATIOS, '16:9'),
        frames_per_second: WAN_FPS,
        interpolate_output: true,
        go_fast: true,
        disable_safety_checker: true,
      };
      if (f.seed !== undefined) input.seed = f.seed;
      return { ...input, ...rest };
    },
  },

  // ── Wan I2V (Image-to-Video) ──────────────────────────────────────
  'wan-i2v': {
    prunaModel: 'wan-i2v',
    mode: 'async',
    isVideo: true,
    defaultParams: {
      num_frames: 81,
      resolution: '480p',
      frames_per_second: 16,
      interpolate_output: false,
      go_fast: true,
    },
    buildInput: (f) => {
      const { duration, ...rest } = f.params ?? {};
      const input: Record<string, unknown> = {
        prompt: f.prompt,
        ...DISABLE_SAFETY_CHECKER,
        image: Array.isArray(f.image) ? f.image[0] : f.image,
        last_image: (Array.isArray(f.image) && f.image.length > 1) ? f.image[1] : undefined,
        num_frames: wanFramesFor(duration ?? f.duration),
        resolution: '480p',
        frames_per_second: WAN_FPS,
        interpolate_output: false,
        go_fast: true,
      };
      if (Array.isArray(f.image) && f.image[1]) input.last_image = f.image[1];
      if (f.seed !== undefined) input.seed = f.seed;
      return { ...input, ...rest };
    },
  },

  // ── VACE (Video with character consistency) ───────────────────────
  vace: {
    prunaModel: 'vace',
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
        ...DISABLE_SAFETY_CHECKER,
        src_video: f.video,
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
      } else if (f.image) {
        input.src_ref_images = Array.isArray(f.image) ? f.image : [f.image];
      }
      if (f.seed !== undefined) input.seed = f.seed;
      const { width: _dropW, height: _dropH, ...rest } = f.params ?? {};
      return { ...input, ...rest };
    },
  },

  // ── Wan Fast (smart dispatch: T2V or I2V) ────────────────────────
  'wan-fast': {
    prunaModel: 'wan-t2v',
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
    mode: 'sync',
    isVideo: false,
    defaultParams: {
      aspect_ratio: '1:1',
    },
    buildInput: (f) => {

      const input: Record<string, unknown> = {
        prompt: f.prompt,
        ...DISABLE_SAFETY_CHECKER,
        aspect_ratio: allowedAspectRatio(f.aspectRatio, P_IMAGE_ASPECT_RATIOS, '1:1'),
      };
      if (input.aspect_ratio === 'custom') {
        Object.assign(input, normalizePImageCustomSize(f.width, f.height));
      }
      if (f.seed !== undefined) input.seed = f.seed;
      input.disable_safety_checker = true;
      const { aspect_ratio: _dropAR, width: _dropW, height: _dropH, ...rest } = f.params ?? {};
      return { ...input, ...rest };
    },
  },

  // ── P-Image-Edit (Pruna performance I2I) ──────────────────────────
  'p-image-edit': {
    prunaModel: 'p-image-edit',
    mode: 'sync',
    isVideo: false,
    defaultParams: {
      aspect_ratio: '1:1',
    },
    buildInput: (f) => {
      const input: Record<string, unknown> = {
        prompt: f.prompt,
        ...DISABLE_SAFETY_CHECKER,
        aspect_ratio: resolveSupportedAspectRatio(f, QWEN_EDIT_ASPECT_RATIOS, '1:1'),
      };
      if (f.seed !== undefined) input.seed = f.seed;
      if (f.image) {
        const imgs = Array.isArray(f.image) ? f.image : [f.image];
        if (imgs.length > 0) {
          input.images = imgs;
        }
      }
      input.disable_safety_checker = true;
      const { aspect_ratio: _dropAR, width: _dropW, height: _dropH, ...rest } = f.params ?? {};
      return { ...input, ...rest };
    },
  },

  // ── P-Video (Pruna performance T2V/I2V) ───────────────────────────
  'p-video': {
    prunaModel: 'p-video',
    mode: 'async',
    isVideo: true,
    defaultParams: {
      aspect_ratio: '16:9',
      duration: 5,
    },
    buildInput: (f) => {
      const input: Record<string, unknown> = {
        prompt: f.prompt,
        ...DISABLE_SAFETY_FILTER,
        aspect_ratio: resolveSupportedAspectRatio(f, WAN_VIDEO_ASPECT_RATIOS, '16:9'),
        // Feste Bildrate — kein Bedienelement, siehe param-schema.
        fps: 24,
      };
      if (f.duration !== undefined) input.duration = f.duration;
      if (f.seed !== undefined) input.seed = f.seed;
      input.save_audio = f.audio ?? true;
      if (f.image) {
        const images = Array.isArray(f.image) ? f.image : [f.image];
        input.image = images[0];
        if (images[1]) input.last_frame_image = images[1];
      }
      input.disable_safety_filter = true;
      const { aspect_ratio: _dropAR, width: _dropW, height: _dropH, ...rest } = f.params ?? {};
      return { ...input, ...rest };
    },
  },

  // ── P-Image-Try-On (virtual garment fitting) ───────────────────────
  'p-image-try-on': {
    prunaModel: 'p-image-try-on',
    mode: 'sync',
    isVideo: false,
    defaultParams: {
      output_format: 'jpg',
      output_quality: 95,
      preserve_input_size: true,
    },
    buildInput: (f) => {
      const input: Record<string, unknown> = {
        ...(f.prompt ? { prompt: f.prompt } : {}),
        ...DISABLE_SAFETY_CHECKER,
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
      input.disable_safety_checker = true;
      const { aspect_ratio: _dropAR, width: _dropW, height: _dropH, ...rest } = f.params ?? {};
      return { ...input, ...rest };
    },
  },

  // ── P-Image-Upscale (AI image upscaling) ─────────────────────────
  'p-image-upscale': {
    prunaModel: 'p-image-upscale',
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
      const { aspect_ratio: _dropAR, width: _dropW, height: _dropH, ...rest } = f.params ?? {};
      const input: Record<string, unknown> = {
        ...DISABLE_SAFETY_CHECKER,
        target,
        output_format: f.outputFormat ?? 'jpg',
        output_quality: 80,
        enhance_details: false,
        enhance_realism: false,
        disable_safety_checker: true,
      };
      if (f.seed !== undefined) input.seed = f.seed;
      if (f.image) {
        input.image = Array.isArray(f.image) ? f.image[0] : f.image;
      }
      return { ...input, ...rest };
    },
  },

  // ── P-Video-Avatar (talking head from image) ───────────────────────
  'p-video-avatar': {
    prunaModel: 'p-video-avatar',
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
        ...DISABLE_SAFETY_FILTER,
        voice: 'Zephyr (Female)',
        voice_language: 'English (US)',
        video_prompt: 'The person is talking.',
        voice_prompt: 'Say the following.',
        voice_script: f.prompt,
        resolution: '720p',
        disable_safety_filter: true,
      };
      if (f.seed !== undefined) input.seed = f.seed;
      if (f.image) {
        input.image = Array.isArray(f.image) ? f.image[0] : f.image;
      }
      const { aspect_ratio: _dropAR, width: _dropW, height: _dropH, ...rest } = f.params ?? {};
      return { ...input, ...rest };
    },
  },

  // ── P-Video-Animate (motion transfer) ─────────────────────────────
  'p-video-animate': {
    prunaModel: 'p-video-animate',
    mode: 'async',
    isVideo: true,
    defaultParams: {
      resolution: '720p',
      save_audio: true,
      target_fps: 'original',
    },
    buildInput: (f) => {

      const input: Record<string, unknown> = {
        ...DISABLE_SAFETY_CHECKER,
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
      input.disable_safety_checker = true;
      const { aspect_ratio: _dropAR, width: _dropW, height: _dropH, ...rest } = f.params ?? {};
      return { ...input, ...rest };
    },
  },

  // ── P-Video-Replace (character replacement in video) ───────────────
  'p-video-replace': {
    prunaModel: 'p-video-replace',
    mode: 'async',
    isVideo: true,
    defaultParams: {
      resolution: '720p',
      save_audio: true,
    },
    buildInput: (f) => {
      const input: Record<string, unknown> = {
        ...DISABLE_SAFETY_CHECKER,
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
          input.images = imgs.slice(0, 3);
        }
      }
      input.disable_safety_checker = true;
      const { aspect_ratio: _dropAR, width: _dropW, height: _dropH, ...rest } = f.params ?? {};
      return { ...input, ...rest };
    },
  },

  // ── Wan-Image-Small (fast image generation) ───────────────────────
  'wan-image-small': {
    prunaModel: 'wan-image-small',
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
        ...DISABLE_SAFETY_CHECKER,
        aspect_ratio: aspectRatio,
        output_format: f.outputFormat ?? 'jpg',
        output_quality: 80,
      };
      if (aspectRatio === 'custom') {
        Object.assign(input, normalizeWanImageSmallCustomSize(f.width, f.height));
      }
      if (f.seed !== undefined) input.seed = f.seed;
      input.disable_safety_checker = true;
      const { aspect_ratio: _dropAR, width: _dropW, height: _dropH, ...rest } = f.params ?? {};
      return { ...input, ...rest };
    },
  },

  // ── P-Image-Ideogram ───────────────────────────────────────────────
  'p-image-ideogram': {
    prunaModel: 'p-image-ideogram',
    mode: 'sync',
    isVideo: false,
    defaultParams: {
      aspect_ratio: '1:1',
      image_size: '2K',
      thinking: 'medium',
      prompt_upsampling: true,
    },
    buildInput: (f) => {
      const input: Record<string, unknown> = {
        prompt: f.prompt,
        aspect_ratio: f.aspectRatio ?? '1:1',
        image_size: f.params?.image_size ?? '2K',
        thinking: f.params?.thinking ?? 'medium',
        prompt_upsampling: f.params?.prompt_upsampling ?? true,
      };
      if (f.aspectRatio === 'custom') {
        input.width = f.width ?? 1024;
        input.height = f.height ?? 1024;
      }
      if (f.seed !== undefined) input.seed = f.seed;
      input.disable_safety_checker = true;
      const { aspect_ratio: _dropAR, width: _dropW, height: _dropH, ...rest } = f.params ?? {};
      return { ...input, ...rest };
    },
  },

  // ── P-Flux-Klein ───────────────────────────────────────────────────
  'p-flux-klein': {
    prunaModel: 'flux-2-klein-4b',
    mode: 'sync',
    isVideo: false,
    defaultParams: {
      aspect_ratio: '1:1',
      output_megapixels: '1',
    },
    buildInput: (f) => {
      const input: Record<string, unknown> = {
        prompt: f.prompt,
        aspect_ratio: f.aspectRatio ?? '1:1',
        output_megapixels: f.params?.output_megapixels ?? '1',
      };
      if (f.image) {
        const imgs = Array.isArray(f.image) ? f.image : [f.image];
        if (imgs.length > 0) {
          input.images = imgs.slice(0, 5);
        }
      }
      if (f.seed !== undefined) input.seed = f.seed;
      input.disable_safety_checker = true;
      const { aspect_ratio: _dropAR, width: _dropW, height: _dropH, ...rest } = f.params ?? {};
      return { ...input, ...rest };
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
