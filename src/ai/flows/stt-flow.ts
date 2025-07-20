
'use server';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_API_ENDPOINT = "https://api.replicate.com/v1/predictions";
// Pinned version for openai/gpt-4o-transcribe
const MODEL_VERSION = "fe49a592f98178ba939f2629ee17d79234b204cab4d9a5a15f861a7423a52ee6"; 

/**
 * Transcribes an audio data URI using the Replicate HTTP API.
 * This function manually polls for the result.
 * @param audioDataUri The audio data as a base64 data URI.
 * @returns An object containing the transcription text.
 */
export async function transcribeAudio(audioDataUri: string): Promise<{ transcription: string }> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('Server configuration error: REPLICATE_API_TOKEN is missing.');
  }
  if (!audioDataUri || !audioDataUri.startsWith("data:audio")) {
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
    // Start the prediction
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
      console.error("Replicate start error:", errorBody);
      throw new Error(errorBody?.detail || `Failed to start prediction with Replicate. Status: ${startResponse.status}`);
    }

    let prediction = await startResponse.json();

    // Poll for the result
    let retries = 0;
    const maxRetries = 40; // Approx 80 seconds
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      prediction.status !== "canceled" &&
      retries < maxRetries &&
      prediction.urls?.get
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const pollResponse = await fetch(prediction.urls.get, {
        headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
      });
      if (!pollResponse.ok) {
        // Stop polling if the poll request itself fails
        console.error(`Replicate polling failed with status: ${pollResponse.status}`);
        break; 
      }
      prediction = await pollResponse.json();
      retries++;
    }

    // Check the final status
    if (prediction.status === "succeeded" && prediction.output) {
      const transcriptionText = Array.isArray(prediction.output)
        ? prediction.output.join("")
        : String(prediction.output);
        
      if (!transcriptionText) {
         console.warn("Replicate STT returned a successful status but no transcription text.");
         return { transcription: "" };
      }

      return { transcription: transcriptionText.trim() };
    } else {
      const finalError = prediction.error || `Prediction ended with status: ${prediction.status}.`;
      console.error("Replicate final error:", finalError);
      throw new Error(finalError);
    }

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Internal server error in STT flow:", errorMessage);
    throw new Error(`Failed to transcribe audio with Replicate: ${errorMessage}`);
  }
}
