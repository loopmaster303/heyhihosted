# CLAUDE.md

**Ecosystem:** democrabs — "The crab snaps with everyone but it's yours"

Assistant guidance for Claude working in this repository. Architecture last verified against the code on 2026-08-12. **Model lists verified against the live registry on 2026-08-28** — see "Modellwahrheit prüfen" below for how to keep them that way.

## Start Here

1. Read [AGENTS.md](/Users/johnmeckel/heyhihosted/AGENTS.md) first. It is the workflow constitution for this repo.
2. Treat [README.md](/Users/johnmeckel/heyhihosted/README.md), [docs/PRODUCT_AUDIT_2026-04-21.md](/Users/johnmeckel/heyhihosted/docs/PRODUCT_AUDIT_2026-04-21.md), and [docs/PRODUCT_AUDIT_FOLLOWUP_2026-04-21.md](/Users/johnmeckel/heyhihosted/docs/PRODUCT_AUDIT_FOLLOWUP_2026-04-21.md) as the current product/runtime truth.
3. Use [docs/README.md](/Users/johnmeckel/heyhihosted/docs/README.md) as the docs map for active vs archived material.
4. Prefer updating one canonical truth document instead of duplicating architecture notes in multiple places.
5. Active plan: [docs/FAHRPLAN-create.md](/Users/johnmeckel/heyhihosted/docs/FAHRPLAN-create.md) — ten phases toward the publicly shareable version. **Phases 0–3 are done** (2026-08-28/29). Read [docs/LAUNCH_CRITERIA.md](docs/LAUNCH_CRITERIA.md) — it is the release gate and the status of record; the Fahrplan describes the way there, not the state. The latest phase handoff is [docs/HANDOFF-2026-08-28-phase-3.md](/Users/johnmeckel/heyhihosted/docs/HANDOFF-2026-08-28-phase-3.md) — it carries the per-phase findings. [docs/HANDOFF-2026-08-27-fahrplan.md](/Users/johnmeckel/heyhihosted/docs/HANDOFF-2026-08-27-fahrplan.md) still gives entry points and pitfalls per phase, but its working-tree breakdown is historical.

## Project Snapshot

**hey.hi** is a local-first AI workspace built on Next.js 16, Pollinations.ai and Pruna AI.

- Unified app shell with `landing` and `chat` states at `/unified` (root `/` redirects into the same shell)
- Visible user modes: `standard`, `visualize`, `compose`, `research`
- Dedicated **Create** workspace at `/create` for full-screen image/video generation (product name **Create**; the route path stays `/create`)
- Code mode exists as an internal response-mode flag (`Conversation.isCodeMode`), not as a separate visible tool
- Standard chat can generate media inline: the assistant emits `[IMAGE_GEN: …]` / `[MUSIC_GEN: …]`, taught by `MEDIA_MARKER_PROTOCOL` in [chat-prompt-builder.ts](/Users/johnmeckel/heyhihosted/src/lib/chat/chat-prompt-builder.ts). The parser skips markers inside code blocks and the handler caps at one per kind — neither guarantee may depend on the model obeying the prompt
- Generated media lives in Pollinations Media Storage or (for Pruna without Pollen token) as IndexedDB blobs; conversations, memories, settings, and output metadata live locally in IndexedDB / localStorage
- The product surface calls the generated-media area **Output**; Create calls the same area **Gallery**

## Current Runtime Truth

### Visible text models
Governed manually by `VISIBLE_POLLINATIONS_MODEL_IDS` in [src/config/chat-options.ts](/Users/johnmeckel/heyhihosted/src/config/chat-options.ts):

`claude-fast`, `gemini-fast`, `gemini-search`, `deepseek`, `nova-fast`, `mistral`, `perplexity-fast`, `perplexity-reasoning`, `kimi`, `glm`, `minimax`, `qwen-coder`

Key-gated (`isFree: false`, live `paid_only` as of 2026-08-28): `claude-fast`, `gemini-fast`, `gemini-search`, `mistral`. The rest run without a key. The default for new users is `deepseek` (`DEFAULT_POLLINATIONS_MODEL_ID`) — a free model; the picker shows a POLLEN badge and refuses selection without a key.

