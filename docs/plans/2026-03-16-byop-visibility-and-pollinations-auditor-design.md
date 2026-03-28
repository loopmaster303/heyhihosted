# BYOP Visibility And Pollinations Auditor Design

**Date:** 2026-03-16

## Goal

Plan the Pollinations integration so that:

- text model visibility expands automatically when a user provides their own BYOP key
- locally known hidden image/video models become visible when a user provides their own BYOP key
- newly discovered upstream image/video models remain a deliberate developer decision
- the Pollinations auditor reports current upstream models, drift, and whether new image/video models are commit-ready or blocked by missing local prerequisites such as enhancement prompts

## Scope

This design covers two related but separate behaviors:

1. Runtime model visibility for end users.
2. Developer-facing Pollinations auditing and readiness reporting.

No runtime auto-enablement of newly discovered upstream image/video models is included.

## Current State

### Text models

- `src/config/chat-options.ts` contains a hardcoded text registry and hardcoded visible allowlist.
- UI consumers such as `src/components/sidebar/PersonalizationSidebarSection.tsx` read the visible list directly.
- Smart-router assumptions rely on locally visible text models and their metadata.

### Image and video models

- `src/config/unified-image-models.ts` is the local source of truth for whether a model is enabled.
- `src/config/unified-model-configs.ts` contains per-model input schemas.
- `src/config/enhancement-prompts.ts` and `src/app/api/enhance-prompt/route.ts` provide enhancement prompt coverage and alias resolution.
- `src/hooks/useUnifiedImageToolState.ts` only exposes models that are locally enabled.

### BYOP state

- BYOP key state already exists client-side via `src/hooks/usePollenKey.ts`.
- Requests already include `X-Pollen-Key` via `src/lib/pollen-key.ts`.
- Runtime model visibility does not currently depend on BYOP state.

### Auditor

- `scripts/audit/check-pollinations.sh` now reports text/image drift through `scripts/audit/pollinations-drift-report.js`.
- The current auditor does not yet classify image/video drift by local readiness, enhancement prompt coverage, or commit-fähig status.

## Desired Behavior

### Text behavior

- Without BYOP key:
  - keep the current curated text model visibility
  - continue using the fallback server key behavior exactly as today
- With BYOP key:
  - show all current upstream text models from `gen.pollinations.ai/v1/models`
  - exclude `openai-audio` and `midijourney`
  - prefer local metadata when a model is already known locally
  - provide safe fallback labels/descriptions for newly surfaced upstream models

### Image and video behavior

- Without BYOP key:
  - keep the current publicly visible image/video model set
- With BYOP key:
  - additionally show all image/video models that already exist locally in the repo but are currently hidden
  - do not surface newly discovered upstream-only image/video models automatically
- Keep newly discovered upstream image/video model enablement explicit and commit-driven.
- Auditor must report:
  - current upstream image/video models
  - local drift
  - whether a new model is blocked because local config is incomplete
  - whether a new model is commit-ready because the necessary local pieces already exist
- Missing enhancement prompt coverage must be called out explicitly because that is the main developer gate.

## Recommended Architecture

### 1. Introduce a dedicated text catalog resolver

Create a small Pollinations text catalog module that combines:

- local curated text model metadata
- local default visibility policy
- optional upstream model snapshot when BYOP is connected
- a small denylist for upstream models that must never be surfaced (`openai-audio`, `midijourney`)

This resolver should expose:

- curated visible models for the fallback-key path
- expanded BYOP-visible models for the connected-user path
- helper functions that preserve safe fallback/default behavior if a stored selection is no longer valid

### 2. Keep image/video governance local-first with explicit visibility tiers

Do not route image/video visibility through live upstream data in the UI.

Instead, define local image/video visibility using explicit local policy tiers:

- publicly visible
- BYOP-visible
- hidden/internal-only

This should not be inferred from `enabled: false` alone, because the current hidden set mixes paid models, deprecated models, and internal fallbacks.

Then define local readiness for newly discovered upstream models as the combination of:

- a local registry entry or alias strategy in `src/config/unified-image-models.ts`
- a local UI/input config in `src/config/unified-model-configs.ts`
- enhancement prompt coverage in `src/config/enhancement-prompts.ts` or the enhancement alias map

The auditor can then classify new upstream image/video models as:

- `missing-local-entry`
- `missing-model-config`
- `missing-enhancement-prompt`
- `commit-ready`

### 3. Expand the auditor from drift-only to drift-plus-readiness

Extend `scripts/audit/pollinations-drift-report.js` so it can:

- normalize current upstream text and image/video models
- compare against local text/image/video registries
- evaluate enhancement prompt readiness
- emit richer shell variables for Telegram/report output

This keeps:

- runtime BYOP visibility for already known local models
- developer audit/readiness for newly discovered upstream models

cleanly separated.

## Why This Approach

### Normal explanation

Text models are lightweight to surface dynamically because they already flow through a single text proxy path and mostly need labels plus selection safety. Image/video models are heavier because each one depends on local UI config, upload behavior, enhancement prompt guidance, alias handling, and developer curation. The right split is:

- text: expand dynamically for BYOP users
- image/video: expand only across locally known models for BYOP users
- newly discovered upstream image/video models: stay audit-only until a developer commits them

### Simple explanation

Text can become live with BYOP. Image/video can unlock only from what is already in the repo. Brand-new upstream image/video models stay manual. The auditor becomes the gatekeeper that tells you what is new and what is already safe to commit.

## Files Likely In Scope

### Runtime text visibility

- `src/config/chat-options.ts`
- `src/components/sidebar/PersonalizationSidebarSection.tsx`
- `src/components/ChatProvider.tsx`
- `src/lib/chat/chat-capability-resolution.ts`
- `src/hooks/usePollenKey.ts`
- new helper such as `src/lib/pollinations/pollinations-text-catalog.ts`

### Runtime image/video BYOP visibility

- `src/config/unified-image-models.ts`
- `src/config/unified-model-configs.ts`
- `src/hooks/useUnifiedImageToolState.ts`
- `src/components/sidebar/PersonalizationSidebarSection.tsx`

### Image/video readiness and audit

- `src/config/unified-image-models.ts`
- `src/config/unified-model-configs.ts`
- `src/config/enhancement-prompts.ts`
- `src/app/api/enhance-prompt/route.ts`
- `scripts/audit/pollinations-drift-report.js`
- `scripts/audit/check-pollinations.sh`
- `scripts/audit/audit.sh`

### Tests

- `src/config/__tests__/model-invariants.test.ts`
- new tests for the text catalog resolver
- new tests for auditor readiness classification

## Risks And Mitigations

### Risk: stale localStorage selections

Mitigation:

- keep text model normalization centralized
- preserve fallback to `DEFAULT_POLLINATIONS_MODEL_ID` when a stored id is no longer valid

### Risk: smart-router accidentally targeting a model only visible in BYOP mode

Mitigation:

- keep router candidate lists explicitly local and curated
- do not derive smart-router candidates from the dynamic BYOP-expanded list

### Risk: image/video auto-exposure by accident

Mitigation:

- replace ambiguous hidden/public logic with an explicit local visibility policy
- keep newly discovered upstream image/video models out of runtime visibility entirely
- auditor output for new upstream models remains advisory, not activation logic

### Risk: deprecated or internal fallback image/video models become visible with BYOP

Mitigation:

- do not treat every current `enabled: false` model as BYOP-visible
- add explicit classification for internal fallback or deprecated models
- gate BYOP runtime visibility through dedicated local metadata instead of historic booleans

### Risk: false-positive commit-ready signals

Mitigation:

- require all of: local registry path, local UI config, and enhancement prompt coverage
- show exact missing prerequisites in the audit output

## Reality Check

This design avoids spaghetti because it separates:

- runtime text catalog resolution
- runtime image/video BYOP visibility over locally known models
- developer audit/readiness classification

It also preserves the current fallback-key behavior, unlocks already known local paid models for BYOP users, and still avoids forcing brand-new upstream image/video features live just because upstream changed.
