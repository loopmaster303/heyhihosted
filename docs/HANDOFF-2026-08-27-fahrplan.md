# Session-Handoff — Fahrplan zur anbietbaren Create-Version

**Datum:** 2026-08-27
**Branch:** `main`, HEAD `f880389`
**Art der Sitzung:** Analyse und Planung. **Kein Code geschrieben, nichts committet.**
**Ergebnisdokument:** [`docs/FAHRPLAN-create.md`](FAHRPLAN-create.md)

Dieses Handoff ist die Orientierung für Threads, die einzelne Phasen übernehmen, und für
den Plan-Writer, der daraus Implementierungspläne schreibt. Es enthält **keine**
Umsetzungsschritte — nur Ziel, Fundort und Fallstricke je Phase.

---

## 1. Das Wichtigste zuerst

**Der Arbeitsbaum ist der Blocker.** 65 geänderte und rund 20 neue Dateien liegen
uncommitted da, aus mindestens zwei nicht abgeschlossenen Sitzungen. Jede Phase unten
editiert Dateien, die dort bereits offen sind. Ohne Phase 0 plant jeder weitere Thread
gegen einen Stand, den es so nicht gibt.

**Der zweite große Fund dieser Sitzung:** Die Modell-Wahrheitsdokumente des Repos —
`CLAUDE.md`, `README.md`, `src/config/unified-image-models.ts`, `src/config/chat-options.ts` —
stimmen nicht mehr mit der Pollinations-Registry überein. Details in Abschnitt 4. Das ist
mit hoher Wahrscheinlichkeit die Ursache der Nutzerbeschwerde „oft steht nur Fehler da".

**Achtung für alle folgenden Threads:** `CLAUDE.md` ist für Architektur, Provider-Semantik,
BYOP-Keys, Asset-Persistence und Upload-Härtung weiterhin verlässlich. Für **Modell-Listen**
ist sie es nicht mehr. Modellfragen gegen `gen.pollinations.ai/*/models` prüfen.

---

## 2. Was in dieser Sitzung passiert ist

1. Alle Handoffs gelesen: `HANDOFF.md`, `docs/HANDOFF-2026-08-26-pruna-video.md`,
   die drei Playground-Handoffs vom 7.–12. August
2. Den Arbeitsbaum inventarisiert und die zwei vermischten Sitzungen getrennt
3. Die skizzierten Punkte des Nutzers in prüfbare Punkte P1–P15 überführt
4. Vier Weichenfragen gestellt und beantwortet bekommen (Abschnitt 3)
5. Die Pollinations-Registry live gezogen — dabei fiel der Drift auf (Abschnitt 4)
6. Nach dem Befund eine fünfte Frage gestellt: Musik läuft künftig hinter der Pollenwall
7. Fahrplan in zehn Phasen geschnitten, jede für einen eigenen Thread

---

## 3. Entscheidungen des Nutzers (2026-08-26/27, verbindlich)

| Frage | Entscheidung |
|---|---|
| Domain | `create.hey-hi.cloud` auf **demselben** Vercel-Projekt, Rewrite `/` → `/playground`. `chat.hey-hi.cloud` bleibt der Chat. Kein zweites Deployment. |
| Galerie | **Ein** Asset-Pool. Herkunft wird Tag statt Trennkriterium. Herkunftsfilter je Oberfläche standardmäßig an, umschaltbar. |
| Musik Stufe 1 | Eigene Musik-UI im Create, Backend bleibt Pollinations. |
| Musik: Bezahlung | **Ausschließlich schlüsselpflichtige Modelle, hinter der Pollenwall.** Kein kostenloses Einstiegsmodell. Begründung des Nutzers: Musik ist vorerst ein Testfeld. |
| Musik Stufe 2 (Modal/ACE-Step) | **Zurückgestellt**, nicht Teil des Launch-Wegs. |
| Ziel-Spec | Interne Launch-Kriterien als Definition of Done, gegen die die Phasen abgearbeitet werden. Keine öffentliche Produktseite in diesem Zyklus. |

**Wichtig für den Plan-Writer:** Die Domain-Entscheidung ist nicht kosmetisch. Beide Adressen
zeigen auf dieselbe Anwendung, also auf denselben Browser-Ursprung — nur deshalb bleibt die
lokale IndexedDB-Galerie geteilt. Ein eigenes Deployment hätte Phase 5 unmöglich gemacht.

---

