# CLAUDE.md

**Ökosystem:** democrabs — "The crab snaps with everyone but it's yours". Dieses Repo ist Level 2 („Benutzen"), kanonisch in `~/heyhi/LEVELS.md`.

Regeln und Fallstricke, gegen den Code geprüft am 2026-10-01. Geschichte steht in den Handoffs.

## Einstieg

1. [AGENTS.md](AGENTS.md) — Arbeitsweise.
2. [docs/README.md](docs/README.md) — Karte: was aktiv ist, was Archiv.
3. [docs/LAUNCH_CRITERIA.md](docs/LAUNCH_CRITERIA.md) — Release-Gate und Status of record.
4. [docs/PLAN-entschlackung-2026-10-01.md](docs/PLAN-entschlackung-2026-10-01.md) und der letzte Handoff [docs/HANDOFF-2026-10-01-eine-flaeche.md](docs/HANDOFF-2026-10-01-eine-flaeche.md) — was diese Variante umgebaut hat und was offen ist.

## Produkt

**hey.hi** ist ein local-first KI-Arbeitsplatz auf Next.js 16, Pollinations.ai und Pruna AI. Zwei Räume in **einer** Hülle: **Chat** (`/`) und **Create** (`/create`); `/about` steht allein. Alte Adressen leiten um (`next.config.ts`).

## Hülle — vor Änderungen an `src/components/shell/` lesen

- `src/app/(app)/layout.tsx` rendert `AppShell`; die Seiten geben `null` zurück und tragen nur Metadaten. **Keinen Inhalt in eine Seite legen** — ein Raumwechsel würde ihn neu mounten.
- Beide Räume bleiben gemountet, der inaktive bekommt `inert`. Create lädt beim ersten Besuch (`next/dynamic`) und bleibt stehen — Unterhaltung und laufende Läufe überleben jeden Wechsel.
- Das offene Sheet steht in der Adresse (`?panel=history|gallery|settings`). `usePanelState` nutzt `history.pushState`/`back`/`replaceState`: Zurück schließt ein Sheet, Sheet-zu-Sheet ersetzt den Eintrag.
- **Ein** Sheet-Primitiv: [Sheet.tsx](src/components/shell/Sheet.tsx) auf vaul. Am Telefon wird `side="right"` zur Bottom-Sheet. Kein neues Dialog-/Popover-Gerüst für Panels.
- `useShell()` außerhalb der Hülle ist ein No-op (Tests, `/about`).
- Chat → Create: `handoffToCreate({prompt, modelId})`, Create liest einmal und ruft `consumeHandoff`. **Create-State gehört nie in den ChatProvider.**
- Höhe aus `--vvh` (`useViewportHeight`), nicht aus `dvh` — die Tastatur verkleinert den visual viewport. Abstände zu Notch/Home-Indikator über `env(safe-area-inset-*)`.
- z-Ebenen: 10 Inhalt · 40 Overlay · 50 Sheet/Dialog · 60 Popper · 70 Toast.

## Chat

- Sichtbare Textmodelle: `VISIBLE_POLLINATIONS_MODEL_IDS` in [chat-options.ts](src/config/chat-options.ts). Default `deepseek` (frei). `isFree: false` heißt Schlüssel nötig — der Picker zeigt POLLEN und verweigert ohne Schlüssel. Achtung: `gemini` (bezahlt) ist nicht `gemini-fast`.
- Modi sind zwei Schalter am Composer: **Recherche** (`webBrowsingEnabled`) und **Code** (`isCodeMode`). Visualize und Compose gibt es im Chat nicht mehr.
- Bilder entstehen im Chat **nur** über `[IMAGE_GEN: …]` (`MEDIA_MARKER_PROTOCOL` in [chat-prompt-builder.ts](src/lib/chat/chat-prompt-builder.ts)). Zwei Schritte in [chat-media-intent-handler.ts](src/lib/chat/chat-media-intent-handler.ts):
  1. `prepareAssistantMedia` — sauberer Text plus ein `pending`-Bildteil, sofort.
  2. `resolveImagePart` — erzeugen, speichern; wirft nie, liefert im Fehlerfall einen `error`-Teil.
- Garantien, die **nicht** davon abhängen, dass das Modell gehorcht: höchstens ein Bild pro Antwort, Marker in Code-Blöcken zählen nicht, `[MUSIC_GEN]` wird still geschnitten, der Marker ist nie sichtbar — auch nicht beim Streamen (`stripMarkersForDisplay`). Ein `pending`-Teil beim Laden gilt als unterbrochen (`interruptPendingMedia`).
- Bildmodell im Chat: eine Regel, `getChatImageModelGroups()` — Pollinations, Bild, `isFree`, `enabled`. Kein Optionsparameter, wächst mit keinem Schlüssel, folgt keinem Provider-Schalter. Wahl in den Einstellungen; `resolveChatImageModelId` fällt auf `flux` zurück. Wer die Auswahl ändern will, ändert die Regel, nicht die Registry.
- Der Systemprompt in `chat-options.ts` („Burn the Corpos", Filter-Umgehung, eingefrorene Modellnamen) ändert sich nur auf ausdrücklichen Auftrag.

## Create

- [PlaygroundShell.tsx](src/components/playground/PlaygroundShell.tsx), lokaler React-State. Modi `t2i`, `i2i`, `t2v`, `i2v`, `sound` (ACE-Step über `/api/sound`).
- Bis zu 3 Läufe parallel, je ein `ActiveRun` mit eigenem `AbortController`. „Erneut versuchen" wiederholt den Lauf, nicht den Composer-Stand.
- **Der Provider-Schalter scopet nur die Modellliste** (`useProviderMode` in `usePlaygroundModels`, `PlaygroundShell`, `ProviderSelect`). Den Dispatch entscheidet das **gewählte Modell**: `/api/generate` verzweigt auf `isPrunaModel()`, Uploads auf `selectedModelInfo.provider`. Die Namensgleichheit von `p-*` in beiden Registries wird bewusst ignoriert.
- Referenzbilder: `referenceMode` + `maxImages` (`getReferenceMode()`); `/api/generate` lehnt Abweichungen mit 400 ab.
- Lange Läufe antworten `202 {pending, predictionId, model}`, der Browser pollt über [request-generation.ts](src/lib/generation/request-generation.ts) (3 s, 30 min Reißleine). [run-store.ts](src/lib/generation/run-store.ts) hält den Lauf über einen Reload, **ohne neu zu dispatchen**.
- Pruna lehnt jedes unbekannte Feld ab (400). Schemas aus `docs.api.pruna.ai/guides/models/<model>`, nicht raten. Kein Cancel: jeder gültige Payload kostet — Validierung mit `https://invalid.invalid/x.jpg` prüfen.

## Modellwahrheit

- [unified-image-models.ts](src/config/unified-image-models.ts) ist die einzige Quelle für Bild/Video. Flags: `enabled` (sichtbar), `isFree` (ohne Schlüssel), `byopVisible` (mit eigenem Schlüssel). **Listen nicht in Prosa wiederholen.**
- `node scripts/check-model-registry.mjs` meldet Drift (Exit 1), wöchentlich auch als Action; `--update-snapshot` erneuert die Test-Fixture — nur mit geprüftem Diff.
- **Ein Registry-Befund schreibt die Config nie still um.** Die Registry ist schlüsselabhängig; was Nutzer ohne Schlüssel bekommen, entscheidet die Allowlist des Server-Schlüssels, nicht `paid_only`.

## Prompt-Verbesserung

`selectGuidelines()` in `/api/enhance-prompt`, Reihenfolge zählt: Alias (`canonicalEnhancementKey`, die **einzige** Tabelle, [enhancement-prompts.ts](src/config/enhancement-prompts.ts)) → Audio → handgeschrieben → aus Registry-Metadaten → Default. Scheitert nie an der Registry. Die Tags `<unfiltered>` (Guard) und `<quality_terms>` (kein `stripGlossTerms`) steuern die Route — durch keine Liste ersetzen.

## Schlüssel (BYOP)

| Schlüssel | Speicher | Header | Server |
|---|---|---|---|
| Pollen | `pollenApiKey` | `X-Pollen-Key` | `resolvePollenKey` |
| Pruna | `prunaApiKey` | `X-Pruna-Key` | `resolvePrunaKey` |

Validierung prüft die **Form**, nicht die Gültigkeit — ein Schlüssel ist keine Authentifizierung. Chat, Stimme und Prompt-Verbesserung laufen immer über Pollinations, nie mit Pruna-Schlüssel. Web Storage ist XSS-anfällig: akzeptiert.

## Assets

- Wohin ein Asset geht, entscheidet `isPollinationsHostedModel()`: Pollinations → `remoteUrl` plus Media-Ingest; Pruna ohne Pollen-Schlüssel → Blob in IndexedDB.
- Object-URLs nur über `BlobManager`, nie `URL.createObjectURL` direkt. Eine Blob-URL als `remoteUrl` ist nach dem Reload tot.
- Ein Pool `db.assets` für alle Räume. `assetOrigin()` ([asset-origin.ts](src/lib/assets/asset-origin.ts)) ist die **einzige** Stelle, die `conversationId` als Herkunft liest (`'__playground__'` → create, keine → compose, sonst chat). Der Herkunftsfilter der Galerie ist flüchtig und springt beim Öffnen auf den aktuellen Raum. Löschen nur über [delete-assets.ts](src/lib/assets/delete-assets.ts).

## Fehler

`ApiError` trägt einen `code` aus [error-codes.ts](src/lib/errors/error-codes.ts); der Client übersetzt **nur über `code`** ([describe-error.ts](src/lib/errors/describe-error.ts)), nie über Status oder Text. Der Fallback zeigt Status plus Rohtext. Ein Code ohne Satz macht `describe-error.test.ts` rot.

## Server-HTTP und Uploads

- [https-post.ts](src/lib/https-post.ts) ist `fetch` mit Zeitlimit je Aufrufer (30 s Standard, `LONG_RUNNING_TIMEOUT_MS` 290 s). Unter Next 16.3 geprüft: `Authorization` und `X-Pollen-Key` kommen an. Keinen Kindprozess zurückholen.
- `readBodyWithLimit()` statt `arrayBuffer()`. `isActiveContentType()` lehnt html/svg/js/xml ab. `/api/media/upload` nimmt nur rohe Bodies (Multipart → 415).
- **Nie einen Upload-`fetch` von Hand schreiben** — `uploadFileToPruna` / `uploadFileToPollinationsMedia` in [src/lib/upload/](src/lib/upload) besitzen Endpunkt, Body, Schlüssel-Header und Fehlertext.
- Server-Abrufe fremder Medien nur über die Allowlist in `remote-fetch-policy.ts`.

## Bewegung und Zugang

- Tokens `--motion-fast/med/slow` (160/280/420 ms), Kurve `ease-out` = `cubic-bezier(.2,.8,.2,1)`. Animiert werden nur `transform`, `opacity`, `filter`. Kein `transition-all`. `prefers-reduced-motion` greift global und über `MotionConfig reducedMotion="user"`.
- `reveal-on-hover`: sichtbar bei Hover **und** Fokus, am Touchgerät immer. Trefferflächen: Touch ≥ 44 px, Zeiger ≥ 24 px.
- Komponententests prüfen mit jest-axe (`toHaveNoViolations`). Skip-Link führt zu `#composer-input`.

## Schriftregel

`font-body` (IBM Plex Sans) für Gesprochenes, `font-mono` für Maschinelles (Modell-IDs, Seeds, Zustände, Zeiten, Code) — **explizit** setzen. Kein globales `lowercase` im Chat.

## Befehle

```bash
npm run dev | build | lint | typecheck | test
CI=1 npm test -- --runInBand path/to/test.ts
```

## Offene Fragen

- **Freie Stufe = Allowlist des Server-Schlüssels.** `kontext`, `gptimage-large` antworten 403, bis der Betreiber sie freischaltet.
- **`zimage`** liefe frei über Pollinations, gehört aber dem Pruna-Dispatch — Provider-Entscheidung, offen.
- **TTS** (`tts-1`) fehlt in der Registry, läuft aber mit Server-Schlüssel.
- **Deploy:** `chat.hey-hi.cloud` auf Vercel (Auto-Deploy von `main`) hinter Cloudflare. Keine eigene Create-Domain — eine zweite Origin teilt IndexedDB.
- **Playground Meck:** der Video-2-Pro-Stand liegt nur im lokalen Worktree des Betreibers (E0), nicht in dieser Variante.

## Doku-Regeln

Ein kanonisches Dokument aktualisieren, kein neues anlegen. Registry nie in Prosa. `README.md`, `GEMINI.md` und `AGENTS.md` verweisen hierher, sie wiederholen nicht.
