# Audit Rebaseline & Next Steps Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebaseline hey.hi on current product truth, then run a fresh audit across product, UI/UX, security, API behavior, and documentation without relying on outdated model or provider assumptions.

**Architecture:** First align visible product behavior with the currently enabled Pollinations model set and update active documentation to the same truth. Then run a new audit in focused workstreams so findings are based on the live app and the real code paths, not historical assumptions or stale docs.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, Dexie, Pollinations APIs, Jest, shell audit scripts.

---

## Current Baseline

- Visible compose model: `elevenmusic`
- Visible image models: `flux`, `zimage`, `gpt-image`, `imagen-4`, `grok-image`, `grok-video`
- Hidden due to current upstream availability or internal fallback status: `suno`, `dirtberry`, `flux-2-dev`, `klein`, `klein-large`
- Chat text models already trimmed to the intended visible free set
- Prompt enhancement has model-specific behavior for `dirtberry`, `imagen-4`, `zimage`, `klein-large`
- Product docs were previously drifting between Pollinations-only reality and older Replicate/Deepgram/S3 narratives

## Audit Question Set

- [ ] Does the visible product match the enabled registry and actual runtime behavior?
- [ ] Does the UI degrade gracefully when upstream Pollinations models go offline?
- [ ] Are prompt-enhance routes, media routes, and chat routes consistent with the current model inventory?
- [ ] Is the mobile-first UX coherent across landing, chat, visualize, compose, and research?
- [ ] Are keys, uploads, asset URLs, and media resolution flows secure enough for the current architecture?
- [ ] Do active documents describe the code that actually runs today?

## Chunk 1: Product Truth & Availability Governance

**Files:**
- Modify: `src/config/unified-image-models.ts`
- Modify: `src/components/tools/compose/ComposeInlineHeader.tsx`
- Modify: `src/config/__tests__/model-invariants.test.ts`

- [ ] Confirm the current visible model list matches the intended enabled set.
- [ ] Keep availability gating centralized in config and selector surfaces only.
- [ ] Avoid adding a live monitor client until there is a strong need for runtime availability sync.
- [ ] Verify local fallback behavior when a previously saved unavailable model ID is encountered.
- [ ] Run focused model invariant tests after any registry change.

## Chunk 2: Active Documentation Alignment

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `GEMINI.md`
- Modify: `docs/PRODUCT_IDENTITY.md`
- Modify: `docs/COMPONENT_STATE_BEHAVIOR.md`
- Modify: `docs/architecture-view.md`
- Modify: `docs/asset-fallback-service.md`
- Modify: `conductor/product.md`
- Modify: `scripts/audit/check-doc-drift.sh`

- [ ] Keep user-facing docs focused on visible behavior, not hidden offline models.
- [ ] Keep operator docs honest about internal fallbacks and disabled-but-mapped models when that matters for maintenance.
- [ ] Remove stale provider/storage claims such as Replicate, Deepgram, S3 signed-upload narratives, and Suno availability claims while the UI hides them.
- [ ] Expand the doc drift script to cover all active docs that still shape contributor decisions.
- [ ] Leave dated historical plans and dated phase reports untouched unless they are explicitly being rewritten as history.

## Chunk 3: Fresh Audit Pass

**Deliverable:**
- Create: `docs/PRODUCT_AUDIT_2026-03-13.md`

- [ ] Start from the rebaselined product truth, not the older audit notes.
- [ ] Capture findings ordered by severity.
- [ ] Separate confirmed findings from suspected drift or open questions.
- [ ] Include file references for implementation-facing findings.
- [ ] Keep historical context brief; the new audit should stand on its own.

### Audit Streams

- [ ] **Architecture & State**: `ChatProvider`, `useChatState`, `useUnifiedImageToolState`, compose state, gallery state
- [ ] **API & Routing**: chat completion, smart router, web context, generate, compose, media upload/ingest, tts/stt
- [ ] **Model Governance**: visible registries, hidden models, prompt enhancement routing, fallback assumptions
- [ ] **UI/UX & Mobile First**: landing height behavior, mode discoverability, selector clarity, chat input ergonomics, gallery and media flows
- [ ] **Security**: local key storage, API header propagation, remote media trust, upload and proxy surfaces, asset URL lifetimes
- [ ] **Documentation**: active docs vs. actual code paths

## Chunk 4: Priority Buckets After Audit

- [ ] **Now**: bugs, security issues, misleading UI, broken availability assumptions
- [ ] **Next**: product consistency, audit-script hardening, selector ergonomics, mobile polish
- [ ] **Later**: runtime model-monitor integration, stronger key handling, deeper architectural cleanup

## Verification Checklist

- [ ] Run: `npm test -- --runInBand src/config/__tests__/model-invariants.test.ts`
- [ ] Run: `npm test -- --runInBand src/config/__tests__/image-aspect-ratio-presets.test.ts`
- [ ] Run: `bash scripts/audit/check-doc-drift.sh`
- [ ] Run: `npm run typecheck`
- [ ] Run: `npm run build`

## Expected Outputs

- [ ] Hidden-off models are no longer selectable in the product UI
- [ ] Active docs no longer advertise hidden or stale provider-backed features
- [ ] A new dated audit document exists and is internally consistent
- [ ] The next engineering steps are grouped into immediate fixes, medium-term hardening, and optional architecture work
