# Finish-Plan — Playground Multimedia (nach Fixes)

**Scope:** Alles zwischen "3 Fixes von Tasks 4–13 sind grün" und "Merge nach `main`".

**Worktrees:**
- `/Users/johnmeckel/heyhihosted-playground` — Branch `playground/multimedia` (Tasks 1–13 gemerged, dann 16/20/21/22)
- `/Users/johnmeckel/heyhihosted-playground-b` — Branch `playground/multimedia-b` (Tasks 14, 15, 17, 18, 19 fertig)
- `/Users/johnmeckel/heyhihosted` — Haupt-Repo, NICHT anfassen bis Final-Merge

**Prerequisite:** `2026-08-07-playground-tasks-4-13-fixes.md` durchgelaufen. `npm run lint` + `CI=1 npm test -- --runInBand src/components/playground/` grün auf `playground/multimedia`.

## Orchestrator-Regeln

- Alle Worker Sonnet-5, `model: "sonnet"` explizit.
- Kein Worker kriegt Spec/Handoff/andere Plans. Nur den einen Task-Brief bzw. den einen Minor-Fix.
- SDD-Skript für Briefs: `scripts/task-brief docs/superpowers/plans/2026-08-07-multimedia-playground.md N`.
- Ein Implementer pro Task, dann ein Task-Reviewer (auch Sonnet-5), max 5 Fix-Rounds. Findings-Kategorien: Kritisch → sofort, Wichtig → sofort, Minor → in Ledger als deferred, weiter.
- Ledger: `.superpowers/sdd/2026-08-07-multimedia-playground/progress.md` — jeden Task-Abschluss + jeden deferred Minor eintragen.
- Konventionen (locked-in): CSS Modules only, Token-Mapping aus `HANDOFF-tasks-4-to-13.md` §"Conventions locked in", Commit-Prefix `feat(playground):` bzw. `docs(playground):`, Focus-Ring `outline: 2px solid hsl(var(--primary)); outline-offset: 2px;` auf `:focus-visible`.

---

## Step 1 — Merge worktree-b in worktree-a

**Ziel:** `playground/multimedia-b` → `playground/multimedia`.

**Konflikt-Prognose:** Genau eine Datei — `src/app/playground/playground.module.css`. Beide Branches hängen Klassen nach Zeile 259 an, keine Namens-Kollisionen. Auflösung: beide Blöcke konkatenieren.

**Vorgehen (du machst das selbst, kein Worker — reine Git-Mechanik):**

```bash
cd /Users/johnmeckel/heyhihosted-playground
git fetch /Users/johnmeckel/heyhihosted-playground-b playground/multimedia-b:multimedia-b-tmp
git merge multimedia-b-tmp --no-ff -m "merge(playground): tasks 14,15,17,18,19 from multimedia-b"
# Konflikt in playground.module.css erwartet → auflösen (beide Blöcke behalten)
npm run lint
CI=1 npm test -- --runInBand src/components/playground/ src/hooks/usePlaygroundModels.test.tsx
git branch -D multimedia-b-tmp
```

Beides grün → weiter. Nicht grün → STOPP, User escalieren.

---

## Step 2 — Task 16: GenerateRequestBuilder

**Brief:** `scripts/task-brief docs/superpowers/plans/2026-08-07-multimedia-playground.md 16`

**Kontext für Worker (im Prompt mitgeben, ~5 Zeilen):**
- `PlaygroundModelEntry` aus `src/hooks/usePlaygroundModels.ts` verfügbar
- `isPrunaModel(id)` aus `src/config/pruna-models.ts`
- Ziel: pure function, zero side effects, TDD-getestet
- Kein `useProviderMode` benötigt — Dispatch entscheidet sich am Modell, nicht am Switch

**Verifikation:** `CI=1 npm test -- --runInBand src/lib/playground/generate-request-builder.test.ts`

---

## Step 3 — Task 20: Wire the shell

**Brief:** `scripts/task-brief docs/superpowers/plans/2026-08-07-multimedia-playground.md 20`

