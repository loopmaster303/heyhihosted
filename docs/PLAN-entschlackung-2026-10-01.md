# PLAN — Entschlackung (2026-10-01)

**Status:** Vorschlag. Nichts davon ist umgesetzt. Nach AGENTS.md wartet dieser Plan auf ein
ausdrückliches „leg los“, und zwar je Phase.
**Ausgangsbasis:** `main` @ `a61feed`. `tsc --noEmit` grün, **974 Tests in 124 Suiten grün**
(gemessen am 2026-10-01).
**Werkzeuge der Bestandsaufnahme:** `knip@5` (tote Dateien, Exporte, Abhängigkeiten), ein
Import-Graph je Seite (welche Dateien `/create` bzw. `/unified` wirklich laden), `grep`
nach Aufrufern jeder API-Route und `wc` je Funktionsbereich.

---

## 0. In drei Sätzen

Das Repo trägt heute zwei Produkte (Chat und Create), dazu die Reste von drei weiteren (Compose,
die alte Galerie, Visualize als zweiten Bildgenerator im Chat). Außerdem 12 MB Logos und fast
50 Planungsdokumente auf oberster Ebene. Der Vorschlag: den **Playground Meck** (das heutige
Create mit dem Video-2-Pro-Stand aus deinem Worktree) unverändert sichern und schützen, den Chat
auf Text, Stimme und ein Inline-Bild zurückschneiden, jedes Modell an genau **einer** Stelle
beschreiben und den Rest löschen oder archivieren.

**Einfacher gesagt:** Erst wird der Playground in Sicherheit gebracht. Dann fliegt weg, was
niemand aufruft, danach was doppelt da ist. Am Ende gibt es zwei Räume (Chat und Playground Meck)
statt fünf halber.

---

## 1. Was erhalten bleibt: Playground Meck

### 1.1 Was damit gemeint ist

**Playground Meck** ist in diesem Plan der Name für den Create-Arbeitsplatz in dem Stand, in
dem er in deinem **lokalen Worktree** liegt, **einschließlich Video 2 Pro**. Er umfasst Bild,
Video und Sound, alle Modelle, Referenz-Slots, parallele Läufe, Reload-Fortsetzung und Galerie.

> **Wichtig:** Der Video-2-Pro-Stand ist **nicht auf GitHub**. Durchsucht wurden `main` und
> alle sieben Remote-Branches (`ai_main_…`, `claude/mobile-enhancer-…`,
> `claude/test-before-deploy-…`, `dashboard/xlinks`, `feat/pruna-integration`, `v0/…`);
> „video 2 pro“, „video-2“ und „v2-pro“ kommen nirgends vor. Er existiert nur auf deinem
> Rechner. Phase E0 sichert ihn deshalb, bevor irgendetwas anderes passiert.

### 1.2 Schutzregel für alle Phasen

Diese Pfade gehören zum Playground Meck. Die Entschlackung **ändert dort keinen Funktionsumfang**,
sie darf nur Importe umbiegen (in E6):

| Bereich | Pfade |
|---|---|
| Shell und UI | `src/app/create/`, `src/components/playground/` |
| Logik | `src/lib/playground/`, `src/lib/generation/`, `src/lib/pruna/`, `src/hooks/usePlayground*.ts`, `useViewportHeight.ts`, `useProviderMode.ts` |
| Server | `/api/generate`, `/api/pruna/*`, `/api/sound`, `/api/sound/audio`, `/api/media/*`, `/api/enhance-prompt`, `/api/pollen/image-models` |
| Gemeinsam genutzt | `src/lib/errors/`, `src/lib/upload/`, `src/lib/assets/`, `src/lib/blob-manager.ts`, `output-service.ts`, `database.ts` |

**Gate je Phase:** Alle Tests unter diesen Pfaden bleiben grün, darunter `PlaygroundShell.test`,
`create.e2e.test`, `usePlaygroundModels.test`, `param-schema`-Tests und `api/generate/route.test`.
Zusätzlich ist ein Bild- und ein Videolauf im Dev-Server sichtbar. Fällt ein Meck-Test, wird
die Phase zurückgerollt und nicht der Test angepasst.

### 1.3 Name

Im Plan heißt er „Playground Meck“. Ob die Oberfläche den Namen trägt, entscheidest du
(→ **E-1**). Die Route bleibt in jedem Fall erreichbar, weil `/create` und `/playground` in
Lesezeichen stehen.

