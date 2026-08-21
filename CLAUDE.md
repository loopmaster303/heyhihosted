# CLAUDE.md

**Ecosystem:** democrabs — "The crab snaps with everyone but it's yours"

Assistant guidance for Claude working in this repository. Last verified against the code on 2026-08-12.

## Start Here

1. Read [AGENTS.md](/Users/johnmeckel/heyhihosted/AGENTS.md) first. It is the workflow constitution for this repo.
2. Treat [README.md](/Users/johnmeckel/heyhihosted/README.md), [docs/PRODUCT_AUDIT_2026-04-21.md](/Users/johnmeckel/heyhihosted/docs/PRODUCT_AUDIT_2026-04-21.md), and [docs/PRODUCT_AUDIT_FOLLOWUP_2026-04-21.md](/Users/johnmeckel/heyhihosted/docs/PRODUCT_AUDIT_FOLLOWUP_2026-04-21.md) as the current product/runtime truth.
3. Use [docs/README.md](/Users/johnmeckel/heyhihosted/docs/README.md) as the docs map for active vs archived material.
4. Prefer updating one canonical truth document instead of duplicating architecture notes in multiple places.

## Project Snapshot

**hey.hi** is a local-first AI workspace built on Next.js 16, Pollinations.ai and Pruna AI.

- Unified app shell with `landing` and `chat` states at `/unified` (root `/` redirects into the same shell)
- Visible user modes: `standard`, `visualize`, `compose`, `research`
- Dedicated **Playground** route at `/playground` for full-screen image/video generation
- Code mode exists as an internal response-mode flag (`Conversation.isCodeMode`), not as a separate visible tool
- Standard chat can generate media inline: the assistant emits `[IMAGE_GEN: …]` / `[MUSIC_GEN: …]`, taught by `MEDIA_MARKER_PROTOCOL` in [chat-prompt-builder.ts](/Users/johnmeckel/heyhihosted/src/lib/chat/chat-prompt-builder.ts). The parser skips markers inside code blocks and the handler caps at one per kind — neither guarantee may depend on the model obeying the prompt
- Generated media lives in Pollinations Media Storage or (for Pruna without Pollen token) as IndexedDB blobs; conversations, memories, settings, and output metadata live locally in IndexedDB / localStorage
- The product surface calls the generated-media area **Output**; the Playground calls the same area **Gallery**

## Current Runtime Truth

### Visible text models
Governed manually by `VISIBLE_POLLINATIONS_MODEL_IDS` in [src/config/chat-options.ts](/Users/johnmeckel/heyhihosted/src/config/chat-options.ts):

`claude-fast`, `gemini-fast`, `gemini-search`, `deepseek`, `nova-fast`, `mistral`, `perplexity-fast`, `perplexity-reasoning`, `kimi`, `glm`, `minimax`, `qwen-coder`

Careful: the `gemini` id is Gemini 3 Flash (paid) and is *not* the same as the visible `gemini-fast`.

### Visible image/video models

[src/config/unified-image-models.ts](/Users/johnmeckel/heyhihosted/src/config/unified-image-models.ts) is the single source of truth. Do not restate the full registry elsewhere — it drifts. Three flags decide visibility:

| Flag | Meaning |
|---|---|
| `enabled` | shows up at all |
| `isFree` | usable without a key |
| `byopVisible` | surfaces once the user brings their own key |

Free and enabled today: `flux`, `zimage`, `gpt-image`, `klein`, `kontext`, `gptimage-large`, `qwen-image`, `grok-imagine`, `ideogram-v4-turbo`, `wan-image-small`, `ltx-2`.

Enabled but key-gated: the `p-*` Pruna family (`p-image`, `p-image-edit`, `p-image-try-on`, `p-image-upscale`, `p-video`, `p-video-avatar`, `p-video-animate`, `p-video-replace`), plus `qwen-image-edit-plus`, `wan-t2v`, `wan-i2v`, `vace`.

Everything else in the file is `enabled: false` and waiting on upstream availability. Check the config rather than trusting a list in prose.

