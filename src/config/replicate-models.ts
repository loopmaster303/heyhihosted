
export interface ReplicateModelInput {
  name: string; // Internal name for the parameter
  label: string; // User-facing label
  type: "text" | "number" | "boolean" | "select" | "url";
  required?: boolean;
  default?: string | number | boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string } | string>;
  info?: string;
  isPrompt?: boolean;
  isNegativePrompt?: boolean;
}

export interface ReplicateModelConfig {
  id: string; // User-friendly key, e.g., "imagen-4-ultra"
  name: string; // User-friendly display name, e.g., "Imagen 4 Ultra"
  inputs: ReplicateModelInput[];
  description?: string;
  outputType?: "image" | "video";
}

export const modelConfigs: Record<string, ReplicateModelConfig> = {
  "imagen-4-ultra": {
    id: "imagen-4-ultra",
    name: "Imagen 4 Ultra",
    outputType: "image",
    description: "Google's state-of-the-art text-to-image model. Ideal for high-detail photorealism and artistic styles.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "A vibrant coral reef teeming with life...", info: "The main text prompt describing the image you want to generate.", isPrompt: true },
      { name: "negative_prompt", label: "Negative Prompt", type: "text", placeholder: "Blurry, low quality, text, watermark", info: "Specify elements you want to avoid in the image.", isNegativePrompt: true },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "1:1", options: ["1:1", "16:9", "9:16", "4:3", "3:4", "2:1", "1:2"], info: "Aspect ratio of the generated image." },
      { name: "safety_filter_level", label: "Safety Filter Level", type: "select", default: "block_only_high", options: ["block_none", "block_low_and_above", "block_medium_and_above", "block_only_high"], info: "Adjust the strictness of the safety filter. 'block_none' is most permissive."},
      { name: "output_format", label: "Output Format", type: "select", default: "jpg", options: ["jpg", "png", "webp"], info: "Format of the output image."},
      { name: "width", label: "Width", type: "number", default: 1024, min: 256, max: 2048, step: 64, info: "Width of the generated image in pixels. Ignored if aspect_ratio is set and model auto-adjusts." },
      { name: "height", label: "Height", type: "number", default: 1024, min: 256, max: 2048, step: 64, info: "Height of the generated image in pixels. Ignored if aspect_ratio is set and model auto-adjusts." },
      { name: "num_inference_steps", label: "Inference Steps", type: "number", default: 25, min:10, max: 100, step:1, info: "Number of denoising steps. More steps can improve quality but take longer." },
      { name: "guidance_scale", label: "Guidance Scale", type: "number", default: 7.5, min:1, max:20, step:0.1, info: "How strongly the prompt should guide generation. Higher values mean stricter adherence." },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min:0, info: "A specific seed to reproduce results. Leave blank for random." },
    ],
  },
  "flux-kontext-max": {
    id: "flux-kontext-max",
    name: "Flux Kontext Max",
    outputType: "image",
    description: "Advanced model by Black Forest Labs for contextual image generation, supporting image inputs.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: false, placeholder: "Describe your image or modifications...", info:"Text prompt. Can be combined with an input image.", isPrompt: true },
      { name: "input_image", label: "Input Image", type: "url", info: "Upload an image to use as a reference or base for generation." }, // Type 'url' is for internal data handling; UI handles upload
      { name: "negative_prompt", label: "Negative Prompt", type: "text", placeholder: "Cartoonish, simple, ugly", info:"Elements to exclude from the image.", isNegativePrompt: true },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "match_input_image", options: ["match_input_image", "1:1", "16:9", "9:16", "4:3", "3:4"], info: "Desired aspect ratio. 'match_input_image' will use the input image's ratio if provided."},
      { name: "output_format", label: "Output Format", type: "select", default: "png", options: ["png", "jpg", "webp"], info: "Format for the generated image."},
      { name: "safety_tolerance", label: "Safety Tolerance", type: "number", default: 2, min:0, max:6, step:1, info: "Adjust safety filter sensitivity (0=strictest, 6=most permissive)."},
      { name: "width", label: "Width", type: "number", default: 1024, min: 512, max: 1536, step: 64, info:"Width of the output image. May be overridden by aspect_ratio." },
      { name: "height", label: "Height", type: "number", default: 1024, min: 512, max: 1536, step: 64, info:"Height of the output image. May be overridden by aspect_ratio." },
      { name: "steps", label: "Steps", type: "number", default: 30, min:10, max:50, step:1, info:"Number of diffusion steps." },
      { name: "guidance_scale", label: "Guidance Scale", type: "number", default: 7.0, min:1, max:15, step:0.1, info:"Classifier-free guidance scale." },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min:0, info:"Seed for randomization. Blank for random." },
    ],
  },
  "flux-kontext-pro": {
    id: "flux-kontext-pro",
    name: "Flux Kontext Pro",
    outputType: "image",
    description: "Professional grade contextual image generation by Black Forest Labs, also with image input capabilities.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: false, placeholder: "Describe your image or modifications...", info:"Text prompt. Can be combined with an input image.", isPrompt: true },
      { name: "input_image", label: "Input Image", type: "url", info: "Upload an image to guide the generation." }, // Type 'url' for internal data; UI handles upload
      { name: "negative_prompt", label: "Negative Prompt", type: "text", placeholder: "Drawing, sketch, watermark", info:"What to avoid in the image.", isNegativePrompt: true },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "match_input_image", options: ["match_input_image", "1:1", "16:9", "9:16", "4:3", "3:4"], info: "Target aspect ratio."},
      { name: "output_format", label: "Output Format", type: "select", default: "png", options: ["png", "jpg", "webp"], info: "Image output format."},
      { name: "safety_tolerance", label: "Safety Tolerance", type: "number", default: 2, min:0, max:6, step:1, info: "Safety filter strictness (0-6)."},
      { name: "width", label: "Width", type: "number", default: 1024, min: 512, max: 1536, step: 64, info:"Image width in pixels." },
      { name: "height", label: "Height", type: "number", default: 1024, min: 512, max: 1536, step: 64, info:"Image height in pixels." },
      { name: "steps", label: "Steps", type: "number", default: 28, min:10, max:50, step:1, info:"Number of generation steps." },
      { name: "guidance_scale", label: "Guidance Scale", type: "number", default: 6.5, min:1, max:15, step:0.1, info:"Strength of prompt guidance." },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min:0, info:"Random seed. Blank for random." },
    ],
  },
};
