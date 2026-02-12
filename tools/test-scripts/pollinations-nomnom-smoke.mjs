#!/usr/bin/env node
/**
 * Pollinations model smoke-test.
 *
 * Goals:
 * - Verify `perplexity-fast` (websearch) returns a valid response.
 * - Verify `nomnom` (deep research) returns a valid response.
 * - If `nomnom` fails, log the failure and run a fallback model.
 *
 * Output:
 * - Human-readable summary
 * - JSON block (one-line) for CI/log scraping
 */

const DEFAULT_ENDPOINT = 'https://enter.pollinations.ai/api/generate/v1/chat/completions';
const DEFAULT_PROMPT =
  'Antworte in 1 kurzen Zeile. Sag mir das heutige Datum im Format YYYY-MM-DD.';

function parseArgs(argv) {
  const out = {
    endpoint: DEFAULT_ENDPOINT,
    prompt: DEFAULT_PROMPT,
    timeoutMs: 10_000,
    temperature: 0.1,
    maxTokens: 250,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--endpoint') out.endpoint = argv[++i] || out.endpoint;
    else if (a === '--prompt') out.prompt = argv[++i] || out.prompt;
    else if (a === '--timeout-ms') out.timeoutMs = Number(argv[++i] || out.timeoutMs);
    else if (a === '--temperature') out.temperature = Number(argv[++i] || out.temperature);
    else if (a === '--max-tokens') out.maxTokens = Number(argv[++i] || out.maxTokens);
  }

  return out;
}

function getApiKey() {
  return (
    process.env.POLLEN_API_KEY ||
    process.env.POLLINATIONS_API_KEY ||
    process.env.POLLINATIONS_API_TOKEN ||
    ''
  );
}

async function callModel({ endpoint, apiKey, model, prompt, timeoutMs, temperature, maxTokens }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature,
      }),
      signal: controller.signal,
    });

    const rawText = await res.text();
    const latencyMs = Date.now() - startedAt;

    if (!res.ok) {
      return {
        ok: false,
        model,
        status: res.status,
        latencyMs,
        error: `HTTP ${res.status}`,
        raw: rawText.slice(0, 2000),
      };
    }

    let json;
    try {
      json = JSON.parse(rawText);
    } catch {
      return {
        ok: false,
        model,
        status: res.status,
        latencyMs,
        error: 'Invalid JSON response',
        raw: rawText.slice(0, 2000),
      };
    }

    const content = json?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return {
        ok: false,
        model,
        status: res.status,
        latencyMs,
        error: 'Missing choices[0].message.content',
        raw: rawText.slice(0, 2000),
      };
    }

    return {
      ok: true,
      model,
      status: res.status,
      latencyMs,
      content: content.trim(),
    };
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    const msg =
      err && typeof err === 'object' && err.name === 'AbortError'
        ? `Timeout after ${timeoutMs}ms`
        : String(err?.message || err);
    return { ok: false, model, status: 0, latencyMs, error: msg };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const apiKey = getApiKey();

  const result = {
    timestamp: new Date().toISOString(),
    endpoint: args.endpoint,
    prompt: args.prompt,
    apiKeyPresent: Boolean(apiKey),
    tests: [],
    fallbackUsed: null,
  };

  // 1) Websearch model (fast)
  const web = await callModel({
    endpoint: args.endpoint,
    apiKey,
    model: 'perplexity-fast',
    prompt: args.prompt,
    timeoutMs: args.timeoutMs,
    temperature: args.temperature,
    maxTokens: args.maxTokens,
  });
  result.tests.push(web);

  // 2) Deep research model (nomnom)
  const nomnom = await callModel({
    endpoint: args.endpoint,
    apiKey,
    model: 'nomnom',
    prompt: args.prompt,
    timeoutMs: args.timeoutMs,
    temperature: args.temperature,
    maxTokens: args.maxTokens,
  });
  result.tests.push(nomnom);

  // 3) Fallback if nomnom fails
  if (!nomnom.ok) {
    const fallbackModel = 'perplexity-fast';
    const fallback = await callModel({
      endpoint: args.endpoint,
      apiKey,
      model: fallbackModel,
      prompt: args.prompt,
      timeoutMs: args.timeoutMs,
      temperature: args.temperature,
      maxTokens: args.maxTokens,
    });
    result.tests.push({ ...fallback, note: 'fallback-after-nomnom-failure' });
    result.fallbackUsed = fallbackModel;
  }

  // Human-readable summary
  const line = (t) => {
    const base = `${t.model}: ${t.ok ? 'OK' : 'FAIL'} (${t.latencyMs}ms)`;
    if (t.ok) return `${base} -> ${t.content?.slice(0, 120) || ''}`;
    return `${base} -> ${t.error || 'unknown error'}`;
  };

  console.log('Pollinations Smoke Test');
  console.log(`- endpoint: ${result.endpoint}`);
  console.log(`- apiKeyPresent: ${result.apiKeyPresent}`);
  console.log(`- prompt: ${JSON.stringify(result.prompt)}`);
  for (const t of result.tests) console.log(`- ${line(t)}`);
  if (result.fallbackUsed) console.log(`- fallbackUsed: ${result.fallbackUsed}`);

  // Machine-readable summary for logging/monitoring
  console.log(`SMOKE_JSON=${JSON.stringify(result)}`);

  // Exit code: fail if both web + nomnom fail
  const webOk = Boolean(web.ok);
  const nomOk = Boolean(nomnom.ok);
  if (!webOk && !nomOk) process.exitCode = 2;
  else if (!nomOk) process.exitCode = 1;
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(2);
});

