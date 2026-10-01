# Preflight-Fixes + Merge-Loop — Playground Multimedia

**Scope:** 1 Wichtig (W6) + 1 Minor (M6) aus dem Final-Review vom 2026-08-08. Danach Loop bis Merge nach `main`.

**Worktree:** `/Users/johnmeckel/heyhihosted-playground`
**Basis-Branch:** `playground/multimedia`
**Fix-Sub-Branch:** `playground/multimedia-preflight`
**Ziel-Repo für Merge:** `/Users/johnmeckel/heyhihosted` — `main`

## Orchestrator-Regeln

- Ein Worker pro Fix, Sonnet-5 (`model: "sonnet"` explizit).
- **Nur der eine Fix-Abschnitt** an den Worker. Kein Broad-Review, kein Finish-Plan, kein Review-Fixes-Plan mitschicken.
- Worker committen auf `playground/multimedia-preflight` (siehe Prolog).
- Ein Sonnet-5 Task-Reviewer pro Fix, prüft nur dieses eine Finding + `npm run lint` + betroffenen Test.
- Max 5 Fix-Rounds pro Task.

---

## Prolog — Sub-Branch anlegen

**Warum:** externer Claude-Agent committet parallel auf `playground/multimedia`. Isolation nötig.

**Orchestrator führt selbst aus (kein Worker):**

```bash
cd /Users/johnmeckel/heyhihosted-playground
git status                       # muss clean sein bis auf untracked plan docs — sonst STOPP
git checkout playground/multimedia
git checkout -b playground/multimedia-preflight
git rev-parse HEAD               # merken als PREFLIGHT_BASE
```

Wenn `git status` unfertigen Code (nicht nur `.md`) zeigt → **STOPP**, User escalieren. Nicht stashen, nicht wegwerfen.

---

## Fix W6 (Wichtig) — Sync-Effect eslint-disable

**Datei:** `src/app/playground/PlaygroundShell.tsx` Zeilen 45–47
**Problem:** Sync-Effect (setzt `modelId` wenn `currentModel` wechselt) hat missing-deps, keine `eslint-disable`. Lint-Warning aktiv.

**Aktueller Code:**
```tsx
  useEffect(() => {
    if (currentModel && state.modelId !== currentModel.id) setModelId(currentModel.id);
  }, [currentModel?.id]);
```

**Gewünscht:**
```tsx
  useEffect(() => {
    if (currentModel && state.modelId !== currentModel.id) setModelId(currentModel.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModel?.id]);
```

Absicht identisch mit dem Reset-Effect direkt darunter (Zeilen 49–61): nur bei Modell-Wechsel feuern, State-Reads bewusst außerhalb der Deps.

**Verifikation:**
```bash
npm run lint 2>&1 | grep -A1 'PlaygroundShell\.tsx' || echo "no lint on shell"
```
Erwartung: 0 Warnings auf `PlaygroundShell.tsx`. Wenn noch was übrig ist: STOPP, User escalieren (nicht spekulativ weiter fixen).

---

## Fix M6 (Minor, semantic) — `clearAllAssets` filtert Sentinel

**Datei:** `src/hooks/useGalleryAssets.ts` Zeilen 48–50
**Problem:** `db.assets.clear()` löscht Playground-Assets mit. Bricht K2-Isolation für Vault-Clear-Button.

**Aktueller Code:**
```ts
  const clearAllAssets = async () => {
    await db.assets.clear();
  };
```

**Gewünscht:**
```ts
  const clearAllAssets = async () => {
    await db.assets.filter(isGalleryAsset).delete();
  };
```

`isGalleryAsset` ist im selben File schon exportiert (K2-Fix, Zeile 11). Kein neuer Import.

**Test-Ergänzung** — hänge unten in `src/hooks/useGalleryAssets.test.ts` an:
```ts
it('isGalleryAsset also gates clearAllAssets — playground assets survive bulk clear', () => {
  const playground = asset({ id: 'p', conversationId: '__playground__' });
  const chat = asset({ id: 'c', conversationId: 'chat-1' });
  const survives = [playground, chat].filter(a => !isGalleryAsset(a));
  expect(survives).toEqual([playground]);
});
```

