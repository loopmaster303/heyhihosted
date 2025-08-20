
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MODEL_ENDPOINTS: Record<string, string> = {
  "imagen-4-ultra": "google/imagen-4-ultra",
  "flux-kontext-max": "black-forest-labs/flux-kontext-max",
  "flux-kontext-pro": "black-forest-labs/flux-kontext-pro",
  "flux-krea-dev": "black-forest-labs/flux-krea-dev",
  "runway-gen4-image": "runwayml/gen4-image",
  "qwen-image": "qwen/qwen-image"
};

export async function POST(request: NextRequest) {
  // --- Simple Password Check ---
  const masterPassword = process.env.REPLICATE_TOOL_PASSWORD;
  
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
  }
  
  // If a master password is set in the environment, we must validate it.
  if (masterPassword) {
    const { password: userPassword } = body;
    if (userPassword !== masterPassword) {
      return NextResponse.json({ error: 'Invalid or missing password. Please provide the correct password in the settings.' }, { status: 401 });
    }
  }

  const replicateApiToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateApiToken) {
    return NextResponse.json({ error: 'Server configuration error: REPLICATE_API_TOKEN is missing.' }, { status: 500 });
  }
  
  const { model: modelKey, password, ...inputParams } = body;

  if (!modelKey || typeof modelKey !== 'string' || !MODEL_ENDPOINTS[modelKey]) {
    return NextResponse.json({
      error: `Unknown or invalid model: ${modelKey}. Available: ${Object.keys(MODEL_ENDPOINTS).join(', ')}`
    }, { status: 400 });
  }

  const endpoint = `https://api.replicate.com/v1/models/${MODEL_ENDPOINTS[modelKey]}/predictions`;

  const sanitizedInput: Record<string, any> = {};
  for (const key in inputParams) {
    const value = inputParams[key];
    if (value !== null && value !== undefined) {
       sanitizedInput[key] = value;
    }
  }

  try {
    const startResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: sanitizedInput }),
    });

    if (!startResponse.ok) {
      const errorBody = await startResponse.json().catch(() => ({ detail: `Replicate API error ${startResponse.status}.` }));
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
      retryCount < 60 &&
      prediction.urls?.get
    ) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const pollResponse = await fetch(prediction.urls.get, {
        headers: { 'Authorization': `Token ${replicateApiToken}` }
      });
      if (!pollResponse.ok) break;
      prediction = await pollResponse.json();
      retryCount++;
    }

    if (prediction.status === "succeeded") {
      return NextResponse.json({ output: prediction.output });
    } else if (prediction.status === "failed" || prediction.status === "canceled") {
      return NextResponse.json({
        error: prediction.error || `Prediction ${prediction.status}.`
      }, { status: 500 });
    } else if (retryCount >= 60) {
      return NextResponse.json({
        error: 'Prediction polling timed out.',
        status: prediction.status
      }, { status: 504 });
    } else {
      return NextResponse.json({
        error: 'Prediction did not reach a final state.',
        status: prediction.status || 'unknown'
      }, { status: 500 });
    }

  } catch (err) {
    return NextResponse.json({
      error: 'Internal server error processing Replicate request.',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
