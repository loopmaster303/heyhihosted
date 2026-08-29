# Fahrplan — von heyhihosted zur anbietbaren Create-Version

**Datum:** 2026-08-26
**Status:** Planung. Kein Code in dieser Sitzung geschrieben.
**Grundlage:** `HANDOFF.md`, `docs/HANDOFF-2026-08-26-pruna-video.md`,
`docs/superpowers/handoffs/2026-08-12-*`, Prüfung des Arbeitsbaums und **live gezogene
Pollinations-Registry vom 2026-08-26**.

Jede Phase ist so geschnitten, dass sie in einem eigenen Thread abgeschlossen werden kann:
eigener Scope, eigene Verifikation, minimale Überlappung im Code.

---

## Entscheidungen (2026-08-26, vom Nutzer festgelegt)

| Frage | Entscheidung |
|---|---|
| Domain | ~~`create.hey-hi.cloud` auf demselben Vercel-Projekt~~ — **verworfen am 2026-08-29.** Create lebt als Pfad `chat.hey-hi.cloud/create` auf demselben Ursprung; ein zweiter Hostname hätte IndexedDB und localStorage getrennt. |
| Musik Stufe 1 | Bestehendes Pollinations-Backend, neue eigene UI, alle verfügbaren Audio/Music-Modelle. |
| Musik Stufe 2 | **Zurückgestellt.** Nach dem Registry-Befund (kein kostenloses Musikmodell mehr bei Pollinations) hat der Nutzer entschieden: Musik läuft ausschließlich über schlüsselpflichtige Modelle, hinter der Pollenwall. Kein freies Einstiegsmodell, keine eigene Infrastruktur im Launch-Weg. |
| Galerie | **Ein** Asset-Pool, Herkunft als Tag, Herkunftsfilter je Oberfläche **standardmäßig an**, umschaltbar. |
| Ziel-Spec | Interne Launch-Kriterien (Definition of Done), gegen die die Phasen abgearbeitet werden. |

---

## Live-Registry-Befund (2026-08-26)

Gezogen von `gen.pollinations.ai/audio/models` und `/image/models`.

### Musik: kein kostenloser Weg mehr

**`acestep` existiert in der Registry nicht mehr.** Und **alle** 15 Modelle mit
Text→Audio sind `paid_only: true`. Ein kostenloses Musikmodell gibt es bei Pollinations
heute nicht.

Was für Musik übrig bleibt, alles schlüsselpflichtig:

| Modell | Anbieter | Beschreibung |
|---|---|---|
| `elevenmusic` | ElevenLabs | Musik aus Text oder Referenztrack |
| `stable-audio-3-large` | Stability AI | Längere Stereo-Musik, höchste Qualität, Preis pro Erzeugung |
| `stable-audio-3-medium` | Stability AI | Längere Stereo-Musik und Klanglandschaften |
| `lyria-3-clip` | Google | 30 Sekunden, mit Gesang, Text oder instrumental — **bei uns bisher unbekannt** |
| `eleven-sfx` | ElevenLabs | Geräusche aus einer Beschreibung — kein Musikmodell, eigener Zweck |

**Folge für den Code:** `acestep` steht an 19 Stellen, darunter als Vorgabewert in
`src/app/api/compose/route.ts:24`, `src/hooks/useComposeMusicState.ts:46`,
`src/lib/media/compose-music.ts:35`, und `src/components/ChatProvider.tsx:416` ruft es
fest verdrahtet auf. `src/config/chat-options.ts:41` führt es als `isFree: true`.
Jede Musikerzeugung läuft heute gegen ein Modell, das es nicht gibt — unbemerkt nur,
weil `FEATURES.compose = false` den Einstieg verdeckt.

**Folge für den Plan (Entscheid des Nutzers, 2026-08-26):** Musik bleibt vorerst ein
Testfeld und läuft ausschließlich über schlüsselpflichtige Modelle — hinter der Pollenwall.
Ein kostenloses Einstiegsmodell wird nicht angestrebt, eigene Infrastruktur damit auch nicht.
Phase 10 fällt aus dem Launch-Weg heraus.

