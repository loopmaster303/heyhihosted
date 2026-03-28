# BYOP Visibility And Pollinations Auditor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand text model visibility for BYOP users, unlock already known hidden image/video models for BYOP users, and upgrade the Pollinations auditor to report drift plus image/video commit-readiness for newly discovered upstream models.

**Architecture:** Add a dedicated text catalog resolver that merges local curated metadata with a BYOP-only upstream text overlay, while keeping smart-router candidates explicitly local. Add an explicit local visibility policy for image/video models so BYOP users can see locally known hidden paid models without exposing deprecated or internal-only entries. Extend the Pollinations audit helper to classify newly discovered upstream image/video drift against local registry, model-config, and enhancement-prompt readiness instead of treating every upstream delta as equally actionable.

**Tech Stack:** Next.js, React, TypeScript, Jest, Node.js audit scripts, Pollinations model endpoints

---

## Chunk 1: BYOP Text Visibility

### Task 1: Centralize runtime text catalog resolution

**Files:**
- Create: `src/lib/pollinations/pollinations-text-catalog.ts`
- Modify: `src/config/chat-options.ts`
- Test: `src/lib/pollinations/pollinations-text-catalog.test.ts`

- [ ] **Step 1: Write the failing resolver test**

Cover:
- curated visibility without BYOP
- BYOP-expanded visibility from upstream text models
- denylist exclusion for `openai-audio` and `midijourney`
- local metadata winning over generic upstream fallback metadata

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --runInBand src/lib/pollinations/pollinations-text-catalog.test.ts`
Expected: FAIL because resolver module does not exist yet

- [ ] **Step 3: Implement minimal resolver**

Resolver responsibilities:
- export curated local text registry
- export curated visible list for fallback-key mode
- merge upstream models into a BYOP-visible list
- expose safe lookup/normalization helpers

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest --runInBand src/lib/pollinations/pollinations-text-catalog.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/pollinations/pollinations-text-catalog.ts src/config/chat-options.ts src/lib/pollinations/pollinations-text-catalog.test.ts
git commit -m "feat: add byop-aware text model catalog"
```

### Task 2: Feed BYOP-aware text visibility into the UI

**Files:**
- Modify: `src/components/sidebar/PersonalizationSidebarSection.tsx`
- Modify: `src/components/ChatProvider.tsx`
- Modify: `src/lib/chat/chat-capability-resolution.ts`
- Possibly modify: `src/app/unified/page.tsx`
- Test: `src/config/__tests__/model-invariants.test.ts`

- [ ] **Step 1: Write the failing UI/selection test**

Cover:
- fallback-key path still uses the curated list
- BYOP-connected path can surface extra upstream text models
- stale stored text ids still normalize safely

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --runInBand src/config/__tests__/model-invariants.test.ts`
Expected: FAIL because tests still assume only the old static visible policy

- [ ] **Step 3: Implement the minimal runtime integration**

Implementation notes:
- consume `usePollenKey()` or a derived connection signal only where model visibility is chosen
- keep smart-router candidates local and static
- do not change fallback-key request behavior

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest --runInBand src/config/__tests__/model-invariants.test.ts`
Expected: PASS with updated assertions for fallback and BYOP modes

- [ ] **Step 5: Commit**

```bash
git add src/components/sidebar/PersonalizationSidebarSection.tsx src/components/ChatProvider.tsx src/lib/chat/chat-capability-resolution.ts src/config/__tests__/model-invariants.test.ts
git commit -m "feat: surface upstream text models for byop users"
```

## Chunk 2: BYOP Image And Video Visibility For Locally Known Models

### Task 3: Add explicit image/video visibility policy

**Files:**
- Modify: `src/config/unified-image-models.ts`
- Possibly modify: `src/config/unified-model-configs.ts`
- Test: `src/config/__tests__/model-invariants.test.ts`

- [ ] **Step 1: Write the failing visibility-policy test**

Cover:
- public users still see the current public image/video set
- BYOP users additionally see locally known hidden paid models
- deprecated or internal fallback models stay hidden even with BYOP

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --runInBand src/config/__tests__/model-invariants.test.ts`
Expected: FAIL because image/video visibility is still driven by the old public-only logic

- [ ] **Step 3: Implement minimal local visibility policy**

Implementation notes:
- do not overload historic `enabled` semantics
- introduce explicit metadata for public visibility vs BYOP visibility vs hidden/internal
- keep runtime model identity and alias behavior unchanged

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest --runInBand src/config/__tests__/model-invariants.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/config/unified-image-models.ts src/config/unified-model-configs.ts src/config/__tests__/model-invariants.test.ts
git commit -m "feat: add byop image visibility policy"
```

### Task 4: Feed BYOP-aware image/video visibility into the UI

**Files:**
- Modify: `src/hooks/useUnifiedImageToolState.ts`
- Modify: `src/components/sidebar/PersonalizationSidebarSection.tsx`
- Possibly modify: `src/components/tools/visualize/VisualConfigPanel.tsx`
- Possibly modify: `src/components/tools/UnifiedImageTool.tsx`

- [ ] **Step 1: Write the failing runtime selection test**

