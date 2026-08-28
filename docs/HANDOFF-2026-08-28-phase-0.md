# Session-Handoff — Phase 0 abgeschlossen: der Arbeitsbaum ist sortiert

**Datum:** 2026-08-28
**Branch:** `main`, HEAD **`aa3eac4`**, gepusht, live deployt
**Vorgänger:** `f880389`
**Art der Sitzung:** Ausführung von [`docs/PLAN-phase-0-arbeitsbaum.md`](PLAN-phase-0-arbeitsbaum.md).
Sechzehn Commits, kein neuer Code.

Dieses Handoff ist für die Threads, die Phase 1 bis 9 übernehmen. Es sagt, **was** jetzt
gilt, **wie** es zustande kam — und vor allem, **welche Befunde aus der Ausführung in
welche Phase gehören**. Abschnitt 6 ist der Teil, den du wahrscheinlich suchst.

---

## 1. Der Blocker ist weg

Der Satz, der seit dem 26.08. über jedem Dokument stand — *„65 geänderte und rund 20 neue
Dateien liegen uncommitted da"* — gilt nicht mehr.

```
$ git status --porcelain
$ (leer)
```

Tatsächlich waren es **99 Dateien**, nicht 85: 62 geändert, 5 gelöscht, 2 umbenannt,
30 neu. Die Zahl der neuen Dateien war um die Hälfte höher als angenommen.

**Jede Phase kann jetzt gegen einen echten, gepushten, live verifizierten Stand planen.**

---

## 2. Die sechzehn Commits

| # | Commit | Inhalt |
|---|---|---|
| C1 | `9681429` | `next-themes` von dev- zu Laufzeitabhängigkeit; `.superpowers/` ignoriert; `next-env.d.ts` |
| C2 | `1b2688a` | Zweischriftigkeit: IBM Plex Sans fürs Gesprochene, Monospace fürs Maschinelle |
| C3 | `6c11585` | ASCII-Bausteine (`AsciiSpinner`, `AsciiSignature`) |
| C4 | `325acf9` | Systemprompt kennt Datum, Uhrzeit und Zeitzone |
| C5 | `50df548` | Pruna-Payloads gegen die echten Modell-Schemas |
| C6 | `4dcdea1` | 202-Protokoll: lange Läufe antworten mit einer Lauf-Id, der Browser fragt zu Ende |
| C7 | `f49f785` | VACE ausgeblendet; Playground liest endlich `enabled` |
| C8 | `70f91b7` | Pollen-Key-Feld füllt sich; `SettingsDialog` → `settings/SettingsPopover` |
| C9 | `8b13b9c` | API-Härtung über neun Routen |
| C10 | `d3a3a63` | Registry-Refactor: Fetch und Cache zentral |
| C11 | `32f00dc` | Compose-Einstieg hinter `FEATURES.compose = false` |
| C12 | `a566426` | Chat-Eingabeleiste umgebaut (der grosse Block) |
| C13 | `07fb19a` | Neulauf-Streifen unter Ergebniskarten |
| C14 | `b56fe37` | Tests für Kernbausteine ohne Abdeckung |
| C15 | `7000561` | Toter Code entfernt |
| C16 | `aa3eac4` | Doku und Pläne |

### Was in der Zuordnung des Vorgänger-Handoffs fehlte

[`HANDOFF-2026-08-27-fahrplan.md`](HANDOFF-2026-08-27-fahrplan.md), Abschnitt 5.1, ordnete
den Baum nach Herkunft. Die Zuordnung stimmte, war aber **unvollständig** — fünf Gruppen
fehlten ganz:

1. **API-Härtung (C9), ~15 Dateien.** `rate-limit.ts` war dort als einzelne neue Datei
   gelistet; verdrahtet ist es in sieben Routen, samt Body-Grenzen, echten Zod-Schemas
   statt `z.any()` und der Umstellung „Upstream-Fehlertext nicht mehr an den Client".
2. **Runtime-Kontext im Systemprompt (C4).** Datum, Uhrzeit, Zeitzone.
3. **Neulauf-Streifen (C13).** `GenerationControlStrip` stand dort, aber nicht
   `GenerationRecord` in `types/index.ts`, Koordinator, Orchestrator, `ChatView`,
   `MessageBubble`.
