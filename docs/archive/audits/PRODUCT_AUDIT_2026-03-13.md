# Product Audit — 2026-03-13

## Status

This audit was reinitialized on **March 13, 2026** after a product-truth cleanup pass. The goal is to audit the app from a current, internally consistent baseline instead of continuing from older notes that still assumed outdated model availability or older infrastructure narratives.

## Confirmed Product Baseline

### Visible Modes
- `standard`
- `visualize`
- `compose`
- `research`

Code mode remains an internal response-mode flag, not a dedicated visible tool.

### Visible Compose Model
- `elevenmusic`

### Visible Image/Video Models
- `flux`
- `zimage`
- `gpt-image`
- `imagen-4`
- `grok-image`
- `grok-video`

### Hidden / Disabled Right Now
- `suno`
- `dirtberry`
- `flux-2-dev`
- `klein`
- `klein-large`

These model IDs still exist in configuration and prompt logic where relevant, but they are not part of the visible product baseline while upstream availability is unstable.

## Severity-Ordered Findings

### High

#### 1. Server-side media fetching currently trusts arbitrary remote URLs
`/api/media/ingest` accepts any client-provided `sourceUrl` and repeatedly fetches it server-side until timeout (`src/app/api/media/ingest/route.ts:5-9`, `src/app/api/media/ingest/route.ts:38-48`). `/api/proxy-image` similarly accepts any `url` query parameter and fetches it directly (`src/app/api/proxy-image/route.ts:3-18`).

Why this matters:
- the server becomes a general-purpose fetcher for attacker-controlled URLs
- there is no hostname allowlist, protocol narrowing, or private-network guard
- `ingest` downloads the full body before enforcing the 10 MB limit, so a large response can still consume memory first

Implication:
- this is the sharpest current security risk in the app
- the right fix is to restrict remote fetches to known-safe origins or signed Pollinations/media domains and reject everything else early

Status:
- fixed on March 13, 2026 by introducing a shared remote-media allowlist and early route rejection
- residual risk remains limited to the allowed Pollinations origins rather than arbitrary remote hosts

#### 2. Search and deep-research requests currently do two serial Pollinations calls
`/api/chat/completion` decides to both fetch web context and reroute the final answer to a search model (`src/app/api/chat/completion/route.ts:82-115`, `src/app/api/chat/completion/route.ts:134-145`). `WebContextService` itself already calls Pollinations search/research models to build that context (`src/lib/services/web-context-service.ts:89-118`, `src/lib/services/web-context-service.ts:137-187`).

Why this matters:
- one user request can become two upstream completions
- this increases latency, cost, and failure surface
- the architecture blurs two strategies that should be mutually exclusive: prefetch context or delegate to the live-search model

Implication:
- this is the biggest product-efficiency problem in the current chat stack
- the next iteration should collapse this into a single strategy per request path

Status:
- fixed on March 13, 2026 by routing delegated search and deep-research requests directly without web-context prefetch
- `WebContextService` now remains an optional helper rather than the delegated default path

### Medium

#### 3. BYOP key handling is functional but remains XSS-sensitive by design
The Pollinations key is stored in `localStorage` (`src/hooks/usePollenKey.ts:29-39`, `src/hooks/usePollenKey.ts:72-87`) and then forwarded through `X-Pollen-Key` from the browser (`src/lib/pollen-key.ts:13-21`). Server routes prioritize that header over environment credentials (`src/lib/resolve-pollen-key.ts:7-12`).

Why this matters:
- any successful XSS can read the key
- the same client session also polls account balance directly with the bearer token (`src/hooks/usePollenKey.ts:89-127`)
- this is acceptable for a bring-your-own-key product, but it is not a hardened model

Implication:
- this is not an emergency rewrite, but it should stay in the security backlog until a stronger storage or session design exists

Status:
- partially hardened on March 13, 2026 by centralizing key normalization/validation before server use
- browser account balance fetches now go through a same-origin route instead of sending the bearer token directly to Pollinations from client code
- residual risk remains because the key still lives in web storage and is therefore readable by successful XSS

#### 4. Mobile quick settings still expose less control than desktop
`MobileOptionsMenu` receives props for voice and response-style selection (`src/components/chat/input/MobileOptionsMenu.tsx:31-55`) but only renders `upload` and `mode` sections (`src/components/chat/input/MobileOptionsMenu.tsx:88-101`).

Why this matters:
- mobile users cannot reach the same quick settings that desktop users can
- the component API already suggests feature parity, but the rendered UI does not deliver it
- this is a classic mobile-first drift: the state exists, the compact surface does not

Implication:
- not a correctness bug, but a clear UX inconsistency and discoverability problem

