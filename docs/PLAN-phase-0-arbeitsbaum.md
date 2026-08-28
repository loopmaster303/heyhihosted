# Implementierungsplan — Phase 0: Arbeitsbaum konsolidieren

**Datum:** 2026-08-27
**Branch:** `main`, HEAD `f880389` (synchron mit `origin/main`)
**Art:** Plan. **Kein Code geschrieben, nichts committet, nichts gepusht.**
**Grundlage:** `AGENTS.md`, `HANDOFF.md`, `docs/HANDOFF-2026-08-27-fahrplan.md` (Abschnitt 5.1
und 6), `docs/HANDOFF-2026-08-26-pruna-video.md`, `docs/FAHRPLAN-create.md`, `CLAUDE.md` —
plus eine **eigene Inventur des Arbeitsbaums**, die an mehreren Stellen von Abschnitt 5.1
abweicht (siehe Abschnitt 2).

Dies ist AGENTS.md Phase 1 bis 3. **Phase 4 beginnt erst nach ausdrücklicher Freigabe.**

---

## 1. Ziel

Der offene Arbeitsbaum wird in **sechzehn thematisch getrennte, jeweils für sich grüne
Commits** überführt, gepusht und live gegen `chat.hey-hi.cloud` verifiziert — ohne dass eine
Löschung ungeprüft durchgeht.

### 1.1 Fertig-Kriterien des Fahrplans, in prüfbare Schritte übersetzt

Der Fahrplan sagt: *„`lint`, `typecheck`, `npm test`, `npm run build` grün · gepusht · Chat und
Playground live erreichbar · Intent-Erkennung im Live-Chat bestätigt."* Das ist als Endzustand
richtig, aber zu grob: es ließe sich mit einem einzigen Block-Commit erfüllen, wovor der
Handoff vom 2026-08-26 ausdrücklich warnt. Übersetzt:

| # | Kriterium | Prüfung | Beweis |
|---|---|---|---|
| **F1** | Der Baum ist leer | `git status --porcelain` gibt nichts aus | Konsolenausgabe |
| **F2** | Jeder einzelne Commit ist grün, nicht nur der Endstand | für jeden Commit: `git stash -u` auf den Nachfolger verzichten, stattdessen nach jedem `git commit` die vier Tore laufen lassen (Abschnitt 6) | vier Ausgaben je Commit |
| **F3** | Die vier Tore am Endstand grün | `npm run lint`, `npm run typecheck`, `CI=1 npm test`, `npm run build` | 780+ Tests, 0 Fehler |
| **F4** | Gepusht | `git push origin main`, danach `git status -sb` zeigt `main...origin/main` ohne `ahead` | Konsolenausgabe |
| **F5** | Vercel-Deploy erfolgreich | Deployment zum Push-Commit ist `Ready`, nicht `Error` | Deploy-Status |
| **F6** | Chat live erreichbar | `chat.hey-hi.cloud` lädt, eine Textnachricht bekommt eine Antwort | Screenshot / Nutzerbestätigung |
| **F7** | Create live erreichbar | `chat.hey-hi.cloud/playground` lädt, ein `flux`-Bild entsteht | Screenshot / Nutzerbestätigung |
| **F8** | **P9** — Intent-Erkennung live bestätigt | im Live-Chat „mal mir eine Katze" ohne Visualize-Modus → es entsteht ein Bild | Screenshot |
| **F9** | **P8** — Chat ohne Compose live bestätigt | im Live-Chat ist kein Compose-Badge sichtbar, weder Desktop noch Telefon | Screenshot |
| **F10** | Pollen-Key-Feld live bestätigt | Einstellungen öffnen: das Feld zeigt den gespeicherten Schlüssel **nach dem ersten Öffnen**, nicht erst nach erneutem Öffnen | Screenshot |
| **F11** | Ein echter Pruna-Videolauf über das 202-Protokoll | `wan-t2v`, 5 s, `go_fast` → `202` mit `predictionId`, dann `200` mit `videoUrl` | Netzwerk-Log |
| **F12** | Jede Löschung ist entschieden, nicht durchgerutscht | Abschnitt 4 hat für jede der sieben Löschungen ein „ja" des Nutzers | dieser Plan, abgehakt |

**Nicht Teil der Fertig-Kriterien:** dass der Arbeitsbaum inhaltlich *richtig* ist. Phase 0
bringt den Stand in eine nachvollziehbare Form und bestätigt ihn live — sie korrigiert keine
Modellisten (Phase 3), keine Fehlermeldungen (Phase 4) und keine Mobil-Bedienung (Phase 6).

---

## 2. Befund: der Arbeitsbaum, selbst inventarisiert

`git status --porcelain` zählt **99 Dateien**: 62 geändert, 5 gelöscht, 2 umbenannt-und-geändert,
30 neu. Der Handoff nennt „65 geänderte und rund 20 neue" — die Zahl der **neuen** Dateien ist
um die Hälfte höher als dort angenommen.

### 2.1 Was Abschnitt 5.1 des Handoffs korrekt zuordnet

Die Pruna-Gruppe vom 2026-08-26 stimmt vollständig und ist im Sitzungs-Handoff dieser Sitzung
je Datei begründet. Der Chat-Input-Umbau, der Settings-Umzug, `src/components/ascii/`,
`src/lib/rate-limit.ts`, `src/config/features.ts` und die sechs Löschungen sind ebenfalls
korrekt genannt.

### 2.2 Was Abschnitt 5.1 **nicht** erfasst — fünf Lücken

Diese fünf Gruppen liegen im Baum, tauchen in der Herkunftszuordnung aber nirgends auf. Wer
nur nach 5.1 committet, hinterlässt sie unsortiert.

**Lücke A — API-Härtung, neun Routen.** `src/lib/rate-limit.ts` ist in 5.1 als einzelne neue
Datei gelistet. Verdrahtet ist es in `chat/completion`, `chat/title`, `compose`,
`enhance-prompt`, `polly`, `stt`, `tts` — dazu kommen im selben Zug: Body-Größenlimits über
`readBodyWithLimit`, echte Zod-Schemas statt `z.array(z.any())` in `chat/completion`,
`chat/title` und `polly`, ein Content-Type-Wächter in `pruna/upload`, und in
`chat/completion`, `media/upload` und `server-media-ingest.ts` die Umstellung von
„Upstream-Fehlertext an den Client" auf „Text ins Log, Status an den Client". Dazu die
Security-Header in `next.config.ts` (inklusive einer CSP im **Report-Only**-Modus). Das sind
rund fünfzehn Dateien, die zusammengehören und in 5.1 fehlen.

**Lücke B — Runtime-Kontext im Systemprompt.** `src/lib/chat/chat-prompt-builder.ts` bekommt
`buildRuntimeContext()`: echtes Datum, lokale Uhrzeit und Zeitzone werden in den Systemprompt
injiziert, damit das Modell „heute" und „aktuell" nicht gegen seinen Trainingsstand rechnet.
Ein eigenständiges Feature, in keinem Handoff erwähnt.

**Lücke C — Neulauf-Streifen unter Ergebniskarten.** `GenerationControlStrip` steht in 5.1 als
neue Datei, aber nicht der Rattenschwanz: `src/types/index.ts` bekommt `GenerationRecord` und
`GeneratedMediaMetadata`, `chat-send-coordinator.ts` und `chat-send-orchestrator.ts` hängen den
Lauf-Zustand ans Ergebnis, `ChatView` und `MessageBubble` reichen `onRerunGeneration` durch,
`ChatInterface` baut daraus einen Neulauf.

