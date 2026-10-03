# Plan — Phase 8 bis Ende (ASCII, Abschluss-Gates)

> **For agentic workers:** REQUIRED: Invoke the `using-superpowers` skill FIRST — before
> any response or action. Then implement this plan with
> `superpowers:subagent-driven-development`: fresh implementer subagent per task,
> spec-compliance review, then code-quality review, before the next task starts.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ASCII-Flow im Create (Phase 8), danach die Abschluss-Gates L-B.4, L-I.1 und
L-K.1 als Freigabeweg.

**Architecture:** Phase 8 verdrahtet die vorhandene `src/components/ascii/` in den
Create-Startzustand — ohne Konkurrenz um Rechenzeit laufender Generierungen. Musik und
Compose sind aus diesem Plan herausgelöst und leben in
`PLAN-compose-musik-2026-08-29.md` (eigenes Thema, nicht launch-blockierend).

**Tech Stack:** Next.js 16 App Router, TypeScript, React, Tailwind, Dexie (IndexedDB via
`db.assets`), `src/components/ascii/` (bestehend), Jest + Testing Library.

**Ausgangsstand / Abhängigkeiten:**
- **Ausführungsmodus (2026-08-29):** Dieser Plan darf **parallel zum Patch-Plan**
  laufen — eigener Git-Worktree auf Basis des main-HEAD (Branch-Empfehlung
  `codex/phase-8-ascii`), niemals im Arbeitsbaum des Patch-Plans arbeiten.
- Der Patch-Plan `PLAN-patch-p6-p7-nachaudit-2026-08-29.md` läuft bereits
  (Ausführung begonnen). Für Task 8.1 besteht **keine Code-Abhängigkeit** — der
  ASCII-Task berührt keine Patch-Plan-Datei. Vor den Gates A–C muss der
  Patch-Plan gemerged sein (die Gates verifizieren den integrierten Endstand).
- Konfliktdatei: `docs/LAUNCH_CRITERIA.md`. Patch-Plan Task 1 + Task 6 und Task 8.1
  Schritt 4 editieren sie. Regeln: (a) Falls der Patch-Plan noch nicht gemerged ist,
  wenn 8.1 ausgeführt wird, wird Schritt 4 **zurückgestellt** und erst nach dem
  Patch-Merge nachgeholt. (b) Falls beide ungemerged parallel liegen, nimmt der
  Merge den trivialen Konflikt bewusst in Kauf.
- Phase 5 (gemeinsamer Pool) und Phase 6 (mobilfähiges Create) sind merged.
- Musik/Compose ist ausgegliedert (siehe oben) — keine Compose-Tasks in diesem Plan.

---

## Phase 8 — ASCII-Flow im Create

### Task 8.1: ASCII im Startzustand verdrahten, ohne Generierung zu stören

**Files:**
- Modify: `src/app/create/PlaygroundShell.tsx` (Startzustand rendert `src/components/ascii/index.tsx`)
- Modify: `src/hooks/useAsciiFrames.ts`-Verwendung: pausieren, solange
  `runs.some(r => r.status === 'running')` (kein Frame-Loop während Generierung)
- Modify: Respektiere `prefers-reduced-motion` und kleine Geräte (Media-Query `(max-width: 639px)`) — dort aus oder statisch
- Test: `src/components/ascii/ascii.test.tsx` erweitern (Pausen-Vertrag)
- Konflikt-Regel für Schritt 4: siehe „Ausgangsstand" — `docs/LAUNCH_CRITERIA.md`
  wird bei laufendem Patch-Plan erst nach dessen Merge editiert.

- [ ] Schritt 1: Test schreiben — bei laufender Generierung wird der Frame-Loop nicht
  weiter aufgeweckt; bei `prefers-reduced-motion: reduce` startet er gar nicht.
- [ ] Schritt 2: Implementieren; kein neuer Timer neben dem bestehenden Hook.
- [ ] Schritt 3: Suite grün, Commit: `feat(phase-8): ASCII-Flow im Create, pausiert bei Generierung`
- [ ] Schritt 4 (**nur nach Patch-Merge**, siehe Konflikt-Regel): `docs/LAUNCH_CRITERIA.md`
  — Bereich H ist damit aktiviert: L-H.1 Prüfweg fertigstellen (Status bleibt bis
  Browser-Verifikation offen).

