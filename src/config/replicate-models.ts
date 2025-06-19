
export interface ReplicateModelInput {
  name: string; // Internal name for the parameter
  label: string; // User-facing label
  type: "text" | "number" | "boolean"; // Input type
  required?: boolean;
  default?: string | number | boolean;
  placeholder?: string; // For text/number inputs
  min?: number;         // For number inputs (slider/input type=number)
  max?: number;         // For number inputs (slider/input type=number)
  step?: number;        // For number inputs (slider/input type=number)
  options?: string[];   // For a select type (not used in current example, but good for future)
  info?: string;        // Tooltip text for an info icon next to the label
}

export interface ReplicateModelConfig {
  id: string; // User-friendly key, e.g., "imagen-4-ultra", used in Select dropdown
  name: string; // User-friendly display name, e.g., "Imagen 4 Ultra"
  // version: string; // The specific Replicate model version identifier (e.g., "google/imagen-4-ultra:hash") - This is now handled by MODEL_VERSIONS in the API route
  inputs: ReplicateModelInput[];
  description?: string; // Optional description of the model
}

// Configuration for each Replicate model
// The `id` here should match the keys in MODEL_VERSIONS in the API route
export const modelConfigs: Record<string, ReplicateModelConfig> = {
  "imagen-4-ultra": {
    id: "imagen-4-ultra",
    name: "Imagen 4 Ultra",
    description: "Google's state-of-the-art text-to-image model.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "A vibrant coral reef teeming with life...", info: "The main text prompt describing the image you want to generate." },
      { name: "negative_prompt", label: "Negative Prompt", type: "text", placeholder: "Blurry, low quality, text, watermark", info: "Specify elements you want to avoid in the image." },
      { name: "width", label: "Width", type: "number", default: 1024, min: 256, max: 2048, step: 64, info: "Width of the generated image in pixels." },
      { name: "height", label: "Height", type: "number", default: 1024, min: 256, max: 2048, step: 64, info: "Height of the generated image in pixels." },
      { name: "num_inference_steps", label: "Inference Steps", type: "number", default: 25, min:10, max: 100, step:1, info: "Number of denoising steps. More steps can improve quality but take longer." },
      { name: "guidance_scale", label: "Guidance Scale", type: "number", default: 7.5, min:1, max:20, step:0.1, info: "How strongly the prompt should guide generation. Higher values mean stricter adherence." },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min:0, info: "A specific seed to reproduce results. Leave blank for random." },
    ],
  },
  "flux-kontext-max": {
    id: "flux-kontext-max",
    name: "Flux Kontext Max",
    description: "Advanced model by Black Forest Labs for contextual image generation.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "Epic fantasy battle scene...", info:"The main text prompt describing the image." },
      { name: "negative_prompt", label: "Negative Prompt", type: "text", placeholder: "Cartoonish, simple, ugly", info:"Elements to exclude from the image." },
      { name: "width", label: "Width", type: "number", default: 1024, min: 512, max: 1536, step: 64, info:"Width of the output image." },
      { name: "height", label: "Height", type: "number", default: 1024, min: 512, max: 1536, step: 64, info:"Height of the output image." },
      { name: "steps", label: "Steps", type: "number", default: 30, min:10, max:50, step:1, info:"Number of diffusion steps." },
      { name: "guidance_scale", label: "Guidance Scale", type: "number", default: 7.0, min:1, max:15, step:0.1, info:"Classifier-free guidance scale." },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min:0, info:"Seed for randomization. Blank for random." },
    ],
  },
  "flux-kontext-pro": {
    id: "flux-kontext-pro",
    name: "Flux Kontext Pro",
    description: "Professional grade contextual image generation by Black Forest Labs.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "Photorealistic product shot...", info:"The main text prompt." },
      { name: "negative_prompt", label: "Negative Prompt", type: "text", placeholder: "Drawing, sketch, watermark", info:"What to avoid in the image." },
      { name: "width", label: "Width", type: "number", default: 1024, min: 512, max: 1536, step: 64, info:"Image width in pixels." },
      { name: "height", label: "Height", type: "number", default: 1024, min: 512, max: 1536, step: 64, info:"Image height in pixels." },
      { name: "steps", label: "Steps", type: "number", default: 28, min:10, max:50, step:1, info:"Number of generation steps." },
      { name: "guidance_scale", label: "Guidance Scale", type: "number", default: 6.5, min:1, max:15, step:0.1, info:"Strength of prompt guidance." },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min:0, info:"Random seed. Blank for random." },
    ],
  },
  "veo-3": { // Note: Veo 3 parameters might be different. This is illustrative.
    id: "veo-3",
    name: "Veo 3 (Video - Placeholder)",
    description: "Google's next-gen video model (parameters are illustrative). Output is typically a video URL.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "A short video of a cat playing piano...", info:"Describe the video you want to create." },
      { name: "width", label: "Width", type: "number", default: 1024, min: 256, max: 1920, step: 64, info:"Video width in pixels." },
      { name: "height", label: "Height", type: "number", default: 576, min: 256, max: 1080, step: 64, info:"Video height in pixels." },
      { name: "duration_secs", label: "Duration (seconds)", type: "number", default: 4, min: 1, max: 16, step: 1, info:"Length of the video in seconds." },
      { name: "fps", label: "FPS (Frames Per Second)", type: "number", default: 24, min: 8, max: 60, step: 1, info:"Frames per second for the video." },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min:0, info:"Randomization seed." },
      // Add other Veo-specific parameters here as they become known e.g., motion_strength, style_preset etc.
    ],
  },
  // "gpt-image-1" is not a standard Replicate model ID; Replicate uses owner/model_name:version_hash
  // If you meant to use a specific OpenAI model via Replicate, you'd need its Replicate version ID.
  // For now, I'm removing "Gpt Image 1" as it doesn't fit the Replicate model ID scheme.
  // If "Gpt Image 1" was a custom name for another model like DALL-E via Replicate,
  // you'd need to find its specific Replicate identifier (e.g., "openai/dall-e-3:hash").
};
