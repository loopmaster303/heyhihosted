# Implementierungsplan — Phase 3: Modellwahrheit gegen die Live-Registry

**Datum:** 2026-08-27
**Branch:** `main`, HEAD `f880389` (Arbeitsbaum offen, 95 Einträge)
**Art:** Plan. Kein Code geschrieben, nichts committet, nichts gepusht.
**Grundlage:** `AGENTS.md`, `HANDOFF.md`, `docs/HANDOFF-2026-08-27-fahrplan.md` (Abschnitt 4 und 6),
`docs/FAHRPLAN-create.md` (Phase 3), `CLAUDE.md`, sowie eine **eigene Live-Ziehung der
Pollinations-Registry am 2026-08-27, 09:54 UTC** — nicht der Befund aus dem Handoff.
**Vorbild der Arbeitsweise:** `docs/pollinations-api-audit-2026-06-01.md`,
`docs/pollinations-deep-audit-2026-06-27.md`.

> **Ausgeführt am 2026-08-28.** Ergebnis und Abweichungen: [HANDOFF-2026-08-28-phase-3.md](HANDOFF-2026-08-28-phase-3.md). Abschnitt 0 (Vorbedingung) ist erledigt und nur noch historisch.

Dieser Plan liefert **Phase 1 bis 3 des AGENTS-Workflows** und stoppt vor Phase 4.
Ausführung erst nach ausdrücklicher Freigabe — und erst, nachdem die drei Entscheidungen
in Abschnitt 7 beantwortet sind.

---

## 0. Vorbedingung: Phase 0 ist nicht abgeschlossen

`git status --porcelain` meldet **95 Einträge**. Von den Dateien, die dieser Plan anfasst,
liegen bereits im offenen Arbeitsbaum:

| Datei | Zustand |
|---|---|
| `src/config/unified-image-models.ts` | `M` — VACE ausgeblendet (Sitzung 2026-08-26) |
| `src/lib/playground/model-source.ts` | `M` — `enabled`-Filter im Pruna-Zweig (2026-08-26) |
| `src/config/pruna-models.ts` | `M` — Payload-Korrekturen (2026-08-26) |
| `src/lib/pollinations-registry.ts` | `M` |
| `src/app/api/compose/route.ts` | `M` |
| `src/config/__tests__/pruna-models.test.ts`, `src/lib/playground/model-source.test.ts`, `src/lib/pollinations-registry.test.ts` | `M` |
| `src/config/features.ts`, `src/config/chat-options.test.ts` | `??` (neu, untracked) |

Nicht im Arbeitsbaum, also unverändert gegenüber `f880389`: `src/config/chat-options.ts`,
`src/config/enhancement-prompts.ts`, `src/config/unified-model-configs.ts`,
`src/config/ui-constants.ts`.

**Konsequenz:** Phase 3 darf nicht starten, bevor Phase 0 abgeschlossen und gepusht ist.
Sonst vermischt sich die Modellkorrektur mit zwei fremden, teils undokumentierten Sitzungen,
und der Diff wird nicht mehr reviewbar. Das ist keine Formalie — die Datei
`unified-image-models.ts` ist genau die, an der beide Phasen arbeiten.

---

## 1. Ziel

**In einem Satz:** Jede Modell-Liste des Repos beschreibt wieder, was die Anbieter tatsächlich
liefern — ein angebotenes Modell existiert, und ein als kostenlos beschriftetes Modell läuft
ohne Schlüssel.

### Fertig-Kriterien, in prüfbare Schritte übersetzt

| # | Kriterium | Prüfung |
|---|---|---|
| **F1** | Kein im Visualize oder im Create angebotenes Modell antwortet mit „unbekannt" | Für jede ID aus `getVisualizeModelGroups({includeByopHidden:true})` und aus `buildPrunaEntries()` gilt: sie steht in der Live-Registry (als `name` **oder** `alias`) oder hat ein `PRUNA_MODEL_MAP`-Mapping. Als Test gegen einen eingecheckten Registry-Schnappschuss (Abschnitt 8, T1). |
| **F2** | Kein als kostenlos markiertes Modell verlangt einen Schlüssel | Für jedes `isFree: true` gilt: entweder Pollinations mit `paid_only !== true`, oder Pruna und ausdrücklich als „läuft über den Server-Key des Betreibers" dokumentiert. Test T2. |
| **F3** | Umgekehrt: kein kostenloses Modell ist fälschlich als schlüsselpflichtig geführt | Abgleich in beide Richtungen, Test T2. |
| **F4** | Die Text-Modellliste erfüllt F2 ebenfalls | `VISIBLE_POLLINATIONS_MODEL_IDS` gegen `gen.pollinations.ai/text/models`. **Heute verletzt** — siehe 3.3. Test T3. |
| **F5** | Ein Modell, das aus einer Liste fliegt, hinterlässt keine Leiche | Für jede entfernte ID: kein Treffer mehr in `unified-model-configs.ts`, `ui-constants.ts`, `enhancement-prompts.ts` (Alias **und** Prompt), `param-schema.ts`. Test T4. |
| **F6** | Prompt-Verbesserung fällt für kein geführtes Modell still auf den Standard zurück | Für jede geführte ID liefert `selectGuidelines()` entweder einen handgeschriebenen Eintrag oder einen registry-gestützten Prompt — nie `DEFAULT_ENHANCEMENT_PROMPT`, außer die Registry ist unerreichbar. Test T5. |
| **F7** | `CLAUDE.md` und `README.md` tragen **keine** Drift-Warnung mehr | Weder `CLAUDE.md:5`/`:29 ff.` noch `README.md:53 ff.`/`:66 ff.` enthalten einen „⚠ … drifted"-Block; stattdessen ein Datum und ein Verweis auf das Prüfmittel. Sichtprüfung + `grep`. |
| **F8** | Der Abgleich ist wiederholbar, ohne dass jemand die Registry im Kopf hat | Ein Befehl erzeugt den Ist/Soll-Vergleich (Abschnitt 8, Werkzeug). |

**Nicht Kriterium:** dass jedes Modell schöne Ergebnisse liefert. F1–F8 prüfen Existenz,
Erreichbarkeit und Beschriftung, nicht Qualität.

---

## 2. Was die Live-Registry heute sagt

Gezogen am **2026-08-27, 09:54 UTC**:

```bash
curl -s https://gen.pollinations.ai/image/models
curl -s https://gen.pollinations.ai/audio/models
curl -s https://gen.pollinations.ai/text/models
```

| Endpunkt | Einträge | frei | schlüsselpflichtig |
|---|---|---|---|
| `/image/models` | 70 | 28 | 42 |
| `/audio/models` | 23 | 4 (alle STT) | 19 |
| `/text/models` | 208 | 142 | 66 |

### 2.1 Korrekturen am Handoff-Befund vom selben Tag

Der Handoff nennt **35 frei zu 39 schlüsselpflichtig**. Heute sind es **28 zu 42** bei 70
Einträgen. Die Registry hat sich innerhalb eines Tages bewegt. Das ist das stärkste Argument
für Abschnitt 7, Frage 3.

Drei Aussagen des Handoffs halten der eigenen Ziehung **nicht** stand:

1. **`gpt-image` ist nicht tot.** Es ist in der Live-Registry ein **Alias von `gptimage`**,
   und `gptimage` ist frei. Das Repo übersetzt die ID zudem bereits selbst:
   `toPollinationsVisualApiModelId()` in [unified-image-models.ts:468](/Users/johnmeckel/heyhihosted/src/config/unified-image-models.ts#L468)
   bildet `'gpt-image' → 'gptimage'` ab. Das Modell funktioniert heute. Handlungsbedarf gibt
   es nur bei der irreführenden Benennung und bei `findRegistryModel()` (Befund B3).
2. **`nova-reel` ist nicht „nirgends geführt".** Es steht in
   [unified-image-models.ts:352-365](/Users/johnmeckel/heyhihosted/src/config/unified-image-models.ts#L352)
   — aber mit `isFree: false, enabled: false`, obwohl die Beschreibung im selben Eintrag
   „free tier" sagt. Live ist es frei. Das ist ein Beschriftungsfehler, kein fehlender Eintrag.
3. **Es gibt einen vierten freien Bild-Kandidaten, den der Handoff nicht nennt:**
   `gpt-image-2` (frei, 16 Referenzbilder).

### 2.2 Neu und im Handoff nicht enthalten: die Textmodelle

Der Handoff hat `/text/models` nicht geprüft. Das Ergebnis betrifft F2 direkt:

**Vier der zwölf sichtbaren Chat-Modelle sind `paid_only: true`** — `claude-fast`,
`gemini-fast`, `gemini-search`, `mistral`. Acht sind frei: `deepseek`, `nova-fast`,
`perplexity-fast`, `perplexity-reasoning`, `kimi`, `glm`, `minimax`, `qwen-coder`.

`claude-fast` und `gemini-fast` stehen an erster und zweiter Stelle der Liste — also
mit hoher Wahrscheinlichkeit die Vorgabe für jeden neuen Nutzer ohne Pollen-Schlüssel.
Das ist ein plausibler zweiter Grund für die Nutzerbeschwerde „oft steht nur Fehler da",
neben dem Bild-Drift.

### 2.3 Musik: bestätigt

**Alle 15 Text→Audio-Modelle sind `paid_only: true`.** `acestep` existiert nicht.
Frei sind nur vier STT-Modelle: `whisper`, `gpt-transcribe`, `universal-2`,
`universal-3.5-pro`. **Jedes TTS-Modell ist schlüsselpflichtig** (`elevenlabs`, `elevenflash`,
`kokoro`, `qwen-tts`, …) — auch das gehört geprüft, weil die App Voice anbietet.

---

## 3. Abgleichstabelle: Modell → Zustand im Code → Zustand live → Maßnahme

Legende Maßnahme: **KORR** = Flag korrigieren · **RAUS** = Eintrag entfernen ·
**AUS** = `enabled: false`, Eintrag bleibt · **NEU** = aufnehmen · **PRÜF** = gegen die
Pruna-Doku prüfen, siehe 3.4 · **OK** = unverändert.

### 3.1 Bild — aktiv geführt (`enabled: true`)

| ID im Code | Provider (Code) | Code: isFree / enabled / byop | Live (Pollinations) | Maßnahme |
|---|---|---|---|---|
| `flux` | pollinations | true / true / — | `flux`, frei | **OK** |
| `klein` | pollinations | true / true / — | `klein`, frei | **OK** |
| `kontext` | pollinations | true / true / — | `kontext`, frei | **OK** |
| `gptimage-large` | pollinations | true / true / — | `gptimage-large`, frei | **OK** |
| `gpt-image` | pollinations | true / true / — | **Alias von `gptimage`**, frei; Repo übersetzt bereits | **OK**, aber Name schärfen (2.1) |
| `grok-imagine` | pollinations | **true** / true / — | `grok-imagine`, **paid_only** | **KORR** → `isFree: false`, `enabled: false`, `byopVisible: true` |
| `ideogram-v4-turbo` | pollinations | **true** / true / — | `ideogram-v4-turbo`, **paid_only** | **KORR** → wie oben |
| `zimage` | **pruna** | true / true / — | bei Pollinations frei (`zimage`), im Code aber Pruna-Dispatch | **PRÜF** — Entscheidung E-A, siehe 3.4 |
| `qwen-image` | **pruna** | **true** / true / — | bei Pollinations **paid_only**; im Code Pruna-Dispatch | **PRÜF** + **KORR** (siehe 3.4) |
| `wan-image-small` | **pruna** | **true** / true / — | bei Pollinations **nicht vorhanden**; im Code Pruna-Dispatch | **PRÜF** — hängt allein an der Pruna-Doku |
| `p-image` | pruna | false / true / true | existiert bei Pollinations **auch**, paid | **OK** — Entscheidungsfrage 2 |
| `p-image-edit` | pruna | false / true / true | existiert bei Pollinations **auch**, paid | **OK** — Entscheidungsfrage 2 |
| `qwen-image-edit-plus` | pruna | false / true / true | bei Pollinations nur als **Alias von `qwen-image`** | **PRÜF** |
| `p-image-try-on` | pruna | false / true / true | Pruna-only | **PRÜF** |
| `p-image-ideogram` | pruna | false / true / true | Pruna-only | **PRÜF** |
| `p-flux-klein` | pruna | false / true / true | Pruna-only (`flux-2-klein-4b`) | **PRÜF** |
| `p-image-upscale` | pruna | false / true / true | Pruna-only | **PRÜF** |

### 3.2 Video — aktiv geführt

| ID im Code | Provider | Code | Live | Maßnahme |
|---|---|---|---|---|
| `ltx-2` | pollinations | **true / true** | **existiert nicht** (auch nicht als Alias) | **RAUS** — 19 Fundstellen in 9 Dateien |
| `p-video` | pruna | false / true / true | bei Pollinations auch, paid | **OK** — Frage 2 |
| `p-video-avatar` | pruna | false / true / true | Pruna-only | **PRÜF** |
| `p-video-animate` | pruna | false / true / true | Pruna-only | **PRÜF** |
| `p-video-replace` | pruna | false / true / true | Pruna-only | **PRÜF** |
| `wan-t2v` | pruna | false / true | Pruna-only | **PRÜF** |
| `wan-i2v` | pruna | false / true | Pruna-only | **PRÜF** |

### 3.3 Bild/Video — abgeschaltet geführt (`enabled: false`)

| ID | Code | Live | Maßnahme |
|---|---|---|---|
| `nova-reel` | isFree **false**, enabled false | **frei**, Video, 1 Referenzbild | **KORR + NEU aktivieren** → `isFree: true, enabled: true`; Brauchbarkeit prüfen (Abschnitt 5, Schritt 4) |
| `seedream` | false / false / byop **false** | live vorhanden, paid | **AUS** lassen (Geist-ID, `seedream5` ist die aktuelle) |
| `nanobanana`, `nanobanana-2`, `nanobanana-pro`, `nanobanana-2-lite` | false / false / byop true | live vorhanden, paid | **OK** |
| `grok-imagine-pro`, `ideogram-v4-quality`, `wan-image`, `wan-image-pro` | false / false / byop true | live vorhanden, paid | **OK** |
| `seedance-pro`, `seedance-2.0`, `wan`, `wan-pro`, `wan-pro-1080p`, `veo`, `grok-video-pro` | false / false | live vorhanden, paid | **OK** |
| `veo-1080p`, `pollinations-wan-fast` | false / false / byop true | live nur als **Alias** (`veo-1080p` → `veo`; `wan-fast`) | **KORR** — als Alias führen statt als eigenes Modell, sonst schlägt `findRegistryModel` fehl (Befund B3) |
| `grok-video` | false / false | live nur als **Alias von `grok-video-pro`** | **RAUS** oder als Alias |
| `wan-fast` (provider pruna) | false / false | Pollinations hat ein eigenes `wan-fast` (paid) | Namenskollision — **KORR**, eindeutig benennen |
| `vace` | false / false / **byop false** | Pruna-only | **OK — nicht anfassen.** Bewusst abgeschaltet, 6–12 min Laufzeit. Der Kommentar `// byopVisible: false, sonst holt ein Pruna-Schluessel es wieder hervor` bleibt stehen. |

### 3.4 Pruna — der ungeprüfte Teil

Die Pruna-Registry wurde am 2026-08-27 **nicht** geprüft. `src/config/pruna-models.ts` führt
18 IDs mit diesen `prunaModel`-Namen:

`z-image-turbo`, `qwen-image`, `qwen-image-edit-plus`, `wan-t2v`, `wan-i2v`, `vace`,
`p-image`, `p-image-edit`, `p-video`, `p-image-try-on`, `p-image-upscale`, `p-video-avatar`,
`p-video-animate`, `p-video-replace`, `wan-image-small`, `p-image-ideogram`, `flux-2-klein-4b`.

Zu prüfen gegen `docs.api.pruna.ai/guides/models/<model>`, je Modell:
Existiert der Name noch · stimmt das Input-Schema mit `buildInput` überein · stimmt der
Safety-Disable-Key (`disable_safety_checker` vs. `disable_safety_filter`).

**Wie ohne Kosten prüfen:** Pruna hat keinen Cancel-Endpunkt, jeder gültige Payload startet
einen abrechenbaren Lauf. Der in `CLAUDE.md` dokumentierte Weg gilt weiter: Schema-Validierung
mit einer unerreichbaren Medien-URL (`https://invalid.invalid/x.jpg`) erzwingen, dann sagt
die 400-Antwort, welche Felder die API kennt, ohne dass etwas gerechnet wird. Für reine
Text→Bild-Modelle bleibt nur die Doku-Seite.

**Der eigentliche Konflikt (Entscheidung E-A):** `zimage`, `qwen-image` und `wan-image-small`
tragen `provider: 'pruna'` **und** `isFree: true`. Pruna-Dispatch braucht immer einen
Schlüssel; `resolvePrunaKey()` fällt auf `process.env.PRUNA_API_KEY` zurück. „Frei" heißt
hier also: *frei für den Nutzer, bezahlt vom Betreiber*. Ist `PRUNA_API_KEY` auf Vercel nicht
gesetzt, antwortet `/api/generate` mit
`503 Model … requires PRUNA_API_KEY which is not set` — und drei als kostenlos beschriftete
Modelle fallen aus. **Erster Schritt der Umsetzung ist deshalb: prüfen, ob `PRUNA_API_KEY`
in der Vercel-Produktionsumgebung gesetzt ist.** Ist sie es nicht, sind alle drei sofort
`isFree: false, enabled: false, byopVisible: true`.

### 3.5 Text (Chat)

| ID | Code | Live | Maßnahme |
|---|---|---|---|
| `claude-fast` | sichtbar, keine Kostenmarkierung | **paid_only** | **Entscheidung nötig** — siehe Abschnitt 5, Schritt 6 |
| `gemini-fast` | sichtbar | **paid_only** | dito |
| `gemini-search` | sichtbar | **paid_only** | dito |
| `mistral` | sichtbar | **paid_only** | dito |
| `deepseek`, `nova-fast`, `perplexity-fast`, `perplexity-reasoning`, `kimi`, `glm`, `minimax`, `qwen-coder` | sichtbar | frei | **OK** |

`PollinationsModel` hat heute **kein** `isFree`-Feld. Die Chat-Modellliste kann eine
Schlüsselpflicht also gar nicht ausdrücken — das ist der strukturelle Teil des Problems,
nicht nur eine falsche Zeile.

### 3.6 Audio (Compose · TTS · STT)

| ID | Code | Live | Maßnahme |
|---|---|---|---|
| `acestep` | `AVAILABLE_COMPOSE_MODELS`, `isFree: true`, **Vorgabe an vier Stellen** | **existiert nicht** | **RAUS** — aber die Entfernung ist Phase 8, siehe Abschnitt 10 |
| `elevenmusic` | `isFree: false` | paid | **OK** |
| `stable-audio-3-medium` | `isFree: false` | paid | **OK** |
| `stable-audio-3-large` | nicht geführt | paid | **NEU** in Phase 8 |
| `lyria-3-clip` | nicht geführt | paid | **NEU** in Phase 8 |
| TTS-Modelle | `/api/tts` | **alle paid_only** | **PRÜF** — Abschnitt 5, Schritt 7 |
| STT-Modelle | `/api/stt` | `whisper`, `gpt-transcribe`, `universal-*` frei | **PRÜF** |

**In Phase 3 gehört davon nur:** `FREE_TIER_MODELS = ['acestep']` in
[compose/route.ts:10](/Users/johnmeckel/heyhihosted/src/app/api/compose/route.ts#L10)
entschärfen. Heute lässt die Route ohne Schlüssel ausgerechnet das nicht existierende Modell
durch und weist alles andere mit 403 ab — der freie Weg ist strukturell eine Sackgasse.
Minimaleingriff: `FREE_TIER_MODELS` auf `[]` setzen und die Vorgabe von `acestep` weg.
Die vollständige Ausrottung samt Musik-UI bleibt Phase 8.

### 3.7 Frei und live, aber im Repo nicht geführt

`dreamshaper`, `nova-canvas`, `gpt-image-2` (Bild) · `nova-reel` (Video, geführt aber
abgeschaltet, siehe 3.3) · dazu 18 Community-Modelle mit Namensraum (Entscheidungsfrage 1).

Bewertung für die Aufnahme in `unified-image-models.ts` — siehe Abschnitt 5, Schritt 4.

---

## 4. Strukturbefunde — warum der Drift überhaupt durchschlägt

Die falschen Flags sind das Symptom. Diese fünf Befunde sind die Ursache und entscheiden,
ob Phase 3 hält oder in drei Monaten wieder auseinanderläuft.

### B1 — `isVisibleVisualModel()` liest `isFree` nie

[unified-image-models.ts:500-506](/Users/johnmeckel/heyhihosted/src/config/unified-image-models.ts#L500):

```ts
function isVisibleVisualModel(model, options = {}) {
  if (model.enabled ?? true) return true;
  return !!options.includeByopHidden && model.byopVisible !== false;
}
```

`isFree` steuert **nur** die Gruppenzuordnung („IMAGE FREE" vs. „IMAGE ADVANCED") in
`getVisualizeModelGroups`. Ein Modell mit `isFree: true, enabled: true` ist damit
*immer* sichtbar, auch ohne Schlüssel, auch wenn es einen braucht. Genau das passiert heute
bei `grok-imagine` und `ideogram-v4-turbo`: der Nutzer sieht sie unter der Überschrift
„FREE", klickt, und bekommt einen 402/403 vom Upstream.

Das ist der direkte Mechanismus hinter Fertig-Kriterium F2. Er wird durch das Korrigieren
der Flags behoben — aber ein Test muss ihn festnageln, sonst kippt er beim nächsten Eintrag
zurück.

### B2 — Playground und Visualize haben zwei verschiedene Wahrheiten

`buildPollinationsEntries()` in
[model-source.ts:96](/Users/johnmeckel/heyhihosted/src/lib/playground/model-source.ts#L96)
baut die Playground-Liste **direkt aus der Live-Registry** und filtert dabei:

- ✅ `isPrunaModel(m.name)` → die Pollinations-Kopien von `p-image` / `p-image-edit` /
  `p-video` fallen bereits heraus (das entschärft Entscheidungsfrage 2 im Code, nicht aber
  konzeptionell)
- ✅ `community` → über `useShowCommunityModels`, Vorgabe aus
- ❌ **`enabled` nicht** · ❌ **`isFree` nicht** · ❌ **`byopVisible` nicht**

Die vom Nutzer genannte Falle („`model-source.ts` hat schon einmal `enabled` nicht gelesen")
ist also **nur im Pruna-Zweig** repariert
([model-source.ts:63](/Users/johnmeckel/heyhihosted/src/lib/playground/model-source.ts#L63)).
Im Pollinations-Zweig greift keines der drei Flags.

Folgen, beide echt:

- Der Playground kann **F1 nicht verletzen** — er liest live, ein unbekanntes Modell kommt
  dort gar nicht erst vor. Das ist ein Vorteil, kein Fehler.
- Der Playground **verletzt F2 heute strukturell** — er zeigt alle 42 schlüsselpflichtigen
  Pollinations-Modelle auch ohne Pollen-Schlüssel. `paidOnly` wird zwar pro Eintrag
  mitgeführt, aber ob die Oberfläche daraus einen Hinweis baut, ist in dieser Phase zu prüfen
  (Abschnitt 5, Schritt 5).

**Das ist die wichtigste Architekturfrage dieser Phase** und sie ist keine der drei
Nutzer-Rückfragen: Soll `unified-image-models.ts` weiterhin die *Auswahl* sein und die
Registry die *Fähigkeitsquelle*? Empfehlung in Abschnitt 5, Schritt 5.

### B3 — `findRegistryModel()` kennt keine Aliase

[pollinations-registry.ts:53](/Users/johnmeckel/heyhihosted/src/lib/pollinations-registry.ts#L53):
`models.find((m) => m.name === modelId)`. Die Registry führt aber pro Modell ein
`aliases`-Array, und mehrere Repo-IDs *sind* Aliase: `veo-1080p`, `grok-video`,
`qwen-image-edit-plus`, `nanobanana-lite`, `z-image-turbo`.

Ein Modell, das die lokale Config nicht kennt und das nur unter einem Alias existiert,
läuft damit in `400 Unknown or unavailable Pollinations image/video model`
([generate/route.ts:110](/Users/johnmeckel/heyhihosted/src/app/api/generate/route.ts#L110))
— also exakt in „unbekannt", das Fertig-Kriterium F1 ausschließt.

**Maßnahme:** `findRegistryModel` auf `m.name === id || m.aliases?.includes(id)` erweitern.
Vier Zeilen, größte Wirkung pro Zeile in dieser Phase.

### B4 — Fünf parallele Modell-Register, kein Band dazwischen

| Datei | Rolle | Einträge |
|---|---|---|
| `src/config/unified-image-models.ts` | Auswahl + Flags | ~45 |
| `src/config/unified-model-configs.ts` | Regler pro Modell | 52 |
| `src/config/ui-constants.ts` | Icon pro Modell | ~50 |
| `src/config/enhancement-prompts.ts` | Alias-Tabelle + Prompts | ~40 + Aliase |
| `src/config/pruna-models.ts` | Pruna-Payloads | 18 |

`unified-model-configs.ts` enthält heute Einträge für `flux-2-dev`, `dirtberry`, `imagen-4`,
`klein-large`, `seedance`, `seedream` — IDs, die `unified-image-models.ts` gar nicht mehr
führt und die `model-invariants.test.ts` ausdrücklich als „stale drift ids" bezeichnet.
Es gibt keinen Test, der die fünf Register aneinander bindet.

**Maßnahme:** Ein Konsistenztest (T4), keine Zusammenlegung. Zusammenlegen wäre ein
Refactor, der über Phase 3 hinausschießt.

### B5 — Der bestehende Invariantentest schützt weniger, als er aussieht

In [model-invariants.test.ts](/Users/johnmeckel/heyhihosted/src/config/__tests__/model-invariants.test.ts)
steht mehrfach:

```ts
expect(visibleImageModelIds).not.toEqual(expect.arrayContaining(['klein', 'dirtberry', ...]))
```

`not.toEqual(arrayContaining([a,b,c]))` hält bereits, wenn **ein einziges** Element fehlt.
`klein` steht in dieser Verbotsliste und ist trotzdem sichtbar und aktiv — der Test läuft
grün, weil `dirtberry` fehlt. Solche Assertions müssen bei der Gelegenheit in
Einzelprüfungen aufgelöst werden, sonst ist das grüne Testfeld kein Argument.

Zusätzlich referenziert der Test `ltx-2` als „legacy Pollinations"-Beispiel
(`getDurationOptionsSeconds`) und `gpt-image` in zwei weiteren Fällen — beim Entfernen
von `ltx-2` bricht er, und zwar richtigerweise.

---

## 5. Component Mapping — welche Datei, warum

Reihenfolge = Ausführungsreihenfolge. Jeder Schritt hat eine eigene Verifikation.

### Schritt 1 — Werkzeug zuerst: der Abgleich als Skript

**Neu:** `scripts/check-model-registry.mjs` (oder `tools/`, je nach Repo-Konvention)

**Warum zuerst:** Der Rest dieses Plans ist eine Momentaufnahme vom 2026-08-27, 09:54 UTC.
Zwischen 2026-08-26 und heute hat sich das Verhältnis von 35/39 auf 28/42 verschoben. Wer
die Tabelle aus Abschnitt 3 abtippt, ohne vorher neu zu ziehen, baut den nächsten Drift ein.
Das Skript zieht alle drei Endpunkte, vergleicht gegen `unified-image-models.ts`,
`chat-options.ts` und `pruna-models.ts` und gibt genau die Tabelle aus Abschnitt 3 aus.

**Nebenprodukt:** `src/config/__fixtures__/registry-snapshot.json` — die eingecheckte Ziehung,
gegen die die Tests T1–T3 offline laufen. Ohne Schnappschuss wären die Tests netzabhängig
und damit in CI unbrauchbar.

**Verifikation:** `node scripts/check-model-registry.mjs` läuft und meldet die in Abschnitt 3
beschriebenen Abweichungen — nicht mehr, nicht weniger. Weicht die Ausgabe von Abschnitt 3 ab,
hat sich die Registry erneut bewegt und Abschnitt 3 wird aus der Ausgabe neu geschrieben.

### Schritt 2 — `src/lib/pollinations-registry.ts`

**Warum:** Befund B3. Ohne Alias-Auflösung bleibt F1 unerreichbar, egal wie sauber die
Config ist. Der `RegistryModel`-Typ bekommt `aliases?: string[]`, `findRegistryModel`
prüft Name und Aliase.

**Warum hier und nicht in `unified-image-models.ts`:** Die dortige Tabelle
`POLLINATIONS_IMAGE_MODEL_ALIASES` ist eine *Repo*-Alias-Tabelle (interne Kurznamen).
Die Registry-Aliase kommen vom Anbieter und pflegen sich selbst — sie gehören nicht
abgeschrieben.

**Verifikation:** `findRegistryModel('gpt-image')` findet `gptimage`;
`findRegistryModel('veo-1080p')` findet `veo`. Test in
`src/lib/pollinations-registry.test.ts` (bereits im Arbeitsbaum geändert — Konflikt beachten).

### Schritt 3 — `src/config/unified-image-models.ts`

**Warum:** Das ist der Ort, den `CLAUDE.md` als „single source of truth" benennt. Hier
landen alle **KORR**/**RAUS**/**AUS**/**NEU** aus Abschnitt 3.1–3.3.

Konkret:
- `grok-imagine`, `ideogram-v4-turbo` → `isFree: false, enabled: false, byopVisible: true`
- `nova-reel` → `isFree: true, enabled: true` (nach Brauchbarkeitsprüfung, Schritt 4)
- `ltx-2` → Eintrag entfernen, dazu `POLLINATIONS_IMAGE_MODEL_ALIASES` (`ltxvideo`,
  `ltx-video`)
- `grok-video` → entfernen oder in die Alias-Tabelle verschieben
- `veo-1080p`, `pollinations-wan-fast` → als Alias führen, nicht als eigenes Modell
- `zimage`, `qwen-image`, `wan-image-small` → gemäß Ergebnis von Schritt 0/E-A
- `vace` **unverändert** — einschließlich des erklärenden Kommentars

**Nicht anfassen:** `isVisibleVisualModel()`. Die Funktion ist korrekt für das, was sie tut;
`isFree` gehört nicht in die Sichtbarkeit hinein, sonst verschwinden schlüsselpflichtige
Modelle auch für Nutzer, die einen Schlüssel haben. Der Schutz gehört in den Test (T2),
nicht in die Laufzeit.

**Verifikation:** `getVisualizeModelGroups()` (ohne Schlüssel) enthält ausschließlich
Modelle, die die Live-Ziehung als frei führt. Test T2.

### Schritt 4 — Bewertung der freien, ungeführten Modelle

**Betroffen:** `dreamshaper`, `nova-canvas`, `gpt-image-2`, `nova-reel`.

**Warum ein eigener Schritt:** Der Handoff hat `nova-reel` ausdrücklich „gefunden, aber nicht
auf Brauchbarkeit geprüft". Ein freies Modell aufzunehmen, das nichts Brauchbares liefert,
verschlechtert den ersten Eindruck mehr, als es die Auswahl verbessert — und Phase 7 will
die Chat-Auswahl gerade *reduzieren*.

Prüfkriterien je Modell, jeweils eine Generierung mit demselben Prompt:
1. Antwortet es überhaupt ohne Schlüssel?
2. Laufzeit — bei `nova-reel` (bis 120 s Video) die entscheidende Frage; das 202-Protokoll
   aus `request-generation.ts` deckt Pruna ab, **nicht** Pollinations-Videos. Braucht
   `nova-reel` länger als das Vercel-Funktionslimit, ist es ohne weitere Arbeit nicht
   anbietbar → dann `enabled: false` mit Begründung im Kommentar.
3. Passen `maxImages`, `supportsEndFrame`, Dauerwerte zur Registry-Angabe?
4. Braucht es einen Enhancement-Prompt oder reicht `buildRegistryEnhancementPrompt()`?

**Verifikation:** Pro aufgenommenem Modell ein erzeugtes Asset; pro abgelehntem Modell eine
Zeile Begründung im Code-Kommentar und im Handoff.

### Schritt 5 — `src/lib/playground/model-source.ts` und `src/hooks/usePlaygroundModels.ts`

**Warum:** Befund B2. Der Playground zeigt schlüsselpflichtige Modelle ohne Hinweis.

**Empfohlener Zuschnitt (bewusst minimal):** `buildPollinationsEntries` bleibt live-gespeist —
das ist die Eigenschaft, die den Playground gegen Drift immun macht, und die soll nicht
aufgegeben werden. Stattdessen:

- `paidOnly` wird bereits pro Eintrag geführt. Prüfen, ob `ModelPicker`/`PlaygroundShell` es
  auswerten; falls nicht, ein Schlüssel-Abzeichen ergänzen und die Auswahl ohne Pollen-Key
  entweder sperren oder mit dem Pollenwall-Hinweis versehen (denselben, den Phase 8 für
  Musik braucht).
- `enabled: false` aus der Config wird für Pollinations-Modelle **respektiert**, aber nur
  als Ausblenden, nicht als Filter auf die ganze Liste — sonst schrumpft der Playground auf
  die kuratierte Auswahl und verliert seinen Zweck. Konkret: `getUnifiedModel(id)?.enabled
  === false` ⇒ ausblenden; `unmapped: true` ⇒ weiter zeigen.

**Warum diese Asymmetrie vertretbar ist:** Visualize ist die kuratierte Oberfläche, Create
die vollständige. Genau das ist die Aufgabenteilung, die Phase 7 herstellen will
(„Der Weg zur vollen Auswahl führt sichtbar ins Create"). Phase 3 muss sie nur nicht kaputt
machen.

**Verifikation:** Test T6 — ein Modell mit `enabled: false` erscheint nicht in
`buildPollinationsEntries`; ein `unmapped`-Modell schon; `paidOnly` wird korrekt übernommen.

### Schritt 6 — `src/config/chat-options.ts`

**Warum:** Abschnitt 3.5. Vier von zwölf sichtbaren Chat-Modellen sind schlüsselpflichtig,
und die Datenstruktur kann das nicht ausdrücken.

**Zwei Möglichkeiten, ich empfehle die zweite:**

- (a) Die vier paid-Modelle aus `VISIBLE_POLLINATIONS_MODEL_IDS` entfernen. Sauber gegenüber
  F2, aber die Liste verliert Claude und Gemini — die beiden Namen, die Nutzer erwarten,
  und `gemini-search` ist der Träger der Websuche.
- (b) **`isFree?: boolean` an `PollinationsModel` ergänzen**, die vier markieren, und im
  Modellwähler dieselbe Pollenwall-Behandlung wie im Bild anwenden: sichtbar, beschriftet,
  ohne Schlüssel nicht wählbar. Die Vorgabe für Nutzer ohne Schlüssel muss dann ein freies
  Modell sein — heute steht `claude-fast` an erster Stelle.

(b) hält F2 ein, ohne das Angebot zu beschneiden, und liefert genau das Muster, das Phase 4
(verständliche Fehler) und Phase 8 (Musik hinter der Pollenwall) ohnehin brauchen.

Betroffen sind neben der Liste: `getVisiblePollinationsModels()`,
`LIVE_SEARCH_MODEL_CANDIDATES` und `DEEP_RESEARCH_MODEL_CANDIDATES` — die Kandidatenketten
dürfen ohne Schlüssel nicht auf einem paid-Modell landen. `perplexity-fast` und
`perplexity-reasoning` sind frei, die Ketten sind also rettbar.

**Berührt den Smart Router.** Dessen Verhalten darf sich nur dort ändern, wo es heute in
einen 402 läuft. Kein Umbau der Routing-Logik in dieser Phase.

**Verifikation:** Test T3; dazu ein manueller Chat-Durchlauf im privaten Fenster (kein
Pollen-Schlüssel im `localStorage`) mit dem Vorgabemodell.

### Schritt 7 — `src/app/api/compose/route.ts`, `/api/tts`, `/api/stt`

**Warum:** Abschnitt 3.6. In Phase 3 gehört nur der Teil, der ein *falsches Versprechen*
korrigiert:

- `FREE_TIER_MODELS` auf `[]`, Vorgabe der Route weg von `acestep`.
- TTS/STT: prüfen, welches Modell die Routen tatsächlich anfragen, und ob es frei ist.
  Ist die Sprachausgabe faktisch schlüsselpflichtig, muss das Fertig-Kriterium F2 auch dort
  gelten — entweder Hinweis oder Ausblenden. **Bewertung, dann Rückfrage**, kein stiller
  Umbau der Voice-Oberfläche.

**Nicht hier:** `acestep` aus 19 Fundstellen entfernen. Das ist Phase 8, ausdrücklich so
im Fahrplan festgehalten, und es hängt an der neuen Musik-UI.

### Schritt 8 — die Nebenregister: `unified-model-configs.ts`, `ui-constants.ts`, `enhancement-prompts.ts`, `param-schema.ts`

**Warum:** Fertig-Kriterium F5 und F6, und die vom Nutzer genannte Falle. `CLAUDE.md`
begründet unter „Prompt Enhancement" die Auflösungsreihenfolge:
`canonicalEnhancementKey()` → Audio-Zweig → handgeschriebener Eintrag →
`buildRegistryEnhancementPrompt()` → Default. Wer eine ID entfernt und den Alias stehen
lässt, erzeugt einen Alias auf ein nicht existierendes Ziel; wer den Prompt entfernt und
die ID behält, lässt sie still auf den Standard fallen — inklusive des Bild-Längenlimits,
das für Audio falsch ist.

Konkret für `ltx-2`: Eintrag in `unified-model-configs.ts:211`, Icon in `ui-constants.ts`,
Prompt **und** die beiden Aliase `ltxvideo`/`ltx-video` in `enhancement-prompts.ts`,
dazu die Testreferenzen.

Bei der Gelegenheit **nicht** die übrigen Geister (`flux-2-dev`, `dirtberry`, `imagen-4`,
`klein-large`, `seedance`) aufräumen — das ist Altbestand, nicht von dieser Änderung erzeugt.
`CLAUDE.md` und die Hausregel „Clean up only your own mess" gelten. Stattdessen: Test T4
schreiben, der sie sichtbar macht, und den Befund im Handoff notieren.

### Schritt 9 — `CLAUDE.md`, `README.md`

Siehe Abschnitt 9.

---

## 6. Reality Check (AGENTS.md Phase 3)

### Führt das zu Spaghetti-Code?

**Nein, aber es kommt darauf an, was man weglässt.** Der einzige Punkt mit echtem
Spaghetti-Risiko ist Schritt 5: Wenn `model-source.ts` anfängt, Flags aus
`unified-image-models.ts` selektiv zu respektieren, gibt es zwei Sichtbarkeitsregeln in zwei
Dateien. Deshalb ist der Zuschnitt bewusst asymmetrisch und in **einer** Zeile ausdrückbar
(`enabled === false` ⇒ ausblenden, alles andere durchlassen) statt als zweite Kopie von
`isVisibleVisualModel`.

Der zweite Kandidat ist Schritt 6: `isFree` an `PollinationsModel` ist ein neues Feld in
einer Struktur, die bisher rein deskriptiv war. Es bleibt vertretbar, weil `ComposeModelOption`
im selben File dasselbe Feld schon führt — das Muster existiert, es wird nicht erfunden.

### Breche ich bestehende Hooks?

| Hook / Modul | Betroffen? | Warum es hält |
|---|---|---|
| `useChatState`, `useChatPersistence` | Nein | Kennen keine Modell-Flags |
| `useUnifiedImageToolState` | **Ja, indirekt** | Liest `getVisualizeModelGroupsForProvider`. Fällt das Vorgabemodell weg (`ltx-2`), muss ein neues Vorgabemodell greifen. Gespeicherte Auswahl im `localStorage` kann auf eine entfernte ID zeigen → **Fallback prüfen**, siehe Restrisiko R1 |
| `usePlaygroundModels` | **Ja** | Schritt 5 |
| `useProviderMode` | Nein | Scopet nur die Liste; die Semantik bleibt |
| `usePollenKey`, `useShowCommunityModels` | Nein | Werden gelesen, nicht geändert |
| `useComposeMusicState` | **Ja, minimal** | Vorgabe `acestep`; in dieser Phase nur der Routen-Anteil, der Hook bleibt Phase 8 |
| `/api/generate` | **Ja** | Über `resolvePollinationsVisualModelId` und `findRegistryModel` |

### Gibt es einen einfacheren, idiomatischeren Weg?

Ja — und er wurde geprüft und verworfen:

**Verworfen: die Config ganz abschaffen und alles live lesen.** Das würde F1 und F2 auf einen
Schlag lösen und die Handpflege beenden. Es kostet aber alles, was die Config trägt: die
kuratierte Reihenfolge, die deutschen Anzeigenamen, die Regler aus
`unified-model-configs.ts`, die Enhancement-Prompts und den Pruna-Zweig, den die
Pollinations-Registry gar nicht kennt. Außerdem würde Phase 7 („Chat auf eine kleine,
begründete Auswahl reduzieren") sein Werkzeug verlieren. `CLAUDE.md` beschreibt die
Kuratierung als Absicht, nicht als Altlast.

**Verworfen: `isFree` in `isVisibleVisualModel()` einbauen.** Kürzer, aber falsch: dann
verschwinden schlüsselpflichtige Modelle auch für Nutzer mit Schlüssel, und `byopVisible`
wird bedeutungslos.

**Behalten: Skript + Schnappschuss + Test.** Die Kuratierung bleibt Handarbeit, aber der
*Drift* wird maschinell sichtbar. Das ist die Arbeitsweise der beiden Vorbild-Audits, nur
automatisiert statt als Fließtext.

### Verschlimmbesserungs-Risiken

| # | Risiko | Gegenmittel |
|---|---|---|
| **R1** | Eine gespeicherte Modellauswahl im `localStorage` zeigt auf eine entfernte ID (`ltx-2`, `grok-video`). Der Nutzer öffnet die App und bekommt sofort einen Fehler — genau die Beschwerde, die diese Phase beheben soll. | Vor dem Entfernen prüfen, ob `useUnifiedImageToolState` und `PlaygroundShell` eine unbekannte gespeicherte ID auf das Vorgabemodell zurückfallen lassen. Falls nicht: **das ist Teil dieser Phase**, nicht von Phase 4. |
| **R2** | VACE wird versehentlich reaktiviert — etwa durch eine pauschale „alle Pruna-Modelle mit Mapping anzeigen"-Regel. | `enabled: false, byopVisible: false` und der Kommentar bleiben unangetastet. Der bestehende Test *disabled VACE stays hidden even for a user with a Pruna key* bleibt und wird nicht angepasst. |
| **R3** | Der Alias-Fix in `findRegistryModel` öffnet `/api/generate` für Modelle, die die Oberfläche nie anbietet. | Kein neues Risiko: die Route akzeptiert Registry-Modelle heute schon bewusst (siehe Kommentarkopf von `pollinations-registry.ts`). Die Referenz- und Dauervalidierung bleibt davor. |
| **R4** | Die Registry bewegt sich wieder, bevor die Änderung gemerged ist. | Schritt 1 vor Schritt 3; der Schnappschuss trägt sein Ziehungsdatum im Dateinamen oder im Feld `fetchedAt`. |
| **R5** | Die 4 paid-Chat-Modelle auszublenden ändert das Vorgabemodell und damit den Charakter des Produkts, ohne dass jemand zugestimmt hat. | Deshalb Empfehlung (b) in Schritt 6 und ausdrückliche Rückfrage im Ausführungsthread. |
| **R6** | Merge-Konflikt mit dem offenen Arbeitsbaum in `unified-image-models.ts`, `model-source.ts`, `pollinations-registry.ts`. | Abschnitt 0 — Phase 0 zuerst. |

---

## 7. Entscheidungsvorlage — drei Rückfragen

Diese drei entscheiden den Zuschnitt und sind **nicht** still zu beantworten.

### Frage 1 — Modelle mit Namensraum (`vendouple/…`, `MarcosFRG/…`, `chigwell/…`, `JustScriptzz/…`, `sharktide/…`, `Catniti/…`)

**Befund:** 18 solcher Einträge, 14 davon frei — darunter `vendouple/uncensored-image-v2`,
`vendouple/nano-banana-pro`, `MarcosFRG/flux-1-schnell`. Sie tragen in der Registry das Feld
`community: true` und einen zweiten Alias mit `community/`-Präfix.

**Wichtig:** Das Repo kennt das Muster bereits besser, als der Handoff annimmt.
`useShowCommunityModels` (Vorgabe **aus**, umschaltbar in den Einstellungen) filtert sie
im Playground schon heute heraus. Die Lücke ist nur, dass `unified-image-models.ts` und
Visualize sie gar nicht kennen.

| Option | Folge |
|---|---|
| **A — ignorieren** (nicht in die Config, im Playground weiter hinter dem bestehenden Schalter) | Kein Aufwand. 14 freie Modelle bleiben im Create hinter einem Schalter erreichbar, im Chat gar nicht. |
| **B — hinter einen Schalter** (Status quo formalisieren, den Schalter benennen und dokumentieren) | Minimaler Aufwand. Der Schalter existiert bereits. |
| **C — aufnehmen** (einzelne in `unified-image-models.ts` kuratieren) | Jeder Eintrag braucht Namen, Icon, Regler, Enhancement-Prompt. Community-Modelle können jederzeit verschwinden — der nächste Drift ist eingebaut. |

**Empfehlung: B.** Der Mechanismus ist schon da und funktioniert; er muss nur benannt und in
`CLAUDE.md` beschrieben werden. Kuratieren (C) widerspricht dem Ziel dieser Phase — man
handpflegt 14 Einträge, deren Betreiber niemand kennt, und die Namen wie
`uncensored-image-v2` tragen; das ist zusätzlich eine inhaltliche Entscheidung, keine
technische. Was **fehlt** und nachzuziehen wäre: `community: true` in der Registry-Sicht von
`/api/generate` ebenfalls beachten, damit ein Community-Modell nicht über die Route erreichbar
ist, während die Oberfläche es ausblendet.

### Frage 2 — `p-image`, `p-image-edit`, `p-video` erscheinen jetzt auch bei Pollinations

**Befund:** Alle drei stehen in `/image/models`, alle drei `paid_only: true`, mit Aliasen
`pruna-image`, `pruna-edit`, `pruna-video`. `CLAUDE.md` beschreibt sie als reine
Pruna-Familie. Die übrigen `p-*`-Modelle (`p-image-try-on`, `p-image-upscale`,
`p-video-avatar`, `p-video-animate`, `p-video-replace`) sind **nicht** bei Pollinations —
die Familie ist also nur teilweise doppelt.

Im Code sind die Doppel bereits unterdrückt: `buildPollinationsEntries` filtert
`isPrunaModel(m.name)` heraus. Es gibt also heute keine Doppelung in der Oberfläche.

| Option | Folge |
|---|---|
| **A — Status quo, nur dokumentieren** | Die drei laufen weiter über Pruna, brauchen weiter einen Pruna-Schlüssel. Kein Code. `CLAUDE.md` bekommt einen Satz, dass die Namensgleichheit bewusst ignoriert wird. |
| **B — zweiter Weg** (über Pollinations, wenn kein Pruna-Schlüssel da ist) | Ein Nutzer mit Pollen-Schlüssel käme ohne Pruna-Konto an sie heran. Kostet: Provider-Auflösung pro Anfrage statt pro Modell, zwei Payload-Formate für dieselbe ID, zwei Fehlerbilder. Berührt die in `CLAUDE.md` festgeschriebene Regel „der Dispatch hängt am **Modell**, nie am Schalter". |
| **C — auf Pollinations umstellen** | Ein Schlüssel weniger. Verliert aber die handgepflegten Pruna-Payloads samt Safety-Disable-Keys, und Pollinations dokumentiert für diese drei keine eigene Parameterfläche. |

**Empfehlung: A für diese Phase, B als eigene Bewertung danach.** Begründung: B und C sind
Provider-Architektur, nicht Modellwahrheit. Phase 3 ist ohnehin schon der zweite
Flaschenhals — wenn hier zusätzlich die Provider-Trennung aufgeht, blockiert sie die Phasen
4, 7 und 8 länger als nötig. A kostet einen Absatz in `CLAUDE.md`, verändert nichts am
Verhalten, und lässt die Frage sauber gestellt stehen.

**Anschlussfrage, die A mit beantwortet:** Solange `PRUNA_API_KEY` gesetzt ist, ändert sich
für den Nutzer nichts. Ist sie es nicht (siehe 3.4), wird B plötzlich attraktiv, weil dann
`p-image` über Pollinations der einzige funktionierende Weg wäre.

### Frage 3 — Lohnt ein wiederkehrender automatischer Abgleich?

**Befund, der die Frage beantwortet:** Zwischen dem Handoff (2026-08-26/27) und dieser
Ziehung (2026-08-27, 09:54 UTC) hat sich das Verhältnis von **35/39 auf 28/42** verschoben.
Handpflege gegen eine Registry, die sich täglich bewegt, verliert strukturell.

| Option | Folge |
|---|---|
| **A — Handpflege wie bisher** | Der heutige Zustand wiederholt sich. Kein Aufwand, garantierter Rückfall. |
| **B — Prüfung, kein Auto-Sync** (Skript + eingecheckter Schnappschuss + Test + wöchentlicher Lauf, der bei Abweichung meldet) | Der Drift wird sichtbar, ohne dass er still übernommen wird. Kuratierung bleibt Handarbeit. Aufwand: einmal das Skript, dann ein Cron. |
| **C — Auto-Sync zur Laufzeit** (Config aus der Registry generieren) | Kein Drift mehr — aber Anzeigenamen, Reihenfolge, Regler, Enhancement-Prompts und die Kuratierung für Phase 7 gehen verloren oder brauchen eine zweite Overlay-Datei. Ein Registry-Ausfall würde das Modellangebot leeren. |

**Empfehlung: B.** Konkret: `scripts/check-model-registry.mjs` aus Schritt 1, ein
`registry-snapshot.json` als Testfixture, und ein wöchentlicher Lauf (GitHub Action oder
Vercel Cron — das Projekt deployt ohnehin über Vercel), der bei Abweichung einen Report
ablegt. **Kein** automatisches Schreiben in die Config. Der Unterschied zu C ist
entscheidend: B meldet, C entscheidet — und die Entscheidung, ob ein neues freies Modell
angeboten wird, ist eine Produktentscheidung, keine Registry-Frage.

**Rückfrage im Detail:** Soll der Report als Datei im Repo landen, als GitHub-Issue, oder
genügt ein fehlschlagender CI-Test (dann fällt es beim nächsten PR auf, aber niemand wird
aktiv benachrichtigt)?

---

## 8. Testplan

### Bestehende Tests, die brechen werden — und sollen

| Datei | Warum |
|---|---|
| `src/config/__tests__/model-invariants.test.ts` | Referenziert `ltx-2` (Dauerhelfer), `gpt-image` (zweimal), `ideogram-v4-turbo`, `grok-imagine`, `qwen-image`. Zusätzlich sind die `not.toEqual(arrayContaining([...]))`-Assertions in Einzelprüfungen aufzulösen (Befund B5). |
| `src/lib/playground/model-source.test.ts` | Schritt 5 ändert `buildPollinationsEntries`. **Liegt bereits geändert im Arbeitsbaum.** |
| `src/lib/pollinations-registry.test.ts` | Schritt 2 (Alias-Auflösung). **Liegt bereits geändert im Arbeitsbaum.** |
| `src/config/__tests__/pruna-models.test.ts` | Nur, falls Schritt 0/E-A Pruna-Mappings ändert. **Liegt bereits geändert im Arbeitsbaum.** |
| `src/app/api/generate/route.test.ts` | Nennt `wan-image-small`, `gpt-image`, `grok-imagine`. |
| `src/app/api/enhance-prompt/route.test.ts` | Nennt `ltx-2`, `wan-image-small`, `gpt-image`, `grok-imagine`, `qwen-image`, `acestep`. Größte Trefferzahl, dünnste Kopplung — hier zuerst schauen. |
| `src/app/api/compose/route.test.ts` | `acestep` in zwei Fällen (Schritt 7). |
| `src/app/playground/playground.e2e.test.tsx` | `gpt-image`. |
| `src/lib/services/__tests__/chat-service.test.ts` | `ltx-2`. |
| `src/lib/__tests__/pollinations-image-v1.test.ts` | `grok-imagine`. |
| `src/lib/pruna/client.test.ts` | `wan-image-small`. |

### Neue Tests

| # | Datei | Prüft | Fertig-Kriterium |
|---|---|---|---|
| **T1** | `src/config/__tests__/registry-truth.test.ts` (neu) | Jede geführte Pollinations-ID steht im Schnappschuss als `name` oder `alias`; jede geführte Pruna-ID hat ein `PRUNA_MODEL_MAP`-Mapping | F1 |
| **T2** | dieselbe Datei | `isFree: true` ⇔ `paid_only !== true` im Schnappschuss. Für Pruna-Modelle mit `isFree: true` eine ausdrückliche Ausnahmeliste mit Begründung im Test, damit die Ausnahme sichtbar bleibt statt still zu gelten | F2, F3 |
| **T3** | `src/config/chat-options.test.ts` (erweitern — liegt untracked im Arbeitsbaum) | `VISIBLE_POLLINATIONS_MODEL_IDS` gegen den Schnappschuss; `LIVE_SEARCH_MODEL_CANDIDATES` und `DEEP_RESEARCH_MODEL_CANDIDATES` enthalten mindestens ein freies Modell | F4 |
| **T4** | `src/config/__tests__/registry-consistency.test.ts` (neu) | Jede ID aus `UNIFIED_IMAGE_MODELS` hat einen Eintrag in `unified-model-configs.ts` und ein Icon in `ui-constants.ts`; umgekehrt meldet der Test verwaiste Einträge (zunächst als dokumentierte Ausnahmeliste, siehe Befund B4) | F5 |
| **T5** | `src/app/api/enhance-prompt/route.test.ts` (erweitern) | Für jede geführte ID liefert `selectGuidelines()` nicht `DEFAULT_ENHANCEMENT_PROMPT`; jeder Alias in `MODEL_ALIASES` zeigt auf einen existierenden Key | F6 |
| **T6** | `src/lib/playground/model-source.test.ts` (erweitern) | `enabled: false` blendet ein Pollinations-Modell aus; `unmapped` bleibt sichtbar; `paidOnly` wird durchgereicht; VACE bleibt draußen | Schritt 5 |
| **T7** | `src/hooks/__tests__/…` oder im bestehenden State-Test | Eine gespeicherte, nicht mehr existierende Modell-ID fällt auf das Vorgabemodell zurück, statt einen Fehler zu erzeugen | R1 |

### Ausführung

```bash
CI=1 npm test -- --runInBand src/config
CI=1 npm test -- --runInBand src/lib/playground src/lib/pollinations-registry.test.ts
CI=1 npm test -- --runInBand src/app/api
npm run typecheck && npm run lint && npm test && npm run build
```

### Manuelle Verifikation (nicht durch Tests ersetzbar)

1. **Ohne Schlüssel** (privates Fenster, leerer `localStorage`): je ein Bild aus jedem als
   frei geführten Modell erzeugen. Keines darf 402/403/503 liefern.
2. **Ohne Schlüssel:** ein Chat mit dem Vorgabemodell führen.
3. **Mit Pollen-Schlüssel:** ein schlüsselpflichtiges Modell erzeugen.
4. **Mit Pruna-Schlüssel:** ein `p-*`-Modell erzeugen; prüfen, dass VACE nicht auftaucht.
5. Im Create: die Modellliste durchsehen — kein Eintrag ohne Namen, keiner mit `unbekannt`.
6. `PRUNA_API_KEY` in der Vercel-Produktionsumgebung prüfen (Schritt 0/E-A).

Der Browser wird dabei **vom Nutzer** bedient — `AGENTS.md` verbietet Browser-Automation zur
Verifikation ausdrücklich, und `MEMORY.md` bestätigt das als Nutzerpräferenz.

---

## 9. Wie `CLAUDE.md` und `README.md` nachgezogen werden

Die Drift-Warnungen dürfen am Ende **nicht** stehenbleiben — sie sind der Zustand, den diese
Phase beendet.

### `CLAUDE.md`

| Stelle | Heute | Danach |
|---|---|---|
| Zeile 5 | „Model lists last verified 2026-08-12 and **known to be stale**" | Ein Datum ohne Einschränkung, plus: Modell-Listen werden durch `scripts/check-model-registry.mjs` und die Tests T1–T3 gedeckt |
| Zeile 29–50 (`> ⚠ The model lists in this section have drifted`) | Der gesamte Blockquote | **Ersatzlos entfernen.** Nicht abschwächen, nicht umformulieren — der Block existiert nur, weil die Listen falsch waren |
| „Visible image/video models" | Liste mit „six of these eleven are wrong" | Die korrigierte Liste, wieder ohne Einschränkung. Der bestehende Satz „Do not restate the full registry elsewhere — it drifts" bleibt |
| „Visible text models" | Nur IDs | Ergänzen, welche einen Pollen-Schlüssel brauchen (Ergebnis Schritt 6) |
| **Neuer Abschnitt** | — | „Modellwahrheit prüfen": der Befehl, der Schnappschuss, wo der wöchentliche Report landet, und die Regel, dass ein Registry-Befund niemals still in die Config wandert |
| „Provider Semantics" | — | Ein Absatz zu Frage 2: dass `p-image`/`p-image-edit`/`p-video` bei beiden Anbietern stehen und der Dispatch bewusst bei Pruna bleibt |
| „Open Questions" | — | Die in Abschnitt 7 offen gebliebenen Anschlussfragen wandern hierher, nicht in ein neues Dokument |

### `README.md`

| Stelle | Heute | Danach |
|---|---|---|
| Zeile 53–60 (`> ⚠ The config has drifted…`) | Blockquote mit sechs falschen IDs | **Ersatzlos entfernen**, darüber die korrigierte Prosa |
| Zeile 46 | Nennt `wan-image-small` als Beispiel | Nach Ergebnis von 3.4 anpassen |
| Zeile 20 + Compose-Abschnitt, Zeile 66–88 | ACE-Step als freie Stufe, dazu ein zweiter ⚠-Block und zwei Tabellen | **Teilweise.** Die falsche Zusage „ACE-Step 1.5 free up to 1 minute" muss weg, weil sie ein Produktversprechen ist, das nicht existiert. Der ⚠-Block bleibt bis Phase 8, aber verkürzt: „Compose ist abgeschaltet, Musik zieht in Phase 8 ins Create, ausschließlich mit Pollen-Schlüssel" — ohne die Modelltabellen, die dann in Phase 8 entstehen |

### Was **nicht** passiert

- Kein neues Wahrheitsdokument. `CLAUDE.md` und `README.md` sind laut `HANDOFF.md`
  synchronisierte Adapter über dieselbe Wahrheit; ein drittes Dokument widerspricht
  „Do not invent new truth docs".
- `HANDOFF.md` bekommt am Ende einen kurzen Abschnitt, der die Drift-Warnung dort
  (Zeile 33–47) **löscht** und durch den Verweis auf das Prüfmittel ersetzt.
- `GEMINI.md` wird als dritter Adapter mitgezogen, falls er dieselben Listen führt —
  ist beim Ausführen zu prüfen.

---

## 10. Was ausdrücklich NICHT Teil dieser Phase ist

| Nicht drin | Gehört zu | Warum |
|---|---|---|
| `acestep` aus allen 19 Fundstellen entfernen | **Phase 8** | Der Fahrplan legt es dort ausdrücklich fest; es hängt an der neuen Musik-UI. Phase 3 entschärft nur `FREE_TIER_MODELS`, damit das falsche Kostenlos-Versprechen weg ist |
| Die neue Musik-Oberfläche, `lyria-3-clip`, `stable-audio-3-large` aufnehmen | **Phase 8** | — |
| Die Chat-Modellauswahl auf eine kleine begründete Liste reduzieren | **Phase 7** | Phase 7 hängt an Phase 3, nicht umgekehrt. Phase 3 liefert die *bestätigte* Liste, Phase 7 wählt daraus aus |
| Verständliche Fehlermeldungen für 402/403/503, Pollen-403, Statuslampe | **Phase 4** | Phase 3 sorgt dafür, dass diese Fehler seltener auftreten — nicht dafür, wie sie klingen |
| `predictionId` über einen Reload retten, Fortschrittsanzeige, `vercel.json`-`maxDuration` | **Phase 4** | — |
| Gemeinsamer Asset-Pool, Löschen | **Phase 5** | — |
| Provider-Architektur umbauen (Frage 2, Option B/C) | **Eigene Bewertung nach Phase 3** | Würde diese Phase in die Länge ziehen und drei nachgelagerte Phasen blockieren |
| Community-Modelle kuratiert aufnehmen (Frage 1, Option C) | **Nicht geplant** | Empfehlung ist B |
| Die Geist-Einträge `flux-2-dev`, `dirtberry`, `imagen-4`, `klein-large`, `seedance`, `seedream` aus `unified-model-configs.ts` entfernen | **Nicht diese Phase** | Altbestand, nicht von dieser Änderung erzeugt. Test T4 macht sie sichtbar, die Entfernung braucht einen eigenen Auftrag |
| Die fünf Modell-Register zusammenlegen | **Nicht geplant** | Refactor ohne Auftrag; T4 hält sie stattdessen aneinander |
| Auto-Sync zur Laufzeit (Frage 3, Option C) | **Nicht geplant** | Empfehlung ist B |
| VACE reaktivieren | **Nie in dieser Phase** | Bewusst abgeschaltet, 6–12 min Laufzeit |
| Den Systemprompt in `chat-options.ts` anfassen | **Nur auf ausdrückliche Weisung** | `HANDOFF.md` und `CLAUDE.md` halten das übereinstimmend fest |
| Arbeitsbaum sortieren, committen, pushen | **Phase 0** | Vorbedingung, siehe Abschnitt 0 |

---

## 11. Zusammenfassung der offenen Punkte für den Nutzer

Bevor die Ausführung startet, brauche ich von dir:

1. **Frage 1** — Namensraum-Modelle: A, B oder C? *(Empfehlung: B)*
2. **Frage 2** — `p-*` bei beiden Anbietern: A, B oder C? *(Empfehlung: A für diese Phase)*
3. **Frage 3** — automatischer Abgleich: A, B oder C? Und wenn B: wohin geht der Report?
   *(Empfehlung: B)*
4. **Schritt 6** — Chat-Modelle: die vier schlüsselpflichtigen ausblenden (a), oder
   `isFree` einführen und sie hinter die Pollenwall stellen (b)? *(Empfehlung: b)*
5. **Schritt 0/E-A** — ist `PRUNA_API_KEY` in der Vercel-Produktionsumgebung gesetzt?
   Davon hängt ab, ob `zimage`, `qwen-image` und `wan-image-small` weiter als kostenlos
   angeboten werden dürfen. Das kann ich nicht selbst prüfen.

Punkt 5 ist der einzige echte Blocker — ohne die Antwort lässt sich Abschnitt 3.1 nicht
abschließen. Die übrigen vier verschieben nur den Zuschnitt.

---

## Zwei Erklärungen, wie in AGENTS.md gefordert

**Normal:** Die Modell-Listen des Repos sind eine handgepflegte Auswahl über zwei
Anbieterregistries. Die Pollinations-Registry hat sich bewegt — Modelle sind
schlüsselpflichtig geworden, andere verschwunden, neue freie hinzugekommen — und die
Auswahl ist nicht mitgezogen. Der Plan zieht die Registry live, korrigiert die Flags,
repariert drei strukturelle Ursachen (die Sichtbarkeitsprüfung ignoriert `isFree`, der
Playground ignoriert die Config-Flags, die Registry-Suche kennt keine Aliase), verankert
das Ergebnis in Tests gegen einen eingecheckten Registry-Schnappschuss und entfernt die
Drift-Warnungen aus der Dokumentation.

**Einfacher:** Die Speisekarte stimmt nicht mehr mit der Küche überein. Manche Gerichte
gibt es nicht mehr, manche kosten inzwischen Geld, obwohl „gratis" danebensteht, und ein
paar neue kostenlose stehen gar nicht drauf. Wir gehen einmal in die Küche, schreiben die
Karte neu, bauen eine Kontrolle ein, die künftig meckert, wenn beides auseinanderläuft,
und nehmen den Zettel „Achtung, Karte veraltet" wieder von der Tür.

**Warum so:** Weil die Registry sich nachweislich innerhalb eines Tages bewegt hat
(35/39 → 28/42). Nur die Flags zu korrigieren würde das Symptom für ein paar Wochen
beseitigen und die Ursache stehenlassen. Deshalb Skript und Test vor der Korrektur —
und deshalb ausdrücklich **kein** Auto-Sync: welche Modelle angeboten werden, bleibt
eine Produktentscheidung, die Registry liefert nur die Fakten.