---

## 2. Bestand in Zahlen

| | |
|---|---|
| Quellcode ohne Tests | ≈ 33 600 Zeilen in `src/` |
| Tests | 124 Suiten, 974 Tests, grün |
| `/create` lädt | **85 Dateien, ≈ 12 500 Zeilen** (inkl. Root-Layout) |
| `/unified` (Chat) lädt | **156 Dateien**, davon 33 Logo-Bilder |
| Logos `src/assets/icons-models/` | **12 MB**, 35 Dateien, sieben PNGs davon je 1,3–1,5 MB |
| `docs/` | 109 Dateien, 1,8 MB, **48 Markdown-Dateien auf oberster Ebene** |
| Wurzel-Markdown | `CLAUDE.md` 25 KB, `HANDOFF.md` 9 KB, `README`, `AGENTS`, `GEMINI` |

Zeilen je Bereich (ohne Tests):

| Bereich | Zeilen | Bemerkung |
|---|---:|---|
| Playground Meck (Shell, Komponenten, `lib/playground`, Hooks) | 5 831 | bleibt |
| Prompt-Enhancement (`enhancement-prompts.ts` + Route) | 3 728 | 1 786 Zeilen handgeschriebene Prompts, die meisten für abgeschaltete Modelle |
| Modell-Konfiguration (9 Dateien) | 3 279 | dieselben Fakten an bis zu 7 Stellen |
| Chat-Komponenten + Eingabe + `lib/chat` | 7 007 | `ChatInput.tsx` allein 923 Zeilen |
| Visualize im Chat | 2 035 | zweiter Bildgenerator neben dem Playground |
| Galerie (Panel + alte Seite) | 1 365 | `/gallery` ist laut eigenem Kommentar DEPRECATED |
| Deko (ASCII, Decrypted, FlowField, GradualBlur, Grain) | 1 183 | |
| Sidebar + Layout | 1 054 | |
| Stimme (TTS/STT) | 869 | |
| Research (Smart-Router, Web-Kontext) | 560 | |
| Compose (Chat-Musik) | 536 | hinter `FEATURES.compose = false`, unerreichbar |
| About-Seite | 523 | |

---

## 3. Befunde

### 3.1 Toter Code (durch knip und grep belegt)

**Dateien ohne Importeur:**
`src/components/chat/InlineChatImage.tsx`, `chat/input/VisualCorner.tsx`,
`ui/GrainOverlay.tsx`, `ui/ModeButtonOverlay.tsx`, `ui/Skeleton.tsx`, `ui/label.tsx`,
`ui/scroll-area.tsx`, `scripts/pruna-smoke-check.mjs`,
`scripts/audit/pollinations-drift-report.js`.

**API-Routen ohne Aufrufer:**
- `/api/pollen/polly` und `/api/pollen/polly/models`: kein Client ruft sie, 108 Zeilen.
- `/api/proxy-image`: kein Client ruft sie. `CLAUDE.md` beschreibt sie trotzdem als aktive
  Härtung.

**Abhängigkeiten ohne Nutzer:** `@radix-ui/react-label`, `@radix-ui/react-scroll-area`,
`ts-node`. `jsdom` fehlt dagegen in `package.json`, obwohl zehn Tests es direkt importieren
(es kommt nur transitiv über `jest-environment-jsdom`).

**Unerreichbar hinter einem Schalter:** Compose im Chat (`FEATURES.compose = false`):
`ComposeInlineHeader`, `useComposeMusicState`, `lib/media/compose-music.ts` und die
`FEATURES`-Abfragen in `ToolsBadges`/`MobileOptionsMenu`. Musik lebt seit 2026-09-03 als Sound
im Playground.

**36 ungenutzte Exporte und 43 ungenutzte Typ-Exporte.** Die Liste steht in der knip-Ausgabe.
Das meiste sind shadcn-Teilkomponenten (`DropdownMenuSub…`, `DrawerHeader` …). Die sind billig
und sollten **nicht** einzeln gejagt werden; sie fallen mit, wenn ihre Datei fällt.

### 3.2 Ballast im Repo (kein Code, aber Gewicht)

