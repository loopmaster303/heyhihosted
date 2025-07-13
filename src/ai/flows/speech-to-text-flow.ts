
'use server';
/**
 * @fileOverview Converts speech to text using the Replicate API with OpenAI's Whisper model.
 *
 * - speechToText - Transcribes an audio file into text.
 */

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const WHISPER_MODEL_ENDPOINT = "https://api.replicate.com/v1/models/openai/whisper/predictions";

export async function speechToText(audioDataUri: string): Promise<{ transcript: string }> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('Server configuration error: REPLICATE_API_TOKEN is missing.');
  }
  if (!audioDataUri || !audioDataUri.startsWith('data:audio')) {
    throw new Error('A valid audio data URI must be provided.');
  }

  const inputPayload = {
    audio: audioDataUri,
    model: "large-v3", // Use the latest large model for best accuracy
    transcribe_word_timestamps: false,
    language: null, // Auto-detect language
    prompt: "", // No specific priming prompt
  };

  try {
    const startResponse = await fetch(WHISPER_MODEL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: inputPayload }),
    });

    if (!startResponse.ok) {
      const errorBody = await startResponse.json().catch(() => ({ detail: `Replicate API error ${startResponse.status}.` }));
      console.error("Replicate start error (Whisper):", errorBody);
      throw new Error(errorBody.detail || 'Failed to start Whisper prediction with Replicate.');
    }

    let prediction = await startResponse.json();

    let retryCount = 0;
    const maxRetries = 50; // Max ~100 seconds polling for potentially long audio
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      prediction.status !== "canceled" &&
      retryCount < maxRetries &&
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

    if (prediction.status === "succeeded" && prediction.output?.transcription) {
      return { transcript: prediction.output.transcription };
    } else {
        const finalError = prediction.error || `Prediction ended with status: ${prediction.status}.`;
        console.error("Replicate polling/final error (Whisper):", finalError);
        throw new Error(finalError);
    }

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Internal server error in speechToText flow:", errorMessage);
    throw new Error(`Failed to transcribe audio with Replicate: ${errorMessage}`);
  }
}
