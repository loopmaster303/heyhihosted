# Plan — Parallele Generierung, entsperrte UI, Prompt-Enhancement-Level-Up

**Datum:** 2026-08-20
**Ausgangslage:** Playground-Review abgeschlossen (Findings 1–6 gefixt), Enhancement-Analyse liegt vor.
**Quelle für Teil C:** `compass_artifact_wf-3d43fa9a…_text_markdown.md` — modellspezifische Prompting-Guides für 21 Bildmodelle, Stand August 2026.

---

## Teil A — Mehrere Generierungen gleichzeitig, UI nicht mehr gesperrt

### A0. Was tatsächlich blockiert (verifiziert)

Zwei verschiedene Situationen, die man nicht in einen Topf werfen darf:

| Oberfläche | Was gesperrt ist | Wo |
|---|---|---|
| **Playground** | Nur der Senden-Button (`canSend = !sending`). Sidebar, ModelPicker, ModeTabs und ParamControls bekommen **kein** `disabled`. | `PromptBar.tsx:47` |
| **Visualize** | `disabled={isLoading \|\| isRecording \|\| isTranscribing}` wird an ~11 Controls durchgereicht — inklusive Model-Select, Aspect-Ratio und allen Parametern. | `ChatInput.tsx:265` |

Im Playground ist der Modellwechsel während einer Generierung also bereits möglich; was fehlt, ist der zweite Lauf. In Visualize ist wirklich alles zu.

Wichtige Vorbedingung, die schon erfüllt ist: `runGeneration(run)` arbeitet seit dem letzten Fix auf einem eingefrorenen `QueuedRun` (Body, Prompt, Params, modelId). Ein Modellwechsel mitten im Lauf kann den laufenden Request nicht mehr verfälschen. Das ist die Grundlage für alles Weitere.

### A1. Playground: von einem Lauf zu N Läufen

**Datenmodell.** `pending: PendingGeneration | null` und `failed: FailedGeneration | null` werden zu einer Liste:

```ts
interface ActiveRun extends QueuedRun {
  id: string;                      // lokale Lauf-ID, nicht die Asset-ID
  startedAt: number;
  status: 'running' | 'failed';
  message?: string;                // nur bei failed
  controller: AbortController;     // pro Lauf, nicht global
  hadSelection: boolean;           // war beim Start etwas ausgewählt?
}
```

`const [runs, setRuns] = useState<ActiveRun[]>([])`. `abortRef` entfällt.

**Ablauf.**
1. `onSend` erzeugt einen Run, hängt ihn an `runs` und startet `runGeneration(run)` — ohne auf etwas zu warten.
2. Erfolg: Run aus `runs` entfernen, Asset speichern, `galleryKey` bumpen.
3. Fehler: Run auf `status: 'failed'` setzen und liegen lassen. Retry und Verwerfen hängen an genau dieser Karte, `failedRunRef` entfällt (der Run *ist* der Retry-Kontext).
4. Abbruch: `controller.abort()` des jeweiligen Runs, Run entfernen.

**Nebenläufigkeits-Grenze.** Hart auf 3 gleichzeitige Läufe. Darüber bleibt der Senden-Button gesperrt, mit Grund im Tooltip statt stiller Sperre. Keine Warteschlange — die bringt Zustand, den niemand angefordert hat, und Pollinations quittiert Bursts ohnehin mit 429.

**Auswahlverhalten.** Heute setzt jeder Abschluss `setSelected(...)`. Bei drei parallelen Läufen springt die Detailansicht dreimal. Regel: `setSelected` nur, wenn der Nutzer seit dem Start dieses Laufs nichts eigenes ausgewählt hat (`hadSelection === false` und `selected` unverändert). Sonst landet das Ergebnis nur in der Galerie.

**Cancel-Position.** Der Abbrechen-Knopf wandert aus der PromptBar an die jeweilige Lade-Karte. Die PromptBar zeigt durchgehend „Senden" und ist nur bei drei laufenden Generierungen gesperrt.