| Was | Größe/Art | Befund |
|---|---|---|
| `src/assets/icons-models/` | 12 MB | **10 Dateien ungenutzt** (u. a. `ltxfarbe.png` 1,35 MB, `amazon-nova.png` als Duplikat von `Amazon Nova.png`, `banana-icon.html`). Die genutzten Farblogos sind 1,3–1,5 MB groß und werden als ~20-px-Icons gezeigt. `next/image` verkleinert sie zur Laufzeit, Repo, Build und jeder Klon tragen sie trotzdem. |
| `conductor/` | 2 Dateien | Produktbeschreibung eines früheren Agenten-Werkzeugs, überholt |
| `.sisyphus/plans/` | 1 Datei | Plan vom 2026-03-07, überholt |
| `.idx/dev.nix`, `apphosting.yaml` | Firebase Studio / App Hosting | Host ist laut CLAUDE.md Vercel; beides ist nicht aktiv |
| `tmp/pollen-audit/` | 3 JSON | eingecheckte Registry-Momentaufnahmen; die echte liegt in `src/config/__fixtures__/` |
| `scripts/audit/` + `audit:install`/`audit:uninstall` | 13 Dateien | macOS-launchd-Cron mit Telegram-Versand; die wöchentliche Registry-Action in `.github/workflows/` deckt den Kern ab (→ **E-5**) |
| `package.json` `setup:pollicode` | Skript | zeigt auf `tools/oh-my-pollicode/`, **das Verzeichnis existiert nicht** |
| `package.json` `"name": "nextn"` | | Firebase-Vorlagenname |
| `.eslintrc.json` **und** `eslint.config.mjs` | | zwei ESLint-Konfigurationen; ESLint 9 liest nur die flache |
| `public/scripts/auth-proxy.js` | | wird von `https-post.ts` als Kindprozess gestartet und liegt zugleich **öffentlich ausgeliefert** unter `/scripts/auth-proxy.js` (siehe 3.4) |
| `next.config.ts` `CREATE_HOST`-Regeln | schlafend | Domain ist verworfen (2026-08-29), Regeln liegen „falls sie kommt“ |

### 3.3 Doppelte Wahrheiten (der eigentliche Speck)

**a) Ein Modell ist an bis zu sieben Stellen beschrieben.** Wer heute ein Modell wie Video 2 Pro
hinzufügt, fasst potentiell an:

| Datei | Was sie über ein Modell weiß |
|---|---|
| `config/unified-image-models.ts` | Name, Art, frei/Schlüssel, Sichtbarkeit, Referenzmodus, 42 Einträge, **davon 26 `enabled: false`** |
| `config/unified-model-configs.ts` | Eingabefelder und Defaults, **nur noch vom Chat-Visualize gelesen** |
| `lib/playground/param-schema.ts` | Felder, Gruppen, Grenzen für den Playground (867 Zeilen) |
| `lib/playground/pollinations-caps.ts` | Dauer, Seed, Qualität, Transparenz je Modell |
| `config/pruna-models.ts` | Pruna-Name, sync/async, Payload-Bau |
| `lib/playground/model-source.ts` | **eigene** Mengen `PRUNA_REQUIRES_REF`, `PRUNA_SUPPORTS_END_FRAME`, `PRUNA_SUPPORTS_AUDIO`, `PRUNA_HIDDEN_IN_PLAYGROUND` statt Flags am Modell; `isVideo` wird aus dem **Namen** geraten (`id.includes('video')`) |
| `config/ui-constants.ts` + `ModelLogo` | Logo |
| `config/enhancement-prompts.ts` | Enhance-Prompt |

Dazu kommt ein Widerspruch: Der Playground zeigt **Registry-Modelle ohne Config-Eintrag** an
(„sonst verlöre der Playground seinen Zweck“), blendet aber Modelle **mit** Config-Eintrag aus,
sobald dort `enabled: false` steht. Die 26 abgeschalteten Einträge sind damit eine Sperrliste,
die sich als Modellkatalog tarnt.

**b) Zwei Bildgeneratoren.** Visualize im Chat (2 035 Zeilen: `useUnifiedImageToolState`,
`VisualizeInlineHeader`, `ImageModelOptions`, `ImageParamOptions`, `GenerationControlStrip`,
`unified-model-configs`) und der Playground. Seit Phase 7 bietet der Chat ohnehin nur noch die
freien Pollinations-Bildmodelle an (`getChatImageModelGroups()`). Visualize ist damit eine
abgespeckte Kopie des Playgrounds mit eigener Zustandsmaschine.

