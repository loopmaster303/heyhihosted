export interface ReplicateModelInput {
  name: string; // Internal name for the parameter
  label: string; // User-facing label
  type: "text" | "number" | "boolean" | "select" | "url" | "files" | "tags";
  required?: boolean;
  default?: any;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[] | { value: string; label: string }[];
  info?: string;
  isPrompt?: boolean;
  labelKey?: string;
  hidden?: boolean;
}

export interface ReplicateModelConfig {
  id: string; // User-friendly key, e.g., "imagen-4-ultra"
  name: string; // User-friendly display name, e.g., "Imagen 4 Ultra"
  inputs: ReplicateModelInput[];
  description?: string;
  outputType?: "image" | "video";
  hasCharacterReference?: boolean;
}

export const modelConfigs: Record<string, ReplicateModelConfig> = {
  // === GENERATOREN (Reine Text-to-Image) ===
  "wan-2.2-image": {
    id: "wan-2.2-image",
    name: "WAN 2.2 Image",
    outputType: "image",
    description: "Beautiful cinematic 2 megapixel images in 3-4 seconds. Derived from the Wan 2.2 model through optimization techniques from the pruna package.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "Type what you want to see – makes very realistic pictures in seconds.", info: "Text prompt for image generation.", isPrompt: true, labelKey: "prompt.wan22Image" },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "16:9", options: ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9"], info: "Aspect ratio for the generated image.", labelKey: "imageGen.aspectRatio" },
      { name: "output_quality", label: "Output Quality", type: "number", default: 80, min: 1, max: 100, step: 1, info: "Quality when saving the output images, from 0 to 100. 100 is best quality, 0 is lowest quality. Not relevant for .png outputs.", labelKey: "field.outputQuality" },
      { name: "output_format", label: "Output Format", type: "select", default: "jpg", options: ["png", "jpg", "webp"], info: "Format of the output images.", labelKey: "field.outputFormat" },
      { name: "juiced", label: "Juiced", type: "boolean", default: false, info: "Faster inference with additional optimizations.", labelKey: "field.juiced" },
      { name: "megapixels", label: "Megapixels", type: "select", default: "2", options: [{ value: "1", label: "1" }, { value: "2", label: "2" }], info: "Approximate number of megapixels for generated image.", labelKey: "field.megapixels", hidden: true },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", info: "Random seed. Set for reproducible generation.", hidden: true },
    ]
  },
  "flux-krea-dev": {
    id: "flux-krea-dev",
    name: "Flux Krea Dev",
    outputType: "image",
    description: "High-quality image generation with fast inference. Great for creative and artistic images.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "Write your idea – creates natural, artistic images that don't look AI-made.", info: "The main text prompt describing the image you want to generate.", isPrompt: true, labelKey: "prompt.fluxKreaDev" },
      { name: "image", label: "Image File", type: "url", info: "An image file to use for img2img generation. Accepts HTTP or data URLs.", hidden: true },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "1:1", options: ["1:1", "16:9", "9:16", "4:3", "3:4", "2:1", "1:2"], info: "Aspect ratio of the output image.", labelKey: "imageGen.aspectRatio" },
      { name: "prompt_strength", label: "Prompt Strength", type: "number", default: 0.8, min: 0, max: 1, step: 0.1, info: "Strength of the prompt influence.", hidden: true },
      { name: "num_outputs", label: "Number of Generations", type: "number", default: 1, min: 1, max: 4, step: 1, info: "Number of images to generate (1-4).", labelKey: "field.numOutputs" },
      { name: "num_inference_steps", label: "Inference Steps", type: "number", default: 50, min: 1, max: 50, step: 1, info: "Number of denoising steps. Maximum is 50.", hidden: true },
      { name: "guidance", label: "Guidance", type: "number", default: 4.5, min: 0, max: 20, step: 0.1, info: "Controls how much the prompt influences the output.", hidden: true },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min: 0, info: "Random seed. Set for reproducible generation." },
      { name: "output_format", label: "Output Format", type: "select", default: "webp", options: ["webp", "png", "jpg"], info: "Format of the output image.", labelKey: "field.outputFormat" },
      { name: "output_quality", label: "Output Quality", type: "number", default: 100, min: 1, max: 100, step: 1, info: "Quality of the output image (1-100).", hidden: true },
      { name: "disable_safety_checker", label: "Safety Checker", type: "boolean", default: false, info: "Disable the safety checker for more creative freedom.", labelKey: "field.disableSafetyChecker", hidden: true },
      { name: "go_fast", label: "Go Fast", type: "boolean", default: false, info: "Enable fast generation mode.", hidden: true },
      { name: "megapixels", label: "Megapixels", type: "select", default: "1", options: [{ value: "1", label: "1" }, { value: "0.25", label: "0.25" }], info: "Target megapixels for the output image.", hidden: true },
    ]
  },
  "qwen-image": {
    id: "qwen-image",
    name: "Qwen Image",
    outputType: "image",
    description: "Realistic image generation with high quality and detail. Great for photorealistic images.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "Describe your scene – makes detailed, lifelike photos and can also draw text.", info: "Text prompt for image generation.", isPrompt: true, labelKey: "prompt.qwenImage" },
      { name: "enhance_prompt", label: "Enhance Prompt", type: "boolean", default: true, info: "Automatically enhance the prompt for better results.", labelKey: "field.enhancePrompt" },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "1:1", options: ["1:1", "16:9", "9:16", "4:3", "3:4"], info: "Aspect ratio of the generated image.", labelKey: "imageGen.aspectRatio" },
      { name: "quality", label: "Quality", type: "select", default: "Quality", options: ["Speed", "Quality"], info: "Choose between faster generation or higher quality.", labelKey: "field.quality" },
      { name: "strength", label: "Strength", type: "number", default: 0.8, min: 0, max: 1, step: 0.1, info: "Strength of the generation process.", hidden: true },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min: 0, info: "Random seed. Set for reproducible generation.", labelKey: "field.seed" },
      { name: "output_format", label: "Output Format", type: "select", default: "jpg", options: ["jpg", "png", "webp"], info: "Format of the output image.", labelKey: "field.outputFormat" },
      { name: "output_quality", label: "Output Quality", type: "number", default: 100, min: 1, max: 100, step: 1, info: "Quality of the output image (1-100).", hidden: true },
      { name: "disable_safety_checker", label: "Safety Checker", type: "boolean", default: false, info: "Disable the safety checker for more creative freedom.", labelKey: "field.disableSafetyChecker", hidden: true },
      { name: "go_fast", label: "Go Fast", type: "boolean", default: false, info: "Enable fast generation mode.", hidden: true },
      { name: "image", label: "Image File", type: "url", info: "An image file to use for img2img generation.", hidden: true },
      { name: "guidance", label: "Guidance", type: "number", default: 7.5, min: 0, max: 20, step: 0.1, info: "Controls how much the prompt influences the output.", hidden: true },
      { name: "num_inference_steps", label: "Inference Steps", type: "number", default: 20, min: 1, max: 50, step: 1, info: "Number of denoising steps.", hidden: true },
      { name: "lora_weights", label: "LoRA Weights", type: "text", placeholder: "Leave blank for default", info: "LoRA weights for fine-tuning.", hidden: true },
      { name: "lora_scale", label: "LoRA Scale", type: "number", default: 1.0, min: 0, max: 2, step: 0.1, info: "Scale factor for LoRA weights.", hidden: true },
    ]
  },

  // === EDITOREN (Bildbearbeitung & Input-Capabilities) ===
  "nano-banana": {
    id: "nano-banana",
    name: "Google Nano Banana",
    outputType: "image",
    description: "Google's latest image editing model in Gemini 2.5. Excellent for multi-image fusion, character consistency, and conversational editing.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "Upload a picture or type text – edits and creates images with simple instructions.", info: "Text prompt for image generation or editing instructions.", isPrompt: true, labelKey: "prompt.nanoBanana" },
      { name: "image_input", label: "Input Images", type: "files", info: "Input images to transform or use as reference (supports multiple images)", hidden: true },
      { name: "output_format", label: "Output Format", type: "select", default: "jpg", options: ["jpg", "png", "webp"], info: "Format of the output image.", labelKey: "field.outputFormat" },
    ]
  },
  "qwen-image-edit": {
    id: "qwen-image-edit",
    name: "Qwen Image Edit",
    outputType: "image",
    hasCharacterReference: true, 
    description: "Edit images using text instructions with Qwen. Excellent for precise text editing and semantic/appearance editing.",
    inputs: [
      { name: "prompt", label: "Edit Instruction", type: "text", required: true, placeholder: "Upload a picture and tell it what to change – perfect for fixing or adding text.", info: "Describe the changes you want to make to the image. Great for precise text editing.", isPrompt: true, labelKey: "prompt.qwenImageEdit" },
      { name: "image", label: "Image to Edit", type: "url", required: true, info: "The source image you want to modify.", labelKey: "field.imageToEdit", hidden: true },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "match_input_image", options: ["match_input_image", "1:1", "16:9", "9:16", "4:3", "3:4"], info: "Aspect ratio for the generated image.", labelKey: "imageGen.aspectRatio" },
      { name: "quality", label: "Quality", type: "select", default: "Quality", options: ["Speed", "Quality"], info: "Choose between faster generation or higher quality.", labelKey: "field.quality" },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min: 0, info: "Random seed. Set for reproducible generation.", labelKey: "field.seed" },
      { name: "output_format", label: "Output Format", type: "select", default: "webp", options: ["webp", "png", "jpg"], info: "Format of the output images.", labelKey: "field.outputFormat" },
      { name: "disable_safety_checker", label: "Disable Safety Checker", type: "boolean", default: false, info: "This model's safety checker can't be disabled when running on the website.", labelKey: "field.disableSafetyChecker", hidden: true },
      { name: "strength", label: "Strength", type: "number", default: 0.8, min: 0, max: 1, step: 0.1, info: "Strength of the image editing transformation (0 = keep original, 1 = completely new).", labelKey: "field.strength", hidden: true },
      { name: "output_quality", label: "Output Quality", type: "number", default: 100, min: 1, max: 100, step: 1, info: "Quality when saving the output images, from 0 to 100. 100 is best quality, 0 is lowest quality. Not relevant for .png outputs.", hidden: true },
      { name: "go_fast", label: "Go Fast", type: "boolean", default: false, info: "Run faster predictions with additional optimizations.", hidden: true },
      { name: "guidance", label: "Guidance", type: "number", default: 4, min: 1, max: 20, step: 0.1, info: "How strongly the prompt should guide generation.", hidden: true },
      { name: "num_inference_steps", label: "Inference Steps", type: "number", default: 50, min: 1, max: 100, step: 1, info: "Number of denoising steps. More steps = higher quality but slower.", hidden: true },
    ]
  },
  "ideogram-character": {
    id: "ideogram-character",
    name: "Ideogram Character",
    outputType: "image",
    hasCharacterReference: true,
    description: "Create consistent characters across different images using a reference image.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "Upload a character picture and describe a new scene – keeps the character consistent.", info: "Text prompt for image generation.", isPrompt: true, labelKey: "prompt.ideogramCharacter" },
      { name: "character_reference_image", label: "Character Reference Image", type: "url", required: true, info: "An image to use as a character reference." },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "1:1", options: ["1:1", "16:9", "9:16", "4:3", "3:4"], info: "Aspect ratio. Ignored if a resolution or inpainting image is given.", labelKey: "imageGen.aspectRatio" },
      { name: "rendering_speed", label: "Rendering Speed", type: "select", default: "Default", options: ["Default", "Turbo", "Quality"], info: "Rendering speed. Turbo for faster and cheaper generation, quality for higher quality and more expensive generation, default for balanced.", labelKey: "field.renderingSpeed" },
      { name: "style_type", label: "Style Type", type: "select", default: "Auto", options: ["Auto", "Fiction", "Realistic"], info: "The character style type. Auto, Fiction, or Realistic.", labelKey: "field.styleType" },
      { name: "magic_prompt_option", label: "Magic Prompt Option", type: "select", default: "Auto", options: ["Auto", "On", "Off"], info: "Magic Prompt will interpret your prompt and optimize it to maximize variety and quality of the images generated. You can also use it to write prompts in different languages.", labelKey: "field.magicPrompt" },
      { name: "resolution", label: "Resolution", type: "select", default: "None", options: ["None", "512x1536", "576x1408", "576x1472", "576x1536", "640x1344", "640x1408", "640x1472", "640x1536", "704x1152", "704x1216", "704x1280", "704x1344", "704x1408", "704x1472", "736x1312", "768x1088", "768x1216", "768x1280", "768x1344", "800x1280", "832x960", "832x1024", "832x1088", "832x1152", "832x1216", "832x1248", "864x1152", "896x960", "896x1024", "896x1088", "896x1120", "896x1152", "960x832", "960x896", "960x1024", "960x1088", "1024x832", "1024x896", "1024x960", "1024x1024", "1088x768", "1088x832", "1088x896", "1088x960", "1120x896", "1152x704", "1152x832", "1152x864", "1152x896", "1216x704", "1216x768", "1216x832", "1248x832", "1280x704", "1280x768", "1280x800", "1312x736", "1344x640", "1344x704", "1344x768", "1408x576", "1408x640", "1408x704", "1472x576", "1472x640", "1472x704", "1536x512", "1536x576", "1536x640"], info: "Resolution. Overrides aspect ratio. Ignored if an inpainting image is given.", hidden: true },
      { name: "image", label: "Image File", type: "url", info: "An image file to use for inpainting. You must also use a mask.", hidden: true },
      { name: "mask", label: "Mask File", type: "url", info: "A black and white image. Black pixels are inpainted, white pixels are preserved. The mask will be resized to match the image size.", hidden: true },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min: 0, max: 2147483647, info: "Random seed. Set for reproducible generation." },
    ]
  },
  "flux-kontext-pro": {
    id: "flux-kontext-pro",
    name: "Flux Kontext Pro",
    outputType: "image",
    description: "Professional image generation with context understanding. Great for complex scenes and detailed compositions.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "Write your scene in detail – handles complex prompts and makes pro-looking images.", info: "Text prompt for image generation.", isPrompt: true, labelKey: "prompt.fluxKontextPro" },
      { name: "input_image", label: "Input Image", type: "url", info: "Optional input image for context or reference.", hidden: true },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "1:1", options: ["1:1", "16:9", "9:16", "4:3", "3:4", "2:1", "1:2"], info: "Aspect ratio of the output image.", labelKey: "imageGen.aspectRatio" },
      { name: "num_outputs", label: "Number of Generations", type: "number", default: 1, min: 1, max: 4, step: 1, info: "Number of images to generate (1-4).", labelKey: "field.numOutputs" },
      { name: "guidance", label: "Guidance", type: "number", default: 3.5, min: 0, max: 20, step: 0.1, info: "Controls how much the prompt influences the output.", hidden: true },
      { name: "num_inference_steps", label: "Inference Steps", type: "number", default: 28, min: 1, max: 50, step: 1, info: "Number of denoising steps.", hidden: true },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min: 0, info: "Random seed. Set for reproducible generation." },
      { name: "output_format", label: "Output Format", type: "select", default: "webp", options: ["webp", "png", "jpg"], info: "Format of the output image.", labelKey: "field.outputFormat" },
      { name: "disable_safety_checker", label: "Safety Checker", type: "boolean", default: false, info: "Disable the safety checker for more creative freedom.", labelKey: "field.disableSafetyChecker", hidden: true },
    ]
  },
  "runway-gen4": {
    id: "runway-gen4",
    name: "Runway Gen-4",
    outputType: "image",
    description: "Advanced image generation with reference image support and tagging system.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "Upload references and use @tags – advanced image generation with strong control.", info: "Text prompt for image generation. Use @tags to reference uploaded images.", isPrompt: true, labelKey: "prompt.runwayGen4" },
      { name: "reference_images", label: "Reference Images", type: "files", info: "Upload reference images to use with @tags in your prompt.", labelKey: "field.referenceImages" },
      { name: "reference_tags", label: "Reference Tags", type: "tags", info: "Tags to associate with reference images.", labelKey: "field.referenceTags" },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "16:9", options: ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9"], info: "Aspect ratio for the generated image.", labelKey: "imageGen.aspectRatio" },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min: 0, info: "Random seed. Set for reproducible generation.", labelKey: "field.seed" },
      { name: "output_format", label: "Output Format", type: "select", default: "jpg", options: ["jpg", "png", "webp"], info: "Format of the output image.", labelKey: "field.outputFormat" },
    ]
  },

  // === VIDEOS (Video-Generatoren) ===
  "wan-video": {
    id: "wan-video",
    name: "WAN Video",
    outputType: "video",
    description: "Generate high-quality videos from text prompts. Great for cinematic and artistic video content.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "Describe a scene or upload an image – turns text or pictures into cinematic video clips.", info: "Text prompt for video generation.", isPrompt: true, labelKey: "prompt.wanVideo" },
      { name: "duration", label: "Duration", type: "select", default: "5", options: ["3", "5", "10"], info: "Duration of the generated video in seconds.", labelKey: "field.duration" },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "16:9", options: ["16:9", "9:16", "1:1", "4:3", "3:4"], info: "Aspect ratio of the generated video.", labelKey: "imageGen.aspectRatio" },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min: 0, info: "Random seed. Set for reproducible generation.", labelKey: "field.seed" },
      { name: "output_format", label: "Output Format", type: "select", default: "mp4", options: ["mp4", "webm"], info: "Format of the output video.", labelKey: "field.outputFormat" },
    ]
  },
};

// Export model keys for easy access
export const modelKeys = Object.keys(modelConfigs);