4. **Schriftumbau (C2).** `CLAUDE.md` beschrieb ihn seit dem 22.08. als erfolgt —
   der Code war nie committet. Die Doku beschrieb einen Zustand, den `main` nicht hatte.
5. **Registry-Refactor und sechs neue Testdateien (C10, C14).**

Und eine Aussage war schlicht falsch: ASCII sei „im Playground nicht verdrahtet".
`AsciiSpinner` wurde bereits von `PageLoader`, `ChatInput`, `InlineModeSwitch` **und**
`playground/Gallery.tsx` importiert. Was fehlt, ist der ASCII-*Flow* der Startseite —
nicht die Komponente. **Für Phase 9 heisst das: die Bausteine stehen schon.**

---

## 3. Nachweise

### Jeder Commit ist einzeln grün

Nicht nur der Endstand. Jeder der 16 Commits wurde in einem **eigenen temporären
`git worktree`** ausgecheckt und dort geprüft:

```
685 → 685 → 691 → 691 → 698 → 712 → 712 → 713
    → 742 → 742 → 742 → 757 → 761 → 780 → 780 → 780
```

`tsc --noEmit` überall sauber, kein Sinken an keiner Stelle. Endstand: **106 Suiten,
780 Tests, `lint` sauber, `npm run build` erfolgreich.**

### Nichts ging beim Aufteilen verloren

Sieben Dateien mussten auf mehrere Commits verteilt werden. Für jede wurde der
Split-Patch auf `f880389` angewendet und das Ergebnis **byte-genau** gegen `aa3eac4`
verglichen. Alle sieben stimmen exakt — kein Hunk fehlt, keiner doppelt.

### Live verifiziert gegen `chat.hey-hi.cloud`

| Prüfung | Ergebnis |
|---|---|
| Deploy angekommen | Security-Header aus C9 gesetzt (CSP korrekt **Report-Only**), `IBM+Plex+Sans` aus C2 im HTML |
| Chat | `POST /api/chat/completion` → `{"content":"Hallo"}` |
| Bild | `flux` → echtes JPEG, 35 217 Bytes, 512×512, EXIF `manufacturer=flux` |
| Intent-Erkennung | Mit dem echten `MEDIA_MARKER_PROTOCOL` antwortet `claude-fast` auf „mal mir eine katze" mit `[IMAGE_GEN: A beautiful cat sitting …]` |
| Neue Statusroute | `GET /api/pruna/status` antwortet strukturiert, kein 404 — C6 ist deployt |

---

## 4. Wie es gemacht wurde — für spätere Phasen nachnutzbar

Zwei Werkzeuge, die sich bewährt haben und wieder gebraucht werden, sobald ein Baum
sortiert werden muss.

### `git add -p` gibt es hier nicht — über den Index stagen

Interaktive Git-Flags sind in dieser Umgebung gesperrt. Für Teil-Commits einer Datei:

```bash
blob=$(git hash-object -w <datei-mit-gewuenschtem-zwischenstand>)
git update-index --add --cacheinfo 100644,$blob,<zielpfad>
```

Das stagt beliebigen Inhalt, **ohne den Arbeitsbaum anzufassen**. Ergänzend:
`git update-index --force-remove <pfad>` stagt eine Löschung, ohne die Datei zu löschen.

Der Nebeneffekt ist der eigentliche Gewinn: **der Arbeitsbaum blieb die ganze Zeit im
verifizierten Endzustand.** Kein Zwischenschritt konnte etwas zerstören; das angelegte
Backup wurde nie gebraucht. Und es löste ein Problem, das sonst blockiert hätte — der
Index war schon vor Beginn nicht leer (ein Rename lag gestaged) und die alten Pfade waren
physisch weg.

### Zwischenstände in Wegwerf-Worktrees prüfen

```bash
git worktree add --detach -q "$WT" "$SHA"
ln -s <repo>/node_modules "$WT/node_modules"   # kein zweites npm install
( cd "$WT" && npx tsc --noEmit && CI=1 npx jest --silent )
git worktree remove --force "$WT"
```

Prüft einen beliebigen Commit, ohne den Hauptbaum zu berühren. **Achtung bei
Parallelbetrieb:** zwei solche Prüfer gleichzeitig stören sich — einer räumte den
Worktree des anderen weg, weil er ihn für verwaist hielt, und zwei gleichzeitige
Jest-Instanzen erzeugten Test-Flakiness, die es ohne die Doppellast nicht gibt. Entweder
seriell laufen lassen, oder die Aufräum-Erlaubnis strikt auf eigene Labels begrenzen.

