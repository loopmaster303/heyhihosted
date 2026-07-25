# HeyHi Audit Hardening Cleanup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the currently green build/test repo to merge-grade hygiene by fixing strict lint blockers, closing bounded backend hardening gaps, and reducing noisy/stale audit findings without widening product scope.

**Architecture:** Keep fixes local to the surfaces that failed audit: React state/effect boundaries in UI, bounded request handling in API routes, and deterministic project/audit tooling. Do not refactor chat, gallery, provider, or media architecture unless a failing test proves the current shape cannot be fixed safely.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Jest, ESLint React Compiler rules, Pollinations/Pruna server routes, local shell audit scripts, clawpatch findings as advisory input.

---

## Audit Baseline

- `npm run typecheck` passes.
- `npx jest --watch=false` passes: 54 suites, 310 tests.
- Backend/API focused tests pass: 8 suites, 108 tests.
- Frontend/UI focused tests pass: 7 suites, 28 tests.
- `npm run build` passes, but warns that Next inferred `/Users/johnmeckel` as workspace root because another lockfile exists above the repo.
- `npm run lint` fails with 5 React Compiler errors and 3 hook warnings.
- `clawpatch` has 78 open findings, but several high findings are stale against current code: audit eval, npm-audit parsing, media redirect SSRF, Pruna download redirect, UnifiedImageTool compile blocker, chat completion return handling.

## Chunk 1: Frontend/UI-UX Strict Lint Fixes

### Task 1: GalleryPanel Close-State Reset

**Files:**
- Modify: `src/components/gallery/GalleryPanel.tsx`
- Test: existing gallery tests, plus a focused regression test if panel close behavior is already testable.

- [ ] **Step 1: Write or identify failing lint check**

Run:
```bash
npm run lint -- src/components/gallery/GalleryPanel.tsx
```
Expected: FAIL on `react-hooks/set-state-in-effect` around `if (!isOpen) setView('grid')`.

- [ ] **Step 2: Move reset to event boundary or derived transition**

Prefer resetting `view` in the caller/open-state transition that closes the panel, or gate rendering so closed panels always reopen in grid without synchronous effect state.

- [ ] **Step 3: Verify behavior**

Run:
```bash
npx jest --watch=false src/components/gallery/GallerySidebarSection.test.tsx
npm run lint -- src/components/gallery/GalleryPanel.tsx
```
Expected: tests pass; no lint error for `GalleryPanel.tsx`.

### Task 2: AppLayout Sidebar Collapse State

**Files:**
- Modify: `src/components/layout/AppLayout.tsx`
- Test: add/extend layout test if one exists; otherwise use focused lint plus manual review.

- [ ] **Step 1: Reproduce lint**

Run:
```bash
npm run lint -- src/components/layout/AppLayout.tsx
```
Expected: FAIL on `setGalleryPanelOpen(false)` inside effect.

- [ ] **Step 2: Move close logic into sidebar toggle action**

When collapsing sidebar, close gallery panel in the same event/action that changes `sidebarExpanded`, not in an effect that reacts afterward.

- [ ] **Step 3: Verify**

Run:
```bash
npm run lint -- src/components/layout/AppLayout.tsx
```
Expected: PASS for this file.

### Task 3: OfflineIndicator Mount/Online Initialization

**Files:**
- Modify: `src/components/ui/OfflineIndicator.tsx`
- Test: add focused component test if existing UI test harness can render it.

- [ ] **Step 1: Reproduce lint**

Run:
```bash
npm run lint -- src/components/ui/OfflineIndicator.tsx
```

- [ ] **Step 2: Replace mount effect state with SSR-safe initial state**

Avoid `setIsMounted(true)` and immediate `setIsOnline(navigator.onLine)` inside effect. Use a client-only rendering strategy or initialize online state lazily when `window` exists, then only subscribe in the effect.

- [ ] **Step 3: Verify**

Run:
```bash
npm run lint -- src/components/ui/OfflineIndicator.tsx
```
Expected: PASS.

### Task 4: UnifiedInput Flash Effect and IME Contract

**Files:**
- Modify: `src/components/ui/unified-input.tsx`
- Test: `src/components/ui/unified-input.test.tsx`

- [ ] **Step 1: Preserve existing behavior tests**

Run:
```bash
npx jest --watch=false src/components/ui/unified-input.test.tsx
```

- [ ] **Step 2: Fix synchronous effect state**

Replace the direct `setFlashActive(true)` effect pattern with a reducer/event-derived animation key, CSS animation class keyed by `modeColor`, or another React-Compiler-safe pattern.

- [ ] **Step 3: Verify keyboard contract**

Ensure Enter submit still respects `e.defaultPrevented` and `e.nativeEvent.isComposing`.

- [ ] **Step 4: Run**

```bash
npx jest --watch=false src/components/ui/unified-input.test.tsx
npm run lint -- src/components/ui/unified-input.tsx
```

### Task 5: useMediaQuery React Compiler Compliance

**Files:**
- Modify: `src/hooks/useMediaQuery.ts`
- Test: add `src/hooks/useMediaQuery.test.tsx` if no existing coverage.

- [ ] **Step 1: Add failing test**

Test initial match and change event behavior with mocked `window.matchMedia`.

- [ ] **Step 2: Implement with `useSyncExternalStore`**

Use `useSyncExternalStore` for media query subscription instead of `setMatches(mql.matches)` inside an effect.

- [ ] **Step 3: Run**

```bash
npx jest --watch=false src/hooks/useMediaQuery.test.tsx
npm run lint -- src/hooks/useMediaQuery.ts
```

## Chunk 2: Backend/API Hardening

### Task 6: Upload Route Memory Boundaries