## 4. Der Registry-Befund (live gezogen, 2026-08-27)

Quellen: `gen.pollinations.ai/audio/models`, `gen.pollinations.ai/image/models`.

### 4.1 Musik: `acestep` existiert nicht mehr

Alle 15 Modelle mit Text→Audio sind `paid_only: true`. Ein kostenloses Musikmodell gibt es
bei Pollinations nicht mehr.

Verfügbare Musikmodelle, alle schlüsselpflichtig:

| Modell | Anbieter | Anmerkung |
|---|---|---|
| `elevenmusic` | ElevenLabs | Musik aus Text oder Referenztrack |
| `stable-audio-3-large` | Stability AI | Preis pro Erzeugung, höchste Qualität |
| `stable-audio-3-medium` | Stability AI | im Code bereits bekannt |
| `lyria-3-clip` | Google | 30 s, mit Gesang oder instrumental — **dem Repo bisher unbekannt** |
| `eleven-sfx` | ElevenLabs | Geräusche, kein Musikmodell — eigener Zweck |

**`acestep` steht an 19 Stellen im Code**, darunter an vier als Vorgabewert:

- `src/app/api/compose/route.ts:8-10` — Typ, `VALID_COMPOSE_MODELS`, `FREE_TIER_MODELS`
- `src/app/api/compose/route.ts:24` — Vorgabewert der Route
- `src/hooks/useComposeMusicState.ts:9,46` — Typ und Vorgabewert der Oberfläche
- `src/lib/media/compose-music.ts:35` — Vorgabewert der Client-Funktion
- `src/components/ChatProvider.tsx:416` — fest verdrahteter Aufruf
- `src/config/chat-options.ts:41` — führt es als `isFree: true`
- `src/config/enhancement-prompts.ts:1452,1464` — Alias-Tabelle und Audio-Schlüsselliste
- `src/config/ui-constants.ts:23,123` — Modell-Icon
- `src/app/api/enhance-prompt/route.ts:20` — eigener Enhancement-Prompt
- dazu Tests in `route.test.ts` (Compose und Enhance)

Jede Musikerzeugung läuft heute gegen ein nicht existentes Modell. Unbemerkt nur, weil
`FEATURES.compose = false` in `src/config/features.ts` den Einstieg verdeckt.

### 4.2 Bild und Video: die geführte Liste stimmt nicht

`CLAUDE.md` führt unter „Free und enabled today" gegen die Live-Registry:

| Modell | `CLAUDE.md` | Live |
|---|---|---|
| `flux`, `zimage`, `klein`, `kontext`, `gptimage-large` | free | free — stimmt |
| `qwen-image` | free | **schlüsselpflichtig** |
| `grok-imagine` | free | **schlüsselpflichtig** |
| `ideogram-v4-turbo` | free | **schlüsselpflichtig** |
| `gpt-image` | free | **existiert nicht** (heute `gpt-image-2` / `gptimage`) |
| `wan-image-small` | free | **existiert nicht** |
| `ltx-2` | free | **existiert nicht** |

Kostenlos und im Repo nicht geführt, unter anderem: `dreamshaper`, `nova-canvas`,
**`nova-reel` (Video, kostenlos)**.

Weitere Beobachtungen, die noch niemand bewertet hat:

- Die Registry führt inzwischen Modelle mit Namensraum (`vendouple/…`, `MarcosFRG/…`,
  `chigwell/…`, `JustScriptzz/…`). Die Konfiguration kennt dieses Muster nicht.
- **`p-image`, `p-image-edit` und `p-video` erscheinen jetzt auch bei Pollinations.**
  Bisher galten sie als reine Pruna-Familie. Das berührt die in `CLAUDE.md` beschriebene
  Provider-Trennung und ist ungeklärt.
- Verhältnis insgesamt: 35 kostenlose zu 39 schlüsselpflichtigen Einträgen.

---

## 5. Zustand des Repos

### 5.1 Der Arbeitsbaum, nach Herkunft sortiert

**Sitzung vom 2026-08-26** (dokumentiert in `docs/HANDOFF-2026-08-26-pruna-video.md`):

