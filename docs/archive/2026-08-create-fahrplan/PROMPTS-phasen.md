# Start-Prompts für die Phasen-Sessions

**Datum:** 2026-08-27
**Zweck:** Je ein eigenständiger Auftrag pro Phase, zum Kopieren in eine neue Session.
Jede Session schreibt **nur den Implementierungsplan** ihrer Phase, keinen Code.

Phase 10 ist zurückgestellt und braucht keinen Plan — deshalb zehn Prompts für Phase 0 bis 9.

**Wichtig beim parallelen Start:** Phase 0 ist zum Zeitpunkt der Planung noch nicht
abgeschlossen. Alle Sessions planen gegen `f880389` **plus** einen offenen Arbeitsbaum.
Jeder Prompt sagt der Session, dass sie das prüfen und als Annahme benennen muss.

---

## Phase 0 — Arbeitsbaum konsolidieren

```
Du schreibst einen Implementierungsplan für Phase 0 des Create-Fahrplans in ~/heyhihosted.
KEIN Code, keine Änderungen am Produktivcode — nur der Plan.

Lies zuerst, in dieser Reihenfolge:
1. AGENTS.md — der 4-Phasen-Workflow. Du lieferst Phase 1 bis 3 und stoppst dort.
2. HANDOFF.md — aktueller Repo-Stand.
3. docs/HANDOFF-2026-08-27-fahrplan.md — vollständig lesen. Für dich zentral:
   Abschnitt 5.1 (Arbeitsbaum nach Herkunft sortiert) und Abschnitt 6, Phase 0.
4. docs/HANDOFF-2026-08-26-pruna-video.md — beschreibt die erste Gruppe der
   offenen Änderungen im Detail, mit Begründung je Datei.
5. docs/FAHRPLAN-create.md — Phase 0.
6. CLAUDE.md — Laufzeitwahrheit. Achtung: die Modell-Listen sind veraltet, die Warnung dort
   erklärt es.

Dein Auftrag: Ein Plan, wie der Arbeitsbaum in getrennte, nachvollziehbare Commits überführt
und der Stand live verifiziert wird.

Zustand: 65 geänderte und rund 20 neue Dateien, uncommitted, aus mindestens zwei Sitzungen.
Verschaffe dir mit `git status` und `git diff` selbst ein Bild — die Zuordnung in Abschnitt 5.1
des Handoffs ist dein Ausgangspunkt, aber sie ist von außen erstellt und kann Lücken haben.

Fallen, die du berücksichtigen musst:
- Die zweite Gruppe (Chat-Input-Umbau, Settings-Umzug, ASCII, Rate-Limit, Features-Flag)
  löscht Komponenten und verschiebt Module, ohne dass ein Handoff die Absicht festhält.
  Sie darf nicht als Block durchgewinkt werden. Für jede Löschung: absichtlich oder halber
  Umbau? Wo du es nicht entscheiden kannst, frag mich.
- Der Handoff vom 2026-08-26 warnt ausdrücklich davor, den Baum als Ganzes zu committen.
- Die Live-Verifikation gehört in diese Phase, nicht in eine spätere: Intent-Erkennung im
  Chat, Chat ohne Compose, das Pollen-Key-Feld, ein echter Pruna-Videolauf über das
  202-Protokoll.
- Pruna hat keinen Cancel-Endpunkt, jeder gültige Payload kostet Geld. Zum Prüfen der
  Validierung eine unerreichbare Medien-URL mitschicken (https://invalid.invalid/x.jpg).
- Die vier Doks CLAUDE.md, README.md, HANDOFF.md, docs/README.md wurden am 2026-08-27
  aktualisiert und liegen ebenfalls uncommitted im Baum. Sie gehören in einen eigenen
  docs-Commit.

Der Plan gehört nach docs/PLAN-phase-0-arbeitsbaum.md und muss
enthalten:
- Ziel in einem Satz und die Fertig-Kriterien aus dem Fahrplan, übersetzt in prüfbare Schritte
- Eine vollständige Commit-Aufteilung: welche Datei in welchen Commit, mit Begründung
- Für jede gelöschte Datei: Befund und Empfehlung
- Reihenfolge der Schritte, jeder mit seiner Verifikation
- Reality Check nach AGENTS.md Phase 3
- Testplan: welcher Commit welche Suiten berührt
- Was ausdrücklich NICHT Teil dieser Phase ist

Regeln:
- Nichts implementieren, nicht committen, nicht pushen.
- Was du nicht sicher weißt, gegen den laufenden Dev-Server oder die echte API prüfen, nicht
  aus dem Code raten. Das ist die durchgehende Lehre der August-Sitzungen.
- Offene Entscheidungen als Rückfrage an mich formulieren, nicht selbst wählen.
- Andere Phasen werden parallel in eigenen Sessions geplant. Deine Phase ist die einzige, die
  den gesamten Baum betrifft — das ist so gewollt.
```

---

## Phase 1 — Launch-Kriterien festschreiben

