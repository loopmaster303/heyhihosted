# P-Video 2 Pro in Create — Implementation Plan

> **For agentic workers:** REQUIRED: Use `subagent-driven-development` to implement this plan. Steps use checkbox syntax. One fresh implementer per task; spec review first, code-quality review second. No implementation before explicit user approval.

**Goal:** P-Video 2 Pro als zusätzliches Pruna-Modell in `/create` anbieten, mit eigenem Parametervertrag und unveränderten bestehenden Modellen.

**Architecture:** Registry, Create-Schema und Pruna-Mapping gezielt ergänzen. Der vorhandene `/api/generate`-Pfad, asynchrone Statusabfragen und lokale Ergebnisverwaltung bleiben zuständig. Pro bekommt eine eigenständige Modell-ID und eigene Controls, weil sein Eingabevertrag von P-Video 2 abweicht.

**Tech Stack:** Next.js 16, React 19, TypeScript, Zod, Jest/Testing Library, vorhandener Pruna-Client.

**Status (2026-09-24):** Aufgaben 1–4 umgesetzt (Aufgabe 1 als `6d35def`, 2–4 im Arbeitsbaum). Automatisch verifiziert: `jest --runInBand` 133/133 Suites, 1205 Tests grün; `npm run typecheck` 0 Fehler; `npm run build` Exit 0; ESLint auf geänderten Dateien 0 Fehler, 1 Warnung (a11y im Dropdown-Mock von `ParamControls.test.tsx`). Abweichung: `PlaygroundShell.tsx` wartet vor der Modell-Fallback-Wahl auf die localStorage-Hydration — ohne das überschreibt der erste Render eine gespeicherte Auswahl; belegt durch den Test „restores a persisted Pro selection … after remount", der ohne Fix rot ist. **Offen:** Live-Abnahme mit eigenem Key (T2V, Start-/Endframe, hörbares Audio) — nicht ausgeführt, nicht bestanden.

**Ursprünglicher Status:** Nur Planung. Keine Produktdateien geändert, keine Tests/Builds oder kostenpflichtigen Generierungen ausgeführt. Der ältere P-Video-2-Plan ist Hintergrund; dessen inzwischen implementierter Code ist die aktuelle Ausgangsbasis. Die im alten Plan genannte DeepSeek-Pflicht wurde durch die neuen Nutzeranweisungen ersetzt und gilt hier nicht.

## Kontext und Produktentscheidung