- `src/config/pruna-models.ts`, `src/lib/playground/param-schema.ts` — Payload-Korrekturen
- `src/lib/pruna/client.ts`, `src/lib/pruna/deliver.ts` *(neu)* — Dispatch statt Warten
- `src/app/api/pruna/status/` *(neu)* — Statusabfrage
- `src/lib/generation/request-generation.ts` *(neu)* — Client-Polling, 3 s, 30 min Reißleine
- `src/app/api/generate/route.ts`, `PlaygroundShell.tsx`, `chat-service.ts` — Nutzer davon
- `src/config/unified-image-models.ts`, `src/lib/playground/model-source.ts` — VACE ausgeblendet
- `src/components/settings/SettingsPopover.tsx`, `src/hooks/usePollenKey.ts` — Key-Feld

**Ältere, unabgeschlossene Sitzung** — Herkunft nicht dokumentiert, Absicht unbekannt:

- Chat-Input-Umbau: `GenerationControlStrip`, `InlineModeSwitch`, `ImageModelOptions`,
  `ImageParamOptions`, `ResearchDepthBadges`, `ModelLogo` (alle neu, in
  `src/components/chat/` bzw. `src/components/chat/input/`)
- `QuickSettingsBadges.tsx` gelöscht
- `SettingsDialog` → `src/components/settings/SettingsPopover` verschoben
- `src/components/ascii/` *(neu)* — `index.tsx`, `useAsciiFrames.ts`, Test
- `src/lib/rate-limit.ts` *(neu)*
- `src/config/features.ts` *(neu)* — `FEATURES.compose = false`
- `src/components/tools/ComposeTool.tsx` und `PersonalizationTool.tsx` gelöscht
- `src/hooks/useAssetPrecache.ts`, `src/hooks/useBlobUrl.ts` gelöscht

**Für den Thread, der Phase 0 übernimmt:** Die zweite Gruppe ist die riskante. Sie löscht
Komponenten und verschiebt Module, ohne dass ein Handoff die Absicht festhält. Sie darf nicht
als Block durchgewinkt werden.

### 5.2 Gebaut, aber unbestätigt

| Sache | Fundort | Zustand |
|---|---|---|
| Compose aus dem Chat | `src/config/features.ts` | Flag steht, `ComposeTool.tsx` gelöscht — uncommitted, live unbestätigt |
| Intent-Erkennung im Chat | `src/lib/chat/chat-media-intent.ts`, `chat-media-intent-handler.ts` | Code und Tests vorhanden, live nie bestätigt |
| ASCII-Effekte | `src/components/ascii/` | existiert, im Playground nicht verdrahtet |
| Client-Polling | `src/lib/generation/request-generation.ts` | gegen Dev-Server verifiziert, nie live |

### 5.3 Offene Altlasten aus dem Handoff vom 2026-08-26

1. 403 auf `/api/pollen/account` ungeklärt — betrifft den Schlüssel im Browser, nicht die Route
2. `normalizePollenKey` prüft nur erlaubte Zeichen, kein Präfix
3. Die Statuslampe hängt am Vorhandensein, nicht an der Gültigkeit des Schlüssels
4. Ein Reload während der Generierung verliert den Lauf — `predictionId` nur im Speicher
5. Keine Fortschrittsanzeige bei 6–12-Minuten-Läufen; Pruna liefert keinen Prozentwert
6. `CLAUDE.md` kennt das 202-Protokoll und `/api/pruna/status` nicht
7. `vercel.json` enthält `{}` — kein `maxDuration`

---

## 6. Phasenplan mit Wegweisern

Reihenfolge und Abhängigkeiten:

```
Phase 0 ─► Phase 1 ─► Phase 2 ─► Phase 3 ─┬─► Phase 4 ─► Phase 5 ─► Phase 6 ─► Phase 8 ─► Phase 9
                                          └─► Phase 7

Phase 10 ist zurückgestellt und Teil keines Pfads.
```

Zwei Flaschenhälse: **Phase 0 blockiert alles**, **Phase 3 blockiert 4, 7 und 8**.

---

### Phase 0 — Arbeitsbaum konsolidieren

**Ziel:** Ein sauberer, gepushter, live verifizierter Stand als Ausgangspunkt.

**Wegweiser:** Abschnitt 5.1 dieses Dokuments enthält die Zuordnung nach Herkunft — sie
existiert sonst nirgends. Der Handoff vom 2026-08-26 beschreibt die erste Gruppe im Detail
samt Begründung je Datei.

**Fallstricke:**
- Die zweite Gruppe löscht Komponenten. Vor dem Commit klären, ob die Löschung beabsichtigt
  war oder ein halber Umbau ist.