**Kontext für Worker (~10 Zeilen):**
- Datei: `src/app/playground/page.tsx` (neu)
- Alle Komponenten aus `src/components/playground/` bereits vorhanden — nur verdrahten
- `resetForModel` ist MERGE-Contract (Felder die caller nicht passt bleiben erhalten). Für Upload-Truncation `uploads: state.uploads.slice(0, newMaxImages)` explizit passen.
- Asset-Persistenz: `PLAYGROUND_CONVERSATION_ID = '__playground__'` an `OutputService.saveGeneratedAsset({conversationId})`
- Blob-URLs: `BlobManager.createURL(blob, 'generate')` — NIE `URL.createObjectURL` direkt

**Verifikation:** `CI=1 npm test -- --runInBand src/app/playground/page.test.tsx` (Test schreibt der Worker mit).

---

## Step 4 — Task 21: Mobile-Bar

**Brief:** `scripts/task-brief docs/superpowers/plans/2026-08-07-multimedia-playground.md 21`

**Kontext für Worker (~3 Zeilen):**
- Sticky Bottom-Bar, sichtbar bei `@media (max-width: 767px)`
- Provider-Switch + Mode-Tabs + Generate-Button — Komponenten aus Steps 2/3 reusen
- Focus-visible-Ring wie überall (`--primary`, 2px)

**Verifikation:** `CI=1 npm test -- --runInBand src/components/playground/MobileBar.test.tsx`

---

## Step 5 — Task 22: Sidebar-Link + Translations + E2E-Pass

**Brief:** `scripts/task-brief docs/superpowers/plans/2026-08-07-multimedia-playground.md 22`

**Kontext für Worker (~5 Zeilen):**
- Sidebar-Eintrag in `src/components/layout/AppSidebar.tsx` — Icon + Label + `/playground`-Link
- DE/EN in `src/config/translations.ts` — Keys aus dem Brief
- E2E: mock `fetch`, click durch Landing → Model → Prompt → Generate → assert `OutputService.saveGeneratedAsset` called mit `conversationId: '__playground__'`

**Verifikation:**
```bash
CI=1 npm test -- --runInBand src/app/playground/playground.e2e.test.tsx
npm run lint
npm run typecheck
npm run build   # nur wenn Zeit da ist — Build ist teuer
```

---

## Step 6 — Deferred Minors abarbeiten

**Ein Worker pro Minor, Sonnet-5, ~5-Zeilen-Prompt. Reihenfolge egal, keine Abhängigkeiten.**

Liste:

1. **`styles.open` in ModelSelect.tsx nie definiert.** Entweder `.open` in `playground.module.css` mit sichtbarem Open-State (border/shadow-change) hinzufügen ODER die Referenz aus dem TSX rausnehmen, wenn kein Open-State gewünscht. User-Facing-Auswirkung: aktuell kein visuelles Feedback beim Öffnen. Prüf im TSX was `open` bedeuten sollte, dann entscheiden.

2. **`--surface-container-highest` erfunden.** Grep-treffer in `src/app/playground/playground.module.css` finden. Ersetzen mit `hsl(var(--surface-container-high))` (existierender Token).

3. **Raw `rgba(0,0,0,0.3)` box-shadow.** Grep-treffer in `src/app/playground/playground.module.css`. Ersetzen mit `hsl(var(--foreground) / 0.15)` oder `hsl(0 0% 0% / 0.3)` (letzteres wenn Dark-Mode-Neutralität gewünscht — im Zweifel foreground alpha).

4. **`.keyStatus[data-status="checking"]` reused `@keyframes pulse`.** Datei `src/app/playground/playground.module.css`. Wenn Dot mit `pulse` unsichtbar wird: eigenes `@keyframes keyStatusPulse` mit `opacity: 0.4 → 1 → 0.4` (statt scale-basiert). Nur den `.keyStatus`-Selector umstellen.