**Lücke D — Schriftumbau.** `tailwind.config.ts` stellt `font-body` von Monospace auf IBM Plex
Sans um, `layout.tsx` lädt die Schrift, `globals.css` sichert `code, pre, kbd, samp` auf
Monospace. **`CLAUDE.md` beschreibt diesen Umbau unter „Schriftregel" bereits als am
2026-08-22 erfolgt** — der Code dazu ist bis heute nicht committet. Die Doku beschreibt einen
Zustand, den `origin/main` nicht hat.

**Lücke E — Registry-Refactor und neue Tests.** `pollinations-registry.ts` gibt Fetch und Cache
an das bereits committete `pollinations/image-model-registry.ts` ab. Dazu sechs komplett neue
Testdateien ohne zugehörige Produktivänderung: `chat-options.test.ts`, `useChatState.test.tsx`,
`blob-manager.test.ts`, `stt/route.test.ts`, `upload/content-type-policy.test.ts`,
`upload/reference-utils.test.ts`.

### 2.3 Was Abschnitt 5.1 falsch darstellt

**ASCII ist bereits verdrahtet.** 5.2 und Phase 9 behaupten, `src/components/ascii/` sei „im
Playground nicht verdrahtet". Tatsächlich importiert `AsciiSpinner` schon heute:
`src/components/ui/PageLoader.tsx`, `src/components/chat/ChatInput.tsx`, `InlineModeSwitch.tsx`
und **`src/components/playground/Gallery.tsx`**. Was fehlt, ist der ASCII-*Flow* der
Startseite — nicht die Komponente. Folge für diesen Plan: `src/components/ascii/` ist eine
**harte Abhängigkeit** von drei anderen Commits und muss früh kommen.

**Der Zustand ist besser als angenommen.** Der Gesamtbaum ist heute in allen vier Toren grün —
selbst geprüft, nicht aus einem Handoff übernommen:

```
npm run typecheck   → sauber
npm run lint        → sauber
CI=1 npm test       → 106 Suites, 780 Tests, alle grün
npm run build       → erfolgreich, alle Routen gebaut
```

Das Risiko dieser Phase ist damit **nicht** der Endzustand, sondern die Zwischenzustände: eine
Aufteilung in sechzehn Commits erzeugt fünfzehn Stände, die es so noch nie gab.

---

## 3. Blueprint: die Commit-Aufteilung

Sechzehn Commits, in dieser Reihenfolge. Die Reihenfolge ist nicht kosmetisch — sie ist so
gewählt, dass jeder Commit nur auf Vorgänger baut und für sich grün bleibt.

Fünf Dateien tragen Hunks aus mehreren Themen und müssen mit `git add -p` geteilt werden. Sie
sind unten mit **⚠ Hunk-Split** markiert.

