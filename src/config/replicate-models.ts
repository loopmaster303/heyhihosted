
export interface ReplicateModelInput {
  name: string; // Internal name for the parameter
  label: string; // User-facing label
  type: "text" | "number" | "boolean" | "select" | "url" | "files" | "tags";
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
  "flux-krea-dev": {
    id: "flux-krea-dev",
    name: "Flux Krea Dev",
    outputType: "image",
    description: "FLUX.1 KREA.dev by Black Forest Labs for fast, high-quality image generation.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "A cinematic photo of a robot in a field of flowers...", info: "The main text prompt describing the image you want to generate.", isPrompt: true },
      { name: "image", label: "Input Image (URL)", type: "url", info: "An optional image to guide the generation (img2img). Accepts HTTP or data URLs." },
      { name: "negative_prompt", label: "Negative Prompt", type: "text", placeholder: "Blurry, text, watermark, ugly", info: "Specify elements to avoid in the image.", isNegativePrompt: true },
      { name: "scheduler", label: "Scheduler", type: "select", default: "dpmpp-2m-sde-karras", options: ["dpmpp-2m-sde-karras", "dpmpp-2m-sde", "dpmpp-sde-karras", "dpmpp-sde", "euler", "euler-a", "lms-karras"], info: "Choose a scheduler to guide the diffusion process." },
      { name: "num_inference_steps", label: "Inference Steps", type: "number", default: 25, min: 1, max: 100, step: 1, info: "Number of denoising steps. Higher values can improve quality but take longer." },
      { name: "guidance", label: "Guidance", type: "number", default: 3, min: 0, max: 20, step: 0.1, info: "Controls how much the prompt influences the output. Lower values give more creative freedom." },
      { name: "output_quality", label: "Output Quality", type: "number", default: 95, min: 1, max: 100, step: 1, info: "Quality of the output image (1-100). Higher is better." },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min: 0, info: "A specific seed to reproduce results. Leave blank for random." },
    ]
  },
  "qwen-image": {
    id: "qwen-image",
    name: "Qwen Image",
    outputType: "image",
    description: "High-quality text-to-image synthesis by Qwen, supporting English and Chinese prompts.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "A beautiful cat on a chair...", info: "The main text prompt describing the image you want to generate.", isPrompt: true },
      { name: "negative_prompt", label: "Negative Prompt", type: "text", placeholder: "Blurry, low quality, text, watermark", info: "Specify elements you want to avoid in the image.", isNegativePrompt: true },
      { name: "style", label: "Style", type: "select", default: "<photorealistic>", options: ["<photorealistic>", "<3d cartoon>", "<anime>", "<cinematic>", "<comic book>", "<craft clay>", "<digital art>", "<fantasy art>", "<isometric>", "<line art>", "<low-poly>", "<modeling compound>", "<origami>", "<pixel art>", "<texture>"], info: "Artistic style of the generated image." },
      { name: "size", label: "Size", type: "select", default: "1024*1024", options: ["1024*1024", "720*1280", "1280*720"], info: "Dimensions of the output image." },
      { name: "num_inference_steps", label: "Inference Steps", type: "number", default: 50, min: 10, max: 100, step: 1, info: "Number of denoising steps. More steps can improve quality but take longer." },
      { name: "guidance_scale", label: "Guidance Scale", type: "number", default: 7.5, min: 1, max: 20, step: 0.1, info: "How strongly the prompt should guide generation. Higher values mean stricter adherence." },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min: 0, info: "A specific seed to reproduce results. Leave blank for random." },
    ]
  },
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
  "runway-gen4-image": {
    id: "runway-gen4-image",
    name: "Runway Gen4-image",
    outputType: "image",
    description: "Runway's Gen-4 model for image generation with reference images.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "A close up portrait of @woman...", isPrompt: true, info: "Text prompt for image generation. You can reference uploaded images using @tag_name." },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min: 0, info: "Random seed. Set for reproducible generation." },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "16:9", options: ["16:9", "9:16", "4:3", "3:4", "1:1"], info: "Image aspect ratio." },
      { name: "resolution", label: "Resolution", type: "select", default: "1080p", options: ["1080p", "720p", "540p", "360p"], info: "Image resolution." },
      { name: "reference_images", label: "Reference Images", type: "files", info: "Up to 3 reference images. Images must be between 0.5 and 2 aspect ratio." },
      { name: "reference_tags", label: "Reference Tags", type: "tags", info: "An optional tag for each of your reference images. Tags must be alphanumeric and start with a letter. You can reference them in your prompt using @tag_name. Tags must be between 3 and 15 characters." }
    ],
  },
  "wan-2.2-video": {
    id: "wan-2.2-video",
    name: "WAN 2.2 Video",
    outputType: "video",
    description: "Image-to-Video model by Wandisco. Takes an image and a prompt to generate a short video.",
    inputs: [
      { name: "image", label: "Source Image", type: "url", required: true, info: "The starting image for the video generation." },
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "Golden hour, soft lighting...", info: "A detailed description of the desired motion and scene.", isPrompt: true },
      { name: "sample_steps", label: "Sampling Steps", type: "number", default: 30, min: 10, max: 60, step: 1, info: "Number of steps in the sampling process." },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min: 0, info: "Random seed for reproducibility." },
    ],
  },
};

export const modelKeys = Object.keys(modelConfigs);

    