Reine Prädikats-Assertion — kein Dexie-Roundtrip.

**Verifikation:**
```bash
CI=1 npm test -- --runInBand src/hooks/useGalleryAssets.test.ts
```

---

## Docs-Commit + Merge-Back auf `playground/multimedia`

**Nach beiden Fixes grün, Orchestrator selbst (kein Worker):**

```bash
cd /Users/johnmeckel/heyhihosted-playground
git add docs/superpowers/plans/2026-08-07-playground-step7-final-review-handoff.md
git add docs/superpowers/plans/2026-08-08-playground-final-review-and-merge.md
git add docs/superpowers/plans/2026-08-08-playground-preflight-and-merge-fixes.md
git commit -m "docs(playground): final review handoff + merge plan + preflight fixes"

git checkout playground/multimedia
git merge --no-ff playground/multimedia-preflight -m "merge(playground): pre-merge W6/M6 fixes"
git branch -d playground/multimedia-preflight
```

**Vollverifikation nach Merge-Back:**
```bash
npm run lint            # 0 Errors, ≤3 Warnings (nur die 3 <img>-Hinweise)
npm run typecheck
CI=1 npm test -- --runInBand
```

Alle drei grün → weiter zur Loop-Phase.

---

## Loop bis Merge — zwei Gates müssen grün sein

**Regel:** Kein Merge nach `main`, solange **eines** dieser Gates rot ist:

1. **Reviewer-Gate (Claude, extern):** statischer Review + Lint + Full-Test-Suite. Signal: "PASS" oder Findings-Liste.
2. **Dev-Gate (User @ localhost):** manueller Smoke-Test auf `http://localhost:3000/playground`. Signal: User schreibt explizit "grün" oder listet was kaputt ist.

```
Iteration N:
  → Reviewer-Gate anfragen (Handoff-Doc + branch-HEAD)
    ├─ PASS → Dev-Gate anfragen (User)
    │   ├─ grün → Merge nach main (Phase M)
    │   └─ Findings → neuer Fix-Sub-Branch, Loop N+1
    └─ Findings → neuer Fix-Sub-Branch, Loop N+1

Max 5 Iterationen, dann adjudicate mit User.
```

Jede Iteration bekommt einen Ledger-Eintrag mit was gefixt wurde und welches Gate wieder auf grün geprüft werden muss (typisch: nach Fix reruns nur das Gate das rot war — außer der Fix hat Test-Änderungen mitgemacht, dann beide).

### Reviewer-Gate — was der Orchestrator dafür bereitstellt

Eine Handoff-Nachricht an Claude mit:
- Aktueller HEAD-SHA auf `playground/multimedia`
- Ledger-Zusammenfassung der Iteration
- Konkreter Diff-Range (`main..HEAD` oder `LAST_REVIEW_HEAD..HEAD` bei Nachfassen)
- "Bitte Full-Review, keine Delegation" — Claude macht das inline

### Dev-Gate — Ablauf

**Orchestrator startet Dev-Server für User (kein Bash-Loop):**

```bash
cd /Users/johnmeckel/heyhihosted-playground
npm run dev
```

Startup abwarten (~5–10s), User bekommt Link zu `http://localhost:3000/playground`.

**User-Checkliste (an User schicken, Text-Only, keine Klick-Recording nötig):**
- [ ] `/playground` lädt ohne Console-Errors
- [ ] Provider-Switch (Pollinations/Pruna) wechselt sichtbar; API-Key-Feld reagiert
- [ ] Mode-Tabs (T2I/I2I/T2V/I2V) filtern Modell-Liste
- [ ] Modell auswählen → Ratio-Pills + Duration-Slider + Advanced updaten sich für dieses Modell
- [ ] Prompt eingeben → Generate wird enabled
- [ ] Ein T2I-Run mit `flux` (kein Key nötig): Bild erscheint im Hero, Gallery-Card unten links
- [ ] Gallery-Card klicken → Hero zeigt sie wieder
- [ ] Nach Full-Reload (`Cmd-R`): Playground-Gallery erhalten; Sidebar-Gallery + Vault (`/gallery`) zeigen **kein** Playground-Bild
- [ ] Mobile-View (Chrome DevTools ≤767px): Bottom-Bar sichtbar, Params-Sheet öffnet
- [ ] Sidebar-Link "Playground" führt zurück auf `/playground`