```
Du schreibst einen Implementierungsplan für Phase 1 des Create-Fahrplans in ~/heyhihosted.
KEIN Code, keine Änderungen am Produktivcode — nur der Plan.

Lies zuerst, in dieser Reihenfolge:
1. AGENTS.md — der 4-Phasen-Workflow. Du lieferst Phase 1 bis 3 und stoppst dort.
2. HANDOFF.md — aktueller Repo-Stand.
3. docs/HANDOFF-2026-08-27-fahrplan.md — vollständig. Für dich zentral:
   Abschnitt 3 (Entscheidungen des Nutzers), Abschnitt 6 Phase 1, Abschnitt 7 (was ungeprüft
   blieb).
4. docs/FAHRPLAN-create.md — der ganze Fahrplan, alle Phasen.
5. docs/PRODUCT_IDENTITY.md, docs/PRODUCT_AUDIT_2026-04-21.md,
   docs/PRODUCT_AUDIT_FOLLOWUP_2026-04-21.md — Produktversprechen und offener Rückstand.
6. CLAUDE.md — Laufzeitwahrheit. Achtung: die Modell-Listen sind veraltet.

Dein Auftrag: Ein Plan für docs/LAUNCH_CRITERIA.md — die interne Definition of Done. Was muss
laufen, damit die Adresse öffentlich geteilt werden kann.

Anforderungen an das Zieldokument:
- Pro Kriterium ein prüfbarer Satz. Keine Absichtserklärungen, keine Adjektive ohne Messpunkt.
- Jede Phase 2 bis 9 muss sich mindestens einem Kriterium zuordnen lassen. Wenn eine Phase
  keinem zuzuordnen ist, ist das ein Befund — melde ihn.
- Ausdrücklich festhalten, was NICHT zum Launch gehört. Phase 10 gehört dort hinein.
- Kriterien müssen auch Dinge abdecken, die in keiner Phase stehen, aber einen öffentlichen
  Start blockieren würden: Datenschutz-Aussage, Verhalten ohne Schlüssel, Fehlerverhalten bei
  ausgefallenem Anbieter, Kostenrisiko durch Pruna-Läufe ohne Cancel-Endpunkt.

Fallen:
- CLAUDE.md sagt unter "Cleanup Rules": keine neuen Wahrheitsdokumente erfinden, wo bestehende
  reichen. Die Launch-Kriterien sind eine echte Lücke, deshalb ist eine neue Datei hier
  gerechtfertigt — begründe das im Plan.
- Der Systemprompt in src/config/chat-options.ts enthält laut CLAUDE.md "Burn the Corpos" und
  Filter-Evasion-Passagen. Für einen öffentlichen Start ist das eine Entscheidung, die noch
  niemand getroffen hat. Nimm sie als offene Frage auf, entscheide sie nicht.
- Die BYOP-Keys liegen in Web-Storage und sind XSS-empfindlich. Dokumentiert, akzeptiert,
  ungelöst. Gehört als bewusste Entscheidung in die Kriterien.

Der Plan gehört nach docs/PLAN-phase-1-launch-kriterien.md und muss enthalten:
- Ziel in einem Satz
- Gliederung des Zieldokuments mit Beispielformulierungen für je ein Kriterium pro Bereich
- Zuordnungstabelle Phase → Kriterium
- Liste der Kriterien, die aus keiner Phase kommen, mit Begründung
- Reality Check nach AGENTS.md Phase 3
- Offene Fragen an mich
- Was ausdrücklich NICHT Teil dieser Phase ist

Regeln:
- Nichts implementieren, nicht committen, nicht pushen.
- Offene Entscheidungen als Rückfrage an mich formulieren, nicht selbst wählen.
- Phase 0 ist vermutlich noch nicht abgeschlossen; der Arbeitsbaum ist offen. Für diese Phase
  unkritisch, aber benenne die Annahme.
```

---

## Phase 2 — Create-Identität

```
Du schreibst einen Implementierungsplan für Phase 2 des Create-Fahrplans in ~/heyhihosted.
KEIN Code, keine Änderungen am Produktivcode — nur der Plan.

Lies zuerst, in dieser Reihenfolge:
1. AGENTS.md — der 4-Phasen-Workflow. Du lieferst Phase 1 bis 3 und stoppst dort.
2. HANDOFF.md — aktueller Repo-Stand.
3. docs/HANDOFF-2026-08-27-fahrplan.md — vollständig. Für dich zentral:
   Abschnitt 3 (Domain-Entscheidung) und Abschnitt 6, Phase 2, mit den Wegweisern.
4. docs/FAHRPLAN-create.md — Phase 2.
5. CLAUDE.md — besonders den Playground-Abschnitt.

Dein Auftrag: Ein Plan, wie der Playground in der Oberfläche zu "Create" wird, unter
create.hey-hi.cloud erreichbar ist, und Chat und Create in beide Richtungen navigierbar werden.

Einstiegspunkte, verifiziert am 2026-08-27:
- Beschriftungen: src/config/translations.ts. Die playground.*-Schlüssel liegen ZWEIMAL in der
  Datei, einmal je Sprache (Zeilen 56–62 und 318–324). Wer nur eine Stelle ändert, übersetzt
  halb.
- Route: src/app/playground/page.tsx, Shell: src/app/playground/PlaygroundShell.tsx
- Weiterleitung: next.config.ts hat heute KEINEN rewrites- oder redirects-Hook, nur headers,
  turbopack, allowedDevOrigins und images. Der Hook muss neu entstehen.
- Navigation hin: src/components/layout/AppSidebar.tsx:122
- Navigation zurück: existiert nicht. PlaygroundShell.tsx enthält kein navigateTo, kein href,
  kein router.push.
- Doks: README.md, CLAUDE.md, AGENTS.md, GEMINI.md, HANDOFF.md, src/app/about/page.tsx,
  docs/README.md

Entscheidung des Nutzers, verbindlich: create.hey-hi.cloud läuft auf DEMSELBEN Vercel-Projekt
mit Rewrite von / auf /playground. chat.hey-hi.cloud bleibt der Chat. Kein zweites Deployment —
beide Adressen müssen denselben Browser-Ursprung teilen, sonst wäre die gemeinsame
IndexedDB-Galerie aus Phase 5 unmöglich.

Fallen:
- Die Live-Domain heißt hey-hi.cloud MIT Bindestrich. Der Nutzer hat sie mehrfach ohne
  geschrieben. Prüfe, was tatsächlich registriert ist, bevor du planst — und wenn du es nicht
  prüfen kannst, mach es zur Rückfrage.
- src/components/playground/ und src/lib/playground/ umzubenennen ist NICHT Teil des Ziels.
  Gewollt ist die sichtbare Beschriftung. Eine Verzeichnisumbenennung würde alle parallel
  laufenden Phasen mit Konflikten überziehen.
- t('playground.prunaEmpty') nennt eine feste Zahl ("14 Pruna models"), die nicht aus der
  Registry kommt. Fällt beim Anfassen auf, gehört sachlich in Phase 3 — nimm es als Befund auf,
  löse es nicht hier.
- Die Domain selbst wird im Vercel-Projekt hinterlegt, nicht im Repo. Trenne im Plan, was Code
  ist und was ich im Vercel-Dashboard tun muss.

Der Plan gehört nach docs/PLAN-phase-2-create-identitaet.md und muss enthalten:
- Ziel in einem Satz und die Fertig-Kriterien aus dem Fahrplan, in prüfbare Schritte übersetzt
- Component Mapping: jede Datei, die angelegt, geändert oder gelöscht wird, mit Begründung
- Getrennt davon: die Schritte im Vercel-Dashboard
- Reihenfolge der Schritte, jeder mit seiner Verifikation
- Reality Check nach AGENTS.md Phase 3
- Testplan: welche bestehenden Tests betroffen sind
- Was ausdrücklich NICHT Teil dieser Phase ist

Regeln:
- Nichts implementieren, nicht committen, nicht pushen.
- Offene Entscheidungen als Rückfrage an mich formulieren.
- Phase 0 ist vermutlich noch nicht abgeschlossen. Prüfe mit git status, ob deine Dateien im
  offenen Arbeitsbaum liegen, und benenne die Annahme.
```

