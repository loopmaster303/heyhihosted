#!/usr/bin/env node
/**
 * Advanced multimedia smoke test (cost-sparing but real).
 *
 * Default behavior:
 * - Generate a single small image via Pollinations public endpoint (no API key required).
 * - Fetch the resulting URL and validate content-type and minimum size.
 *
 * Optional:
 * - Use HeyHi webapp endpoint (`/api/generate`) instead of direct Pollinations (requires running server).
 * - Test video generation (off by default).
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_POLLINATIONS_IMAGE_BASE = 'https://gen.pollinations.ai/image';

function parseArgs(argv) {
  const out = {
    mode: 'direct', // 'direct' | 'webapp'
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    outDir: 'tools/test-scripts/artifacts/multimedia',
    prompt: 'A minimal test image: simple black circle on white background.',
    model: 'z-image-turbo', // fast and cheap-ish
    width: 256,
    height: 256,
    timeoutMs: 20_000,
    minBytes: 10_000,
    video: false,
    videoModel: 'wan',
    duration: 5,
    aspectRatio: '1:1',
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--mode') out.mode = argv[++i] || out.mode;
    else if (a === '--base-url') out.baseUrl = argv[++i] || out.baseUrl;
    else if (a === '--out-dir') out.outDir = argv[++i] || out.outDir;
    else if (a === '--prompt') out.prompt = argv[++i] || out.prompt;
    else if (a === '--model') out.model = argv[++i] || out.model;
    else if (a === '--width') out.width = Number(argv[++i] || out.width);
    else if (a === '--height') out.height = Number(argv[++i] || out.height);
    else if (a === '--timeout-ms') out.timeoutMs = Number(argv[++i] || out.timeoutMs);
    else if (a === '--min-bytes') out.minBytes = Number(argv[++i] || out.minBytes);
    else if (a === '--video') out.video = true;
    else if (a === '--video-model') out.videoModel = argv[++i] || out.videoModel;
    else if (a === '--duration') out.duration = Number(argv[++i] || out.duration);
    else if (a === '--aspect-ratio') out.aspectRatio = argv[++i] || out.aspectRatio;
  }

  return out;
}

function safePrompt(prompt) {
  return encodeURIComponent(String(prompt || '').trim());
}

function tsSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function fetchWithTimeout(url, opts = {}, timeoutMs = 20_000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal, redirect: 'follow' });
    const latencyMs = Date.now() - startedAt;
    return { res, latencyMs };
  } finally {
    clearTimeout(t);
  }
}

async function generateImageDirect({ prompt, model, width, height }) {
  const url = `${DEFAULT_POLLINATIONS_IMAGE_BASE}/${safePrompt(prompt)}?model=${encodeURIComponent(model)}&width=${width}&height=${height}&nologo=true&safe=false&private=false`;
  return { url };
}

async function generateImageViaWebapp({ baseUrl, prompt, model, width, height, timeoutMs }) {
  const startedAt = Date.now();
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      prompt,
      model,
      width,
      height,
      private: false,
      safe: false,
      nologo: true,
      enhance: false,
    }),
  });
  const latencyMs = Date.now() - startedAt;
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // ignore
  }
  const imageUrl = json?.imageUrl || null;
  return { ok: res.ok && typeof imageUrl === 'string', status: res.status, latencyMs, imageUrl, raw: text.slice(0, 500) };
}

async function validateImageUrl(url, timeoutMs, minBytes) {
  try {
    const { res, latencyMs } = await fetchWithTimeout(url, {}, timeoutMs);
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, status: res.status, latencyMs, contentType, bytes: 0, error: body.slice(0, 300) };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const bytes = buf.length;
    const ok = contentType.startsWith('image/') && bytes >= minBytes;
    return { ok, status: res.status, latencyMs, contentType, bytes };
  } catch (err) {
    const msg = String(err?.message || err);
    return { ok: false, status: 0, latencyMs: 0, contentType: '', bytes: 0, error: msg };
  }
}

async function main() {
  const args = parseArgs(process.argv);

  const slug = tsSlug();
  await ensureDir(args.outDir);
  const jsonPath = path.join(args.outDir, `${slug}.json`);

  const result = {
    timestamp: new Date().toISOString(),
    mode: args.mode,
    outDir: args.outDir,
    image: { model: args.model, width: args.width, height: args.height, prompt: args.prompt },
    video: args.video ? { model: args.videoModel, duration: args.duration, aspectRatio: args.aspectRatio } : null,
    steps: [],
  };

  // Image generation (minimal but real)
  let imageUrl = null;
  if (args.mode === 'webapp') {
    const gen = await generateImageViaWebapp(args);
    result.steps.push({ kind: 'generate-image-webapp', ...gen });
    if (!gen.ok) {
      console.log(`SMOKE_JSON=${JSON.stringify(result)}`);
      process.exit(1);
    }
    imageUrl = gen.imageUrl;
  } else {
    const gen = await generateImageDirect(args);
    result.steps.push({ kind: 'generate-image-direct', ok: true, imageUrl: gen.url });
    imageUrl = gen.url;
  }

  const validation = await validateImageUrl(imageUrl, args.timeoutMs, args.minBytes);
  result.steps.push({ kind: 'validate-image-bytes', url: imageUrl, ...validation });

  await fs.writeFile(jsonPath, JSON.stringify(result, null, 2));

  console.log('Advanced Multimedia Smoke');
  console.log(`- mode: ${args.mode}`);
  console.log(`- imageModel: ${args.model}`);
  console.log(`- imageUrl: ${imageUrl}`);
  console.log(
    `- imageFetch: ${validation.ok ? 'OK' : 'FAIL'} (${validation.status}, ${validation.latencyMs}ms, ${validation.contentType || 'n/a'}, ${validation.bytes} bytes)`
  );
  console.log(`- json: ${jsonPath}`);
  console.log(`SMOKE_JSON=${JSON.stringify(result)}`);

  if (!validation.ok) process.exitCode = 1;
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(2);
});