### Bild und Video: die Wahrheitsliste in `CLAUDE.md` stimmt nicht mehr

Die dort als „free und enabled" geführten Modelle gegen die Live-Registry:

| Modell | `CLAUDE.md` | Live |
|---|---|---|
| `flux`, `zimage`, `klein`, `kontext`, `gptimage-large` | free | free — stimmt |
| `qwen-image` | free | **schlüsselpflichtig** |
| `grok-imagine` | free | **schlüsselpflichtig** |
| `ideogram-v4-turbo` | free | **schlüsselpflichtig** |
| `gpt-image` | free | **existiert nicht** (heute `gpt-image-2` / `gptimage`) |
| `wan-image-small` | free | **existiert nicht** |
| `ltx-2` | free | **existiert nicht** |

Kostenlos und bei uns nicht geführt, unter anderem: `dreamshaper`, `nova-canvas`,
`nova-reel` (Video, kostenlos). Insgesamt 35 kostenlose zu 39 schlüsselpflichtigen
Einträgen; die Registry führt inzwischen auch Modelle mit Namensraum
(`vendouple/…`, `MarcosFRG/…`) und **`p-image`, `p-image-edit`, `p-video` erscheinen
jetzt auch bei Pollinations** — bisher galten sie als reine Pruna-Familie.

**Das ist die wahrscheinlichste Ursache von P13.** Ein als kostenlos angebotenes Modell,
das in Wahrheit einen Schlüssel verlangt, antwortet mit 401 oder 402 — und in der
Oberfläche steht „Fehler".

---

## Ausgangslage

> **Historisch — dieser Abschnitt beschreibt den Stand vom 2026-08-26/27.** Der Blocker ist
> am 2026-08-28 aufgelöst worden (`f880389..aa3eac4`); es waren tatsächlich 99 Dateien, nicht
> 85. Siehe [`HANDOFF-2026-08-28-phase-0.md`](HANDOFF-2026-08-28-phase-0.md).

### Blocker: der Arbeitsbaum ~~(offen)~~ — aufgelöst am 2026-08-28

65 geänderte und rund 20 neue Dateien, **nichts committet**, aus mindestens zwei Sitzungen
vermischt:

- Sitzung vom 2026-08-26: Pruna-Payload-Fixes, Client-Polling (202-Protokoll),
  `/api/pruna/status`, `src/lib/pruna/deliver.ts`, `src/lib/generation/request-generation.ts`,
  VACE ausgeblendet, Pollen-Key-Feld
- Ältere, unabgeschlossene Sitzung: Chat-Input-Umbau (`GenerationControlStrip`,
  `InlineModeSwitch`, `ImageModelOptions`, `ImageParamOptions`, `ResearchDepthBadges`,
  `ModelLogo`), `SettingsDialog` → `src/components/settings/SettingsPopover`,
  `src/components/ascii/`, `src/lib/rate-limit.ts`, `src/config/features.ts`

Solange das nicht sortiert und committet ist, plant jede Phase auf Sand.

### Was bereits gebaut, aber unbestätigt ist

| Sache | Zustand |
|---|---|
| Compose aus dem Chat entfernt | `FEATURES.compose = false`, `ComposeTool.tsx` gelöscht — uncommitted |
| Intent-Erkennung im Chat | `chat-media-intent.ts` + Handler + Tests vorhanden — live unbestätigt |
| ASCII-Effekte | `src/components/ascii/` existiert — im Create nicht als Flow verdrahtet |
| Client-Polling für lange Läufe | Gegen Dev-Server verifiziert, nicht live |

### Offene Altlasten aus dem Handoff vom 2026-08-26

1. 403 auf `/api/pollen/account` ungeklärt — betrifft den Schlüssel im Browser, nicht die Route
2. `normalizePollenKey` prüft nur Zeichen, kein Präfix — beliebiger Text macht die Lampe grün
3. Die grüne Lampe hängt am Vorhandensein, nicht an der Gültigkeit des Schlüssels
4. Ein Reload während der Generierung verliert den Lauf (`predictionId` nur im Speicher)
5. Keine Fortschrittsanzeige bei 6–12-Minuten-Läufen
6. `CLAUDE.md` kennt das 202-Protokoll und `/api/pruna/status` nicht
7. `vercel.json` ist leer — kein `maxDuration` als Sicherheitsnetz

