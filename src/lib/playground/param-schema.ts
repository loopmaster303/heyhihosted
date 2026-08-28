import type { PlaygroundModelEntry } from './model-source';
import {
  SEED_MODELS,
  QUALITY_MODELS,
  TRANSPARENT_MODELS,
  durationOptionsFor,
} from './pollinations-caps';

export type ParamValues = Record<string, string | number | boolean>;

export interface ShowIfFn {
  (v: ParamValues): boolean;
}

export type ParamField =
  | { kind: 'text'; name: string; label: string; multiline?: boolean; placeholder?: string; showIf?: ShowIfFn; default?: string }
  | { kind: 'number'; name: string; label: string; min: number; max: number; step?: number; default?: number; unit?: string; showIf?: ShowIfFn }
  | { kind: 'enum'; name: string; label: string; options: { value: string; label: string }[]; default?: string; showIf?: ShowIfFn }
  | { kind: 'boolean'; name: string; label: string; default?: boolean; showIf?: ShowIfFn }
  | { kind: 'seconds'; name: string; label: string; options: number[]; default?: number; showIf?: ShowIfFn };

export interface ModelParamSchema {
  promptRequired: boolean;
  images: { min: number; max: number; roles?: string[] };
  sourceVideo?: boolean;
  groups: { label: string; advanced?: boolean; fields: ParamField[] }[];
}

const showIfHasImage: ShowIfFn = (v) => {
  const img = v.image;
  if (Array.isArray(img)) return img.length > 0;
  return typeof img === 'string' && img.length > 0;
};

const showIfNoImage: ShowIfFn = (v) => !showIfHasImage(v);

function hasUpload(v: ParamValues): boolean {
  const img = v.image;
  if (Array.isArray(img)) return img.length > 0;
  return typeof img === 'string' && img.length > 0;
}

const QUALITY_GROUP = (opts: { seedDefault?: boolean; formatDefault?: string; qualityDefault?: number } = {}): { label: string; advanced: boolean; fields: ParamField[] } => {
  const fields: ParamField[] = [
    { kind: 'boolean', name: 'go_fast', label: 'Schnellmodus', default: opts.seedDefault ?? false },
    { kind: 'number', name: 'seed', label: 'Seed', min: 0, max: 999999999, default: 0 },
  ];
  if (opts.formatDefault) {
    fields.push({
      kind: 'enum',
      name: 'output_format',
      label: 'Format',
      options: [
        { value: 'png', label: 'PNG' },
        { value: 'jpg', label: 'JPEG' },
        { value: 'webp', label: 'WebP' },
      ],
      default: opts.formatDefault,
    });
  }
  if (opts.qualityDefault !== undefined) {
    fields.push({
      kind: 'number',
      name: 'output_quality',
      label: 'Qualität',
      min: 0,
      max: 100,
      step: 1,
      default: opts.qualityDefault,
    });
  }
  return { label: 'Qualität', advanced: true, fields };
};

// ── zimage ─────────────────────────────────────────────────────────
const zimageSchema: ModelParamSchema = {
  promptRequired: true,
  images: { min: 0, max: 0 },
  groups: [
    {
      label: 'Bild',
      fields: [
        // Wie überall: Seitenverhältnis statt Pixelmaße — die Übersetzung in
        // width/height macht der zimage-buildInput serverseitig.
        {
          kind: 'enum',
          name: 'aspect_ratio',
          label: 'Seitenverhältnis',
          options: [
            { value: '1:1', label: '1:1' },
            { value: '3:4', label: '3:4' },
            { value: '4:3', label: '4:3' },
            { value: '16:9', label: '16:9' },
            { value: '9:16', label: '9:16' },
          ],
          default: '1:1',
        },
      ],
    },
    {
      label: 'Qualität',
      advanced: true,
      fields: [
        { kind: 'number', name: 'num_inference_steps', label: 'Schritte', min: 1, max: 50, step: 1, default: 8 },
        { kind: 'number', name: 'guidance_scale', label: 'Guidance', min: 0, max: 20, step: 0.5, default: 0 },
        { kind: 'boolean', name: 'go_fast', label: 'Schnellmodus', default: false },
        { kind: 'number', name: 'seed', label: 'Seed', min: 0, max: 999999999, default: 0 },
        {
          kind: 'enum',
          name: 'output_format',
          label: 'Format',
          options: [
            { value: 'png', label: 'PNG' },
            { value: 'jpg', label: 'JPEG' },
            { value: 'webp', label: 'WebP' },
          ],
          default: 'jpg',
        },
        { kind: 'number', name: 'output_quality', label: 'Qualität', min: 0, max: 100, step: 1, default: 80 },
      ],
    },
  ],
};

