
'use server';
/**
 * @fileOverview Generates an image using Gemini 2.0 Flash based on a text prompt.
 *
 * - generateImage - A function that handles the image generation.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageDataUri: z.string().describe('The generated image as a data URI.'),
  promptUsed: z.string().describe('The prompt that was used for generation.')
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: Specific model for image generation
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE
        },
      });

      if (media && media.url) {
        return { imageDataUri: media.url, promptUsed: input.prompt };
      } else {
        throw new Error('Image generation succeeded but no media URL was returned.');
      }
    } catch (error) {
      console.error('Error in generateImageFlow:', error);
      // It's good practice to re-throw or handle the error appropriately
      // For now, re-throwing to let the caller handle it.
      // You might want to return a specific error structure if preferred.
      if (error instanceof Error) {
        throw new Error(`Image generation failed: ${error.message}`);
      }
      throw new Error('An unknown error occurred during image generation.');
    }
  }
);