---

## Die Punkte

### Identität und Adresse
- **P1** — Umgesetzt: Die Oberfläche nennt Create **Create** — Sidebar-Link, Translations
  DE/EN, Seitentitel, Metadaten. Am 2026-08-29 ist zusätzlich der Routenpfad von
  `/playground` auf `/create` gezogen; der alte Pfad leitet weiter.
- **P2** — ~~`create.hey-hi.cloud` als zusätzliche Domain~~ — **entfallen am 2026-08-29.**
  Ein zweiter Hostname ist ein zweiter Browser-Ursprung: getrennte IndexedDB, getrennter
  localStorage, also getrennte Galerie und doppelt einzutragende Schlüssel. Die Adresse
  heißt jetzt `chat.hey-hi.cloud/create`. Die `CREATE_HOST`-Regeln in `next.config.ts`
  bleiben schlafend liegen, falls die Entscheidung kippt.
- **P3** — Neue Adresse überall nachziehen: `README.md`, `CLAUDE.md`, `AGENTS.md`,
  `GEMINI.md`, `HANDOFF.md`, `/about`, `docs/`.

### Navigation
- **P4** — Umgesetzt: Create → Chat per `← chat`-Anker in der `PlaygroundShell`-Kopfzeile
  (relativer Pfad auf `/unified`). Chat → Create existiert (`AppSidebar.tsx:122`).

### Galerie
- **P5** — Löschen im Create fehlt. `MetaRail` kann Download, Retry, als Referenz verwenden.
- **P6** — Ein Asset-Pool statt zwei. Technisch günstig: beide Oberflächen schreiben schon in
  denselben `db.assets`-Store, Create filtert nur auf `PLAYGROUND_CONVERSATION_ID`.
  Das ist eine Sicht- und Filterfrage, keine Datenmigration.

### Wahrheit über Modelle
- **P15** *(neu, aus dem Registry-Befund)* — Die geführten Modelllisten gegen die Live-Registry
  abgleichen: tote Einträge entfernen, falsche `isFree`-Markierungen korrigieren, neue
  kostenlose Modelle aufnehmen, `CLAUDE.md` nachziehen. Betrifft Bild, Video **und** Musik.

### Chat entschlanken
- **P7** — Visualize im Chat auf wenige Modelle reduzieren; die volle Auswahl lebt im Create.
- **P8** — Compose aus dem Chat: technisch erledigt, committen und verifizieren.
- **P9** — Intent-Erkennung im Chat live bestätigen.

### Create ausbauen
- **P10a** — Musik als vierter Modus im Create, eigene UI, alle verfügbaren
  Pollinations-Modelle. Ausschließlich schlüsselpflichtig, hinter der Pollenwall.
- **P10b** — Musik auf eigener Infrastruktur (Modal, ACE-Step). **Zurückgestellt**, nicht
  Teil des Launch-Wegs.
- **P11** — ASCII-Flow-Effekte im Create, wie auf der Chat-Startseite.
- **P12** — Create auf dem Telefon: nicht nur umgebrochen, sondern bedienbar.
- **P13** — Fehlermeldungen, die sagen was los ist und was zu tun ist.

### Ziel
- **P14** — Interne Launch-Kriterien als eigene Datei.

---

## Phasen

### Phase 0 — Arbeitsbaum konsolidieren · ✅ ERLEDIGT am 2026-08-28

**Ergebnis:** 99 offene Dateien in sechzehn thematische Commits überführt
(`f880389..aa3eac4`), gepusht, live verifiziert. Jeder Commit einzeln in einem eigenen
Worktree geprüft und grün (685 → 780 Tests, kein Sinken). Vollständiger Bericht mit den
Befunden je Phase: [`HANDOFF-2026-08-28-phase-0.md`](HANDOFF-2026-08-28-phase-0.md).

**Offen geblieben** (braucht einen Browser, deshalb nicht erledigt, sondern offen
ausgewiesen): kein Compose-Badge auf dem Telefon · Pollen-Key-Feld beim ersten Öffnen ·
ein echter Pruna-Videolauf über das 202-Protokoll · Antwortstil/Stimme/Tempo auf dem
Telefon erreichbar.

