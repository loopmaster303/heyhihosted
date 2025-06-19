
export interface ReplicateModelInput {
  name: string;
  label: string;
  type: "text" | "number" | "boolean"; // Add more types as needed (e.g., 'file', 'select')
  required?: boolean;
  default?: string | number | boolean;
  placeholder?: string;
  min?: number; // For number types
  max?: number; // For number types
  step?: number; // For number types
  options?: string[]; // For select type
  info?: string; // Additional info/tooltip for the field
}

export interface ReplicateModelConfig {
  id: string; // This will be the key, e.g., "imagen-4-ultra"
  name: string; // User-friendly name, e.g., "Image 4 Ultra"
  // version: string; // Replicate model name e.g., "google/imagen-4-ultra" - backend uses its own mapping for full version ID
  inputs: ReplicateModelInput[];
  description?: string; // Optional description of the model
}

export const modelConfigs: Record<string, ReplicateModelConfig> = {
  "imagen-4-ultra": {
    id: "imagen-4-ultra",
    name: "Imagen 4 Ultra",
    description: "Google's state-of-the-art text-to-image model.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "A vibrant coral reef teeming with life..." },
      { name: "negative_prompt", label: "Negative Prompt", type: "text", placeholder: "Blurry, low quality, text, watermark" },
      { name: "width", label: "Width", type: "number", default: 1024, min: 256, max: 2048, step: 64 },
      { name: "height", label: "Height", type: "number", default: 1024, min: 256, max: 2048, step: 64 },
      { name: "num_inference_steps", label: "Inference Steps", type: "number", default: 25, min:10, max: 100, step:1, info: "Number of denoising steps" },
      { name: "guidance_scale", label: "Guidance Scale", type: "number", default: 7.5, min:1, max:20, step:0.1, info: "Higher values enforce prompt more strictly" },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min:0 },
    ],
  },
  "flux-kontext-max": {
    id: "flux-kontext-max",
    name: "Flux Kontext Max",
    description: "Advanced model by Black Forest Labs for contextual image generation.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "Epic fantasy battle scene..." },
      { name: "negative_prompt", label: "Negative Prompt", type: "text", placeholder: "Cartoonish, simple, ugly" },
      { name: "width", label: "Width", type: "number", default: 1024, min: 512, max: 1536, step: 64 },
      { name: "height", label: "Height", type: "number", default: 1024, min: 512, max: 1536, step: 64 },
      { name: "steps", label: "Steps", type: "number", default: 30, min:10, max:50, step:1 },
      { name: "guidance_scale", label: "Guidance Scale", type: "number", default: 7.0, min:1, max:15, step:0.1 },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min:0 },
    ],
  },
  "flux-kontext-pro": {
    id: "flux-kontext-pro",
    name: "Flux Kontext Pro",
    description: "Professional grade contextual image generation by Black Forest Labs.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "Photorealistic product shot..." },
      { name: "negative_prompt", label: "Negative Prompt", type: "text", placeholder: "Drawing, sketch, watermark" },
      { name: "width", label: "Width", type: "number", default: 1024, min: 512, max: 1536, step: 64 },
      { name: "height", label: "Height", type: "number", default: 1024, min: 512, max: 1536, step: 64 },
      { name: "steps", label: "Steps", type: "number", default: 28, min:10, max:50, step:1 },
      { name: "guidance_scale", label: "Guidance Scale", type: "number", default: 6.5, min:1, max:15, step:0.1 },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min:0 },
    ],
  },
  "veo-3": {
    id: "veo-3",
    name: "Veo 3 (Placeholder)",
    description: "Google's next-gen video model (parameters are illustrative).",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "A short video of a cat playing piano..." },
      // Note: Actual Veo 3 parameters might differ significantly. These are placeholders.
      { name: "width", label: "Width", type: "number", default: 1024, min: 256, max: 1920, step: 64 },
      { name: "height", label: "Height", type: "number", default: 576, min: 256, max: 1080, step: 64 },
      { name: "duration_secs", label: "Duration (secs)", type: "number", default: 4, min: 1, max: 16, step: 1 },
      { name: "fps", label: "FPS", type: "number", default: 24, min: 8, max: 60, step: 1 },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min:0 },
    ],
  },
};
