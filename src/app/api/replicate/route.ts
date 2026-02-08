
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { handleApiError, requireEnv, ApiError, apiErrors } from '@/lib/api-error-handler';
import type { ReplicatePrediction } from '@/types/api';

const MODEL_ENDPOINTS: Record<string, string> = {
  // --- Video Models ---
  "wan-video/wan-2.5-t2v": "wan-video/wan-2.5-t2v",
  "wan-video/wan-2.5-i2v": "wan-video/wan-2.5-i2v",
  "google/veo-3.1-fast": "google/veo-3.1-fast",

  // --- Image Models (Flux/Turbo) ---

  "prunaai/z-image-turbo": "prunaai/z-image-turbo",

  // --- Legacy Mappings (if still referenced) ---
  "nanobanana-pro": "google/nano-banana-pro",
  "nano-banana-pro": "google/nano-banana-pro", // Fallback für alte Referenzen

  "veo-3.1-fast": "google/veo-3.1-fast",
  "z-image-turbo": "prunaai/z-image-turbo",
  "wan-2.5-t2v": "wan-video/wan-2.5-t2v",
  "wan-video": "wan-video/wan-2.5-i2v",
  "hailuo-02": "minimax/hailuo-02",
  "seedream-4": "bytedance/seedream-4",

  // --- NEW Replicate Models ---
  "flux-2-max": "black-forest-labs/flux-2-max",
  "flux-2-klein-9b": "black-forest-labs/flux-2-klein-9b",
  "grok-imagine-video": "xai/grok-imagine-video",
};

export async function POST(request: NextRequest) {
  try {
    // --- Simple Password Check ---
    const masterPassword = process.env.REPLICATE_TOOL_PASSWORD;

    const body = await request.json();

    // If a master password is set in the environment, we must validate it.
    if (masterPassword) {
      const { password: userPassword } = body;
      if (userPassword !== masterPassword) {
        throw apiErrors.unauthorized('Invalid or missing password. Please provide the correct password in the settings.');
      }
    }

    const replicateApiToken = requireEnv('REPLICATE_API_TOKEN');

    const { model: modelKey, password, ...inputParams } = body;

    if (!modelKey || typeof modelKey !== 'string' || !MODEL_ENDPOINTS[modelKey]) {
      throw apiErrors.badRequest(`Unknown or invalid model: ${modelKey}. Available: ${Object.keys(MODEL_ENDPOINTS).join(', ')}`);
    }

    const endpoint = `https://api.replicate.com/v1/models/${MODEL_ENDPOINTS[modelKey]}/predictions`;

    const sanitizedInput: Record<string, string | number | boolean | string[]> = {};
    for (const key in inputParams) {
      const value = inputParams[key];
      if (value !== null && value !== undefined) {
        // Handle image parameters - ensure they are passed through correctly
        if (key === "input_images" || key === "image_input" || key === "input_image" || key === "image") {
          // For image arrays, ensure they are passed as arrays
          if (Array.isArray(value)) {
            sanitizedInput[key] = value;
          } else {
            // For single images, ensure they are passed as strings
            sanitizedInput[key] = String(value);
          }
        } else if (key === "megapixels") {
          // WAN models expect integer, Flux models expect string
          if (modelKey.includes("wan") || modelKey.includes("ideogram")) {
            sanitizedInput[key] = typeof value === "string" ? parseInt(value, 10) : value;
          } else {
            // Keep as string for Flux models
            sanitizedInput[key] = String(value);
          }
        } else if ((key === "seed" || key === "duration") && typeof value === "string") {
          const parsed = parseInt(value, 10);
          if (!Number.isNaN(parsed)) {
            sanitizedInput[key] = parsed;
          }
        } else if (key === "output_quality" && typeof value === "string") {
          sanitizedInput[key] = parseInt(value, 10);
        } else {
          sanitizedInput[key] = value;
        }
      }
    }

    // --- Inject hidden defaults for new models ---
    if (modelKey === 'flux-2-max') {
      sanitizedInput.output_quality = 100;
      sanitizedInput.safety_tolerance = 5;
    } else if (modelKey === 'flux-2-klein-9b') {
      sanitizedInput.output_quality = 100;
      sanitizedInput.disable_safety_checker = true;
      if (sanitizedInput.go_fast === undefined) sanitizedInput.go_fast = false;
    }
    // grok-imagine-video has no safety param to set

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
      throw new ApiError(
        502,
        errorBody.detail || 'Failed to start prediction with Replicate.',
        'REPLICATE_START_ERROR'
      );
    }

    let prediction: ReplicatePrediction = await startResponse.json();

    const isWanVideo = modelKey === 'wan-video' || modelKey === 'wan-2.5-t2v';
    const isLongVideoModel = isWanVideo || modelKey === 'hailuo-02' || modelKey === 'veo-3-fast';
    const pollDelayMs = isLongVideoModel ? 4000 : 2000;
    const maxAttempts = isLongVideoModel ? 150 : 60;

    let retryCount = 0;
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      prediction.status !== "canceled" &&
      retryCount < maxAttempts &&
      prediction.urls?.get
    ) {
      await new Promise(resolve => setTimeout(resolve, pollDelayMs));
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
      throw new ApiError(
        500,
        prediction.error || `Prediction ${prediction.status}.`,
        'PREDICTION_FAILED'
      );
    } else if (retryCount >= maxAttempts) {
      throw new ApiError(
        504,
        'Prediction polling timed out.',
        'PREDICTION_TIMEOUT'
      );
    } else {
      throw new ApiError(
        500,
        'Prediction did not reach a final state.',
        'PREDICTION_INCOMPLETE'
      );
    }

  } catch (error) {
    return handleApiError(error);
  }
}