---

## Compose/Musik und Phase 10 — ausgelagert bzw. zurückgestellt

Der bisherige „Musik im Create"-Block (alte Tasks 8.1–8.4) ist in
`PLAN-compose-musik-2026-08-29.md` ausgelagert — eigenes Thema, nicht
launch-blockierend, Tasknummern dort C.1–C.4. Musik auf eigener Infrastruktur
(Phase 10) bleibt ebenfalls außerhalb des Launch-Wegs (Fahrplan 2026-08-26).
Der konkrete Weg ist inzwischen der Modal-Prototype:
`docs/superpowers/plans/2026-08-29-modal-acestep-sound.md` (ACE-Step 1.5 self-hosted,
eigene `/sound`-Seite, eigener Store) — Start **erst nach Abschluss dieses Plans**
(Patch-Plan → 8.1 → Gates A–C), als neues Feature neben Create. Chunk 1 des
Prototype-Plans (Modal-Endpoint, Tasks 1–4) ist repo-unabhängig und darf parallel
gestartet werden; Chunk 2 (`/sound` im Repo) empfiehlt sich erst nach dem
Patch-Merge, um Arbeitsbaum-Konkurrenz zu vermeiden.
Kein Code, kein Kriterium. Wiederöffnen nur bei: kostenloses Musikangebot gewünscht,
Pollinations fällt als Musikanbieter aus, oder eigene Limitsteuerung wird gebraucht.

---

## Abschluss — Gates vor Freigabe

### Task A: L-B.4 — Modellbestätigung durch Erzeugung

- [ ] Für `flux`, `gpt-image`, `klein` je eine echte Erzeugung (alle drei schlüsselfrei,
  kein Kostenrisiko); Ergebnis + Datum in `LAUNCH_CRITERIA.md` L-B.4 notieren.
- [ ] Läuft eines nicht: Registry-Flag `enabled: false` ist der einzige Hebel — die
  Chat-Regel folgt von selbst (Phase-7-Kommentar). Kein Codeeingriff.
- [ ] Danach L-F.1 auf „erledigt" setzen (Voraussetzung aus dem Patch-Plan Task 1 erfüllt).

### Task B: Finale Gates L-I.1 und L-K.1

- [ ] L-I.1: drei Schlüsselzustände (kein / nur Pollen / nur Pruna) durchspielen —
  überall Hinweis statt Fehler, kein schlüsselpflichtiger Lauf startbar.
- [ ] L-K.1: serverseitige Env-Schlüssel prüfen (Produktion: kein Pruna-Schlüssel,
  Pollinations-Schlüssel vorhanden) und ohne Client-Schlüssel jeden Erzeugen-Pfad
  auslösen; Pollinations-Konto gegenprüfen — kein kostenpflichtiger Lauf.

### Task C: Betreiber-Browser-Runde und Statuswahrheit

- [ ] L-A.1 bis L-K je Prüfweg im echten Browser (Betreiber; Agenten: keine
  Browser-Tools, siehe AGENTS.md). Liste der offenen Statuszeilen vorher ziehen:
  `rg -n "Status: offen" docs/LAUNCH_CRITERIA.md`.
- [ ] Nach jeder bestätigten Zeile Status setzen; Freigaberegel im Kopf des Dokuments
  anwenden (alle A–G und I–K erfüllt → Adresse darf geteilt werden).
- [ ] Handoff-Dokument `docs/HANDOFF-<datum>-abschluss.md` mit Testzahlen, Gate-Ergebnissen
  und Restrisiken (Bereich L) schreiben.

---

**Reihenfolge:** Patch-Plan → 8.1 → A → B → C, serial, ein Subagent je Task.
Musik/Compose ist ausgegliedert in `PLAN-compose-musik-2026-08-29.md` und gehört
nicht zum Launch-Weg.