Careful: the `gemini` id is Gemini 3 Flash (paid) and is *not* the same as the visible `gemini-fast`.

### Visible image/video models

[src/config/unified-image-models.ts](/Users/johnmeckel/heyhihosted/src/config/unified-image-models.ts) is the single source of truth. Do not restate the full registry elsewhere — it drifts. Three flags decide visibility:

| Flag | Meaning |
|---|---|
| `enabled` | shows up at all |
| `isFree` | usable without a key |
| `byopVisible` | surfaces once the user brings their own key |

Marked free and enabled in the config (verified live 2026-08-28): `flux`, `gpt-image` (alias of `gptimage`), `klein`. `kontext` and `gptimage-large` are registry-free but **not on the server key's allowlist** (live 403) — they stay `enabled: false` until the operator extends the allowlist, then get re-enabled.

Key-gated and BYOP-visible: the `p-*` Pruna family (`p-image`, `p-image-edit`, `p-image-try-on`, `p-image-upscale`, `p-video`, `p-video-avatar`, `p-video-animate`, `p-video-replace`), `p-image-ideogram`, `p-flux-klein`, plus `qwen-image-edit-plus`, `wan-t2v`, `wan-i2v`, `vace`, and the former "free" Pruna models `zimage`, `qwen-image`, `wan-image-small` (Pruna is BYOP-only — `isFree: true` on a Pruna model was a false promise).

Removed on 2026-08-28 (registry truth): `ltx-2`, `grok-video`, `pollinations-wan-fast` (do not exist upstream), `veo-1080p` (alias of `veo` — internal alias kept for saved selections). `nova-reel` stays disabled: registry-free but a 6 s run timed out after 125 s behind the synchronous dispatch (524) — it needs the async protocol first.

Everything else in the file is `enabled: false` and waiting on upstream availability. Check the config rather than trusting a list in prose.

### Modellwahrheit prüfen
Model lists drift daily (35/39 → 28/42 → 32/45 within 48 hours). The check is tooling, not memory:

- `node scripts/check-model-registry.mjs` pulls all three registry endpoints live and diffs them against the led model ids. Exit 1 = drift.
- `node scripts/check-model-registry.mjs --update-snapshot` refreshes `src/config/__fixtures__/registry-snapshot.json` — the offline fixture the tests T1–T3 run against. Refresh it deliberately, with the diff reviewed; never let a script write config silently.
- A weekly GitHub Action runs the check and fails visibly on drift.
- Rule: **a registry finding never silently rewrites the config.** Whether a model is offered is a product decision; the registry only reports facts. The registry is **key-scoped** — its response differs per API key, and the server key's allowlist (not `paid_only`) decides what keyless users can actually run.

### Reference images
`referenceMode` (`multi-image` | `start-frame` | `start-end-frame`) plus `maxImages` describe what a model accepts; `getReferenceMode()` derives it. `/api/generate` validates the request against both and rejects mismatches with a 400, so UI and API cannot drift apart.

## Create — read before touching `/create`

The `/create` route (`src/app/create/page.tsx`) — product name **Create** — is a standalone generation workspace, not a chat tool. It reuses the same model registry and generation API as Visualize but has its own shell and state:

- **Shell:** `PlaygroundShell` (`src/app/create/PlaygroundShell.tsx`) owns the three-column layout (sidebar params, main canvas, detail rail).
- **State:** Local React state in `PlaygroundShell`; no ChatProvider involvement.
- **API:** `/api/generate` for all image/video generation; `/api/media/upload` or `/api/pruna/upload` for reference images depending on `selectedModelInfo.provider`.
- **Modes:** `t2i`, `i2i`, `t2v`, `i2v` — driven by `ModeTabs` and validated by `/api/generate`.
- **Progress:** Up to 3 generations run in parallel. Each is an `ActiveRun` in `PlaygroundShell` with its own `AbortController` and renders its own card in the gallery — running (with a per-card cancel) or failed (with retry/dismiss). The run itself is the retry context, so a retry repeats what was sent, not what the composer holds now. The send button only locks at the concurrency limit and names the reason.
- **Details:** Selecting a result opens `MetaRail` with prompt, parameters, seed, and actions: download, retry, use as reference.
- **Provider switch:** Same semantics as Visualize — it only scopes the model list. The selected model decides the actual provider dispatch.