- Der Handoff vom 2026-08-26 warnt ausdrücklich davor, den Baum als Ganzes zu committen.
- Live-Verifikation gehört in diese Phase, nicht in eine spätere: P9 (Intent-Erkennung),
  P8 (Chat ohne Compose), Pollen-Key-Feld, ein echter Pruna-Videolauf über das 202-Protokoll.

**Fertig, wenn:** `lint`, `typecheck`, `npm test`, `npm run build` grün · gepusht · Chat und
Playground live erreichbar · Intent-Erkennung im Live-Chat bestätigt.

---

### Phase 1 — Launch-Kriterien festschreiben (P14)

**Ziel:** `docs/LAUNCH_CRITERIA.md` — was muss laufen, damit die Adresse öffentlich geteilt
wird. Pro Kriterium ein prüfbarer Satz. Ausdrücklich auch, was **nicht** zum Launch gehört.

**Wegweiser:** `docs/PRODUCT_IDENTITY.md` und `docs/PRODUCT_AUDIT_2026-04-21.md` beschreiben
das Produktversprechen. `docs/README.md` ist die Karte über aktive und archivierte Doks.

**Fallstricke:** Keine neue Wahrheitsdatei erfinden, wo eine bestehende reicht — das steht so
in `CLAUDE.md` unter „Cleanup Rules". Die Launch-Kriterien sind eine echte Lücke, deshalb ist
eine neue Datei hier gerechtfertigt.

**Fertig, wenn:** Jedes Kriterium ist ohne Rückfrage prüfbar und jede Phase 2–9 lässt sich
einem Kriterium zuordnen. Phase 10 ist als nicht launchrelevant vermerkt.

---

### Phase 2 — Create-Identität (P1, P2, P3, P4)

**Ziel:** Der Playground heißt Create, wohnt unter `create.hey-hi.cloud`, und Chat und Create
sind in beide Richtungen erreichbar.

**Wegweiser:**
- Beschriftungen: `src/config/translations.ts` — die `playground.*`-Schlüssel liegen
  **zweimal** in der Datei, einmal je Sprache (Zeilen 56–62 und 318–324). Wer nur eine Stelle
  ändert, übersetzt halb.
- Route: `src/app/playground/page.tsx`, Shell in `src/app/playground/PlaygroundShell.tsx`
- Weiterleitung: `next.config.ts` hat heute **keine** `rewrites`- oder `redirects`-Funktion,
  nur `headers`, `turbopack`, `allowedDevOrigins` und `images`. Der Hook muss neu angelegt
  werden. Die Domain selbst wird im Vercel-Projekt hinterlegt, nicht im Repo.
- Navigation hin: `src/components/layout/AppSidebar.tsx:122`
- Navigation zurück: existiert nicht. `PlaygroundShell.tsx` enthält keinerlei `navigateTo`,
  `href` oder `router.push` — der Rückweg muss neu entstehen.
