'use server';
/**
 * @fileOverview Converts text to speech using the Replicate API, wrapped in a Genkit flow.
 *
 * - textToSpeech - Converts a string of text into playable audio data.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_MODEL_ENDPOINT = "https://api.replicate.com/v1/models/minimax/speech-02-turbo/predictions";

const TextToSpeechInputSchema = z.object({
    text: z.string(),
    voice: z.string(),
});

const TextToSpeechOutputSchema = z.object({
    audioDataUri: z.string(),
});

export const textToSpeech = ai.defineFlow(
    {
        name: 'textToSpeechReplicate',
        inputSchema: TextToSpeechInputSchema,
        outputSchema: TextToSpeechOutputSchema,
    },
    async ({ text, voice }) => {
        if (!REPLICATE_API_TOKEN) {
            throw new Error('Server configuration error: REPLICATE_API_TOKEN is missing.');
        }
        if (!text || text.trim() === '') {
            throw new Error('Input text cannot be empty.');
        }
        if (!voice || typeof voice !== 'string') {
            throw new Error('The "voice" parameter is required.');
        }

        const inputPayload = {
            text: text.trim(),
            voice_id: voice,
            emotion: "auto",
            language_boost: "Automatic",
            english_normalization: false,
        };

        try {
            const startResponse = await fetch(REPLICATE_MODEL_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${REPLICATE_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input: inputPayload }),
            });

            if (!startResponse.ok) {
                const errorBody = await startResponse.json().catch(() => ({ detail: `Replicate API error ${startResponse.status}.` }));
                console.error("Replicate start error:", errorBody);
                throw new Error(errorBody.detail || 'Failed to start prediction with Replicate.');
            }

            let prediction = await startResponse.json();

            let retryCount = 0;
            while (
                prediction.status !== "succeeded" &&
                prediction.status !== "failed" &&
                prediction.status !== "canceled" &&
                retryCount < 40 && // Max ~80 seconds polling
                prediction.urls?.get
            ) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                const pollResponse = await fetch(prediction.urls.get, {
                    headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
                });
                if (!pollResponse.ok) break;
                prediction = await pollResponse.json();
                retryCount++;
            }

            if (prediction.status === "succeeded" && prediction.output) {
                return { audioDataUri: prediction.output };
            } else {
                const finalError = prediction.error || `Prediction ended with status: ${prediction.status}.`;
                console.error("Replicate polling/final error:", finalError);
                throw new Error(finalError);
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error("Internal server error in textToSpeech flow:", errorMessage);
            throw new Error(`Failed to generate audio with Replicate: ${errorMessage}`);
        }
    }
);
