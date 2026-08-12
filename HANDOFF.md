# HANDOFF — HEYHIHOSTED

## Pfad

`~/heyhihosted` — kanonisches Level-2-Repo im hey-hi Ökosystem.

GitHub: `loopmaster303/heyhihosted` · Branch: **`main`** (Stand `2b59c86`)
Live: `https://chat.hey-hi.cloud` + `https://chat.hey-hi.cloud/playground`

## Was ist das Projekt

**Level 2 („Benutzen")** im hey-hi Ökosystem — Produktions-App. Next.js 16, Pollinations + Pruna, minimalistisches Chat-Interface, Text/Bild/Video/Musik (Compose) + Voice (TTS/STT), lokale Persistenz (IndexedDB/localStorage), BYOP-Key.

Seit August 2026 enthält `main` auch den **Playground** (`/playground`): einen dedizierten, Vollbild-Workspace für Bild- und Videogenerierung mit Provider-Switch, Modus-Tabs, Referenz-Uploads und Generierungs-Details.

## Aktueller State (2026-08-12)

- **HEAD = `2b59c86`**, synchron mit `origin/main`.
- **Playground-Merge abgeschlossen:** `playground/redesign` + WIP-Checkpoint `wip/aug12-chat-upload-visualize` wurden in `main` gemergt, Konflikte aufgelöst, gepusht.
- **Cleanup erledigt:** Worktrees `heyhihosted-playground` und `heyhihosted-playground-b` entfernt, obsolete Branches gelöscht, Tailscale-Test-Port entfernt.
- **Verifikation grün:** `npm run lint` 0 Fehler · `npm run typecheck` sauber · **588/588 Tests** (90 Suiten) · `npm run build` grün.
- **Live-Deploy bestätigt:** `chat.hey-hi.cloud` und `chat.hey-hi.cloud/playground` erreichbar und funktionsfähig.

## Wichtige technische Eckpunkte nach dem Merge

- **Routes:** `/` (Landing/Chat), `/playground` (Playground), `/chat`, `/gallery`, `/settings`, `/about`.
- **Playground-Komponenten:** `PlaygroundShell`, `PlaygroundSidebar`, `ParamControls`, `ModelPicker`, `ModeTabs`, `ReferenceSlots`, `PromptBar`, `Gallery`, `MetaRail`, `SettingsDialog`.
- **Provider-Switch:** Pollinations ↔ Pruna; scopet nur die Visualize/Playground-Modellliste (Chat/Compose/Voice bleiben Pollinations).
- **Modi:** t2i, i2i, t2v, i2v — jeweils mit validiertem Referenz-Upload (`/api/media/upload` für Pollinations, `/api/pruna/upload` für Pruna).
- **Aspect Ratio:** UI zeigt Seitenverhältnisse an (1:1, 3:4, 4:3, 16:9, 9:16); Übersetzung in API-spezifische Werte passiert serverseitig.
- **Safety-Filter:** Für Pruna-Modelle pro Modell-Doku deaktiviert (`disable_safety_checker` / `disable_safety_filter` je nach API-Schema).
- **Upload-Härtung:** Raw-body only, multipart wird abgelehnt; `readBodyWithLimit()` streamt statt zu puffern.

## Was in dieser Session passiert ist (2026-08-12)

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

## Nächste Schritte (unpriorisiert)

1. Ungenutzte Dependencies prüfen (`knip` meldete historisch False Positives).
2. Restliche tote UI-Bausteine aufräumen, falls sie nicht mehr benötigt werden.
3. Ghost-Einträge in Registries (z. B. `seedream`, `dirtberry`) gegen aktuelle API-Realität prüfen.
4. Weiteres Ökosystem-Cleanup nach Bedarf in den anderen Level-Repos.

## Für den nächsten Agenten

1. Dieses Handoff lesen.
2. `AGENTS.md` für den 4-Phasen-Workflow beachten.
3. `CLAUDE.md` für Runtime-Truth (Modelle, Provider-Semantik, BYOP-Keys, Asset-Persistence).
4. `docs/README.md` als Karte für aktive vs. archivierte Docs nutzen.
5. Keine neuen Wahrheitsdokumente erfinden — bestehende aktualisieren.