| # | Commit | Dateien | Warum eigener Commit |
|---|---|---|---|
| **C1** | `chore(deps): next-themes ist eine Laufzeitabhängigkeit` | `package.json` | `next-themes` lag unter `devDependencies`, wird aber zur Laufzeit gebraucht. Ein Produktions-Install ohne Dev-Abhängigkeiten hätte den Build gerissen. Isolierter Fix, gehört an den Anfang, weil alle folgenden Build-Prüfungen darauf stehen. |
| **C2** | `feat(ui): zweischriftig — Proportional fürs Gesprochene, Monospace fürs Maschinelle` | `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/globals.css` **⚠ Hunk-Split** (nur der `code, pre, kbd, samp`-Block) | `CLAUDE.md` dokumentiert diesen Umbau seit dem 2026-08-22 als erfolgt. Solange er nicht committet ist, widerspricht die Doku dem Code. Eigener Commit, weil er jede Oberfläche betrifft und ein Rückzug sonst zwölf andere Commits mitnähme. |
| **C3** | `feat(ui): ASCII-Bausteine für Spinner und Signatur` | `src/components/ascii/` (3 Dateien), `src/components/ui/PageLoader.tsx`, `src/components/playground/Gallery.tsx` | Harte Abhängigkeit von C11 und C12. `PageLoader` und `Gallery` tragen nur den Spinner-Tausch, sonst nichts — deshalb ganz hier. |
| **C4** | `feat(chat): Systemprompt kennt Datum, Uhrzeit und Zeitzone` | `src/lib/chat/chat-prompt-builder.ts`, `src/lib/chat/__tests__/chat-prompt-builder.test.ts`, `src/lib/chat/__tests__/sendMessage.contract.test.ts` | Lücke B. Eigenständiges Feature ohne Bezug zum Input-Umbau; berührt den Systemprompt, den `HANDOFF.md` als „bewusst nicht angefasst" führt — deshalb sichtbar isoliert. |
| **C5** | `fix(pruna): Payloads gegen die echten Modell-Schemas` | `src/config/pruna-models.ts`, `src/lib/playground/param-schema.ts`, `src/config/__tests__/pruna-models.test.ts` | Erste Gruppe, im Handoff vom 2026-08-26 je Feld begründet. Steht vor C6, weil das 202-Protokoll auf gültigen Payloads aufsetzt. |
| **C6** | `feat(generate): lange Läufe antworten 202, der Browser fragt zu Ende` | `src/lib/pruna/client.ts` + `client.test.ts`, `src/lib/pruna/deliver.ts`, `src/app/api/pruna/status/`, `src/lib/generation/`, `src/app/api/generate/route.ts` + `route.test.ts`, `src/lib/services/chat-service.ts`, `src/app/playground/PlaygroundShell.tsx` **⚠ Hunk-Split** (nur die `requestGeneration`-Hunks) | Das Protokoll ist eine Einheit: Server-Dispatch, Statusroute, geteilte Auslieferung und Client-Polling. Zerlegt man es weiter, entsteht ein Zwischenstand, in dem `/api/generate` mit `202` antwortet und niemand nachfragt. |
| **C7** | `chore(models): VACE ausblenden, Playground liest `enabled`` | `src/config/unified-image-models.ts`, `src/lib/playground/model-source.ts` + `model-source.test.ts`, `src/config/__tests__/model-invariants.test.ts`, `src/lib/services/__tests__/chat-service.test.ts` | Bewusste Abschaltung, kein Löschen — muss als solche erkennbar bleiben, damit Phase 3 sie nicht versehentlich reaktiviert. Der `chat-service.test.ts`-Hunk gehört hierher (VACE bekommt `frame-backed-seconds`), nicht zu C6. |
| **C8** | `fix(settings): Pollen-Key-Feld füllt sich beim ersten Öffnen` | Rename `src/components/playground/SettingsDialog.tsx` → `src/components/settings/SettingsPopover.tsx` (+ Test), `src/hooks/usePollenKey.ts`, `src/app/playground/PlaygroundShell.tsx` **⚠ Hunk-Split** (nur Import und Verwendung) | Der Umzug aus `playground/` nach `settings/` und der Bugfix hängen zusammen: die Einstellungen sind nicht playground-spezifisch, beide Oberflächen nutzen denselben Hook und denselben Schlüssel. |
| **C9** | `feat(api): Rate-Limit, Größengrenzen, echte Schemas, keine Upstream-Details nach außen` | `src/lib/rate-limit.ts` + `rate-limit.test.ts`, `next.config.ts`, `src/app/api/chat/completion/route.ts`, `chat/title/route.ts`, `compose/route.ts`, `enhance-prompt/route.ts` + `route.test.ts`, `pollen/polly/route.ts` + `route.test.ts`, `stt/route.ts` + `route.test.ts` *(neu)*, `tts/route.ts`, `media/upload/route.ts` + `route.test.ts`, `pruna/upload/route.ts`, `src/lib/media/server-media-ingest.ts`, `src/lib/upload/content-type-policy.test.ts` *(neu)* | Lücke A. Eine kohärente Härtungssitzung: Missbrauchsdämpfung, Größengrenzen, Payload-Validierung und Fehler-Sanitisierung. Sie fasst kein Produktverhalten an und muss deshalb einzeln zurücknehmbar sein — siehe die Vorbehalte in Abschnitt 5. |
| **C10** | `refactor(registry): Fetch und Cache liegen zentral` | `src/lib/pollinations-registry.ts`, `src/lib/pollinations-registry.test.ts` | Reiner Refactor ohne Verhaltensänderung. Getrennt, weil Phase 3 genau dieses Modul anfasst und dann sehen können muss, was Refactor war und was nicht. |
| **C11** | `chore(compose): Einstieg hinter ein Feature-Flag` | `src/config/features.ts`, `src/components/chat/input/ToolsBadges.tsx` **⚠ Hunk-Split** (nur die `FEATURES`-Hunks) | **P8.** Das ist der Commit, den F9 live bestätigt. Er muss allein stehen, damit ein Zurückdrehen ein Ein-Zeilen-Revert ist. Zu `MobileOptionsMenu.tsx` siehe Befund 4.7 — **offene Entscheidung**. |
| **C12** | `feat(chat): Eingabeleiste umgebaut — Inline-Modi, Modell- und Parameterwahl` | `src/components/chat/ChatInput.tsx` + `ChatInput.test.tsx`, `src/components/ui/unified-input.tsx`, `src/components/chat/input/ModelSelector.tsx`, `InlineModeSwitch.tsx`, `ImageModelOptions.tsx`, `ImageParamOptions.tsx`, `ModelLogo.tsx`, `ResearchDepthBadges.tsx` + Test, **Löschung** `QuickSettingsBadges.tsx`, `src/components/tools/visualize/VisualizeInlineHeader.tsx` + Test, `src/hooks/useChatInputLogic.ts`, `src/components/page/LandingView.tsx`, `src/components/page/ChatInterface.tsx` **⚠ Hunk-Split** (ohne `handleRerunGeneration`), `src/config/translations.ts`, `src/app/globals.css` **⚠ Hunk-Split** (nur `border-spin` und `mode-option-in`) | Der große, undokumentierte Umbau. Er ist in sich geschlossen — `QuickSettingsBadges` war bei `f880389` in `ChatInput` verdrahtet, seine Löschung gehört zwingend hierher. Weiter aufteilen geht nicht ohne einen Stand, in dem die Leiste halb umgebaut ist. |
| **C13** | `feat(chat): Neulauf-Streifen unter Ergebniskarten` | `src/components/chat/GenerationControlStrip.tsx` + Test, `src/types/index.ts`, `src/components/chat/MessageBubble.tsx`, `src/components/chat/ChatView.tsx`, `src/lib/chat/chat-send-coordinator.ts`, `src/lib/chat/chat-send-orchestrator.ts`, `src/components/page/ChatInterface.tsx` **⚠ Hunk-Split** (nur `handleRerunGeneration` und seine Verdrahtung) | Lücke C. Trennbar von C12, weil es eigene Dateien plus einen klar abgegrenzten Datenpfad hat (`GenerationRecord` vom Lauf ans Ergebnis). Enthält nebenbei einen echten Fix: der Koordinator nahm bisher `input.selectedImageModelId` statt `imageConfig.selectedModelId` — die Modellwahl in der Leiste wirkte nicht. |
| **C14** | `test: Abdeckung für Kernbausteine ohne Tests` | `src/config/chat-options.test.ts`, `src/hooks/useChatState.test.tsx`, `src/lib/blob-manager.test.ts`, `src/lib/upload/reference-utils.test.ts` | Lücke E. Reine Testzugänge ohne Produktivänderung. Getrennt, damit sie beim Bisect nicht mit Verhaltensänderungen verwechselt werden. |
| **C15** | `chore: toten Code entfernen` | **Löschungen** `src/components/tools/PersonalizationTool.tsx`, `src/components/tools/ComposeTool.tsx`, `src/hooks/useAssetPrecache.ts`, `src/hooks/useBlobUrl.ts` | Alle vier waren **schon bei `f880389` referenzfrei** — vorbestehender toter Code, nicht Folge dieses Umbaus. Deshalb eigener Commit und **offene Entscheidung**, siehe 4.3 bis 4.6. |
| **C16** | `docs: Fahrplan, Handoffs und Wahrheitsdokumente nachziehen` | `CLAUDE.md`, `README.md`, `HANDOFF.md`, `docs/README.md`, `docs/FAHRPLAN-create.md`, `docs/HANDOFF-2026-08-26-pruna-video.md`, `docs/HANDOFF-2026-08-27-fahrplan.md`, `docs/PROMPTS-phasen.md`, **alle `docs/PLAN-phase-*.md`** | Die vier Wahrheitsdokumente beschreiben den Endzustand. Sie zuletzt zu committen heißt: sie beschreiben etwas, das im selben Push tatsächlich existiert. **Achtung:** Die Phasen 1–9 werden parallel in eigenen Sessions geplant und legen laufend weitere `docs/PLAN-phase-*.md` ab. Vor C16 den Baum neu inventarisieren (`git status --porcelain \| grep PLAN`) und alle vorhandenen aufnehmen — sonst bleiben sie liegen. |

### 3.1 Die Hunk-Splits im Einzelnen

> **Korrektur vom 2026-08-28, aus der Ausführung.** Es sind **sieben** Splits, nicht fünf,
> und einer der ursprünglich gelisteten ist keiner:
>
> - **Neu: `src/app/api/generate/route.ts` und `route.test.ts`.** Sie importieren
>   `checkRateLimit` bzw. `_resetRateLimitForTesting` aus `@/lib/rate-limit` — einer Datei,
>   die erst **C9** anlegt. Bei `f880389` gab es diesen Import nicht. Ohne Split wäre **C6
>   nicht kompilierbar**. Das ist der schwerste Fehler des ursprünglichen Zuschnitts.
> - **Neu: `src/config/translations.ts`.** Die vier `generation.*`-Schlüssel werden
>   ausschließlich von `GenerationControlStrip` (**C13**) gelesen, liegen aber im selben
>   Hunk wie die `research.depth.*`-Schlüssel (**C12**).
> - **Entfällt: `src/components/chat/input/MobileOptionsMenu.tsx`.** Ihr Diff enthält
>   ausschließlich den `FEATURES.compose`-Wächter. Kein Split — die Datei geht ganz nach C11.
>
> Ebenfalls aus der Ausführung: **`git add -p` ist in dieser Umgebung nicht verfügbar**
> (interaktive Flags sind gesperrt), und der **Index war schon vor Beginn nicht leer** — der
> Rename `SettingsDialog → SettingsPopover` lag gestaged, die alten Pfade sind im Baum
> physisch weg. Beides zusammen macht das unten beschriebene Vorgehen unbrauchbar. Ersetzt
> durch: Staging über den Index (`git hash-object -w` + `git update-index`), ohne den
> Arbeitsbaum je zu verändern. Der Baum bleibt damit durchgehend im verifizierten
> Endzustand, und Kriterium F2 wird nach den Commits in isolierten `git worktree`s geprüft
> statt im Hauptbaum.