---

## Phase 3 — Modellwahrheit gegen die Live-Registry

```
Du schreibst einen Implementierungsplan für Phase 3 des Create-Fahrplans in ~/heyhihosted.
KEIN Code, keine Änderungen am Produktivcode — nur der Plan.

Lies zuerst, in dieser Reihenfolge:
1. AGENTS.md — der 4-Phasen-Workflow. Du lieferst Phase 1 bis 3 und stoppst dort.
2. HANDOFF.md — aktueller Repo-Stand, inklusive der Drift-Warnung.
3. docs/HANDOFF-2026-08-27-fahrplan.md — vollständig. Für dich zentral:
   Abschnitt 4 (der komplette Registry-Befund) und Abschnitt 6, Phase 3.
4. docs/FAHRPLAN-create.md — Phase 3.
5. CLAUDE.md — die Warnung unter "Current Runtime Truth" ist dein Ausgangspunkt.
6. docs/pollinations-api-audit-2026-06-01.md und docs/pollinations-deep-audit-2026-06-27.md —
   Vorbild für die Arbeitsweise eines solchen Abgleichs.

Dein Auftrag: Ein Plan, wie die Modell-Listen des Repos wieder mit der Wirklichkeit
übereinstimmen. Kein angebotenes Modell darf mit "unbekannt" antworten, kein als kostenlos
markiertes Modell darf einen Schlüssel verlangen.

Diese Phase ist der zweite Flaschenhals des Fahrplans: Phase 4, 7 und 8 hängen an ihr.

Zieh die Registry selbst, verlass dich nicht auf den Befund im Handoff — er ist vom
2026-08-27 und kann sich bewegt haben:
  curl -s https://gen.pollinations.ai/image/models
  curl -s https://gen.pollinations.ai/audio/models
  curl -s https://gen.pollinations.ai/text/models

Bekannter Stand (2026-08-27, zur Gegenprobe):
- acestep existiert nicht mehr; ALLE Pollinations-Modelle mit Text→Audio sind paid_only
- qwen-image, grok-imagine, ideogram-v4-turbo sind schlüsselpflichtig, im Repo als frei geführt
- gpt-image, wan-image-small, ltx-2 existieren nicht mehr
- frei und nicht geführt: dreamshaper, nova-canvas, nova-reel (Video)
- 35 kostenlose zu 39 schlüsselpflichtigen Einträgen

Einstiegspunkte:
- src/config/unified-image-models.ts — Flags enabled / isFree / byopVisible,
  Sichtbarkeitslogik in isVisibleVisualModel() ab Zeile 500
- src/config/chat-options.ts — VISIBLE_POLLINATIONS_MODEL_IDS, AVAILABLE_COMPOSE_MODELS ab Z. 40
- src/config/pruna-models.ts
- src/lib/pollinations-registry.ts — serverseitiger Registry-Zugriff mit 60s-Cache
- src/lib/playground/model-source.ts — Modellliste des Playgrounds
- src/lib/playground/pollinations-caps.ts — was die Registry nicht liefert
- src/config/enhancement-prompts.ts — die EINZIGE Alias-Tabelle

Offene Fragen, die diese Phase entscheiden muss und die noch niemand beantwortet hat:
- Die Registry führt Modelle mit Namensraum (vendouple/…, MarcosFRG/…, chigwell/…). Die
  Konfiguration kennt dieses Muster nicht. Aufnehmen, ignorieren, oder hinter einen Schalter?
- p-image, p-image-edit und p-video erscheinen jetzt AUCH bei Pollinations. Bisher galten sie
  als reine Pruna-Familie. Was heißt das für die Provider-Trennung, die CLAUDE.md beschreibt?
- Lohnt ein wiederkehrender automatischer Abgleich statt Handpflege?
Diese drei sind Rückfragen an mich, keine Punkte, die du still entscheidest.

Fallen:
- model-source.ts hat schon einmal enabled nicht gelesen und abgeschaltete Pruna-Modelle
  weiter angezeigt (gefixt am 2026-08-26). Prüfe, ob alle drei Flags überall greifen.
- VACE ist bewusst abgeschaltet, nicht gelöscht. Nicht versehentlich reaktivieren.
- Wer Modelle entfernt, muss die Alias-Tabelle in enhancement-prompts.ts mitziehen, sonst
  fällt die Prompt-Verbesserung still auf den Standard zurück. Die Auflösungsreihenfolge steht
  in CLAUDE.md unter "Prompt Enhancement" — die Reihenfolge ist dort begründet.
- Die Pruna-Registry wurde am 2026-08-27 NICHT geprüft. Ob docs.api.pruna.ai inzwischen von
  src/config/pruna-models.ts abweicht, ist offen und gehört in diese Phase.
- nova-reel (kostenloses Video) wurde gefunden, aber nicht auf Brauchbarkeit geprüft.

Der Plan gehört nach docs/PLAN-phase-3-modellwahrheit.md und muss enthalten:
- Ziel in einem Satz und die Fertig-Kriterien, in prüfbare Schritte übersetzt
- Eine vollständige Abgleichstabelle: Modell → Zustand im Code → Zustand live → Maßnahme
- Component Mapping mit Begründung je Datei
- Die drei offenen Fragen oben, als Entscheidungsvorlage mit Empfehlung formuliert
- Reality Check nach AGENTS.md Phase 3
- Testplan: model-invariants.test.ts, pruna-models.test.ts, model-source.test.ts und was sonst
  betroffen ist
- Wie CLAUDE.md und README.md nachgezogen werden — die Drift-Warnungen dort müssen am Ende
  verschwinden, nicht stehenbleiben
- Was ausdrücklich NICHT Teil dieser Phase ist

Regeln:
- Nichts implementieren, nicht committen, nicht pushen.
- Modellfragen immer gegen die Live-Registry, nie gegen die Doku oder den Code.
- Offene Entscheidungen als Rückfrage an mich formulieren.
- Phase 0 ist vermutlich noch nicht abgeschlossen. Prüfe mit git status, ob deine Dateien im
  offenen Arbeitsbaum liegen — src/config/unified-image-models.ts und
  src/lib/playground/model-source.ts sind es mit hoher Wahrscheinlichkeit.
```

