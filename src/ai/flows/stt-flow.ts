'use server';
/**
 * @fileOverview A Genkit flow for Speech-to-Text (STT) conversion.
 *
 * - speechToText - Transcribes audio data into a string of text.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpeechToTextInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

const SpeechToTextOutputSchema = z.object({
  transcription: z.string(),
});

const speechToTextFlow = ai.defineFlow(
  {
    name: 'speechToTextFlow',
    inputSchema: SpeechToTextInputSchema,
    outputSchema: SpeechToTextOutputSchema,
  },
  async (input) => {
    const {text} = await ai.generate({
      prompt: [
        {text: "Transcribe the following audio recording accurately. Only return the transcribed text."},
        {media: {url: input.audioDataUri}}
      ],
      model: 'googleai/gemini-2.0-flash', // A model that supports audio input
    });

    return {
      transcription: text,
    };
  }
);

export async function speechToText(input: z.infer<typeof SpeechToTextInputSchema>): Promise<z.infer<typeof SpeechToTextOutputSchema>> {
    return speechToTextFlow(input);
}