**c) Zwei Musikwege.** Compose im Chat (unerreichbar) und Sound im Playground. Dazu der
`[MUSIC_GEN: …]`-Marker, den der Chat-Systemprompt weiter lehrt und der in Compose läuft.

**d) Drei Adressen für eine Seite.** `/`, `/chat` und `/unified` rendern dieselbe Seite.

**e) Vier Seiten bauen den ganzen Chat-Zustand nur für die Sidebar.** `/settings`, `/about` und
`/gallery` mounten jeweils `ChatProvider` + `AppLayout`, laden also alle Unterhaltungen aus
IndexedDB, um eine Seitenleiste zu zeichnen. `/settings` zeigt dabei nur den Hinweis „die
Einstellungen sind jetzt in der Sidebar“ und einen Zurück-Knopf.

### 3.4 Ein struktureller Umweg mit Folgen: `https-post.ts`

Jeder ausgehende Server-Request für Chat, Titel, Compose, Web-Kontext und Enhance **startet
einen eigenen Node-Kindprozess** (`spawn`), der `public/scripts/auth-proxy.js` ausführt. Die
Begründung im Kopf der Datei lautet: Next.js 16 habe das `https`-Modul gepatcht und Header
entfernt.

Folgen:
- Ein Prozessstart pro Chat-Nachricht, auf Vercel spürbar in Latenz und Speicher.
- Ein harter Deckel `DEFAULT_PROXY_TIMEOUT_MS = 30_000`. **Das ist genau der Blocker 3.1 im
  Sound-Plan:** Die vier Pollinations-Musikmodelle rechnen länger als 30 s und werden per
  `SIGTERM` beendet.
- Das Skript liegt in `public/` und ist damit öffentlich abrufbar. Es enthält keinen Schlüssel,
  gehört aber nicht dorthin.

**Ungeprüft:** ob die Begründung bei Next 16.1 heute noch stimmt. Es gibt ein starkes Indiz
dagegen: `pollinations-image-v1.ts` (Bild) und `tts-flow.ts` (Stimme) schicken bereits einen
einfachen `fetch` mit `Authorization: Bearer …` an **denselben Host** `gen.pollinations.ai`,
ebenso `/api/sound` an Modal, und alle drei laufen live. Ein Beweis für den Chat-Pfad ist das
nicht. Diese Prüfung ist der erste Schritt von E7.

### 3.5 Dokumentation

- 48 Markdown-Dateien auf oberster Ebene in `docs/`, davon 21 `PLAN-*` und `HANDOFF-*` für
  **abgeschlossene** Phasen. `docs/README.md` markiert zwei verschiedene Handoffs als „latest“.
- `CLAUDE.md` (25 KB) mischt Regeln, Zustand und Geschichte („seit Phase 7 …“, „removed on
  2026-08-28 …“), dazu Deutsch und Englisch. `HANDOFF.md` im Wurzelverzeichnis steht noch auf
  dem Stand 2026-08-28. `AGENTS.md` Abschnitt 3 nennt Compose als aktiven Modus.
- `docs/plans/`, `docs/handoffs/`, `docs/superpowers/` und `docs/archive/` sind vier Archive.

---

## 4. Zielbild

```
heyhi
├── Chat (/)                Text, Stimme, Research, ein Inline-Bild über [IMAGE_GEN]
│                           mit festem freien Modell → „im Playground öffnen“
├── Playground Meck         unverändert: Bild, Video (inkl. Video 2 Pro), Sound,
│   (/create)               alle Modelle, Galerie
└── Über (/about)           (→ E-4)

src/config/models/          eine Karte je Modell, alle Ableitungen daraus
docs/                       ≈ 6 lebende Dokumente + ein Archiv
```

Leitsatz: **Ein Modell, eine Karte. Eine Funktion, ein Raum. Ein Dokument, eine Wahrheit.**

---

## 5. Phasen

Jede Phase ist eine eigene Sitzung mit eigenem Commit-Strang und endet grün (`lint`,
`typecheck`, `test`, `build`) plus dem Meck-Gate aus 1.2. Die Reihenfolge geht von „ohne
Verhaltensänderung“ zu „mit Produktentscheidung“.

