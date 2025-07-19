
'use server';
/**
 * @fileOverview Converts speech to text using the Replicate Whisper API.
 *
 * - speechToText - Converts an audio data URI into transcribed text.
 */

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
// This is the specific, correct model version for openai/whisper on Replicate
const WHISPER_MODEL_VERSION = "8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e";
const REPLICATE_API_ENDPOINT = "https://api.replicate.com/v1/predictions";


export async function speechToText(audioDataUri: string): Promise<{ transcription: string }> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('Server configuration error: REPLICATE_API_TOKEN is missing.');
  }
  if (!audioDataUri) {
    throw new Error('Input audio data URI cannot be empty.');
  }

  // The input for this model is a data URI or a public URL.
  // We pass the data URI directly.
  const inputPayload = {
    audio: audioDataUri,
    model: "large-v3",
    translate: false,
    temperature: 0,
    transcription: "plain text",
    suppress_tokens: "-1",
    logprob_threshold: -1.0,
    no_speech_threshold: 0.6,
    condition_on_previous_text: true,
    compression_ratio_threshold: 2.4,
    temperature_increment_on_fallback: 0.2
  };

  try {
    // 1. Start the prediction
    const startResponse = await fetch(REPLICATE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ version: WHISPER_MODEL_VERSION, input: inputPayload }),
    });

    if (!startResponse.ok) {
      const errorBody = await startResponse.json().catch(() => ({ detail: `Replicate API error ${startResponse.status}.` }));
      console.error("Replicate STT start error:", errorBody);
      throw new Error(errorBody.detail || 'Failed to start STT prediction with Replicate.');
    }

    let prediction = await startResponse.json();
    const predictionId = prediction.id;

    if (!prediction.urls?.get) {
        throw new Error('Failed to get prediction status URL from Replicate.');
    }
    
    // 2. Poll for the result using the correct endpoint
    let retryCount = 0;
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      prediction.status !== "canceled" &&
      retryCount < 40 // Max ~80 seconds polling
    ) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const pollResponse = await fetch(`${REPLICATE_API_ENDPOINT}/${predictionId}`, {
        headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
      });

      if (!pollResponse.ok) {
        console.error(`Polling failed with status: ${pollResponse.status}`);
        // Optional: you might want to throw an error here or just break the loop
        break; 
      }
      prediction = await pollResponse.json();
      retryCount++;
    }

    // 3. Process the final result
    if (prediction.status === "succeeded" && prediction.output) {
      // Based on the schema, the output is an object with a 'transcription' property.
      const transcriptionText = (prediction.output?.transcription ?? '').toString();
      
      return { transcription: transcriptionText.trim() };
    } else {
        const finalError = prediction.error || `Prediction ended with status: ${prediction.status}.`;
        console.error("Replicate STT polling/final error:", finalError);
        throw new Error(String(finalError));
    }

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Internal server error in speechToText flow:", errorMessage);
    // Propagate a user-friendly error
    throw new Error(`Failed to transcribe audio with Replicate: ${errorMessage}`);
  }
}