// ── qwen-image ─────────────────────────────────────────────────────
const qwenImageSchema: ModelParamSchema = {
  promptRequired: true,
  images: { min: 0, max: 1 },
  groups: [
    {
      label: 'Bild',
      fields: [
        {
          kind: 'enum',
          name: 'aspect_ratio',
          label: 'Seitenverhältnis',
          options: [
            { value: '1:1', label: '1:1' },
            { value: '16:9', label: '16:9' },
            { value: '9:16', label: '9:16' },
            { value: '4:3', label: '4:3' },
            { value: '3:4', label: '3:4' },
            { value: '3:2', label: '3:2' },
            { value: '2:3', label: '2:3' },
          ],
          default: '16:9',
        },
      ],
    },
    {
      label: 'Qualität',
      advanced: true,
      fields: [
        { kind: 'number', name: 'guidance', label: 'Guidance', min: 0, max: 10, step: 0.5, default: 3 },
        { kind: 'number', name: 'num_inference_steps', label: 'Schritte', min: 1, max: 50, step: 1, default: 30 },
        { kind: 'text', name: 'negative_prompt', label: 'Negativ-Prompt', multiline: true, placeholder: 'was nicht im Bild sein soll' },
        { kind: 'number', name: 'strength', label: 'Stärke', min: 0, max: 1, step: 0.05, default: 0.9, showIf: showIfHasImage },
        { kind: 'boolean', name: 'enhance_prompt', label: 'Prompt verbessern', default: false },
        { kind: 'boolean', name: 'go_fast', label: 'Schnellmodus', default: true },
        {
          kind: 'enum',
          name: 'image_size',
          label: 'Bildgröße',
          options: [
            { value: 'optimize_for_quality', label: 'Qualität' },
            { value: 'optimize_for_speed', label: 'Geschwindigkeit' },
          ],
          default: 'optimize_for_quality',
        },
        { kind: 'number', name: 'seed', label: 'Seed', min: 0, max: 999999999, default: 0 },
        {
          kind: 'enum',
          name: 'output_format',
          label: 'Format',
          options: [
            { value: 'webp', label: 'WebP' },
            { value: 'jpg', label: 'JPEG' },
            { value: 'png', label: 'PNG' },
          ],
          default: 'webp',
        },
        { kind: 'number', name: 'output_quality', label: 'Qualität', min: 0, max: 100, step: 1, default: 80 },
      ],
    },
  ],
};

// ── qwen-image-edit-plus ───────────────────────────────────────────
const qwenImageEditPlusSchema: ModelParamSchema = {
  promptRequired: true,
  images: { min: 1, max: 2 },
  groups: [
    {
      label: 'Bild',
      fields: [
        {
          kind: 'enum',
          name: 'aspect_ratio',
          label: 'Seitenverhältnis',
          options: [
            { value: '16:9', label: '16:9' },
            { value: '9:16', label: '9:16' },
            { value: '1:1', label: '1:1' },
            { value: '4:3', label: '4:3' },
            { value: '3:4', label: '3:4' },
          ],
          default: '1:1',
        },
      ],
    },
    {
      label: 'Qualität',
      advanced: true,
      fields: [
        { kind: 'boolean', name: 'go_fast', label: 'Schnellmodus', default: true },
        { kind: 'number', name: 'seed', label: 'Seed', min: 0, max: 999999999, default: 0 },
        {
          kind: 'enum',
          name: 'output_format',
          label: 'Format',
          options: [
            { value: 'webp', label: 'WebP' },
            { value: 'jpg', label: 'JPEG' },
            { value: 'png', label: 'PNG' },
          ],
          default: 'webp',
        },
        { kind: 'number', name: 'output_quality', label: 'Qualität', min: 0, max: 100, step: 1, default: 95 },
      ],
    },
  ],
};