### E0 — Playground Meck sichern · *Betreiber, blockiert alles Weitere*

1. Im lokalen Worktree den Video-2-Pro-Stand committen.
2. Als Branch `playground-meck` pushen und den Stand taggen (`playground-meck-v1`).
3. Danach in `main` mergen, damit die Entschlackung **auf** ihm aufsetzt und nicht an ihm
   vorbei.

**Warum zuerst:** Jede spätere Phase fasst gemeinsam genutzte Module an (`unified-image-models`,
`pruna-models`, `param-schema`). Ohne den Stand auf GitHub kann keine Sitzung prüfen, ob sie
Video 2 Pro bricht, und der Merge am Ende würde zum Konfliktfeld.

### E1 — Ballast raus, ohne Verhaltensänderung

- Die 9 toten Dateien aus 3.1 löschen, ebenso `/api/pollen/polly*` und `/api/proxy-image`
  samt Tests. `CLAUDE.md` erwähnt `/api/proxy-image` als aktive Härtung; der Satz geht mit.
  `remote-fetch-policy.ts` bleibt, weil Ingest und Upload es nutzen.
- `@radix-ui/react-label`, `@radix-ui/react-scroll-area`, `ts-node` entfernen; `jsdom` als
  devDependency eintragen.
- Logos: 10 ungenutzte Dateien löschen, die genutzten auf 64×64 px (PNG/WebP) verkleinern.
  Ziel < 300 KB statt 12 MB. Dateinamen ohne Leerzeichen.
- `conductor/`, `.sisyphus/`, `.idx/`, `apphosting.yaml`, `tmp/` löschen.
- `.eslintrc.json` löschen, `setup:pollicode` löschen, `name` auf `heyhihosted` setzen.
- `CREATE_HOST`-Regeln aus `next.config.ts` entfernen (der `/playground`-Redirect bleibt).
  Die Git-Historie hält sie bereit, falls die Domain-Entscheidung kippt.

**Schätzung:** ≈ 12 MB, ≈ 1 000 Zeilen, 3 Abhängigkeiten. **Risiko:** gering. knip und `grep`
belegen jede Löschung, `build` fängt den Rest.

### E2 — Dokumentation auf das Lebende kürzen

- Alle `PLAN-phase-*`, `PLAN-audit-*`, `PLAN-patch-*` und `HANDOFF-2026-08-*`/`-09-01` nach
  `docs/archive/2026-08-create-fahrplan/` verschieben. `FAHRPLAN-create.md` und
  `PROMPTS-phasen.md` gehen mit, weil Phasen 0–7 erledigt sind und der Rest in
  `LAUNCH_CRITERIA.md` steht.
- `docs/plans/`, `docs/handoffs/` und `docs/superpowers/` in `docs/archive/` einsortieren:
  **ein** Archiv.
- Oben bleiben: `README.md` (Karte), `LAUNCH_CRITERIA.md`, `PRODUCT_IDENTITY.md`,
  `architecture-view.md`, die aktiven Pläne (`PLAN-sound-modellwahl`, dieser Plan) und der
  jeweils letzte Handoff.
- `CLAUDE.md` auf Regeln und Fallstricke kürzen (Ziel ≤ 10 KB): Provider-Semantik,
  BYOP-Schlüssel, Asset-Persistenz, Fehlercodes, 202-Protokoll, Upload-Härtung, Schriftregel,
  Modellwahrheit-Werkzeug. Geschichte („seit Phase N“, „removed on …“) wandert in die
  Handoffs. `GEMINI.md` und `AGENTS.md` §3 werden zu Verweisen auf `CLAUDE.md`. `HANDOFF.md`
  in der Wurzel wird archiviert.

**Risiko:** keins am Code. Einziger Fallstrick: relative Links in archivierten Dokumenten
brechen. Ein Link-Check (`grep -o '](.*\.md)'`) gehört in die Phase.

### E3 — Compose aus dem Chat entfernen

- Löschen: `components/tools/compose/`, `hooks/useComposeMusicState.ts`,
  `lib/media/compose-music.ts`, `config/features.ts` und die `FEATURES.compose`-Zweige,
  dazu `ComposeModelOption`/Compose-Modelle in `chat-options.ts`, soweit nur Compose sie liest.
