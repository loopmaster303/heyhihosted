
'use server';
/**
 * @fileOverview Generates an image using the Pollinations.ai Text-to-Image API.
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
export interface GenerateImageOutput {
  imageDataUri: string;
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
  // Using some default parameters as per Pollinations documentation
  // model=flux is a good default, nologo=true is often desired.
  // Using 1024x1024 as a common default size.
  const imageUrl = `${POLLINATIONS_IMAGE_API_BASE_URL}/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true&seed=${Date.now()}`;

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Pollinations Image API Error:', response.status, errorBody);
      throw new Error(
        `Pollinations Image API request failed with status ${response.status}: ${errorBody}`
      );
    }

    const imageBlob = await response.blob();

    // Convert blob to data URI
    const reader = new FileReader();
    const dataUriPromise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read blob as data URI.'));
        }
      };
      reader.onerror = (error) => {
        reject(new Error(`FileReader error: ${error}`));
      };
      reader.readAsDataURL(imageBlob);
    });

    const imageDataUri = await dataUriPromise;

    return { imageDataUri, promptUsed: prompt };

  } catch (error) {
    console.error('Error in generateImageViaPollinations:', error);
    if (error instanceof Error) {
      // Re-throw or transform the error
      throw new Error(`Image generation via Pollinations failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred during image generation via Pollinations.');
  }
}