// ── wan-image-small ────────────────────────────────────────────────
const wanImageSmallSchema: ModelParamSchema = {
  promptRequired: true,
  images: { min: 0, max: 0 },
  groups: [
    {
      label: 'Bild',
      fields: [
        {
          kind: 'enum',
          name: 'aspect_ratio',
          label: 'Seitenverhältnis',
          options: [
            { value: '1:1', label: '1:1' },
            { value: '16:9', label: '16:9' },
            { value: '9:16', label: '9:16' },
            { value: '4:3', label: '4:3' },
            { value: '3:4', label: '3:4' },
            { value: '21:9', label: '21:9' },
          ],
          default: '16:9',
        },
      ],
    },
    {
      label: 'Qualität',
      advanced: true,
      fields: [
        { kind: 'boolean', name: 'juiced', label: 'Juiced', default: false },
        { kind: 'number', name: 'seed', label: 'Seed', min: 0, max: 999999999, default: 0 },
        {
          kind: 'enum',
          name: 'output_format',
          label: 'Format',
          options: [
            { value: 'png', label: 'PNG' },
            { value: 'jpg', label: 'JPEG' },
            { value: 'webp', label: 'WebP' },
          ],
          default: 'jpg',
        },
        { kind: 'number', name: 'output_quality', label: 'Qualität', min: 1, max: 100, step: 1, default: 80 },
      ],
    },
  ],
};

// ── p-flux-klein ───────────────────────────────────────────────────
const pFluxKleinSchema: ModelParamSchema = {
  promptRequired: true,
  images: { min: 0, max: 5 },
  groups: [
    {
      label: 'Bild',
      fields: [
        {
          kind: 'enum',
          name: 'aspect_ratio',
          label: 'Seitenverhältnis',
          options: [
            { value: '1:1', label: '1:1' },
            { value: '16:9', label: '16:9' },
            { value: '21:9', label: '21:9' },
            { value: '3:2', label: '3:2' },
            { value: '2:3', label: '2:3' },
            { value: '4:5', label: '4:5' },
            { value: '5:4', label: '5:4' },
            { value: '3:4', label: '3:4' },
            { value: '4:3', label: '4:3' },
            { value: '9:16', label: '9:16' },
            { value: '9:21', label: '9:21' },
          ],
          default: '1:1',
        },
        {
          kind: 'enum',
          name: 'output_megapixels',
          label: 'Megapixel',
          options: [
            { value: '0.25', label: '0.25 MP' },
            { value: '0.5', label: '0.5 MP' },
            { value: '1', label: '1 MP' },
            { value: '2', label: '2 MP' },
            { value: '4', label: '4 MP' },
          ],
          default: '1',
        },
      ],
    },
    QUALITY_GROUP({ seedDefault: false, formatDefault: 'jpg', qualityDefault: 95 }),
  ],
};

// ── p-image ────────────────────────────────────────────────────────
const pImageSchema: ModelParamSchema = {
  promptRequired: true,
  images: { min: 0, max: 0 },
  groups: [
    {
      label: 'Bild',
      fields: [
        {
          kind: 'enum',
          name: 'aspect_ratio',
          label: 'Seitenverhältnis',
          options: [
            { value: '1:1', label: '1:1' },
            { value: '16:9', label: '16:9' },
            { value: '9:16', label: '9:16' },
            { value: '4:3', label: '4:3' },
            { value: '3:4', label: '3:4' },
            { value: '3:2', label: '3:2' },
            { value: '2:3', label: '2:3' },
          ],
          default: '16:9',
        },
      ],
    },
    {
      label: 'Qualität',
      advanced: true,
      fields: [
        { kind: 'boolean', name: 'prompt_upsampling', label: 'Prompt-Upsampling', default: false },
        { kind: 'number', name: 'seed', label: 'Seed', min: 0, max: 999999999, default: 0 },
      ],
    },
  ],
};