### Die ursprünglich benannten fünf Splits

| Datei | Commit A | Commit B |
|---|---|---|
| `src/app/globals.css` | **C2**: `code, pre, kbd, samp { font-family: theme('fontFamily.mono') }` | **C12**: `@keyframes border-spin`, `.animate-border-spin`, `@keyframes mode-option-in`, `.mode-option-in` samt beider `prefers-reduced-motion`-Blöcke |
| `src/app/playground/PlaygroundShell.tsx` | **C6**: `requestGeneration`-Import und der Ersatz des `fetch` in `startRun` | **C8**: `SettingsPopover`-Import und die beiden Verwendungsstellen |
| `src/components/page/ChatInterface.tsx` | **C12**: die entfallenen Props (`selectedResponseStyleName`, `handleStyleChange`, `selectedVoice`, `handleVoiceChange`, `selectedTtsSpeed`, `handleTtsSpeedChange`) und die Destrukturierung | **C13**: `handleRerunGeneration`, die beiden neuen Importe, `onRerunGeneration` an `ChatView` |
| `src/components/chat/input/ToolsBadges.tsx` | **C11**: `FEATURES`-Import und die Umklammerung des Compose-Badges | **C12**: die zwei Kontrast-Anpassungen `muted-foreground/50` → `/70` |
| `src/components/chat/input/MobileOptionsMenu.tsx` | **C11**: `FEATURES`-Umklammerung — **nur falls die Datei bleibt**, siehe 4.7 | entfällt bei Löschung |

Vorgehen je Split: `git add -p <datei>`, Hunks einzeln bestätigen, danach **vor dem Commit**
`git diff --cached <datei>` gegenlesen. Bei `globals.css` und `ChatInterface.tsx` liegen die
Hunks weit auseinander, das ist unkritisch; bei `ToolsBadges.tsx` liegen zwei Kontrastwerte
direkt neben der `FEATURES`-Umklammerung — dort ist `git add -e` verlässlicher als `-p`.

---

## 4. Befund und Empfehlung je gelöschter Datei

Sieben Löschungen. Für jede: was sie war, ob sie bei `f880389` noch benutzt wurde, ob die
Funktion ersetzt ist — und was daraus folgt. Die Prüfung lief über `git grep` gegen `f880389`
und gegen den Arbeitsbaum, nicht über Vermutung.

### 4.1 `src/components/chat/input/QuickSettingsBadges.tsx` (101 Zeilen)
**Befund:** Bei `f880389` in `ChatInput.tsx` an zwei Stellen eingebunden (Zeile 324 und 796)
plus ein Mock im Test. Im Arbeitsbaum keine Referenz mehr. Sie trug Antwortstil, Stimme und
TTS-Tempo in der Eingabeleiste. Diese drei Einstellungen sind weiterhin erreichbar über
`src/components/sidebar/PersonalizationSidebarSection.tsx` (Zeilen 126, 236, 254).
**Bewertung:** Absichtlich, konsistent, ersetzt. Teil des Umbaus.
**Empfehlung:** In **C12** committen. Keine Rückfrage nötig.
**Vorbehalt für die Live-Prüfung:** Auf dem Telefon ist die Sidebar der einzige verbliebene
Weg zu diesen drei Einstellungen — siehe 4.7 und Schritt L4.

### 4.2 `src/components/playground/SettingsDialog.tsx` → `src/components/settings/SettingsPopover.tsx`
**Befund:** Kein Löschen, ein Rename mit Änderung (`RM` in git status). Alle Aufrufstellen in
`PlaygroundShell.tsx` sind mitgezogen, der Test ist mit umbenannt und angepasst.
**Bewertung:** Absichtlich und vollständig. Der Ort ist der richtigere: die Einstellungen sind
nicht playground-spezifisch.
**Empfehlung:** In **C8** committen. Keine Rückfrage nötig.

### 4.3 `src/components/tools/PersonalizationTool.tsx` (404 Zeilen)
**Befund:** Bei `f880389` **von niemandem importiert** — nicht vom Umbau verwaist, sondern
schon vorher tot. Die Funktion lebt in `PersonalizationSidebarSection.tsx`.
**Bewertung:** Löschung sachlich richtig, aber **außerhalb des Auftrags** dieser Sitzungen.
`CLAUDE.md` sagt dazu: *„If you notice unrelated dead code, mention it — don't delete it."*
**Empfehlung:** In **C15** committen — **aber erst nach deiner Zustimmung.** → **Frage F-1**

### 4.4 `src/components/tools/ComposeTool.tsx` (189 Zeilen)
**Befund:** Ebenfalls bei `f880389` von niemandem importiert. Der Handoff behauptet, die
Compose-Entfernung bestehe aus `FEATURES.compose = false` **und** dieser Löschung — der zweite
Teil ist eine Fehlannahme: die Datei war schon vorher unerreichbar. Der wirksame Teil ist
allein das Flag. Der zugehörige Einstiegs-Header `src/components/tools/compose/ComposeInlineHeader.tsx`
bleibt bestehen und wird von `ChatInput` weiter importiert.
**Bewertung:** Löschung harmlos, aber sie beseitigt eine mögliche Vorlage für Phase 8 (Musik-UI
im Create). 189 Zeilen bestehende Musik-Oberfläche.
**Empfehlung:** **Zurückhalten** bis Phase 8 entschieden hat, ob die alte Oberfläche als
Ausgangspunkt taugt. Wiederholbar per `git show f880389:src/components/tools/ComposeTool.tsx`,
also kein echter Verlust — aber leichter gefunden, wenn die Datei noch da ist. → **Frage F-2**

### 4.5 `src/hooks/useAssetPrecache.ts` (50 Zeilen)
**Befund:** Bei `f880389` referenzfrei. Vorbestehender toter Code.
**Bewertung:** Löschung richtig, außerhalb des Auftrags.
**Empfehlung:** In **C15**, mit F-1 zusammen. → **Frage F-1**

### 4.6 `src/hooks/useBlobUrl.ts` (54 Zeilen)
**Befund:** Bei `f880389` referenzfrei. Er war der Vorgänger von `BlobManager`; `CLAUDE.md`
verlangt ausdrücklich, dass Blob-URLs über `src/lib/blob-manager.ts` laufen.
**Bewertung:** Löschung richtig und im Sinne der Regel — sie entfernt den zweiten Weg.
**Empfehlung:** In **C15**, mit F-1 zusammen. → **Frage F-1**

### 4.7 `src/components/chat/input/MobileOptionsMenu.tsx` — **nicht gelöscht, aber verwaist**

Das ist der klarste Beleg für „halber Umbau", und er steht in keinem Handoff.

**Befund:** Die Datei ist im Arbeitsbaum **geändert** (39 Zeilen, unter anderem der
`FEATURES.compose`-Wächter) — und zugleich **abgehängt**: `ChatInput.tsx` importiert sie nicht
mehr, sondern `UnifiedMobileDrawer`. Einzige verbliebene Referenz ist ihr eigener Test. Bei
`f880389` war sie verdrahtet.