---

## Phase 4 — Fehlerklarheit und Laufstabilität

```
Du schreibst einen Implementierungsplan für Phase 4 des Create-Fahrplans in ~/heyhihosted.
KEIN Code, keine Änderungen am Produktivcode — nur der Plan.

Lies zuerst, in dieser Reihenfolge:
1. AGENTS.md — der 4-Phasen-Workflow. Du lieferst Phase 1 bis 3 und stoppst dort.
2. HANDOFF.md — aktueller Repo-Stand.
3. docs/HANDOFF-2026-08-26-pruna-video.md — vollständig. Der Abschnitt "Offen"
   listet die sieben Altlasten, die diese Phase schließt.
4. docs/HANDOFF-2026-08-27-fahrplan.md — Abschnitt 5.3 und Abschnitt 6, Phase 4.
5. docs/FAHRPLAN-create.md — Phase 4.
6. CLAUDE.md — besonders den Abschnitt "Long runs answer 202, the browser polls".

Dein Auftrag: Ein Plan, damit jeder Fehlerpfad in einem Satz endet, der sagt was passiert ist
und was zu tun ist. Dazu die Laufstabilität bei langen Generierungen.

Der Nutzer beschreibt es so: "fehlermeldungen müssen viel klarer und einfacher gefeedbacked
werden, oft steht nur Fehler da."

Einstiegspunkte, verifiziert am 2026-08-27:
- Das Fehlergerüst existiert bereits in src/app/playground/PlaygroundShell.tsx: messageFrom()
  ab Zeile 63 packt { error } aus der Route aus, setError ab Zeile 89, Anzeige als schließbare
  Meldung ab Zeile 439, fehlgeschlagene Läufe tragen ihre Meldung selbst (Zeile 259).
  Was fehlt, ist nicht das Gerüst, sondern die Übersetzung der Fehlerklassen.
- Pollen-Zustand: src/hooks/usePollenKey.ts, Anzeige in
  src/components/settings/SettingsPopover.tsx
- Laufüberleben: src/lib/generation/request-generation.ts hält die predictionId nur im
  Speicher. src/lib/safe-storage.ts ist der bestehende, Safari-gehärtete Wrapper.
- vercel.json enthält {} — kein maxDuration.

Die sieben Altlasten:
1. 403 auf /api/pollen/account ungeklärt. Der Endpunkt selbst funktioniert; der 403 gilt dem
   Schlüssel im Browser. Nächster Schritt laut Handoff: Seite neu laden und die Konsolenzeile
   "[BYOP] Failed to fetch account info:" lesen — sie nennt seit dem 2026-08-26 den Grund.
2. normalizePollenKey prüft nur erlaubte Zeichen, kein Präfix.
3. Die Statuslampe hängt am Vorhandensein, nicht an der Gültigkeit des Schlüssels. Ein dritter
   Zustand fehlt: Schlüssel da, Konto nicht abrufbar. Ohne den wird jeder Netzwerkhänger als
   Trennung gedeutet.
4. Ein Reload während der Generierung verliert den Lauf.
5. Keine Fortschrittsanzeige bei 6–12-Minuten-Läufen. Pruna liefert nur starting/processing/
   succeeded, keinen Prozentwert. Verstrichene Zeit ist das Machbare.
6. CLAUDE.md kennt das 202-Protokoll inzwischen (am 2026-08-27 ergänzt) — prüfe, ob die
   Beschreibung dort noch stimmt, und zieh sie nach, falls du etwas änderst.
7. vercel.json ohne maxDuration.

Fallen:
- Diese Phase gehört NACH Phase 3. Ein großer Teil der heutigen Fehlermeldungen entsteht
  daraus, dass ein Modell falsch beschrieben ist — ein als kostenlos angebotenes Modell, das
  einen Schlüssel verlangt, antwortet 401 und landet als "Fehler" in der UI. Vorher würdest du
  Symptome umformulieren. Benenne die Abhängigkeit im Plan.
- Pruna hat keinen Cancel-Endpunkt. Jeder gültige Payload startet einen kostenpflichtigen Lauf.
  Zum Prüfen der Validierung eine unerreichbare Medien-URL mitschicken
  (https://invalid.invalid/x.jpg). Beim Messen am 2026-08-26 sind so echte Kosten entstanden,
  bevor der Trick gefunden war.
- Die Fehlerklassen unterscheiden sich je Anbieter: Pruna antwortet 400 mit
  "additional properties forbidden, found <feld>", Pollinations mit 401/402. Eine gemeinsame
  Übersetzungsschicht ist verlockend — prüfe im Reality Check, ob sie nicht mehr verdeckt als
  sie hilft.

Der Plan gehört nach docs/PLAN-phase-4-fehlerklarheit.md und muss enthalten:
- Ziel in einem Satz und die Fertig-Kriterien, in prüfbare Schritte übersetzt
- Eine Tabelle: Fehlerfall → heutige Anzeige → gewünschte Anzeige → Fundort
- Component Mapping mit Begründung je Datei
- Getrennter Abschnitt für die Laufstabilität (predictionId, verstrichene Zeit, maxDuration)
- Reality Check nach AGENTS.md Phase 3
- Testplan
- Was ausdrücklich NICHT Teil dieser Phase ist

Regeln:
- Nichts implementieren, nicht committen, nicht pushen.
- Fehlerursachen gegen den laufenden Server prüfen, nicht aus dem Code herleiten. Die fünf
  Live-Bugs im Redesign-Handoff hatten alle dasselbe Muster: eine Annahme über eine
  Schnittstelle, die nie gegen die echte Schnittstelle geprüft wurde.
- Offene Entscheidungen als Rückfrage an mich formulieren.
- Phase 0 ist vermutlich noch nicht abgeschlossen; PlaygroundShell.tsx und usePollenKey.ts
  liegen mit hoher Wahrscheinlichkeit im offenen Arbeitsbaum.
```

