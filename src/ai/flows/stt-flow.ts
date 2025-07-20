
'use server';
/**
 * @fileOverview Converts speech to text using the Replicate HTTP API.
 * This implementation uses direct fetch calls and polling because the Replicate SDK's
 * `replicate.run()` method does not correctly handle `data:` URIs for this model.
 *
 * - speechToText - Transcribes an audio file into text using openai/gpt-4o-transcribe.
 */

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_API_ENDPOINT = "https://api.replicate.com/v1/predictions";
const MODEL_VERSION = "fe49a592f98178ba939f2629ee17d79234b204cab4d9a5a15f861a7423a52ee6";

export async function speechToText(audioDataUri: string): Promise<{ transcription: string }> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('Server configuration error: REPLICATE_API_TOKEN is missing.');
  }
  if (!audioDataUri || !audioDataUri.startsWith('data:audio')) {
    throw new Error('A valid audio data URI must be provided.');
  }

  const inputPayload = {
    version: MODEL_VERSION,
    input: {
      audio_file: audioDataUri,
      temperature: 0,
    },
  };

  try {
    // 1. Start the prediction
    const startResponse = await fetch(REPLICATE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inputPayload),
    });

    if (!startResponse.ok) {
      const errorBody = await startResponse.json().catch(() => ({ detail: `Replicate API error ${startResponse.status}.` }));
      console.error("Replicate start error:", errorBody);
      throw new Error(errorBody.detail || 'Failed to start prediction with Replicate.');
    }

    let prediction = await startResponse.json();

    // 2. Poll for the result
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
      if (!pollResponse.ok) {
        // Stop polling if we can't get the status
        console.error("Replicate polling failed with status:", pollResponse.status);
        break;
      }
      prediction = await pollResponse.json();
      retryCount++;
    }

    // 3. Handle the final result
    if (prediction.status === "succeeded" && prediction.output) {
      // The output of this model is directly the transcription string.
      const transcription = Array.isArray(prediction.output) ? prediction.output.join('') : String(prediction.output);
      return { transcription: transcription.trim() };
    } else {
        const finalError = prediction.error || `Prediction ended with status: ${prediction.status}.`;
        console.error("Replicate polling/final error:", finalError);
        throw new Error(finalError);
    }

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Internal server error in speechToText flow:", errorMessage);
    throw new Error(`Failed to transcribe audio with Replicate: ${errorMessage}`);
  }
}