5. **`.sep`-Separator in `Hero.tsx heroMeta`.** Datei `src/components/playground/Hero.tsx`. Alle `<span className={styles.sep}>...</span>` bekommen `aria-hidden="true"`.

6. **Ungenutztes `NextResponse`-Import.** Grep `NextResponse` in `src/app/playground/` und `src/components/playground/` — wenn ungenutzt, Import-Zeile weg. Dann `npm run lint`.

7. **Dead `styles.pillRow || styles['pill-row']`-Fallback.** Grep `pill-row` in `src/components/playground/`. Kebab-Fallback rausnehmen (CSS Modules camelCase-only).

8. **`next-env.d.ts` in fremdem Commit.** Das ist historisch, nicht mehr auflösbar ohne Rebase. In Final-Review als "known, deferred to next housekeeping" notieren, KEIN Rebase.

9. **4 Commits mit malformed `Co-Authored-By`-Trailer.** Auch historisch. Gleiche Behandlung wie #8: notieren, nicht rebasen.

Punkte 1–7 → je ein Worker. Punkte 8–9 → Ledger-Eintrag, kein Worker.

**Verifikation nach jedem Minor:** `npm run lint` + betroffener Component-Test.

---

## Step 7 — Final Broad-Review

**Ein Sonnet-5 Reviewer (max effort), Scope: gesamter Playground-Feature-Branch.**

**Reviewer-Prompt (~10 Zeilen):**
- Working dir: `/Users/johnmeckel/heyhihosted-playground`
- Branch: `playground/multimedia`
- Diff-Range: `main..HEAD`
- Report-Datei: `.superpowers/sdd/2026-08-07-multimedia-playground/final-review.md`
- Fokus:
  - Provider-Switch-Scoping: `providerMode` wird nur in Playground-UI gelesen (grep `useProviderMode` → nur Playground- und Visualize-Files)
  - Keine erfundenen CSS-Tokens (grep `var(--` gegen definierte Tokens in `src/app/globals.css`)
  - `BlobManager.createURL` statt `URL.createObjectURL` überall in Playground
  - `OutputService.saveGeneratedAsset` mit Sentinel `conversationId: '__playground__'`
  - Gallery-Queries filtern Sentinel raus (grep `PLAYGROUND_CONVERSATION_ID` in `src/lib/services/`)
  - Keine Dexie-Schema-Änderung (grep `db.version` in `src/lib/db.ts` — muss Version 4 sein)
  - `resetForModel` MERGE-Contract eingehalten (grep alle Callsites)
- Findings-Format: Kritisch/Wichtig/Minor mit Datei:Zeile.

**Nach Report:**
- Kritisch/Wichtig → Fix-Loop wie Steps 2–5.
- Minor → Ledger, weiter zu Merge.

---

## Step 8 — Merge nach `main`

Nach grünem Final-Review:

```bash
cd /Users/johnmeckel/heyhihosted   # HAUPT-Repo, erst jetzt anfassen
git checkout main
git pull
git merge /Users/johnmeckel/heyhihosted-playground playground/multimedia --no-ff -m "feat: multimedia playground (/playground)"
npm run lint && CI=1 npm test -- --runInBand && npm run build
```

Wenn irgendein Schritt rot ist → NICHT pushen, User escalieren mit exakter Fehler-Ausgabe.

Wenn alles grün → User informieren, dass `main` lokal fertig ist. **Kein `git push` ohne explizite User-Freigabe** (CLAUDE.md-Regel).

---

## Was NICHT zu tun ist

- Chat-Slim (Compose raus, Visualize auf 1–3 Modelle) ist NICHT Teil dieses Plans. Eigener Zyklus mit eigenem Brainstorm/Spec/Plan.
- Keine "Verbesserungen" an bestehendem Playground-Code außer den benannten Deferred Minors.
- Keine neuen Features. Wenn Task-Brief unklar → User escalieren, nicht Scope erweitern.
- Kein `git push --force`, kein `git rebase -i` auf Feature-Branches die schon reviewed sind.
