// src/app/api/stt/route.ts

import { NextResponse } from 'next/server';
import Replicate from "replicate";

// Initialize Replicate with your API token
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audioFile');

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json({ error: 'No audio file uploaded.' }, { status: 400 });
    }

    // Convert Blob to a format Replicate can handle (e.g., ArrayBuffer or Buffer)
    // Note: Replicate's Node.js client can often handle Blob directly, but let's ensure compatibility.
    // If issues arise, further conversion might be needed (e.g., using file.arrayBuffer()).

    console.log("Sending audio to Replicate:", {
        name: (audioFile as any).name,
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
    while (currentPrediction.status !== "succeeded" && currentPrediction.status !== "failed") {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        currentPrediction = await replicate.predictions.get(currentPrediction.id);
    }

    if (currentPrediction.status === "failed") {
        console.error("Replicate prediction failed:", currentPrediction.error);
        return NextResponse.json({ error: currentPrediction.error || 'Replicate transcription failed.' }, { status: 500 });
    }

    const transcription = (currentPrediction.output as any)?.text || '';

    return NextResponse.json({ transcription });
  } catch (error) {
    console.error('STT API Error:', error);
    return NextResponse.json({ error: 'Failed to process audio for transcription.' }, { status: 500 });
  }
}
