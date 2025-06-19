
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Ensure these keys match EXACTLY with the keys in src/config/replicate-models.ts
const MODEL_VERSIONS: Record<string, string> = {
  "imagen-4-ultra": "google/imagen-4-ultra:41efc359a3532b0bbd076f767fae4318a4859a6ffbf7f04c8c22a6f6c3b12fd8",
  "flux-kontext-max": "black-forest-labs/flux-kontext-max:dfec52f5191e1e0c8e054f259bbaf22f9e7b1ed97ea51012d951181869fb86be",
  "flux-kontext-pro": "black-forest-labs/flux-kontext-pro:402c39d028c3e2c58aebfad299fa1e3b0f626da07b252325d87e59161fd2be91",
  "veo-3": "google/veo-3:139def04146afc5fdb23f3e1b8e15c93e6a75ad8ec17cbe924060c2485a5d570"
  // Add other model versions here as "modelKey": "replicate_owner/model_name:version_hash"
};

const MAX_POLLING_RETRIES = 60; // Max 60 retries (e.g., 2 minutes if polling every 2 seconds)
const POLLING_INTERVAL_MS = 2000; // Poll every 2 seconds

export async function POST(request: NextRequest) {
  if (!process.env.REPLICATE_API_KEY) {
    console.error('REPLICATE_API_KEY is not set in .env');
    return NextResponse.json({ error: 'Server configuration error: REPLICATE_API_KEY is missing.' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    console.error('Invalid JSON in request body:', e);
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
  }
  
  const { model: modelKey, ...inputParams } = body;

  if (!modelKey || typeof modelKey !== 'string' || !MODEL_VERSIONS[modelKey]) {
    return NextResponse.json({ error: `Unknown or invalid model specified: ${modelKey}. Available models: ${Object.keys(MODEL_VERSIONS).join(', ')}` }, { status: 400 });
  }

  // Sanitize inputParams: Replicate expects numbers for numerical fields
  const sanitizedInput: Record<string, any> = {};
  for (const key in inputParams) {
    const value = inputParams[key];
    if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value) && !isNaN(parseFloat(value))) {
      sanitizedInput[key] = parseFloat(value);
    } else if (typeof value === 'number') {
      sanitizedInput[key] = value;
    } else if (typeof value === 'boolean') {
      sanitizedInput[key] = value;
    } else if (typeof value === 'string') { // Allow empty strings to be passed
        sanitizedInput[key] = value;
    } else if (value !== null && value !== undefined) { // Handle other types if necessary, or just pass if Replicate supports them
        sanitizedInput[key] = value;
    }
    // Null or undefined values are implicitly skipped unless explicitly handled
  }
  
  try {
    const startResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: MODEL_VERSIONS[modelKey],
        input: sanitizedInput,
      }),
    });

    if (!startResponse.ok) {
        const errorBody = await startResponse.json().catch(() => ({ detail: `Replicate API error ${startResponse.status}. Could not parse error body.` }));
        console.error('Replicate API error (initial prediction):', errorBody);
        return NextResponse.json({ error: errorBody.detail || 'Failed to start prediction with Replicate.' }, { status: startResponse.status });
    }

    let prediction = await startResponse.json();
    let retryCount = 0;

    // Polling logic
    if (prediction.urls && prediction.urls.get) {
      while (
        prediction.status !== "succeeded" &&
        prediction.status !== "failed" &&
        prediction.status !== "canceled" &&
        retryCount < MAX_POLLING_RETRIES
      ) {
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
        const pollResponse = await fetch(prediction.urls.get, {
          headers: { 
            'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
           }
        });
        if (!pollResponse.ok) {
            const errorBody = await pollResponse.json().catch(() => ({ detail: `Replicate API polling error ${pollResponse.status}. Could not parse error body.` }));
            console.error('Replicate API polling error:', errorBody);
             return NextResponse.json({ error: errorBody.detail || 'Failed to poll prediction status from Replicate.' }, { status: pollResponse.status });
        }
        prediction = await pollResponse.json();
        retryCount++;
      }
    } else if (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
      // If there's no "get" URL and the status isn't terminal, it implies an issue with the initial response structure
      // or the prediction finished/failed very quickly without providing a get URL (less common).
      console.warn('Prediction started but no polling URL provided, and status is not terminal:', prediction);
    }


    if (prediction.status === "succeeded") {
      return NextResponse.json({ output: prediction.output });
    } else if (prediction.status === "failed" || prediction.status === "canceled") {
      console.error(`Replicate prediction ${prediction.status}:`, prediction.error);
      return NextResponse.json({ error: prediction.error || `Prediction ${prediction.status}.` }, { status: 500 });
    } else if (retryCount >= MAX_POLLING_RETRIES) {
      console.error('Replicate prediction polling timed out.');
      return NextResponse.json({ error: 'Prediction polling timed out. The task might still be running on Replicate.', status: prediction.status }, { status: 504 }); // Gateway Timeout
    } else {
       // This case should ideally not be reached if the initial response was valid and polling occurred.
       // It might indicate an unexpected state or that the prediction finished immediately without a poll URL but wasn't "succeeded".
       console.warn('Prediction in an unexpected state after polling attempt:', prediction);
       return NextResponse.json({ error: 'Prediction did not reach a final state or an unexpected error occurred.', status: prediction.status || 'unknown' }, { status: 500 });
    }

  } catch (err) {
    console.error('Error in /api/replicate route:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Internal server error processing Replicate request.', details: errorMessage }, { status: 500 });
  }
}

