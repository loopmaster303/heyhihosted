# Modellkuration + Chat-Hygiene (2026-09-10)

Status: Vorschlag, wartet auf Freigabe. Kein Code geaendert.

## 0. Wahrheit ueber die Quelle

Es gibt genau einen Endpunkt: **gen.pollinations.ai**. `image.pollinations.ai` und
`text.pollinations.ai` sind Legacy und werden entfernt (7 Fundstellen, s. 4.).
Die belastbare Fassung aller API-Fakten liegt jetzt in
[POLLINATIONS-API-2026-09-10.md](./POLLINATIONS-API-2026-09-10.md); dieser Plan
ist die Produktentscheidung darauf.

Live gemessen am **2026-09-10** gegen `gen.pollinations.ai` mit dem Betreiber-Key
(OpenAPI `v0.3.0`, Stand nach der Budget-Freigabe):

| Aufruf | Ergebnis |
|---|---|
| `GET /image/models` **mit** Key | genau **5**: `tongyi-mai/z-image-turbo`, `lykon/dreamshaper-8-lcm`, `openai/gpt-image-2`, `black-forest-labs/flux.2-klein-4b`, `black-forest-labs/flux.1-kontext-pro` |
| `GET /image/models` **ohne** Key | **83** (Katalog-Sicht, keine Berechtigung) |
| `GET /video/models` **mit** Key / **ohne** Key | **0** / **19** |
| `POST /v1/images/generations` **mit** Key, alle fuenf oben | **200** — z-image 4.3 s, dreamshaper 2.1 s, klein 6.3 s, kontext 14.4 s, gpt-image-2 33.6 s |
| `POST /v1/images/generations` **ohne** Key | **401** — "A valid API key is required" (kein anonymer Pfad) |
| `POST /v1/images/generations` **mit** Key, `flux.1-schnell`, `gptimage-large` | **403** — "not allowed for this API key", obwohl `paid_only: false` |
| `GET /account/balance` | 200, `15.13` pollen (`tier 12.32`, `paid 2.81`) |

Die frueheren 402-Messungen ("budget too low … 0.0000") sind damit erledigt: das
Key-Budget ist freigegeben, und alle fuenf freigegebenen Modelle liefern live ein
Bild. Der Satz "egal welches Modell, immer Fehler" war das Zusammenspiel aus
leerem Key-Budget und 403 auf nicht freigegebene Modelle.

Drei harte Folgen:

1. **Anonym gibt es nicht mehr.** Der Ausweichpfad "402 → nochmal ohne Schluessel"
   (`src/lib/pollinations-image-v1.ts:111`, `src/lib/media/server-media-ingest.ts:197`)
   laeuft ins 401. Er ist toter Code und verschleiert die echte Ursache.
2. **"Frei" heisst: im Key freigeschaltet.** Die Registry sagt `paid_only: false`
   fuer 25 Modelle — der Key darf fuenf. Die free-Liste muss aus der **keyed**
   Antwort kommen, nicht aus der Union beider Sichten.
3. **Video faellt beim Betreiber-Key komplett weg** (0 Eintraege). Video ist ohne
   Nutzer-Key (BYOP, `pk_` + Connect User Wallets) nicht anbietbar.

## 1. Bild — Free (Betreiber-Serverkey)

Gueltig sind genau die fuenf, die `GET /image/models` **mit** Key nennt. In der
gefuehrten Config tragen drei davon einen Eintrag:

| Kanonisch | Alias in der Config | Rolle |
|---|---|---|
| `tongyi-mai/z-image-turbo` | `z-image` | schnell, Default |
| `black-forest-labs/flux.2-klein-4b` | `klein` | schnell, Referenzen (max 10) |
| `openai/gpt-image-2` | `gpt-image-2` | Qualitaet, Referenzen (max 16) |
| `lykon/dreamshaper-8-lcm` | — | billigstes Modell (0.0001), kein Config-Eintrag |
| `black-forest-labs/flux.1-kontext-pro` | `kontext` | Editing, 1 Referenz; Config `enabled: false` |

