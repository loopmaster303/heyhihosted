
'use server';
/**
 * @fileOverview Converts speech to text using the Replicate API with OpenAI's gpt-4o-transcribe model.
 * This flow now uses a two-step process: first uploading the file to Replicate to get a URL,
 * then starting the prediction with that URL.
 *
 * - speechToText - Transcribes an audio file into text.
 */

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_API_BASE_URL = "https://api.replicate.com/v1";

// The specific model identifier for GPT-4o Transcribe on Replicate
const MODEL_VERSION = "openai/gpt-4o-transcribe";

// Helper function to upload a file from a data URI
async function uploadFile(dataUri: string): Promise<string> {
  // 1. Request an upload URL from Replicate
  const uploadUrlResponse = await fetch(`${REPLICATE_API_BASE_URL}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Extract MIME type from data URI, e.g., 'audio/webm'
      mime_type: dataUri.substring(dataUri.indexOf(':') + 1, dataUri.indexOf(';')),
    }),
  });

  if (!uploadUrlResponse.ok) {
    throw new Error('Failed to get an upload URL from Replicate.');
  }
  const uploadData = await uploadUrlResponse.json();
  const { serving_url: servingUrl, upload_url: uploadUrl } = uploadData;

  // 2. Upload the actual file data to the provided URL
  // Convert data URI to a Buffer
  const fileBuffer = Buffer.from(dataUri.split(',')[1], 'base64');
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      // Use the correct MIME type for the upload
      'Content-Type': dataUri.substring(dataUri.indexOf(':') + 1, dataUri.indexOf(';')),
    },
    body: fileBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload the file to the provided Replicate URL.');
  }

  // 3. Return the public URL of the uploaded file
  return servingUrl;
}


export async function speechToText(audioDataUri: string): Promise<{ transcription: string }> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('Server configuration error: REPLICATE_API_TOKEN is missing.');
  }
  if (!audioDataUri || !audioDataUri.startsWith('data:audio')) {
    throw new Error('A valid audio data URI must be provided.');
  }

  try {
    // Step 1: Upload the file to get a public URL
    const fileUrl = await uploadFile(audioDataUri);

    const inputPayload = {
      audio_file: fileUrl,
      temperature: 0,
    };

    // Step 2: Start the prediction with the file URL
    const startResponse = await fetch(`${REPLICATE_API_BASE_URL}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_VERSION,
        input: inputPayload,
      }),
    });

    if (!startResponse.ok) {
      const errorBody = await startResponse.json().catch(() => ({ detail: `Replicate API error ${startResponse.status}.` }));
      console.error("Replicate start error:", errorBody);
      throw new Error(errorBody.detail || `Failed to start prediction. Status: ${startResponse.status}`);
    }

    let prediction = await startResponse.json();
    const predictionId = prediction.id;

    if (!predictionId) {
        throw new Error("Failed to get a prediction ID from Replicate.");
    }

    // Step 3: Poll for the result
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
        headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
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

    // Step 4: Check final status and return output
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
