
'use server';
/**
 * @fileOverview Generates an image using the Pollinations.ai Text-to-Image API.
 * This flow now defaults to using the 'gptimage' model via a constructed URL.
 *
 * - generateImageViaPollinations - A function that handles the image generation.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

// Define the Zod schema for input, but do not export it directly
export interface GenerateImageInput {
  prompt: string;
}

// Define the Zod schema for output, but do not export it directly
// The output is now the direct URL to the image, not a data URI.
export interface GenerateImageOutput {
  imageUrl: string;
  promptUsed: string;
}

const POLLINATIONS_IMAGE_API_BASE_URL = 'https://image.pollinations.ai/prompt';

export async function generateImageViaPollinations(
  input: GenerateImageInput
): Promise<GenerateImageOutput> {
  if (!input || !input.prompt || input.prompt.trim() === '') {
    throw new Error('Image generation prompt cannot be empty.');
  }

  const prompt = input.prompt.trim();
  
  // Construct URL for 'gptimage' model, always private.
  // This avoids fetching the image on the server and returning a large data URI,
  // which prevents localStorage quota issues when saving chat history.
  const params = new URLSearchParams({
    width: '1024',
    height: '1024',
    model: 'gptimage',
    nologo: 'true',
    private: 'true',
    seed: String(Date.now()),
  });

  const imageUrl = `${POLLINATIONS_IMAGE_API_BASE_URL}/${encodeURIComponent(prompt)}?${params.toString()}`;

  // We simply return the URL. The client will handle rendering it.
  // This prevents server-side fetching and potential errors.
  // We assume the URL generation is always successful. The client <Image> tag will handle fetch errors.
  return { imageUrl, promptUsed: prompt };
}