`UnifiedMobileDrawer.tsx` ist **unverändert** und kennt keine Sektion für Antwortstil, Stimme
oder TTS-Tempo — `MobileOptionsMenu` hatte sie (Zeilen 313 und 351). Zusammen mit 4.1 heißt
das: **auf dem Telefon sind Antwortstil, Stimme und TTS-Tempo nach diesem Umbau nur noch über
die Sidebar erreichbar.** Ob das reicht, entscheidet die Live-Prüfung (Schritt **L4**), nicht
der Code.

Jemand hat eine Datei gepflegt, die er im selben Umbau abgeklemmt hat. Das ist entweder ein
vergessenes Aufräumen oder ein abgebrochener Rückweg.

**Empfehlung:** Nicht selbst entscheiden. Drei Wege:
1. **Löschen** (Datei + Test) und die `FEATURES`-Änderung darin verwerfen — sauberster Schnitt,
   falls der Drawer der beabsichtigte Ersatz ist.
2. **Behalten wie sie ist** — dann gehört ihr `FEATURES`-Hunk in C11 und die Datei bleibt als
   toter, aber gepflegter Code liegen. Schlechteste Variante.
3. **Wieder verdrahten**, falls der Drawer noch nicht fertig ist.
→ **Frage F-3**

### 4.8 Nebenbefund: verwaiste Props in `useUnifiedImageToolState`

Keine Löschung, aber vom selben Umbau erzeugt. `VisualizeInlineHeader` verliert die Props
`isGptImage`, `isSeedream`, `isNanoPollen` und die gesamte Quality/Resolution-Auswahl.
`src/hooks/useUnifiedImageToolState.ts` (Zeilen 120–122 und 474–476) berechnet und exportiert
die drei weiterhin — **konsumiert werden sie von niemandem mehr**, außer als Fixture in
`ChatInput.test.tsx`.