Umgesetzt: die Free-Liste wird **dynamisch** aus `GET /image/models` **mit** Key
gebaut (TTL-Cache in `src/lib/pollinations/image-model-registry.ts`, Route
`GET /api/pollen/image-models`), plus die gemessene Freigabe-Liste
`POLLEN_SERVER_KEY_FREE_IDS` in `src/lib/playground/pollen-model-catalog.ts`.
Sobald ein Modell im Dashboard fuer den Key freigeschaltet wird, erscheint es von
allein — kein Deploy, keine gepflegte Liste.

**Korrektur zur ersten Fassung dieses Plans:** die Behauptung, nur Z-Image Turbo
und FLUX.1 Schnell seien erlaubt, stammte aus der Phase mit leerem Key-Budget.
FLUX.1 Schnell ist am Betreiber-Key **nicht** erlaubt (403) — es ist Bezahl-Ware.

## 2. Bild — Paid (eigener Pollen-Key des Nutzers)

Aus der Live-Registry, `paid_only: true`, kuratiert auf echte Publisher:

- Nano Banana: `google/gemini-3.1-flash-image` (2), `google/gemini-3.1-flash-lite-image` (2 Lite),
  `google/gemini-3-pro-image` (Pro), `google/gemini-2.5-flash-image` (1)
- Grok Imagine: `x-ai/grok-imagine-image`, `x-ai/grok-imagine-image-2.0`, `x-ai/grok-imagine-image-quality`
- GPT Image: `openai/gpt-image-2.5-flare`, `openai/gpt-image-2.5-sunburst`
- FLUX: `black-forest-labs/flux.2-pro`, `black-forest-labs/flux.2-flex`
- Weitere Klassiker: `bytedance/seedream-5.0-pro`, `bytedance/seedream-4.5`,
  `ideogram-ai/ideogram-v4-quality`, `ideogram-ai/ideogram-v4-turbo`,
  `qwen/qwen-image-3`, `krea/krea-2-medium`, `recraft/recraft-v4.1-vector`

Ausgeschlossen: `community`-Modelle und Router-Basteleien (`MarcosFRG/*`, `sharktide/*`,
`vendouple/*`, `NamanSoni78/*`, `chigwell/*`, `Catniti/*`, `rekty/*`) sowie alles mit
`video` in den Ausgabemodalitaeten. Pruna bleibt **ausschliesslich** im Playground.

## 3. Text — LLM-Liste

Sichtbar heute (chat-options.ts:178): claude-fast, gemini-fast, gemini-search, deepseek,
nova-fast, mistral, perplexity-fast, perplexity-reasoning, kimi, glm, minimax, qwen-coder.

Live gegen `gen.pollinations.ai/v1/chat/completions` mit dem Key:

| Modell | Ergebnis |
|---|---|
| `openai-fast` (nicht in der sichtbaren Liste!) | 200 |
| `openai` | 200 |
| `gemini-fast` | 200 |
| `deepseek` | 200 |
| `gemini-search`, `nova-fast`, `mistral` | 402 (erlaubt, Budget leer) |
| `claude-fast`, `perplexity-fast`, `perplexity-reasoning`, `kimi`, `glm`, `minimax`, `qwen-coder` | **403 forbidden** |

Acht der zwoelf sichtbaren Modelle sind fuer den Serverkey gesperrt.

Vorschlag:
- **Free/Server:** `openai-fast`, `gemini-fast`, `deepseek`, `gemini-search` (+ `nova-fast`, `mistral`)
- **Paid (eigener Key):** `claude-fast`, `kimi`, `glm`, `minimax`, `qwen-coder`,
  `perplexity-fast`, `perplexity-reasoning`

