# HANDOFF — HEYHIHOSTED

## Pfad

`~/heyhihosted` — kanonisches Level-2-Repo im hey-hi Ökosystem.

GitHub: `loopmaster303/heyhihosted` · Branch: **`main`** (Stand `741c08c`)
Live: `https://chat.hey-hi.cloud` + `https://chat.hey-hi.cloud/create`
Keine zweite Domain (Entscheidung 2026-08-29): `create.hey-hi.cloud` wäre ein
zweiter Browser-Ursprung und würde IndexedDB und localStorage aufteilen — getrennte
Galerie, Schlüssel zweimal. Stattdessen liegt Create als Pfad auf demselben Ursprung.
Die `CREATE_HOST`-Regeln in `next.config.ts` bleiben schlafend liegen.

## Was ist das Projekt

**Level 2 („Benutzen")** im hey-hi Ökosystem — Produktions-App. Next.js 16, Pollinations + Pruna, minimalistisches Chat-Interface, Text/Bild/Video/Musik (Compose) + Voice (TTS/STT), lokale Persistenz (IndexedDB/localStorage), BYOP-Key.

Seit August 2026 enthält `main` auch das **Create** (`/create`, bis 2026-08-29 `/playground`): einen dedizierten, Vollbild-Workspace für Bild- und Videogenerierung mit Provider-Switch, Modus-Tabs, Referenz-Uploads und Generierungs-Details.

## Aktueller State (2026-08-28)

> **✅ Der Arbeitsbaum ist sauber.** Phase 0 ist abgeschlossen: die 99 offenen Dateien
> sind in **sechzehn thematische Commits** überführt, gepusht und live verifiziert.
> `git status` ist leer. Jeder Commit wurde einzeln in einem eigenen Worktree geprüft und
> ist für sich grün. Details, Werkzeuge und die Befunde je Phase:
> [`docs/HANDOFF-2026-08-28-phase-0.md`](docs/HANDOFF-2026-08-28-phase-0.md).

- **HEAD = `fcb1124`** (Phase 2), synchron mit `origin/main`. Kein offener Arbeitsbaum mehr.
- **Aktiver Plan:** [`docs/FAHRPLAN-create.md`](docs/FAHRPLAN-create.md) — zehn Phasen zur öffentlich verlinkbaren Version.
- **Orientierung je Phase:** [`docs/HANDOFF-2026-08-27-fahrplan.md`](docs/HANDOFF-2026-08-27-fahrplan.md) — Zuordnung des Arbeitsbaums nach Herkunft, Wegweiser und Fallstricke pro Phase.
- **Letzte Sitzung mit Code:** [`docs/HANDOFF-2026-08-28-phase-3.md`](docs/HANDOFF-2026-08-28-phase-3.md) — Modellwahrheit gegen die Live-Registry, 849 Tests grün, lint/tsc/build sauber, gegen Live und Dev-Server verifiziert.
- **Live-Deploy:** `chat.hey-hi.cloud` und `chat.hey-hi.cloud/create` zeigen den Stand
  `aa3eac4`. Live geprüft: Chat antwortet, `flux` erzeugt ein echtes Bild, die
  Intent-Erkennung emittiert ihren Marker, `/api/pruna/status` ist erreichbar.
- **Pruna ist bewusst BYOP-only.** In der Vercel-Umgebung ist **kein** `PRUNA_API_KEY`
  hinterlegt, und das bleibt so: Pruna-Läufe kosten pro Lauf, jeder bringt seinen eigenen
  Schlüssel mit. Für **Pollinations** liegt dagegen ein Server-Key bereit — deshalb
  funktionieren die freien Modelle dort ohne Zutun. Live geprüft am 2026-08-28:
  ohne Pruna-Schlüssel antwortet jedes Pruna-Modell mit 503, mit BYOP-Schlüssel im
  Browser läuft es. Der Unterschied ist gewollt, nicht kaputt.
  Die drei ehemals „kostenlosen" Pruna-Modelle (`zimage`, `qwen-image`, `wan-image-small`)
  sind deshalb jetzt korrekt `isFree: false, enabled: false, byopVisible: true`.

### Modellwahrheit: geprüft und messbar

Die Modell-Listen sind seit dem 2026-08-28 gegen die Live-Registry geprüft
(`scripts/check-model-registry.mjs`, Snapshot `src/config/__fixtures__/registry-snapshot.json`,
Tests in `registry-truth.test.ts` / `registry-consistency.test.ts`, wöchentlicher
GitHub-Action-Lauf). Ein Registry-Befund wandert nie still in die Config — Angebotsfragen
sind Produktentscheidungen. Details: `CLAUDE.md`, Abschnitt „Modellwahrheit prüfen".
Wichtig: die Registry ist **key-scoped** — die Server-Key-Allowlist entscheidet, was
keylose Nutzer wirklich erreichen (deshalb sind `kontext`/`gptimage-large` bis auf
Weiteres ausgeblendet).

## Wichtige technische Eckpunkte nach dem Merge

- **Routes:** `/` (Landing/Chat), `/create` (Create; `/playground` leitet dorthin weiter), `/chat`, `/gallery`, `/settings`, `/about`.
- **Playground-Komponenten:** `PlaygroundShell`, `PlaygroundSidebar`, `ParamControls`, `ModelPicker`, `ModeTabs`, `ReferenceSlots`, `PromptBar`, `Gallery`, `MetaRail`, `SettingsDialog`.
- **Provider-Switch:** Pollinations ↔ Pruna; scopet nur die Visualize/Playground-Modellliste (Chat/Compose/Voice bleiben Pollinations).
- **Modi:** t2i, i2i, t2v, i2v — jeweils mit validiertem Referenz-Upload (`/api/media/upload` für Pollinations, `/api/pruna/upload` für Pruna).
- **Aspect Ratio:** UI zeigt Seitenverhältnisse an (1:1, 3:4, 4:3, 16:9, 9:16); Übersetzung in API-spezifische Werte passiert serverseitig.
- **Safety-Filter:** Für Pruna-Modelle pro Modell-Doku deaktiviert (`disable_safety_checker` / `disable_safety_filter` je nach API-Schema).
- **Upload-Härtung:** Raw-body only, multipart wird abgelehnt; `readBodyWithLimit()` streamt statt zu puffern.

## Was seit dem 12.08. passiert ist

- **2026-08-26** — Pruna-Payload-Korrekturen, Umstellung auf Client-Polling (`202`-Protokoll,
  `/api/pruna/status`), VACE ausgeblendet, Pollen-Key-Feld repariert. Details im
  [Sitzungs-Handoff](docs/HANDOFF-2026-08-26-pruna-video.md). Uncommitted.
- **2026-08-27** — Analyse und Planung, kein Code: Fahrplan in zehn Phasen, Registry-Drift
  aufgedeckt, Entscheidungen zu Domain, Galerie und Musik festgehalten. Details im
  [Fahrplan-Handoff](docs/HANDOFF-2026-08-27-fahrplan.md).
- Dazwischen liegt eine **ältere, undokumentierte Sitzung** (Chat-Input-Umbau,
  Settings-Umzug, ASCII-Komponenten, Rate-Limit, Features-Flag), deren Absicht nirgends
  festgehalten ist. Ihre Dateien sind in Abschnitt 5.1 des Fahrplan-Handoffs aufgelistet.

## Was beim Playground-Merge passiert ist (2026-08-12)

1. **Playground-Redesign finalisieren:** Lade-Spinner, Generation-Details, Download/Retry/Referenz-Buttons, Detail-Drawer für fertige Ergebnisse.
2. **Aspect-Ratio-Fix:** UI zeigt echte Seitenverhältnisse; serverseitige Übersetzung für Pollinations- und Pruna-Modelle.
3. **Safety-Filter-Fix:** Jede Pruna-Modell-Doku einzeln geprüft; korrekter Safety-Disable-Key pro Modell.
4. **Reference-Upload-Fix:** i2i-Referenzbilder werden als Raw-Body (nicht multipart) hochgeladen.
5. **Merge & Cleanup:** Playground in `main` gemergt, Worktrees/Branches aufgeräumt, Dev-Origins bereinigt, Tailscale-URL entfernt.
6. **Doku-Realignment:** README, AGENTS, HANDOFF, CLAUDE, GEMINI, docs/-Eintragspunkte und Architektur-Docs auf post-merge Realität aktualisiert.

## Bewusst NICHT angefasst / offen

- **Systemprompt** (`src/config/chat-options.ts`) bleibt unverändert.
- **BYOP-Key XSS:** Keys liegen weiter in Web-Storage; in `CLAUDE.md` dokumentiert.
- **Ökosystem-Integration:** Level-1 (sayhi) und Level-3 (democrabs) sind separate Repos; XLinks/MainSpace in `heyhireset`.
- **True Streaming:** Chat bleibt non-streaming JSON über `/api/chat/completion` (siehe `docs/streaming-status.md`).

## Nächste Schritte

Priorisiert im [Fahrplan](docs/FAHRPLAN-create.md). **Phase 0–3 sind erledigt**, der Weg
beginnt bei Phase 4. Kurzfassung:

```
Phase 0-3 ✅ ─┬─► Phase 4 ─► Phase 5 ─► Phase 6 ─► Phase 8 ─► Phase 9
              └─► Phase 7
```

| Phase | Inhalt |
|---|---|
| ~~**0**~~ | ~~Arbeitsbaum konsolidieren~~ — **erledigt am 2026-08-28**, `f880389..aa3eac4` |
| **1** | Launch-Kriterien als Definition of Done festschreiben |
| **2** | Playground heißt Create, eigene Adresse, Navigation in beide Richtungen |
| ~~**3**~~ | ~~Modellwahrheit gegen die Live-Registry~~ — **erledigt am 2026-08-28** (Handoff: `docs/HANDOFF-2026-08-28-phase-3.md`) |
| **4** | Verständliche Fehlermeldungen, Laufstabilität |
| **5** | Eine Galerie für Chat und Create, Löschen |
| **6** | Create auf dem Telefon |
| **7** | Visualize im Chat entschlanken |
| **8** | Musik im Create, hinter der Pollenwall |
| **9** | ASCII-Flow im Create |
| **10** | Musik auf eigener Infrastruktur — **zurückgestellt** |

Weiterhin offen, außerhalb des Fahrplans:

1. Ungenutzte Dependencies prüfen (`knip` meldete historisch False Positives).
2. Ghost-Einträge in Registries (z. B. `seedream`, `dirtberry`) — fällt weitgehend mit Phase 3 zusammen.
3. Weiteres Ökosystem-Cleanup nach Bedarf in den anderen Level-Repos.

## Für den nächsten Agenten

1. Dieses Handoff lesen.
2. [`docs/HANDOFF-2026-08-28-phase-0.md`](docs/HANDOFF-2026-08-28-phase-0.md) lesen — was
   Phase 0 hinterlässt, welche Befunde in welche Phase gehören, und was aus ihr offen blieb.
3. [`docs/HANDOFF-2026-08-27-fahrplan.md`](docs/HANDOFF-2026-08-27-fahrplan.md) für Fundort
   und Fallstricke je Phase. **Achtung:** seine Zuordnung des Arbeitsbaums (Abschnitt 5.1)
   ist historisch — der Baum ist aufgelöst, und die Zuordnung war unvollständig; das
   Phase-0-Handoff nennt die fünf fehlenden Gruppen.
3. `AGENTS.md` für den 4-Phasen-Workflow beachten.
4. `CLAUDE.md` für Runtime-Truth — **außer Modell-Listen**, siehe Warnung oben.
5. `docs/README.md` als Karte für aktive vs. archivierte Docs nutzen.
6. Keine neuen Wahrheitsdokumente erfinden — bestehende aktualisieren.
7. Modell- und Schnittstellenfragen gegen die laufende API prüfen, nicht gegen den Code. Das ist die durchgehende Lehre der August-Sitzungen.
