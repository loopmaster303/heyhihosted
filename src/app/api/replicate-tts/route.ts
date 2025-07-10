import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_MODEL_ENDPOINT = "https://api.replicate.com/v1/models/minimax/speech-02-turbo/predictions";

export async function POST(request: NextRequest) {
  if (!REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'Server configuration error: REPLICATE_API_TOKEN is missing.' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
  }

  const { text, voice_id } = body;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return NextResponse.json({ error: 'The "text" parameter is required and cannot be empty.' }, { status: 400 });
  }
  if (!voice_id || typeof voice_id !== 'string') {
    return NextResponse.json({ error: 'The "voice_id" parameter is required.' }, { status: 400 });
  }

  const inputPayload = {
    text: text.trim(),
    voice_id: voice_id,
    emotion: "auto",
    language_boost: "auto",
    english_normalization: false,
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
      console.error("Replicate start error:", errorBody);
      return NextResponse.json({
        error: errorBody.detail || 'Failed to start prediction with Replicate.'
      }, { status: startResponse.status });
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

    if (prediction.status === "succeeded" && prediction.output) {
      return NextResponse.json({ audioUrl: prediction.output });
    } else {
        const finalError = prediction.error || `Prediction ended with status: ${prediction.status}.`;
        console.error("Replicate polling/final error:", finalError);
        return NextResponse.json({ error: finalError }, { status: 500 });
    }

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Internal server error in replicate-tts route:", errorMessage);
    return NextResponse.json({
      error: 'Internal server error processing Replicate TTS request.',
      details: errorMessage,
    }, { status: 500 });
  }
}
