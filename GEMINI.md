# GEMINI.md

Assistant guidance for Gemini / Google AI Studio when working in this repository.

## Start Here

1. Read [AGENTS.md](/Users/johnmeckel/heyhihosted/AGENTS.md) first. It is the workflow constitution for this repo.
2. Read [CLAUDE.md](/Users/johnmeckel/heyhihosted/CLAUDE.md) second. **It carries the full runtime truth** — visible models, provider semantics, BYOP keys, asset persistence, upload rules — and is kept verified against the code.
3. Use [docs/README.md](/Users/johnmeckel/heyhihosted/docs/README.md) as the docs map for active vs archived material.
4. Prefer updating one canonical truth document instead of duplicating architecture notes in multiple places.

## Why this file is short

This file used to restate the model registry and implementation notes in full. It drifted badly — by mid-2026 it still listed text models (`claude-airforce`, `step-3.5-flash`, `nomnom`, `qwen-character`) and image models (`imagen-4`, `grok-image`) that no longer exist anywhere in the codebase, and linked to two audit docs that had been renamed.

Duplicated truth rots. So this file deliberately holds no model lists and no architecture summary. Read `CLAUDE.md` for those; it applies verbatim to Gemini.

## Project Snapshot

**hey.hi** is a local-first AI workspace built on Next.js 16, Pollinations.ai and Pruna AI.

- Unified app shell with `landing` and `chat` states at `/unified`
- Visible user modes: `standard`, `visualize`, `compose`, `research`
- Generated media lives in Pollinations Media Storage; conversations, memories, settings, and output metadata live locally in IndexedDB / localStorage
- The product surface calls the generated-media area **Output**

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
```

For focused tests, prefer:

```bash
CI=1 npm test -- --runInBand path/to/test.ts
```

## Cleanup Rules

- Do not invent new truth docs when an existing active doc can be updated.
- Do not restate the model registry in prose — link to `src/config/unified-image-models.ts` and `src/config/chat-options.ts` instead.
- Avoid model-name marketing copy unless it is clearly tied to the current visible registry.
- Treat `README.md`, `CLAUDE.md`, and `GEMINI.md` as synchronized adapters over the same runtime truth: `CLAUDE.md` holds it, the other two point at it.
