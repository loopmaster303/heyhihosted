# Multimedia Playground — Design Spec

**Date:** 2026-08-07
**Status:** approved (brainstorming)
**Route:** `/playground` (parallel to `/unified`)

## 1. Goal

Standalone multimedia-generation page that surfaces every available image/video model behind a single, provider-scoped shell. The page:

- Fetches Pollinations image/video models live from `/image/models` so paid vs. quest visibility is decided by the upstream API, not by us.
- Lists every Pruna model in `pruna-models.ts` **minus** `p-image-try-on` and `p-video-avatar`, gated behind the presence of a Pruna key.
- Presents the same UI feeling as the rest of hey.hi (glassmorphism, existing theme tokens, existing model icons, existing aspect-ratio/duration widgets).
- Ships as its own route; the current `/unified` Visualize mode stays untouched in this milestone.

Out of scope: chat, compose, memories, gallery migration, decommission of the Visualize tool.

## 2. Layout (adapted from playground-v2.html)

Top-level grid:

```
┌──────────────────────────────────────────────┐
│ topbar: heyhi / playground   [theme] [☰]     │
├──────────────┬───────────────────────────────┤
│ params       │ hero (empty / loading / media)│
│ (sidebar)    │                                │
│              ├───────────────────────────────┤
│              │ gallery (last N gens)          │
└──────────────┴───────────────────────────────┘
```

Sidebar order (top → bottom):

1. Provider switch — `Pruna | Pollinations` (2-segment control, sliding indicator).
2. API key field for the active provider — masked, localStorage-backed, `Test` button.
3. Mode switch — `T2I | I2I | T2V | I2V` (4-segment).
4. Model select — dropdown, populated from the provider+mode source.
5. Prompt textarea with an `Enhance` action (reuses `/api/enhance-prompt`).
6. Reference uploads — count, labels, and `referenceMode` come from the model's config entry.
7. Aspect-ratio pills — from `getAspectRatioPresetsForModel(modelId)`.
8. Duration slider — only for video models; range from `getDurationOptionsSeconds` + `getDefaultDurationSeconds`.
9. Advanced accordion — seed, negative prompt, guidance, steps (only fields the model config declares).
10. Generate button (sticky footer of the sidebar).

Mobile: params panel becomes a bottom sheet; a sticky bar at the bottom of the viewport carries a quick-prompt input plus Generate. Sidebar link is added to `AppSidebar` in `/unified` so users can jump to `/playground`.

Visuals: uses hey.hi tokens (`--bg`, `--surface`, `--accent`, glass surfaces, fonts from globals.css) — **not** the iris palette from playground-v2.html. Structural CSS (grid, segmented control, sliding indicator, ambient aurora shell, mobile bottom sheet) is ported.

## 3. Provider switch, keys & entitlements

Client state: `provider: 'pollinations' | 'pruna'`, persisted in `localStorage.playgroundProvider`. Default: `pollinations`.

Keys are the **same** localStorage entries the chat uses:

| Provider | Storage key | Request header | Server resolver |
|---|---|---|---|
| Pollinations | `pollenApiKey` | `X-Pollen-Key` | `resolvePollenKey` |
| Pruna | `prunaApiKey` | `X-Pruna-Key` | `resolvePrunaKey` |

Editing a key in the playground immediately affects the chat and vice versa. No new storage keys.

Key field: `<input type="password">` with show/hide toggle plus a `Test` action that pings `/api/pollen/account` (Pollinations) or `/api/capabilities` (Pruna) with the header set; a green dot appears next to the field on success, a red dot with the upstream error on failure.

## 4. Model list source

### Pollinations — live fetch

New route: `GET /api/pollen/image-models`. Proxies `https://gen.pollinations.ai/image/models`, forwarding `Authorization: Bearer <resolvePollenKey(request)>` when a key is present. Response cached for 60 s per key hash. Returns the upstream payload verbatim so the client can consume `id`, `outputModalities`, `inputModalities`, `pricing`, etc.

Client-side merge with `unified-image-models.ts`:

- For each entry in the fetch, look up `getUnifiedModel(id)`.
  - If found: display name, icon, `temporalControl`, `maxImages`, `referenceMode` come from the config.
  - If not found: fall back to `{ name: id, kind: outputModalities includes 'video' ? 'video' : 'image', supportsReference: inputModalities includes 'image' }`. Show a small `unmapped` chip next to the model name.
- IDs that exist in `unified-image-models.ts` but not in the fetch are hidden — the upstream is the source of truth for **what is available**, the config is the source of truth for **how to render its params**.

Quest vs. paid: no manual gating. Pollinations already filters by the key attached to the request.

### Pruna — config-first

Basis: `PRUNA_MODEL_IDS` from `src/config/pruna-models.ts`.

Exclusion list (compile-time constant in the new module):

```ts
const PRUNA_HIDDEN_IN_PLAYGROUND = new Set(['p-image-try-on', 'p-video-avatar']);
```

Visibility rules:

- No `prunaApiKey` in localStorage → model select shows an empty state with `Add a Pruna key to unlock 14 Pruna models`.
- Key present → all `PRUNA_MODEL_IDS \ PRUNA_HIDDEN_IN_PLAYGROUND` (14 models) are shown, mode-filtered.

The Pruna server-side entitlement flag from `/api/capabilities` is informational only (falls back to `PRUNA_API_KEY` env). If neither env nor user key is present, `/api/generate` will still error with 503 — we surface that as a toast.

### Mode filtering

The four playground modes map to model attributes:

| Mode | Predicate |
|---|---|
| T2I | `kind === 'image'` **and** either `!supportsReference` or `referenceMode === 'multi-image' && maxImages === 0`. For Pollinations live entries: `outputModalities` includes image, and `image` is not required in `inputModalities`. |
| I2I | `kind === 'image'` **and** the model accepts at least one reference (`supportsReference && maxImages >= 1`). |
| T2V | `kind === 'video'` **and** does not require an image input (Pollinations: no `image` in `inputModalities`; Pruna: `wan-t2v`, `p-video` t2v-path, `wan-fast` t2v-path). |
| I2V | `kind === 'video'` **and** accepts an image input (`wan-i2v`, `vace`, `p-video`, `p-video-animate`, `p-video-replace`). |

`p-video`, `wan-fast` are smart-dispatch models — they appear in both T2V and I2V and the actual Pruna sub-model is picked at request time by `resolveModel` in `pruna-models.ts`.

## 5. Params panel

All widgets read from the same config the Visualize tool already uses:

- Aspect-ratio pills: `getAspectRatioPresetsForModel(modelId)`.
- Duration slider: `getDurationOptionsSeconds(model)` + `getDefaultDurationSeconds(model, legacyDefault)`. Slider hidden when the list is empty.
- Reference-upload slots: `maxImages` and `referenceMode`; slot labels come from a per-model `uploadLabels` extension we add to the playground module (start/end frame for start-end-frame models, otherwise `#1..#N`).
- Advanced fields (seed, guidance, steps, negative prompt): `unifiedModelConfigs[modelId].inputs` filtered to the ones that are documented for the model.
- Model icons: `imageModelIcons[modelId]`.

Switching model resets ratio/duration/advanced fields to the model's defaults if the current value is not valid for the new model; a valid value is preserved.

## 6. Generate flow

Client:

1. Assemble the request body from the current state: `{ prompt, model, aspectRatio, duration, audio, seed, negative_prompt, image, srcRefImages, video }` — same shape as the existing `/api/generate` schema, no new server contract.
2. Attach whichever key headers apply: `X-Pollen-Key` from `pollenApiKey`, `X-Pruna-Key` from `prunaApiKey`. Both may be sent; the server picks the right one per model.
3. `POST /api/generate`. Hero switches to `working` state; button shows working spinner.
4. On success:
   - JSON `{ imageUrl }` or `{ videoUrl }` → wrap in an asset (`OutputService.save`).
   - Raw binary body (Pruna path without Pollen key) → `BlobManager.register(context: 'playground')`, persist blob to IndexedDB via `OutputService`.
5. Hero renders the result; gallery prepends the new asset.
6. On error: hero returns to previous state, toast surfaces the error message.

Reference-image upload before generate:

- Pollinations models → `/api/media/upload` (existing, already hardened by `readBodyWithLimit`/`isActiveContentType`).
- Pruna models → `/api/pruna/upload` (existing) → returns a Pruna `/v1/files` URL that goes into the `image` field.

Cancel: `AbortController` bound to the fetch; button toggles to `Cancel` while working.

## 7. Persistence

- Gallery entries: stored in the same Dexie `assets` table the rest of the app uses, tagged `source: 'playground'` so they can be filtered / migrated later. Displayed gallery = latest 50 assets with that tag.
- Prompt / model / ratio / mode / provider: last state persisted in `localStorage.playgroundState` (single JSON blob, migrated on version bump).
- Keys: unchanged — same localStorage entries as chat.

No new Dexie migrations. No changes to `OutputService` beyond a new tag string.

## 8. New files & touched files

New (minimal set):

```
src/app/playground/page.tsx                          — route entry
src/app/playground/PlaygroundShell.tsx               — top-level component
src/components/playground/ProviderSwitch.tsx
src/components/playground/ApiKeyField.tsx
src/components/playground/ModeSwitch.tsx
src/components/playground/ModelSelect.tsx
src/components/playground/PromptPanel.tsx
src/components/playground/ReferenceUploads.tsx
src/components/playground/AspectRatioPills.tsx      — thin wrapper around presets
src/components/playground/DurationSlider.tsx
src/components/playground/AdvancedPanel.tsx
src/components/playground/GenerateButton.tsx
src/components/playground/Hero.tsx
src/components/playground/Gallery.tsx
src/components/playground/MobileBar.tsx
src/hooks/usePlaygroundState.ts                     — reducer + persistence
src/hooks/usePlaygroundModels.ts                    — live-fetch + config merge
src/lib/playground/model-source.ts                  — provider+mode filtering
src/lib/playground/mode-mapping.ts                  — T2I/I2I/T2V/I2V predicates
src/app/api/pollen/image-models/route.ts            — proxy for live model list
```

Tests (each file next to its target, `.test.ts(x)`):

- `usePlaygroundModels.test.ts` — live fetch + config merge + fallback
- `model-source.test.ts` — provider gating (no key states)
- `mode-mapping.test.ts` — every listed model lands in the expected mode(s)
- `route.test.ts` for `/api/pollen/image-models` — key forwarding, cache
- Component tests for `ProviderSwitch`, `ModelSelect`, `Hero` (state transitions)

Touched:

- `src/components/layout/AppSidebar.tsx` — add a `Playground →` link (bottom section).
- `src/config/translations.ts` — DE/EN strings for playground UI copy.
- Nothing else in existing code is renamed or removed in this milestone.

## 9. Error handling & edge cases

- No key + Pruna provider selected → sidebar shows empty state; Generate is disabled; toast on any attempt: `Pruna key required`.
- No key + Pollinations, quest-only model chosen → API returns whatever Pollinations returns; we surface the error message unchanged.
- Live fetch fails (network / 5xx) → fall back to the config's `POLLINATIONS_MODELS` filtered by `isFree && enabled`, with a warning strip at the top of the model select.
- Model selected from URL query (`?model=xyz`) but not in the current provider's list → auto-switch provider if the model exists in the other provider's list; otherwise ignore.
- Duration invalid for new model → clamp to `getDefaultDurationSeconds`.
- Ratio invalid for new model → first preset from `getAspectRatioPresetsForModel`.
- Reference images stale after model change → keep the files, but truncate to the new `maxImages`.

## 10. Testing strategy

- Jest for hooks, lib, and route (already the repo convention).
- Component tests with React Testing Library for the interactive widgets.
- One end-to-end pass in the dev server (manual): pollinations flux happy path, pruna zimage without key (should be gated), pruna zimage with key, model switch preserves valid params, live-fetch fallback (simulated by pointing at a bad host).

## 11. Follow-ups (explicitly not in this milestone)

- Decommissioning the Visualize tab in `/unified`.
- Trimming the chat page (removing Compose, reducing Visualize to a 1–3 model sidebar config).
- Batch generation, presets, sharable links.
- Migrating existing gallery items to the `source: 'playground'` tag.