### Reference images
`referenceMode` (`multi-image` | `start-frame` | `start-end-frame`) plus `maxImages` describe what a model accepts; `getReferenceMode()` derives it. `/api/generate` validates the request against both and rejects mismatches with a 400, so UI and API cannot drift apart.

## Playground — read before touching `/playground`

The `/playground` route (`src/app/playground/page.tsx`) is a standalone generation workspace, not a chat tool. It reuses the same model registry and generation API as Visualize but has its own shell and state:

- **Shell:** `PlaygroundShell` (`src/app/playground/PlaygroundShell.tsx`) owns the three-column layout (sidebar params, main canvas, detail rail).
- **State:** Local React state in `PlaygroundShell`; no ChatProvider involvement.
- **API:** `/api/generate` for all image/video generation; `/api/media/upload` or `/api/pruna/upload` for reference images depending on `selectedModelInfo.provider`.
- **Modes:** `t2i`, `i2i`, `t2v`, `i2v` — driven by `ModeTabs` and validated by `/api/generate`.
- **Progress:** Up to 3 generations run in parallel. Each is an `ActiveRun` in `PlaygroundShell` with its own `AbortController` and renders its own card in the gallery — running (with a per-card cancel) or failed (with retry/dismiss). The run itself is the retry context, so a retry repeats what was sent, not what the composer holds now. The send button only locks at the concurrency limit and names the reason.
- **Details:** Selecting a result opens `MetaRail` with prompt, parameters, seed, and actions: download, retry, use as reference.
- **Provider switch:** Same semantics as Visualize — it only scopes the model list. The selected model decides the actual provider dispatch.

Do not wire Playground state into ChatProvider. Keep it self-contained.

## Provider Semantics — read before touching Visualize

There are two providers, Pollinations and Pruna, and a user-facing switch. **The switch only scopes the model list** — in Visualize and, since the merge, in the Playground. It is not a global mode:

- `useProviderMode` is read in five modules, all of them model-picking UI: [useUnifiedImageToolState.ts](/Users/johnmeckel/heyhihosted/src/hooks/useUnifiedImageToolState.ts) and `PersonalizationSidebarSection` for Visualize, plus [usePlaygroundModels.ts](/Users/johnmeckel/heyhihosted/src/hooks/usePlaygroundModels.ts), `PlaygroundShell` and `ProviderSelect` for the Playground. It filters the model list and picks the default model. (`VisualizeInlineHeader` and `VisualizeInputContainer` receive the value as props rather than reading the hook.)
- The actual dispatch depends on the **selected model**, never on the switch: `/api/generate` branches on `isPrunaModel(canonicalModelId)`, and reference uploads branch on `selectedModelInfo.provider`.
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

- **Deploy truth resolved for this domain.** `chat.hey-hi.cloud` is served by Vercel (connected GitHub project, auto-deploy from `main`). `apphosting.yaml` still exists but is not the active host for this domain.
- Search/research routing is delegated through a single strategy path; `WebContextService` is an optional helper invoked only when `shouldFetchWebContext` is set, not the default delegated path.
- The system prompt in `chat-options.ts` still contains "Burn the Corpos" and filter-evasion passages. Editorial hardening only on explicit instruction.

## Cleanup Rules

- Do not invent new truth docs when an existing active doc can be updated.
- Do not restate the model registry in prose — link to the config instead.
- Avoid model-name marketing copy unless it is clearly tied to the current visible registry.
- Treat `README.md`, `CLAUDE.md`, and `GEMINI.md` as synchronized adapters over the same runtime truth.

## Ökosystem (kanonisch: ~/heyhi/LEVELS.md, Stand 2026-07-05)
Dieses Repo ist **Level 2 („Benutzen")**. Level 1 = JUSTSAY (justsaywow ⊕ justsayhi), Level 3 = democrabs (Hermes/NUC/WhatsApp). Querschichten: heyhiblog (Haltung), meinbild (Schutz). heyhicreator eingefroren.
Der Reorg-Plan 2026-06-01 (`docs/plans/2026-06-01-heyhi-ecosystem-reorg-plan.md`) ist historisch — sein Level-Modell ist durch LEVELS.md abgelöst.
