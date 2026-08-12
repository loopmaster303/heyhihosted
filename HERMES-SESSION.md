# Hermes Session Context — heyhihosted (Playground)

Stand: 2026-08-09. Dieses File ist der **Session-Kontext für Hermes/Meck**, wenn
im heyhihosted-Repo gearbeitet wird. Es ersetzt den Memory-Eintrag (der war
nur ein Platzhalter — die Details gehören ins Repo).

## Repo-Layout (Worktrees)

- Haupt-Repo: `~/heyhihosted` (Branch `main`) — **NICHT anfassen bis Final-Merge**
- Playground-Worktree: `~/heyhihosted-playground` (Branch `playground/multimedia`)
- Zweiter Playground-Worktree: `~/heyhihosted-playground-b`

Regel: Arbeit läuft ausschließlich in den Playground-Worktrees. Der `main`-
Branch bleibt unangetastet, bis der Feature-Branch gemerged wird.

## SDD-Workflow

- Pläne: `docs/superpowers/plans/` (z.B. `2026-08-07-multimedia-playground.md`, Tasks 1–22)
- Ledger/Progress: `.superpowers/sdd/<datum>/progress.md`
- Commit-Prefix: `feat(playground):`
- **`scripts/task-brief` existiert NICHT** — Brief direkt in den Delegation-Context

## Konventionen (verbindlich)

- `t()` ohne Fallback-Argument (nie `t('key', 'Fallback')`)
- `resetForModel` = MERGE-Contract
- `PLAYGROUND_CONVERSATION_ID = '__playground__'` (Sentinel)
- `BlobManager.createURL` für Asset-Persistenz
- CSS Modules camelCase-only, nur shadcn-Tokens
- i18n: `useLanguage()` → `t`/`language`/`setLanguage`; Keys in `src/config/translations.ts`

## Delegation

- Delegation-Config leer → Worker erben `deepseek-v4-flash` via `opencode-go`
- Externer Claude-Code-Agent committet parallel auf demselben Branch
- **Vor jedem Dispatch:** `ps aux | grep claude` + `git reflog` prüfen
  (verhindert Kollision mit parallelem externem Agenten)

## Weitere Details

- Siehe Skill `heyhihosted-codebase` für t()-Contract, Jest/RTL-Konventionen,
  Shell-Smoke-Test-Muster und Concurrent-Sibling-Commit-Surgery.