---

## Phase 5 — Eine Galerie

```
Du schreibst einen Implementierungsplan für Phase 5 des Create-Fahrplans in ~/heyhihosted.
KEIN Code, keine Änderungen am Produktivcode — nur der Plan.

Lies zuerst, in dieser Reihenfolge:
1. AGENTS.md — der 4-Phasen-Workflow. Du lieferst Phase 1 bis 3 und stoppst dort.
2. HANDOFF.md — aktueller Repo-Stand.
3. docs/HANDOFF-2026-08-27-fahrplan.md — Abschnitt 3 (Galerie-Entscheidung) und
   Abschnitt 6, Phase 5, mit den Wegweisern.
4. docs/FAHRPLAN-create.md — Phase 5.
5. CLAUDE.md — Abschnitt "Asset Persistence".
6. docs/blob-manager.md und docs/asset-fallback-service.md.

Dein Auftrag: Ein Plan für einen gemeinsamen Asset-Pool von Chat und Create, plus Löschen im
Create.

Entscheidung des Nutzers, verbindlich: EIN Pool. Die Herkunft wird vom Trennkriterium zum Tag.
Jede Oberfläche filtert standardmäßig auf ihre eigene Herkunft, umschaltbar. /gallery zeigt
weiterhin alles.

Die Lage ist besser als sie klingt — verifiziert am 2026-08-27:
- Beide Oberflächen schreiben längst in dieselbe Dexie-Tabelle.
- Getrennt wird nur über PLAYGROUND_CONVERSATION_ID ('__playground__') aus
  src/lib/playground/constants.ts, und zwar an genau DREI Stellen:
    src/app/playground/PlaygroundShell.tsx:231  — schreibt das Tag
    src/components/playground/Gallery.tsx:185   — liest nur dieses Tag
    src/hooks/useGalleryAssets.ts:13            — schließt genau dieses Tag aus der Chat-Galerie aus
- Löschen existiert bereits: DatabaseService.deleteAsset(id) in
  src/lib/services/database.ts:179. Der Blob liegt im Asset-Record selbst
  (src/lib/services/output-service.ts:111), ein Löschen entfernt also beides.
- Die Vault-Seite src/app/gallery/page.tsx hat schon einen Löschknopf (Zeile 248) — Vorbild
  für Bestätigung und Verhalten.
- Detailleiste des Create: src/components/playground/MetaRail.tsx — kennt onLoad, onRerun,
  onUseAsReference, kein Löschen.
- Schema: src/lib/services/database.ts, Version 4,
  assets: 'id, conversationId, timestamp, starred'

Fallen:
- Eine Schema-Migration ist NICHT nötig; conversationId ist bereits indiziert. Der Kommentar in
  constants.ts sagt genau das. Wenn du zu einem anderen Schluss kommst, begründe ihn.
- Blob-URLs müssen über src/lib/blob-manager.ts freigegeben werden. CLAUDE.md verbietet
  URL.createObjectURL direkt — das gilt auch beim Löschen, sonst bleibt eine tote URL zurück.
- Es gibt bereits ein Sternchen-Feature (starred, DB-Version 4). Prüfe, wie sich Filter,
  Sortierung und Löschen dazu verhalten.
- Assets aus dem Chat hängen an echten Conversation-IDs. Beim Löschen einer Konversation
  werden ihre Assets heute mitgelöscht (database.ts:116). Prüfe, ob der gemeinsame Pool daran
  etwas ändert — ein im Create weiterverwendetes Bild sollte nicht verschwinden, weil im Chat
  eine Unterhaltung gelöscht wurde. Das ist ein echter Konflikt, kein Randfall.

Der Plan gehört nach docs/PLAN-phase-5-galerie.md und muss enthalten:
- Ziel in einem Satz und die Fertig-Kriterien, in prüfbare Schritte übersetzt
- Component Mapping mit Begründung je Datei
- Wie der Herkunftsfilter aussieht und wo sein Zustand lebt
- Der Löschpfad, von Knopf bis Blob-Freigabe, inklusive Bestätigung
- Der oben genannte Konflikt beim Löschen einer Konversation, mit Empfehlung
- Reality Check nach AGENTS.md Phase 3
- Testplan: Gallery.test.tsx, playground.e2e.test.tsx, useGalleryAssets und was sonst betroffen ist
- Was ausdrücklich NICHT Teil dieser Phase ist

Regeln:
- Nichts implementieren, nicht committen, nicht pushen.
- Offene Entscheidungen als Rückfrage an mich formulieren.
- Phase 0 ist vermutlich noch nicht abgeschlossen. Prüfe mit git status.
```

---

## Phase 6 — Create auf dem Telefon