- **Bleibt:** `/api/compose`. Der Sound-Plan (Paket B) braucht die Route für die vier
  Pollinations-Musikmodelle im Playground.
- `[MUSIC_GEN]`: entweder ebenfalls entfernen (Parser, Handler-Zweig, Satz in
  `MEDIA_MARKER_PROTOCOL`) oder auf Sound umleiten (→ **E-3**).
- Gespeicherte Compose-Assets bleiben unangetastet: `assetOrigin()` liest sie weiter als
  `compose`, die Galerie zeigt sie. Keine Migration.

**Schätzung:** ≈ 550 Zeilen. **Risiko:** gering, der Code ist heute unerreichbar.

### E4 — Visualize im Chat auflösen *(Produktentscheidung → E-2)*

**Empfehlung A:** Der Chat erzeugt Bilder nur noch über `[IMAGE_GEN]`, mit einem festen freien
Modell (Default aus `getChatImageModelGroups()`, heute `flux`). An jedem Inline-Bild steht
„im Playground öffnen“ mit Prompt und Modell vorbelegt. Wer Modellwahl, Referenzen und
Parameter will, geht in den Playground.

- Löschen: `useUnifiedImageToolState`, `VisualizeInlineHeader`, `VisualizeReferenceBadges`,
  `ImageModelOptions`, `ImageParamOptions`, `GenerationControlStrip`, `InlineModeSwitch`
  (soweit nur für Visualize), `config/unified-model-configs.ts` und der
  `visualize`-Zweig in `ChatProvider` / `chat-send-coordinator`.
- `chat-media-intent-handler` bekommt sein Modell aus der Chat-Regel statt aus
  `selectedImageModelId`.
- Altbestand: Unterhaltungen mit `isImageMode: true` oder `toolType: 'visualize'` öffnen als
  normaler Chat. Ein Fallback beim Lesen reicht, keine Dexie-Migration. Die Typ-Union
  `ToolType` verliert die vier toten Werte (`'premium imagination'`, `'nocost imagination'`,
  `'personalization'`, `'about'`), sobald `grep` keinen Leser mehr zeigt.

**Schätzung:** ≈ 2 000–2 500 Zeilen. **Risiko:** mittel. `ChatProvider` und
`useChatState` sind die Stellen, vor denen AGENTS.md warnt. Deshalb **vorher**
Charakterisierungstests für Standard-Chat, Research und `[IMAGE_GEN]` grün machen, dann löschen.

**Alternative B:** Visualize bleibt, wie es ist. Dann entfällt E4, und
`unified-model-configs.ts` bleibt als zweite Feldbeschreibung bestehen.

### E5 — Routen und Shell

- `/chat` und `/unified` → Redirect auf `/` in `next.config.ts`; die Re-Export-Seiten löschen.
  Interne Links (`router.push('/unified')`, `← chat`-Anker im Playground) auf `/` ziehen.
- `/gallery` löschen, Redirect auf `/` (die Galerie lebt als Panel). 369 Zeilen.
- `/settings` löschen, Redirect auf `/` (die Seite ist heute nur ein Hinweis).
- `ChatProvider` + `AppLayout` einmal in ein gemeinsames Layout ziehen
  (`src/app/(chat)/layout.tsx`), statt sie in jeder Seite neu zu bauen.

**Schätzung:** ≈ 500 Zeilen. **Risiko:** gering bis mittel. Lesezeichen bleiben dank Redirects
gültig. `unified/page.test.tsx` muss mitwandern.

### E6 — Ein Modell, eine Karte *(größter Hebel, größtes Risiko)*

Ziel: Ein neues Modell, etwa Video 2 Pro, ist **ein** Eintrag.

```ts
// src/config/models/<provider>.ts
{
  id, name, provider, kind,                      // heute unified-image-models
  access: 'free' | 'key',                        // isFree / paidOnly
  surfaces: { chat?: true, playground?: true },  // ersetzt enabled/byopVisible/HIDDEN-Sets
  reference: { mode, min, max, endFrame },       // ersetzt PRUNA_REQUIRES_REF, …END_FRAME
  params: ModelParamSchema,                      // heute param-schema SCHEMA_MAP
  caps: { durations, seed, quality, audio },     // heute pollinations-caps
  pruna?: { model, mode, buildInput },           // heute pruna-models
  enhance?: 'hand' | 'registry',                 // Verweis auf enhancement-prompts
  logo,
}
```

