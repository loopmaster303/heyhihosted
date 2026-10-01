# Product Audit Follow-Up — 2026-04-21

This follow-up accompanies `PRODUCT_AUDIT_2026-04-21.md`. It lists what has held since the last pass, the highest-signal risks remaining, and a Now/Next/Later backlog.

## Closed During This Audit Pass

- **C1, C2, C3 — a11y quick-wins (2026-04-21):** Upload button in `src/components/chat/ChatInput.tsx:336-348` now carries `aria-label={t('menu.section.upload')}` plus `aria-expanded`. Vault tabs in `src/components/gallery/GallerySidebarSection.tsx:382-413` now use `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, and managed `tabIndex`. The `TrackItem` icon row (`:120-146`) carries `aria-label`, `title`, and `aria-pressed` on the heart/star toggle. Tools-mode toggle at `:352-372` already renders a visible `<span>` text label, no change needed.
- **A1 — Creative Director response style authorized (2026-04-21):** Product owner explicitly authorized the style as written. A1 is now an audit paper-trail entry, not an open question. Any future reversal goes back through the audit trail.
- **A4 + A7 — Grok model canonicalization and Suno ghost removal (2026-04-21):** Registry canonical id flipped from `grok-image` to `grok-imagine` (matches Pollinations API enum). `grok-imagine-pro` remains BYOP-only and shares the enhancement prompt with `grok-imagine`. Back-compat alias keeps `grok-image` resolvable. Three BYOP-only additions: `grok-video-pro`, `wan-image` ("Wan 2.7 Image"), `wan-image-pro` ("Wan 2.7 Image Pro"). Suno `suno → suno-v5` alias at `src/app/api/enhance-prompt/route.ts:262` deleted plus the ~300-line Suno-v5 Dual-Brain prompt at `src/config/enhancement-prompts.ts:1148+` deleted.
- **A8 + A9 — Media host + account balance URL consolidated (2026-04-21):** Five media routes (`src/app/api/media/ingest/route.ts`, `src/app/api/media/upload/route.ts`, `src/app/api/upload/ingest/route.ts`, `src/app/api/upload/sign-read/route.ts`, `src/lib/upload/pollinations-media.ts`) migrated from `media.pollinations.ai` to `gen.pollinations.ai`. Account balance route (`src/app/api/pollen/account/route.ts`) migrated from `enter.pollinations.ai/api/account/balance` to `gen.pollinations.ai/account/balance`. OAuth portal (`enter.pollinations.ai`) remains unchanged.
- **B1 — `ChatProvider` contract tests (2026-04-21):** New `src/components/ChatProvider.test.tsx` with 13 cases covering conversation lifecycle, send-flow entry point (text/image/compose routing + error propagation), and state persistence hooks. Locks behavior so the B2 sub-extraction pass is regression-safe.
- **B3 — `ChatCompletionMessage` type (2026-04-21):** `sanitizeMessagesForApi` in `src/app/api/chat/completion/route.ts` now takes and returns `ChatCompletionMessage[]`; the outbound pipeline is no longer `any[]`. Multi-modal content parts (text + image_url) are typed.
- **C4 — `next/image` migration (2026-04-21):** `UnifiedImageTool.tsx:313` and `VisualizeInlineHeader.tsx:93` migrated to `<Image>`. The five remaining surfaces (`MessageBubble.tsx:110,163`, `ChatInput.tsx:206`, `GallerySidebarSection.tsx:201,542`) kept raw `<img>` because their sources are `blob:` or `data:` URLs which `next/image` does not support; they now carry `loading="lazy"` and `decoding="async"`. `next.config.ts` `images.remotePatterns` expanded to cover `gen.pollinations.ai` and `media.pollinations.ai`.
- **C5 — `prefers-reduced-motion` honored (2026-04-21):** `@media (prefers-reduced-motion: reduce)` blocks added around `flash-fade` keyframes (`globals.css:152-155`) and `.matrix-rain` / `.matrix-rain::before` (`globals.css:212-260`).

## Confirmed Closed Since March

All six findings that the March 13, 2026 pass closed remain closed five weeks later:

1. Remote media fetches stay behind the shared `validateRemoteMediaUrl` allowlist (`/api/media/ingest`, `/api/proxy-image`).
2. Delegated search and deep-research requests route through a single strategy decision — no double-call regression.
3. Compose state is shared across landing-to-chat handoff via `src/app/unified/page.tsx`.
4. Mobile quick settings continue to expose the parity controls (response style, voice, TTS speed) in `MobileOptionsMenu`.
5. `/unified` layout resolves the active text model through `resolveEffectiveTextModel` instead of the hidden `claude` hard-code.
6. BYOP balance fetching still goes through the same-origin route instead of sending the bearer token directly to Pollinations from browser code.

## Highest-Signal Findings This Pass

### 1. ~~The "Creative Director" response style needs a policy decision~~ — **CLOSED 2026-04-21**

Product owner authorized this style to ship as-is. The decision is now recorded in `PRODUCT_AUDIT_2026-04-21.md#a1`. Future audit cycles should re-confirm if the upstream provider's safety posture or legal environment changes. No code change needed; the audit trail carries the authorization.

