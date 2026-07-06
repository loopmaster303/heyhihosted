# HANDOFF — HEYHIHOSTED

## Pfad

`~/heyhihosted` (unverändert nach Reorg)

GitHub: `loopmaster303/heyhihosted` · Branch: **`main`** (origin synchron, Stand `3a6e7ff`)

## Was ist das Projekt

**Level 2 („Benutzen")** im hey-hi Ökosystem (kanonisch: `~/heyhi/LEVELS.md`) — Produktions-App (hey-hi.space). Next.js 16, Pollinations, minimalistisches Chat-Interface, Text/Bild/Video/Musik (Compose) + Voice (TTS/STT), lokale Persistenz (IndexedDB/localStorage), BYOP-Key.

## Aktueller State (2026-07-06)

- **Working tree dirty** (26 Dateien: 16 modified, 10 untracked) — siehe Tabelle „Uncommittete Änderungen" unten. Commit `3a6e7ff` ist letzter committeter Stand.
- **origin/main = main** (beide auf `3a6e7ff`).
- **Verifikation grün:** `tsc --noEmit` 0 Fehler; volle Jest-Suite **307/307** (54 Suiten). Es gibt keinen bekannten roten Test mehr — „Suite grün" ist wieder ein vollwertiges Signal.
- Der große Subagent-Umbau (Pruna-Integration, API-/Security-Härtung, Audit-Scripts, Chat/UI-Fixes) ist committet; die uncommitteten Änderungen sind alle aus dem aktuellen Session-Thread (Logos, Namen, Compose-Tiers, Provider-Switch-Verschiebung, Mobile-Layout).

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

## Uncommittete Änderungen (Session 2026-07-06)

**Alle untenstehenden Änderungen sind im Working Tree, nicht committet** (User-Regel „no auto-commit"). Details in [handoff-extra.md](handoff-extra.md).

| Bereich | Dateien | Was |
|---------|---------|-----|
| **Logos** | `ui-constants.ts`, 7 neue PNGs | prunafarbe, ideogramfarbe, ltxfarbe, minimaxfarbe, acestepfarbe, elevenlabsfarbe, stabilityfarbe gemappt |
| **Namen** | `ui-constants.ts`, `chat-options.ts` | kimi→Moonshot Kimi K2.6, glm→z.ai GLM-5.2, minimax→Minimax M3 |
| **Compose** | `chat-options.ts`, `useComposeMusicState.ts`, `ComposeInlineHeader.tsx`, `compose/route.ts`, `translations.ts` | ACE-Step free 30/60s, gestufte Key-Tiers, Modell-Umschalter mit Logos, ElevenMusic v2 |
| **Provider-Switch** | `useProviderMode.ts` (neu), `PersonalizationSidebarSection.tsx`, `VisualizeInlineHeader.tsx`, `VisualizeInputContainer.tsx`, `ChatInput.tsx` | Switch Bubble→Sidebar, Hook-Extraktion |
| **Mobile** | `InlineParamsContainer.tsx` (neu), `ModelSelector.tsx`, `ComposeInlineHeader.tsx`, `VisualizeInlineHeader.tsx` | Logo-only + 3-Punkte-Popover (Radix) bei ≤639px |
| **Doku** | `README.md`, `HANDOFF.md`, `MEMORY.md` (Auto) | Registry-Realität, Pruna zurück, Compose-Tiers |

### Verifikation (Commit-frei reproduzierbar)
```bash
npx tsc --noEmit                     # 0 Fehler
CI=1 npx jest --runInBand            # 307/307 (54 Suiten)
```

## Nächste Schritte

1. **Mobile-Verifikation**: Layout vom User bei 375px bestätigt („sieht erstmal soweit gut aus"). Letzte Fixes: Kurzlabels (30s/1m), „Compose" statt „Compose with" auf Mobile.
2. **Commit-Entscheidung**: 26 Dateien uncommittet (16 modified, 10 untracked). Review → commit.
3. **Produktions-Deploy** von `main` prüfen (Deploy-Wahrheit klären: `apphosting.yaml` deutet auf Firebase — was serviert hey-hi.space aktuell wirklich?).
4. Systemprompt-Redaktion + BYOP-XSS — nur nach ausdrücklicher Freigabe.
5. Ökosystem-Roadmap: Level-2 ist damit weitgehend gehärtet; nächster Ökosystem-Schritt ist Phase 2a (Doppeltür justsaywow ⊕ justsayhi), nicht in diesem Repo.