```
Du schreibst einen Implementierungsplan für Phase 6 des Create-Fahrplans in ~/heyhihosted.
KEIN Code, keine Änderungen am Produktivcode — nur der Plan.

Lies zuerst, in dieser Reihenfolge:
1. AGENTS.md — der 4-Phasen-Workflow. Du lieferst Phase 1 bis 3 und stoppst dort.
2. HANDOFF.md — aktueller Repo-Stand.
3. docs/HANDOFF-2026-08-27-fahrplan.md — Abschnitt 6, Phase 6.
4. docs/FAHRPLAN-create.md — Phase 6.
5. docs/UX_AUDIT_AND_ROADMAP.md — die P0-Punkte betreffen dich direkt.
6. CLAUDE.md — Playground-Abschnitt und die Schriftregel.

Dein Auftrag: Ein Plan, damit auf dem Telefon ein Bild UND ein Video vollständig erzeugt werden
können, inklusive Referenz-Upload. Der Nutzer formuliert es als "mobile responsive und
funktionstüchtig" — der zweite Teil ist der eigentliche.

Ausgangslage, verifiziert am 2026-08-27: Der Grundaufbau ist bereits responsiv angelegt.
PlaygroundShell.tsx:411 nutzt grid-cols-1 md:grid-cols-[300px_1fr], Zeile 404 blendet einen
Schubladen-Knopf unter md ein, Zeile 429 zeigt die Detailleiste erst ab xl. Das ist Feinschliff
und Bedienbarkeit, kein Neubau. Wenn du zu einem anderen Schluss kommst, begründe ihn.

Betroffene Bausteine: PlaygroundSidebar.tsx (Parameter), PromptBar.tsx, ReferenceSlots.tsx,
ModelPicker.tsx, Gallery.tsx, MetaRail.tsx — alle unter src/components/playground/.

Aus dem UX-Audit relevant: font-weight 250 zu dünn, WCAG-Kontraste, und das Flackern durch
window.innerWidth-basierte Mobilerkennung.

Fallen:
- Auf einem ECHTEN Gerät prüfen, nicht nur im schmalen Fenster. Das schmale Fenster hat in den
  August-Sitzungen mehrfach Fehler verdeckt, die auf dem iPhone auftraten. Das Lehrstück ist
  Commit 691db97: allowedDevOrigins in next.config.ts enthielt volle URLs, Next vergleicht aber
  nur Hostnamen — jede /_next/*-Anfrage von fremder Herkunft bekam 403, und die erste Theorie
  (Safari/localStorage) war falsch.
- Der Nutzer will KEINE automatischen Browser-Starts oder Screenshots zur Prüfung. Er hat den
  Browser selbst offen. Frag, bevor du etwas visuell verifizierst.
- Diese Phase gehört VOR Phase 8. Die Musik-Oberfläche folgt dem hier festgelegten Muster,
  sonst wird sie zweimal gebaut. Dein Plan sollte das Muster deshalb explizit benennen, nicht
  nur einzelne Komponenten reparieren.
- Lange Generierungen laufen minutenlang. Auf dem Telefon heißt das: Tab-Wechsel, Bildschirm
  aus, Verbindungswechsel. Prüfe, wie sich das Client-Polling aus
  src/lib/generation/request-generation.ts dabei verhält — das ist Phase 4, aber die mobile
  Realität gehört hierher.

Der Plan gehört nach docs/PLAN-phase-6-mobile.md und muss enthalten:
- Ziel in einem Satz und die Fertig-Kriterien, in prüfbare Schritte übersetzt
- Das Layout-Muster, das für alle Modi gilt — als Vorgabe für Phase 8
- Component Mapping mit Begründung je Datei
- Ein Prüfdrehbuch für das echte Gerät: welche Handgriffe in welcher Reihenfolge
- Reality Check nach AGENTS.md Phase 3
- Testplan
- Was ausdrücklich NICHT Teil dieser Phase ist

Regeln:
- Nichts implementieren, nicht committen, nicht pushen.
- UI-Änderungen zuerst als Mockup zeigen, dann bauen — das ist eine stehende Vorgabe des
  Nutzers.
- Offene Entscheidungen als Rückfrage an mich formulieren.
- Phase 0 ist vermutlich noch nicht abgeschlossen. Prüfe mit git status.
```

---

## Phase 7 — Chat entschlanken