**Files:**
- Modify: `src/app/api/media/upload/route.ts`
- Test: create/extend `src/app/api/media/upload/route.test.ts`

- [ ] **Step 1: Write failing tests**

Cover missing key, empty file, over-10MB file, and upstream failure.

- [ ] **Step 2: Confirm current limitation**

Current code calls `request.formData()` before size checks, so multipart body buffering can happen before rejection.

- [ ] **Step 3: Decide minimal safe boundary**

If streaming multipart parsing is too large for this pass, document the limitation and add `Content-Length` preflight rejection before `formData()` as a first defense.

- [ ] **Step 4: Verify**

```bash
npx jest --watch=false src/app/api/media/upload/route.test.ts
```

### Task 7: Image Proxy Size and Content-Type Guard

**Files:**
- Modify: `src/app/api/proxy-image/route.ts`
- Test: `src/app/api/proxy-image/route.test.ts`

- [ ] **Step 1: Add failing tests**

Mock responses for missing `content-length`, oversized `content-length`, non-image `content-type`, and oversized body after fetch.

- [ ] **Step 2: Implement bounded fetch response handling**

Reject non-image content types and enforce `MAX_UPLOAD_BYTES` both from header and after `arrayBuffer()`.

- [ ] **Step 3: Run**

```bash
npx jest --watch=false src/app/api/proxy-image/route.test.ts
```

### Task 8: TTS Text Length Limit

**Files:**
- Modify: `src/app/api/tts/route.ts`
- Test: `src/app/api/tts/route.test.ts`

- [ ] **Step 1: Add failing test**

POST a text payload beyond the agreed max length and assert 400 without calling `textToSpeech`.

- [ ] **Step 2: Implement schema max**

Use `z.string().min(1).max(N)` with a conservative limit matching UI expectations.

- [ ] **Step 3: Run**

```bash
npx jest --watch=false src/app/api/tts/route.test.ts
```

### Task 9: Compose Boolean Coercion

**Files:**
- Modify: `src/app/api/compose/route.ts`
- Test: `src/app/api/compose/route.test.ts`

- [ ] **Step 1: Add failing test**

POST `{ instrumental: "false" }` and assert output/query uses `instrumental=false`, or reject non-boolean input with 400.

- [ ] **Step 2: Implement strict parsing**

Prefer a Zod schema for `prompt`, `duration`, `instrumental`, and `model`; do not use `Boolean(instrumental)` for unknown input.

- [ ] **Step 3: Run**

```bash
npx jest --watch=false src/app/api/compose/route.test.ts
```

## Chunk 3: Cleanup, CI, and Stale clawpatch Findings

### Task 10: Deterministic Tooling and Build Root

**Files:**
- Modify: `next.config.ts`
- Possibly inspect/remove: `/Users/johnmeckel/package-lock.json` only with explicit human approval.

- [ ] **Step 1: Reproduce warning**

Run:
```bash
npm run build
```
Expected: build passes with workspace-root warning.

- [ ] **Step 2: Add explicit Turbopack root**

Set the documented `turbopack.root` to the repo root in `next.config.ts` if compatible with Next 16.

- [ ] **Step 3: Verify**

```bash
npm run build
```
Expected: build passes without root warning.

### Task 11: Test/Console Noise Hygiene

**Files:**
- Modify only tests or a shared test logger helper.
- Candidate files: route tests that intentionally trigger `handleApiError`, enhance-prompt fallback tests, output-service fallback tests.

- [ ] **Step 1: Identify noisy expected-error suites**

Run:
```bash
npx jest --watch=false 2>&1 | tee /tmp/heyhi-jest.log
```

- [ ] **Step 2: Silence expected logs locally**

Spy on `console.error`, `console.warn`, or `console.log` inside tests that intentionally trigger those paths. Assert meaningful messages where useful.

- [ ] **Step 3: Verify**

```bash
npx jest --watch=false
```
Expected: 310 tests pass with materially quieter output.

### Task 12: clawpatch Findings Reconciliation

**Files:**
- Modify: `.clawpatch` state only if the tool supports safe triage commands.
- Do not hand-edit finding JSON unless explicitly approved.

- [ ] **Step 1: Export current findings**

```bash
clawpatch report --root /Users/johnmeckel/heyhihosted --status open --json > /tmp/heyhi-clawpatch-open.json
```

- [ ] **Step 2: Revalidate stale resolved findings**

For findings already fixed in current code, run `clawpatch revalidate` or `clawpatch triage` according to CLI help.

- [ ] **Step 3: Keep real findings open**

Keep Lint, upload buffering, proxy buffering, TTS length, compose boolean, and Next root warning open until fixed and tested.

## Final Verification

- [ ] `npm run typecheck` → PASS.
- [ ] `npx jest --watch=false` → PASS.
- [ ] `npm run lint` → PASS.
- [ ] `npm run build` → PASS without workspace-root warning.
- [ ] `clawpatch report --root /Users/johnmeckel/heyhihosted --status open --plain` shows only accepted/deferred non-blockers.

## Reality Check

This plan does not create spaghetti code because it targets existing responsibility boundaries: UI state fixes remain inside UI components/hooks, API limits remain inside individual route handlers, and tooling cleanup stays in config/tests. It avoids touching `useChatState` and `useUnifiedImageToolState` except via tests that already pass. The simpler path is not a broad refactor; it is to fix the lint-contract violations and the few bounded server guards with focused regression tests.

## Why

Tests and typecheck are already green, so large refactors would be Verschlimmbesserung. The actual blockers are strict lint failures, a build-root warning that can confuse CI, and a small set of bounded API safety gaps. Fixing those first gives the repo a clean quality gate without reopening the Pruna/provider work.
