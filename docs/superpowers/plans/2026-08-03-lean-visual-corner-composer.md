# Lean Visual Corner Composer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Visual Corner composer usable and responsive without duplicating upload or configuration logic.

**Architecture:** Keep the two established attachment pipelines separate: a standard-chat pending file and provider-hosted Visualize references. Build one context-derived attachment action model and render it in the desktop popover and the one mobile drawer. The Visual Corner remains decorative; all interaction remains in accessible buttons and existing state hooks.

**Scope guard:** Do not edit `src/config/`, `src/lib/pruna/`, or Pruna route/client files for this composer task. Preserve every existing dev origin by merging the two `allowedDevOrigins` arrays into one unique list; no origin is removed.

**Tech Stack:** Next.js, React, TypeScript, Tailwind, Radix/Vaul, Jest + Testing Library.

---

## Chunk 1: Restore the interaction contract

### Task 1: Make the current composer build and preserve desktop actions

**Files:**
- Modify: `next.config.ts`
- Modify: `src/components/chat/ChatInput.tsx`
- Modify: `src/components/ui/unified-input.tsx`
- Modify: `src/components/tools/visualize/VisualizeInlineHeader.test.tsx`
- Create: `src/components/chat/ChatInput.test.tsx`

- [ ] Write failing tests for active Visualize desktop mode retaining a reachable upload/mode action, the model-only header semantics, and the simultaneous rendering of Visual Corner plus attachment-preview row.
- [ ] Run focused tests; verify they fail for the missing action/old label.
- [ ] Merge both Next config dev-origin lists into one unique `allowedDevOrigins` key, remove the unsupported `compact` prop, and change `UnifiedInput` so active top configuration never suppresses required actions.
- [ ] Render reference upload/removal in exactly one desktop surface; remove the discarded `referenceBadges` path.
- [ ] Run focused tests and `npm run typecheck`.

## Chunk 2: One real mobile configuration drawer

### Task 2: Remove nested and placeholder mobile configuration

**Files:**
- Modify: `src/components/chat/ChatInput.tsx`
- Modify: `src/components/chat/input/UnifiedMobileDrawer.tsx`
- Modify: `src/components/tools/InlineParamsContainer.tsx`
- Create: `src/components/chat/input/UnifiedMobileDrawer.test.tsx`

- [ ] Write failing tests proving the Parameters section exposes actual controls and a mode button reports code mode.
- [ ] Run focused tests; verify failure is due to placeholders/current mode label.
- [ ] Give `UnifiedMobileDrawer` the only mobile parameter surface; use existing model and field handlers without nesting `InlineParamsContainer`.
- [ ] Remove synchronous state-in-effect lint violation and use translated labels.
- [ ] Run focused drawer tests, lint, and typecheck.

## Chunk 3: Capability-safe attachments and accessible previews

### Task 3: Share one attachment action description across desktop and mobile

**Files:**
- Modify: `src/components/chat/ChatInput.tsx`
- Modify: `src/components/chat/input/UploadBadges.tsx`
- Modify: `src/components/chat/input/AttachmentPreviewRow.tsx`
- Create: `src/components/chat/input/AttachmentPreviewRow.test.tsx`
- Create: `src/components/chat/input/UploadBadges.test.tsx`

- [ ] Write failing tests for touch-visible removal, source-video/start/end-frame choices, no generic upload action that exits Visualize when the model has no reference support, and no attachment/reference action in Compose.
- [ ] Run focused tests; verify they fail on the current affordances.
- [ ] Replace duplicated desktop/mobile dispatch with a small context-derived action model; keep standard chat and Visualize upload state separate.
- [ ] Do not add multi-file standard-chat state or pretend documents/audio are model references.
- [ ] Run focused tests, `npm run typecheck`, and the affected Visualize hook tests.

## Chunk 4: Integration verification

### Task 4: Verify the complete responsive composer

**Files:**
- Modify only as required by review feedback.

- [ ] Run all directly affected Jest suites serially.
- [ ] Run `npm run lint` and `npm run typecheck`.
- [ ] Review the final diff for provider-mode semantics, generated-reference lifecycle, duplicate controls, inaccessible actions, and unrelated changes.