```
Du schreibst einen Implementierungsplan für Phase 7 des Create-Fahrplans in ~/heyhihosted.
KEIN Code, keine Änderungen am Produktivcode — nur der Plan.

Lies zuerst, in dieser Reihenfolge:
1. AGENTS.md — der 4-Phasen-Workflow. Du lieferst Phase 1 bis 3 und stoppst dort.
2. HANDOFF.md — aktueller Repo-Stand.
3. docs/HANDOFF-2026-08-27-fahrplan.md — Abschnitt 5.1 (der Chat-Input-Umbau
   liegt uncommitted im Baum und spielt direkt hier hinein) und Abschnitt 6, Phase 7.
4. docs/FAHRPLAN-create.md — Phase 7.
5. CLAUDE.md — Provider-Semantik und der Visualize-Abschnitt.

Dein Auftrag: Ein Plan, wie Visualize im Chat auf eine kleine, begründete Modellauswahl
reduziert wird, während das Create die volle Auswahl behält.

Der Nutzer formuliert es als "visualize in chat entschlanken - modell wahl". Das Ziel ist
nicht weniger Können, sondern weniger Entscheidung an der falschen Stelle: der Chat soll
schnell sein, das Create ist der Ort für die volle Auswahl.

Einstiegspunkte:
- src/components/tools/visualize/VisualizeInlineHeader.tsx — die Kopfzeile
- src/hooks/useUnifiedImageToolState.ts — der Zustand
- src/config/unified-image-models.ts — isVisibleVisualModel() ab Zeile 500
- Im offenen Arbeitsbaum liegen bereits neue, unbestätigte Bausteine, die genau hier
  hineinspielen: src/components/chat/input/ImageModelOptions.tsx, ImageParamOptions.tsx,
  InlineModeSwitch.tsx, ModelLogo.tsx. Prüfe zuerst, was davon existiert und was es tut —
  möglicherweise ist ein Teil deiner Phase schon halb gebaut.

Fallen:
- Modelle nicht löschen, nur im Chat ausblenden. Die Registry bleibt die Wahrheit, das Create
  zeigt weiterhin alles.
- Diese Phase hängt an Phase 3: die reduzierte Auswahl muss aus Modellen bestehen, die
  nachweislich funktionieren. Heute sind mehrere im Chat angebotene Modelle entweder
  schlüsselpflichtig (obwohl als frei markiert) oder gar nicht mehr vorhanden. Wenn Phase 3
  noch nicht gelaufen ist, prüfe die Kandidaten selbst gegen
  https://gen.pollinations.ai/image/models.
- Der Übergang ins Create muss beschriftet sein, nicht bloß vorhanden. Der Nutzer soll sehen,
  wohin die anderen Modelle gegangen sind. Das berührt Phase 2 (Navigation) — stimme dich im
  Plan darauf ab, statt einen zweiten Weg zu bauen.
- Welche Modelle im Chat bleiben, ist eine Produktentscheidung. Erarbeite einen begründeten
  Vorschlag mit Kriterien (Geschwindigkeit, Kostenfreiheit, Bandbreite der Ergebnisse), aber
  leg ihn mir als Entscheidung vor.
- Compose ist im Chat bereits per FEATURES.compose = false abgeschaltet. Das ist Phase 0/8,
  nicht deine Phase — nicht anfassen.

Der Plan gehört nach docs/PLAN-phase-7-chat-entschlanken.md und muss enthalten:
- Ziel in einem Satz und die Fertig-Kriterien, in prüfbare Schritte übersetzt
- Befund: was der unbestätigte Chat-Input-Umbau im Arbeitsbaum bereits abdeckt
- Der Modellvorschlag mit Kriterien, als Entscheidungsvorlage für mich
- Component Mapping mit Begründung je Datei
- Reality Check nach AGENTS.md Phase 3
- Testplan: ChatInput.test.tsx, VisualizeInlineHeader.test.tsx, model-invariants.test.ts
- Was ausdrücklich NICHT Teil dieser Phase ist

Regeln:
- Nichts implementieren, nicht committen, nicht pushen.
- Offene Entscheidungen als Rückfrage an mich formulieren.
- Diese Phase läuft parallel zu 4 bis 6 und berührt keine Create-Datei. Halte das ein.
- Phase 0 ist vermutlich noch nicht abgeschlossen — für dich besonders relevant, weil deine
  Dateien mitten im offenen Umbau liegen.
```

---

## Phase 8 — Musik im Create

```
Du schreibst einen Implementierungsplan für Phase 8 des Create-Fahrplans in ~/heyhihosted.
KEIN Code, keine Änderungen am Produktivcode — nur der Plan.

Lies zuerst, in dieser Reihenfolge:
1. AGENTS.md — der 4-Phasen-Workflow. Du lieferst Phase 1 bis 3 und stoppst dort.
2. HANDOFF.md — aktueller Repo-Stand, inklusive der Drift-Warnung.
3. docs/HANDOFF-2026-08-27-fahrplan.md — Abschnitt 4.1 (Musik-Befund mit allen
   19 acestep-Fundstellen) und Abschnitt 6, Phase 8.
4. docs/FAHRPLAN-create.md — Phase 8.
5. CLAUDE.md — Prompt-Enhancement-Abschnitt, Provider-Semantik.

Dein Auftrag: Ein Plan für einen Musikmodus im Create mit eigener Oberfläche.

Entscheidung des Nutzers, verbindlich: Musik läuft AUSSCHLIESSLICH über schlüsselpflichtige
Modelle, hinter der Pollenwall. Kein kostenloses Einstiegsmodell. Begründung: Musik ist vorerst
ein Testfeld. Eigene Infrastruktur (Modal, ACE-Step) ist Phase 10 und zurückgestellt — plane
sie nicht mit.

Vorbild für die Oberfläche laut Nutzer: Suno, ACE Studio, ElevenLabs Music. Beschreibung,
Dauer, instrumental, Modellwahl, Ergebnisliste mit Abspieler.

Registry-Stand vom 2026-08-27 — zieh ihn selbst nach, er kann sich bewegt haben:
  curl -s https://gen.pollinations.ai/audio/models
Damals: acestep existiert NICHT mehr, ALLE Text→Audio-Modelle sind paid_only. Verfügbar:
elevenmusic, stable-audio-3-large, stable-audio-3-medium, lyria-3-clip (Google, 30 s, dem Repo
bisher unbekannt). eleven-sfx ist Geräusch, nicht Musik — eigener Zweck, eigene Entscheidung.

Einstiegspunkte:
- Route existiert: src/app/api/compose/route.ts. Sie spricht den Pollinations-GET-Endpunkt
  ${POLLINATIONS_BASE}/audio/<prompt>?model=…&duration=…&instrumental=… an, mit einem
  Längenlimit (MAX_COMPOSE_URL_LENGTH, Zeile 79). Der OpenAI-kompatible POST-Weg wird laut
  Kommentar bewusst nicht genutzt — lies die Begründung, bevor du sie umwirfst.
- Client: src/lib/media/compose-music.ts, Zustand: src/hooks/useComposeMusicState.ts
- Reste der alten Oberfläche: src/components/tools/compose/ComposeInlineHeader.tsx
  (ComposeTool.tsx ist im Arbeitsbaum gelöscht)
- Schalter: src/config/features.ts
- Modus-Zuordnung: src/lib/playground/mode-mapping.ts (heute t2i, i2i, t2v, i2v),
  Tabs in src/components/playground/ModeTabs.tsx
- Audio-Prompts: AUDIO_ENHANCEMENT_KEYS in src/config/enhancement-prompts.ts, 500-Zeichen-Grenze

Fallen:
- acestep muss VOLLSTÄNDIG verschwinden. 19 Fundstellen, vier davon Vorgabewerte:
  src/app/api/compose/route.ts:8-10 und :24, src/hooks/useComposeMusicState.ts:9 und :46,
  src/lib/media/compose-music.ts:35, src/components/ChatProvider.tsx:416 (fest verdrahteter
  Aufruf), src/config/chat-options.ts:41 (führt es als isFree: true),
  src/config/enhancement-prompts.ts:1452 und :1464, src/config/ui-constants.ts:23 und :123
  (Icon), src/app/api/enhance-prompt/route.ts:20, dazu Tests. Wer nur die Modellliste ändert,
  hinterlässt Vorgabewerte, die ins Leere zeigen.
- Ohne Schlüssel soll der Modus KEINEN Fehler werfen, sondern die Pollenwall erklären und den
  Weg zu den Einstellungen zeigen. Der Modus bleibt sichtbar, die Erzeugung ist gesperrt.
- Die Alias-Auflösung in enhance-prompt läuft VOR dem Audio-Zweig, sonst fällt stable-audio auf
  den Standard plus Bild-Längenlimit zurück. CLAUDE.md erklärt die Reihenfolge — brich sie nicht.
- Ergebnisse gehören in den gemeinsamen Pool aus Phase 5, nicht in einen eigenen Speicher.
- Diese Phase gehört NACH Phase 6, sonst wird die Oberfläche zweimal gebaut. Lies das dort
  festgelegte Layout-Muster, falls Phase 6 schon einen Plan hat.
- lyria-3-clip ist dem Repo unbekannt: Dauerstufen, Parameter und Antwortform sind ungeprüft.
- Es gibt Skills für Prompt-Handwerk, falls verfügbar: suno-prompting, ace-step-prompting,
  stable-audio-3-guide.

Der Plan gehört nach docs/PLAN-phase-8-musik.md und muss enthalten:
- Ziel in einem Satz und die Fertig-Kriterien, in prüfbare Schritte übersetzt
- Die aktuelle Modellliste aus der Live-Registry, mit Dauerstufen und Parametern je Modell
- Vollständige Liste der acestep-Fundstellen mit Maßnahme je Stelle
- Entwurf der Oberfläche, abgestimmt auf das Layout-Muster aus Phase 6
- Component Mapping mit Begründung je Datei
- Reality Check nach AGENTS.md Phase 3
- Testplan: compose/route.test.ts, enhance-prompt/route.test.ts und was neu nötig ist
- Was ausdrücklich NICHT Teil dieser Phase ist

Regeln:
- Nichts implementieren, nicht committen, nicht pushen.
- Modellfragen gegen die Live-Registry, nie gegen die Doku.
- UI-Änderungen zuerst als Mockup zeigen, dann bauen.
- Offene Entscheidungen als Rückfrage an mich formulieren.
- Phase 0 ist vermutlich noch nicht abgeschlossen. Prüfe mit git status.
```