**Warum zuerst:** Jede weitere Phase editiert Dateien, die hier bereits offen sind.

- Die Änderungen nach Thema in getrennte Commits sortieren (Pruna/Polling · Chat-Input-Umbau ·
  Settings-Umzug · Infrastruktur)
- Was unfertig ist, benennen: entweder fertigstellen oder bewusst zurücknehmen
- Live gegen die deployte Seite verifizieren: **P9** (Intent-Erkennung), **P8** (Chat ohne
  Compose), Pollen-Key-Feld, ein echter Pruna-Video-Lauf über das 202-Protokoll

**Fertig, wenn:** `lint`, `typecheck`, `npm test`, `npm run build` grün · gepusht ·
Chat und Create live erreichbar · Intent-Erkennung im Live-Chat bestätigt.

---

### Phase 1 — Launch-Kriterien festschreiben (**P14**)
**Warum hier:** Steuert die Reihenfolge und den Abbruchpunkt aller folgenden Phasen.

- Datei `docs/LAUNCH_CRITERIA.md`: was muss laufen, damit die Adresse öffentlich geteilt wird
- Pro Kriterium ein prüfbarer Satz, keine Absichtserklärung
- Ausdrücklich festhalten, was **nicht** zum Launch gehört

**Fertig, wenn:** Die Datei liegt, jedes Kriterium ist ohne Rückfrage prüfbar, jede Phase
2–9 lässt sich einem Kriterium zuordnen. Phase 10 ist ausdrücklich als nicht launchrelevant
vermerkt.

---

### Phase 2 — Create-Identität (**P1**, **P2**, **P3**, **P4**)

- Umbenennung in der Oberfläche und in beiden Sprachen
- ~~`create.hey-hi.cloud` auf demselben Projekt~~ → Routenpfad `/playground` → `/create`
  auf demselben Ursprung (Entscheidung 2026-08-29)
- Navigation in beide Richtungen; im Create eine sichtbare Rückkehr zum Chat
- Alle Wahrheitsdokumente auf die neue Adresse ziehen

**Fertig, wenn:** `chat.hey-hi.cloud/create` öffnet Create · `chat.hey-hi.cloud` öffnet den
Chat · `/playground` leitet weiter · beide Richtungen sind mit einem Klick erreichbar ·
kein Dokument nennt mehr nur die alte Adresse.

**Warum kein eigener Hostname:** `localStorage` und `IndexedDB` haengen am Hostnamen. Eine
zweite Adresse wäre ein zweiter Speicher — getrennte Galerie, Schlüssel zweimal, Phase 5
nicht mehr baubar. Der übliche iframe-Trick trägt seit dem Storage-Partitioning der
Browser nicht mehr. Also ein Ursprung, zwei Pfade.

---

### Phase 3 — Modellwahrheit gegen die Live-Registry (**P15**) — **erledigt 2026-08-28**
**Ergebnis:** [`docs/HANDOFF-2026-08-28-phase-3.md`](HANDOFF-2026-08-28-phase-3.md).
Skript + Snapshot + Tests + wöchentliche Action statt Handpflege; zwei Vorgabe-Bugs
(`zimage`→503, `gemini-fast`→402) und die Server-Key-Allowlist als eigentliche
Fehlerquelle gefunden. Ursprüngliche Aufzählung:

**Warum vorgezogen:** Voraussetzung für Phase 4 (verständliche Fehler), Phase 7 (Chat
entschlanken) und Phase 8 (Musik). Man kann nicht auf drei Modelle reduzieren, solange
unklar ist, welche überhaupt funktionieren.

- `unified-image-models.ts` und `chat-options.ts` gegen `gen.pollinations.ai/*/models` prüfen
- Tote Einträge entfernen oder abschalten: `gpt-image`, `wan-image-small`, `ltx-2`, `acestep`
- Falsche Kostenlos-Markierungen korrigieren: `qwen-image`, `grok-imagine`, `ideogram-v4-turbo`
- Neue kostenlose Modelle bewerten und gegebenenfalls aufnehmen: `dreamshaper`, `nova-canvas`,
  `nova-reel`
