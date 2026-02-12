# NomNom Smoke Test (2026-02-12)

## Command

```bash
node tools/test-scripts/pollinations-nomnom-smoke.mjs --timeout-ms 12000
```

## Result

- `apiKeyPresent`: `false` (no `POLLEN_API_KEY` / `POLLINATIONS_API_KEY` / `POLLINATIONS_API_TOKEN` found in the current shell environment)
- `perplexity-fast`: **FAIL** (`fetch failed`)
- `nomnom`: **FAIL** (`fetch failed`)
- Fallback logic: when `nomnom` failed, the script attempted **`perplexity-fast`** again (also failed).

## Raw Summary (from script)

```
SMOKE_JSON={"timestamp":"2026-02-12T13:15:31.800Z","endpoint":"https://enter.pollinations.ai/api/generate/v1/chat/completions","prompt":"Antworte in 1 kurzen Zeile. Sag mir das heutige Datum im Format YYYY-MM-DD.","apiKeyPresent":false,"tests":[{"ok":false,"model":"perplexity-fast","status":0,"latencyMs":60,"error":"fetch failed"},{"ok":false,"model":"nomnom","status":0,"latencyMs":1,"error":"fetch failed"},{"ok":false,"model":"perplexity-fast","status":0,"latencyMs":1,"error":"fetch failed","note":"fallback-after-nomnom-failure"}],"fallbackUsed":"perplexity-fast"}
```

## Notes

This outcome indicates the test environment could not reach the endpoint (or `fetch` failed before HTTP).
Next step for a meaningful result: run again with a valid `POLLEN_API_KEY` exported in the environment.

