# Pruna Model Contracts and Video Duration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:test-driven-development while implementing. Do not commit unless the user explicitly requests it.

**Goal:** Correct enabled Pruna model payloads and expose truthful, seconds-based video length controls.

**Architecture:** Keep the unified model registry as UI capability truth and the Pruna registry as provider payload truth. Add a discriminated temporal capability to the unified registry; the UI displays seconds while the Pruna adapter performs frame conversion. Source-, speech-, and fixed-frame models expose no fake editable duration.

**Tech Stack:** Next.js 16, React, TypeScript, Zod, Jest, Testing Library.

---

## Chunk 1: Provider contracts

### Task 1: Lock current Pruna payload schemas

**Files:**
- Modify: `src/config/__tests__/pruna-models.test.ts`
- Modify: `src/config/pruna-models.ts`

- [ ] Add failing tests proving Wan I2V omits `aspect_ratio`, supports `last_image`, and converts seconds to valid frames.
- [ ] Add failing tests proving Wan T2V retains `aspect_ratio` and maps approved seconds to frames.
- [ ] Add failing tests proving VACE ignores generic seconds and uses `frame_num`.
- [ ] Run the focused model test and confirm the failures describe current schema drift.
- [ ] Implement the smallest per-model builders that satisfy the contracts.
- [ ] Run the focused model test and confirm it passes.

### Task 2: Correct P-Video family time semantics

**Files:**
- Modify: `src/config/__tests__/pruna-models.test.ts`
- Modify: `src/config/pruna-models.ts`

- [ ] Add failing tests for P-Video 1–20-second acceptance and Avatar/Animate/Replace duration omission.
- [ ] Add a failing Avatar test requiring `voice_script` from the user prompt.
- [ ] Run the tests and verify RED.
- [ ] Implement the minimal payload corrections.
- [ ] Run the tests and verify GREEN.

## Chunk 2: Registry and UI

### Task 3: Represent temporal capabilities

**Files:**
- Modify: `src/config/unified-image-models.ts`
- Modify: `src/config/__tests__/model-invariants.test.ts`

- [ ] Add failing registry tests for P-Video direct seconds, Wan frame-backed seconds, Avatar speech-driven, Animate/Replace source-driven, and VACE fixed frames.
- [ ] Run the registry test and verify RED.
- [ ] Add the discriminated `temporalControl` type and correct model metadata/audio flags.
- [ ] Mark Wan I2V as start/end-frame capable with two ordered images.
- [ ] Run the registry test and verify GREEN.

### Task 4: Render only truthful seconds controls

**Files:**
- Modify: `src/components/tools/visualize/VisualizeInlineHeader.tsx`
- Modify: `src/components/tools/visualize/VisualizeInlineHeader.test.tsx`
- Modify: `src/components/chat/ChatInput.tsx`
- Modify: `src/components/sidebar/PersonalizationSidebarSection.tsx`
- Modify: `src/config/unified-model-configs.ts`
- Modify: `src/hooks/useUnifiedImageToolState.ts`
- Modify: `src/hooks/useUnifiedImageToolState.test.tsx`
- Modify: `src/lib/services/chat-service.ts`
- Modify: `src/lib/services/__tests__/chat-service.test.ts`

- [ ] Add failing tests that Wan renders 5/6/7/7.5-second choices, P-Video exposes its valid seconds, and source/speech/fixed models render no duration selector.
- [ ] Add failing tests proving Pruna visibility depends on Pruna availability in the hook, inline header, and sidebar rather than on the Pollen key.
- [ ] Add failing request-adapter tests proving non-controllable video models do not receive a fallback duration while legacy Pollinations `durationRange` models continue to accept explicitly supplied seconds.
- [ ] Run the focused UI tests and verify RED.
- [ ] Drive initialization and rendering from `temporalControl` and remove fake generic duration inputs.
- [ ] Run the focused UI tests and verify GREEN.

## Chunk 3: Dispatch integrity

### Task 5: Make Pruna routing strict

**Files:**
- Modify: `src/app/api/generate/route.ts`
- Modify: `src/app/api/generate/route.test.ts`
- Modify: `src/hooks/useUnifiedImageToolState.ts`

- [ ] Add a failing route test proving `zimage` does not fall back to Pollinations when Pruna fails.
- [ ] Add/retain route tests proving all enabled Pruna image IDs dispatch through Pruna.
- [ ] Add failing route tests for rejected P-Video/Wan seconds outside their model-specific contracts.
- [ ] Add a failing route test proving a Wan I2V end frame reaches Pruna in order.
- [ ] Run the route test and verify RED.
- [ ] Remove the silent fallback, validate temporal input before dispatch, and use the correct provider entitlement for model visibility.
- [ ] Run the route and hook tests and verify GREEN.

### Task 6: Verify the complete change

**Files:**
- Modify if required: `scripts/pruna-smoke-check.mjs`

- [ ] Run focused Pruna/model/UI/route tests.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `CI=1 npm test -- --runInBand`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check` and inspect only task-owned diffs.