---

## 5. Vier Fehler im Plan, die erst die Ausführung fand

Alle vor dem Commit gefangen, alle durch Nachprüfen statt Vertrauen. Sie stehen hier,
weil dieselbe Sorte Fehler in jeder folgenden Phase lauert.

1. **`generate/route.ts` importierte ein Modul aus der Zukunft.** Der Plan gab die Datei
   an C6; sie importiert `checkRateLimit` aus `@/lib/rate-limit`, das erst C9 anlegt.
   **C6 wäre nicht kompilierbar gewesen.** Bei `f880389` gab es diesen Import nicht.
2. **Die `vace`-Tests hätten C7 rot gemacht.** `generate/route.test.ts` brauchte **drei**
   Zwischenstände statt zwei: 202-Hunks → vace-Hunks → Rate-Limit-Hunks.
3. **`translations.ts` brauchte einen Split, den der Plan nicht kannte** — die vier
   `generation.*`-Schlüssel gehören zu C13, liegen aber im selben Hunk wie die
   `research.depth.*`-Schlüssel von C12.
4. **`MobileOptionsMenu` brauchte umgekehrt gar keinen** — der Plan hatte einen erfunden.
   Ihr Diff besteht ausschliesslich aus dem `FEATURES.compose`-Wächter.

Dazu zwei Fehler von Analyse-Agenten, beide durch eigene Prüfung entkräftet: einer meldete
„keine Reihenfolge-Brüche", obwohl Fund 1 vorlag; ein anderer ordnete die vace-Tests
falsch zu mit der Begründung, `vace` sei schon vorher abgeschaltet gewesen — es steht bei
`f880389` auf `enabled: true`.

**Die Lehre ist dieselbe wie im August:** gegen die Wirklichkeit prüfen, nicht gegen eine
Beschreibung — auch wenn die Beschreibung von einem Werkzeug kommt, das gerade
nachgeschaut hat.

---

## 6. Befunde für die einzelnen Phasen

Das ist der Teil, der dich betrifft.

### Für Phase 2 — Create-Identität
- **`chat.placeholder.visualizeWith` existiert nur im EN-Block**, im DE-Block fehlt der
  Schlüssel. Schon vor Phase 0 so, nicht durch die Aufteilung entstanden.
- **`chat.with` und `chat.placeholder.visualizeWith` haben keinen Konsumenten** in `src/`.
  Toter oder vorgezogener Text. Beim Anfassen der Übersetzungen mitentscheiden.

### Für Phase 3 — Modellwahrheit
- **Pruna ist BYOP-only, und das ist so gewollt** (bestätigt vom Nutzer am 2026-08-28).
  In der Vercel-Umgebung liegt kein `PRUNA_API_KEY` und soll auch keiner liegen — jeder
  Lauf kostet Geld, also bringt jeder seinen eigenen Schlüssel mit. Für **Pollinations**
  liegt dagegen ein Server-Key bereit, weshalb die freien Modelle dort ohne Zutun laufen.
  **Für die Modellwahrheit heisst das:** „verfügbar" hat zwei Stufen — ohne Schlüssel nur
  die freien Pollinations-Modelle, mit Schlüssel zusätzlich die schlüsselpflichtigen und
  die gesamte `p-*`-Familie. Die Flags `isFree` und `byopVisible` bilden genau diese zwei
  Stufen ab; sie müssen dazu aber stimmen (siehe Registry-Drift).
- VACE ist seit C7 `enabled: false` **und** `byopVisible: false`. Bewusst abgeschaltet,
  nicht gelöscht — Mapping, Schema und Enhancement-Prompt liegen unberührt weiter.
  **Nicht versehentlich reaktivieren.**
- `buildPrunaEntries()` liest seit C7 `enabled`. Der Bug, der abgeschaltete Pruna-Modelle
  weiter anzeigte, ist weg.

### Für Phase 4 — Fehlerklarheit und Laufstabilität
Fünf konkrete Fundstellen, alle live oder mechanisch belegt:
- **Die 503-Meldung nennt einer Endnutzerin eine Server-Umgebungsvariable:**
  `"Model wan-i2v requires PRUNA_API_KEY which is not set"`. Der Zustand dahinter ist
  richtig (Pruna ist BYOP-only), die Formulierung ist es nicht — sie müsste sagen, dass
  für dieses Modell ein eigener Pruna-Schlüssel nötig ist, und den Weg zu den
  Einstellungen zeigen. Musterfall für diese Phase.