Vorgehen:
1. **Charakterisierung zuerst:** Für jedes heute sichtbare Modell (Chat und Playground,
   einschließlich Video 2 Pro nach E0) den Ist-Zustand als Snapshot festhalten:
   `buildPrunaEntries()`, `buildPollinationsEntries(fixture)`, Param-Schema, Pruna-Payload für
   einen Beispiel-Input.
2. Karten anlegen, die heutigen Module als **dünne Ableitungen** darauf umbauen (gleiche
   Exportnamen). Die Snapshots müssen identisch bleiben.
3. Erst dann die Altdateien auflösen und Importe umbiegen.
4. Die 26 `enabled: false`-Einträge streichen. Was der Server-Key nicht darf
   (`kontext`, `gptimage-large`) oder was synchron nicht lieferbar ist (`nova-reel`), kommt als
   **eine** kommentierte Sperrliste neben die Karten. Die Live-Registry ist die Warteliste,
   nicht unsere Config.
5. `enhancement-prompts.ts`: Handgeschriebene Prompts nur für sichtbare Modelle behalten. Für
   alle anderen greift `buildRegistryEnhancementPrompt()` bereits heute. Prompts abgeschalteter
   Modelle wandern ins Archiv, nicht ins Nichts, falls ein Modell zurückkommt.

**Schätzung:** ≈ 1 500–2 500 Zeilen weniger. Wichtiger ist, dass ein neues Modell nur noch eine
Datei berührt statt sieben. **Risiko:** hoch, weil es das Herz des Playground Meck betrifft.
Deshalb eigene Sitzung, Snapshot-Gate, und `scripts/check-model-registry.mjs` wird auf die
Karten umgestellt.

### E7 — Server-HTTP ohne Kindprozess

1. **Prüfen:** ein `fetch` mit `Authorization`-Header gegen `gen.pollinations.ai/v1/chat/completions`
   aus einer Route unter Next 16.1, lokal und als Vercel-Preview. Kommt der Header an?
2. Wenn ja: `https-post.ts` durch einen kleinen `fetch`-Wrapper mit
   `AbortSignal.timeout(ms)` ersetzen, Timeout je Aufrufer. `public/scripts/auth-proxy.js`
   löschen. Damit ist der 30-s-Blocker des Sound-Plans (E-1 dort) gleich mit gelöst.
3. Wenn nein: Das Skript zieht nach `scripts/` (nicht öffentlich), und der Timeout wird je
   Aufrufer übergeben. Die Begründung kommt mit Datum in die Datei.

**Schätzung:** ≈ 300 Zeilen + 1 öffentliche Datei. **Risiko:** mittel. Betroffen sind Chat,
Titel, Enhance und Compose; alle haben Route-Tests mit gemocktem `httpsPost`, die mit umziehen.

### E8 — Kleinkram *(optional, je nach E-4)*

- Deko: `ASCIIText`, `DecryptedText`, `FlowField`, `GradualBlur` und `components/ascii/`
  zusammen 1 183 Zeilen. Behalten, was Landing und About zeigen; Doppeltes (zwei
  ASCII-Implementierungen) auf eine bringen.
- About-Seite (523 Zeilen in 9 Komponenten) und Englisch in `translations.ts` (553 Zeilen):
  → **E-4**.
- `chat-options.ts`: Systemprompts nennen weiter `ltx-2`/`grok-video`. Das ist laut CLAUDE.md
  eingefroren und braucht ein ausdrückliches Mandat, gehört also **nicht** automatisch dazu.

---

## 6. Was ausdrücklich nicht angefasst wird

- Funktionsumfang des Playground Meck (1.2).
- Dexie-Schema, `PLAYGROUND_CONVERSATION_ID`-Sentinel, `assetOrigin()`: keine Migration.
- BYOP-Schlüssel (Speicher, Header, Resolver), Upload-Härtung, Fehlercode-System
  (`src/lib/errors/`), Run-Store und 202-Protokoll.
- `scripts/check-model-registry.mjs` und die wöchentliche Action (in E6 nur umgestellt).
- Systemprompt-Inhalte (eingefroren laut CLAUDE.md).
- Tests werden nie gelöscht, um grün zu werden. Sie fallen nur mit dem Code, den sie prüfen.