Die Text-Liste bleibt kuratiert (nicht 1:1 vom Endpunkt — die Registry fuehrt 257 Eintraege,
darunter `GPT-6 Devin AI Agent` und `Anima Uncensored Model`). Neu ist nur: die Free-Zeile
wird gegen den Key geprueft, nicht behauptet.

## 4. Legacy-Host loeschen (image./text.pollinations.ai)

| Datei:Zeile | Aenderung |
|---|---|
| `next.config.ts:92` | `image.pollinations.ai` aus den image-remotePatterns entfernen |
| `src/lib/media/remote-fetch-policy.ts:4` | Host aus `ALLOWED_REMOTE_MEDIA_HOSTS` entfernen |
| `src/lib/media/__tests__/server-media-ingest.test.ts:89,106,132` | Test-Fixture auf `media.pollinations.ai` umstellen |
| `docs/plans/2026-06-01-*`, `docs/archive/history/phase-2-complete.md` | historische Dokumente, nur mit Hinweis versehen |

## 5. Chat-Hygiene (unabhaengig von der Kuration)

- **Kein Pruna im Chat:** `src/config/chat-options.ts:618` `FALLBACK_IMAGE_MODELS`
  auf `getChatImageModelIds()` umstellen; Provider-Umschalter in
  `PersonalizationSidebarSection.tsx:185-215` und `AppSidebar.tsx:167` ausblenden.
  `/create` und `useProviderMode` bleiben unberuehrt.
- **Schrift:** `src/components/MarkdownRenderer.tsx:29` `font-code` entfernen.
- **Rohe Sternchen:** `src/components/chat/MessageBubble.tsx:416` rendert Markdown nur,
  wenn ein Code-Fence vorkommt. Ohne Fence bleiben `* **Mode:**` als Text stehen —
  das ist das "Maschinen"-Bild. Regex auf `/\`\`\`|\*\*|^[-*] |^#/m` erweitern.

## 6. Stand der Umsetzung (2026-09-11)

Umgesetzt und belegt:

- `src/lib/playground/pollen-model-catalog.ts` — `POLLEN_SERVER_KEY_FREE_IDS` (drei gemessene
  freie IDs) und `POLLEN_PAID_CLASSICS` (13 kuratierte Klassiker mit Registry-Namen und Aliasen).
- `model-source.ts`, `ModelPicker.tsx`, `route.ts`, `usePlaygroundModels.ts`,
  `PlaygroundShell.tsx` — Sperre, Badge und Gruppen "Frei" / "Key noetig" haengen an
  `runnable`; die Auswahlliste liefert die Sicht des Aufrufers statt der Vereinigung.
- Chat-Hygiene: kein Pruna-Umschalter im Chat (`FEATURES.chatPrunaProvider: false`),
  `font-code` im Renderer entfernt, Fence-Regex erweitert.
- Legacy-Hosts: `image.pollinations.ai` aus `next.config.ts` und `remote-fetch-policy.ts`
  entfernt, Test-Fixtures auf `media.pollinations.ai`.

Verifikation: `npx jest src/lib/playground src/components/playground src/hooks/usePlaygroundModels
src/app/api/pollen src/app/create src/config --runInBand` → 29 Suites, 317 Tests gruen.
Volles Repo: 131 von 132 Suites gruen, der eine rote Test ist fremd
(`scripts/audit/_safe_parse_audit_output.test.ts`). `npx tsc --noEmit` ohne Diagnose.

Browser-Nachweis des Referenz-Uploads (der eigentliche Bug 1): im In-App-Browser auf
`localhost:3000/create`, Provider Pruna, Modell Flux 2 Klein 4B — nach Auswahl einer Datei
zeigt Slot #1 die Vorschau, der Zaehler steht auf "1 von bis zu 5 Bildern", der AX-Baum
fuehrt `image Referenzbild` samt Entfernen-Button.

Offen: Commit und Push. Der Autor hat dafuer noch keine Freigabe erteilt.