---

## Phase 9 — ASCII-Flow im Create

```
Du schreibst einen Implementierungsplan für Phase 9 des Create-Fahrplans in ~/heyhihosted.
KEIN Code, keine Änderungen am Produktivcode — nur der Plan.

Lies zuerst, in dieser Reihenfolge:
1. AGENTS.md — der 4-Phasen-Workflow. Du lieferst Phase 1 bis 3 und stoppst dort.
2. HANDOFF.md — aktueller Repo-Stand.
3. docs/HANDOFF-2026-08-27-fahrplan.md — Abschnitt 6, Phase 9.
4. docs/FAHRPLAN-create.md — Phase 9.
5. CLAUDE.md — die Schriftregel und der Playground-Abschnitt.

Dein Auftrag: Ein Plan, wie die ASCII-Flow-Effekte der Chat-Startseite auch im Create laufen.
Der Nutzer formuliert es als "coole asciiflow-Effekte wie bei hey, also wie bei der Base
Chatseite, auch im Playground".

Einstiegspunkte:
- src/components/ascii/ — index.tsx, useAsciiFrames.ts, ascii.test.tsx. Liegt bereits im
  offenen Arbeitsbaum, ist also neu und unbestätigt. Lies zuerst, was es tut und wo es heute
  verwendet wird.
- Vorbild: src/components/page/LandingView.tsx — die Chat-Startseite
- Ziel: src/app/playground/PlaygroundShell.tsx und die Galerie darin
- src/app/globals.css — die Glass-Utilities und die Schriftfamilien

Fallen:
- Der Effekt darf nicht während laufender Generierungen um Rechenzeit konkurrieren. Bis zu drei
  Generierungen laufen parallel, jede mit eigenem AbortController und eigener Karte.
- Auf kleinen Geräten und bei prefers-reduced-motion zurücknehmen. Abschaltbar halten.
- Die Schriftregel aus CLAUDE.md gilt: Monospace ist für Maschinelles reserviert. ASCII-Kunst
  ist Monospace, das passt — aber prüfe, dass du keine Fliesstext-Bereiche mit umstellst.
- Im Create ist die Galerie die Ausgabe; das Hero-Element wurde beim Redesign bewusst entfernt
  (siehe docs/superpowers/handoffs/2026-08-12-playground-redesign-session-handoff.md). Ein
  Effekt, der wieder ein Hero-Element einführt, würde diese Entscheidung rückgängig machen.
  Wenn du das vorschlägst, begründe es ausdrücklich.
- Diese Phase ist die letzte im Pfad und die am wenigsten kritische. Wenn dein Plan andere
  Phasen berührt, ist er zu groß.

Der Plan gehört nach docs/PLAN-phase-9-ascii.md und muss enthalten:
- Ziel in einem Satz und die Fertig-Kriterien, in prüfbare Schritte übersetzt
- Befund: was src/components/ascii/ heute kann und wo es verwendet wird
- Wo im Create der Effekt sitzt und warum dort
- Component Mapping mit Begründung je Datei
- Wie die Rücknahme funktioniert (kleine Geräte, reduzierte Bewegung, laufende Generierung)
- Reality Check nach AGENTS.md Phase 3
- Testplan
- Was ausdrücklich NICHT Teil dieser Phase ist

Regeln:
- Nichts implementieren, nicht committen, nicht pushen.
- UI-Änderungen zuerst als Mockup zeigen, dann bauen.
- Offene Entscheidungen als Rückfrage an mich formulieren.
- Phase 0 ist vermutlich noch nicht abgeschlossen; src/components/ascii/ liegt sicher im
  offenen Arbeitsbaum.
```