// ── p-image-edit ───────────────────────────────────────────────────
const pImageEditSchema: ModelParamSchema = {
  promptRequired: true,
  images: { min: 1, max: 5 },
  groups: [
    {
      label: 'Bild',
      fields: [
        {
          kind: 'enum',
          name: 'aspect_ratio',
          label: 'Seitenverhältnis',
          options: [
            { value: '1:1', label: '1:1' },
            { value: '16:9', label: '16:9' },
            { value: '9:16', label: '9:16' },
            { value: '4:3', label: '4:3' },
            { value: '3:4', label: '3:4' },
            { value: '3:2', label: '3:2' },
            { value: '2:3', label: '2:3' },
          ],
          default: '1:1',
        },
      ],
    },
    {
      label: 'Qualität',
      advanced: true,
      fields: [
        { kind: 'boolean', name: 'turbo', label: 'Turbo', default: true },
        { kind: 'number', name: 'seed', label: 'Seed', min: 0, max: 999999999, default: 0 },
      ],
    },
  ],
};

// ── p-image-upscale ────────────────────────────────────────────────
const pImageUpscaleSchema: ModelParamSchema = {
  promptRequired: false,
  images: { min: 1, max: 1, roles: ['Quelle'] },
  groups: [
    {
      label: 'Hochskalieren',
      fields: [
        { kind: 'number', name: 'target', label: 'Zielgröße', min: 1, max: 128, step: 1, default: 4, unit: 'MP' },
        { kind: 'boolean', name: 'enhance_details', label: 'Details verbessern', default: false },
        { kind: 'boolean', name: 'enhance_realism', label: 'Realismus verbessern', default: false },
      ],
    },
    {
      label: 'Qualität',
      advanced: true,
      fields: [
        {
          kind: 'enum',
          name: 'output_format',
          label: 'Format',
          options: [
            { value: 'webp', label: 'WebP' },
            { value: 'jpg', label: 'JPEG' },
            { value: 'png', label: 'PNG' },
          ],
          default: 'jpg',
        },
        { kind: 'number', name: 'output_quality', label: 'Qualität', min: 0, max: 100, step: 1, default: 80 },
      ],
    },
  ],
};

// ── p-image-ideogram ───────────────────────────────────────────────
const pImageIdeogramSchema: ModelParamSchema = {
  promptRequired: true,
  images: { min: 0, max: 0 },
  groups: [
    {
      label: 'Bild',
      fields: [
        {
          kind: 'enum',
          name: 'aspect_ratio',
          label: 'Seitenverhältnis',
          options: [
            { value: '1:1', label: '1:1' },
            { value: '16:9', label: '16:9' },
            { value: '9:16', label: '9:16' },
            { value: '4:3', label: '4:3' },
            { value: '3:4', label: '3:4' },
            { value: '3:2', label: '3:2' },
            { value: '2:3', label: '2:3' },
          ],
          default: '1:1',
        },
        {
          kind: 'enum',
          name: 'image_size',
          label: 'Bildauflösung',
          options: [
            { value: '1K', label: '1K' },
            { value: '2K', label: '2K' },
          ],
          default: '2K',
        },
      ],
    },
    {
      label: 'Qualität',
      advanced: true,
      fields: [
        {
          kind: 'enum',
          name: 'thinking',
          label: 'Nachdenken',
          options: [
            { value: 'very low', label: 'Sehr niedrig' },
            { value: 'low', label: 'Niedrig' },
            { value: 'medium', label: 'Mittel' },
            { value: 'high', label: 'Hoch' },
          ],
          default: 'medium',
        },
        { kind: 'boolean', name: 'prompt_upsampling', label: 'Prompt-Upsampling', default: true },
        { kind: 'number', name: 'seed', label: 'Seed', min: 0, max: 999999999, default: 0 },
        {
          kind: 'enum',
          name: 'output_format',
          label: 'Format',
          options: [
            { value: 'png', label: 'PNG' },
            { value: 'jpg', label: 'JPEG' },
            { value: 'webp', label: 'WebP' },
          ],
          default: 'jpg',
        },
        { kind: 'number', name: 'output_quality', label: 'Qualität', min: 0, max: 100, step: 1, default: 80 },
      ],
    },
  ],
};

