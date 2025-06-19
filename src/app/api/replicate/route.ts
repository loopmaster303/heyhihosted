
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// These should match the keys in src/config/replicate-models.ts
const MODEL_VERSIONS: Record<string, string> = {
  "imagen-4-ultra": "google/imagen-4-ultra:41efc359a3532b0bbd076f767fae4318a4859a6ffbf7f04c8c22a6f6c3b12fd8",
  "flux-kontext-max": "black-forest-labs/flux-kontext-max:dfec52f5191e1e0c8e054f259bbaf22f9e7b1ed97ea51012d951181869fb86be",
  "flux-kontext-pro": "black-forest-labs/flux-kontext-pro:402c39d028c3e2c58aebfad299fa1e3b0f626da07b252325d87e59161fd2be91",
  "veo-3": "google/veo-3:139def04146afc5fdb23f3e1b8e15c93e6a75ad8ec17cbe924060c2485a5d570"
  // Add other model versions here as "modelKey": "replicate_owner/model_name:version_hash"
};

export async function POST(request: NextRequest) {
  if (!process.env.REPLICATE_API_KEY) {
    console.error('REPLICATE_API_KEY is not set in .env');
    return NextResponse.json({ error: 'Server configuration error: REPLICATE_API_KEY is missing.' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
  }
  
  const { model: modelKey, ...inputParams } = body;

  if (!modelKey || typeof modelKey !== 'string' || !MODEL_VERSIONS[modelKey]) {
    return NextResponse.json({ error: 'Unknown or invalid model specified.' }, { status: 400 });
  }

  // Sanitize inputParams: Replicate expects numbers for numerical fields
  const sanitizedInput: Record<string, any> = {};
  for (const key in inputParams) {
    const value = inputParams[key];
    // Attempt to convert to number if it looks like one, otherwise pass as string
    // This is a basic sanitization. More robust validation based on modelConfig.type would be better.
    if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value) && !isNaN(parseFloat(value))) {
      sanitizedInput[key] = parseFloat(value);
    } else if (typeof value === 'number') {
      sanitizedInput[key] = value;
    } else if (typeof value === 'boolean') {
      sanitizedInput[key] = value;
    } else if (typeof value === 'string' && value.trim() !== "") {
        sanitizedInput[key] = value.trim();
    } else if (value === null || (typeof value === 'string' && value.trim() === "")) {
        // Explicitly skip sending empty strings or nulls if Replicate doesn't like them
        // or convert to Replicate's expected format for "no value" if necessary.
        // For now, we skip them.
    }
  }
  
  // Remove empty prompt if that's the only thing to avoid issues with some models
  if (sanitizedInput.prompt === "" && Object.keys(sanitizedInput).length === 1) {
    delete sanitizedInput.prompt;
  }


  try {
    const startResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: MODEL_VERSIONS[modelKey], // Use the mapped version hash
        input: sanitizedInput,
      }),
    });

    if (!startResponse.ok) {
        const errorBody = await startResponse.json().catch(() => ({ error: `Replicate API error ${startResponse.status}` }));
        console.error('Replicate API error (initial prediction):', errorBody);
        return NextResponse.json({ error: errorBody.detail || errorBody.error || 'Failed to start prediction with Replicate.' }, { status: startResponse.status });
    }

    let prediction = await startResponse.json();

    // Polling logic
    if (prediction.urls && prediction.urls.get) {
      while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Poll interval
        const pollResponse = await fetch(prediction.urls.get, {
          headers: { 
            'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
            'Content-Type': 'application/json', // Added for consistency, though GET usually doesn't need it
           }
        });
        if (!pollResponse.ok) {
            const errorBody = await pollResponse.json().catch(() => ({ error: `Replicate API polling error ${pollResponse.status}` }));
            console.error('Replicate API polling error:', errorBody);
            // If polling fails, it might be a temporary issue or the prediction ID is lost.
            // Depending on the error, you might want to stop or retry.
            // For now, assume the prediction might still be running and let client retry or reflect last known state.
             return NextResponse.json({ error: errorBody.detail || errorBody.error || 'Failed to poll prediction status from Replicate.' }, { status: pollResponse.status });
        }
        prediction = await pollResponse.json();
      }
    }

    if (prediction.status === "succeeded") {
      // The output can be a string (URL) or an array of URLs
      return NextResponse.json({ output: prediction.output });
    } else if (prediction.status === "failed" || prediction.status === "canceled") {
      return NextResponse.json({ error: prediction.error || `Prediction ${prediction.status}.` }, { status: 500 });
    } else {
       // Should not happen if polling is complete, but as a fallback
       return NextResponse.json({ error: 'Prediction did not succeed or fail in time.', status: prediction.status }, { status: 202 }); // Accepted but not finished
    }

  } catch (err) {
    console.error('Error in /api/replicate route:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Internal server error processing Replicate request.', details: errorMessage }, { status: 500 });
  }
}