User meldet zurück: "grün" oder Liste offener Punkte. Bei Punkten → in den Fix-Loop.

**Wichtig:** Dev-Server läuft weiter zwischen Iterationen — HMR reicht für die meisten Fixes. Bei größeren Änderungen (`next.config.ts`, Deps): Server stoppen + neu starten.

---

## Phase M — Merge nach `main`

**Nur wenn Reviewer-Gate = PASS UND Dev-Gate = grün UND User explizites Go per Chat sagt** (Text, kein Docs-Signal).

```bash
cd /Users/johnmeckel/heyhihosted        # HAUPT-Repo, erst jetzt anfassen
git status                              # muss clean sein
git checkout main
git pull                                # falls Remote existiert
git merge --no-ff /Users/johnmeckel/heyhihosted-playground playground/multimedia \
  -m "feat: multimedia playground (/playground)"

npm run lint
npm run typecheck
CI=1 npm test -- --runInBand
npm run build
```

Wenn irgendein Schritt rot → **STOPP.** `git reset --hard HEAD~1` auf `main` (nur wenn `git status` bestätigt, dass nur der Merge-Commit gerollbackt wird). User escalieren mit exakter Fehler-Ausgabe.

Wenn alles grün → User informieren: "Merge lokal grün. Push nach explizitem User-Go."

**Kein `git push` ohne zweites explizites User-Go per Chat.** Auch nicht wenn Loop-Iterationen alle vorher grün waren.

---

## Phase N — Post-Merge Cross-Ecosystem-Handoff

**Trigger:** Phase M grün UND User-Go zum Push (falls Push gemacht) ODER User bestätigt "lokal reicht mir für heute".

Diese Phase läuft **nicht** im Playground-Worktree, sondern im Haupt-Repo. Sie schließt den Zyklus in Richtung Hermes + Inkbox-SIP-Call-Agent.

### N.1 — Independent Verify im Haupt-Repo

Orchestrator startet **neue Claude-Session** im Haupt-Repo (nicht den Playground-Worktree wiederverwenden — frischer Kontext):

```bash
cd /Users/johnmeckel/heyhihosted
claude
```

Erste Prompt an diese neue Claude-Session (User schickt oder Orchestrator schickt via CLI-Flag):

> Lies den neuesten Handoff unter `docs/superpowers/plans/` (Datum 2026-08-08). Reviewe den aktuellen Merge-State auf `main` gegen den Handoff. Zwei mögliche Ergebnisse:
> - **Grün** → schreibe eine 5–10-zeilige Zusammenfassung nach `docs/superpowers/handoffs/2026-08-08-playground-merged-summary.md` (was gemergt wurde, Commit-SHA, wichtigste Punkte für den Nutzer, offene Deferred-Items). Kein Push, keine weiteren Änderungen.
> - **Findings** → schreibe stattdessen einen Fix-Plan im gleichen Docs-Ordner (Muster wie die bisherigen Fix-Pläne) und stoppe. **Loop zurück** auf den Anfang dieses Preflight-Merge-Zyklus (Phase A) mit den neuen Findings.

Wenn diese Claude-Session Findings meldet: die Merge-to-main-Aktion **war verfrüht** — Loop zurück, W6/M6-Style Fix-Runde, danach neuer Merge-Versuch.

Wenn grün: die Summary-Datei existiert. Weiter zu N.2.

### N.2 — Hermes-Terminal-Chat starten

Orchestrator öffnet Terminal-Session zum Hermes-Agenten (democrabs Level 3, läuft auf Hetzner-Server `minimeck`). Genauer Command je nach lokalem Setup — typisch:

```bash
ssh minimeck
# im Hermes-Prompt:
hermes chat
```

