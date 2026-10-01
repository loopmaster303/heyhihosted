# Big Meck Readiness - 2026-03-14

## Ziel

Heute soll Big Meck einen normalen Morgenlauf sauber fahren koennen:

- `08:50` LaunchAgent schreibt einen frischen Prep-Snapshot
- `09:00` `daily-morning-briefing` liest diesen Snapshot und liefert ruhig nach Telegram
- `21:30` `daily-meck-reflection` bleibt stabil
- Logging und Status sind danach schnell pruefbar

## Aktueller Stand

### Stabilisiert

- `run_morning_prep.sh` nutzt explizit `/opt/homebrew/bin/python3`
- LaunchAgent `ai.meck.morning-prep` ist geladen und hatte zuletzt `last exit code = 0`
- `daily-morning-prep` ist in `jobs.json` deaktiviert
- `mini-meck-handoff-processor` ist in `jobs.json` deaktiviert
- `MORNING_BRIEFING.md` hat Freshness-Check und `WOHNTRAEGER`-Fallback
- `DAILY_MECK_REFLECTION.md` markiert `Simulated:`-Reset ehrlich

### Heute noch gehaertet

- `headless_prep.py` filtert Rauschen im Notes-Parser robuster
- `headless_prep.py` schliesst den Ordner `00 Ruediger veroeffentlicht` aus
- `headless_prep.py` markiert fehlende Repo-Pfade als `skipped` statt sie still zu verlieren
- `headless_prep.py` gibt bei Tool-Fehlern leere Outputs statt Fehlertext als Inhalt zurueck

### Manueller Smoke-Run

Frischer Snapshot wurde heute manuell erzeugt:

- `generatedAt`: `2026-03-14T01:46:50.798679`
- `notes_count`: `14`
- `ruediger_leaks`: `[]`
- `overdue_leaks`: `[]`

## Offene Rest-Risiken

- `daily-morning-briefing` traegt im Job-State noch den alten Timeout vom letzten Lauf vor der Stabilisierung
- der echte automatische `08:50 -> 09:00` Tageslauf fuer heute ist noch nicht beobachtet
- zwei Repo-Syncs liefern aktuell `git pull --rebase` Fehler (`heyhihosted`, `houdini ai tool`)

## Beobachtungspunkte heute

### Prep

- Snapshot: `/Users/johnmeckel/.openclaw/workspace/headless/snapshots/morning-prep-latest.json`
- Log: `/tmp/ai.meck.morning-prep.log`
- Err-Log: `/tmp/ai.meck.morning-prep.err.log`

### Cron / Delivery

- Job-State: `/Users/johnmeckel/.openclaw/cron/jobs.json`
- Prompt: `/Users/johnmeckel/.openclaw/workspace/MORNING_BRIEFING.md`
- Reflection: `/Users/johnmeckel/.openclaw/workspace/DAILY_MECK_REFLECTION.md`

## Runbook

### Vor 08:50

- bestaetigen, dass der LaunchAgent noch geladen ist
- bestaetigen, dass `daily-morning-prep = false` und `daily-morning-briefing = true`
- `WOHNTRAEGER.md` nur lesen, nicht hektisch umbauen

### Um 08:50

- pruefen, ob `generatedAt` im Snapshot frisch wird
- `err.log` auf echte Fehler pruefen
- Notes/Reminders/Pool kurz plausibilisieren

### Um 09:00

- `daily-morning-briefing` auf neuen Lauf pruefen
- keinen neuen Timeout akzeptieren
- Telegram-Briefing auf diese Punkte pruefen:
  - ruhig
  - kein Overdue-/Schuld-Frame
  - Pool nicht als To-do-Liste
  - `WOHNTRAEGER` nur bei aktivem Nudge

### Nach 09:00

- Ergebnis als `pass`, `partial` oder `fail` festhalten
- nur dann weitere Technikarbeit anfassen, wenn der Lauf nicht sauber war

## Heute nach 10:00

Wenn der Morgenlauf sauber war:

- Catch-up fuer 13./14. Maerz inhaltlich sortieren
- erst danach Audit-Layer nutzen:
  - `deepseek` fuer Systems-Audit
  - `healer alpha` fuer Trust-/ADHS-Audit
  - `kimi` als Challenger nur bei offenen Streitfragen
