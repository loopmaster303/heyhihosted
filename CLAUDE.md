# CLAUDE.md

**Ecosystem:** democrabs — "The crab snaps with everyone but it's yours"

Assistant guidance for Claude working in this repository. Last verified against the code on 2026-07-25.

## Start Here

1. Read [AGENTS.md](/Users/johnmeckel/heyhihosted/AGENTS.md) first. It is the workflow constitution for this repo.
2. Treat [README.md](/Users/johnmeckel/heyhihosted/README.md), [docs/PRODUCT_AUDIT_2026-04-21.md](/Users/johnmeckel/heyhihosted/docs/PRODUCT_AUDIT_2026-04-21.md), and [docs/PRODUCT_AUDIT_FOLLOWUP_2026-04-21.md](/Users/johnmeckel/heyhihosted/docs/PRODUCT_AUDIT_FOLLOWUP_2026-04-21.md) as the current product/runtime truth.
3. Use [docs/README.md](/Users/johnmeckel/heyhihosted/docs/README.md) as the docs map for active vs archived material.
4. Prefer updating one canonical truth document instead of duplicating architecture notes in multiple places.

## Project Snapshot

**hey.hi** is a local-first AI workspace built on Next.js 16, Pollinations.ai and Pruna AI.

- Unified app shell with `landing` and `chat` states at `/unified`
- Visible user modes: `standard`, `visualize`, `compose`, `research`
- Code mode exists as an internal response-mode flag (`Conversation.isCodeMode`), not as a separate visible tool
- Generated media lives in Pollinations Media Storage; conversations, memories, settings, and output metadata live locally in IndexedDB / localStorage
- The product surface calls the generated-media area **Output**

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

## Provider Semantics — read before touching Visualize

There are two providers, Pollinations and Pruna, and a user-facing switch. **The switch only scopes the visualize model list.** It is not a global mode:

- `providerMode` is read in exactly four places, all visualize UI: [useUnifiedImageToolState.ts](/Users/johnmeckel/heyhihosted/src/hooks/useUnifiedImageToolState.ts), `VisualizeInlineHeader`, `VisualizeInputContainer`, `PersonalizationSidebarSection`. It filters the model list and picks the default model.
- The actual dispatch depends on the **selected model**, never on the switch: `/api/generate` branches on `isPrunaModel(canonicalModelId)`, and reference uploads branch on `selectedModelInfo.provider`.
- Chat, TTS, STT, compose and prompt enhancement always run through Pollinations and never receive a Pruna key.
- Prompt enhancement is `/api/enhance-prompt` and is provider-independent. The `enhance` field on `/api/generate` is a Pollinations image-API parameter — Pruna has no such field.

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

- **Deploy truth is unresolved.** `apphosting.yaml` points at Firebase App Hosting with `maxInstances: 1`; `vercel.json` exists but is now empty. What actually serves hey-hi.space has never been confirmed.
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
