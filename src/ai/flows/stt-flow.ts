// src/ai/flows/stt-flow.ts

import Replicate from "replicate";

// Initialize Replicate with your API token
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

interface TranscribeAudioInput {
  audioFile: Blob | File; // Accept Blob or File
}

interface TranscribeAudioOutput {
  transcription: string;
}

export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  const { audioFile } = input;

  if (!audioFile) {
    throw new Error('No audio file provided for transcription.');
  }

  try {
    console.log("Sending audio to Replicate for transcription:", {
        type: audioFile.type,
        size: audioFile.size
    });

    // Call the Replicate API
    const prediction = await replicate.predictions.create({
      model: "openai/whisper:375283cd38485b259e1cb23877232566f8764ed9fda0e450ba87893688ae9ed0", // gpt-4o-transcribe model ID
      input: { audio: audioFile },
    });

    // Replicate's API is asynchronous. We need to wait for the prediction to complete.
    // This polling logic might need to be more robust in a production environment.
    let currentPrediction = prediction;
    while (currentPrediction.status !== "succeeded" && currentPrediction.status !== "failed" && currentPrediction.status !== "canceled") {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        try {
            currentPrediction = await replicate.predictions.get(currentPrediction.id);
        } catch (pollError) {
            console.error("Error polling Replicate prediction status:", pollError);
            // Optionally handle specific polling errors
        }
    }

    if (currentPrediction.status === "failed") {
        console.error("Replicate prediction failed:", currentPrediction.error);
        throw new Error(currentPrediction.error || 'Replicate transcription failed.');
    } else if (currentPrediction.status === "canceled") {
         console.warn("Replicate prediction was canceled.");
         throw new Error('Replicate transcription was canceled.');
    }

    const transcription = (currentPrediction.output as any)?.text || '';

    return { transcription };

  } catch (error) {
    console.error('Error in transcribeAudio flow:', error);
    throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
