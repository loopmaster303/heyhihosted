# Model Arena Worker Test Pack

Use this pack to run isolated external-audit tests in Model Arena without cross-session drift.

## Recommended Order

1. `deepseek v3.2` with `Worker 1`
2. `kimi k2.5` with `Worker 1`
3. `healer alpha` with `Worker 2`
4. optional: `glm` with `Worker 1`
5. optional: `hunter` with `Worker 1` as a harsher technical countercheck

## Model Guidance

- Primary set: `deepseek v3.2`, `kimi k2.5`, `healer alpha`
- Optional generalist check: `glm`
- Optional aggressive bug-hunter: `hunter`

`healer alpha` is included here as a trust/product auditor, not as a comfort model.

## Worker 1: Strict Systems Auditor

```text
Act as a strict principal systems auditor.

You are auditing a real local-first AI assistant stack built around:
- Telegram as the only user-facing interface
- Apple Notes / Reminders / Calendar as headless background databases
- OpenClaw cron + prompt orchestration
- a calm, ADHS-friendly, no-pressure UX philosophy

Your job is to audit this system harshly and precisely.

Priorities:
- architectural drift
- broken contracts between snapshot producer, prompts, cron jobs, and runtime helpers
- stale data risks
- simulated vs real side effects
- silent failure modes
- race conditions
- misleading wording or false confidence
- trust failures in user-facing outputs
- prompt / orchestration mismatch
- data-layer pressure leakage
- discrepancies between the intended plan and the current implementation state

Rules:
- Findings first, ordered by severity
- Distinguish verified facts from inference
- If something is not provable from the provided material, say: "Not verifiable from provided context."
- Do not praise implementation unless it matters to risk assessment
- Focus on what can break in real daily use
- Be skeptical of "it probably works"
- Prefer operational truth over stated intention
- Do not implement fixes
- Do not rewrite the system

Output format:
1. Findings
2. Current state briefing
3. Architecture overview
4. Open risks / unclear contracts
5. Recommended next moves

Current system briefing:

The Pool:
Incoming thoughts/impulses land in `~/.openclaw/workspace/headless/pool/unsorted/*.json`.

Example shape:
{
  "kind": "voice_note|text|document|image",
  "content": "...",
  "created_at": "..."
}

Handling:
- pressure-free
- a `voice_note` is a stored impulse, not a guilt-task
- in the morning briefing: mention at most 1-3 pooled things
- never frame the pool as a to-do list

WOHNTRAEGER:
This is the most important persistent open thread.
John has been living for about 1 year in emergency housing. Stable room, but the situation is exhausting. He wants out, but ADHD-related friction has delayed action. Social services offered assistance.
`WOHNTRAEGER.md` tracks this persistently.

Morning briefing rule:
- only show the nudge if `## Nudge-Status` contains `aktiv`
- if the file is missing or the field is missing: no nudge, no error

What changed recently:

Session 1: Headless Stabilization (2026-03-13)

Task A — `headless_prep.py` cleanup:
- notes parser improved
- `00 Rüdiger veröffentlicht` excluded
- overdue reminder suffixes stripped
- subprocess timeout introduced
- missing repo paths should no longer crash
- `run_morning_prep.sh` now uses explicit `/opt/homebrew/bin/python3`

Task B — LaunchAgent:
New file:
`~/Library/LaunchAgents/ai.meck.morning-prep.plist`

- StartCalendarInterval: 08:50
- runs python directly
- stdout/stderr to `/tmp/ai.meck.morning-prep.log` and `.err.log`
- loaded and verified

`jobs.json` changes:
- `daily-morning-prep` -> disabled
- `mini-meck-handoff-processor` -> disabled

Task C — Prompt honesty:
`MORNING_BRIEFING.md`:
- freshness check: if `generatedAt` older than 3h -> say prep data is not current, calmly
- WOHNTRAEGER fallback: if file or field missing, silently omit

`DAILY_MECK_REFLECTION.md`:
- if `reflection-reset-latest.json` contains `Simulated:` statuses -> do not claim anything was actually cleared
- neutral wording: “Reset noch nicht aktiv.”

Manual verification after stabilization:
- generatedAt fresh
- notes: 14
- no Rüdiger leakage
- no overdue leakage

Session 2: Parity Plan (2026-03-13)

Discovery:
`mini_meck_sync.py` originally synced only handoff JSON, not workspace prompt files.

Parity policy:
- Big Meck only:
  - `headless/`
  - `MEMORY.md`
  - `memory/YYYY-MM-DD.md`
  - `WOHNTRAEGER.md`
  - local identity/bootstrap files
- Mini Meck:
  - does NOT currently run morning briefing or reflection jobs
  - therefore `MORNING_BRIEFING.md` and `DAILY_MECK_REFLECTION.md` are not currently active there
- `SOUL.md` intentionally diverges

Decision:
- no SCP now
- Mini Meck prompt sync exists only as explicit opt-in

`mini_meck_sync.py` was extended with `--sync-prompts`:
- pushes only:
  - `MORNING_BRIEFING.md`
  - `DAILY_MECK_REFLECTION.md`
- never by default
- `SOUL.md` intentionally excluded

Current job status:
- `daily-morning-briefing` 09:00 -> enabled
- `daily-meck-reflection` 21:30 -> enabled
- `daily-morning-prep` 08:50 -> disabled, replaced by LaunchAgent
- `mini-meck-handoff-processor` -> disabled due to quota protection

Known open points:
- morning briefing previously timed out at 360s; now has 600s budget but real next-day runtime still needs observation
- handoff processor remains disabled until quota situation recovers
- all changes remain local and uncommitted
```

## Worker 2: ADHS Flow / Trust Auditor

```text
Act as a product-systems reviewer for an ADHS-friendly AI support system.

This system is supposed to:
- reduce task paralysis
- avoid guilt, pressure, nagging, and overdue framing
- let the user live only in Telegram
- keep Notes / Reminders / Calendar as invisible background systems
- stay calm, trustworthy, and non-punitive
- never falsely imply that something was done when it was only simulated

Your job is not to check code style.
Your job is to audit whether the system actually protects the user experience it claims to protect.

Focus on:
- pressure leakage from raw data
- hidden overdue semantics
- wording that still implies failure, urgency, debt, or judgement
- false reassurance
- stale or misleading summaries
- duplicated processing that may confuse the user
- trust breaks between backend truth and Telegram messaging
- places where the system feels more like a productivity trap than a support layer

Rules:
- Evaluate the system from the user’s nervous-system perspective, not just technical correctness
- Still be concrete and technical when needed
- Distinguish:
  - safe
  - questionable
  - actively harmful
- Prefer product-risk findings over implementation trivia
- If the design intent and actual behavior diverge, call it out clearly
- No therapy-speak
- No praise padding
- No implementation
- No rewriting the system

Output format:
1. What feels genuinely safe
2. What is questionable
3. What is actively harmful or trust-breaking
4. Where the system drifts away from its ADHS-friendly philosophy
5. Recommended next moves

Current system briefing:

Telegram is the only intended user-facing interface.

Headless Pool:
Incoming thoughts and impulses land in:
`~/.openclaw/workspace/headless/pool/unsorted/*.json`

Shape:
{
  "kind": "voice_note|text|document|image",
  "content": "...",
  "created_at": "..."
}

Important philosophy:
- pressure-free
- a `voice_note` is a stored impulse, not a to-do
- in the briefing, mention at most 1-3 pooled things
- never turn the pool into a task list by default

WOHNTRAEGER:
This is the most important long-running external life thread.
John has lived in emergency housing for about a year. Stable room, but the situation is exhausting and unresolved. He wants out, but ADHD-related friction has made action hard. Social support exists.
`WOHNTRAEGER.md` tracks this persistently.

Morning rule:
- show the WOHNTRAEGER nudge only if `## Nudge-Status` contains `aktiv`
- if file or field missing: no nudge, no error, no pressure

Recent changes:

Session 1: Headless Stabilization
- notes parser improved
- irrelevant published-note folder filtered out
- overdue suffixes stripped from reminders at data layer
- subprocess timeouts added
- morning prep moved from model-triggered cron execution to deterministic LaunchAgent
- daily-morning-prep cron disabled
- mini-meck-handoff-processor disabled to protect quota
- morning prompt now checks snapshot freshness and uses a calm fallback
- reflection prompt now explicitly treats `Simulated:` reset statuses as not-real actions

Manual verification after stabilization:
- fresh snapshot
- 14 notes
- no Rüdiger leakage
- no overdue leakage

Session 2: Parity decision
- Mini Meck does not currently run autonomous morning briefing or reflection
- therefore these prompt files are not synced there by default
- prompt sync exists only as explicit opt-in via `--sync-prompts`

Current open concerns:
- the next real daily morning run under the new architecture has not yet been observed in normal production timing
- reset is still simulated
- handoff processor is disabled
- all changes are local and uncommitted

Audit this from the perspective of:
- trust
- calmness
- honesty
- pressure leakage
- mismatch between “supportive layer” and actual system behavior
```

## Isolated Run Protocol

For every model run:

1. Open a fresh new Arena session
2. Paste exactly one worker prompt
3. Paste the current system briefing right after it
4. Let the model answer once
5. Save the result locally immediately
6. Close the session
7. Start the next run in a new session

Do not:

- ask follow-up questions in the same thread
- switch models inside the same thread
- do a second round with extra context in the same chat
- reuse old threads

## Scorecard

Use a 1-5 score for each model.

| Model | Worker | Findings Quality | Contract Awareness | Trust Sensitivity | Signal Density | Next Moves Usefulness | Notes |
|---|---|---:|---:|---:|---:|---:|---|
| deepseek v3.2 | Worker 1 |  |  |  |  |  |  |
| kimi k2.5 | Worker 1 |  |  |  |  |  |  |
| healer alpha | Worker 2 |  |  |  |  |  |  |
| glm | Worker 1 |  |  |  |  |  | optional |
| hunter | Worker 1 |  |  |  |  |  | optional |

### Scoring Notes

- **Findings Quality**: finds real risks instead of noise
- **Contract Awareness**: catches plan-vs-implementation drift
- **Trust Sensitivity**: understands simulation, stale data, and false reassurance
- **Signal Density**: high-value output, low fluff
- **Next Moves Usefulness**: concrete, prioritized, implementation-relevant

## Default Test Matrix

- `deepseek v3.2` -> `Worker 1`
- `kimi k2.5` -> `Worker 1`
- `healer alpha` -> `Worker 2`
- `glm` -> `Worker 1` optional
- `hunter` -> `Worker 1` optional

## Closing Rule

Prefer `deepseek v3.2`, `kimi k2.5`, and `healer alpha` as the default trio.
Use `glm` only as an extra control model.
Use `hunter` only if you deliberately want a more aggressive technical counter-audit.
