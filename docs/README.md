# Docs Map

This directory keeps only active product and runtime documentation at the top level.

## Naming

Active documents live **flat in `docs/`** with a clear prefix:

| Prefix | Meaning |
|---|---|
| `FAHRPLAN-*` | the active multi-phase plan |
| `PLAN-phase-N-*` | implementation plan for one phase |
| `HANDOFF-<date>-*` | what one session did and left behind |
| `PROMPTS-*` | ready-to-copy session starters |

`docs/plans/`, `docs/handoffs/` and `docs/superpowers/` hold **older material only**. Do not
add new documents there.

## Start Here

- `FAHRPLAN-create.md` — **the active plan.** Ten phases toward the publicly shareable version, with the user's binding decisions on domain, gallery and music.
- `PLAN-audit-patch-2026-08-29.md` — the audit findings from phases 0–3, cut into
  subagent-sized packages. **Executed on 2026-08-29** — see the two handoffs below.
- `PLAN-phase-5-eine-galerie.md` — implementation plan for Phase 5: one asset pool for
  chat and Create, `PLAYGROUND_CONVERSATION_ID` turned from a separator into an origin
  tag, a per-surface origin filter, and deletion that also frees the object URL. Carries
  the reality check that corrects two false Fahrplan claims (`/gallery` never showed
  everything, and it is already deprecated).
- `PLAN-phase-4-5-koordiniert-2026-08-29.md` — **read before touching Phase 4 or 5.**
  Two sessions worked the same working tree in parallel on 2026-08-29; this plan
  inventories what each left behind (Phase 4: the `src/lib/errors/` module, unwired;
  Phase 5: package U1, verified), fixes the true test ledger (869 green, not 852), and
  orders both phases into one session so the shared files (`Gallery.tsx`,
  `PlaygroundShell.tsx`) are never edited concurrently. **Not yet executed.**
- `PLAN-phase-4-fehlerklarheit.md` — implementation plan for Phase 4: every error path
  ends in one German sentence saying what happened and what to do next, plus run
  stability (`maxDuration`, readable elapsed time, reload-surviving video runs). Carries
  live findings from 2026-08-27 that correct its own legacy list, and open operator
  questions R1–R5. **Partially executed** — see the coordination plan above for the
  exact state. Note: four of its paths still read `src/app/playground/…` and must be
  read as `src/app/create/…`.
- `PLAN-phase-6-create-telefon.md` — implementation plan for Phase 6: Create on the phone.
  Corrects the Fahrplan — both drawers already exist; what is missing is the send bar under
  an open keyboard (`--vvh` instead of `dvh`), touch targets, the two-column gallery, and
  the cancel notice that today only lives in a `title`. Carries the four patterns Phase 8
  inherits, plus an operator checklist for L-E.1 (needs two real devices). **Executed
  2026-08-29** — code complete (`5e3bdf1`, `cbf3011`); the L-E.1 device checklist and the
  L-E.2 browser measurement are **operator tasks** (browser tests are run by the
  operator, not by an agent).
- `PLAN-phase-7-chat-entschlanken.md` — implementation plan for Phase 7: reduce the chat's
  image selection to the key-free rule, move video and Pruna into Create, label the way
  there. Carries operator decisions E7-1 to E7-4. **Executed 2026-08-29.**
- `LAUNCH_CRITERIA.md` — **the release gate.** What must work before the address may be shared publicly; per-criterion status, operator decisions recorded 2026-08-28.
- `HANDOFF-2026-08-28-phase-0.md` — **start here.** What Phase 0 delivered (99 files into
  sixteen commits, `f880389..aa3eac4`), how it was done, the per-phase findings it
  surfaced, and what it left open.
- `HANDOFF-2026-08-28-phase-1.md` — what Phase 1 delivered: `LAUNCH_CRITERIA.md` as the
  release gate (29 gate criteria, one conditional criterion, accepted risks, non-goals),
  built on the operator decisions of 2026-08-28.
- `HANDOFF-2026-08-28-phase-2.md` — what Phase 2 delivered: product name **Create**,
  the `create.hey-hi.cloud` redirect (Variante B), the chat back-link, and the open
  Dashboard steps V1–V3.
- `HANDOFF-2026-08-28-phase-3.md` — what Phase 3 delivered: model truth verified against
  the live registry (with the key-scoped registry finding), the registry check script +
  snapshot + weekly Action, corrected defaults, and the dead model ids removed.
- `HANDOFF-2026-08-29-audit-patch.md` — what the audit patch delivered: the working tree
  sorted into five thematic commits, ten worker packages (subagent-driven, GLM-5.3-Flash
  workers), and the three operator decisions E1–E3 written into the gate document.
- `HANDOFF-2026-08-29-audit-review.md` — the independent re-check of that patch: every
  number reproduced, plus three gaps *between* the packages found and fixed. Carries the
  lesson for the next multi-package plan.
- `HANDOFF-2026-08-27-fahrplan.md` — orientation for anyone picking up a phase: working-tree breakdown by origin (**historical** — the tree is committed, and that breakdown was missing five groups; see the Phase 0 handoff), per-phase entry points and pitfalls, and what was deliberately left unchecked.
- `HANDOFF-2026-08-26-pruna-video.md` — last session that touched code: Pruna payload fixes, the 202 client-polling protocol, VACE switched off.
- `PROMPTS-phasen.md` — one self-contained session starter per phase (0–9), for writing the implementation plans.

> Model lists are verified against the live registry via `scripts/check-model-registry.mjs`
> (snapshot + tests + weekly Action, 2026-08-28). Registry findings never silently rewrite
> the config — see `CLAUDE.md`, section "Modellwahrheit prüfen".
> Check the live registry for model questions. Reconciling is Phase 3 of the active plan.

## Current Truth

- `PRODUCT_AUDIT_2026-04-21.md` — current product/runtime audit baseline (covers product drift, tech debt, UX/a11y)
- `PRODUCT_AUDIT_FOLLOWUP_2026-04-21.md` — current follow-up with Now/Next/Later backlog
- `superpowers/handoffs/2026-08-12-playground-merge-main-handoff.md` — Playground merge into main (completed)
- `superpowers/plans/2026-08-12-merge-playground-into-main.md` — Playground merge plan (completed)
- `PRODUCT_IDENTITY.md` — product language and identity
- `architecture-view.md` — architecture and data-flow overview
- `COMPONENT_STATE_BEHAVIOR.md` — current state and tool behavior
- `streaming-status.md` — chat transport reality

## Focused Technical Docs

- `asset-fallback-service.md`
- `blob-manager.md`
- `codexgallery.md`
- `UX_AUDIT_AND_ROADMAP.md`
- `COMPONENT_STATE_BEHAVIOR.md` — app state, routes, tool behavior (includes Create since 2026-08-12)

## Archive

Historical audits, completed phase summaries, and implementation plans live under:

- `docs/archive/audits/`
- `docs/archive/history/`
- `docs/archive/plans/`
- `docs/plans/`, `docs/handoffs/`, `docs/superpowers/` — older plans, handoffs and specs; kept for reference, not extended
