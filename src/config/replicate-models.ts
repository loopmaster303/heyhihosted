
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
  hidden?: boolean; // Hide field from UI but keep in config
  labelKey?: string; // Translation key for the label
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
  "wan-2.2-image": {
    id: "wan-2.2-image",
    name: "WAN 2.2 Image",
    outputType: "image",
    description: "Beautiful cinematic 2 megapixel images in 3-4 seconds. Derived from the Wan 2.2 model through optimization techniques from the pruna package.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "A cinematic shot of a futuristic city...", info: "Text prompt for image generation.", isPrompt: true, labelKey: "prompt.wan22Image" },
      { name: "juiced", label: "Juiced", type: "boolean", default: false, info: "Faster inference with additional optimizations.", labelKey: "field.juiced" },
      { name: "megapixels", label: "Megapixels", type: "select", default: "2", options: ["1", "2"], info: "Approximate number of megapixels for generated image.", labelKey: "field.megapixels" },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "16:9", options: ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9"], info: "Aspect ratio for the generated image.", labelKey: "imageGen.aspectRatio" },
      { name: "output_format", label: "Output Format", type: "select", default: "jpg", options: ["png", "jpg", "webp"], info: "Format of the output images.", labelKey: "field.outputFormat" },
      { name: "output_quality", label: "Output Quality", type: "number", default: 80, min: 1, max: 100, step: 1, info: "Quality when saving the output images, from 0 to 100. 100 is best quality, 0 is lowest quality. Not relevant for .png outputs.", labelKey: "field.outputQuality" },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", info: "Random seed. Set for reproducible generation.", hidden: true },
    ]
  },
  "nano-banana": {
    id: "nano-banana",
    name: "Google Nano Banana",
    outputType: "image",
    hasCharacterReference: true,
    description: "Google's latest image editing model in Gemini 2.5. Features multi-image fusion, character consistency, conversational editing, and visual reasoning capabilities.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "Make the sheets in the style of the logo. Make the scene natural...", info: "A text description of the image you want to generate or edit.", isPrompt: true, labelKey: "prompt.nanoBanana" },
      { name: "image_input", label: "Image Input", type: "files", info: "Input images to transform or use as reference (supports multiple images).", labelKey: "field.referenceImages" },
      { name: "output_format", label: "Output Format", type: "select", default: "jpg", options: ["jpg", "png"], info: "Format of the output image.", labelKey: "field.outputFormat" },
    ]
  },
  "ideogram-character": {
    id: "ideogram-character",
    name: "Ideogram Character",
    outputType: "image",
    hasCharacterReference: true,
    description: "Create consistent characters across different images using a reference image.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "A close up photo of a woman in a fashion magazine photoshoot...", info: "Text prompt for image generation.", isPrompt: true, labelKey: "prompt.ideogramCharacter" },
      { name: "character_reference_image", label: "Character Reference Image", type: "url", required: true, info: "An image to use as a character reference." },
      { name: "rendering_speed", label: "Rendering Speed", type: "select", default: "default", options: ["default", "turbo", "quality"], info: "Rendering speed. Turbo for faster and cheaper generation, quality for higher quality and more expensive generation, default for balanced.", labelKey: "field.renderingSpeed" },
      { name: "style_type", label: "Style Type", type: "select", default: "auto", options: ["auto", "fiction", "realistic"], info: "The character style type. Auto, Fiction, or Realistic.", labelKey: "field.styleType" },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "1:1", options: ["1:1", "16:9", "9:16", "4:3", "3:4"], info: "Aspect ratio. Ignored if a resolution or inpainting image is given.", labelKey: "imageGen.aspectRatio" },
      { name: "resolution", label: "Resolution", type: "select", default: "none", options: ["none"], info: "Resolution. Overrides aspect ratio. Ignored if an inpainting image is given.", hidden: true },
      { name: "magic_prompt_option", label: "Magic Prompt Option", type: "select", default: "auto", options: ["auto", "on", "off"], info: "Magic Prompt will interpret your prompt and optimize it to maximize variety and quality of the images generated. You can also use it to write prompts in different languages.", labelKey: "field.magicPrompt" },
      { name: "image", label: "Image File", type: "url", info: "An image file to use for inpainting. You must also use a mask.", hidden: true },
      { name: "mask", label: "Mask File", type: "url", info: "A black and white image. Black pixels are inpainted, white pixels are preserved. The mask will be resized to match the image size.", hidden: true },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min: 0, max: 2147483647, info: "Random seed. Set for reproducible generation." },
    ]
  },
  "flux-krea-dev": {
    id: "flux-krea-dev",
    name: "Flux Krea Dev",
    outputType: "image",
    description: "FLUX.1 KREA.dev by Black Forest Labs for fast, high-quality image generation.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "A cinematic photo of a robot in a field of flowers...", info: "The main text prompt describing the image you want to generate.", isPrompt: true, labelKey: "prompt.fluxKreaDev" },
      { name: "image", label: "Image File", type: "url", info: "An image file to use for img2img generation. Accepts HTTP or data URLs.", hidden: true },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "1:1", options: ["1:1", "16:9", "9:16", "4:3", "3:4", "2:1", "1:2"], info: "Aspect ratio of the output image.", labelKey: "imageGen.aspectRatio" },
      { name: "prompt_strength", label: "Prompt Strength", type: "number", default: 0.8, min: 0, max: 1, step: 0.1, info: "Strength of the prompt influence.", hidden: true },
      { name: "num_outputs", label: "Number of Generations", type: "number", default: 1, min: 1, max: 4, step: 1, info: "Number of images to generate (1-4).", labelKey: "field.numOutputs" },
      { name: "num_inference_steps", label: "Inference Steps", type: "number", default: 50, min: 1, max: 50, step: 1, info: "Number of denoising steps. Maximum is 50.", hidden: true },
      { name: "guidance", label: "Guidance", type: "number", default: 4.5, min: 0, max: 20, step: 0.1, info: "Controls how much the prompt influences the output.", hidden: true },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min: 0, info: "Random seed. Set for reproducible generation." },
      { name: "output_format", label: "Output Format", type: "select", default: "webp", options: ["webp", "png", "jpg"], info: "Format of the output image.", labelKey: "field.outputFormat" },
      { name: "output_quality", label: "Output Quality", type: "number", default: 100, min: 1, max: 100, step: 1, info: "Quality of the output image (1-100).", hidden: true },
      { name: "disable_safety_checker", label: "Safety Checker", type: "boolean", default: false, info: "Disable the safety checker for more creative freedom.", labelKey: "field.disableSafetyChecker" },
      { name: "go_fast", label: "Go Fast", type: "boolean", default: false, info: "Enable fast generation mode.", hidden: true },
      { name: "megapixels", label: "Megapixels", type: "select", default: "1", options: [{ value: "1", label: "1" }, { value: "0.25", label: "0.25" }], info: "Target megapixels for the output image.", hidden: true },
    ]
  },
  "qwen-image-edit": {
    id: "qwen-image-edit",
    name: "Qwen Image Edit",
    outputType: "image",
    hasCharacterReference: true, 
    description: "Edit images using text instructions with Qwen.",
    inputs: [
      { name: "image", label: "Image to Edit", type: "url", required: true, info: "The source image you want to modify.", hidden: true },
      { name: "prompt", label: "Edit Instruction", type: "text", required: true, placeholder: "Make the sky blue, add a cat on the roof...", info: "Describe the changes you want to make to the image.", isPrompt: true, labelKey: "prompt.qwenImageEdit" },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "match_input_image", options: ["match_input_image", "1:1", "16:9", "9:16", "4:3", "3:4"], info: "Aspect ratio for the generated image.", labelKey: "imageGen.aspectRatio" },
      { name: "go_fast", label: "Go Fast", type: "boolean", default: false, info: "Run faster predictions with additional optimizations.", hidden: true },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min: 0, info: "Random seed. Set for reproducible generation." },
      { name: "output_format", label: "Output Format", type: "select", default: "webp", options: ["webp", "png", "jpg"], info: "Format of the output images.", labelKey: "field.outputFormat" },
      { name: "output_quality", label: "Output Quality", type: "number", default: 100, min: 1, max: 100, step: 1, info: "Quality when saving the output images, from 0 to 100. 100 is best quality, 0 is lowest quality. Not relevant for .png outputs.", hidden: true },
      { name: "disable_safety_checker", label: "Disable Safety Checker", type: "boolean", default: false, info: "This model's safety checker can't be disabled when running on the website.", labelKey: "field.disableSafetyChecker" },
    ]
  },
  "qwen-image": {
    id: "qwen-image",
    name: "Qwen Image",
    outputType: "image",
    description: "Generate images from text prompts using Qwen.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "A beautiful landscape...", info: "The main text prompt describing the image.", isPrompt: true, labelKey: "prompt.qwenImage" },
      { name: "enhance_prompt", label: "Enhance Prompt", type: "boolean", default: false, info: "Automatically enhance the prompt for better results.", labelKey: "field.enhancePrompt" },
      { name: "lora_weights", label: "Lora Weights", type: "text", info: "LoRA weights for fine-tuning.", hidden: true },
      { name: "lora_scale", label: "Lora Scale", type: "number", default: 1, min: 0, max: 2, step: 0.1, info: "LoRA scale factor.", hidden: true },
      { name: "image", label: "Image File", type: "url", info: "An image file to use for image-to-image generation. Accepts HTTP or data URLs." },
      { name: "strength", label: "Strength", type: "number", default: 0.8, min: 0, max: 1, step: 0.1, info: "Strength of the image-to-image transformation (0 = keep original, 1 = completely new).", labelKey: "field.strength" },
      { name: "negative_prompt", label: "Negative Prompt", type: "text", placeholder: "Blurry, low quality, text, watermark", info: "Specify elements you want to avoid in the image.", isNegativePrompt: true, labelKey: "field.negativePrompt" },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "1:1", options: ["1:1", "16:9", "9:16", "4:3", "3:4"], info: "Aspect ratio of the generated image.", labelKey: "imageGen.aspectRatio" },
      { name: "quality", label: "Quality", type: "select", default: "1024*1024", options: ["1024*1024", "720*1280", "1280*720"], info: "Quality and dimensions of the output image.", labelKey: "field.quality" },
      { name: "go_fast", label: "Go Fast", type: "boolean", default: false, info: "Enable fast generation mode (lower quality).", hidden: true },
      { name: "num_inference_steps", label: "Inference Steps", type: "number", default: 50, min: 1, max: 100, step: 1, info: "Number of denoising steps.", hidden: true },
      { name: "guidance", label: "Guidance", type: "number", default: 4, min: 1, max: 20, step: 0.1, info: "How strongly the prompt should guide generation.", hidden: true },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min: 0, info: "A specific seed for reproducibility." },
      { name: "output_format", label: "Output Format", type: "select", default: "jpg", options: ["jpg", "png", "webp"], info: "Format of the output image.", labelKey: "field.outputFormat" },
      { name: "output_quality", label: "Output Quality", type: "number", default: 100, min: 1, max: 100, step: 1, info: "Quality of the output image (1-100).", hidden: true },
      { name: "disable_safety_checker", label: "Disable Safety Checker", type: "boolean", default: true, info: "Disable the safety checker for more creative freedom.", labelKey: "field.disableSafetyChecker" },
    ]
  },
  "imagen-4-ultra": {
    id: "imagen-4-ultra",
    name: "Imagen 4 Ultra",
    outputType: "image",
    description: "Google's state-of-the-art text-to-image model. Ideal for high-detail photorealism and artistic styles.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "A vibrant coral reef teeming with life...", info: "Text prompt for image generation.", isPrompt: true, labelKey: "prompt.imagen4Ultra" },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "1:1", options: ["1:1", "16:9", "9:16", "4:3", "3:4", "2:1", "1:2"], info: "Aspect ratio of the generated image.", labelKey: "imageGen.aspectRatio" },
      { name: "safety_filter_level", label: "Safety Filter Level", type: "select", default: "block_only_high", options: ["block_none", "block_low_and_above", "block_medium_and_above", "block_only_high"], info: "block_low_and_above is strictest, block_medium_and_above blocks some prompts, block_only_high is most permissive but some prompts will still be blocked", labelKey: "field.safetyFilterLevel"},
      { name: "output_format", label: "Output Format", type: "select", default: "jpg", options: ["jpg", "png", "webp"], info: "Format of the output image", labelKey: "field.outputFormat"},
    ],
  },
  "flux-kontext-pro": {
    id: "flux-kontext-pro",
    name: "Flux Kontext Pro",
    outputType: "image",
    description: "Professional grade contextual image generation by Black Forest Labs, also with image input capabilities.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: false, placeholder: "Describe your image or modifications...", info:"Text description of what you want to generate, or the instruction on how to edit the given image.", isPrompt: true, labelKey: "prompt.fluxKontextPro" },
      { name: "input_image", label: "Input Image", type: "url", info: "Image to use as reference. Must be jpeg, png, gif, or webp.", hidden: true },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "match_input_image", options: ["match_input_image", "1:1", "16:9", "9:16", "4:3", "3:4"], info: "Aspect ratio of the generated image. Use 'match_input_image' to match the aspect ratio of the input image.", labelKey: "imageGen.aspectRatio"},
      { name: "enhance_prompt", label: "Enhance Prompt", type: "boolean", default: false, info: "Automatic prompt improvement.", labelKey: "field.enhancePrompt"},
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min: 0, info: "Random seed. Set for reproducible generation." },
      { name: "output_format", label: "Output Format", type: "select", default: "png", options: ["png", "jpg", "webp"], info: "Output format for the generated image.", labelKey: "field.outputFormat"},
      { name: "safety_tolerance", label: "Safety Tolerance", type: "number", default: 2, min: 0, max: 6, step: 1, info: "Safety tolerance, 0 is most strict and 6 is most permissive. 2 is currently the maximum allowed when input images are used.", labelKey: "field.safetyTolerance"},
    ],
  },
  "runway-gen4-image": {
    id: "runway-gen4-image",
    name: "Runway Gen4-image",
    outputType: "image",
    description: "Runway's Gen-4 model for image generation with reference images.",
    inputs: [
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "A close up portrait of @woman...", isPrompt: true, info: "Text prompt for image generation. You can reference uploaded images using @tag_name.", labelKey: "prompt.runwayGen4" },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min: 0, info: "Random seed. Set for reproducible generation." },
      { name: "aspect_ratio", label: "Aspect Ratio", type: "select", default: "16:9", options: ["16:9", "9:16", "4:3", "3:4", "1:1"], info: "Image aspect ratio.", labelKey: "imageGen.aspectRatio" },
      { name: "resolution", label: "Resolution", type: "select", default: "1080p", options: ["1080p", "720p", "540p", "360p"], info: "Image resolution.", labelKey: "field.resolution" },
      { name: "reference_images", label: "Reference Images", type: "files", info: "Up to 3 reference images. Images must be between 0.5 and 2 aspect ratio.", labelKey: "field.referenceImages" },
      { name: "reference_tags", label: "Reference Tags", type: "tags", info: "An optional tag for each of your reference images. Tags must be alphanumeric and start with a letter. You can reference them in your prompt using @tag_name. Tags must be between 3 and 15 characters.", labelKey: "field.referenceTags" }
    ],
  },
  "wan-2.2-video": {
    id: "wan-2.2-video",
    name: "WAN 2.2 Video",
    outputType: "video",
    description: "Image-to-Video model by Wandisco. Takes an image and a prompt to generate a short video.",
    inputs: [
      { name: "image", label: "Source Image", type: "url", required: true, info: "Input image to generate video from.", hidden: true },
      { name: "prompt", label: "Prompt", type: "text", required: true, placeholder: "Golden hour, soft lighting, warm colors, saturated colors, wide shot, left-heavy composition...", info: "Prompt for video generation.", isPrompt: true, labelKey: "prompt.wanVideo" },
      { name: "go_fast", label: "Go Fast", type: "boolean", default: false, info: "Go fast", labelKey: "field.goFast" },
      { name: "num_frames", label: "Num Frames", type: "number", default: 81, min: 81, max: 100, step: 1, info: "Number of video frames. 81 frames give the best results", labelKey: "field.numFrames" },
      { name: "resolution", label: "Resolution", type: "select", default: "480p", options: ["480p", "720p", "1080p"], info: "Resolution of video. 832x480px corresponds to 16:9 aspect ratio, and 480x832px is 9:16", labelKey: "field.resolution" },
      { name: "frames_per_second", label: "Frames Per Second", type: "number", default: 16, min: 5, max: 24, step: 1, info: "Frames per second. Note that the pricing of this model is based on the video duration at 16 fps", labelKey: "field.framesPerSecond" },
      { name: "sample_steps", label: "Sample Steps", type: "number", default: 30, min: 1, max: 50, step: 1, info: "Number of generation steps. Fewer steps means faster generation, at the expensive of output quality. 30 steps is sufficient for most prompts", labelKey: "field.sampleSteps" },
      { name: "sample_shift", label: "Sample Shift", type: "number", default: 5, min: 1, max: 20, step: 1, info: "Sample shift factor", labelKey: "field.sampleShift" },
      { name: "seed", label: "Seed", type: "number", placeholder: "Leave blank for random", min: 0, info: "Random seed. Leave blank for random" },
    ],
  },
};

export const modelKeys = Object.keys(modelConfigs);

    

    