- Doks: `README.md`, `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `HANDOFF.md`,
  `src/app/about/page.tsx`, `docs/README.md`

**Fallstricke:**
- Die Live-Domain heißt `hey-hi.cloud` **mit** Bindestrich. Der Nutzer hat sie mehrfach ohne
  geschrieben. Vor der Umsetzung im Vercel-Projekt prüfen, was registriert ist.
- `src/components/playground/` und `src/lib/playground/` umzubenennen ist **nicht** Teil des
  Ziels. Der Nutzer wollte die sichtbare Beschriftung ändern. Eine Verzeichnisumbenennung
  würde den ganzen Fahrplan mit Konflikten überziehen.
- `t('playground.prunaEmpty')` nennt eine feste Zahl („14 Pruna models"), die nicht aus der
  Registry kommt. Beim Anfassen der Übersetzungen auffällig, gehört sachlich in Phase 3.

**Fertig, wenn:** `create.hey-hi.cloud` öffnet Create · `chat.hey-hi.cloud` öffnet den Chat ·
beide Richtungen sind ein Klick · kein Dokument nennt nur noch die alte Adresse.

---

### Phase 3 — Modellwahrheit gegen die Live-Registry (P15)

**Ziel:** Kein angebotenes Modell antwortet mit „unbekannt", kein als kostenlos markiertes
Modell verlangt einen Schlüssel.

**Wegweiser:**
- Bild und Video: `src/config/unified-image-models.ts` — die drei Flags `enabled`, `isFree`,
  `byopVisible` sind in `CLAUDE.md` erklärt. Sichtbarkeitslogik in `isVisibleVisualModel()`
  ab Zeile 500.
- Text und Compose: `src/config/chat-options.ts` — `VISIBLE_POLLINATIONS_MODEL_IDS`,
  `AVAILABLE_COMPOSE_MODELS` ab Zeile 40
- Pruna: `src/config/pruna-models.ts`
- Registry-Zugriff existiert bereits: `src/lib/pollinations-registry.ts` (serverseitig,
  60 s Cache) und `src/lib/playground/model-source.ts` (Modellliste des Playgrounds)
- Was die Registry nicht liefert, steht in `src/lib/playground/pollinations-caps.ts` —
  Dauerstufen, Pixeltabelle, SEED/QUALITY/TRANSPARENT-Mengen
- Abgleichspunkte: Abschnitt 4.2 dieses Dokuments
- Vorbild für die Arbeitsweise: `docs/pollinations-api-audit-2026-06-01.md` und
  `docs/pollinations-deep-audit-2026-06-27.md`

**Fallstricke:**
- `model-source.ts` hatte schon einmal den Fehler, `enabled` nicht zu lesen (im Handoff vom
  2026-08-26 gefixt). Beim Anfassen der Sichtbarkeit prüfen, ob alle drei Flags greifen.
- VACE ist bewusst abgeschaltet, nicht gelöscht — Mapping, Schema und Enhancement-Prompt
  liegen unberührt weiter. Nicht versehentlich reaktivieren.
- `src/config/enhancement-prompts.ts` enthält die **einzige** Alias-Tabelle. Wer Modelle
  entfernt, muss dort mitziehen, sonst fällt die Prompt-Verbesserung auf den Standard zurück.
  Die Auflösungsreihenfolge steht in `CLAUDE.md` unter „Prompt Enhancement".
- Die Namensraum-Modelle und das Auftauchen der `p-*`-Familie bei Pollinations sind
  **offene Fragen**, keine erledigten Punkte. Sie brauchen eine Entscheidung, keine
  stille Aufnahme in die Liste.

**Fertig, wenn:** `CLAUDE.md` stimmt mit der Registry überein und kein angebotenes Modell
scheitert an seiner eigenen Beschreibung.

---

### Phase 4 — Fehlerklarheit und Laufstabilität (P13 + Altlasten 1–7)

**Ziel:** Jeder Fehlerpfad endet in einem Satz, der sagt was passiert ist und was zu tun ist.

**Wegweiser:**
- Der Playground hat bereits ein Fehlergerüst: `PlaygroundShell.tsx` — `messageFrom()` ab
  Zeile 63 packt `{ error }` aus der Route aus, `setError` ab Zeile 89, Anzeige als
  schließbare Meldung ab Zeile 439. Fehlgeschlagene Läufe tragen ihre Meldung selbst
  (`status: 'failed'`, Zeile 259).
- Was fehlt, ist nicht das Gerüst, sondern die Übersetzung: Pruna-400
  (`additional properties forbidden, found <feld>`), 401/402/403, fehlender Schlüssel.
- Pollen-Zustand: `src/hooks/usePollenKey.ts`, Anzeige in
  `src/components/settings/SettingsPopover.tsx`. Der Handoff vom 2026-08-26 nennt als
  nächsten Schritt: Seite neu laden und die Konsolenzeile `[BYOP] Failed to fetch account
  info:` lesen — sie nennt seit dieser Sitzung den Grund.
- Laufüberleben: `src/lib/generation/request-generation.ts` hält die `predictionId` nur im
  Speicher. `src/lib/safe-storage.ts` ist der bestehende, Safari-gehärtete Wrapper.
- `vercel.json` enthält `{}`.
- `CLAUDE.md`, Abschnitt „Asset Persistence", beschreibt weiter den direkten Weg über
  `/api/generate` und kennt das 202-Protokoll nicht.

**Fallstricke:**
- Diese Phase **nach** Phase 3 ansetzen. Ein Großteil der heutigen Fehlermeldungen entsteht
  daraus, dass ein Modell falsch beschrieben ist. Vorher würde man Symptome umformulieren.
- Pruna hat keinen Cancel-Endpunkt. Jeder gültige Payload startet einen kostenpflichtigen
  Lauf. Zum Testen der Validierung eine unerreichbare Medien-URL mitschicken
  (`https://invalid.invalid/x.jpg`) — der Trick steht im Handoff vom 2026-08-26 und hat
  dort echtes Geld gespart, nachdem vorher welches verbrannt wurde.

