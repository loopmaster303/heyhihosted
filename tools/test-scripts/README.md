# Test Scripts (HeyHi)

These scripts are small, runnable smoke-tests to verify core functionality and catch drift/regressions.

## Scripts

### 0) Model Monitor Snapshot (HTML + Screenshot)

Checks `model-monitor.pollinations.ai` and writes a snapshot (and best-effort screenshot) to artifacts.

```bash
node tools/test-scripts/model-monitor-snapshot.mjs
```

### 1) Pollinations Model Smoke (nomnom / perplexity-fast)

Runs direct calls against Pollinations Chat Completions and reports:
- success/failure
- latency
- fallback used (if `nomnom` fails)

```bash
POLLEN_API_KEY=... node tools/test-scripts/pollinations-nomnom-smoke.mjs
```

Optional flags:
```bash
node tools/test-scripts/pollinations-nomnom-smoke.mjs --prompt "Was ist heute das Datum?"
node tools/test-scripts/pollinations-nomnom-smoke.mjs --timeout-ms 12000
```

### 2) Webapp API Smoke (requires local server)

Assumes the HeyHi webapp is running (e.g. `npm run dev`) and checks key endpoints.

```bash
BASE_URL=http://localhost:3000 node tools/test-scripts/webapp-smoke.mjs
```

Notes:
- Some endpoints require credentials (`POLLEN_API_KEY`, `REPLICATE_API_TOKEN`, AWS keys). The script will skip tests when required env is missing.

### 3) Advanced Multimedia Smoke (cost-sparing but real)

Default runs a single **small** image generation via Pollinations public endpoint and validates the bytes.

```bash
node tools/test-scripts/multimedia-advanced-smoke.mjs
```

Via local webapp (requires `npm run dev`):
```bash
BASE_URL=http://localhost:3000 node tools/test-scripts/multimedia-advanced-smoke.mjs --mode webapp
```