Nach `CLAUDE.md` (*„Remove imports/variables/functions that YOUR changes made unused"*) müsste
das mitgeräumt werden. Es ist damit **kein** vorbestehender toter Code, sondern von diesem
Umbau erzeugter.

**Empfehlung:** In **C12** mitaufräumen — drei `const` und drei Rückgabefelder, plus die
Fixture-Zeilen im Test. **Aber:** das Entfernen der Quality/Resolution-Auswahl greift
inhaltlich auf **Phase 7** („Visualize im Chat entschlanken") vor. Ob das gewollt ist, kann
ich nicht entscheiden. → **Frage F-4**

---

## 5. Reality Check (AGENTS.md Phase 3)

> *Führt das zu Spaghetti? Breche ich bestehende Hooks? Gibt es einen einfacheren Weg?*

### 5.1 Führt der Plan zu Spaghetti?

Nein — er entfernt keine Struktur, er beschreibt sie. Das Risiko liegt woanders: **fünfzehn
Zwischenstände, die es nie gegeben hat.** Der Gesamtbaum ist grün; ob es Commit 7 auch ist,
weiß niemand. Deshalb ist F2 ein Fertig-Kriterium und nicht eine Fußnote: nach *jedem* Commit
laufen alle vier Tore. Zeitaufwand rund 40 Sekunden je Commit, sechzehnmal.

### 5.2 Breche ich bestehende Hooks?

Der Plan schreibt keinen Code. Aber die Aufteilung erzeugt Abhängigkeiten, die brechen können.
Vier konkrete Wackelkandidaten, vorab benannt statt im Lauf entdeckt:

| Risiko | Warum | Gegenmittel |
|---|---|---|
| **C6 vor C7**: `chat-service.test.ts` erwartet für `vace` `frame-backed-seconds`, das erst C7 einführt | Test und Implementierung fallen auseinander — `chat-service.ts` gehört zu C6, sein Test zu C7 | Falls C6 rot wird: den `vace`-Hunk des Tests nach C6 vorziehen und im Commit benennen. **Nicht** die Reihenfolge tauschen — C7 braucht C5. |
| **C3 vor C12**: `ChatInput.tsx` importiert `AsciiSpinner` | wäre C3 später, bräche C12 | Reihenfolge wie geplant. C3 ist für sich grün, weil `PageLoader` und `Gallery` mitkommen. |
| **C11 vor C12**: `ToolsBadges.tsx` trägt Hunks aus beiden | in C11 muss die Datei mit dem alten Kontrastwert committet werden | `git add -e`, nicht `-p`. Nach C11 zeigt `git diff ToolsBadges.tsx` genau die zwei Kontrastzeilen — das ist die Kontrolle. |
| **C12 vor C13**: `ChatInterface.tsx` trägt Hunks aus beiden | nach C12 referenziert `ChatView` noch kein `onRerunGeneration` | Das ist unkritisch: `onRerunGeneration` ist optional (`?`). C12 bleibt grün. |

### 5.3 Gibt es einen einfacheren Weg?

Ja, zwei — beide schlechter:

**Ein Block-Commit.** Der Handoff vom 2026-08-26 warnt ausdrücklich davor, und der Grund ist
konkret: vier der Gruppen (C9 Härtung, C4 Runtime-Kontext, C2 Schrift, C12 Input-Umbau) haben
niemanden, der ihre Absicht bezeugt. Landen sie im selben Commit wie die dokumentierten
Pruna-Fixes, ist ein späterer Rückzug einer Gruppe nicht mehr möglich, ohne die anderen
mitzunehmen. Bei einer App, die live ist, ist genau das der teure Fall.

**Nach Dateipfad statt nach Thema aufteilen.** Schneller, aber es zerreißt genau die Einheiten,
die zusammen funktionieren müssen — das 202-Protokoll liegt in fünf Verzeichnissen.

### 5.4 Was am Plan unangenehm bleibt

Ehrlich benannt, damit es niemand für gelöst hält:

1. **C9 committet Sicherheitsverhalten, das niemand angefordert hat.** Fünfzehn Dateien,
   Rate-Limits auf sieben Routen, eine CSP. Der Rate-Limiter selbst nennt in seinem Kommentar
   „App Hosting (maxInstances: 1)" als den Fall, in dem er hart greift — **`chat.hey-hi.cloud`
   läuft aber auf Vercel** (`CLAUDE.md`, Open Questions). Dort ist er pro Instanz weich und
   damit eher Missbrauchsdämpfer als Grenze. Das ist kein Fehler, aber es ist etwas anderes,
   als der Kommentar suggeriert. → **Frage F-5**
2. **Die CSP steht auf Report-Only** — sie erzeugt Verstoßmeldungen, blockiert aber nichts. Das
   ist der richtige erste Schritt, heißt aber auch: sie schützt heute nicht, und niemand liest
   die Meldungen. Gehört als Altlast in Phase 4.
3. **C4 fasst den Systemprompt an**, den `HANDOFF.md` unter „Bewusst NICHT angefasst" führt.
   Formal ein Widerspruch. Sachlich ist `buildRuntimeContext()` eine Ergänzung, keine
   redaktionelle Änderung — die „Burn the Corpos"-Passagen bleiben unberührt. Als eigener
   Commit sichtbar und rücknehmbar. → in F-5 mit erwähnt.
4. **`next.config.ts` enthält den Kommentar `/* Kein output: 'export' */` jetzt doppelt.**
   Schlampigkeit, kein Fehler. In C9 mitbereinigen.
5. **Der Endstand hat keine Modellkorrekturen.** Nach Phase 0 bietet die Live-Seite weiterhin
   `gpt-image`, `wan-image-small` und `ltx-2` an, die es nicht gibt. Das ist gewollt: es ist
   Phase 3. Aber F6 und F7 werden es sehen, und es darf nicht als Regression dieser Phase
   gedeutet werden.

---

## 6. Reihenfolge der Schritte, jeder mit seiner Verifikation

### Schritt 0 — Netz spannen

```bash
git tag phase0-start f880389 && git branch phase0-backup
```

**Verifikation:** `git branch -a | grep phase0-backup` findet den Zweig. Grund: der Baum ist
uncommitted; ein Fehlgriff mit `git checkout --` ist unwiederbringlich. Ein Backup-Branch
allein rettet nichts, solange nichts committet ist — deshalb **zusätzlich** vor dem ersten
`git add`: `git stash push -u -m "phase0-safety" && git stash apply`. Der Stash bleibt als
vollständige Kopie liegen, bis F1 erreicht ist.

### Schritte 1–16 — die Commits

Für **jeden** Commit dieselbe Schleife:

```bash
git add <dateien>            # bei ⚠ Hunk-Split: git add -p / git add -e
git diff --cached --stat     # V-a
npm run typecheck            # V-b
npm run lint                 # V-c
CI=1 npm test                # V-d
npm run build                # V-e  (nur bei C1, C2, C9, C12, C16 — s.u.)
git commit
git status --porcelain | wc -l   # V-f: muss monoton fallen
```

- **V-a** — die gestagte Dateiliste stimmt mit der Tabelle in Abschnitt 3 überein. Bei den fünf
  Hunk-Splits zusätzlich `git diff --cached <datei>` vollständig lesen.
- **V-b bis V-d** — nach jedem Commit. Nicht nur am Ende. Das ist F2.
- **V-e** — der Build ist teuer. Er läuft bei den Commits, die den Build tatsächlich berühren
  können: **C1** (Dependencies), **C2** (Schrift/Tailwind), **C9** (`next.config.ts`),
  **C12** (größter Komponenten-Umbau) und **C16** (Endstand). Bei den übrigen deckt `typecheck`
  das ab.
- **V-f** — die Zahl offener Dateien sinkt bei jedem Commit. Steigt sie, ist ein Hunk-Split
  schiefgegangen.

**Wenn ein Commit rot wird:** nicht durchdrücken. `git reset HEAD` und die Ursache in Abschnitt
5.2 nachschlagen — die vier bekannten Wackelkandidaten stehen dort mit ihrem Gegenmittel. Ist
es keiner davon: stoppen und melden.

### Schritt 17 — Endstand vor dem Push

```bash
git status --porcelain          # F1: leer
npm run lint && npm run typecheck && CI=1 npm test && npm run build   # F3
git log --oneline f880389..HEAD # 16 Commits, Reihenfolge wie Abschnitt 3
git diff f880389..HEAD --stat | tail -1   # muss dem heutigen Gesamtdiff entsprechen
```

Die letzte Zeile ist die eigentliche Kontrolle: **der Summendiff über alle sechzehn Commits
muss Zeile für Zeile dem heutigen Arbeitsbaum entsprechen.** Weicht er ab, ist beim
Hunk-Splitting etwas verloren gegangen. Referenzwert von heute: `68 files changed,
2255 insertions(+), 1957 deletions(-)` für die *geänderten* Dateien, dazu 30 neue und
5 gelöschte.

### Schritt 18 — Push

```bash
git push origin main
```

**Verifikation (F4):** `git status -sb` zeigt `## main...origin/main` ohne `ahead`.
**Vorher Freigabe einholen** — `HANDOFF.md` und der Fahrplan-Handoff halten fest: kein
Auto-Commit, kein Push ohne Freigabe.

### Schritt 19 — Deploy abwarten

**Verifikation (F5):** Das Vercel-Deployment zum Push-Commit steht auf `Ready`. Bei `Error`:
Build-Log lesen, **nicht** raten. Der Build ist lokal grün, ein Fehler wäre also
umgebungsspezifisch — `next-themes` (C1) ist der wahrscheinlichste Kandidat.

### Schritte L1–L6 — Live-Verifikation

Gegen `chat.hey-hi.cloud`, **nicht** gegen den Dev-Server. Das ist die durchgehende Lehre der
August-Sitzungen und der Grund, warum diese Prüfungen in Phase 0 gehören und nicht später.

> **Browser:** Der Nutzer hat den Browser selbst offen und will vorher gefragt werden
> (`HANDOFF`-Arbeitsweise Punkt 4, AGENTS.md „Anti-Browser Tool"). Kein automatischer
> Browserstart. Diese sechs Schritte werden **mit dem Nutzer zusammen** durchgegangen.

| # | Prüfung | Genau so | Erfolg | Kriterium |
|---|---|---|---|---|
| **L1** | Chat erreichbar | `chat.hey-hi.cloud` öffnen, „hallo" senden | eine Antwort erscheint, Konsole ohne Fehler | F6 |
| **L2** | **P9 — Intent-Erkennung** | Standard-Chat, **Visualize nicht aktiv**, senden: „mal mir eine katze" | es entsteht ein Bild statt einer Textantwort; der Marker `[IMAGE_GEN: …]` steht nicht sichtbar im Text | **F8** |
| **L3** | **P8 — Chat ohne Compose** | Eingabeleiste ansehen, Desktopbreite | kein Compose-Badge zwischen Visualize und Research | **F9** |
| **L4** | Telefonprüfung zu L3 **und** 4.7 | dieselbe Seite auf dem Telefon, Options-Schublade öffnen | kein Compose-Eintrag · **und**: sind Antwortstil, Stimme, TTS-Tempo erreichbar? | F9 + Befund zu 4.7 |
| **L5** | **Pollen-Key-Feld** | Einstellungen **zum ersten Mal** öffnen (nach Reload) | das Feld zeigt den gespeicherten Schlüssel sofort, nicht erst beim zweiten Öffnen | **F10** |
| **L6** | **Pruna-Videolauf über 202** | Create öffnen, `wan-t2v`, 5 s, `go_fast`, Prompt senden | Netzwerk: `POST /api/generate` → `202 {predictionId}`, dann `GET /api/pruna/status?…` → `202`, dann `200 {videoUrl}`; die Karte zeigt das Video | **F11** |

**Zu L6 — Kostenhinweis, verbindlich:** Der Lauf kostet echtes Geld. Pruna hat **keinen
Cancel-Endpunkt**; jeder gültige Payload startet einen kostenpflichtigen Lauf. Bei der Messung
am 2026-08-26 sind so mehrere unbeabsichtigte Läufe entstanden.

Daraus folgt eine **Zweiteilung** von L6:

1. **L6a — Protokoll prüfen, kostenlos.** Eine unerreichbare Medien-URL mitschicken
   (`https://invalid.invalid/x.jpg`). Die Validierung läuft vollständig durch, die Generierung
   bricht am Download ab. Das bestätigt: `202` kommt, `predictionId` ist gültig, der Client
   fragt nach, der Fehlerpfad endet lesbar. **Kostet nichts.**
2. **L6b — ein echter Lauf, genau einer.** Nur `wan-t2v`, 5 s, `go_fast` — gemessene 45 s. **Nicht
   `vace`**: dort sind 348 bis 700 s gemessen, das ist derselbe Beweis zum Zehnfachen des
   Preises, und `vace` ist seit C7 ohnehin ausgeblendet.

L6b läuft **nur nach ausdrücklicher Freigabe**. Ohne Freigabe gilt L6a als teilerfüllt und F11
bleibt offen — das ist ein ehrliches Ergebnis, kein Haken.

---

## 7. Testplan: welcher Commit welche Suiten berührt

Ausgangslage, heute selbst gemessen: **106 Suiten, 780 Tests, alle grün**; `typecheck` und
`lint` sauber; `npm run build` erfolgreich.

| Commit | Berührte Suiten | Erwartung | Wachsamkeit |
|---|---|---|---|
| **C1** | keine | 780 grün | Build muss laufen — das ist der eigentliche Zweck |
| **C2** | keine (Schrift wird nicht getestet) | 780 grün | Build; visuelle Prüfung erst in L1 |
| **C3** | `src/components/ascii/ascii.test.tsx` *(neu)* | +n Tests | `Gallery.tsx` hat einen bekannten `act()`-Warnhinweis (Zeile 198) — **vorbestehend**, keine Regression |
| **C4** | `chat-prompt-builder.test.ts`, `sendMessage.contract.test.ts` | beide angepasst und grün | Der Vertragstest erwartet jetzt `CODE_REASONING_SYSTEM_PROMPT` **plus** Runtime-Kontext. Ohne `now`/`timeZone`-Injektion wäre er zeitabhängig — die Injektion ist da, also prüfen, dass sie benutzt wird |
| **C5** | `src/config/__tests__/pruna-models.test.ts` (74 Zeilen Diff) | grün | Der Test deckt `vaceFramesFor()` ab. Rot hieße: Sekunden-zu-Frames-Rechnung stimmt nicht |
| **C6** | `pruna/client.test.ts`, `api/generate/route.test.ts`, `generation/request-generation.test.ts` *(neu)*, `api/pruna/status/route.test.ts` *(neu)*, `services/__tests__/chat-service.test.ts` | grün — **außer** möglicherweise `chat-service.test.ts` | **Der bekannte Wackelkandidat.** Sein `vace`-Hunk gehört zu C7. Wird C6 rot: den Hunk vorziehen und im Commit benennen |
| **C7** | `model-source.test.ts`, `model-invariants.test.ts`, `chat-service.test.ts` | grün | `model-invariants` ist die Sicherung dagegen, dass `enabled: false` und `byopVisible: false` auseinanderlaufen |
| **C8** | `components/settings/SettingsPopover.test.tsx` (umbenannt + 35 Zeilen) | grün | Jest darf die Datei nicht zweimal finden. Nach dem Rename `CI=1 npm test -- --listTests \| grep -i settings` — genau ein Treffer |
| **C9** | `enhance-prompt/route.test.ts`, `polly/route.test.ts` (+43), `media/upload/route.test.ts`, `stt/route.test.ts` *(neu)*, `rate-limit.test.ts` *(neu)*, `upload/content-type-policy.test.ts` *(neu)* | +n Tests, alle grün | **Der Rate-Limiter hält Zustand über Suiten hinweg.** `_resetRateLimitForTesting()` muss in *jedem* `beforeEach` der sieben Routen-Suiten stehen — sonst schlägt eine Suite je nach Reihenfolge fehl. Gezielt: `CI=1 npm test -- --runInBand src/app/api` |
| **C10** | `pollinations-registry.test.ts` (15 Zeilen) | grün | Reiner Refactor. Rot hieße: der zentrale Cache verhält sich anders als der lokale — dann ist es kein Refactor mehr |
| **C11** | `ChatInput.test.tsx`, `MobileOptionsMenu.test.tsx` | grün | Falls F-3 auf „löschen" fällt: `MobileOptionsMenu.test.tsx` mitlöschen, sonst testet eine Suite eine unerreichbare Komponente |
| **C12** | `ChatInput.test.tsx` (344 Zeilen Diff!), `VisualizeInlineHeader.test.tsx` (−15), `ResearchDepthBadges.test.tsx` *(neu)*, `hooks`-Suiten | grün | **Der größte Testdiff im Baum.** Zuerst allein laufen lassen: `CI=1 npm test -- --runInBand src/components/chat` |
| **C13** | `GenerationControlStrip.test.tsx` *(neu)*, `sendMessage.contract.test.ts` | grün | Der Fix `imageConfig.selectedModelId` statt `input.selectedImageModelId` sollte einen Test haben. Hat er keinen: benennen, nicht stillschweigend committen |
| **C14** | vier neue Suiten | +n Tests | Reine Zugänge. Rot hieße: einer der neuen Tests deckt einen echten Fehler auf — dann ist es kein Test-Commit mehr, sondern ein Befund |
| **C15** | keine | 780+ grün | Löschungen ohne Referenz können nichts brechen — genau das ist ihr Nachweis |
| **C16** | keine | unverändert | Nur Markdown |

**Gezielt statt vollständig**, wo es hilft (`CLAUDE.md`, Commands):

```bash
CI=1 npm test -- --runInBand src/app/api
```

**Am Ende vollständig**, ohne Abkürzung:

```bash
npm run lint && npm run typecheck && CI=1 npm test && npm run build
```

---

## 8. Was ausdrücklich NICHT Teil dieser Phase ist

Phase 0 sortiert und bestätigt. Sie verbessert nichts. Alles Folgende ist erkannt, benannt und
**bleibt liegen** — wer es hier mitnimmt, macht die Aufteilung wieder unlesbar.

| Nicht hier | Warum nicht | Wohin |
|---|---|---|
| Modellisten korrigieren (`gpt-image`, `wan-image-small`, `ltx-2`, `qwen-image`, `grok-imagine`, `ideogram-v4-turbo`, `acestep`) | Der Registry-Drift ist der zweite Flaschenhals und braucht eine Live-Abfrage plus Entscheidungen zu Namensraum-Modellen | **Phase 3** |
| `acestep` an seinen 19 Fundstellen entfernen | dito; vier davon sind Vorgabewerte, das ist kein Nebenbei | **Phase 3 / 8** |
| Fehlermeldungen verständlich machen (Pruna-400, 401/402/403, fehlender Schlüssel) | Ein Großteil der heutigen Fehler entsteht aus falsch beschriebenen Modellen. Vorher formuliert man Symptome um | **Phase 4** |
| Der ungeklärte 403 auf `/api/pollen/account` | Altlast 1. L5 prüft, ob sich das **Feld** füllt — nicht, ob der Schlüssel gültig ist | **Phase 4** |
| Dritter Zustand für die Pollen-Statuslampe | Altlast 2 und 3: `normalizePollenKey` prüft Zeichen, kein Präfix; die Lampe hängt am Vorhandensein | **Phase 4** |
| `predictionId` einen Reload überleben lassen | Altlast 4. L6 prüft das Protokoll, nicht seine Robustheit | **Phase 4** |
| Verstrichene Zeit auf der laufenden Karte | Altlast 5 | **Phase 4** |
| `vercel.json` mit `maxDuration` | Altlast 7. `vercel.json` ist **nicht** im Arbeitsbaum — es gibt hier nichts zu committen | **Phase 4** |
| `CLAUDE.md` um das 202-Protokoll und `/api/pruna/status` ergänzen | Altlast 6. **Grenzfall:** C16 fasst `CLAUDE.md` ohnehin an. Aber der heute im Baum liegende Doku-Diff enthält diese Ergänzung nicht, und Phase 0 schreibt keine neue Doku — sie committet die vorhandene | **Phase 4** → **Frage F-6** |
| Die Report-Only-CSP scharfschalten | Sie erzeugt heute Meldungen, die niemand liest. Scharfschalten ohne ausgewertete Verstöße bricht die Seite | **Phase 4** |
| Umbenennung Playground → Create, `create.hey-hi.cloud`, Rückweg aus dem Playground | eigene Phase mit eigener Domain-Arbeit im Vercel-Projekt | **Phase 2** |
| Verzeichnisse `src/components/playground/` und `src/lib/playground/` umbenennen | Der Fahrplan-Handoff sagt ausdrücklich: würde den ganzen Fahrplan mit Konflikten überziehen | **nirgends** |
| Galerie zusammenführen, Löschen im Create | **Phase 5** | **Phase 5** |
| Create auf dem Telefon bedienbar machen | L4 **prüft** die Mobil-Erreichbarkeit von Antwortstil/Stimme/Tempo und **meldet** sie. Repariert wird sie hier nicht | **Phase 6** |
| Visualize im Chat auf wenige Modelle reduzieren | **Phase 7.** Achtung: C12 greift mit dem Entfernen der Quality/Resolution-Auswahl bereits ein Stück vor — siehe F-4 | **Phase 7** |
| Musikmodus im Create | **Phase 8** | **Phase 8** |
| ASCII-Flow im Create verdrahten | C3 committet die **Bausteine**, die schon verdrahtet sind. Der Flow-Effekt auf der Create-Seite ist Phase 9 | **Phase 9** |
| `docs/LAUNCH_CRITERIA.md` schreiben | **Phase 1** | **Phase 1** |
| Ungenutzte Dependencies prüfen (`knip`) | außerhalb des Fahrplans, historisch False Positives | offen |
| Den Systemprompt redaktionell härten („Burn the Corpos") | `HANDOFF.md`: nur auf ausdrückliche Anweisung. C4 ergänzt Datum und Zeitzone, mehr nicht | offen |

---

## 9. Offene Entscheidungen — Rückfragen an dich

Sechs Punkte, die ich nicht selbst entscheide. Ohne F-3 kann Schritt C11 nicht sauber laufen;
die übrigen fünf blockieren nur ihren eigenen Commit.

**F-1 — Vorbestehenden toten Code löschen (C15)?**
`PersonalizationTool.tsx` (404 Zeilen), `useAssetPrecache.ts` (50), `useBlobUrl.ts` (54) waren
**schon bei `f880389`** von niemandem importiert. Ihre Löschung ist sachlich richtig, aber sie
gehört nicht zu diesem Umbau, und `CLAUDE.md` sagt: unrelated dead code melden, nicht löschen.
*Löschen (C15 wie geplant) — oder die Löschungen zurücknehmen und den Befund nur festhalten?*

**F-2 — `ComposeTool.tsx` (189 Zeilen) jetzt löschen oder bis Phase 8 behalten?**
Ebenfalls schon vorher unerreichbar. Er ist aber die einzige vorhandene Musik-Oberfläche im
Repo, und Phase 8 baut genau so etwas neu. Wiederherstellbar per `git show`, aber leichter zu
finden, solange die Datei liegt.
*Mit F-1 löschen — oder bis Phase 8 stehenlassen?*

**F-3 — `MobileOptionsMenu.tsx`: löschen, behalten oder wieder verdrahten?** *(blockiert C11)*
Die Datei ist im selben Umbau **gepflegt und abgeklemmt** worden (siehe 4.7). Ihr Ersatz
`UnifiedMobileDrawer` bietet keine Sektion für Antwortstil, Stimme und TTS-Tempo — auf dem
Telefon bleibt dafür nur die Sidebar. Ich schlage vor, **L4 zuerst zu prüfen** und danach zu
entscheiden.
*(a) löschen samt Test · (b) liegenlassen wie sie ist · (c) wieder verdrahten · (d) erst L4, dann entscheiden?*

**F-4 — Ist das Entschlacken von `VisualizeInlineHeader` gewollt?**
C12 entfernt dort die Quality/Resolution-Auswahl und drei Modell-Sonderfall-Props. Das ist
inhaltlich ein Vorgriff auf **Phase 7**. `useUnifiedImageToolState` liefert die drei Props
weiterhin ins Leere (4.8).
*(a) so committen und die verwaisten Props in C12 mitaufräumen · (b) so committen, Aufräumen
Phase 7 überlassen · (c) das Entschlacken zurücknehmen und Phase 7 überlassen?*

**F-5 — Die API-Härtung (C9) so committen?**
Fünfzehn Dateien, die niemand beauftragt hat: Rate-Limits auf sieben Routen, Body-Grenzen,
echte Payload-Schemas, Sanitisierung von Upstream-Fehlern, Security-Header und eine
Report-Only-CSP. Zwei Vorbehalte: der Rate-Limiter ist auf Vercel **pro Instanz** und damit
weicher als sein eigener Kommentar behauptet; und `chat/completion` reicht Upstream-Fehler
nicht mehr durch — was die Fehlersuche in **Phase 4** verändert (der Grund steht dann nur noch
im Server-Log).
*(a) wie geplant committen · (b) committen, aber `enhance-prompt` und `tts` vom Rate-Limit
ausnehmen · (c) die ganze Gruppe zurücknehmen?*

**F-6 — Darf C16 `CLAUDE.md` über den vorliegenden Diff hinaus ergänzen?**
`CLAUDE.md` kennt das 202-Protokoll und `/api/pruna/status` nicht (Altlast 6). Der Doku-Diff im
Baum füllt diese Lücke nicht. Streng genommen ist das Phase 4. Andererseits committet C16 die
Datei ohnehin, und Phase 0 hinterlässt sonst eine Doku, die einen Mechanismus verschweigt, den
sie im selben Push live schaltet.
*(a) nur committen, was im Baum liegt · (b) das 202-Protokoll in C16 ergänzen?*

---

## 10. Zusammenfassung in einem Satz — und in fünf

**Kurz:** Sechzehn thematische Commits statt einem Block, jeder für sich grün, danach Push und
sechs Live-Prüfungen gegen `chat.hey-hi.cloud` — von denen eine Geld kostet und deshalb
zweigeteilt ist.

**Länger, für den, der es nachvollziehen will:** Im Baum liegen 99 Dateien aus mindestens vier
Sitzungen, nicht aus zwei. Die dokumentierte Pruna-Gruppe ist der kleinere Teil; daneben liegen
eine API-Härtungssitzung, ein Schriftumbau, ein Chat-Input-Umbau und ein Feature für den
Systemprompt, für die es keine Aufzeichnung gibt. Sieben Löschungen sind einzeln geprüft: zwei
gehören zwingend zu ihrem Umbau, vier betreffen Code, der schon vorher tot war, und einer ist
gar keine Löschung, sondern eine gepflegte Datei, die im selben Zug abgeklemmt wurde. Der
Gesamtbaum ist heute in allen vier Toren grün — das Risiko liegt deshalb nicht am Ende, sondern
in den fünfzehn Zwischenständen, die es so noch nie gab. Und weil die durchgehende Lehre der
August-Sitzungen lautet, gegen die laufende Schnittstelle zu prüfen statt gegen den Code, endet
diese Phase nicht mit einem grünen Build, sondern mit einem Bild aus dem Live-Chat, einem
leeren Compose-Platz, einem gefüllten Schlüsselfeld und einem Video, das über `202` entstanden
ist.

---

**Status:** AGENTS.md Phase 1 bis 3 abgeschlossen. **Phase 4 beginnt nicht ohne deine Freigabe
und nicht ohne Antwort auf F-3.**