Do not wire Create state into ChatProvider. Keep it self-contained.

## Provider Semantics — read before touching Visualize

There are two providers, Pollinations and Pruna, and a user-facing switch. **The switch only scopes the model list** — in Visualize and, since the merge, in Create. It is not a global mode:

- `useProviderMode` is read in five modules, all of them model-picking UI: [useUnifiedImageToolState.ts](/Users/johnmeckel/heyhihosted/src/hooks/useUnifiedImageToolState.ts) and `PersonalizationSidebarSection` for Visualize, plus [usePlaygroundModels.ts](/Users/johnmeckel/heyhihosted/src/hooks/usePlaygroundModels.ts), `PlaygroundShell` and `ProviderSelect` for Create. It filters the model list and picks the default model. (`VisualizeInlineHeader` and `VisualizeInputContainer` receive the value as props rather than reading the hook.)

- The actual dispatch depends on the **selected model**, never on the switch: `/api/generate` branches on `isPrunaModel(canonicalModelId)`, and reference uploads branch on `selectedModelInfo.provider`.
- `p-image`, `p-image-edit` and `p-video` now also appear in the Pollinations registry (paid, aliased `pruna-*`). The name overlap is **deliberately ignored**: the repo claims the ids for the Pruna dispatch (BYOP key), and `buildPollinationsEntries` filters `isPrunaModel()` so the Create never lists a duplicate. Routing them through Pollinations instead is a provider-architecture decision that stays open.
- Chat, TTS, STT, compose and prompt enhancement always run through Pollinations and never receive a Pruna key.
- Prompt enhancement is `/api/enhance-prompt` and is provider-independent. The `enhance` field on `/api/generate` is a Pollinations image-API parameter — Pruna has no such field.

## Prompt Enhancement — how a model gets its guidelines

`selectGuidelines()` in `/api/enhance-prompt` resolves in this order, and the order matters:

1. `canonicalEnhancementKey(modelId)` — [enhancement-prompts.ts](/Users/johnmeckel/heyhihosted/src/config/enhancement-prompts.ts) holds the **only** alias table. There used to be a second one in the route; every change landed in exactly one of them. Alias resolution runs *before* the audio branch, otherwise `stable-audio` falls through to the default plus the image length limit.
2. Audio keys (`AUDIO_ENHANCEMENT_KEYS`) → their own exported prompt, 500-char limit.
3. A hand-written entry in `ENHANCEMENT_PROMPTS` → used as is.
4. Otherwise `buildRegistryEnhancementPrompt()` from the live registry metadata (`findLiveImageModel`). This covers the ~31 registry models with no hand-written prompt.
5. Registry unreachable → `DEFAULT_ENHANCEMENT_PROMPT`. Enhancement must never fail on this.

Two prompt tags steer the route and keep themselves in sync — do not replace either with a list:

| Tag in the prompt | Effect |
|---|---|
| `<unfiltered>` | attaches the no-content-restrictions guard. Without it (gptimage, nanobanana*, qwen-image, music) the guard stays off. |
| `<quality_terms>` | exempts the model from `stripGlossTerms`. Only qwen-image claims it — there the terms are documented as effective. |

Keep it that way. Widening the switch beyond model selection is a regression.

## BYOP Keys

Two independent user-supplied keys, both in `localStorage`, both sent as request headers, both falling back to a server env var:

| Key | Storage | Header | Server resolver |
|---|---|---|---|
| Pollen | `pollenApiKey` | `X-Pollen-Key` | `resolvePollenKey` |
| Pruna | `prunaApiKey` | `X-Pruna-Key` | `resolvePrunaKey` |

Format validation lives in `pollen-key-validation.ts` / `pruna-key-validation.ts`. Note what this does *not* do: it validates key **shape**, not validity — the upstream service is the real gate. Do not treat the presence of a key as authentication.

The keys remain XSS-sensitive because they sit in web storage. Documented, accepted, unresolved.

## Asset Persistence

Where a generated asset ends up depends on the model's provider, via `isPollinationsHostedModel()`:

- **Pollinations models** → saved with `remoteUrl`, then backfilled through Pollinations Media ingest.
- **Pruna models without a Pollen token** → `/api/generate` returns raw media, the client wraps it in a blob URL via `BlobManager` (context `generate`), and `OutputService` stores the actual blob in IndexedDB.

Never use `URL.createObjectURL` directly — go through `BlobManager` so the URL is revoked on unload. Never hardcode `isPollinations`; a blob URL stored as a `remoteUrl` is dead after a reload.

### Long runs answer 202, the browser polls (since 2026-08-26)

No request waits for a video any more. Anything not immediately finished comes back as
`202 { pending, predictionId, model }` and the browser takes over:

- `generateViaPruna` in [src/lib/pruna/client.ts](/Users/johnmeckel/heyhihosted/src/lib/pruna/client.ts) ends at the run id; the server-side `pollPrediction` is gone.
- [`/api/pruna/status`](/Users/johnmeckel/heyhihosted/src/app/api/pruna/status/route.ts) — `GET ?id=&model=`, answers 202 while computing, otherwise exactly like `/api/generate`.
- [src/lib/pruna/deliver.ts](/Users/johnmeckel/heyhihosted/src/lib/pruna/deliver.ts) — download plus media upload, shared by both routes so the response shape stays identical.
- [src/lib/generation/request-generation.ts](/Users/johnmeckel/heyhihosted/src/lib/generation/request-generation.ts) — holds the wait in the tab (3 s interval, 30 min cutoff, abortable) and returns the same `Response` the caller used to get directly. Callers use it in place of `fetch`.

Why: VACE runs 348–700 s measured, the old server poll limit was 180 s and Vercel's default
function limit is 300 s — it could never structurally complete. A reload still loses the run;
the `predictionId` lives only in memory.

**Pruna rejects any unknown input field** with `400 additional properties forbidden, found <field>`.
Model schemas at `docs.api.pruna.ai/guides/models/<model>` proved reliable; guessing did not.
Pruna has **no cancel endpoint**, so every valid payload starts a billable run — to exercise
validation without paying, send an unreachable media URL (`https://invalid.invalid/x.jpg`).

## Upload Hardening

- `readBodyWithLimit()` streams a request or response body and aborts at the limit. Use it instead of `arrayBuffer()`, which buffers before the size can be checked.
- `isActiveContentType()` rejects payloads that would execute when served back from media storage (html, svg, js, xml). Images, video, audio and the composer's document types stay allowed — note that this also means **SVG uploads and SVG through the image proxy are rejected**.
- `/api/media/upload` accepts raw bodies only; multipart returns 415 because `formData()` cannot be size-limited.
- **Never hand-roll an upload `fetch`.** Go through `uploadFileToPruna` / `uploadFileToPollinationsMedia` in [src/lib/upload/](/Users/johnmeckel/heyhihosted/src/lib/upload). They own the endpoint, the raw body, the BYOP key header *and* its normalisation, and the route's error message. The Playground once had its own copy that got everything right except the key header — every Pruna reference upload answered 503 while the key sat in settings, and the source-video slot sent multipart to a route that answers 415.
- `/api/proxy-image` only fetches the three Pollinations hosts allowlisted in `remote-fetch-policy.ts`.

## Important Files

- [src/app/unified/page.tsx](/Users/johnmeckel/heyhihosted/src/app/unified/page.tsx): top-level unified shell
- [src/components/ChatProvider.tsx](/Users/johnmeckel/heyhihosted/src/components/ChatProvider.tsx): state orchestration
- [src/hooks/useChatState.ts](/Users/johnmeckel/heyhihosted/src/hooks/useChatState.ts): persistence-oriented base state
- [src/config/chat-options.ts](/Users/johnmeckel/heyhihosted/src/config/chat-options.ts): text-model truth, response styles, system prompts, compose models
- [src/config/unified-image-models.ts](/Users/johnmeckel/heyhihosted/src/config/unified-image-models.ts): visible image/video model truth
- [src/config/pruna-models.ts](/Users/johnmeckel/heyhihosted/src/config/pruna-models.ts): Pruna model mapping and field shapes
- [src/lib/services/output-service.ts](/Users/johnmeckel/heyhihosted/src/lib/services/output-service.ts): output persistence adapter
- [src/lib/blob-manager.ts](/Users/johnmeckel/heyhihosted/src/lib/blob-manager.ts): ref-counted blob URL registry
- [src/lib/upload/](/Users/johnmeckel/heyhihosted/src/lib/upload): upload limits, content-type policy, media/Pruna upload clients

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