Cover:
- BYOP-connected users can select locally known hidden paid image/video models
- non-BYOP users cannot see those models
- model defaults still clamp safely if a previously selected BYOP-only model becomes unavailable

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --runInBand src/config/__tests__/model-invariants.test.ts`
Expected: FAIL until UI/runtime consumers respect the new visibility policy

- [ ] **Step 3: Implement the minimal runtime integration**

Implementation notes:
- derive visibility from local metadata plus BYOP connection state
- do not expose upstream-only image/video models at runtime
- preserve current upload/reference and output-type logic

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest --runInBand src/config/__tests__/model-invariants.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useUnifiedImageToolState.ts src/components/sidebar/PersonalizationSidebarSection.tsx src/components/tools/visualize/VisualConfigPanel.tsx src/components/tools/UnifiedImageTool.tsx
git commit -m "feat: surface local paid visual models for byop users"
```

## Chunk 3: Auditor Readiness Classification For New Upstream Image/Video Models

### Task 5: Teach the audit helper to classify image/video readiness

**Files:**
- Modify: `scripts/audit/pollinations-drift-report.js`
- Modify: `scripts/audit/pollinations-drift-report.test.ts`
- Read for source-of-truth mapping: `src/config/unified-image-models.ts`
- Read for source-of-truth mapping: `src/config/unified-model-configs.ts`
- Read for source-of-truth mapping: `src/config/enhancement-prompts.ts`
- Read for alias support: `src/app/api/enhance-prompt/route.ts`

- [ ] **Step 1: Write the failing readiness test**

Cover:
- new upstream image/video model with all local prerequisites → `commit-ready`
- new upstream image/video model missing enhancement prompt → `missing-enhancement-prompt`
- new upstream image/video model missing local config → corresponding missing classification
- already known local hidden paid models do not count as upstream drift

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --runInBand scripts/audit/pollinations-drift-report.test.ts`
Expected: FAIL because readiness classification is not implemented yet

- [ ] **Step 3: Implement minimal readiness classification**

Implementation notes:
- keep alias normalization shared inside the audit helper
- require local registry/config/enhancement prompt presence before emitting `commit-ready`
- keep shell output parseable and compact

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest --runInBand scripts/audit/pollinations-drift-report.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/audit/pollinations-drift-report.js scripts/audit/pollinations-drift-report.test.ts
git commit -m "feat: classify pollinations image drift readiness"
```

### Task 6: Expose richer Pollinations audit output

**Files:**
- Modify: `scripts/audit/check-pollinations.sh`
- Modify: `scripts/audit/audit.sh`

- [ ] **Step 1: Write or extend the failing audit test**

If there is no shell-level test harness, extend the existing Node helper test to assert the exact shell fields needed for:
- current upstream text models summary
- image/video drift for newly discovered upstream models
- locally known hidden paid image/video models, if useful as a separate informational section
- commit-ready image/video models
- blocked image/video models with missing enhancement prompts

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --runInBand scripts/audit/pollinations-drift-report.test.ts`
Expected: FAIL because the shell fields/report formatting are incomplete

- [ ] **Step 3: Implement minimal shell/report integration**

Implementation notes:
- keep `audit.sh` compatible with the existing Telegram message structure
- add separate fields for:
  - upstream text summary
  - image/video drift for newly discovered upstream models
  - locally known hidden paid image/video models, if useful as a separate informational section
  - commit-ready image/video models
  - blocked image/video models

- [ ] **Step 4: Run verification**

Run: `bash -n scripts/audit/check-pollinations.sh scripts/audit/audit.sh`
Expected: exit 0

Run: `bash scripts/audit/check-pollinations.sh`
Expected: emits the new shell variables and a readable Pollinations drift/readiness summary

- [ ] **Step 5: Commit**

```bash
git add scripts/audit/check-pollinations.sh scripts/audit/audit.sh
git commit -m "feat: expand pollinations audit reporting"
```

## Chunk 4: Final Verification

### Task 7: Verify end-to-end safety of the new behavior

**Files:**
- Verify all files touched above

- [ ] **Step 1: Run targeted tests**

Run:
- `npx jest --runInBand src/lib/pollinations/pollinations-text-catalog.test.ts`
- `npx jest --runInBand src/config/__tests__/model-invariants.test.ts`
- `npx jest --runInBand scripts/audit/pollinations-drift-report.test.ts`

Expected: all PASS

- [ ] **Step 2: Run static verification for the audit shell**

Run: `bash -n scripts/audit/check-pollinations.sh scripts/audit/audit.sh`
Expected: exit 0

- [ ] **Step 3: Run the live Pollinations audit**

Run: `bash scripts/audit/check-pollinations.sh`
Expected: live drift/readiness output against current Pollinations endpoints

- [ ] **Step 4: Sanity-check runtime assumptions**

Checklist:
- fallback-key mode still shows curated text models only
- BYOP mode can show upstream text models except `openai-audio` and `midijourney`
- smart-router candidates remain curated and visible
- BYOP mode can show locally known hidden paid image/video models
- deprecated/internal image/video models still stay hidden
- newly discovered upstream image/video models still do not auto-appear at runtime
- audit clearly distinguishes local BYOP-unlockable models from new upstream drift and commit-readiness

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add byop model visibility and richer pollinations audit planning changes"
```