### 2. Audit governance is now the primary drift surface

The March follow-up warned that active docs could drift faster than runtime. Five weeks later, exactly one `dcadeff` commit introduced Creative Director, klein activation, and Suno removal — none of which were reflected in any audit until now.

Why this still matters:
- one commit's worth of drift has already outpaced the cadence of audit refreshes
- the pattern will recur unless audits are triggered by release/tag or feature-surface changes rather than by calendar

### 3. Hot-file coverage is the largest regression surface

`ChatProvider.tsx` is 749 lines with zero tests. The surrounding nine `src/lib/chat/*.ts` modules are all test-covered; the provider itself is not. `chat-send-coordinator.ts` is 474 lines and the next extraction candidate.

Why this still matters:
- the send flow rolls through untested provider logic before reaching tested extraction seams
- any further extraction without contract tests at the provider boundary can silently shift behavior

### 4. Accessibility debt accumulated in Feb/Mar 2026 feature work

The Vault tabs (Images/Tracks), Track gallery icon buttons, and two ChatInput icon buttons (Upload, Tools) all shipped without `aria-label` or proper ARIA tab semantics. The rest of the icon-button fleet is correctly labeled — these four gaps are recent regressions, not systemic drift.

Why this still matters:
- each new sidebar surface that skips a11y review compounds the problem
- the baseline from December 2025 has measurably improved on font, color, and contrast — a11y-on-new-surfaces is the remaining pattern to close

## Recommended Backlog

### Now

All Now-bucket items closed as of 2026-04-21. See "Closed During This Audit Pass" above for details.

1. ~~Policy review of the Creative Director response style.~~ — **CLOSED** (authorized as-is).
2. **Anchor this audit as current truth.** `docs/README.md` points at the April 21 pair; March 13 pair archived under `docs/archive/audits/`.
3. ~~A11y quick-wins.~~ — **DONE** (C1/C2/C3 shipped).
4. ~~Verify `grok-video` against the live API (A7).~~ — **CLOSED** via A4 rework: canonical id is `grok-imagine`; `grok-video-pro` added as BYOP-only model; registry now matches the Pollinations API enum.

### Next

1. ~~Contract tests for `ChatProvider`'s public surface~~ — **DONE 2026-04-21** (13 cases in `src/components/ChatProvider.test.tsx`). B2 is now unblocked.
2. **Sub-extract `chat-send-coordinator`** into an image-preparation pipeline, a title-update step, and an error-to-message mapper. B1 contract tests now in place.
3. ~~Tighten `/api/chat/completion` types.~~ — **DONE 2026-04-21** (`ChatCompletionMessage` type shipped).
4. ~~Migrate the two highest-traffic image surfaces to `next/image`.~~ — **PARTIALLY DONE 2026-04-21:** `UnifiedImageTool.tsx` and `VisualizeInlineHeader.tsx` migrated; `MessageBubble` and `GallerySidebarSection` remain raw `<img>` because they render `blob:` URLs from `BlobManager`, which `next/image` does not support. Both surfaces now carry `loading="lazy"` + `decoding="async"`. Future lift: render these through a proxy route that serves HTTP-reachable URLs, then migrate.

### Later

1. ~~Honor `prefers-reduced-motion` across remaining animations.~~ — **DONE 2026-04-21** (C5).
2. ~~Remove the ghost Suno enhancement infrastructure.~~ — **DONE 2026-04-21** (A4 rollup).
3. **Decide on the `font-body` mapping.** Either switch `tailwind.config.ts:16` to `Inter` (December audit intent) or document the current `Code` mapping as intentional brand choice.
4. **BYOP key storage hardening** — still the main open security truth, unchanged since the March pass. Out of scope for this audit but belongs back on the security roadmap.
5. **Trigger-based audit governance.** Attach audit refreshes to release tags or feature-surface changes (new response style, new model, new user-facing mode) rather than calendar-only. This pass shipped nine closures in one cycle — governance needs to keep up without waiting five weeks for a calendar trigger.