Status:
- fixed on March 13, 2026 by adding a dedicated mobile settings section for response style and voice controls
- residual UX polish may still improve density and labeling, but the parity gap is closed

#### 5. Compose state is duplicated between landing and chat
`LandingView` creates its own `useComposeMusicState()` instance (`src/components/page/LandingView.tsx:36`) and `ChatInterface` creates another separate instance (`src/components/page/ChatInterface.tsx:32`).

Why this matters:
- landing-selected compose options can diverge from the chat session that actually submits the request
- this is subtle because autostart works, but state continuity is not guaranteed
- the current behavior makes the transition feel unified while the state model is still split

Implication:
- medium architectural drift; the compose tool state should either live in `ChatProvider` or be passed through the landing-to-chat handoff explicitly

Status:
- fixed on March 13, 2026 by hoisting compose state to `src/app/unified/page.tsx` and passing the shared state into both landing and chat views
- this keeps the fix local without a wider `ChatProvider` refactor

### Low

#### 6. There is still a stale fallback to hidden `claude`
`AppLayout` receives `conversation.activeConversation?.selectedModelId || 'claude'` in chat state (`src/app/unified/page.tsx:190`), even though `claude` is no longer part of the visible text-model baseline.

Why this matters:
- old conversations or edge paths can still fall back to a hidden model identifier
- this is small, but it is exactly the kind of state/config drift that creates confusing UI defaults later

Implication:
- easy cleanup item once the higher-priority security and routing issues are handled

Status:
- fixed on March 13, 2026 by resolving the layout model through the visible text-model fallback logic instead of hard-coding `claude`

## Earlier Baseline Findings Still Hold

### 1. Availability drift can break product truth quickly
The app was able to expose models that were currently reported as offline by Pollinations monitoring. This produced user-facing API errors even though the local UI looked valid.

Implication:
- model visibility must stay centralized and conservative until a stronger availability-sync strategy exists

Status:
- manually hardened on March 13, 2026 by introducing an explicit visible text-model policy in config
- text-model selectors, personalization surfaces, and fallback resolution now read the same conservative visible-model truth
- visibility remains intentionally manual; there is still no live monitor or runtime sync layer

### 2. Active docs were drifting behind real runtime behavior
Multiple active docs were still advertising:
- Suno in Compose mode
- older third-party provider narratives that no longer matched runtime reality
- older signed-upload / signed-read narratives
- older chat transport assumptions

Implication:
- contributor-facing docs were at risk of steering future work in the wrong direction

### 3. Dynamic availability should not be baked too hard into marketing copy
The more a document lists specific model names as if they were permanent, the faster it drifts when Pollinations availability changes.

Implication:
- user-facing docs should prefer current visible capabilities plus short notes about upstream availability, rather than overpromising unstable model inventories

## Audit Streams Now Open

### A. Architecture & State
- `ChatProvider`
- `useChatState`
- `useUnifiedImageToolState`
- `useComposeMusicState`
- gallery persistence and asset resolution

### B. API & Routing
- `/api/chat/completion`
- `/api/generate`
- `/api/compose`
- `/api/enhance-prompt`
- `/api/media/upload`
- `/api/media/ingest`
- smart router + web context service

### C. UI/UX & Mobile First
- landing low-height behavior
- mode switching clarity
- visualize selector density
- compose discoverability and failure handling
- gallery/media ergonomics on narrow and short screens

### D. Security
- local key storage
- header forwarding
- remote asset trust model
- upload and proxy surfaces
- media URL lifetime and fallback handling

### E. Documentation Governance
- active docs vs. actual code
- drift guard coverage
- separating historical docs from current truth docs

## Immediate Priorities

1. Keep active docs aligned with current product truth.
2. Reduce duplicated truth between runtime docs and contributor docs.
3. Run the next audit pass from this baseline, not from the older mixed-state notes.

## Next Deliverables

1. Severity-ordered engineering audit findings
2. UX/mobile-first audit findings
3. Security review findings
4. Short implementation backlog split into:
   - now
   - next
   - later

## Recommended Backlog

### Now
1. Revisit BYOP key storage hardening.
2. Reduce contributor-doc duplication so active architecture truths live in fewer places.
3. Run a fresh UX/mobile-first pass now that search, compose-state, BYOP, and availability governance have been stabilized.

### Next
1. Consider a lightweight model availability manifest instead of hand-maintained visibility only, if manual governance becomes too error-prone.
2. Tighten the allowed remote-media origins further if Pollinations hosting patterns stabilize.
3. Reassess whether `WebContextService` still needs to exist once delegated live-search behavior has fully settled.

### Later
1. Explore whether compose-state ownership should eventually move into a shared provider instead of the page layer.
2. Review mobile input density and wording after parity fixes have settled.
3. Re-run the full audit after the next UX/mobile and documentation passes.