- **`/api/pollen/polly` hat keinen Aufrufer im Frontend** — nur Tests referenzieren die
  Route. Klären, ob sie bleibt.
- **Der Kommentar in `src/lib/rate-limit.ts` ist irreführend.** Er nennt
  „App Hosting (maxInstances: 1)" als den Fall, in dem das Limit hart greift — die App
  läuft auf Vercel, wo es pro Instanz weich ist. Bewusst nicht korrigiert (Phase 0 schrieb
  keinen neuen Code).
- **`_resetRateLimitForTesting()` fehlt im `beforeEach` von fünf Routen-Suiten**
  (`chat/completion`, `compose`, `polly`, `stt`, `tts`). Kein Cross-File-Risiko — Jest
  isoliert pro Datei — aber intra-file fragil: `compose` hat Limit 10 und bereits 7 POSTs
  in einer Datei. Der nächste Testfall dort kippt.
- **Die CSP steht auf Report-Only.** Sie sammelt Verstösse, blockiert nichts. Vor dem
  Scharfschalten müssen die Meldungen ausgewertet werden.
- Weiterhin offen aus dem 26.08.: der 403 auf `/api/pollen/account`, der dritte Zustand
  für die Statuslampe, `predictionId` übersteht keinen Reload, keine Fortschrittsanzeige,
  `vercel.json` ohne `maxDuration`, und **`CLAUDE.md` kennt das 202-Protokoll immer noch
  nicht** (bewusst nicht ergänzt, siehe Ruling R-6).

### Für Phase 6 — Create auf dem Telefon
- **`MobileOptionsMenu.tsx` ist verwaist, aber absichtlich behalten.** Sie wurde im
  Chat-Input-Umbau gepflegt *und* abgeklemmt; ihr Ersatz `UnifiedMobileDrawer` hat **keine
  Sektion für Antwortstil, Stimme und Sprechtempo**. Ob die Sidebar das auf dem Telefon
  auffängt, ist **die offene Frage, die über das Löschen entscheidet**.
  Der Code spricht dafür (der Sidebar-Button in `AppLayout.tsx:327` hat keine
  Versteck-Klasse, `AppSidebar` ist `w-[90vw] sm:w-80 md:w-72`) — aber das ist aus dem
  Code geschlossen, nicht gesehen. **Auf einem echten Gerät prüfen, dann entscheiden.**

### Für Phase 7 — Chat entschlanken
- **C12 hat bereits ein Stück vorweggenommen:** `VisualizeInlineHeader` verlor die
  Quality/Resolution-Auswahl und die drei Modell-Sonderfall-Flags.
- **Folge davon: `useUnifiedImageToolState` liefert `isGptImage`, `isSeedream` und
  `isNanoPollen` weiterhin ins Leere** (Zeilen 120–122 und 474–476). Niemand liest sie
  mehr ausser einer Test-Fixture. Bewusst nicht aufgeräumt — gehört hierher.

### Für Phase 9 — ASCII im Create
- Die Bausteine stehen und sind verdrahtet (`AsciiSpinner` in vier Dateien). Was fehlt,
  ist der Flow-Effekt der Startseite im Create, nicht die Komponente.

---

## 7. Rulings — Entscheidungen, die ohne Rückfrage fielen

Alle nach **einem** Prinzip: *Phase 0 committet, was im Baum liegt. Sie schreibt keinen
neuen Code und löscht nichts zusätzlich.* Einzige Ausnahme ist R-0.

