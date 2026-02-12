#!/usr/bin/env node
/**
 * Model monitor snapshot + optional screenshot.
 *
 * Default target: https://model-monitor.pollinations.ai
 *
 * Outputs:
 * - HTML snapshot: tools/test-scripts/artifacts/model-monitor/<timestamp>.html
 * - Screenshot (best-effort): tools/test-scripts/artifacts/model-monitor/<timestamp>.png
 *
 * Screenshot strategy:
 * - Prefer local Chrome/Chromium headless CLI if available.
 * - If no browser binary is found, still succeeds with HTML-only snapshot.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const DEFAULT_URL = 'https://model-monitor.pollinations.ai';

function parseArgs(argv) {
  const out = {
    url: DEFAULT_URL,
    outDir: 'tools/test-scripts/artifacts/model-monitor',
    timeoutMs: 12_000,
    screenshot: true,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') out.url = argv[++i] || out.url;
    else if (a === '--out-dir') out.outDir = argv[++i] || out.outDir;
    else if (a === '--timeout-ms') out.timeoutMs = Number(argv[++i] || out.timeoutMs);
    else if (a === '--no-screenshot') out.screenshot = false;
  }
  return out;
}

function tsSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeFile(p, data) {
  await fs.writeFile(p, data);
}

async function fetchHtml(url, timeoutMs) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    const html = await res.text();
    const latencyMs = Date.now() - startedAt;
    return { ok: res.ok, status: res.status, latencyMs, html };
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    const msg =
      err && typeof err === 'object' && err.name === 'AbortError'
        ? `Timeout after ${timeoutMs}ms`
        : String(err?.message || err);
    return { ok: false, status: 0, latencyMs, html: '', error: msg };
  } finally {
    clearTimeout(t);
  }
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: 'pipe', ...opts });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', (d) => (stdout += d.toString()));
    p.stderr.on('data', (d) => (stderr += d.toString()));
    p.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function which(bin) {
  const res = await run('bash', ['-lc', `command -v ${bin} || true`]);
  const p = res.stdout.trim();
  return p.length > 0 ? p : null;
}

async function findBrowserBinary() {
  // Prefer explicit, then common Linux binaries.
  const candidates = [
    // macOS default app bundle binary
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    // common linux/windows names
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
  ];

  for (const c of candidates) {
    if (c.startsWith('/')) {
      try {
        await fs.access(c);
        return c;
      } catch {
        continue;
      }
    } else {
      const p = await which(c);
      if (p) return p;
    }
  }

  return null;
}

async function screenshotWithHeadlessBrowser(browserPath, url, pngPath, timeoutMs) {
  // Chrome/Chromium headless screenshot.
  // Note: `--headless=new` works on newer Chrome; fall back to `--headless` if needed.
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--screenshot=${pngPath}`,
    '--window-size=1280,720',
    url,
  ];

  const startedAt = Date.now();
  const res = await run(browserPath, args, { env: process.env });
  const latencyMs = Date.now() - startedAt;

  // If the binary doesn't understand headless=new, retry with legacy flag.
  if (res.code !== 0 && res.stderr.includes('headless=new')) {
    const res2 = await run(browserPath, [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      `--screenshot=${pngPath}`,
      '--window-size=1280,720',
      url,
    ]);
    return { ok: res2.code === 0, latencyMs, detail: res2.stderr || res2.stdout };
  }

  // Some Chromium variants return 0 but still write warnings to stderr; we treat exit code as truth.
  return { ok: res.code === 0, latencyMs, detail: res.stderr || res.stdout };
}

async function maybeSendWebhook(webhookUrl, payload) {
  if (!webhookUrl) return { sent: false };
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { sent: res.ok, status: res.status };
  } catch (err) {
    return { sent: false, error: String(err?.message || err) };
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const slug = tsSlug();
  const outDir = args.outDir;
  await ensureDir(outDir);

  const htmlPath = path.join(outDir, `${slug}.html`);
  const pngPath = path.join(outDir, `${slug}.png`);
  const jsonPath = path.join(outDir, `${slug}.json`);

  const htmlRes = await fetchHtml(args.url, args.timeoutMs);
  if (htmlRes.ok) {
    await writeFile(htmlPath, htmlRes.html);
  }

  // Basic “did it load” heuristic: presence of HTML tag and non-trivial length.
  const looksOk = htmlRes.ok && htmlRes.html.includes('<html') && htmlRes.html.length > 500;

  let screenshot = { attempted: false, ok: false, reason: null, latencyMs: null, browser: null };
  if (args.screenshot) {
    const browser = await findBrowserBinary();
    if (!browser) {
      screenshot = { attempted: false, ok: false, reason: 'no-browser-binary-found', latencyMs: null, browser: null };
    } else {
      screenshot.attempted = true;
      screenshot.browser = browser;
      const ss = await screenshotWithHeadlessBrowser(browser, args.url, pngPath, args.timeoutMs);
      screenshot.ok = ss.ok;
      screenshot.latencyMs = ss.latencyMs;
      if (!ss.ok) screenshot.reason = (ss.detail || '').slice(0, 500);
    }
  }

  const result = {
    timestamp: new Date().toISOString(),
    url: args.url,
    outDir,
    html: {
      ok: htmlRes.ok,
      status: htmlRes.status,
      latencyMs: htmlRes.latencyMs,
      wroteFile: htmlRes.ok,
      path: htmlRes.ok ? htmlPath : null,
      error: htmlRes.error || null,
      looksOk,
    },
    screenshot,
  };

  // Always write a JSON result file (even when fetch fails) for CI artifacts.
  await writeFile(jsonPath, JSON.stringify(result, null, 2));

  console.log('Model Monitor Snapshot');
  console.log(`- url: ${result.url}`);
  console.log(`- html: ${result.html.ok ? 'OK' : 'FAIL'} (${result.html.status}, ${result.html.latencyMs}ms) -> ${result.html.path || '(no file)'}`);
  console.log(`- screenshot: ${result.screenshot.attempted ? (result.screenshot.ok ? 'OK' : 'FAIL') : 'SKIP'}${result.screenshot.browser ? ` (${result.screenshot.browser})` : ''}`);
  if (!result.html.ok) console.log(`- htmlError: ${result.html.error}`);
  if (result.screenshot.attempted && !result.screenshot.ok) console.log(`- screenshotError: ${result.screenshot.reason}`);
  console.log(`- json: ${jsonPath}`);
  console.log(`MONITOR_JSON=${JSON.stringify(result)}`);

  // Optional alerting
  if (!result.html.ok || (result.screenshot.attempted && !result.screenshot.ok)) {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL || '';
    if (webhookUrl) {
      const alert = await maybeSendWebhook(webhookUrl, {
        kind: 'model-monitor-snapshot-failed',
        result,
      });
      console.log(`- webhook: ${alert.sent ? 'SENT' : 'NOT_SENT'}${alert.status ? ` (${alert.status})` : ''}${alert.error ? ` (${alert.error})` : ''}`);
    }
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(2);
});
