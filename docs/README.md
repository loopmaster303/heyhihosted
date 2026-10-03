# Docs Map

This directory keeps only active product and runtime documentation, flat in `docs/`.

## Naming

| Prefix | Meaning |
|---|---|
| `FAHRPLAN-*` | the active multi-phase plan |
| `PLAN-*` | implementation plan for one phase or feature |
| `HANDOFF-<date>-*` | what one session did and left behind |

Do not create subfolders for plans or handoffs. When a plan is executed and its handoff is
written, the plan can go; git history keeps it.

## Start Here

- `FAHRPLAN-create.md` — **the active plan.** Ten phases toward the publicly shareable version,
  with the user's binding decisions on domain, gallery and music.
- `LAUNCH_CRITERIA.md` — **the release gate** and the status of record.
- `PLAN-sound-modellwahl-2026-09-03.md` — **next up.** Sound's five models under one additive
  rule, per-model parameters, and the two-stage mode switch. Carries the verified blocker: the
  30 s proxy timeout that makes the Pollinations models unfinishable.
- `PLAN-phase-8-bis-ende-2026-08-29.md` — the remaining phases 8–9.
- `PLAN-compose-musik-2026-08-29.md` — the music/Sound plan the Sound work builds on.
- `PLAN-phase-6-create-telefon.md` — executed in code; kept because it holds the operator
  checklist for L-E.1 / L-E.2 (real devices), which `LAUNCH_CRITERIA.md` links.

### Audit und Pläne vom 2026-09-10/11

Teilweise umgesetzt (a11y, Fehlervertrag, Ressourcen-Store, Modellfreigabe sind auf `main`);
was offen ist, steht im jeweiligen Plan.

- `DEEP_AUDIT_2026-09-10.md` — read-only Audit, Grundlage der Pläne A–D.
- `PLAN-uebersicht-p1-p3-2026-09-10.md` — Reihenfolge und Register der Pläne A–D.
- `PLAN-lauf-und-artefakt-2026-09-10.md` (A), `PLAN-bedienbarkeit-2026-09-10.md` (B),
  `PLAN-maschinenvertrag-2026-09-10.md` (C), `PLAN-fundament-2026-09-10.md` (D).
- `PLAN-modellkuration-2026-09-10.md`, `PLAN-llm-kuration-2026-09-11.md` — Bild- und Textmodell-Kuration.
- `POLLINATIONS-API-2026-09-10.md` — **Referenz:** die gemessene Pollinations-API.

## Handoffs

- `HANDOFF-2026-10-03-ausmisten.md` — **neuester.** Das Ausmisten vom 2026-10-03, der Stand aller
  offenen Branches und PRs und was der nächste Agent zuerst tun sollte.
- `HANDOFF-2026-09-03-sound.md` — What the Sound review found, the three fixes that
  shipped, and the operator task that blocks Sound live (Modal env vars on Vercel).
- `HANDOFF-2026-09-01-phase-4-durchlauf.md` — Phase 4 finished: the remaining error sentences,
  key requirement and non-cancellable Pruna run stated before sending.
- `HANDOFF-2026-08-28-phase-3.md` — model truth verified against the live registry, the registry
  check script + snapshot + weekly Action.
- `HANDOFF-2026-08-27-fahrplan.md` — per-phase entry points and pitfalls (its working-tree
  breakdown is historical).

> Model lists are verified against the live registry via `scripts/check-model-registry.mjs`
> (snapshot + tests + weekly Action). Registry findings never silently rewrite the config — see
> `CLAUDE.md`, section "Modellwahrheit prüfen".

## Current Truth

- `PRODUCT_AUDIT_2026-04-21.md` — product/runtime audit baseline (product drift, tech debt, UX/a11y)
- `PRODUCT_AUDIT_FOLLOWUP_2026-04-21.md` — follow-up with Now/Next/Later backlog
- `PRODUCT_IDENTITY.md` — product language and identity
- `architecture-view.md` — architecture and data-flow overview
- `COMPONENT_STATE_BEHAVIOR.md` — app state, routes, tool behavior (includes Create)
- `streaming-status.md` — chat transport reality

## Focused Technical Docs

- `asset-fallback-service.md`
- `blob-manager.md`

## History

Executed phase plans (0–7), their handoffs, older audits and the former `archive/`, `plans/`,
`handoffs/` and `superpowers/` folders were removed in the cleanup of 2026-10-03. They remain in
git history: `git log --diff-filter=D --name-only -- docs/` lists them, and
`git show <commit>^:<path>` restores any single file.