**Fertig, wenn:** Jeder bekannte Fehlerfall ist ohne Konsole verständlich · ein Reload
während eines Videolaufs verliert den Lauf nicht.

---

### Phase 5 — Eine Galerie (P5, P6)

**Ziel:** Ein Asset-Pool, Herkunft als Tag, Filter je Oberfläche standardmäßig an. Löschen
im Create.

**Wegweiser — hier ist die Lage besser als erwartet:**
- Beide Oberflächen schreiben längst in dieselbe Tabelle. Getrennt wird nur über
  `PLAYGROUND_CONVERSATION_ID` (`'__playground__'`) in `src/lib/playground/constants.ts`.
- Die Trennung wird an genau **drei** Stellen hergestellt:
  `src/app/playground/PlaygroundShell.tsx:231` (schreibt das Tag),
  `src/components/playground/Gallery.tsx:185` (liest nur dieses Tag),
  `src/hooks/useGalleryAssets.ts:13` (schließt genau dieses Tag aus der Chat-Galerie aus).
- Löschen existiert bereits: `DatabaseService.deleteAsset(id)` in
  `src/lib/services/database.ts:179`. Der Blob liegt im Asset-Record selbst
  (`src/lib/services/output-service.ts:111`), also entfernt ein Löschen beides.
- Die Vault-Seite `src/app/gallery/page.tsx` hat bereits einen Löschknopf (Zeile 248) —
  Vorbild für Bestätigung und Verhalten.
- Detailleiste des Playgrounds: `src/components/playground/MetaRail.tsx` — kennt heute
  `onLoad`, `onRerun`, `onUseAsReference`, kein Löschen.
- Schema: `src/lib/services/database.ts`, Version 4, `assets: 'id, conversationId, timestamp, starred'`

**Fallstricke:**
- Blob-URLs müssen über `src/lib/blob-manager.ts` freigegeben werden, sonst bleibt eine tote
  URL zurück. `CLAUDE.md` verbietet `URL.createObjectURL` direkt — das gilt auch beim Löschen.
- Eine Schema-Migration ist **nicht** nötig; `conversationId` ist bereits indiziert. Der
  Kommentar in `constants.ts` sagt genau das.

**Fertig, wenn:** Ein im Chat erzeugtes Bild erscheint im Create nach Umschalten des Filters ·
Löschen entfernt Eintrag und Blob · nach einem Reload ist nichts zurück.

---

### Phase 6 — Create auf dem Telefon (P12)

**Ziel:** Auf dem Telefon lässt sich ein Bild und ein Video vollständig erzeugen, inklusive
Referenz-Upload.

**Wegweiser:**
- Der Grundaufbau ist bereits responsiv angelegt: `PlaygroundShell.tsx:411` nutzt
  `grid-cols-1 md:grid-cols-[300px_1fr]`, Zeile 404 blendet einen Schubladen-Knopf unter `md`
  ein, Zeile 429 zeigt die Detailleiste erst ab `xl`. Die Phase ist also Feinschliff und
  Bedienbarkeit, nicht Neubau.
- Betroffene Bausteine: `PlaygroundSidebar.tsx` (Parameter), `PromptBar.tsx`,
  `ReferenceSlots.tsx`, `ModelPicker.tsx`, `Gallery.tsx`, `MetaRail.tsx`
- `docs/UX_AUDIT_AND_ROADMAP.md` nennt als P0 unter anderem das Flackern durch
  `window.innerWidth`-basierte Mobilerkennung — beim Anfassen relevant.

**Fallstricke:**
- Auf einem echten Gerät prüfen. Das schmale Fenster hat in den August-Sitzungen mehrfach
  Fehler verdeckt, die auf dem iPhone auftraten — der `allowedDevOrigins`-Fehler
  (`691db97`) ist das Lehrstück.
- Der Nutzer will keine automatischen Browser-Starts zur Prüfung. Vorher fragen.
- Diese Phase **vor** Phase 8, sonst wird die Musik-Oberfläche zweimal gebaut.

---

### Phase 7 — Chat entschlanken (P7)

**Ziel:** Visualize im Chat zeigt eine kleine, begründete Auswahl. Der Weg zur vollen
Auswahl führt sichtbar ins Create.