// ── wan-t2v ──────────────────────────────────────────────────────
const wanT2VSchema: ModelParamSchema = {
  promptRequired: true,
  images: { min: 0, max: 0 },
  groups: [
    {
      label: 'Video',
      fields: [
        // Die API kennt nur num_frames bei fester Bildrate. Der Nutzer stellt
        // Sekunden ein, buildInput rechnet um. 81–121 Frames bei 16 fps sind
        // genau diese drei Werte — mehr ist nicht erreichbar.
        { kind: 'seconds', name: 'duration', label: 'Dauer', options: [5, 6, 7], default: 5 },
        {
          kind: 'enum',
          name: 'resolution',
          label: 'Auflösung',
          options: [
            { value: '480p', label: '480p' },
            { value: '720p', label: '720p' },
          ],
          default: '480p',
        },
        {
          kind: 'enum',
          name: 'aspect_ratio',
          label: 'Seitenverhältnis',
          options: [
            { value: '16:9', label: '16:9' },
            { value: '9:16', label: '9:16' },
          ],
          default: '16:9',
        },
      ],
    },
    {
      label: 'Qualität',
      advanced: true,
      fields: [
        { kind: 'boolean', name: 'interpolate_output', label: 'Interpolieren', default: true },
        { kind: 'boolean', name: 'go_fast', label: 'Schnellmodus', default: true },
        { kind: 'boolean', name: 'optimize_prompt', label: 'Prompt optimieren', default: false },
        { kind: 'number', name: 'sample_shift', label: 'Sample Shift', min: 1, max: 20, step: 0.5, default: 12 },
        { kind: 'number', name: 'seed', label: 'Seed', min: 0, max: 999999999, default: 0 },
      ],
    },
  ],
};

// ── wan-i2v ────────────────────────────────────────────────────────
const wanI2VSchema: ModelParamSchema = {
  promptRequired: true,
  images: { min: 1, max: 2, roles: ['Start', 'Ende'] },
  groups: [
    {
      label: 'Video',
      fields: [
        // Die API kennt nur num_frames bei fester Bildrate. Der Nutzer stellt
        // Sekunden ein, buildInput rechnet um. 81–121 Frames bei 16 fps sind
        // genau diese drei Werte — mehr ist nicht erreichbar.
        { kind: 'seconds', name: 'duration', label: 'Dauer', options: [5, 6, 7], default: 5 },
        {
          kind: 'enum',
          name: 'resolution',
          label: 'Auflösung',
          options: [
            { value: '480p', label: '480p' },
            { value: '720p', label: '720p' },
          ],
          default: '480p',
        },
        // Kein Seitenverhältnis und kein optimize_prompt: das Input-Schema von
        // wan-i2v kennt beide nicht, das Verhältnis kommt aus dem Startbild.
      ],
    },
    {
      label: 'Qualität',
      advanced: true,
      fields: [
        { kind: 'boolean', name: 'interpolate_output', label: 'Interpolieren', default: false },
        { kind: 'boolean', name: 'go_fast', label: 'Schnellmodus', default: true },
        { kind: 'number', name: 'sample_shift', label: 'Sample Shift', min: 1, max: 20, step: 0.5, default: 12 },
        { kind: 'number', name: 'seed', label: 'Seed', min: 0, max: 999999999, default: 0 },
      ],
    },
  ],
};

// ── vace ───────────────────────────────────────────────────────────
const vaceSchema: ModelParamSchema = {
  promptRequired: true,
  images: { min: 0, max: 3 },
  sourceVideo: true,
  groups: [
    {
      label: 'Video',
      fields: [
        {
          kind: 'enum',
          name: 'size',
          label: 'Größe',
          options: [
            { value: '832*480', label: '832 x 480 (Landscape)' },
            { value: '480*832', label: '480 x 832 (Portrait)' },
            { value: '1280*720', label: '1280 x 720 (Landscape)' },
            { value: '720*1280', label: '720 x 1280 (Portrait)' },
          ],
          default: '832*480',
        },
        // Frames sagen niemandem etwas ueber die Laenge — die Oberflaeche stellt
        // wie bei allen anderen Videomodellen Sekunden ein, buildInput rechnet
        // sie in die vom Schema erlaubten 1-81 Frames um.
        { kind: 'seconds', name: 'duration', label: 'Dauer', options: [1, 2, 3, 4, 5], default: 5 },
      ],
    },
    {
      label: 'Qualität',
      advanced: true,
      fields: [
        {
          kind: 'enum',
          name: 'speed_mode',
          label: 'Geschwindigkeitsmodus',
          options: [
            { value: 'Lightly Juiced 🍊 (more consistent)', label: 'Leicht (konsistenter)' },
            { value: 'Juiced 🔥 (more speed)', label: 'Mittel (schneller)' },
            { value: 'Extra Juiced 🚀 (even more speed)', label: 'Stark (am schnellsten)' },
          ],
          default: 'Lightly Juiced 🍊 (more consistent)',
        },
        { kind: 'number', name: 'sample_steps', label: 'Schritte', min: 1, max: 100, step: 1, default: 50 },
        {
          kind: 'enum',
          name: 'sample_solver',
          label: 'Solver',
          options: [
            { value: 'unipc', label: 'UniPC' },
            { value: 'dpm++', label: 'DPM++' },
          ],
          default: 'unipc',
        },
        { kind: 'number', name: 'sample_guide_scale', label: 'Guidance', min: 0, max: 20, step: 0.5, default: 5 },
        { kind: 'number', name: 'sample_shift', label: 'Sample Shift', min: 1, max: 30, step: 1, default: 16 },
        { kind: 'number', name: 'seed', label: 'Seed', min: 0, max: 999999999, default: 0 },
      ],
    },
  ],
};

