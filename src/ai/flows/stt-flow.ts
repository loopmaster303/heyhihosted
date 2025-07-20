
'use server';

/**
 * @fileOverview A Genkit flow for transcribing audio using the Replicate API.
 *
 * - transcribeAudio - A function that handles the audio transcription process.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_API_ENDPOINT = "https://api.replicate.com/v1/predictions";
// Pinned version for openai/gpt-4o-transcribe for stability
const MODEL_VERSION = "fe49a592f98178ba939f2629ee17d79234b204cab4d9a5a15f861a7423a52ee6";

// Define the schema for the flow's input
const TranscribeAudioInputSchema = z.object({
  audioDataUri: z.string().refine(val => val.startsWith('data:audio/'), {
    message: "A valid audio data URI must be provided (e.g., 'data:audio/webm;base64,...')."
  }).describe("An audio file encoded as a data URI that must include a MIME type and use Base64 encoding."),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;


// Define the schema for the flow's output
const TranscribeAudioOutputSchema = z.object({
  transcription: z.string().describe("The transcribed text from the audio."),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;


/**
 * Public-facing wrapper function to call the Genkit flow.
 * @param input The audio data URI to be transcribed.
 * @returns The transcription result.
 */
export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  // We directly call the defined flow.
  return transcribeAudioFlow(input);
}


// Define the Genkit flow for audio transcription
const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async (input) => {

    if (!REPLICATE_API_TOKEN) {
      throw new Error('Server configuration error: REPLICATE_API_TOKEN is missing.');
    }

    const inputPayload = {
      version: MODEL_VERSION,
      input: {
        audio_file: input.audioDataUri,
        temperature: 0,
      },
    };

    // Step 1: Start the prediction with Replicate's HTTP API
    const startResponse = await fetch(REPLICATE_API_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inputPayload),
    });

    if (!startResponse.ok) {
      const errorBody = await startResponse.json().catch(() => ({}));
      console.error("Replicate STT | Start error:", errorBody);
      throw new Error(errorBody?.detail || `Failed to start prediction with Replicate. Status: ${startResponse.status}`);
    }

    let prediction = await startResponse.json();

    // Step 2: Poll for the result until it's finished or fails
    let retries = 0;
    const maxRetries = 40; // Approx 80 seconds timeout

    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      prediction.status !== "canceled" &&
      retries < maxRetries &&
      prediction.urls?.get
    ) {
      // Wait for 2 seconds before polling again
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const pollResponse = await fetch(prediction.urls.get, {
        headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
      });

      if (!pollResponse.ok) {
        console.error(`Replicate STT | Polling failed with status: ${pollResponse.status}`);
        // Stop polling if the poll request itself fails
        break;
      }
      prediction = await pollResponse.json();
      retries++;
    }

    // Step 3: Check the final status and return the result
    if (prediction.status === "succeeded" && prediction.output) {
      // The output is sometimes an array of strings, join them if so.
      const transcriptionText = Array.isArray(prediction.output)
        ? prediction.output.join("")
        : String(prediction.output);

      if (!transcriptionText) {
         console.warn("Replicate STT returned success but transcription was empty.");
         return { transcription: "" };
      }

      // Return data that matches the output schema
      return { transcription: transcriptionText.trim() };
    } else {
      const finalError = prediction.error || `Prediction ended with status: ${prediction.status}.`;
      console.error("Replicate STT | Final error:", finalError);
      throw new Error(finalError);
    }
  }
);