---

## 7. Erwarteter Effekt (Schätzung)

| Phase | Zeilen | Sonstiges |
|---|---:|---|
| E1 Ballast | ≈ −1 000 | −12 MB, −3 Abhängigkeiten, −6 Wurzel-Verzeichnisse/Dateien |
| E2 Doku | — | 48 → ≈ 8 Dokumente oben, `CLAUDE.md` 25 → ≤ 10 KB |
| E3 Compose | ≈ −550 | |
| E4 Visualize (A) | ≈ −2 000 bis −2 500 | Chat lädt deutlich weniger Module |
| E5 Routen | ≈ −500 | 7 → 3 Seiten |
| E6 Modellkarte | ≈ −1 500 bis −2 500 | neues Modell = 1 Datei statt 7 |
| E7 HTTP | ≈ −300 | kein Prozessstart je Chat-Nachricht, Sound-Blocker gelöst |
| **Summe** | **≈ −6 000 bis −7 500** von 33 600 | ≈ 20 % weniger Quellcode |

Die Zeilenzahlen sind aus `wc` je Datei hochgerechnet, nicht gemessen. Die Phasen messen nach.

---

## 8. Offene Entscheidungen

| | Frage | Empfehlung |
|---|---|---|
| **E-1** | Heißt die Oberfläche „Playground Meck“ (z. B. Route `/meck`, `/create` und `/playground` leiten weiter) oder bleibt „Create“ der Produktname und „Meck“ nur der Name des gesicherten Stands? | Produktname nicht ändern, bevor die Launch-Kriterien durch sind (L-A.* hängen an „Create“). „Playground Meck“ als Branch/Tag-Name. |
| **E-2** | Visualize im Chat: A (nur `[IMAGE_GEN]` + „im Playground öffnen“) oder B (bleibt)? | **A**, weil seit Phase 7 der Chat ohnehin nur freie Bildmodelle anbietet |
| **E-3** | `[MUSIC_GEN]` entfernen oder auf Sound umleiten? | Entfernen. Musik ist schlüsselpflichtig bzw. Modal-gebunden und gehört in den Playground. |
| **E-4** | About-Seite und Englisch behalten? | Englisch behalten (kostet wenig); About auf eine Komponente eindampfen |
| **E-5** | `scripts/audit/` (launchd + Telegram) noch in Benutzung auf deinem Mac? | Wenn nein: löschen, die GitHub-Action reicht |

---

## 9. Reality Check (AGENTS.md Phase 3)

- **Führt das zu Spaghetti?** Nein, jede Phase entfernt Pfade, keine fügt Abstraktion hinzu.
  Die einzige neue Struktur, die Modellkarte in E6, ersetzt sieben Dateien.
- **Bricht es `useChatState` / `useUnifiedImageToolState`?** E4 löscht
  `useUnifiedImageToolState` mit Absicht und ist deshalb hinter E-2 und Charakterisierungstests
  gesperrt. `useChatState` verliert nur den `isImageMode`-Zweig, mit Lese-Fallback für Altbestand.
- **Verschlimmbesserung?** Das größte Risiko ist E6 am Playground Meck. Dagegen stehen
  Snapshot-Gate, eigene Sitzung und die Regel „Meck-Test rot = Rollback“.
- **Was ist geprüft, was nicht?** Geprüft: tote Dateien (knip + grep), Routen ohne Aufrufer
  (grep über `src/` ohne `src/app/api`), Abhängigkeiten, Logo-Nutzung (Dateiname je Import),
  Import-Graph je Seite, Baseline grün. **Nicht geprüft:** ob Next 16.1 Header noch entfernt
  (E7 Schritt 1), der Inhalt des Video-2-Pro-Worktrees (E0), und ob `scripts/audit/` lokal
  läuft (E-5).

---

## 10. Reihenfolge

```
E0 (Betreiber) ─► E1 ─► E2 ─► E3 ─► E5 ─► E7
                                │
                        E-2 ────┴─► E4 ─► E6 ─► E8
```

E1–E3 und E5 sind risikoarm und lassen sich in einer Sitzung abarbeiten. E4 und E6 bekommen je
eine eigene. E7 kann vorgezogen werden, wenn der Sound-Plan zuerst dran ist, weil er dessen
Blocker löst.
