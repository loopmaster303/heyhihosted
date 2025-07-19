
'use server';
/**
 * @fileOverview Converts speech to text using the Replicate Whisper API.
 *
 * - speechToText - Converts an audio data URI into transcribed text.
 */

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
// Using a specific Whisper model version known for good performance.
const REPLICATE_MODEL_ENDPOINT = "https://api.replicate.com/v1/models/openai/whisper/predictions";

export async function speechToText(audioDataUri: string): Promise<{ transcription: string }> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('Server configuration error: REPLICATE_API_TOKEN is missing.');
  }
  if (!audioDataUri) {
    throw new Error('Input audio data URI cannot be empty.');
  }

  const inputPayload = {
    audio: audioDataUri,
    model: "large-v3", // Specify the model version
    translate: false, // Set to true to translate to English
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
      console.error("Replicate STT start error:", errorBody);
      throw new Error(errorBody.detail || 'Failed to start STT prediction with Replicate.');
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

    if (prediction.status === "succeeded" && prediction.output?.transcription) {
      return { transcription: prediction.output.transcription };
    } else {
        const finalError = prediction.error || `Prediction ended with status: ${prediction.status}.`;
        console.error("Replicate STT polling/final error:", finalError);
        throw new Error(finalError);
    }

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Internal server error in speechToText flow:", errorMessage);
    throw new Error(`Failed to transcribe audio with Replicate: ${errorMessage}`);
  }
}
