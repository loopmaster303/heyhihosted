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
- `LAUNCH_CRITERIA.md` — **the release gate.** What must work before the address may be shared publicly; per-criterion status, operator decisions recorded 2026-08-28.
- `HANDOFF-2026-08-28-phase-0.md` — **start here.** What Phase 0 delivered (99 files into
  sixteen commits, `f880389..aa3eac4`), how it was done, the per-phase findings it
  surfaced, and what it left open.
- `HANDOFF-2026-08-28-phase-2.md` — what Phase 2 delivered: product name **Create**,
  the `create.hey-hi.cloud` redirect (Variante B), the chat back-link, and the open
  Dashboard steps V1–V3.
- `HANDOFF-2026-08-27-fahrplan.md` — orientation for anyone picking up a phase: working-tree breakdown by origin (**historical** — the tree is committed, and that breakdown was missing five groups; see the Phase 0 handoff), per-phase entry points and pitfalls, and what was deliberately left unchecked.
- `HANDOFF-2026-08-26-pruna-video.md` — last session that touched code: Pruna payload fixes, the 202 client-polling protocol, VACE switched off.
- `PROMPTS-phasen.md` — one self-contained session starter per phase (0–9), for writing the implementation plans.

> **⚠ Model lists across the repo have drifted** from the live Pollinations registry
> (checked 2026-08-27). `acestep` is gone and all music models are key-gated; several
> image models marked free are not. `CLAUDE.md` and `README.md` carry the details.
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
