#!/usr/bin/env node
/**
 * Webapp smoke-test for HeyHi (requires running server).
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node tools/test-scripts/webapp-smoke.mjs
 *
 * The script skips tests when required env vars are missing.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function hasEnv(name) {
  return Boolean(process.env[name] && String(process.env[name]).trim());
}

async function postJson(path, body, timeoutMs = 12_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    const latencyMs = Date.now() - startedAt;
    return { ok: res.ok, status: res.status, latencyMs, text };
  } finally {
    clearTimeout(timeout);
  }
}

async function postForm(path, formData, timeoutMs = 20_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    const text = await res.text();
    const latencyMs = Date.now() - startedAt;
    return { ok: res.ok, status: res.status, latencyMs, text };
  } finally {
    clearTimeout(timeout);
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function testChatCompletion() {
  // Server needs POLLEN_API_KEY configured to be reliable.
  if (!hasEnv('POLLEN_API_KEY') && !hasEnv('POLLINATIONS_API_KEY') && !hasEnv('POLLINATIONS_API_TOKEN')) {
    return { name: 'chatCompletion', skipped: true, reason: 'missing POLLEN_API_KEY*' };
  }

  const res = await postJson('/api/chat/completion', {
    modelId: 'perplexity-fast',
    messages: [{ role: 'user', content: 'Sag: ping' }],
    systemPrompt: 'Antworte exakt mit "ping". Keine Erklaerung.',
    skipSmartRouter: true,
  });

  const json = safeJson(res.text);
  const content = json?.choices?.[0]?.message?.content;
  return {
    name: 'chatCompletion',
    ok: res.ok && typeof content === 'string' && content.length > 0,
    status: res.status,
    latencyMs: res.latencyMs,
    sample: typeof content === 'string' ? content.slice(0, 120) : null,
  };
}

async function testCompose() {
  const res = await postJson('/api/compose', { prompt: 'lofi chill beat', duration: 30, instrumental: true }, 30_000);
  const json = safeJson(res.text);
  const audioUrl = json?.audioUrl;
  const ok = res.ok && typeof audioUrl === 'string' && audioUrl.startsWith('data:audio');
  return { name: 'compose', ok, status: res.status, latencyMs: res.latencyMs };
}

async function testEnhancePrompt() {
  if (!hasEnv('POLLEN_API_KEY') && !hasEnv('POLLINATIONS_API_KEY') && !hasEnv('POLLINATIONS_API_TOKEN')) {
    return { name: 'enhancePrompt', skipped: true, reason: 'missing POLLEN_API_KEY*' };
  }

  const res = await postJson('/api/enhance-prompt', { prompt: 'a cat', modelId: 'flux', language: 'en' });
  const json = safeJson(res.text);
  const enhancedPrompt = json?.enhancedPrompt;
  const ok = res.ok && typeof enhancedPrompt === 'string' && enhancedPrompt.length > 0;
  return { name: 'enhancePrompt', ok, status: res.status, latencyMs: res.latencyMs };
}

async function testTts() {
  if (!hasEnv('REPLICATE_API_TOKEN')) {
    return { name: 'tts', skipped: true, reason: 'missing REPLICATE_API_TOKEN' };
  }

  const res = await postJson('/api/tts', { text: 'Hallo', voice: 'de-DE-Neural2-C' }, 60_000);
  const json = safeJson(res.text);
  const audioDataUri = json?.audioDataUri;
  const ok = res.ok && typeof audioDataUri === 'string' && audioDataUri.startsWith('http');
  return { name: 'tts', ok, status: res.status, latencyMs: res.latencyMs };
}

async function testStt() {
  if (!hasEnv('DEEPGRAM_API_KEY')) {
    return { name: 'stt', skipped: true, reason: 'missing DEEPGRAM_API_KEY' };
  }

  // We don't generate a real audio blob here (keep it simple). This is more a wiring check.
  // If you want a real STT test, extend this script to load a fixture .webm.
  return { name: 'stt', skipped: true, reason: 'no audio fixture in script (by design)' };
}

async function main() {
  const results = [];
  results.push(await testChatCompletion());
  results.push(await testCompose());
  results.push(await testEnhancePrompt());
  results.push(await testTts());
  results.push(await testStt());

  console.log('HeyHi Webapp Smoke Test');
  console.log(`- BASE_URL: ${BASE_URL}`);
  for (const r of results) {
    if (r.skipped) console.log(`- ${r.name}: SKIP (${r.reason})`);
    else console.log(`- ${r.name}: ${r.ok ? 'OK' : 'FAIL'} (${r.status}, ${r.latencyMs}ms)`);
  }

  console.log(`SMOKE_JSON=${JSON.stringify({ timestamp: new Date().toISOString(), baseUrl: BASE_URL, results })}`);

  const failed = results.filter((r) => !r.skipped && !r.ok);
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(2);
});

