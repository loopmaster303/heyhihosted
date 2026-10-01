# Handoff — Tasks 4–13 of the Multimedia Playground

You are taking over subagent orchestration for one plan. Everything you need
is in the worktree; this file is just the pointer + the gotchas the previous
orchestrator paid for.

## Where to work

- **Worktree:** `/Users/johnmeckel/heyhihosted-playground`
- **Branch:** `playground/multimedia` (parallel to `main`; do not touch `main`)
- **Do NOT touch:** `/Users/johnmeckel/heyhihosted` — separate worktree with unrelated WIP

## Source of truth

- **Plan:** `docs/superpowers/plans/2026-08-07-multimedia-playground.md`
- **Spec:** `docs/superpowers/specs/2026-08-07-multimedia-playground-design.md`
- **Ledger:** `.superpowers/sdd/2026-08-07-multimedia-playground/progress.md`
- **SDD scripts:** `~/.claude/plugins/cache/claude-plugins-official/superpowers/6.2.0/skills/subagent-driven-development/scripts/`

## What's already done

Tasks 1–3 shipped and reviewed clean. Ledger has commit ranges. Two plan
patches landed mid-flight (see commits `bcef738`, `b01f8ce`) — the plan file
you read is the current truth.

Current HEAD when this handoff was written: `7efac28`.

## Your scope

Tasks 4 through 13 of the plan, in order. Each task's brief comes from
`scripts/task-brief PLAN N` — do not paste the full plan into any dispatch.

## Conventions locked in from earlier tasks

- **CSS Modules only.** `import styles from '../../app/playground/playground.module.css'` and reference as `styles.className`. Plain string classNames silently break in Turbopack. New classes get added to the same shared module file.
- **Token mapping.** Never write iris hex values. Map to real hey.hi tokens in `src/app/globals.css`:
  - `--bg`→`hsl(var(--background))`, `--surface`→`hsl(var(--surface-container))`, `--surface-2`→`hsl(var(--surface-container-high))`
  - `--accent`→`hsl(var(--accent))`, `--accent-strong`→`hsl(var(--primary))`, `--accent-ink`→`hsl(var(--primary-foreground))`
  - `--accent-glow`→`hsl(var(--primary) / 0.22)`, `--accent-glow-soft`→`hsl(var(--primary) / 0.10)`
  - `--text`→`hsl(var(--foreground))`, `--text-mute`→`hsl(var(--muted-foreground))`, `--text-dim`→`hsl(var(--muted-foreground) / 0.6)`
  - `--border`, `--hairline-strong`→`hsl(var(--border))`; `--border-soft`, `--hairline`→`hsl(var(--border) / 0.5)`
  - `--glass`→`hsl(var(--glass-background) / 0.55)`, `--glass-strong`→`hsl(var(--glass-background) / 0.72)`
  - `--radius-xs/md/lg`→`var(--radius)` (all three); `--radius-pill`→`9999px`
  - Drop the aurora ambient background entirely.
- **Commit convention.** Prefix `feat(playground):` or `docs(playground):`. Trailer `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.
- **Model selection.** Sonnet-5 for implementers AND task reviewers. Explicit `model: "sonnet"` on every dispatch — omitting inherits the controller's model.
- **`resetForModel` contract** (locked by user ruling B, see commit `b01f8ce`): it is a MERGE. Fields the caller passes overwrite; fields the caller omits are preserved. Task 20 will pass `uploads: state.uploads.slice(0, maxImages)` explicitly to truncate — this is intended.

## Pre-flight checks — do these BEFORE dispatching, to avoid mid-batch stalls

Three plan lines assume APIs whose actual shape the plan didn't verify. Run these once, adjust the affected brief before dispatch:

1. **Task 4** — verify `src/hooks/usePollenKey.ts` return shape. Brief assumes `{ pollenKey, setPollenKey, account, refresh, isValidating }`. If it differs, either the mock in the test needs to match reality, or the component needs updating. Grep the hook, adjust the brief text if needed.
2. **Task 12** — `/api/media/upload` and `/api/pruna/upload` exist and return `{ url: string }`. Confirm response shape (grep the route files). If they return something else, patch the brief.
3. **Task 13** — `getAspectRatioPresetsForModel(modelId)` return shape. Brief guesses `p.aspectRatio ?? p.id ?? p.label`. Read `src/config/image-aspect-ratio-presets.ts` and lock the actual property names into the brief before dispatch.

## Blockers to escalate to the user (do not silently patch)

- Any plan-vs-code contradiction that changes the observable behavior of a shipped API (like the `resetForModel` case in Task 2).
- Any missing dependency (module, endpoint, hook) that the plan assumes exists.
- Any Dexie schema change — the plan explicitly forbids new migrations.

Everything else — CSS class renaming, mid-task token-mapping corrections, TDD-loop iterations — is inside your loop. Do not stop the batch for it; document it in the task report and keep going.

## Loop shape (per task)

For each task N in 4..13:

1. `scripts/task-brief PLAN_FILE N` → get brief path.
2. Record `BASE=$(git rev-parse HEAD)`.
3. Dispatch Sonnet-5 implementer with a lean prompt: working dir, brief path, the 3-5 relevant conventions above, ONE-LINE global constraints, report file path, report contract. **Do not paste the plan** — the brief is the requirements.
4. On DONE: `scripts/review-package PLAN_FILE BASE HEAD` → dispatch Sonnet-5 task reviewer with brief path, report path, package path, and only the constraints binding this task.
5. On PASS: append `Task N: complete (commits BASE7..HEAD7, review clean)` to the ledger. Move to N+1.
6. On findings (Important/Critical): resume implementer with the findings verbatim. Same report file. Scoped re-review after fix. Max 5 rounds — then adjudicate per SDD skill.
7. On plan contradiction: STOP, escalate to user with plan text vs. finding.

## When Tasks 4–13 are all clean

Report back to the user with:
- Commit range (`7efac28..NEW_HEAD`)
- Any parked findings from the ledger
- Any plan patches you landed (docs commits) with one-line rationale each
- Which pre-flight checks you had to fix in the plan before dispatch

Do not run Task 14 yet — the user chose the 4–13 batch and will re-scope after.

## What NOT to hand yourself

- Never fix a worker's mistake inline in the controller session. Fresh worker with a context-less, targeted prompt — never a "the previous agent did X wrong" patch prompt.
- Never dispatch multiple implementers in parallel (git conflicts on the same worktree).
- Never omit `model: "sonnet"` on any dispatch — inheritance defaults to the controller's model.
- Never crawl the full codebase from the controller — that's what workers are for.