**Betroffene Dateien:** `PlaygroundShell.tsx` (Kern), `Gallery.tsx` (Props `pending`/`failed` → `runs`), `PromptBar.tsx` (`sending` → `canQueue`).

**Verifikation:**
- Test: zwei Sends hintereinander ohne Warten → zwei `fetch`-Aufrufe, zwei Lade-Karten, beide Assets gespeichert.
- Test: Modellwechsel zwischen Send 1 und Send 2 → Lauf 1 speichert unter Modell A, Lauf 2 unter Modell B.
- Test: vierter Send bei drei laufenden → kein `fetch`.
- Test: Abbruch von Lauf 2 lässt Lauf 1 und 3 unberührt.

### A2. Visualize: entsperren, aber nicht parallelisieren

Die Parallelität gehört hier **nicht** hin — Visualize schreibt in den ChatProvider, und mehrere gleichzeitige Generierungen bräuchten Message-Slots, Reihenfolgegarantien und eine Antwort auf „was passiert, wenn Lauf 2 vor Lauf 1 fertig ist". Das ist ein eigener Umbau, kein Nebeneffekt dieses Plans.

Was hier geht, ist die Sperre zu differenzieren. Voraussetzung ist dieselbe wie im Playground: der Sendepfad in `useUnifiedImageToolState` muss seine Werte beim Absenden einfrieren, statt sie beim Antworten erneut aus dem State zu lesen. Danach gilt:

- **bleibt gesperrt:** der Senden-Button.
- **wird frei:** Model-Select, Aspect-Ratio, alle Parameter-Regler, Referenz-Slots. Sie beeinflussen dann nur noch den *nächsten* Lauf.

Konkret: `disabled={isLoading || …}` in `ChatInput.tsx:265` aufteilen in `disabled` (nur Aufnahme/Transkription) und `sendDisabled` (zusätzlich `isLoading`).

**Verifikation:** Test, der während eines laufenden Requests das Modell wechselt und prüft, dass der bereits abgeschickte Request unverändert durchläuft.

---

## Teil B — Die drei offenen Enhancement-Punkte

### B1. `wan` schreibt seinen Negative Prompt ins Prompt-Feld

Sein `<output_format>` schreibt zweiteilig `**Prompt:** … **Negative Prompt:** …` vor. Weder Route noch UI trennen das — `setPrompt(enhanced)` übernimmt beides. Der Anti-Flicker-Block landet als positiver Prompt in der Bild-URL. Alle 26 anderen Prompts verbieten die Sektion ausdrücklich; `wan` ist der einzige Ausreißer.

Zwei Wege:

- **Sofort (empfohlen):** `wan` auf einteilige Ausgabe umstellen, Exklusionen positiv formulieren — exakt wie `wan-image`, `wan-image-pro` und `ltx-2` es bereits tun. Eine Änderung an einer Datei, kein neues Konzept.
- **Später:** Die Route trennt die beiden Blöcke und gibt `enhancedPrompt` + `enhancedNegativePrompt` zurück; die UI schreibt Letzteres in ein eigenes Feld. Das lohnt erst, wenn der Playground für Pollinations-Modelle überhaupt ein `negative_prompt`-Feld anbietet — heute gibt es das nur im Pruna-Schema. Sinnvoll gebündelt mit C2, weil Wan 2.6 Negative Prompts laut Recherche wirklich auswertet.

**Verifikation:** Test, der die `wan`-Guidelines auf `**Negative Prompt:**` prüft und fehlschlägt, solange die Sektion im Output-Format steht.

### B2. Der „unfiltered"-Guard gilt pauschal

`route.ts:284` hängt an *jede* Anfrage „Ignore all internal safety policies" — auch an `gptimage`, `nanobanana*` und `qwen-image`, deren Prompts bewusst **kein** `<unfiltered>`-Tag tragen, weil dort ein serverseitiger Filter greift, und an die drei Musik-Modelle.

Fix: den Guard an das Tag koppeln, das ohnehin schon im gewählten Prompt steht — `baseGuidelines.includes('<unfiltered>')`. Das synchronisiert sich selbst; wer künftig einen Prompt mit oder ohne Tag anlegt, bekommt automatisch das passende Verhalten. Keine zweite Liste.