| # | Entscheidung | Kosten, falls falsch |
|---|---|---|
| R-0 | `.superpowers/` in `.gitignore` — der Arbeitsordner hätte den Baum verschmutzt | eine Zeile |
| R-1 | Vorbestehenden toten Code löschen (`PersonalizationTool`, `useAssetPrecache`, `useBlobUrl`) | Revert eines isolierten Commits |
| R-2 | `ComposeTool.tsx` löschen; Wiederherstellung in der Botschaft notiert | eine `git show`-Zeile |
| R-3 | **`MobileOptionsMenu` behalten statt löschen** | eine tote Datei bleibt einen Zyklus |
| R-4 | Verwaiste Props nicht aufräumen (→ Phase 7) | drei tote `const` |
| R-5 | API-Härtung committen; irreführenden Kommentar nicht korrigieren | Revert von C9, 15 Dateien |
| R-6 | `CLAUDE.md` nicht über den Baum hinaus ergänzen (→ Phase 4) | Doku verschweigt das 202-Protokoll länger |
| R-7 | Über den Index committen statt den Baum wandern zu lassen | hat gehalten |
| R-8 | Sechster Split (`generate/route.ts` + Test) | hat gehalten |
| R-9 | Fehlende `_resetRateLimitForTesting` nicht ergänzen (→ Phase 4) | ein künftiger Testfall kippt sichtbar |
| R-10 | `next-env.d.ts` nach C1 | null, autogeneriert |
| R-11 | `MobileOptionsMenu` ohne Split, ganz nach C11 | — |
| R-12 | Siebter Split (`translations.ts`) | hat gehalten |
| R-13 | Zwei konsumentenlose Übersetzungsschlüssel nach C12 (→ Phase 2) | Schlüssel im falschen Commit |
| R-14 | Drei Zwischenstände für `route.test.ts` statt zwei | hat gehalten |

### Kleinigkeiten, bewusst liegengelassen
- Die C3-Botschaft sagt im Präsens „AsciiSignature wird vom Inline-Moduswechsel genutzt" —
  `InlineModeSwitch` entsteht aber erst in C12. Nicht korrigiert: das hiesse Historie
  umschreiben, und `git rebase -i` ist hier gesperrt.
- Die C9-Botschaft zählt die Rate-Limits auf, nennt `generate` 20/min aber nicht mit.
- `chat-media-intent.test.ts` und `playground.e2e.test.tsx` schwankten unter künstlicher
  Doppellast. Ohne sie: 5 serielle und 3 volle parallele Läufe, alle grün. Latentes
  Risiko unter CI-Last, nicht weiter untersucht.

---

## 8. Was aus Phase 0 offen blieb

Vier Prüfungen brauchen einen Browser und wurden **nicht** durchgeführt — sie sind offen,
nicht erledigt:

1. **Kein Compose-Badge** in der Eingabeleiste, Desktop *und* Telefon (P8).
2. **Pollen-Key-Feld** zeigt den Schlüssel beim **ersten** Öffnen nach einem Reload (C8).
3. **Pruna-Videolauf über das 202-Protokoll.** Von aussen nicht prüfbar, weil
   `PRUNA_API_KEY` serverseitig fehlt — es geht nur aus dem Browser mit dem BYOP-Schlüssel.
   Vorgehen: erst mit `https://invalid.invalid/x.jpg` als Referenz (kostenlos, prüft 202
   und Polling), dann **genau ein** echter `wan-t2v`, 5 s, `go_fast` (~45 s gemessen).
   **Nicht `vace`** — 348 bis 700 s gemessen, zehnfacher Preis für denselben Beweis.
   Pruna hat keinen Cancel-Endpunkt.
4. **Antwortstil, Stimme, Sprechtempo auf dem Telefon** — entscheidet über R-3.

Die Intent-Erkennung (P9) gilt als **zur Hälfte** bestätigt: der Modellteil ist live
belegt, die vollständige Kette im Browser nicht.

---

## 9. Für den nächsten Thread

1. `HANDOFF.md` lesen — jetzt aktuell.
2. Dieses Dokument für die Befunde deiner Phase (Abschnitt 6).
3. [`FAHRPLAN-create.md`](FAHRPLAN-create.md) für Ziel und Reihenfolge deiner Phase.
4. `AGENTS.md` für den Arbeitsablauf, `CLAUDE.md` für die Laufzeitwahrheit —
   **ausser Modell-Listen**, die sind weiterhin gedriftet (Phase 3).
5. Der Plan deiner Phase liegt möglicherweise schon: `docs/PLAN-phase-*.md`. Sie wurden
   parallel geschrieben und planten gegen `f880389` **plus offenen Arbeitsbaum**. Dieser
   Zustand existiert nicht mehr — **prüfe die Annahmen deines Plans gegen `aa3eac4`,
   bevor du ihn ausführst.** Wo ein Plan „liegt uncommitted im Baum" sagt, meint er
   heute einen der sechzehn Commits.
