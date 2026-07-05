#!/usr/bin/env node

const BASE_URL = process.env.HEYHI_BASE_URL || 'http://localhost:3000';
const IMAGE_URL = process.env.PRUNA_SMOKE_IMAGE_URL;
const SECOND_IMAGE_URL = process.env.PRUNA_SMOKE_SECOND_IMAGE_URL || IMAGE_URL;
const VIDEO_URL = process.env.PRUNA_SMOKE_VIDEO_URL;

const commonPrompt = 'minimal integration smoke test, simple object on a clean background';

const scenarios = {
  'p-image-edit': {
    needs: ['PRUNA_SMOKE_IMAGE_URL'],
    body: () => ({
      model: 'p-image-edit',
      prompt: 'make image 1 more cinematic',
      image: IMAGE_URL,
      aspectRatio: '1:1',
    }),
  },
  'p-image-upscale': {
    needs: ['PRUNA_SMOKE_IMAGE_URL'],
    body: () => ({
      model: 'p-image-upscale',
      prompt: 'upscale this image',
      image: IMAGE_URL,
      width: 2048,
      height: 2048,
    }),
  },
  'p-image-try-on': {
    needs: ['PRUNA_SMOKE_IMAGE_URL', 'PRUNA_SMOKE_SECOND_IMAGE_URL'],
    body: () => ({
      model: 'p-image-try-on',
      prompt: 'fit the garment naturally',
      image: [IMAGE_URL, SECOND_IMAGE_URL],
    }),
  },
  'p-video-avatar': {
    needs: ['PRUNA_SMOKE_IMAGE_URL'],
    body: () => ({
      model: 'p-video-avatar',
      prompt: 'The person says hello.',
      image: IMAGE_URL,
    }),
  },
  'p-video': {
    body: () => ({
      model: 'p-video',
      prompt: commonPrompt,
      aspectRatio: '16:9',
      duration: 1,
      audio: false,
    }),
  },
  vace: {
    body: () => ({
      model: 'vace',
      prompt: commonPrompt,
      aspectRatio: '16:9',
      duration: 1,
      audio: false,
    }),
  },
  'wan-t2v': {
    body: () => ({
      model: 'wan-t2v',
      prompt: commonPrompt,
      aspectRatio: '16:9',
      duration: 1,
      audio: false,
    }),
  },
  'wan-fast': {
    body: () => ({
      model: 'wan-fast',
      prompt: commonPrompt,
      aspectRatio: '16:9',
      duration: 1,
      audio: false,
    }),
  },
  'p-video-animate': {
    needs: ['PRUNA_SMOKE_VIDEO_URL', 'PRUNA_SMOKE_IMAGE_URL'],
    body: () => ({
      model: 'p-video-animate',
      prompt: 'animate the subject using the source motion',
      video: VIDEO_URL,
      image: IMAGE_URL,
      audio: false,
    }),
  },
  'p-video-replace': {
    needs: ['PRUNA_SMOKE_VIDEO_URL', 'PRUNA_SMOKE_IMAGE_URL'],
    body: () => ({
      model: 'p-video-replace',
      prompt: 'replace the main subject',
      video: VIDEO_URL,
      image: SECOND_IMAGE_URL ? [IMAGE_URL, SECOND_IMAGE_URL] : IMAGE_URL,
      audio: false,
    }),
  },
};

function missingEnvFor(scenario) {
  return (scenario.needs || []).filter((name) => !process.env[name]);
}

async function runScenario(modelId, scenario) {
  const missing = missingEnvFor(scenario);
  if (missing.length > 0) {
    return {
      modelId,
      skipped: true,
      reason: `missing ${missing.join(', ')}`,
    };
  }

  const response = await fetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scenario.body()),
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  return {
    modelId,
    status: response.status,
    ok: response.ok,
    hasImageUrl: !!body.imageUrl,
    hasVideoUrl: !!body.videoUrl,
    error: body.error,
  };
}

async function main() {
  const requested = process.argv.slice(2);
  const modelIds = requested.length > 0 && requested[0] !== 'all'
    ? requested
    : Object.keys(scenarios);

  const unknown = modelIds.filter((modelId) => !scenarios[modelId]);
  if (unknown.length > 0) {
    console.error(`Unknown Pruna smoke scenario(s): ${unknown.join(', ')}`);
    console.error(`Known scenarios: ${Object.keys(scenarios).join(', ')}`);
    process.exit(2);
  }

  const results = [];
  for (const modelId of modelIds) {
    const result = await runScenario(modelId, scenarios[modelId]);
    results.push(result);
    console.log(JSON.stringify(result));
  }

  const failed = results.filter((result) => !result.skipped && (!result.ok || (!result.hasImageUrl && !result.hasVideoUrl)));
  const skippedExplicit = requested.length > 0 && requested[0] !== 'all' && results.some((result) => result.skipped);

  if (failed.length > 0 || skippedExplicit) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