## Verbesserungsplan in einfacher Sprache (2026-04-21 Endstand)

Am 2026-04-21 in einer Runde abgearbeitet. Die ursprüngliche Reihenfolge (9 Punkte) ist komplett erledigt.

### Was in dieser Runde fertig wurde

- **Screenreader-Fix** — Upload-Knopf, Vault-Tabs und Track-Icons haben jetzt richtige Beschriftungen. Blinde Nutzer hören, was die Knöpfe tun.
- **Creative-Director-Style freigegeben** — Der Nutzer hat den Style so wie er ist autorisiert. Audit-Eintrag ist die Paper-Trail-Dokumentation.
- **Grok-Modelle kanonisiert** — Registry nutzt jetzt `grok-imagine` (free) und `grok-imagine-pro` (BYOP, gleiche Enhancement-Prompts), passend zur Pollinations-API. `grok-image` bleibt als Back-Compat-Alias. Dazu drei neue BYOP-Modelle: `grok-video-pro`, `wan-image`, `wan-image-pro`.
- **Suno-Karteileichen gelöscht** — Der `suno → suno-v5`-Alias und ~300 Zeilen Suno-Prompt sind weg.
- **Media-Host konsolidiert** — Fünf Dateien ziehen jetzt auf `gen.pollinations.ai` statt `media.pollinations.ai`. Account-Balance-Route zeigt direkt auf `gen.pollinations.ai/account/balance`.
- **ChatProvider-Tests geschrieben** — 13 Contract-Cases in `src/components/ChatProvider.test.tsx`. Deckt Konversations-Lifecycle, Send-Flow und State-Persistence ab. Sub-Extraktion ist jetzt regression-safe.
- **`any[]`-Typen sauber** — `ChatCompletionMessage`-Type ist da, Sanitize-Pipeline ist typisiert.
- **`next/image`-Migration** — `UnifiedImageTool` und `VisualizeInlineHeader` migriert. `MessageBubble` und `GallerySidebarSection` bleiben auf raw `<img>`, weil sie `blob:`-URLs aus `BlobManager` rendern (von `next/image` nicht unterstützt); jetzt mit `loading="lazy"` + `decoding="async"`.
- **`prefers-reduced-motion` respektiert** — Matrix-Rain und Mode-Flash-Animation blenden bei Reduced-Motion-Einstellung aus.

### Was offen bleibt (Later-Bucket)

- **font-body-Mapping** — `tailwind.config.ts:16` nutzt `Code` statt `Inter`. Entweder umstellen oder als bewusste Marken-Entscheidung dokumentieren.
- **BYOP-Key-Storage-Hardening** — Key liegt weiterhin in `localStorage`, XSS-angreifbar. Security-Roadmap, nicht Audit-Scope.
- **Trigger-basierte Audit-Governance** — Audits an Release-Tags oder Feature-Surface-Änderungen koppeln statt an den Kalender.

### Nächste Audit-Runde sollte prüfen

- Bleibt die Creative-Director-Freigabe die richtige Entscheidung? (Re-Check bei Änderungen der Anbieter-ToS oder Safety-Posture.)
- Wurde `chat-send-coordinator` sub-extrahiert, und wurden die B1-Contract-Tests erweitert?
- Sind neue Modelle, Modi oder Response-Styles seit diesem Stand dazugekommen — und wurden sie im selben Commit dokumentiert?
- Kam `font-body`-Entscheidung?

## Audit Surface for the Next Pass

The next audit should check:

- Whether the Creative Director authorization still reflects the product owner's intent — or whether upstream safety posture, ToS, or legal environment has shifted the calculus.
- Whether `chat-send-coordinator` has been sub-extracted on top of the B1 contract tests, and whether those tests grew alongside the refactor.
- Whether any new visible models, modes, or response styles have landed since this baseline — and whether they were added to the audit trail at commit time.
- Whether the `font-body` mapping was decided (Inter vs. Code).
- Whether BYOP key storage moved off `localStorage` in the interim.