## Open Questions

- **Server-key allowlist decides the free tier.** The Pollinations registry is key-scoped: the response differs per API key, and the operator server key currently allows only a subset of the registry-free models (live 2026-08-28: `kontext`, `gptimage-large` → 403). Widening the allowlist at enter.pollinations.ai re-enables those config entries; until then they stay hidden.
- **`zimage` works free via Pollinations but is claimed by the Pruna dispatch.** A provider decision (like the `p-*` question above) could route it to Pollinations and restore it as a free model. Not done here — dispatch hangs on the model, not the switch.
- **TTS is a registry blind spot.** `/api/tts` runs on server-key `tts-1`/`elevenlabs`; the `/audio/models` registry does not list `tts-1`, yet the endpoint works (verified live 2026-08-28). Free for users, paid by the operator — fine today, but not represented by the registry check.
- **Deploy truth resolved for this domain.** `chat.hey-hi.cloud` is served by Vercel (connected GitHub project, auto-deploy from `main`), with **Cloudflare as proxy in front** (`server: cloudflare` in every response — DNS entries live in Cloudflare, not Vercel). `create.hey-hi.cloud` does **not** exist (NXDOMAIN, checked 2026-08-29) and is not planned: a second hostname is a second browser origin, which would split IndexedDB and localStorage. `next.config.ts` still carries the `CREATE_HOST` redirect rules — dormant, ready if the decision ever flips. `apphosting.yaml` still exists but is not the active host for this domain.
- Search/research routing is delegated through a single strategy path; `WebContextService` is an optional helper invoked only when `shouldFetchWebContext` is set, not the default delegated path.
- The system prompt in `chat-options.ts` still contains "Burn the Corpos" and filter-evasion passages. Editorial hardening only on explicit instruction. It also still names removed video models (`ltx-2`, `grok-video`) in its formatting guidance — model names in the system prompt are frozen for this repo; changing them needs an explicit mandate.

## Schriftregel

Zwei Familien, seit dem Umbau 2026-08-22 (vorher war alles Monospace):

| | |
|---|---|
| **Proportional** (`font-body`, IBM Plex Sans) | Gesprochenes: Chat-Antworten, Erklaerungen, Fehlermeldungen, Beschriftungen |
| **Monospace** (`font-mono`, Code) | Maschinelles: Werte, Modell-IDs, Seeds, Zustaende, Zeitangaben, Code |

`body` traegt Proportional — Maschinelles muss **explizit** ausgezeichnet werden.
`code`, `pre`, `kbd`, `samp` sind global in [globals.css](/Users/johnmeckel/heyhihosted/src/app/globals.css) gesichert, weil sie vorher nur monospace waren, als es die ganze App war; ohne die Regel fielen Code-Bloecke still auf Proportional zurueck.

Kein globales `lowercase` im Chat: dort steht deutscher Fliesstext, Substantive bleiben gross. Das democrabs-Onboarding fuehrt `font-mono lowercase` durchgehend — das ist dort richtig und hier nicht.

## Cleanup Rules

- Do not invent new truth docs when an existing active doc can be updated.
- Do not restate the model registry in prose — link to the config instead.
- Avoid model-name marketing copy unless it is clearly tied to the current visible registry.
- Treat `README.md`, `CLAUDE.md`, and `GEMINI.md` as synchronized adapters over the same runtime truth.

## Ökosystem (kanonisch: ~/heyhi/LEVELS.md, Stand 2026-07-05)
Dieses Repo ist **Level 2 („Benutzen")**. Level 1 = JUSTSAY (justsaywow ⊕ justsayhi), Level 3 = democrabs (Hermes/NUC/WhatsApp). Querschichten: heyhiblog (Haltung), meinbild (Schutz). heyhicreator eingefroren.
Der Reorg-Plan 2026-06-01 (`docs/plans/2026-06-01-heyhi-ecosystem-reorg-plan.md`) ist historisch — sein Level-Modell ist durch LEVELS.md abgelöst.