// ── p-video ────────────────────────────────────────────────────────
const pVideoSchema: ModelParamSchema = {
  promptRequired: true,
  images: { min: 0, max: 2, roles: ['Start', 'Ende'] },
  groups: [
    {
      label: 'Video',
      fields: [
        {
          kind: 'seconds',
          name: 'duration',
          label: 'Dauer',
          options: [1, 5, 10, 15, 20],
          default: 5,
        },
        {
          kind: 'enum',
          name: 'resolution',
          label: 'Auflösung',
          options: [
            { value: '720p', label: '720p' },
            { value: '1080p', label: '1080p' },
          ],
          default: '720p',
        },
        // Bildrate bleibt bei 24 und ist kein Bedienelement: eine verstellbare
        // Rate verschiebt die Sekunden-Skala unter der Hand.
        {
          kind: 'enum',
          name: 'aspect_ratio',
          label: 'Seitenverhältnis',
          options: [
            { value: '16:9', label: '16:9' },
            { value: '9:16', label: '9:16' },
            { value: '4:3', label: '4:3' },
            { value: '3:4', label: '3:4' },
            { value: '3:2', label: '3:2' },
            { value: '2:3', label: '2:3' },
            { value: '1:1', label: '1:1' },
          ],
          default: '16:9',
          showIf: showIfNoImage,
        },
      ],
    },
    {
      label: 'Qualität',
      advanced: true,
      fields: [
        { kind: 'boolean', name: 'draft', label: 'Entwurf', default: false },
        { kind: 'boolean', name: 'save_audio', label: 'Audio speichern', default: true },
        { kind: 'boolean', name: 'prompt_upsampling', label: 'Prompt-Upsampling', default: true },
        { kind: 'number', name: 'seed', label: 'Seed', min: 0, max: 999999999, default: 0 },
      ],
    },
  ],
};

export const PLAYGROUND_PRUNA_IDS = [
  'zimage',
  'qwen-image',
  'qwen-image-edit-plus',
  'wan-image-small',
  'p-flux-klein',
  'p-image',
  'p-image-edit',
  'p-image-upscale',
  'p-image-ideogram',
  'wan-t2v',
  'wan-i2v',
  'vace',
  'p-video',
] as const;

const SCHEMA_MAP: Record<string, ModelParamSchema> = {
  zimage: zimageSchema,
  'qwen-image': qwenImageSchema,
  'qwen-image-edit-plus': qwenImageEditPlusSchema,
  'wan-image-small': wanImageSmallSchema,
  'p-flux-klein': pFluxKleinSchema,
  'p-image': pImageSchema,
  'p-image-edit': pImageEditSchema,
  'p-image-upscale': pImageUpscaleSchema,
  'p-image-ideogram': pImageIdeogramSchema,
  'wan-t2v': wanT2VSchema,
  'wan-i2v': wanI2VSchema,
  vace: vaceSchema,
  'p-video': pVideoSchema,
};

export function schemaFor(modelId: string): ModelParamSchema | undefined {
  return SCHEMA_MAP[modelId];
}

/**
 * Das einheitliche Seitenverhältnis. Bildmodelle bekommen daraus in der Route
 * Pixel, Videomodelle nur die beiden Werte, die Pollinations überhaupt kennt.
 */
