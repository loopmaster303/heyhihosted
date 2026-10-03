# PLAN — LLM-Kuration (Text) 2026-09-11

Status: **Blueprint, korrigiert am 2026-09-11**. Kein Quellcode geaendert. Umsetzung erst nach
expliziter Freigabe ("los"). Korrektur gegenueber der ersten Fassung: die Sichtbarkeit der
Bezahltarif-Modelle haengt am hinterlegten Key und am Aufklappen der Modellkarte — **kein** zweiter
Schalter, kein neuer Storage-Key (Abschnitt 4).

Geltungsbereich: nur **Text-/Chat-Modelle**. Bild/Video bleibt in `unified-image-models` /
`unified-model-configs` und wird hier nicht angefasst.

---

## 1. Messprotokoll

Alles unten wurde am 2026-09-11 gegen `https://gen.pollinations.ai` gemessen (Version 0.3.0 laut
`/openapi.json`, Info-Feld `version: "0.3.0"`). Der Chat-Pfad der Version ist
`POST /v1/chat/completions` (in `/openapi.json` unter `paths` verifiziert). `/openai/chat/completions`
existiert dort **nicht**.

Der Schluessel wurde nie ausgegeben; jeder Aufruf hat ihn nur aus `.env.local` an curl/node gereicht.

### 1.1 Kommandos