Erste Prompt an Hermes:

> Lies die Zusammenfassung `docs/superpowers/handoffs/2026-08-08-playground-merged-summary.md` aus dem heyhihosted-Repo (User synchronisiert den Pfad — bei Bedarf via `scp` oder git-pull auf dem Server). Übernimm den Inhalt in die Kontext-Datei, die der Inkbox-SIP-Call-Agent bei jedem eingehenden Anruf liest. Bestätige den Pfad zurück.

**Wo genau die Inkbox-Context-Datei liegt**, weiß nur der Hermes-Agent selbst — nicht in diesem Plan hardcoden. Hermes-Agent kennt die Pfade seiner Sub-Agents (dokumentiert in Hermes-System via `inkbox-voice-to-sip`-Skill-Ausführung).

### N.3 — 10-Uhr-Anruf-Briefing scharfschalten

Hermes-Agent bekommt vom Orchestrator (oder direkt vom User) die Anweisung:

> Beim morgigen 10:00-Anruf soll der Call-Agent mich (User) über den heutigen Playground-Merge informieren. Kernpunkte aus der Kontext-Datei (siehe N.2). Kurz, unter 30s Sprechzeit.

Der Call-Agent liest bei Anrufaufbau eh die Kontext-Datei — die N.2-Ergänzung reicht als Trigger. Kein separater Scheduling-Call nötig, außer der User will es explizit terminlich per `mcp__scheduled-tasks__*` verankern.

### N.4 — Zyklus-Abschluss

Ledger-Eintrag in `.superpowers/sdd/2026-08-07-multimedia-playground/progress.md`:

```
Cross-ecosystem handoff (2026-08-08): complete
- Independent verify in main repo: PASS
- Summary written: docs/superpowers/handoffs/2026-08-08-playground-merged-summary.md
- Hermes chat: Inkbox context file updated (path per Hermes agent report)
- 10:00 call: call-agent briefing armed
```

Damit ist der Playground-Multimedia-Feature-Zyklus vollständig geschlossen — vom Spec-Doc bis zur Sprachnachricht.

---

## Ledger-Templates

Nach jeder Iteration in `.superpowers/sdd/2026-08-07-multimedia-playground/progress.md` anhängen:

**Nach Preflight-Fixes:**
```
Preflight fixes (2026-08-08): complete (sub-branch playground/multimedia-preflight, merged as MERGE_SHA7)
- W6: PlaygroundShell sync-effect eslint-disable
- M6: useGalleryAssets clearAllAssets filters via isGalleryAsset
```

**Nach Reviewer-Gate:**
```
Merge-loop iteration N — Reviewer-Gate: PASS   (oder: findings-listed)
```

**Nach Dev-Gate:**
```
Merge-loop iteration N — Dev-Gate: green    (oder: findings-from-user)
```

**Nach erfolgreichem Merge nach main:**
```
Merged to main (2026-08-XX): MERGE_SHA7. Not pushed.
```

**Nach Cross-Ecosystem-Handoff (Phase N):**
```
Cross-ecosystem handoff (2026-08-08): complete
- Independent verify in main repo: PASS
- Summary written: docs/superpowers/handoffs/2026-08-08-playground-merged-summary.md
- Hermes chat: Inkbox context file updated
- 10:00 call: call-agent briefing armed
```

---

## Was NICHT zu tun ist

- Kein Fix für M7 (`<img>`→`next/image`), M8 (untracked docs — löst Phase Docs-Commit oben), M9 (misleading `e1dcf8d` commit — historisch). Alle deferred bis nach Merge.
- Kein Rebase des Feature-Branchs. `--no-ff` erhält Historie.
- Kein `git push --force` irgendwo.
- Kein `--amend` auf reviewten Commits.
- Kein Merge nach `main` bei Loop-Erschöpfung (5 Iterationen) — dann User adjudizieren lassen.
- Dev-Server nicht via `Bash` starten wenn ein Preview-Tool verfügbar ist (schont Orchestrator-Context). Falls Preview-Tool fehlt: `npm run dev` im Bash im Hintergrund, User bekommt Link.