- Klären, wie mit Namensraum-Modellen (`vendouple/…` und andere) umgegangen wird — heute
  kennt die Konfiguration das Muster nicht
- Klären, was es bedeutet, dass `p-image`, `p-image-edit`, `p-video` jetzt auch bei
  Pollinations erscheinen — betrifft die Provider-Trennung
- `CLAUDE.md` und `README.md` nachziehen
- Prüfen, ob ein wiederkehrender Abgleich sinnvoll ist, statt die Liste von Hand zu pflegen

**Fertig, wenn:** Kein angebotenes Modell antwortet mit „unbekannt" · kein als kostenlos
markiertes Modell verlangt einen Schlüssel · `CLAUDE.md` stimmt mit der Registry überein.

---

### Phase 4 — Fehlerklarheit und Laufstabilität (**P13** + Altlasten 1–7)

- Jeder Fehlerpfad endet in einem verständlichen Satz: was ist passiert, was tun.
  Besonders: Pruna-400 (`additional properties forbidden`), fehlender Schlüssel, 401/402/403,
  abgelaufene Läufe
- Pollen-403 klären; dritter Zustand für die Statuslampe (Schlüssel vorhanden, Konto nicht
  abrufbar) statt grün/rot
- `predictionId` überdauert einen Reload
- Verstrichene Zeit auf der laufenden Karte — Pruna liefert keinen Prozentwert
- `vercel.json` mit `maxDuration` als Netz
- `CLAUDE.md`: 202-Protokoll, `/api/pruna/status`, und dass Pruna unbekannte Felder ablehnt

**Fertig, wenn:** Für jeden bekannten Fehlerfall existiert eine Meldung, die ohne Konsole
verständlich ist · ein Reload während eines Videolaufs verliert den Lauf nicht.

---

### Phase 5 — Eine Galerie (**P5**, **P6**)

- `PLAYGROUND_CONVERSATION_ID` wird vom Trennkriterium zum Herkunfts-Tag
- Beide Oberflächen lesen denselben Pool, filtern standardmäßig auf ihre eigene Herkunft,
  umschaltbar
- Löschen im Create: entfernt Datenbankeintrag **und** Blob, kein verwaister Blob-Speicher
- `/gallery` zeigt weiterhin alles

**Fertig, wenn:** Ein im Chat erzeugtes Bild erscheint im Create nach Umschalten des Filters ·
Löschen entfernt Eintrag und Blob · nach einem Reload ist nichts zurück.

---

### Phase 6 — Create auf dem Telefon (**P12**)

- Drei-Spalten-Aufbau auf klein: Parameter und Detailleiste als Schubladen
- Prompt-Leiste über der Tastatur bedienbar
- Galerie-Raster, Referenz-Slots, Modellauswahl per Finger benutzbar
- Auf einem echten Gerät prüfen, nicht nur im schmalen Fenster

**Fertig, wenn:** Auf dem Telefon ein Bild und ein Video vollständig erzeugt werden können,
inklusive Referenz-Upload.

**Vor Phase 8:** Die Musik-Oberfläche folgt dann dem hier festgelegten Muster, statt zweimal
gebaut zu werden.

---

### Phase 7 — Chat entschlanken (**P7**)

- Visualize im Chat auf eine kleine, begründete Auswahl reduzieren — aus den in Phase 3
  bestätigten Modellen
- Der Weg zur vollen Auswahl führt sichtbar ins Create
- Modelle nicht löschen, nur im Chat ausblenden — die Registry bleibt Wahrheit

**Fertig, wenn:** Der Chat zeigt die reduzierte Auswahl, das Create die vollständige, und
der Übergang ist beschriftet.

*Hängt nur an Phase 3, sonst unabhängig — kann parallel laufen.*

---

### Phase 8 — Musik im Create, Stufe 1 (**P10a**)

- Vierter Modus neben `t2i`, `i2i`, `t2v`, `i2v`
- Eigene Musik-Oberfläche im Vorbild von Suno/ACE-Studio/ElevenLabs: Beschreibung, Dauer,
  instrumental, Modellwahl, Ergebnisliste mit Abspieler