```bash
key=$(node -e "const fs=require('fs');process.stdout.write((fs.readFileSync('.env.local','utf8').match(/^POLLEN_API_KEY=(.*)$/m)||[])[1].trim())")

curl -s -o /tmp/llm-nokey.json -w '%{http_code}\n' https://gen.pollinations.ai/text/models
curl -s -o /tmp/llm-key.json   -w '%{http_code}\n' -H "Authorization: Bearer $key" https://gen.pollinations.ai/text/models
curl -s -H "Authorization: Bearer $key" https://gen.pollinations.ai/account/key     -o /tmp/keyinfo.json
curl -s -H "Authorization: Bearer $key" https://gen.pollinations.ai/account/balance

# je Kandidat, seriell:
curl -s -w '\n%{http_code}\n' -X POST https://gen.pollinations.ai/v1/chat/completions \
  -H 'content-type: application/json' -H "Authorization: Bearer $key" \
  -d '{"model":"<ID>","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

### 1.2 Katalog: mit und ohne Betreiber-Key

| Sicht | Status | Eintraege | community | paid_only | Bemerkung |
|---|---|---|---|---|---|
| `/text/models` **ohne** Key | 200 | **259** | 175 | 87 | 84 Non-Community + 175 Community/alpha |
| `/text/models` **mit** Key | 200 | **84** | 0 | **44** | deckt sich mit der Messung vom 2026-09-10 (84 / 44) |

Die Differenz ist **kein** Freigabeverlust: ohne Key liefert der Anbieter zusaetzlich die 175
Community-Modelle, mit Key nur die 84 Non-Community. Kein Eintrag der Key-Sicht fehlt in der
No-Key-Sicht (Schnittmenge geprueft).

### 1.3 Die harte Freigabe: `/account/key`

`permissions.models` enthaelt **90** Eintraege: **84 Text** + 6 Medien
(`lykon/dreamshaper-8-lcm`, `black-forest-labs/flux.1-kontext-pro`, `openai/gpt-image-2`,
`black-forest-labs/flux.2-klein-4b`, `tongyi-mai/z-image-turbo`, `assemblyai/universal-2`).

Die 84 Text-Eintraege sind **exakt** die 84 Modellnamen der Key-Sicht von `/text/models`.
Damit ist die Freigabe doppelt belegt: Liste und Key-Permission stimmen 1:1 ueberein.
`pollenBudget: null`, `rateLimitEnabled: false`, `byopApp: null`, `type: "secret"`, `name: "dangerous-deer"`.

**Wichtig:** `paid_only: true` ist **keine** Sperre fuer den Betreiber-Key. Alle 44 paid_only-Modelle
stehen in der Freigabe und antworten live.

### 1.4 Balance

| Feld | Wert |
|---|---|
| `balance` / `accountBalance.total` | **14.94249313** |
| `tier` | 12.13512834 |
| `paid` | 2.80736479 |

Der Kommentar `src/lib/pollen-cost-guard.ts:37-42` ("der Betreiber-Schluessel hat 0.0000 Budget",
"jedes Modell, auch die 25 freien", "402") ist damit **veraltet**. Heute ist Budget da.

### 1.5 Live-Chat je Kandidat (max_tokens: 16)

`max_tokens: 1` aus der Vorgabe wurde zuerst versucht und von mehreren Upstreams mit **400** abgewiesen
("max_tokens must be at least 16" / Perplexity, Azure-OpenAI). Deshalb die Wiederholung mit 16; die
Statuscodes unten sind damit echte Freigabe-Aussagen, keine Formatfehler.

`up=` ist das `model`-Feld der Antwort, also das Backend, das wirklich geantwortet hat.

| ID gesendet | Status | up (Backend) | Gruppe |
|---|---|---|---|
| `claude-fast` | 200 | `global.anthropic.claude-haiku-4-5` | UI heute |
| `gemini-fast` | 200 | `gemini-2.5-flash-lite` | UI heute |
| `gemini-search` | 200 | `gemini-2.5-flash-lite` | UI heute |
| `deepseek` | 200 | `fireworks/deepseek-v4-flash` | UI heute |
| `nova-fast` | 200 | `us.amazon.nova-micro-v1` | UI heute |
| `mistral` | 200 | `mistralai/mistral-small-3.2-24b-instruct-2506` | UI heute |
| `perplexity-fast` | 200 | `sonar` | UI heute |
| `perplexity-reasoning` | 200 | `sonar-reasoning-pro` | UI heute |
| `kimi` | 200 | `fireworks/kimi-k2p5` | UI heute |
| `glm` | 200 | `fireworks/glm-5p1` | UI heute |
| `minimax` | 200 | `fireworks/minimax-m2p7` | UI heute |
| `qwen-coder` | 200 | `Qwen3-Coder-30B-A3B-Instruct` | UI heute |
| `perplexity/sonar-pro` | 200 | `sonar-pro` | Kandidat frei |
| `openai/gpt-5.5` | 200 | `gpt-5.5-2026-04-24` | Kandidat |
| `openai/gpt-5.6-sol` | 200 | `gpt-5.6-sol` | Kandidat Frontier |
| `openai/gpt-5.6-terra` | 200 | `gpt-5.6-terra` | Kandidat |
| `openai/gpt-5.4` | 200 | `gpt-5.4-2026-03-05` | Kandidat |
| `openai/gpt-6-astra` | 200 | `gpt-6-astra` | Kandidat |
| `x-ai/grok-4.6` | 200 | `grok-4.6` | Kandidat Frontier |
| `x-ai/grok-4.3` | 200 | `grok-4.3` | Kandidat |
| `moonshotai/kimi-k3` | 200 | `fireworks/kimi-k3` | Kandidat |
| `moonshotai/kimi-k2.6` | 200 | `fireworks/kimi-k2p6` | Kandidat CN |
| `moonshotai/kimi-k2.7-code` | 200 | `fireworks/kimi-k2p7-code` | Kandidat CN |
| `z-ai/glm-5.3-flash` | 200 | `fireworks/glm-5p3-flash` | Kandidat CN |
| `z-ai/glm-5.3` | 200 | `fireworks/glm-5p3` | Kandidat CN |
| `minimax/minimax-m3` | 200 | `fireworks/minimax-m3` | Kandidat CN |
| `deepseek/deepseek-v4-flash` | 200 | `fireworks/deepseek-v4-flash-0731` | Kandidat CN |
| `deepseek/deepseek-v4-pro` | 200 | `fireworks/deepseek-v4-pro-0813` | Kandidat CN |
| `qwen/qwen3-coder-30b-a3b-instruct` | 200 | `Qwen3-Coder-30B-A3B-Instruct` | Kandidat CN |
| `qwen/qwen3.8-2.4t-a95b` | 200 | `Qwen 3.8 Max` | Kandidat CN |
| `mistralai/mistral-large-3` | 200 | `mistral-large-3` | Kandidat |
| `anthropic/claude-sonnet-5` | 200 | `global.anthropic.claude-sonnet-5` | Bezahl |
| `anthropic/claude-opus-5` | 200 | `global.anthropic.claude-opus-5` | Bezahl |
| `google/gemini-3.1-pro-preview` | 200 (1. Versuch 502) | `google/gemini-3.1-pro-preview` | Bezahl |
| `google/gemini-3.7-flash` | 200 | `google/gemini-3.7-flash` | Bezahl |
| `google/gemma-4-31b-it` | 200 | `google/gemma-4-31b-it` | Bezahl |
| `google/gemma-4-26b-a4b-it` | 200 | `google/gemma-4-26b-a4b-it` | Bezahl |
| `qwen/qwen3.7-flash` | 200 | `qwen/qwen3.7-flash` | Bezahl |
| `xiaomi/mimo-v2.5` | 200 | `xiaomi/mimo-v2.5` | Bezahl |
| `stepfun/step-3.7-flash` | 200 | `stepfun-ai/Step-3.7-Flash` | Bezahl |
| `gemini-large` | 200 | `google/gemini-3.1-pro-preview` | Alt-Alias |
| `claude-large` | 200 | `global.anthropic.claude-opus-5` | Alt-Alias |
| `openai` | 200 | `gpt-5.4-nano-2026-03-17` | Alt-Alias |
| `qwen-safety` | 200 | `Qwen3Guard-Gen-8B` | Safety, kein Chat |
| `nova-lite` | **400** | `Invalid model or alias` | toter Alias |
| `Lorodn4x/deepseek-v4-flash` (Community) | **403** | `not allowed for this API key` | Community |

Kein einziger Kandidat antwortete mit **402**. 402 ist in dieser Key-Konfiguration nur ueber ein
leeres Budget erreichbar — genau das ist nicht der Fall (14.94). 403 ist die Community-Antwort,
404 kam nicht vor.

### 1.6 Nebenfund: Alias-Routing weicht von der Alias-Liste ab

Der Katalog nennt die Aliase `kimi`, `glm`, `minimax` bei `moonshotai/kimi-k2.6`,
`z-ai/glm-5.2`, `minimax/minimax-m3`. Das Live-Routing schickt dieselben Aliase aber auf
`kimi-k2p5`, `glm-5p1`, `minimax-m2p7` — also aeltere Backends. Dieselbe Verwechslung bei
`mistral`: Katalog-Alias zeigt auf `mistral-small-4`, das Routing serviert `mistral-small-3.2`.

Konsequenz: **Wir senden kuenftig die kanonischen `publisher/model`-IDs.** Fuer die kanonischen IDs
ist das Routing eindeutig gemessen (`minimax/minimax-m3` -> `minimax-m3`, `z-ai/glm-5.3` -> `glm-5p3`,
`moonshotai/kimi-k2.6` -> `kimi-k2p6`).

---

## 2. Drift-Tabelle

Spalte "Realitaet" ist die Messung aus Abschnitt 1.

| UI-Anzeige | Realitaet | Datei:Zeile | Wirkung auf den Nutzer |
|---|---|---|---|
| 12 waehlbare Textmodelle | 84 sind am Betreiber-Key freigegeben | `src/config/chat-options.ts:178-191` | 72 Modelle (u. a. jede Anthropic-, Gemini-3.x-, Gemma-4-, OpenAI-5.x-, Grok-4.3/4.6-Familie) sind unerreichbar |
| `kimi` = "Moonshot Kimi K2.6", `vision: false` | sendet Alias -> `kimi-k2p5` (K2.5); Katalog: `vision: true`, ctx 262000 | `src/config/chat-options.ts:139-146` | Nutzer glaubt, K2.6 zu sprechen; Bild-Input ist gesperrt, obwohl vorhanden |
| `glm` = "z.ai GLM-5.2", ctx 198000 | sendet Alias -> `glm-5p1` (GLM-5.1); Katalog: ctx 1048576 | `src/config/chat-options.ts:147-155` | falscher Modellname und um Faktor 5 zu kleiner Kontext |
| `minimax` = "Minimax M3", ctx 200000, `vision: false` | sendet Alias -> `minimax-m2p7` (M2.7); Katalog m3: ctx 524288, `vision: true` | `src/config/chat-options.ts:156-164` | falsches Modell, kein Vision |
| `deepseek` = "DeepSeek V4 Flash Lite", ctx 64000 | `deepseek-v4-flash`, ctx **1048576** | `src/config/chat-options.ts:90-96` | Kontextfenster 16x zu klein angekuendigt; Default-Modell |
| `mistral` = "Mistral Small 3.2 24B", `vision: false` | Label korrekt (Routing serviert 3.2), aber `vision: true` im Katalog; Katalog-Alias `mistral` zeigt auf Small 4 | `src/config/chat-options.ts:108-117`, `src/config/ui-constants.ts:61` | Label kann bei naechstem Routing-Wechsel still kippen |
| `qwen-coder` ctx 128000 | ctx 262144 | `src/config/chat-options.ts:165-173` | untertriebene Ankuendigung |
| "POLLEN"-Schloss fuer `claude-fast`/`gemini-fast`/`gemini-search`/`mistral` | `paid_only: true` — Markierung stimmt; live aber 200 am Betreiber-Key (nur Kosten, keine Sperre) | `src/config/chat-options.ts:58-88,108-117`, `src/components/chat/input/ModelSelector.tsx:157` | korrekt; die Sperre ist Policy, nicht Freigabe |
| 8 "freie" Modelle ohne Schloss | `paid_only: false`, live alle 200 | `src/config/chat-options.ts:89-107,118-173` | korrekt, keine falsch-freien Eintraege |
| `gemini-search` als Live-Search-Kandidat | `paid_only: true` | `src/config/chat-options.ts:210-214`, `229-234` | Router-Kandidat im Gratis-Pfad; greift heute nur, weil `perplexity-fast` vorn steht |
| `textModelIsPaid` sperrt nur `isFree === false` | 4 von 12 UI-Modellen; nach der Kuration sind 60+ Eintraege mit `paid_only: false` hinter der Bezahltarif-Sichtbarkeit (aufgeklappt, eigener Key) | `src/lib/pollen-cost-guard.ts:63-67`, `src/app/api/chat/completion/route.ts:150` | **Kostenleck**: keyloser Nutzer koennte `openai/gpt-5.5` auf Betreiberrechnung schicken |
| "Betreiber-Schluessel hat 0.0000 Budget" | Balance 14.94249313 | `src/lib/pollen-cost-guard.ts:37-42` | veralteter Kommentar; fuehrt zu falscher Vorsicht im Code |
| `featuredModels` `deepseek` = highlight "V3.2" | live `deepseek-v4-flash-0731` | `src/config/ui-constants.ts:77` | falsche Versionsangabe im Waehler |
| `kimi`-Beschreibung "with vision and multi-agent workflows" | `vision: false` im selben Objekt | `src/config/chat-options.ts:141-142` | Widerspruch in den eigenen Daten |
| `nova-lite` gepflegt | live 400 "Invalid model or alias" | `src/config/ui-constants.ts:49` | toter Eintrag; nur Kosmetik (nicht in der sichtbaren Liste) |
| Legacy-Hosts? | **keine Treffer** in `src/` | `src/lib/media/remote-fetch-policy.ts:2-8` (Allow-List), `src/lib/pollinations-sdk.ts:7` (`gen.pollinations.ai`) | kein Handlungsbedarf |

Antworten auf die Audit-Fragen:

- **Welche Textmodelle zeigt die UI, wo steht die Liste?** 12 IDs in
  `VISIBLE_POLLINATIONS_MODEL_IDS` (`src/config/chat-options.ts:178-191`); Definition in
  `ALL_POLLINATIONS_MODELS` (:56-174); gerendert in
  `src/components/chat/input/ModelSelector.tsx:26-36,218,246`,
  `src/components/settings/SettingsPopover.tsx:255` und
  `src/components/sidebar/PersonalizationSidebarSection.tsx:165-176`.
- **Was darf der Key wirklich?** Alle 84. **403:** nur Community. **400:** `nova-lite`.
  **402:** keiner. **404:** keiner.
- **Zeigt die UI tote Modelle?** Nein — alle 12 antworten 200. Drei zeigen aber den falschen Namen
  (kimi/glm/minimax).
- **Versteckt die UI, was der Key koennte?** Ja, 72 von 84.
- **Sind free/paid korrekt?** Gegen `paid_only` ja (4 paid, 8 frei, keine falsch-freien). Gegen die
  reale Kostensituation nein: der Betreiber-Key bedient auch alle 44 `paid_only`-Modelle.
- **Legacy-Hosts?** Keine.

---

## 3. Kuration

Drei Regeln, die die Tabelle erklaeren:

1. `paid_only` des Anbieters sagt **"braucht Guthaben"**, nicht "unser Bezahltarif". Unsere
   frei/bezahlt-Trennung ist eine **eigene Kuration** und muss als eigene Liste gefuehrt werden.
2. Wir senden **kanonische IDs** (`publisher/model`), nicht die nackten Aliase. Grund: Abschnitt 1.6.
3. Community-Modelle erscheinen **nirgends** (live 403, sie sind nicht in der Key-Freigabe).

### 3.1 FREI (Betreiber-Key) — 2 Frontier + guenstige chinesische

| UI-Label | ID die gesendet wird | Registry-Name | Anbieter | Tier | Key 200? | out-Preis/Token |
|---|---|---|---|---|---|---|
| GPT-5.6 Sol | `openai/gpt-5.6-sol` | `openai/gpt-5.6-sol` | OpenAI | frei | **200** | 0.00001 |
| Grok 4.6 | `x-ai/grok-4.6` | `x-ai/grok-4.6` | xAI | frei | **200** | 0.0000045 |
| DeepSeek V4 Flash 0731 | `deepseek/deepseek-v4-flash` | `deepseek/deepseek-v4-flash` | DeepSeek | frei | **200** | 0.00000066 |
| Qwen3 Coder 30B | `qwen/qwen3-coder-30b-a3b-instruct` | `qwen/qwen3-coder-30b-a3b-instruct` | Qwen (Alibaba) | frei | **200** | 0.00000026 |
| GLM-5.3 Flash | `z-ai/glm-5.3-flash` | `z-ai/glm-5.3-flash` | Z.ai (Zhipu) | frei | **200** | 0.0000005 |
| MiniMax M3 | `minimax/minimax-m3` | `minimax/minimax-m3` | MiniMax | frei | **200** | 0.0000012 |
| Kimi K2.6 | `moonshotai/kimi-k2.6` | `moonshotai/kimi-k2.6` | Moonshot AI | frei | **200** | 0.000004 |
| Perplexity Sonar | `perplexity/sonar` | `perplexity/sonar` | Perplexity | frei | **200** | 0.000001 |
| Perplexity Sonar Reasoning Pro | `perplexity/sonar-reasoning-pro` | `perplexity/sonar-reasoning-pro` | Perplexity | frei | **200** | 0.000008 |

Die zwei Frontier-Picks decken bewusst OpenAI + xAI ab (beide 200, beide reasoning, beide vision,
stabil). Gleichwertige Alternativen, ebenfalls 200: `anthropic/claude-opus-5`,
`google/gemini-3.1-pro-preview` (letzteres 1 von 2 Calls mit 502) und `openai/gpt-5.5`.

Die zwei Perplexity-Eintraege sind **kein** Sonderwunsch, sondern Bedingung: der Smart Router
(`src/lib/chat/chat-search-strategy.ts:47,56`) braucht im Gratis-Pfad mindestens ein sichtbares,
freies, web-faehiges Modell. `getPreferredLiveSearchModel()` liefert sonst `undefined`.

Optionale Ergaenzungen (alle 200, alle frei): `moonshotai/kimi-k2.7-code`,
`deepseek/deepseek-v4-pro`, `z-ai/glm-5.3`.

**Entfallen gegenueber heute:** `nova-fast` (nicht chinesisch, nicht Frontier -> nicht in der
Vorgabe), `mistral`, `claude-fast`, `gemini-fast` (alle vier -> Bezahlt), `gemini-search` (paid_only).

### 3.2 BEZAHLT (eigener Key des Nutzers)

Fuenf Spotlight-Eintraege, genau einer je geforderter Marke:

| UI-Label | ID die gesendet wird | Registry-Name | Anbieter | Tier | `paid_only` | Key 200? |
|---|---|---|---|---|---|---|
| GPT-5.5 | `openai/gpt-5.5` | `openai/gpt-5.5` | OpenAI | bezahlt | false | **200** |
| Claude Opus 5 | `anthropic/claude-opus-5` | `anthropic/claude-opus-5` | Anthropic | bezahlt | true | **200** |
| Grok 4.3 | `x-ai/grok-4.3` | `x-ai/grok-4.3` | xAI | bezahlt | false | **200** |
| Gemini 3.1 Pro Preview | `google/gemini-3.1-pro-preview` | `google/gemini-3.1-pro-preview` | Google | bezahlt | true | **200** (1x 502) |
| Gemma 4 31B | `google/gemma-4-31b-it` | `google/gemma-4-31b-it` | Google | bezahlt | true | **200** |

Zweiter Google-Eintrag ist Gemma 4 31B; Alternative `google/gemma-4-26b-a4b-it` (200).

Hinter dem Aufklappen liegt mit eigenem Key der **komplette Non-Community-Katalog** (84 minus die 9 freien
Eintraege = 75 Eintraege), also auch die 44 `paid_only`-Modelle und die Eintraege mit
`paid_only: false`, die wir in den Bezahltarif schieben (z. B. `openai/gpt-5.4`,
`google/gemini-3.7-flash`, `anthropic/claude-sonnet-5`, `qwen/qwen3.7-flash`,
`stepfun/step-3.7-flash`, `mistralai/mistral-large-3`, `meta/muse-spark-1.2`).
Community-Modelle: **nie**, auch nicht im Bezahltarif (live 403).

Die 9 freien Eintraege erscheinen im Bezahltarif **mit** ("plus die weiter oben genannten"), weil
der Bezahltarif der Union-View ist.

> **Eine Lesart, die vor dem Bauen bestaetigt werden muss.** "genau ein OpenAI, ein Anthropic, ein
> Grok, ein Gemini, ein Gemma" laesst sich strikt lesen als "der Bezahltarif enthaelt **ausschliesslich**
> diese fuenf". Das kollidiert mit dem Satz "ALLE Nicht-Community-Modelle sollen bei bezahlt
> verfuegbar sein" (es gibt allein 11 OpenAI-Eintraege). Dieser Plan liest die fuenf als **Spotlight**
> ueber der vollen Non-Community-Liste. Wenn nur fuenf gewuenscht sind: Spotlight-Liste nehmen,
> `PAID_TEXT_MODEL_IDS` auf diese fuenf beschraenken, der Rest der Abschnitte 4 und 5 bleibt
> unveraendert.

### 3.3 Kostenmodell (warum das wichtig ist)

| Aktion | Heute | Nach dem Plan |
|---|---|---|
| keyloser Nutzer waehlt freies Modell | laeuft ueber Betreiber-Key (200) | unveraendert |
| keyloser Nutzer waehlt Bezahltarif-Modell | Schloss im Waehler **und** 402 der Route — aber nur fuer die 4 `isFree:false`-Eintraege | Schloss + 402 fuer **alle** Bezahltarif-Eintraege |
| Nutzer mit eigenem Key | nur 4 Bezahlmodelle sichtbar | im aufgeklappten Waehler der volle Non-Community-Katalog |

Die Route-Pruefung muss dafuer auf **unsere** Liste umgestellt werden, nicht auf `isFree`
(`src/lib/pollen-cost-guard.ts:63-67`). Sonst reisst der Bezahltarif ein Loch von 60+ Modellen auf,
die ohne Nutzerkey auf die Betreiberrechnung laufen.

---
## 4. Mechanik der zweiten Sichtbarkeitsstufe (Korrektur 2026-09-11)

**Kein neuer Schalter.** Der Schalter existiert schon: der Knopf **"Alle anzeigen (N)"** unter der
Modellliste (`ModelSelector.tsx:227-238`). Er ist die zweite Stufe. Was fehlt, ist nicht ein Widget,
sondern die Bedingung an der Liste: **ohne eigenen Key nur die kuratierten freien Modelle, mit
eigenem Key der volle Non-Community-Katalog** — sichtbar im aufgeklappten Zustand.

**Wer entscheidet.** `useHasPollenKey()` — genau der Hook, den der Waehler schon importiert
(`ModelSelector.tsx:9,149`). Kein neuer Storage-Key, kein neues Event, kein neuer Switch, kein
persistierter Zustand. Sichtbarkeit ist eine Funktion des Keys, keine Einstellung.

| Zustand | zugeklappt | "Alle anzeigen" (aufgeklappt) |
|---|---|---|
| kein eigener Key | die kuratierten freien Picks (Abschnitt 3.1) | restliche **freie** Eintraege (u. a. das Sonar-Paar) |
| eigener Key | wie oben | **voller Non-Community-Katalog**: erst die restlichen freien, dann die Bezahltarif-Gruppe mit Badge |

Das ist das **Zielbild**, nicht der Bestand. Heute existiert genau eine Liste mit 12 IDs
(`chat-options.ts:178-191`); die Trennung "Picks / restliche freie / bezahlt" entsteht erst mit
`FREE_TEXT_MODEL_IDS` und `PAID_TEXT_MODEL_IDS` in Schritt 1. Ebenso ist die Gruppe "Bezahlt" Neubau:
der aufgeklappte Zustand rendert heute eine **einzige** Gruppe unter dem Label
`modelSelector.advanced` (`ModelSelector.tsx:240-247`). Was Bestand ist und bleibt, sind der Knopf
und sein Zaehler: `useModelLists` (:25-36) baut genau zwei Mengen, ohne `slice`, ohne Deckel, und
`otherModels.length` (:234) waechst mit der Liste von selbst.

**Wo die Liste entsteht.** `getVisiblePollinationsModels()` (`src/config/chat-options.ts:193`) ist
heute key-unabhaengig und bekommt den Key-Zustand als Argument. Der Hook
`useVisiblePollinationsTextModels` (`src/hooks/useVisiblePollinationsTextModels.ts:12`) reicht
`hasByopKey` durch und bekommt `[hasByopKey]` als `useMemo`-Abhaengigkeit — heute steht dort `[]`.

**Zwei Konstanten, zwei Bedeutungen.** `AVAILABLE_POLLINATIONS_MODELS` (:204) ist heute die
sichtbare Liste und wird **serverseitig** gelesen: `pollen-cost-guard.ts:64` und
`chat-capability-resolution.ts:85,89,99` (dort als Rueckfall `AVAILABLE_POLLINATIONS_MODELS[0]`).
Sie darf **nicht** key-abhaengig werden — das ist die Menge, die der Betreiber-Key traegt. Daneben
tritt der volle Katalog als eigene, key-unabhaengige Konstante fuer Liste, Nachschlag und
Routen-Validierung.

**Was aus der ersten Fassung entfaellt.** Der persistierte Filter `chatShowPaidTextModels`, der Hook
`useShowPaidTextModels.ts`, der Switch in `SettingsPopover.tsx` unter "Community-Modelle" und der
Einstieg im Panel-Kopf. Nichts davon wird gebaut. Der Community-Schalter bleibt der einzige
Sichtbarkeits-Switch, weil er eine Vorliebe abbildet; der Key ist keine Vorliebe, sondern eine
Tatsache.

**Die Pollenwall bleibt.** `isLocked = model.isFree === false && !hasPollenKey` (:157) wird nicht
ausgebaut. Mit der neuen Bedingung greift sie nur im Uebergang (Key wird entfernt, waehrend das
Panel offen ist) und als zweite Linie vor dem 402 der Route.

**Hydration.** `useHasPollenKey` liest den Key bewusst erst nach dem Mount. Die Liste kippt also
einmal von "frei" auf "frei + Katalog" — derselbe Ablauf wie bei jedem anderen key-abhaengigen
Element, kein Sonderweg.

**Der Moment, den der Nutzer beschrieben hat.** Key eintragen, Karte aufklappen, alles da. Ohne
Reload, weil `useHasPollenKey` auf `POLLEN_KEY_CHANGED_EVENT` und `storage` hoert.

**Verbraucher ohne Umbau — mit einer Ausnahme.** `unified/page.tsx:45` und `AppLayout.tsx:109`
brauchen die Liste nur fuer Startmodell und Kopfzeilen-Namen, beide unkritisch. Zwei andere lesen
denselben Hook und rendern die Liste als Radix-`Select` **ohne Suchfeld, ohne Filter, ohne Gruppe**:
`SettingsPopover.tsx:255-262` und `PersonalizationSidebarSection.tsx:165-175`. Formal bricht nichts
(der Viewport scrollt, Scroll-Buttons liegen vor), praktisch sind 84 Eintraege ohne Tippen-Suche kein
Auswahlmenue mehr. Empfehlung fuer Schritt 4: diese beiden Dropdowns bleiben auf der **kuratierten**
Liste, denn dort wird ein Standardmodell gesetzt, nicht gestoebert. Wer ein Bezahltarif-Modell als
Standard will, waehlt es in der Modellkarte; die Wahl persistiert, und der Kopf zeigt sie ueber
`findModelById`. Die Entscheidung gehoert in Abschnitt 6.

### 4.1 Zugaenglichkeit der zweiten Stufe

Der Nutzer hat Accessibility ausdruecklich als Linse genannt, und die Zone hat hier echte Luecken.
Bestand (`ModelSelector.tsx`): der Aufklapp-Knopf (:228-237) traegt nur `type`, `onClick` und
`className` — kein `aria-expanded`, kein `aria-controls`, kein Ziel-`id` am Wrapper (:216). Der
Ausloeser darueber hat beides (:63-64, :101-102), das Panel ist mit sich selbst inkonsistent.
Die Auswahl ist rein visuell (:166-169, kein `aria-selected`/`aria-pressed`), `aria-disabled` (:164)
steht neben einem `onClick`, der trotzdem feuert (:163), und der Hinweis (:222) hat `role="note"`
ohne `aria-live` — die Rueckmeldung "Modell braucht einen Schluessel" wird nicht angesagt.

Der Plan baut nicht mehr, sondern richtig: `id` am Wrapper, `aria-expanded`/`aria-controls` an beiden
Knopfpaaren, `role="group"` plus `aria-labelledby` auf beiden Grids, die Gruppenlabels als echte
Elemente mit `id` statt der heutigen Text-`div`s (:242-244), `aria-pressed` an den Kacheln und
`aria-live="polite"` am Hinweis. Bei 84 Eintraegen ist die Gruppierung nicht Kosmetik — sie ist der
einzige Weg, wie ein Screenreader die Liste noch verstaendlich vorliest.

**Bewusst nicht in diesem Plan:** `modelFilterIds` ist heute ein totes Prop (kein Aufrufer uebergibt
es). Waere es gesetzt, liefe :34 auf `otherModels = []`, der Aufklapp-Knopf verschwaende und die
zweite Stufe waere weg. Der Plan laesst das Prop unberuehrt, Schritt 3 darf es nicht versehentlich
aktivieren.


---

## 5. Umsetzungsschritte je Datei

Reihenfolge ist bindend, siehe Risiko R1.

| # | Datei | Aenderung |
|---|---|---|
| 1 | `src/config/chat-options.ts` | `ALL_POLLINATIONS_MODELS` auf kanonische IDs umstellen und als key-unabhaengigen Katalog exportieren; `FREE_TEXT_MODEL_IDS` (Abschnitt 3.1) und `PAID_TEXT_MODEL_IDS` (5 Spotlights plus Rest des Katalogs, Community nie) neu; `getVisiblePollinationsModels(hasKey)`; `AVAILABLE_POLLINATIONS_MODELS` bleibt die freie Liste (Server-Semantik, Kostenguard); `isKnownPollinationsTextModelId` deckt Katalog **und** frei und **bleibt key-unabhaengig** — sie ist die Eingabevalidierung von `completion/route.ts:151,176`; `DEFAULT_POLLINATIONS_MODEL_ID = 'deepseek/deepseek-v4-flash'`; Vision-/Kontext-Flags an die Messung; `LIVE_SEARCH_MODEL_CANDIDATES`/`DEEP_RESEARCH_MODEL_CANDIDATES` bleiben freie IDs (`perplexity/sonar`, `perplexity/sonar-reasoning-pro`) |

> Mitleser dieser Datei: `chat-options.ts:223,230` (die Router-Kandidaten lesen `VISIBLE_POLLINATIONS_MODEL_IDS` direkt, nicht die Funktion), `scripts/check-model-registry.mjs:119` (Import per Namen) und `scripts/audit/pollinations-drift-report.js:12` (Regex auf den exakten Konstantennamen). Die Konstante behaelt ihren Namen — ein Rename laesst den Audit-Waechter still auf eine leere Liste fallen (R10).
| 2 | `src/hooks/useVisiblePollinationsTextModels.ts` | `hasByopKey` in die Liste: `visibleModels` = frei bzw. frei + Katalog, `paidModels` zusaetzlich, `useMemo`-Deps `[hasByopKey]`; `isKnownModelId` gegen Katalog und frei |
| 3 | `src/components/chat/input/ModelSelector.tsx` | `useModelLists` (:25-36) auf die key-abhaengige Liste; Zaehler im Aufklapp-Knopf (:227-238) zaehlt mit Key den vollen Rest; im aufgeklappten Zustand zwei Gruppen — "Weitere freie" immer, "Bezahlt" nur mit Key und mit Badge; Semantik nach Abschnitt 4.1 (`aria-expanded`/`aria-controls`, `role="group"` + `aria-labelledby`, `aria-pressed`, `aria-live`); `modelFilterIds` bleibt unbenutzt |
| 4 | `src/components/sidebar/PersonalizationSidebarSection.tsx` | Reset-Guard (:53-57) darf ein bezahltes Standardmodell nicht mehr still zuruecksetzen |
| 5 | `src/components/ChatProvider.tsx` | `normalizeLegacyTextModelId` (:727-732) um Aliase erweitern: `deepseek` -> `deepseek/deepseek-v4-flash`, `kimi` -> `moonshotai/kimi-k2.6`, `glm` -> `z-ai/glm-5.3`, `minimax` -> `minimax/minimax-m3`, `qwen-coder` -> `qwen/qwen3-coder-30b-a3b-instruct`, `gemini-search` -> frei oder entfernen |
| 6 | `src/lib/pollen-cost-guard.ts` | `textModelIsPaid` (:63-67) auf `PAID_TEXT_MODEL_IDS` statt `isFree`; veralteten Budget-Kommentar (:37-42) korrigieren |
| 7 | `src/lib/chat/chat-capability-resolution.ts` | `resolveEffectiveTextModel`/`getFallbackModel` (:43-99) muessen kanonische IDs und bezahlte Modelle akzeptieren; `AVAILABLE_POLLINATIONS_MODELS[0]` bleibt ein freies Modell |
| 8 | `src/config/ui-constants.ts` | `featuredModels` (:73-78) = die kuratierten freien Picks; `modelDisplayMap` (:52-70) auf die neuen IDs; `modelIcons` (:30-50) um die neuen IDs ergaenzen, `nova-lite` entfernen. Fehlende Marken (Gemma -> `GoogleIcon`) fallen auf den Buchstaben-Platzhalter zurueck, kein Blocker |
| 9 | Tests | `src/config/__tests__/model-invariants.test.ts:52-96` (Policy == Liste, Mitgliedschaft, Router-Kandidaten), `src/config/chat-options.test.ts:8-31`, `src/hooks/useVisiblePollinationsTextModels.test.tsx` (neu: Liste ohne Key / mit Key), `src/lib/chat/__tests__/chat-capability-resolution.test.ts` |
| 10 | `src/components/ChatProvider.tsx` | Reset beim Key-Wegfall (R9): steht ein Bezahltarif-Modell als Standard und ist kein eigener Key mehr da, faellt der Standard auf `DEFAULT_POLLINATIONS_MODEL_ID` zurueck — neben `normalizeLegacyTextModelId` (:727-742), nicht im Sendepfad |

Nicht angefasst (Auflage): `next.config.ts`, `src/lib/media/**`, `src/lib/upload/**`, andere
`docs/PLAN-*.md`.

### 5.1 Risiken

| ID | Risiko | Wirkung | Gegenmassnahme |
|---|---|---|---|
| **R1** | Freie Liste kuerzen, bevor der Katalog existiert | `isKnownPollinationsTextModelId` (`src/app/api/chat/completion/route.ts:151,176`) lehnt gespeicherte `defaultTextModelId`-Werte mit 400 ab; `PersonalizationSidebarSection.tsx:53-57` setzt sie still auf den Default zurueck | Schritt 1 vor Schritt 3; Alias-Map in Schritt 5 gleichzeitig |
| **R2** | `textModelIsPaid` bleibt auf `isFree` | keyloser Nutzer schickt ein Bezahltarif-Modell mit `paid_only: false` auf Betreiberrechnung | Schritt 6 zwingend, Test darauf |
| **R3** | Router-Kandidaten verlieren ihr freies Modell | `getPreferredLiveSearchModel()`/`getPreferredDeepResearchModel()` -> `undefined`, Anfrage laeuft auf dem aufrufenden (evtl. bezahlten) Modell | `perplexity/sonar` + `perplexity/sonar-reasoning-pro` bleiben in der freien Liste; Test `model-invariants.test.ts:90-96` |
| **R4** | Default zeigt auf ein bezahltes Modell | jeder keylose Nutzer landet im 402 | `DEFAULT_POLLINATIONS_MODEL_ID` muss ein freies Modell bleiben |
| **R5** | Alte `localStorage`-Werte werden nicht migriert | Dropdown zeigt einen Wert, den die Liste nicht kennt (Radix rendert leer) | Alias-Map in Schritt 5 deckt alle alten IDs ab |
| **R6** | `AVAILABLE_POLLINATIONS_MODELS` wird versehentlich key-abhaengig | Kostenguard und Fallback-Kette arbeiten dann auf einer Liste, die von einer Browser-Einstellung abhaengt — der Server kennt keinen Key-Zustand | Schritt 1 haelt beide Konstanten getrennt; ein Test haelt fest, dass die Server-Konstante frei bleibt |
| **R7** | Ueberbreites Panel | 75 zusaetzliche Eintraege im aufgeklappten Waehler | Gruppen im aufgeklappten Zustand; Aufklappen bleibt eine bewusste Handlung; `max-h-[45vh]` (:216) genuegt |
| **R8** | Doppeldeutige Vorgabe "genau ein je Anbieter" | wir bauen die falsche Bezahltarif-Groesse | vor Phase 4 bestaetigen (Abschnitt 3.2) |
| **R9** | Standardmodell bleibt nach Key-Wegfall auf einem Bezahltarif-Modell | der erste Send laeuft in den 402; der heutige Guard (`PersonalizationSidebarSection.tsx:53-57`) greift nur bei unbekannten IDs, einen key-getriebenen Reset gibt es nirgends | Schritt 10; Test auf `removeStoredPollenKey` -> Standard ist wieder frei |
| **R10** | Ein Rename der ID-Konstante laesst den Audit-Waechter still schweigen | `scripts/audit/pollinations-drift-report.js:12` parst per Regex auf den exakten Namen; `scripts/check-model-registry.mjs:120` liest `POLLINATIONS_MODELS`, das es in `chat-options.ts` nie gab (der `.catch()` schluckt es) | Konstante behaelt ihren Namen; beide Scripts in Schritt 1 mitziehen |
| **R11** | Versehentlich `modelFilterIds` aktivieren | `otherModels` wird `[]`, der Aufklapp-Knopf verschwindet und mit ihm die zweite Stufe | Schritt 3 laesst das Prop unberuehrt (Abschnitt 4.1) |

### 5.2 Was nicht bricht

Hooks, die unveraendert bleiben: `useProviderMode`, `useShowCommunityModels`, `usePollenKey` /
`useHasPollenKey`, `useUnifiedImageToolState`, `useChatState`. Die Sichtbarkeitsstufe ist additiv:
kein neuer Storage-Key, kein neues Event, kein Serverzustand, kein Cookie. `usePlaygroundModels` und
`/api/pollen/image-models` bleiben unberuehrt — die sind Bild, und `POLLEN_SERVER_KEY_FREE_IDS`

Kleinkram, der in Schritt 5 mitgeht: `ChatProvider.tsx:17` importiert `AVAILABLE_POLLINATIONS_MODELS` und benutzt die Konstante nirgends mehr — toter Import, faellt beim Typecheck nicht auf.
(`src/lib/playground/pollen-model-catalog.ts:30`) ist nur das Muster, dem die Textliste folgt.

### 5.3 Warum so (Phase 3, Reality Check)

- **Kein Live-Fetch fuer Textmodelle.** Der Bildpfad holt den Katalog zur Laufzeit
  (`usePlaygroundModels`). Fuer Text waere das derselbe Fehler wie damals bei den Bildern: die
  Union aus Katalog und Config zeigte 82 Modelle, 5 waren bedienbar. Der Textpfad bleibt eine
  kuratierte, gemessene Liste mit einem Datum am Eintrag.
- **Kanonische IDs statt Aliase.** Abschnitt 1.6 zeigt, dass die Alias-Liste des Katalogs nicht das
  Routing ist. Ein Alias ist ein Versprechen ueber die Zukunft, das der Anbieter nicht einloest.
- **Eigene Bezahltarif-Liste statt `paid_only`.** `paid_only` misst Guthaben, nicht unsere Tarife.
  Wer Tarife aus dem Anbieter-Flag ableitet, baut 60+ unbezahlte Wege auf die Betreiberrechnung.
- **Ausklappen statt Verzeichnis.** 84 Eintraege im zugeklappten Waehler sind keine Auswahl, das ist
  ein Telefonbuch. Wer den Key hat, oeffnet die Karte — das ist die bewusste Handlung, und sie
  braucht kein zweites Bedienelement daneben.
- **Kein Zustand, wo eine Tatsache reicht.** Ein persistierter Sichtbarkeits-Schalter muesste
  migriert, synchronisiert und zurueckgesetzt werden, und er kann zwischen zwei Verbrauchern
  auseinanderlaufen. Der Key ist bereits der Zustand, ein zweiter daneben ist eine Fehlerquelle.

---

## 6. Naechster Schritt

Phase 4 (Code) ist **nicht** freigegeben. Die Korrektur vom 2026-09-11 ist eingearbeitet
(Abschnitt 4): der Key entscheidet, das Ausklappen zeigt alles, kein zweiter Schalter. Offen sind
drei Entscheidungen:

1. **Umfang der Bezahltarif-Gruppe** (Abschnitt 3.2): "Spotlight ueber vollem Non-Community-Katalog"
   oder "ausschliesslich die fuenf"? Empfehlung: Spotlight ueber voller Liste — "alle" ist zweimal
   gefallen.
2. **Die zwei Frontier-Picks** im Gratis-Tarif: `openai/gpt-5.6-sol` + `x-ai/grok-4.6` oder die
   Alternativen `anthropic/claude-opus-5` / `google/gemini-3.1-pro-preview` (letzteres hatte 1 von 2
   Calls mit 502).
3. **Die beiden Standardmodell-Dropdowns** (`SettingsPopover.tsx:255-262`, `PersonalizationSidebarSection.tsx:165-175`):
   kuratiert lassen (Empfehlung, Abschnitt 4) oder mit Key ebenfalls auf den vollen Katalog? 84 Eintraege
   ohne Suchfeld sind per Tastatur kaum bedienbar.

Festlegungen dieses Plans, keine offenen Punkte: `perplexity/sonar` und `perplexity/sonar-reasoning-pro`
bleiben im freien Tarif, aber nicht im Spotlight — Smart Router und Deep Research waehlen daraus
(`getPreferredLiveSearchModel()`), ohne sie faellt die Funktion auf `undefined` (R3). Und der Standardmodell-Wert faellt auf ein
freies Modell zurueck, wenn der Key verschwindet (R9, Schritt 10) — sonst wartet der Nutzer nach dem
Entfernen des Keys auf einen 402.

Bedingung fuer Phase 4 bleibt: Schritt 6 (`pollen-cost-guard.ts`) liegt **vor** dem Sichtbarmachen
des Katalogs, sonst laeuft ein keyloser Nutzer mit einem Bezahltarif-Modell auf die
Betreiberrechnung.

Randnotiz: in `.env.local` steht der alte Server-Key auskommentiert; ein echter Key gehoert rotiert.