const IMAGE_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', '21:9'];
const VIDEO_RATIOS = ['16:9', '9:16'];

function ratioField(values: string[], fallback: string): ParamField {
  return {
    kind: 'enum',
    name: 'aspect_ratio',
    label: 'Seitenverhältnis',
    options: values.map((v) => ({ value: v, label: v })),
    default: fallback,
  };
}

/**
 * Pollinations braucht kein handgepflegtes Schema: die Registry sagt pro Modell,
 * was es kann. Was sie nicht sagt — welche Sekunden, wer den Seed beachtet, wer
 * quality und transparent versteht — steht in pollinations-caps.
 *
 * Ohne das hier bekämen Pollinations-Modelle überhaupt keine Regler, weil
 * SCHEMA_MAP nur die dreizehn Pruna-Modelle kennt.
 */
export function schemaForPollinations(entry: PlaygroundModelEntry): ModelParamSchema {
  const isVideo = entry.kind === 'video';
  const advanced: ParamField[] = [];

  if (SEED_MODELS.has(entry.id)) {
    advanced.push({ kind: 'number', name: 'seed', label: 'Seed', min: 0, max: 2147483647, step: 1, default: 0 });
  }
  if (QUALITY_MODELS.has(entry.id)) {
    advanced.push({
      kind: 'enum',
      name: 'quality',
      label: 'Qualität',
      options: [
        { value: 'low', label: 'Niedrig' },
        { value: 'medium', label: 'Mittel' },
        { value: 'high', label: 'Hoch' },
        { value: 'hd', label: 'HD' },
      ],
      default: 'high',
    });
  }
  if (TRANSPARENT_MODELS.has(entry.id)) {
    advanced.push({ kind: 'boolean', name: 'transparent', label: 'Transparenter Hintergrund', default: false });
  }

  const main: ParamField[] = [];

  if (isVideo) {
    const seconds = durationOptionsFor(entry.id);
    // Kein Regler, wo die Werte nicht belegt sind — lieber nichts als geraten.
    if (seconds.length > 0) {
      main.push({ kind: 'seconds', name: 'duration', label: 'Dauer', options: seconds, default: seconds[0] });
    }
    if (entry.resolutions && entry.resolutions.length > 1) {
      main.push({
        kind: 'enum',
        name: 'resolution',
        label: 'Auflösung',
        options: entry.resolutions.map((r) => ({ value: r, label: r })),
        default: entry.resolutions.includes('720p') ? '720p' : entry.resolutions[0],
      });
    }
    main.push(ratioField(VIDEO_RATIOS, '16:9'));
    if (entry.supportsAudio) {
      main.push({ kind: 'boolean', name: 'audio', label: 'Ton erzeugen', default: false });
    }
  } else {
    main.push(ratioField(IMAGE_RATIOS, '1:1'));
  }

  const groups: ModelParamSchema['groups'] = [
    { label: isVideo ? 'Video' : 'Bild', fields: main },
  ];
  if (advanced.length > 0) {
    groups.push({ label: 'Qualität', advanced: true, fields: advanced });
  }

  return {
    promptRequired: true,
    images: {
      min: entry.requiresReference ? 1 : 0,
      max: entry.maxImages,
      roles: entry.supportsEndFrame ? ['Start', 'Ende'] : undefined,
    },
    groups,
  };
}

/** Ein Schema für jedes Modell — Pruna handgepflegt, Pollinations aus der Registry. */
export function schemaForEntry(entry: PlaygroundModelEntry): ModelParamSchema {
  return SCHEMA_MAP[entry.id] ?? schemaForPollinations(entry);
}

export function defaultsFor(schema: ModelParamSchema): ParamValues {
  const out: ParamValues = {};
  for (const group of schema.groups) {
    for (const field of group.fields) {
      if (field.showIf && !field.showIf(out)) continue;
      if (field.default !== undefined) {
        out[field.name] = field.default;
      }
    }
  }
  return out;
}

/** Welche Bedienelemente sind fuer dieses Modell sichtbar? */
export function visibleFields(schema: ModelParamSchema, values: ParamValues): ParamField[] {
  const out: ParamField[] = [];
  for (const group of schema.groups) {
    for (const field of group.fields) {
      if (!field.showIf || field.showIf(values)) {
        out.push(field);
      }
    }
  }
  return out;
}