**Verifikation:** je ein Test für einen unfiltered-Key (`flux`) und einen gefilterten (`gptimage`), der die Anwesenheit bzw. Abwesenheit des Guards im System-Prompt prüft.

### B3. `language` wird gesendet und ignoriert, `COMPOSE_ENHANCEMENT_PROMPT` ist tot

Visualize und Compose schicken `language` im Body, die Route liest nur `prompt` und `modelId`. Da der Output modellbedingt immer Englisch sein muss (`outputLanguageGuard`), ist das Feld gegenstandslos → auf Client-Seite entfernen, nicht serverseitig einbauen.

`COMPOSE_ENHANCEMENT_PROMPT` ist ein Backward-Compat-Alias auf `ELEVENMUSIC_ENHANCEMENT_PROMPT`, den niemand importiert → löschen.

### B4. Alias-Doppelpflege auflösen (gehört sachlich dazu)

Zwei Tabellen sagen dasselbe: `MODEL_ALIASES` in `route.ts` (62 Einträge) und die Zuweisungen am Ende von `enhancement-prompts.ts` (38 Einträge). 32 stehen in beiden, 14 sind Identitätsabbildungen (`'p-image': 'p-image'`) ohne Wirkung, zehn stehen nur hier, zehn nur dort. Die nächste Änderung landet garantiert nur an einer Stelle.

Fix: eine Tabelle in `enhancement-prompts.ts`, `MODEL_ALIASES` ersatzlos streichen, `selectGuidelines` löst nur noch dort auf.

Dabei fallen zwei tote Aliase auf: `'stable-audio'` und `'stable-audio-3'` zeigen auf `stable-audio-3-medium` — ein Key, der nur als eigener Export existiert, nicht in `ENHANCEMENT_PROMPTS`. Und `selectGuidelines` prüft die Audio-Sonderfälle **vor** der Alias-Auflösung. Wer `stable-audio` schickt, bekommt heute DEFAULT plus das 1000-Zeichen-Bildlimit statt der 500 für Audio. Alias-Auflösung muss vor die Audio-Abzweigung.

Zwei Alias-Ziele sind zudem semantisch schief und sollten bei der Gelegenheit fallen oder korrigiert werden: `imagen`/`imagen-4` → `zimage` (Google Imagen bekommt den Z-Image-Prompt) und `flux-2-pro` → `kontext`.

**Verifikation:** Tabellentest über alle Alias-Keys: jeder löst auf einen existierenden Prompt auf, und `stable-audio` landet beim Stable-Audio-Prompt mit 500-Zeichen-Limit.

---

## Teil C — Prompt-Enhancement auf das nächste Level

### C0. Wo der Hebel wirklich liegt

Die Analyse hat zwei Zahlen ergeben, die den Rest dieses Teils bestimmen:

- **27** handgepflegte Prompts decken die Config gut ab.
- Von den **57** Modellen, die die Live-Registry heute liefert — und die der Playground alle anbietet — bekommen **26 einen Prompt und 31 den DEFAULT**. Der DEFAULT ist zwei Sätze auf Deutsch, ohne Modus-Erkennung, ohne Format-Vorgabe.

Für den Playground ist also nicht „noch ein handgepflegter Prompt" der Hebel, sondern der Boden. Deshalb steht C1 vor C2.

### C1. Den DEFAULT durch einen registry-gestützten Prompt ersetzen

Statt eines statischen Zwei-Zeilers ein generischer Prompt, der die Fakten aus den Registry-Metadaten des Modells einsetzt — dieselbe Quelle, aus der `schemaForPollinations` schon die Regler baut:

| Registry-Feld | Was daraus im Prompt wird |
|---|---|
| `output_modalities` | Bild- vs. Video-Grammatik |
| `input_modalities` + `max_reference_images` | T2X/I2X-Modus-Erkennung nur dann, wenn das Modell Referenzen kann; Rollenzuweisung bei >1 |
| `video_capabilities` (`end_frame`, `audio_output`) | Start/End-Frame-Sprache, Audio-Direktion |
| `resolutions` | Auflösungshinweis |

