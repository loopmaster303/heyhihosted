import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface ModelConfig {
  ownerModel: string;
  version: string;
}

const MODEL_CONFIG: Record<string, ModelConfig> = {
  qwenrud: {
    ownerModel: 'loopmaster303/qwenrud',
    version: 'loopmaster303/qwenrud:d8789ad7f543f4452db88b451836840d167338519419918059362acbea9603ef',
  },
};

export async function POST(request: NextRequest) {
  const masterPassword = process.env.REPLICATE_TOOL_PASSWORD;

  let body: any;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
  }

  if (masterPassword) {
    if (body?.password !== masterPassword) {
      return NextResponse.json({ error: 'Invalid or missing password. Please provide the correct password in the settings.' }, { status: 401 });
    }
  }

  const replicateApiToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateApiToken) {
    return NextResponse.json({ error: 'Server configuration error: REPLICATE_API_TOKEN is missing.' }, { status: 500 });
  }

  const { model: modelKey, password: _password, ...inputParams } = body ?? {};

  if (!modelKey || typeof modelKey !== 'string' || !MODEL_CONFIG[modelKey]) {
    return NextResponse.json({
      error: `Unknown or invalid model: ${modelKey}. Available: ${Object.keys(MODEL_CONFIG).join(', ')}`,
    }, { status: 400 });
  }

  const endpoint = 'https://api.replicate.com/v1/predictions';
  const { version } = MODEL_CONFIG[modelKey];

  const sanitizedInput: Record<string, any> = {};
  for (const key in inputParams) {
    const value = inputParams[key];
    if (value === null || value === undefined || value === '') {
      continue;
    }

    if (key === 'seed' && typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (!Number.isNaN(parsed)) {
        sanitizedInput[key] = parsed;
        continue;
      }
    }

    if (key === 'output_quality' && typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (!Number.isNaN(parsed)) {
        sanitizedInput[key] = parsed;
        continue;
      }
    }

    sanitizedInput[key] = value;
  }

  try {
    const startResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Token ${replicateApiToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
      },
      body: JSON.stringify({
        version,
        input: sanitizedInput,
      }),
    });

    if (!startResponse.ok) {
      const errorBody = await startResponse.json().catch(() => ({ detail: `Replicate API error ${startResponse.status}.` }));
      return NextResponse.json({
        error: errorBody.detail || 'Failed to start prediction with Replicate.',
      }, { status: startResponse.status });
    }

    let prediction = await startResponse.json();

    let retryCount = 0;
    while (
      prediction.status !== 'succeeded' &&
      prediction.status !== 'failed' &&
      prediction.status !== 'canceled' &&
      retryCount < 60 &&
      prediction.urls?.get
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const pollResponse = await fetch(prediction.urls.get, {
        headers: { Authorization: `Token ${replicateApiToken}` },
      });
      if (!pollResponse.ok) break;
      prediction = await pollResponse.json();
      retryCount += 1;
    }

    if (prediction.status === 'succeeded') {
      return NextResponse.json({ output: prediction.output });
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      return NextResponse.json({
        error: prediction.error || `Prediction ${prediction.status}.`,
      }, { status: 500 });
    }

    if (retryCount >= 60) {
      return NextResponse.json({
        error: 'Prediction polling timed out.',
        status: prediction.status,
      }, { status: 504 });
    }

    return NextResponse.json({
      error: 'Prediction did not reach a final state.',
      status: prediction.status || 'unknown',
    }, { status: 500 });
  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error processing Replicate request.',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