**Wegweiser:**
- Kopfzeile: `src/components/tools/visualize/VisualizeInlineHeader.tsx`
- Zustand: `src/hooks/useUnifiedImageToolState.ts`
- Sichtbarkeit: `isVisibleVisualModel()` in `src/config/unified-image-models.ts:500`
- Im Arbeitsbaum liegen bereits neue, unbestätigte Bausteine, die genau hier hineinspielen:
  `src/components/chat/input/ImageModelOptions.tsx`, `ImageParamOptions.tsx`,
  `InlineModeSwitch.tsx`, `ModelLogo.tsx`. Vor dem Planen prüfen, was Phase 0 daraus
  gemacht hat.

**Fallstricke:**
- Modelle nicht löschen, nur im Chat ausblenden. Die Registry bleibt die Wahrheit, das Create
  zeigt weiterhin alles.
- Hängt an Phase 3: die reduzierte Auswahl muss aus bestätigten Modellen bestehen.
- Sonst unabhängig — kann parallel zu 4–6 laufen.

---

### Phase 8 — Musik im Create, Stufe 1 (P10a)

**Ziel:** Ein Musikmodus im Create mit eigener Oberfläche, ausschließlich hinter der
Pollenwall.

**Wegweiser:**
- Route existiert: `src/app/api/compose/route.ts`. Sie spricht den Pollinations-GET-Endpunkt
  `${POLLINATIONS_BASE}/audio/<prompt>?model=…&duration=…&instrumental=…` an, mit einem
  Längenlimit (`MAX_COMPOSE_URL_LENGTH`, Zeile 79) — der OpenAI-kompatible POST-Weg wird
  laut Kommentar bewusst nicht genutzt.
- Client: `src/lib/media/compose-music.ts`, Zustand in `src/hooks/useComposeMusicState.ts`
- Reste der alten Oberfläche: `src/components/tools/compose/ComposeInlineHeader.tsx`
  (`ComposeTool.tsx` ist im Arbeitsbaum gelöscht)
- Schalter: `src/config/features.ts`
- Modus-Zuordnung des Playgrounds: `src/lib/playground/mode-mapping.ts` — heute `t2i`, `i2i`,
  `t2v`, `i2v`; Tabs in `src/components/playground/ModeTabs.tsx`
- Modellliste: Abschnitt 4.1 dieses Dokuments. `lyria-3-clip` ist dem Repo unbekannt.
- Prompt-Verbesserung für Audio: `AUDIO_ENHANCEMENT_KEYS` in
  `src/config/enhancement-prompts.ts`, 500-Zeichen-Grenze — die Auflösungsreihenfolge in
  `CLAUDE.md` erklärt, warum die Alias-Auflösung vor dem Audio-Zweig laufen muss.
- Es gibt Skills für Prompt-Handwerk: `suno-prompting`, `ace-step-prompting`,
  `stable-audio-3-guide`.

**Fallstricke:**
- **`acestep` muss vollständig verschwinden** — 19 Fundstellen, Liste in Abschnitt 4.1.
  Vier davon sind Vorgabewerte; wer nur die Modellliste ändert, hinterlässt einen
  Vorgabewert, der ins Leere zeigt.
- `src/config/chat-options.ts:41` behauptet `isFree: true`. Es gibt kein kostenloses
  Musikmodell mehr.
- Ohne Schlüssel soll der Modus **keinen Fehler werfen**, sondern die Pollenwall erklären und
  den Weg zu den Einstellungen zeigen. Das ist eine ausdrückliche Nutzerentscheidung.
- Ergebnisse gehören in den gemeinsamen Pool aus Phase 5, nicht in einen eigenen Speicher.

---

### Phase 9 — ASCII-Flow im Create (P11)

**Ziel:** Der Effekt der Chat-Startseite läuft auch im Create.

**Wegweiser:** `src/components/ascii/` (`index.tsx`, `useAsciiFrames.ts`) liegt bereits im
Arbeitsbaum. Vorbild ist die Startseite: `src/components/page/LandingView.tsx`.

**Fallstricke:** Nicht während laufender Generierungen um Rechenzeit konkurrieren. Auf
kleinen Geräten und bei `prefers-reduced-motion` zurücknehmen. Abschaltbar halten.

---

### Phase 10 — Musik auf eigener Infrastruktur (P10b) · zurückgestellt