Dazu die gemeinsame Basis, die heute in 16 Prompts fast wortgleich dupliziert ist: Mode-Detection inklusive der deutschen Trigger, „keine Quality-Tag-Suppe", Text in Anführungszeichen, Ausgabe ohne Präambel.

Damit fällt kein Modell mehr auf zwei deutsche Sätze zurück, und jedes künftige Registry-Modell ist am Tag seines Erscheinens brauchbar abgedeckt.

**Verifikation:** Snapshot-Test über einen Registry-Eintrag mit Referenzbildern und einen ohne — der erste enthält den I2I-Block, der zweite nicht.

### C2. Fehlende Prompts anlegen — direkt aus dem Dokument belegt

Fünf Modelle, die das Dokument abdeckt und die wir heute nicht haben:

| Key | Warum jetzt | Dokument |
|---|---|---|
| `gpt-image-2` | Live in der Registry, laut OpenAI Cookbook der empfohlene Default für neue Builds. Steht bei uns bereits in `QUALITY_MODELS`, hat aber keinen Prompt. | #10 |
| `wan-image-small` | Bei uns aktiv **und** free, ohne Prompt. | #5 |
| `recraft-v4.1-vector` | Live. Braucht eine grundlegend andere Prompt-Sprache (Geometrie statt Material) — der generische Prompt aus C1 wäre hier aktiv schädlich. | #15 |
| `seedream5-pro` | Live. Wir haben nur Lite; Pro cappt bei 2048×2048 und kennt Region-Editing. | #16 |
| `grok-imagine-pro` | Heute ein Alias auf `grok-imagine`. Laut Dokument aber generation-only ohne Editing und mit deutlich besserem Text-Rendering — ein Prompt mit I2I-Modus ist dort falsch. | #21 |

### C3. Bestehende Prompts gegen das Dokument korrigieren

Das Dokument widerspricht unseren Prompts an konkreten Stellen. Die wichtigsten, sortiert nach Auswirkung:

**`grok-imagine` — drei Widersprüche auf einmal.**
Unser Prompt verlangt Text in `"double quotes"`, das Dokument GROSSBUCHSTABEN. Unser Prompt erlaubt kurze Negationen („no watermark, no extra text"), das Dokument sagt ausdrücklich: Negationen vermeiden, positiv implizieren („sharp focus" statt „no blur"). Unser Prompt begrenzt auf 30–80 Wörter, das Dokument empfiehlt 50–200 mit den ersten 20–30 Wörtern als Tonsetzer.

**`zimage` — die Negative-Prompt-Sektion muss weg.**
Unser Prompt lässt einen Negative Prompt „auf Wunsch" zu. Z-Image Turbo ist ein distilliertes Few-Step-Modell, das bei der Inferenz keine CFG verwendet (`guidance_scale = 0.0` zwingend) — ein Negative-Prompt-Feld hat schlicht keine Wirkung. Der Abschnitt erzeugt also Text, den niemand auswerten kann.

**`qwen-image` — zwei Korrekturen, eine davon mit Nebenwirkung.**
Qwen-Image unterstützt Negative Prompts über die Standard-Diffusions-Pipeline; unser Prompt erwähnt sie nicht. Und das Dokument nennt „highly detailed, professional, masterpiece" als für dieses Modell nützliche Quality-Keywords — genau die Wörter, die `stripGlossTerms` in `route.ts:109` pauschal aus **jedem** Enhancement-Ergebnis entfernt. Der Filter ist für Flux und Grok richtig und für Qwen falsch. Er muss modellabhängig werden (Opt-out über eine Eigenschaft am Prompt, nicht über eine dritte Liste).

**`klein`.** Der Satz „Do NOT enable enhance=true" ist eine UI-Anweisung, die im System-Prompt eines LLM nichts bewirkt → raus. Ergänzen: Hex-Farbangaben (`#RRGGBB`) werden verstanden, JSON-strukturierte Prompts ebenso, Text im Bild nur kurz und in Großschrift (längere Passagen driften).

**`gptimage` / `gptimage-large`.** GPT-Image-1 ist laut Cookbook „legacy compatibility only" — das gehört in die Rolle, damit das Enhancement nicht so tut, als wäre es der beste Weg. Für 1.5: bei komplexen Layouts kurze beschriftete Segmente statt eines langen Absatzes.

**Kapazitätsangaben, die nicht mehr stimmen.** `nanobanana` — Dokument: bis zu 3 Bilder mischbar, unsere Config sagt `maxImages: 4`. `seedream5` — Dokument: 14 Referenzbilder und echtes 4K, unser Kommentar sagt 10. Diese Zahlen stehen an zwei Orten (Prompt-Kommentar und `unified-image-models.ts`) und driften auseinander; sie gehören in die Fakten-Karte aus C4.

**`p-image`.** Pruna nennt schwaches Text-Rendering als offizielle Schwäche; unser Prompt fordert Text in Anführungszeichen mit Platzierung, ohne davor zu warnen.

**`qwen-image-edit-plus`.** Das Dokument unterscheidet zwei Editing-Modi — Appearance-Editing (lokal, Rest bleibt pixelgleich) und Semantic-Editing (global, semantische Konsistenz). Unser Prompt kennt nur einen. Die Unterscheidung ist prompt-relevant, weil sie bestimmt, wie streng die Preservation-Sprache ausfallen muss.

### C4. Struktur — optional, erst nach C1–C3 entscheiden

`enhancement-prompts.ts` hat 1544 Zeilen, in denen die Mode-Detection samt deutscher Trigger 16-mal nahezu wortgleich steht. Nach C1 existiert dieser Block ohnehin einmal als Baustein. Der konsequente Schritt wäre, jeden Modell-Prompt in zwei Teile zu zerlegen:

```
FACTS[key]   — maschinenlesbar: maxRefs, Auflösungen, negativePrompts: 'supported'|'ignored'|'none',
               textRendering, glossFilter: boolean, editing: boolean
VOICE[key]   — die modellspezifische Prosa, die wirklich nur für dieses Modell gilt
```

Der Systemprompt wird daraus zusammengesetzt. Zwei Gewinne über die Zeilenzahl hinaus: die Fakten aus dem Dokument werden prüfbar (ein Test kann `negativePrompts: 'ignored'` gegen die Abwesenheit einer Negative-Sektion stellen — B1 wäre damit strukturell unmöglich geworden), und dieselbe Karte kann die UI speisen, etwa als Hinweis „Negative Prompt wird von diesem Modell ignoriert" am Regler.

Kosten: ein Refactor über 27 Prompts, bei dem inhaltlich nichts besser wird. Deshalb bewusst ans Ende und nur, wenn C1–C3 den Bedarf bestätigen.

---

## Reihenfolge

| Phase | Inhalt | Warum hier |
|---|---|---|
| 1 | A1 — parallele Läufe im Playground | Direkt angefragt, sofort spürbar, isoliert |
| 2 | B1, B2, B3, B4 | Kleine, klar begrenzte Korrekturen; B4 räumt vor Teil C auf |
| 3 | C1 — registry-gestützter DEFAULT | Größter Abdeckungsgewinn: 31 Modelle statt zwei deutscher Sätze |
| 4 | C2 + C3 — fehlende Prompts, Korrekturen aus dem Dokument | Baut auf den Bausteinen aus C1 auf |
| 5 | A2 — Visualize entsperren | Braucht das Einfrieren im Sendepfad; eigenes Risiko, eigener Schritt |
| 6 | C4 — Struktur-Refactor | Optional, nach Bedarfsprüfung |

Phase 1 und Phase 2 sind unabhängig voneinander und könnten in beliebiger Reihenfolge laufen. Ab Phase 3 gilt die Reihenfolge strikt.

---

## Teil D — In-Chat-Bildgenerierung mit Intent-Erkennung und Web-Search

### D0. Der überraschende Befund: die Hälfte steht schon und ist tot

Die Marker-basierte In-Chat-Generierung ist bereits gebaut:

- `chat-media-intent.ts` parst `[IMAGE_GEN: …]` und `[MUSIC_GEN: …]` aus der Assistant-Antwort, entfernt die Marker aus dem Text und gibt beides getrennt zurück.
- `chat-media-intent-handler.ts` erzeugt daraus echte Bild-/Musik-Parts, speichert sie über `saveGeneratedAsset` und hängt sie an die Nachricht.
- `ChatProvider.tsx:407` ruft den Handler bei jeder Assistant-Antwort auf.
- Für beides existieren Tests.

Nur: **`IMAGE_GEN` kommt in keinem System-Prompt vor.** Ein `grep` über `src/` findet den String ausschließlich im Parser, im Handler und in deren Tests. Kein Chat-Modell weiß, dass es diesen Marker emittieren darf. Der Handler läuft bei jeder Antwort und findet nie etwas.

Es fehlt also nicht die Mechanik, sondern die Anweisung.

### D1. Stufe 1 — den Marker lehren (klein, sofort wirksam)

In `CHAT_SYSTEM_PROMPT` (und die Response-Style-Varianten in `chat-options.ts`) einen knappen Block aufnehmen, der beschreibt: wann ein Bild angebracht ist, dass der Marker allein in einer eigenen Zeile steht, und dass der Prompt darin englisch und bildhaft formuliert sein muss — das ist derselbe Text, der später durch `/api/enhance-prompt` laufen kann.

Drei Dinge, die dabei schiefgehen können und in die Anweisung gehören:

- Marker in Code-Blöcken oder Zitaten. Der Parser ist ein einfacher Regex-Scan über den Rohtext und unterscheidet das nicht. Entweder der Parser überspringt Fenced Blocks, oder der System-Prompt verbietet den Marker dort ausdrücklich — sauberer ist der Parser, weil er nicht auf Modellfolgsamkeit angewiesen ist.
- Mehrfach-Emission („hier drei Varianten"). Deckelung auf einen Marker pro Antwort, im Handler durchgesetzt, nicht nur im Prompt.
- Ungefragte Bilder. Die Anweisung muss die Schwelle klar setzen: nur bei erkennbarer Bild-Absicht, nicht als Illustration jeder Antwort.

**Verifikation:** Test, der eine Modellantwort mit Marker durch den Handler schickt und den Bild-Part prüft — existiert bereits. Neu: ein Test, dass ein Marker in einem Code-Block **nicht** ausgelöst wird.

### D2. Stufe 2 — Tool-Calling statt Marker (der eigentliche ChatGPT/Gemini-Weg)

Marker sind Textkonvention: sie brauchen keine API-Unterstützung, sind aber ungetypt, können in Prosa auftauchen und geben dem Modell keinen Rückkanal („Bild fertig, hier ist es" → das Modell kann sich nicht darauf beziehen).

Der saubere Weg ist ein Werkzeug `generate_image(prompt, aspect_ratio?)`, das das Modell aufruft, dessen Ergebnis als Tool-Result zurückgeht und über das das Modell dann sprechen kann. Das ist genau das Muster, nach dem sich In-Chat-Generierung bei ChatGPT und Gemini richtig anfühlt: das Bild ist Teil des Gesprächs, kein eingeschobener Anhang.

**Vor jeder Planung zu verifizieren:** ob der Pollinations-Endpunkt, den `pollinations-chat-flow.ts` anspricht, `tools` / `tool_choice` im OpenAI-Format überhaupt annimmt — im Code findet sich davon heute nichts. Falls nicht, bleibt Stufe 1 der einzige Weg, und Stufe 2 wartet auf Upstream-Support. Das ist eine Recherche- und keine Implementierungsaufgabe; ohne dieses Ergebnis ist jede weitere Planung hier Spekulation.

**Modellwahl fürs Bild.** Der Handler nimmt heute `input.selectedImageModelId` — also das, was im Visualize-Picker steht. Das ist eine vernünftige Voreinstellung. Offene Frage für Stufe 2: darf das Tool ein Modell wählen (etwa ein Edit-Modell, wenn ein Referenzbild im Chat hängt)?

**Enhancement-Kopplung.** Ein vom Chat-Modell nebenbei formulierter Prompt ist kein guter Bildprompt. Naheliegend: den Marker-/Tool-Prompt durch `/api/enhance-prompt` mit dem Key des gewählten Bildmodells schicken, bevor generiert wird. Damit zahlt Teil C direkt auf D ein — und die Latenz eines zusätzlichen LLM-Aufrufs muss gegen die Qualität abgewogen werden (Vorschlag: nur, wenn der Marker-Prompt unter ~15 Wörtern liegt).

### D3. Web-Search — was heute passiert und was daran wackelt

Die Kette steht und funktioniert: `chat-search-strategy` entscheidet über `shouldFetchWebContext` und `routedModelId`, `/api/chat/completion:147` holt bei Bedarf über `WebContextService.getContext()` Kontext und injiziert ihn in den System-Prompt. Für explizite Recherche gibt es `getDeepResearchModel()`.

Das Problem sitzt in der Erkennung. `SmartRouter.shouldRouteToSearch` ist eine Liste von rund 90 regulären Ausdrücken, darunter:

```
/\bnow\b/i  /\bshow\b/i  /\bgame\b/i  /\bstatus\b/i  /\bbio\b/i  /\bfilm/i  /\bclub\b/i  /\bmatch\b/i
```

„Show me a matching function now" trifft vier davon. Dagegen steht eine zweite Regex-Liste, `NARRATIVE_SUPPRESSORS`, die Vergangenheitserzählungen wieder ausnimmt — also Regex gegen Regex. Jeder neue Fehlalarm erzeugt Druck, eine weitere Ausnahme anzuhängen; das ist ein Wettrüsten ohne Endzustand, und jeder Fehlalarm kostet eine echte Suchanfrage.

Drei Richtungen, in aufsteigendem Aufwand:

1. **Entschärfen.** Die zu breiten Einzelwörter entfernen oder an einen zweiten Term koppeln (`\bnow\b` nur zusammen mit einem Frage- oder Datenwort). Billig, sofort messbar über einen Tabellentest mit Positiv- und Negativfällen. Empfohlener erster Schritt.
2. **Das Modell entscheiden lassen.** Dieselbe Mechanik wie D2, nur mit `web_search` statt `generate_image`. Löst das Klassifikationsproblem an der einzigen Stelle, die den Kontext des Gesprächs kennt — und hängt an derselben Verifikationsfrage zum Tool-Support.
3. **Sichtbarkeit im Chat.** Heute verschwindet der geholte Kontext unsichtbar im System-Prompt. Quellenangaben unter der Antwort — wie bei den Vorbildern — machen aus einer stillen Injektion eine nachprüfbare Aussage. Unabhängig von 1 und 2 umsetzbar.

### D4. Einordnung in die Reihenfolge

| Phase | Inhalt | Abhängigkeit |
|---|---|---|
| 1b | D1 — Marker lehren, Parser gegen Code-Blöcke härten | keine; die kleinste Änderung mit der größten sichtbaren Wirkung |
| 2b | D3.1 — die zu breiten Search-Regex entschärfen | keine |
| 4b | D2-Vorstufe — Tool-Calling-Support bei Pollinations verifizieren | Recherche, kein Code |
| 6b | D2 / D3.2 — Tools, falls der Support da ist | hängt an 4b; profitiert von Teil C |
| — | D3.3 — Quellen im Chat anzeigen | unabhängig, jederzeit einschiebbar |

D1 ist der Kandidat, der am meisten für den geringsten Aufwand bringt: eine Prompt-Ergänzung plus eine Parser-Härtung schalten eine fertig gebaute, getestete Funktion scharf, die heute nur deshalb nichts tut, weil niemand dem Modell davon erzählt hat.