Offizielle Quelle, geprüft am 2026-09-23: [Pruna P-Video 2 Pro](https://docs.api.pruna.ai/guides/models/p-video-2-pro). Vor Implementierung auf Änderungen prüfen.

### Providervertrag

| Eingabe/Eigenschaft | Vertrag |
|---|---|
| Modell-ID | `p-video-2-pro` |
| Modi | Text-to-Video; erstes/letztes Referenzbild |
| `duration` | Ganzzahl 5–15, Default 5 |
| `resolution` | `480p`, `768p`; Default `768p` |
| `mode` | `speed` (Default), `quality`, `cost` |
| `prompt_upsampler` | `off`, `turbo` (Default), `max`; unabhängig von `mode` |
| `aspect_ratio` | 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 1:1; Default 16:9; Referenzbilder bestimmen die Bildfläche |
| Weitere Eingaben | Pflichtprompt, optionaler Seed, `image`, `last_frame_image` |
| Ausgabe | Feste 24 fps mit generiertem Audio; kein Audio-Input |

Keine automatische Dauer, FPS-Auswahl, Draft-Option, Audio-Schalter oder boolean `prompt_upsampling` aus P-Video 2 übernehmen. Keine undokumentierten Safety-Felder senden. Kein Preisrechner und keine zeitlich begrenzte Rabattwerbung.

### Empfohlener Umfang

- Additives Modell `P-Video 2 Pro`, Provider Pruna, enabled/BYOP-visible, nicht kostenlos. Keine Migration gespeicherter Auswahlen, kein Ersatz und keine Default-Umstellung bestehender Modelle.
- Create zeigt es in t2v und i2v. Bis zu zwei Referenzen in der bestehenden Reihenfolge Start/Ende, `referenceMode: 'start-end-frame'`; kein neuer Last-frame-only-Uploadmodus.
- Bestehende Control-Typen reichen: Sekundenwahl, Enum-Auswahl, Seed-Eingabe. `mode` wird als „Generierungsmodus“ beschriftet; es ist kein neuer Create-Tab. `prompt_upsampler` bleibt eine unabhängige Auswahl.
- Audio-Capability beschreibt vorhandenes Ausgabeaudio, keine Abschaltbarkeit oder Audio-Dateieingabe. Die bestehende Schema-Gruppenüberschrift `Video · 24 fps · mit Ton` benennt diese festen Eigenschaften sichtbar; kein neues Beschreibungssystem erforderlich.
- Detailansicht zeigt neben vorhandenen Werten auch den Generierungsmodus und die Upsampler-Auswahl. Damit sind gespeicherte Resultate und Wiederholungen nachvollziehbar.
- Ausrichtung: vorhandenes Create-Layout und vorhandene Datenflüsse; kein Redesign, keine neue Provider-Schicht.

Alternativen: Ein Alias auf P-Video 2 würde falsche Parameter und gespeicherte Modellidentitäten vermischen. Eine gemeinsame große Video-Abstraktion wäre für einen zusätzlichen, abweichenden Vertrag unnötig. Das eigene Mapping ist die kleinste zuverlässige Erweiterung.

## Reality Check — Blueprint am aktuellen Code geprüft

Geprüft: `AGENTS.md`, Provider-/Create-Regeln in `CLAUDE.md`, P-Video-2-Einträge in den Configs, `model-source.ts`, `param-schema.ts`, `generate-request.ts`, `PlaygroundShell.tsx`, `ParamControls.tsx`, `MetaRail.tsx`, `mode-mapping.ts`, Dauerprüfung in `/api/generate` und Pruna-Client.

1. **P-Video 2 ist bereits implementiert.** Sein Mapper verwendet eine explizite Feldliste; Pro erhält eine eigene Liste. Kein freies `...params` und keine Übernahme der Standardwerte aus Version 2.
2. **Mehrere Registrierungen müssen zusammenpassen.** `PRUNA_MODEL_IDS`, Unified Registry, Unified Model Config, Icon-Zuordnung, Create-Schema-Liste, Schema-Map und Capability-Sets benötigen die neue ID. `buildPollinationsEntries()` entfernt danach die gleichnamige Pruna-ID automatisch.
3. **Die vorhandene Dauerprüfung ist nutzbar.** Die Route prüft bereits Top-Level-Dauer oder numerisches `params.duration` gegen `temporalControl`. Pro setzt seinen eigenen Bereich. Mapper und Route müssen dieselbe Priorität verwenden; kein ungeprüftes Params-Duplikat darf den geprüften Wert überschreiben.
4. **Auto-Dauer bleibt modellgebunden.** `cleanedPVideo2Params()` wird derzeit nur für `p-video-2` aufgerufen. Diese Bedingung nicht auf Pro erweitern. Pro besitzt weder einen Auto-Schalter noch eine entsprechende Upstream-Option.
5. **Upload-Sichtbarkeit ist inzwischen berücksichtigt.** `ParamControls` baut anhand `uploadCount` einen Sichtbarkeitskontext für Bildfelder. Pro kann `showIfNoImage` nutzen; ein Component-Test muss echte `uploadCount`-Änderungen prüfen, nicht nur ein künstliches Params-Bild.
6. **Modellwechsel setzt Schema-Defaults.** `PlaygroundShell` verwendet `defaultsFor()` beim Wechsel; Tests sichern insbesondere den Wechsel von P-Video 2 zu Pro. Reload und Rerun haben separate Restore-/Override-Pfade und müssen die Pro-ID samt Pro-Werten erhalten.
7. **Zwei Bedeutungen von mode.** `PrunaModelMapping.mode = 'async'` steuert Transport. `input.mode` steuert die Provider-Generierung. `PlaygroundMode` steuert t2v/i2v. Diese Werte nicht miteinander vermischen.
8. **Audio ist kein boolescher Input.** `supportsAudio: true` bleibt als Ausgabefähigkeit korrekt; das handgeschriebene Schema darf daraus keinen Audio-Schalter machen. Der Mapper ignoriert generische `audio`-/`save_audio`-Felder.
9. **Vorhandene Infrastruktur genügt.** Keine funktionalen Änderungen an Chat-Hooks, Upload-Routen, Status-Polling oder OutputService vorgesehen. Ein konkreter fehlgeschlagener Regressionstest wäre Anlass für eine eng begrenzte Plananpassung.
10. **768p wird sonst vor Dispatch abgewiesen.** `buildGenerateBody()` hebt Auflösung derzeit auf die oberste Ebene, deren Zod-Enum nur 480p/720p/1080p erlaubt. Für Pro bleibt Auflösung ausschließlich im Pruna-Params-Bag. Die globale/Pollinations-Auflösungsprüfung bleibt unverändert. Ein Test mit dem tatsächlich gebauten Create-Request muss diese Grenze abdecken.

Einfach erklärt: Pro bekommt einen eigenen Eintrag und passende Regler. Die vorhandene Pipeline transportiert und speichert das Video. Das verhindert, dass Einstellungen des normalen P-Video 2 beim neuen Modell ins Leere laufen.

## Subagent-Vertrag

- Umsetzung später nach expliziter Planfreigabe; aktuell nur das Plan-Artefakt erstellen und prüfen.
- Aktuelle Modellkonfiguration erben, keine alte DeepSeek-Bindung aus dem Vorgängerplan übernehmen.
- Pro Aufgabe frischer Implementer mit vollständigem Aufgabentext, Dateibesitz, Vertrag und Akzeptanzkriterien. Danach separater Spec-Reviewer, anschließend Code-Quality-Reviewer. Ein Implementer zur Zeit; keine konkurrierenden Schreibarbeiten.
- Jeder Schreibauftrag enthält: „Du bist nicht allein im Repository. Fremde Änderungen nicht zurücksetzen; vorhandene Änderungen berücksichtigen.“ Reviewer prüfen lesend; der Implementer behebt Befunde. Review wiederholen, bis keine akzeptierten Befunde offen sind.
- Vor Beginn Arbeitsbaum und aktuelle Anweisungen prüfen. Isolierten Branch/Worktree `codex/p-video-2-pro-create` verwenden; prüfen, dass die vorhandene P-Video-2-Integration enthalten ist. Untracked Altplan und Audit-Handoff nicht mitcommitten.
- Vor Änderungen relevante installierte Next.js-Guides unter `node_modules/next/dist/docs/` und betroffene Test-Harnesses lesen. Jest seriell mit `--runInBand`; keine Watcher nötig. Eigene verbleibende Prozesse am Ende stoppen.
- Entwicklungslogs nur dort ergänzen, wo neue Fehlerdiagnostik nötig ist; keine Schlüssel, Authorization-Header, privaten Prompts oder Medien-URLs ausgeben.

## Chunk 1: Umsetzung in vier Aufgaben

### Aufgabe 1 — Registry und eigener Pruna-Mapper

**Dateibesitz:**
- Ändern: `src/config/pruna-models.ts`, `src/config/unified-image-models.ts`, `src/config/unified-model-configs.ts`, `src/config/ui-constants.ts`
- Tests: `src/config/__tests__/pruna-models.test.ts`, `src/config/__tests__/model-invariants.test.ts`

- [ ] Vertragstests für die neue ID und Tabelle oben schreiben. Prüfen: Pruna-Dispatch, eigenes Mapping, enabled/BYOP, Video, maximal zwei Referenzen, Sekundensteuerung, Audio-/Endframe-Capability. Beispiel: `expect(getPrunaModelMapping('p-video-2-pro')?.prunaModel).toBe('p-video-2-pro')`.
- [ ] Mapper-Tests ergänzen: Defaults, jede erlaubte Enum-Auswahl, alle Seitenverhältnisse ohne Bild, Weglassen des Formats mit Bild, Start-/Endbild-Reihenfolge, Seed 0 und fehlender Seed, Top-Level-/Params-Dauer und Priorität bei widersprüchlichen Duplikaten.
- [ ] Negativtest für das gesamte ausgegebene Objekt: kein `fps`, `duration_auto`, `draft`, `save_audio`, `audio`, `prompt_upsampling`, `width`, `height`, `output_format` oder undokumentiertes Safety-Feld; unerwartete Params dürfen auch den Prompt nicht überschreiben.
- [ ] Ausführen und neue Fehler bestätigen: `npm test -- --runInBand src/config/__tests__/pruna-models.test.ts src/config/__tests__/model-invariants.test.ts`.
- [ ] Registry ergänzen: `id: 'p-video-2-pro'`, `name: 'P-Video 2 Pro'`, `provider: 'pruna'`, `kind: 'video'`, `enabled: true`, `isFree: false`, `byopVisible: true`, `supportsReference: true`, `maxImages: 2`, `referenceMode: 'start-end-frame'`, `supportsAudio: true`, `supportsEndFrame: true`, `temporalControl: { mode: 'seconds', min: 5, max: 15, step: 1, defaultSeconds: 5 }`. PrunaIcon ergänzen. Unified Model Config ohne Audio-Schalter anlegen.
- [ ] Eigenes Mapping anlegen: `prunaModel: 'p-video-2-pro'`, Transport `mode: 'async'`, `isVideo: true`. Builder sendet nur Providervertrag-Felder. Fehlende Dauer explizit als Default 5 setzen; ansonsten `f.duration ?? params.duration` verwenden. Seed nur bei Vorhandensein übernehmen. Leeres Bilderarray als „kein Bild“ behandeln.
- [ ] Enumerationen über erlaubte Werte normalisieren; fehlende/ungültige Enum-Werte erhalten die dokumentierten Defaults. Dauer nicht still klemmen: Zahlenbereich über vorhandene Route validieren. Nichtnumerisches `params.duration` muss vor Dispatch als 400 abgewiesen werden, sofern keine gültige vorrangige Top-Level-Dauer existiert (Aufgabe 3).
- [ ] Tests erneut grün ausführen, Spec-Review und Qualitätsreview abschließen, Task-Commit erstellen. Bestehende Modelle nicht an Pro-Erwartungen anpassen.

### Aufgabe 2 — Create-Controls, Auswahl und Details

**Dateibesitz:**
- Ändern: `src/lib/playground/model-source.ts`, `src/lib/playground/param-schema.ts`, `src/lib/playground/generate-request.ts`, `src/components/playground/MetaRail.tsx`
- Tests: `src/lib/playground/model-source.test.ts`, `src/lib/playground/param-schema.test.ts`, `src/lib/playground/generate-request.test.ts`, `src/lib/playground/mode-mapping.test.ts`, `src/components/playground/ParamControls.test.tsx`, `src/components/playground/MetaRail.test.tsx`
- Nur bei konkret nachgewiesenem Defekt ändern: `src/components/playground/ParamControls.tsx`

- [ ] Tests zuerst schreiben: Pro hat eigenes Schema, erscheint in t2v/i2v und im Pruna-Katalog, keine Pollinations-Dopplung; `schemaForEntry` liefert kein generisches Pollinations-Schema.
- [ ] Schema-Test auf vollständige Feldnamen und Defaults schreiben. Sekundenoptionen aus `Array.from({ length: 11 }, (_, i) => i + 5)`; übrige Werte gemäß Vertragstabelle. Abwesenheit der P-Video-2-exklusiven Controls explizit prüfen.
- [ ] Component-Test: `uploadCount` von 0 auf 1/2 und zurück setzen; Seitenverhältnis verschwindet und kehrt zurück. Mode und Upsampler unabhängig auswählbar; keine gegenseitige automatische Änderung. Sichtbare Gruppenüberschrift `Video · 24 fps · mit Ton` prüfen.
- [ ] Request-Test: neue Modell-ID bleibt erhalten, Pro-Parameter kommen im Params-Bag an, Dauer/Seed/Referenzen werden korrekt gehoben, Originalstate bleibt unverändert. Pro benutzt nicht die Auto-Dauer-Bereinigung. Metadaten-Chips für `mode` und `prompt_upsampler` testen, inklusive `off`.
- [ ] Ausführen: `npm test -- --runInBand src/lib/playground/model-source.test.ts src/lib/playground/param-schema.test.ts src/lib/playground/generate-request.test.ts src/lib/playground/mode-mapping.test.ts src/components/playground/ParamControls.test.tsx src/components/playground/MetaRail.test.tsx`. Neue Fälle müssen vor Implementierung fehlschlagen.
- [ ] Neues `pVideo2ProSchema` mit bestehenden Feldtypen und Gruppenüberschrift `Video · 24 fps · mit Ton` anlegen, in `PLAYGROUND_PRUNA_IDS` und `SCHEMA_MAP` aufnehmen. Capability-Sets um die ID ergänzen. `aspect_ratio` nutzt `showIfNoImage`; keine globale Schema-Abstraktion nötig.
- [ ] In `buildGenerateBody()` für die exakte ID `p-video-2-pro` das Hochheben von `params.resolution` nach `body.resolution` auslassen. Beide Pro-Auflösungen bleiben im Params-Bag. Request-Test explizit auf `params.resolution === '768p'` und fehlendes Top-Level-`resolution` prüfen; andere Modelle behalten ihren bisherigen Request.
- [ ] `MetaRail` um beschriftete Chips für die beiden neuen Enum-Felder ergänzen. Bestehende Behandlung von Dauer/Auflösung/Seed erhalten; keine kostenbezogenen Aussagen erfinden.
- [ ] Testlauf grün bekommen, Spec-/Qualitätsreview und Task-Commit abschließen.

### Aufgabe 3 — API-Vertrag und Prompt-Enhancement

**Dateibesitz:**
- Ändern: `src/config/enhancement-prompts.ts`, `src/app/api/generate/route.ts`
- Tests: `src/app/api/enhance-prompt/route.test.ts`, `src/app/api/generate/route.test.ts`, `src/lib/pruna/client.test.ts`

- [ ] API-Tests zuerst: Grenzen der Pro-Dauer akzeptieren; 0, 4, 15.5, 16 und 20 ablehnen. Sowohl Top-Level als auch Params-only testen; fehlend ergibt Mapper-Default. Nichtnumerische Params-Dauer ohne gültige vorrangige Top-Level-Dauer muss vor Upstream mit 400 scheitern.
- [ ] Gültige Top-Level-Dauer gewinnt gegenüber abweichendem Params-Duplikat. Alte Auto-Dauer-Flags dürfen keine Pro-Auto-Semantik aktivieren. Ein gültiger direkter API-Aufruf benötigt keinen Create-State.
- [ ] Tests für fehlenden effektiven Pruna-Key (Request und Server-Fallback fehlen), Referenzlimit, asynchrones 202 mit Pro-Modell-ID und Upstream-Fehler ergänzen; niemals auf Pollinations oder ein anderes Modell ausweichen.
- [ ] Client-Test mit realem Mapping und gemocktem Fetch: `Model: p-video-2-pro`, Transport ohne `Try-Sync`, `input.mode` bleibt von Transport unabhängig, exakter Input enthält ausschließlich Vertrag-Felder. Fehler-/Statuspfad mit vorhandener Harness abdecken.
- [ ] Route-Integrationstest mit realem `buildGenerateBody()` und `defaultsFor(schemaFor('p-video-2-pro'))`: der Default-Request passiert Zod und erreicht Pruna mit `params.resolution: '768p'`. Zusammen mit dem Client-Test ist die vollständige Auflösungskette belegt. Die globale Top-Level-Auflösungsenum und Pollinations-Typen nicht erweitern; API-Aufrufer verwenden für Pro `params.resolution`.
- [ ] Enhancement-Test ergänzen: Pro bekommt bestehende Video-/Bewegungsrichtlinien statt generischer Bildrichtlinien. Im zentralen `MODEL_ALIASES` nur für Enhancement `'p-video-2-pro': 'p-video'` eintragen. Dieser Alias gilt niemals für Generierung oder gespeicherte Assets.
- [ ] Ausführen: `npm test -- --runInBand src/app/api/enhance-prompt/route.test.ts src/app/api/generate/route.test.ts src/lib/pruna/client.test.ts`. Neue Fehler vor Implementierung nachvollziehen.
- [ ] In `/api/generate` die beschriebene Typprüfung für Params-only-Dauer gezielt für Pro ergänzen; Bereichsprüfung über bestehendes `temporalControl` wiederverwenden. Keinen allgemeinen Route-Refactor starten.
- [ ] Tests grün ausführen, Spec-/Qualitätsreview und Task-Commit abschließen.

### Aufgabe 4 — Integration und Gesamtprüfung

**Dateibesitz:**
- Tests: `src/app/create/PlaygroundShell.test.tsx`
- Dieses Plandokument: Status und konkrete Prüfnachweise
- Nur bei durch Tests belegter Integrationslücke ändern: `src/app/create/PlaygroundShell.tsx`; eng begrenzte Abweichung dokumentieren.

- [ ] Shell-Tests ergänzen: Wechsel P-Video 2 → Pro lädt Pro-Defaults und entfernt inkompatible Controls. Reload erhält gültige Pro-Auswahl und Werte. Pro-Ergebnis wird als Video mit originaler Modell-ID und Parametern gespeichert.
- [ ] Retry-Test mit nachträglich verändertem Composer: eingefrorener Pro-Request wird wiederholt, inklusive Mode/Upsampler. Bestehenden Resume-Test um Pro erweitern, soweit Harness vorhanden; kein Neudispatch bei Wiederaufnahme.
- [ ] Ausführen: `npm test -- --runInBand src/app/create/PlaygroundShell.test.tsx src/hooks/useUnifiedImageToolState.test.tsx`. Neue Fälle vor eventueller Korrektur prüfen; Chat bleibt Pollinations-Bild-only.
- [ ] Alle in Aufgaben 1–4 benannten Testdateien in einem seriellen Jest-Lauf zusammen prüfen. Danach nacheinander `npm run typecheck`, ESLint gezielt für geänderte TS/TSX-Dateien und `npm run build`. Erwartung jeweils Exit 0; vorhandene Baseline-Fehler getrennt dokumentieren und nicht als Erfolg werten.
- [ ] Spec-/Qualitätsreview dieser Aufgabe, anschließend finales integriertes Review über den Gesamtdiff durchführen. Besonders prüfen: Provideridentität, zwei Bedeutungen von mode, Audio-Ausgabe ohne Schalter, Referenzreihenfolge, Params-Whitelist, keine Änderungen des P-Video-2-Verhaltens.
- [ ] Manuelle Live-Abnahme für späteren Operator festhalten: ein kurzer T2V- und ein Start-/Endframe-Lauf mit eigenem Key, alternative Einstellungen aus dem Vertrag, Gallery/Details/Download, hörbares Ausgabeaudio. Kostenpflichtige Generierungen nicht allein für das Schreiben/Review dieses Plans ausführen. Nicht ausgeführte Live-Abnahme ausdrücklich offen lassen; keine Behauptung allein aufgrund von Mocks.
- [ ] Eigene Prozesse schließen, Status im Plan aktualisieren und Änderungen/Tests/Restpunkte zusammenfassen. Kein automatischer Merge oder Deploy.

## Definition of Done

- Pro erscheint als eigenes Pruna-Modell in Create und verwendet die tatsächlich gewählte Modell-ID durchgängig bis zur Speicherung und Wiederholung.
- Controls und Upstream-Payload entsprechen dem Providervertrag; fremde und veraltete Parameter verlassen den Mapper nicht.
- Registry-, UI-, API-, Client- und Shell-Tests belegen die Integration und Regressionen. Spec-/Qualitätsreviews, Typecheck und Build sind mit Ergebnissen dokumentiert.
- Live-Abnahme und automatische Verifikation werden getrennt ausgewiesen. Offene Live-Prüfung wird nicht als bestanden markiert.
- P-Video, P-Video 2, WAN, Pollinations und Chat werden nicht funktional umgestellt.

## Planprüfung und Freigabe

Architekturvergleich und unabhängiges Subagent-Planreview am 2026-09-23 abgeschlossen. Erstes Review fand zwei Lücken: Top-Level-768p scheitert an Zod; der versprochene sichtbare Audio/FPS-Hinweis hatte keinen Umsetzungsschritt. Beide sind oben mit konkreten Dateien und Tests berücksichtigt. Zweites Review: **Approved**, keine weiteren blockierenden Planlücken. Dies ist eine Freigabe der Planqualität, keine Nutzerfreigabe zur Umsetzung. Keine Produkt-Tests oder Builds ausgeführt.

Für Phase 4 gilt [AGENTS.md](../../../AGENTS.md): „MUST STOP and wait for explicit user confirmation … BEFORE starting Phase 4.“ Dieser Auftrag erstellt den Plan für später und ist keine Implementierungsfreigabe.
