# HANDOFF — HEYHIHOSTED

## Pfad

`~/heyhihosted` (unverändert nach Reorg)

GitHub: `loopmaster303/heyhihosted` · Branch: **`main`** (Stand `68c1908`)

## Was ist das Projekt

**Level 2 („Benutzen")** im hey-hi Ökosystem (kanonisch: `~/heyhi/LEVELS.md`) — Produktions-App (hey-hi.space). Next.js 16, Pollinations, minimalistisches Chat-Interface, Text/Bild/Video/Musik (Compose) + Voice (TTS/STT), lokale Persistenz (IndexedDB/localStorage), BYOP-Key.

## Aktueller State (2026-07-07)

- **Working tree clean, HEAD = `68c1908`.** Alle Session-Arbeiten committet.
- **Verifikation grün:** `tsc --noEmit` 0 Fehler; volle Jest-Suite **310/310** (54 Suiten).
- Letzte Commits dieses Threads:
  - `906f53c` feat(ui): Logos, Modellnamen, Compose-Tiers, Mobile-Layout, Provider-Switch → Sidebar
  - `c097e75` feat(compose): modell-spezifische Enhancement-Prompts (ACE-Step/ElevenMusic/Stable Audio)
  - `68c1908` fix(enhance-prompt): `hasBpm` erkennt „BPM: 80"-Format + Compose-Routing-Tests
- **Details der UI/Compose/Doku-Arbeit:** siehe [handoff-extra.md](handoff-extra.md).
- **Wichtige Lernung (2026-07-07):** Pollinations-Musikmodelle (`acestep`/`elevenmusic`/`stable-audio-3-medium`) sind **nicht anonym frei** — `paid_only: null` in der Modell-Liste heißt nicht „ohne Key nutzbar". Sie brauchen einen Key **mit Musik-Freigabe** (Server-`POLLEN_API_KEY` oder BYOP). Ein „internal server error" bei Compose = meist 403 „Model X is not allowed for this API key" vom Upstream, kein App-Bug.

## Was in diesem Thread passiert ist (2026-07-05/06)

### 1. Freeze des Subagent-Durchlaufs (`fe33ae3` und Vorgänger)
Vorher lagen ~65 uncommittete Dateien direkt auf main (Datenverlust-Risiko). Reviewt, verifiziert, in 8 logische Commits gruppiert und per fast-forward auf main gemergt:
- `feat(pruna)` Pruna-Client + Model-Config + Upload-Constants
- `feat(api)` Härtung generate/compose/enhance-prompt
- `feat(security)` SSRF-Härtung media-ingest/upload/proxy-image
- `feat(audit)` raw `eval` durch sichere Parser ersetzt, `mktemp` statt vorhersagbarer /tmp-Files
- `fix(chat)` Streaming-Fix + `requestedModel`
- `fix(ui)` ComposeTool-Input, IME-Handling, sourceVideo-Wiring
- `feat(config)` Model-Configs, Prompts, Translations

### 2. Task 6 — Chat Core (`520267a`)
- **Streaming-Datenverlust behoben:** `runTextChatCompletionFlow` speicherte nur den letzten Stream-Chunk. Jetzt ist der Rückgabewert von `sendChatCompletion` (die vollständige akkumulierte Antwort) autoritativ; der Stream-Callback dient nur noch der Live-UI. Deckt auch den JSON-Pfad ab, bei dem `onStream` nie feuert. Tests in `chat-send-orchestrator.test.ts`.
- **Vision-Fallback-Toast:** nannte das falsche Modell. Neues Feld `requestedModel` in `resolveRequestCapabilities` → Toast nennt jetzt das ursprünglich gewählte Modell, nicht das Fallback. Der **Systemprompt selbst war korrekt** (wird bereits fürs Zielmodell gebaut) — das war ein Fehlalarm aus der Task-Spec.

### 3. Task 7 — UI (`02334ae`)
- `unified-input.tsx`: respektiert jetzt `e.defaultPrevented`, blockiert Enter-Submit während aktiver IME-Composition (CJK-Eingabe). Tote Prop `topElementsVariant` entfernt (inkl. Consumer). Tests in `unified-input.test.tsx`.
- ComposeTool: funktionaler Input-Pfad wiederhergestellt.

### 4. Phase 3 — Level-2-Härtung finalisiert (`56198f8`, `46aff13`, `b273862`, `3a6e7ff`)
- **`pollinations-sdk.test.ts`**: war der einzige rote Test. Der Test war veraltet, nicht der Code — der Shim entfernt den API-Key bewusst aus der URL (Auth via Header). Test beweist jetzt das sichere Verhalten (kein `key=` in der URL).
- **AbortSignal für Media-Ingest**: `request.signal` durchgereicht bis zu jedem Source-Fetch, der Poll-Loop-Pause und dem Upload; AbortError → `ApiError(499)`. Abgebrochene Clients treffen die Provider nicht mehr weiter.
- **Pruna-Download-Redirect-Policy**: `downloadPrunaResult` validiert Generation-URL + jedes Redirect-Ziel über die geteilte SSRF-Policy, folgt Redirects manuell, sendet `apikey` nur an den initial validierten Host.
- **Subdomain-Label-Policy — bewusste Nicht-Änderung**: KEINE Label-Blockierung für `metadata.example.com`/`internal.example.com` eingebaut (Fehlalarm-Risiko bei CDNs, kein echter Gewinn gg. DNS-Rebinding). Die echten Cloud-Metadata-Endpoints (169.254.169.254, `*.internal`) sind bereits durch Private-IP-/Reserved-TLD-Regeln blockiert — als Regressionstest + Kommentar festgenagelt. **Nicht versehentlich „verschärfen".**

## Bewusst NICHT angefasst

- **Systemprompt** (`src/config/chat-options.ts`) bleibt unverändert (User-Entscheidung). Enthält weiterhin „Burn the Corpos" + „Filter Evasion"-Passagen. Vor einem öffentlichen „privacy first, user friendly"-Claim wäre eine redaktionelle Härtung nötig (Haltung behalten, operative Exploit-/Evasion-Anleitungen entschärfen) — aber nur auf ausdrückliche Ansage.
- **BYOP-Key XSS**: Key liegt weiter in Web-Storage (in CLAUDE.md als „partially hardened but still XSS-sensitive" dokumentiert). Offen.

## UI/Compose-Arbeit Session 2026-07-06/07 (committet: `906f53c`, `c097e75`, `68c1908`)

Details in [handoff-extra.md](handoff-extra.md).

| Bereich | Was |
|---------|-----|
| **Logos** | prunafarbe, ideogramfarbe, ltxfarbe, minimaxfarbe, acestepfarbe, elevenlabsfarbe, stabilityfarbe gemappt (7 PNGs) |
| **Namen** | kimi→Moonshot Kimi K2.6, glm→z.ai GLM-5.2, minimax→Minimax M3 |
| **Compose** | ACE-Step free 30/60s, gestufte Key-Tiers, Modell-Umschalter mit Logos, ElevenMusic v2, modell-spezifische Enhancement-Prompts, `hasBpm`-Fix |
| **Provider-Switch** | Switch Bubble→Sidebar, `useProviderMode.ts`-Hook extrahiert |
| **Mobile** | Logo-only + 3-Punkte-Popover (Radix) bei ≤639px, Kurzlabels |
| **Doku** | README/HANDOFF/MEMORY auf Registry-Realität + Compose-Tiers |

## Nächste Schritte

1. **Produktions-Deploy** von `main` prüfen (Deploy-Wahrheit klären: `apphosting.yaml` deutet auf Firebase — was serviert hey-hi.space aktuell wirklich?).
2. Systemprompt-Redaktion + BYOP-XSS — nur nach ausdrücklicher Freigabe.
3. Ökosystem-Roadmap: Level-2 ist damit weitgehend gehärtet; nächster Ökosystem-Schritt ist Phase 2a (Doppeltür justsaywow ⊕ justsayhi), nicht in diesem Repo.
