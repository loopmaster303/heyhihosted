
'use server';
/**
 * @fileOverview Converts speech to text using the Replicate API with OpenAI's gpt-4o-transcribe model.
 *
 * - speechToText - Transcribes an audio file into text.
 */

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_API_BASE_URL = "https://api.replicate.com/v1";

// Correct, versioned model identifier
const MODEL_VERSION = "openai/gpt-4o-transcribe";

export async function speechToText(audioDataUri: string): Promise<{ transcription: string }> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('Server configuration error: REPLICATE_API_TOKEN is missing.');
  }
  if (!audioDataUri || !audioDataUri.startsWith('data:audio')) {
    throw new Error('A valid audio data URI must be provided.');
  }

  const inputPayload = {
    audio_file: audioDataUri, // Use the correct parameter name 'audio_file'
    language: "auto",
  };

  try {
    // Step 1: Start the prediction
    const startResponse = await fetch(`${REPLICATE_API_BASE_URL}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: MODEL_VERSION,
        input: inputPayload,
      }),
    });

    if (!startResponse.ok) {
      const errorBody = await startResponse.json().catch(() => ({ detail: `Replicate API error ${startResponse.status}.` }));
      console.error("Replicate start error:", errorBody);
      throw new Error(errorBody.detail || 'Failed to start prediction with Replicate.');
    }

    let prediction = await startResponse.json();
    const predictionId = prediction.id;

    if (!predictionId) {
        throw new Error("Failed to get a prediction ID from Replicate.");
    }

    // Step 2: Poll for the result
    const pollEndpoint = `${REPLICATE_API_BASE_URL}/predictions/${predictionId}`;
    let retryCount = 0;
    const maxRetries = 50; 

    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      prediction.status !== "canceled" &&
      retryCount < maxRetries
    ) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const pollResponse = await fetch(pollEndpoint, {
        headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
      });
      if (!pollResponse.ok) {
        if (pollResponse.status === 404) {
             throw new Error("Prediction resource not found. It may have expired or been deleted.");
        }
        break;
      }
      prediction = await pollResponse.json();
      retryCount++;
    }

    // Step 3: Check final status and return output
    if (prediction.status === "succeeded" && prediction.output?.transcription) {
      return { transcription: prediction.output.transcription.trim() };
    } else {
        const finalError = prediction.error || `Prediction ended with status: ${prediction.status}.`;
        console.error("Replicate polling/final error:", finalError);
        throw new Error(String(finalError));
    }

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Internal server error in speechToText flow:", errorMessage);
    throw new Error(`Failed to transcribe audio with Replicate: ${errorMessage}`);
  }
}