- Modellliste aus dem Registry-Befund: `elevenmusic`, `stable-audio-3-large`,
  `stable-audio-3-medium`, `lyria-3-clip`. `eleven-sfx` nur, wenn Geräusche ein eigener
  Zweck sein sollen
- **`acestep` überall entfernen** — 19 Fundstellen, darunter vier Vorgabewerte
- **Musik liegt vollständig hinter der Pollenwall** — so gewollt. Ohne Schlüssel zeigt der
  Modus keinen Fehler, sondern den Hinweis, dass Musik einen Pollen-Schlüssel braucht, samt
  Weg zu den Einstellungen. Der Modus bleibt sichtbar, die Erzeugung ist gesperrt
- Ergebnis landet im gemeinsamen Asset-Pool aus Phase 5
- Grenze der bestehenden Route beachten: GET-Endpunkt mit Längenlimit für den Prompt

**Fertig, wenn:** Jedes geführte Musikmodell erzeugt mit Schlüssel im Create einen Track ·
ohne Schlüssel erklärt die Oberfläche die Pollenwall, statt einen Fehler zu zeigen · der Track
erscheint in der Galerie und überlebt einen Reload · `acestep` kommt im Code nicht mehr vor.

---

### Phase 9 — ASCII-Flow im Create (**P11**)

- `src/components/ascii/` im Create verdrahten, im Geist der Chat-Startseite
- Nicht während laufender Generierungen um Rechenzeit konkurrieren; auf kleinen Geräten
  und bei `prefers-reduced-motion` zurücknehmen

**Fertig, wenn:** Der Effekt läuft im Create, kostet keine spürbare Bildrate während einer
Generierung und lässt sich abschalten.

---

### Phase 10 — Musik auf eigener Infrastruktur (**P10b**) · zurückgestellt

**Nicht Teil des Launch-Wegs.** Der Nutzer hat am 2026-08-26 entschieden, dass Musik vorerst
ein Testfeld hinter der Pollenwall bleibt. Damit entfällt der Grund für eigene Infrastruktur:
sie war nur nötig, um ein kostenloses Einstiegsmodell anzubieten.

Wieder aufnehmen, wenn einer dieser Fälle eintritt:

- Ein kostenloses Musikangebot wird doch gewünscht
- Pollinations fällt als Musikanbieter aus oder wird zu teuer
- Eigene Limitsteuerung wird gebraucht (`src/lib/rate-limit.ts` liegt bereits im Arbeitsbaum)

Der Einstieg wäre dann: offene Musikmodelle sichten (ACE-Step, YuE, MusicGen, Stable Audio
Open), Lizenzen für ein öffentliches Angebot prüfen, Kaltstart- und GPU-Kosten auf Modal
rechnen, entscheiden.

---

## Reihenfolge und Parallelität

```
Phase 0-3 ✅ ─┬─► Phase 4 ─► Phase 5 ─► Phase 6 ─► Phase 8 ─► Phase 9
              └─► Phase 7

Phase 10 ist zurückgestellt und Teil keines Pfads.
```

- ~~**Phase 0 blockiert alles.**~~ Erledigt am 2026-08-28.
- **Phase 3 ist der zweite Flaschenhals**: Phase 4, 7 und 8 hängen an der Modellwahrheit.
- **Phase 7** berührt keine Create-Datei und läuft parallel zu 4–6.
- **Phase 6 vor Phase 8**, sonst wird die Musik-Oberfläche zweimal gebaut.
- **Phase 5 vor Phase 8**, damit Tracks direkt im gemeinsamen Pool landen.

## Für den nächsten Thread

Jede Phase startet mit: dieses Dokument lesen, `AGENTS.md` für den Arbeitsablauf,
`CLAUDE.md` für die Laufzeitwahrheit. **Modellfragen gegen die Live-Registry prüfen, nicht
gegen die Dokumentation** — der Befund oben zeigt, wie weit beide auseinanderliegen.
Fehlerursachen gegen den laufenden Server prüfen, nicht aus dem Code herleiten; das war die
Lehre aus den Playground-Sitzungen im August.