Kein Teil des Launch-Wegs. Wieder aufnehmen, wenn ein kostenloses Musikangebot doch gewünscht
wird, Pollinations als Anbieter ausfällt oder eigene Limitsteuerung nötig wird
(`src/lib/rate-limit.ts` liegt bereits im Arbeitsbaum). Einstieg wäre dann: offene
Musikmodelle sichten, Lizenzen für ein öffentliches Angebot prüfen, Kaltstart- und GPU-Kosten
auf Modal rechnen, entscheiden.

---

## 7. Was in dieser Sitzung nicht geprüft wurde

Ehrlich benannt, damit niemand es für erledigt hält:

- **Die Pruna-Registry.** Nur Pollinations wurde live gezogen. Ob `docs.api.pruna.ai`
  inzwischen anders aussieht als `src/config/pruna-models.ts`, ist offen. Gehört in Phase 3.
- **`nova-reel`** (kostenloses Video) wurde gefunden, aber nicht auf Brauchbarkeit geprüft.
- **Die Namensraum-Modelle** (`vendouple/…` und andere) — nicht bewertet, kein Vorschlag.
- **`p-image` / `p-image-edit` / `p-video` bei Pollinations** — Konsequenz für die
  Provider-Trennung ungeklärt.
- **Der Chat selbst** wurde nicht auditiert. P9 (Intent-Erkennung) ist Code-Sichtung, keine
  Live-Bestätigung.
- **Kein Test gelaufen, kein Build.** Die Zahl „780 Tests grün" stammt aus dem Handoff vom
  2026-08-26, nicht aus dieser Sitzung.

---

## 8. Arbeitsweise, die sich bewährt hat

Aus den August-Sitzungen und dieser:

1. **Gegen die laufende Schnittstelle prüfen, nicht gegen den Code.** Die fünf Live-Bugs im
   Redesign-Handoff hatten dasselbe Muster: eine Annahme über eine Schnittstelle, die nie
   gegen die echte Schnittstelle geprüft wurde. Dieselbe Lehre gilt für Modell-Listen — der
   Drift in Abschnitt 4 wäre bei jeder Code-Lektüre unsichtbar geblieben.
2. **Pruna-Läufe kosten Geld und lassen sich nicht abbrechen.** Zum Prüfen der Validierung
   eine unerreichbare Medien-URL mitschicken.
3. **Modell-Dokumentation von Pruna ist verlässlich** (`docs.api.pruna.ai/guides/models/<modell>`),
   Raten ist es nicht.
4. **Keine automatischen Browser-Starts** zur Prüfung — der Nutzer hat den Browser selbst
   offen und will gefragt werden.
5. **UI-Änderungen zuerst als Mockup zeigen**, dann bauen.
6. **Kein Auto-Commit, kein Push ohne Freigabe.**

---

## 9. Für den Plan-Writer

Was aus den Repo-Dokumenten kommt und **nicht** hier wiederholt wird:

| Thema | Quelle |
|---|---|
| Arbeitsablauf, 4 Phasen | `AGENTS.md` |
| Playground-Architektur, Provider-Semantik, BYOP, Asset-Persistence, Upload-Härtung | `CLAUDE.md` |
| Reihenfolge der Prompt-Verbesserung, `<unfiltered>` / `<quality_terms>` | `CLAUDE.md` |
| Karte über aktive und archivierte Doks | `docs/README.md` |
| Produktversprechen | `docs/PRODUCT_IDENTITY.md`, `docs/PRODUCT_AUDIT_2026-04-21.md` |
| Pruna-Laufzeiten, 202-Protokoll, VACE-Abschaltung | `docs/HANDOFF-2026-08-26-pruna-video.md` |
| Parameter-Schema-Umbau | `docs/superpowers/plans/2026-08-10-playground-param-schema-impl.md` |
| Schriftregel proportional/monospace | `CLAUDE.md`, Abschnitt „Schriftregel" |

Was **nur** hier steht und sonst nirgends:

- Die Zuordnung des Arbeitsbaums nach Herkunft (Abschnitt 5.1)
- Der Registry-Drift und die 19 `acestep`-Fundstellen (Abschnitt 4)
- Dass `CLAUDE.md` für Modell-Listen nicht mehr verlässlich ist
- Die drei Stellen, an denen die Galerie-Trennung entsteht (Phase 5)
- Dass `next.config.ts` keinen `rewrites`-Hook hat und der Rückweg aus dem Playground fehlt
- Die Entscheidungen des Nutzers aus Abschnitt 3
