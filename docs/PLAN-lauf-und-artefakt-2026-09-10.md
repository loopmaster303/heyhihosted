# Plan A — Der Lauf bekommt einen Besitzer

**Datum:** 2026-09-10
**Grundlage:** `docs/DEEP_AUDIT_2026-09-10.md`, Abschnitte 2.1, 2.2, 2.5, 3 und 4; Register `docs/PLAN-uebersicht-p1-p3-2026-09-10.md`, Strang A
**Stand der Belege:** Commit `98ce083`, Branch `main`. Jede Zeilenangabe wurde am Code nachgezogen; was nicht mehr stimmt, steht unter „Abweichungen vom Audit".
**Status:** Phase 2 und Phase 3 nach `AGENTS.md`. Kein Code geschrieben, kein Build, kein Testlauf. Phase 4 beginnt erst nach ausdrücklicher Bestätigung.

---

## Ziel

**Der Nutzer** merkt, dass ein Lauf nach einem Reload, einem Tab-Absturz oder einem Wechsel der Ansicht weiterverfolgt wird, dass beim 51. Chat nichts mehr ohne Ansage verschwindet und dass ein fertiger Lauf sich bemerkbar macht.
**Der Betreiber** merkt, dass ein wiederaufgenommener Lauf nie neu verschickt wird, also nicht doppelt abgerechnet wird, und dass die Anfrage ohne Wirkung an ein kostenpflichtiges Modell entfällt.
**Der Entwickler** merkt, dass ein Lauf eine Adresse hat (Tabelle `runs`) und einen Besitzer (`ownerRef`) und dass der BlobManager erstmals freigeben kann, statt jeden Eintrag für immer zu halten.

---

## Befunde in diesem Strang

| ID | Befund in einem Satz | Beleg (Datei:Zeile) | Grad |
| --- | --- | --- | --- |
| P0-2.1 | Generierte Medien überleben den Reload nicht: `saveGeneratedAsset` liefert in vier Zweigen `undefined`, die Aufrufer erfinden daraufhin eine ID, und die Galerie verwirft genau solche Sätze ohne `remoteUrl` und ohne `blob`. | `src/lib/services/output-service.ts:50,99,106,120`; `src/app/create/PlaygroundShell.tsx:397,617`; `src/components/playground/Gallery.tsx:49-55` | P0 |
| P0-2.2 | Beim 51. Chat löscht `deleteConversation` in einer Transaktion Nachrichten und Assets des ältesten Chats, ohne Hinweis und ohne abgewartet zu werden. | `src/components/ChatProvider.tsx:63,503-509`; `src/lib/services/database.ts:113-119` | P0 |
| P0-2.5 | Der Chat kann keinen Lauf abbrechen: Die Sendekette hat kein `signal`, und der Pruna-Bildpfad wartet blockierend in der Sendekette. | `src/lib/services/chat-service.ts:67-71,141-143`; `src/lib/chat/chat-send-orchestrator.ts:145-161`; `src/lib/chat/chat-send-coordinator.ts:417-439` | P0 |
| A1 | Läufe leben im `useState` des Tabs, obwohl die Oberfläche dem Nutzer verspricht, der Lauf laufe beim Anbieter weiter. | `src/app/create/PlaygroundShell.tsx:166-167`; `src/lib/playground/constants.ts:16-17`; `src/components/playground/Gallery.tsx:120-137` | P1 |
| A2 | Pruna-Läufe aus dem Chat überleben keinen Reload, weil der Chat `requestGeneration` ohne `context` aufruft. | `src/lib/services/chat-service.ts:141-143`; `src/lib/generation/request-generation.ts:63-76`; `src/lib/generation/run-store.ts:10-12`; Gegenbeispiel `src/app/create/PlaygroundShell.tsx:342-351` | P1 |
| A3 | Der BlobManager kann nichts freigeben: Jeder Eintrag startet mit `refCount: 1`, `cleanupOld` überspringt alles mit `refCount > 0`, der Fünf-Minuten-Lauf räumt deshalb nie ab. | `src/lib/blob-manager.ts:33,124-146`; `src/lib/blob-manager.test.ts:69-83`; erzeugende Stellen `src/hooks/useAssetUrl.ts:46`; `src/lib/services/asset-fallback-service.ts:60`; `src/lib/services/chat-service.ts:155` | P1 |
| A4 | Zwei Schreiber halten denselben Asset-Satz ohne Merge, weil `saveAsset` ein vollständiges `put` ist. | `src/lib/services/database.ts:164-166`; `src/lib/services/output-service.ts:74-83`; `src/lib/services/asset-fallback-service.ts:157-163` | P1 |
| A5 | Uploads und Musik haben keinen Schutz gegen den zweiten Klick, obwohl beide Hooks einen laufenden Zustand führen. | `src/hooks/useUnifiedImageToolState.ts:117,258-295`; `src/hooks/useComposeMusicState.ts:78-86` | P1 |
| A6 | Das Standard-Bildmodell überschreibt die Chat-Auswahl, weil der Effekt auch auf die Hydration aus dem `localStorage` reagiert. | `src/hooks/useChatState.ts:31-32,59-63`; `src/hooks/useLocalStorageState.ts:14-32`; `src/hooks/useChatEffects.ts:70-77`; `src/components/settings/SettingsPopover.tsx:52-58,256-265` | P1 |
| A7 | Ein Speicherfehler im Bildpfad meldet sich als Musikfehler, weil der Handler `audio-save` sendet. | `src/lib/chat/chat-media-intent-handler.ts:122-125`; `src/components/ChatProvider.tsx:422-429` | P1 |
| A8 | Der Persistenz-Effect hängt an einem Objekt, das bei jedem Render neu entsteht, und kann deshalb pro Render ein `loadConversation` starten. | `src/hooks/useChatState.ts:48-52`; `src/hooks/useChatPersistence.ts:66-75` | P1 |
| A9 | Das Gedächtnis schreibt bei jedem Send ein kostenpflichtiges Modell an, liest aber nie jemand. | `src/lib/services/memory-service.ts:8-53`; `src/lib/chat/chat-send-coordinator.ts:496`; `src/lib/services/database.ts:159-161`; `src/config/chat-options.ts:109-110` | P1 |
| A10 | Beim Fertigwerden passiert nichts: Die eigenen Effektbausteine werden nirgends importiert, Ton und Haptik gibt es nur für die Sprachausgabe. | `src/components/ascii/index.tsx:65,116`; `src/components/ui/ModeButtonOverlay.tsx:94`; `src/hooks/useChatAudio.ts:72,112`; `src/components/gallery/GallerySidebarSection.tsx:12,93-109` | P1 |
| A11 | Tote Logik: Der Backoff um einen String-Builder kann nie wiederholen, und drei Exporte haben keinen Aufrufer im Produktivcode. | `src/lib/services/asset-fallback-service.ts:96-127,186`; `src/lib/upload/pollinations-media.ts:76-81`; `src/lib/services/output-service.ts:31-37`; `src/lib/errors/describe-error.ts:154` | P2 |

### Abweichungen vom Audit

1. **A1, Pfad.** Das Audit nennt `src/components/playground/constants.ts:14-17`. Die Datei liegt unter `src/lib/playground/constants.ts`, der Satz steht in `:16-17` (`RUN_CONTINUES_NOTICE`); benutzt wird er in `src/components/playground/Gallery.tsx:9,134`. Die Aussage des Befunds stimmt, nur der Pfad nicht.
2. **A3, Testzeile.** Der Kommentar steht in `src/lib/blob-manager.test.ts:69-73`, nicht `:70-79`. Der Test darunter (`:74-83`) hält das Verhalten fest, der Befund trifft zu.
3. **A11, `describeUnknown`.** Der Export (`src/lib/errors/describe-error.ts:154`) hat einen Aufrufer, aber nur im Test (`src/lib/errors/describe-error.test.ts:39-40`). Produktivcode ruft ihn nirgends.
4. **A11, Backoff.** `fetchMediaUrlWithRetry` (`src/lib/services/asset-fallback-service.ts:96-127`) ist erreichbar (`:77`), also kein ungenutzter Export. Wirkungslos ist er, weil `resolvePollinationsMediaUrl` (`src/lib/upload/pollinations-media.ts:76-81`) nie wirft; der Wiederholungszweig läuft nie.
5. **A5, `isUploading`.** Der Wert wird gelesen, aber nur als Anzeigezustand (`src/components/chat/ChatInput.tsx`, `src/components/chat/input/VisualizeReferenceBadges.tsx`, `src/components/chat/input/AttachmentPreviewRow.tsx`). Keiner dieser Leser benutzt ihn als Sperre vor dem Schreiben. Die Audit-Formulierung trifft den fehlenden Guard, nicht die Variable.
6. **A5, Musik.** `useComposeMusicState` hat einen Aufrufer: `src/app/unified/page.tsx:42`. Der Pfad ist live und hat keinen Test.
7. **A9, Kosten.** `extractMemories` läuft real (`src/lib/chat/chat-send-coordinator.ts:496`), das Modell ist als kostenpflichtig markiert (`src/config/chat-options.ts:110`). Tot ist nur der Lesepfad (`src/lib/services/database.ts:159-161`). A9 kostet Geld, nicht nur Wartbarkeit.
8. **P0-2.2, Ablauf.** Der Aufruf `src/components/ChatProvider.tsx:507` wird nicht abgewartet. Die Löschung läuft unbeobachtet, eine Ablehnung fällt niemandem auf.
9. **A10, Fortschritt.** `AsciiProgress` (`src/components/ascii/index.tsx:65`) verlangt einen Wert. Pruna liefert keinen, und die Galerie sagt das selbst (`src/components/playground/Gallery.tsx:76-77`). Für Läufe ist nur ein wertfreier Baustein ehrlich.
10. **Nummern.** Das Register führt dieselben drei P0-Befunde als P0-A1, P0-A2 und P0-A3 (`docs/PLAN-uebersicht-p1-p3-2026-09-10.md`, Abschnitt 3). Hier stehen die Nummern des Audits.

---

## Wellen

Die drei Wellen folgen der Abhängigkeit, nicht dem Schweregrad. **W1** ist additiv und einzeln umkehrbar: Fehlerbehebungen, deren Absicht im Code schon als Kommentar steht (`src/hooks/useChatEffects.ts:71-73`), plus eine Stillegung. **W2** beendet den stillen Verlust und macht die Schreibpfade eindeutig, ohne eine neue Zusage zu machen. **W3** führt das Laufregister ein und ändert Zustandsvokabel, Besitz, Anzeige und Löschpolitik. Die Reihenfolge deckt sich mit Runde 2 und Runde 3 des Registers.

### W1 — Fehler richtig zuordnen, Doppelklicks bremsen, Auswahl behalten

**Was hier passiert.** Fünf Stellen im Zustandscode verhalten sich anders als ihr eigener Kommentar: Der Fehlertext eines fehlgeschlagenen Bildspeicherns landet im Musikzweig, der Effekt für das Standardmodell überschreibt die gespeicherte Chat-Auswahl, der Persistenz-Effekt laden kann sich pro Render wiederholen, und zwei Hooks setzen einen Laufend-Zustand, den niemand abfragt.
**Einfacher gesagt.** Es wird nichts Neues gebaut. Es wird dafür gesorgt, dass die vorhandenen Zustände auch benutzt werden und dass Meldungen dort ankommen, wo der Fehler entstanden ist.
**Warum.** Diese vier Fehler kosten heute Ergebnisqualität (falsches Modell, falsche Meldung, doppelte Uploads) oder Rechenzeit (wiederholte Ladevorgänge), und jede Korrektur ist ein einzelner Commit ohne Datenwirkung. Sie zuerst zu machen hält W2 und W3 frei von Rauschen.

**Schritte.**

1. **`src/hooks/useChatPersistence.ts:66-75`** — die Rückgabe wird über `useMemo` stabil. **`src/hooks/useChatState.ts:48-52`** — der Effekt läuft nur noch, wenn sich `persistedActiveConversationId` ändert, und prüft die Bedingung `!persistence.activeConversation` über eine Ref. Warum: Das Rückgabeobjekt entsteht bei jedem Render neu, der Effekt kann deshalb mehrfach `loadConversation` starten (A8).
2. **`src/hooks/useChatState.ts:31-32,59-63`** und **`src/components/settings/SettingsPopover.tsx:256-265`** — die Auswahl des Standard-Bildmodells wird an der Quelle geschrieben: Der Setter setzt zusätzlich den gespeicherten Chat-Wert, der reaktive Effekt entfällt. **`src/hooks/useChatEffects.ts:70-77`** — die Reparatur einer ungültigen Auswahl läuft nach der Hydration (`isInitialLoadComplete`, `src/hooks/useChatPersistence.ts:74`). Warum: `useLocalStorageState` liefert erst nach dem Mount (`src/hooks/useLocalStorageState.ts:14-32`), der Effekt überschreibt die Nutzerentscheidung mit dem Standard (A6).
3. **`src/lib/chat/chat-media-intent-handler.ts:122-125`** — der Fehler wird als `image-save` gemeldet. **`src/components/ChatProvider.tsx:422-429`** — die Zuordnung wird eine Tabelle: `image` und `image-save` nach Bild, `audio-save` und `music` nach Musik, Unbekanntes auf eine neutrale Meldung mit dem Rohtext. Warum: Ein Speicherfehler im Bildpfad heißt heute „Musik-Generierung fehlgeschlagen" (A7).
4. **`src/hooks/useUnifiedImageToolState.ts:258-295`** — vor dem ersten `setIsUploading(true)` eine Sperre, die zusätzlich eine Ref prüft, weil der State im selben Tick noch nicht aktualisiert ist. **`src/hooks/useComposeMusicState.ts:78-86`** — `generateMusic` kehrt zurück, solange `isGenerating` gilt. Warum: Zwei Klicks erzeugen heute zwei Läufe auf einen Ergebnisplatz (A5).
5. **`src/lib/services/memory-service.ts:8-53`** und **`src/lib/chat/chat-send-coordinator.ts:496`** — die Extraktion hängt an einer Konstante, die erst greift, wenn ein Lesepfad existiert. Warum: Der Aufruf geht an `mistral` (`src/config/chat-options.ts:109-110`), ein Modell mit `isFree: false`, und das Ergebnis liest niemand (`src/lib/services/database.ts:159-161`), siehe A9.
6. **`src/lib/services/asset-fallback-service.ts:96-127,186`**, **`src/lib/services/output-service.ts:31-37`**, **`src/lib/errors/describe-error.ts:154`** samt dem zugehörigen Testfall `src/lib/errors/describe-error.test.ts:39-46` — die toten Pfade entfallen. Warum: A11, und diese Dateien werden in W2 ohnehin angefasst.

**Dauer:** 2,5 Halbtage.
**Abnahme:** `npm run typecheck`, `npm run lint` und die in der Verifikation genannten Jest-Pfade sind grün, und ein im Chat gewähltes Bildmodell bleibt nach einem Reload gewählt.

### W2 — Der Verlust wird sichtbar gemacht und beendet

**Was hier passiert.** Das Speichern eines erzeugten Artefakts endet nicht mehr still im Nichts, sondern liefert ein Ergebnis mit Grund, das die Oberfläche zeigen kann. `/create` gibt eine Sitzungskennung mit, damit der Ingest die Ablagekennung nachträgt. Die drei Schreiber auf einen Asset-Satz bekommen einen gemeinsamen Patch-Pfad. Der BlobManager wird messbar. Und der Trim beim 51. Chat wird eine benannte Funktion, die zählt, was sie tut.
**Einfacher gesagt.** Ab hier kann man nach einem Reload nachsehen, ob das Bild wirklich gespeichert wurde, und wenn nicht, warum. Gelöscht wird weiterhin, aber nicht mehr im Vorbeigehen.
**Warum.** P0-2.1 ist der Befund mit dem größten Schaden für den Nutzer und braucht kein neues Schema. A4 ist die Ursache dafür, dass die Reparatur überhaupt greift: Solange der Backfill den Blob überschreiben kann, hilft jede zusätzliche Speicherung nur zufällig.

**Schritte.**

1. **`src/lib/services/output-service.ts:45-122`** — der Rückgabetyp wird ein Ergebnis (Erfolg mit `assetId` oder Fehlschlag mit `reason`), jeder der vier stillen Zweige (`:50,99,106,120`) bekommt seinen Grund. Die Aufrufer ziehen nach: `src/app/create/PlaygroundShell.tsx:386,600`, `src/hooks/useComposeMusicState.ts:104`, `src/lib/chat/chat-send-orchestrator.ts:145-161`, `src/lib/chat/chat-media-intent-handler.ts:112-125`. Warum: P0-2.1.
2. **`src/app/create/PlaygroundShell.tsx:386`** — `sessionId` aus `src/lib/session.ts:5` (`getClientSessionId`) mitgeben, damit der Ingest-Zweig (`src/lib/services/output-service.ts:73-89`) läuft und `storageKey` schreibt; über `src/lib/upload/pollinations-media.ts:29-31,76-81` bleibt die Medien-URL dauerhaft neu baubar. Warum: P0-2.1, zweite Hälfte. Ohne Sitzungskennung bleibt die Adresse die einzige Spur, und die kann verfallen.
3. **`src/lib/services/database.ts:164-166`** — `updateAsset(id, patch)` als read-modify-write in einer Transaktion, mit einer reinen Merge-Funktion daneben. **`src/lib/services/asset-fallback-service.ts:157-163`** und **`src/lib/services/output-service.ts:74-83`** schreiben darüber. Warum: A4. Letzter Schreiber gewinnt heute, und der Backfill kennt keine Existenzprüfung.
4. **`src/lib/blob-manager.ts:124-146`** — `getStats()` meldet zusätzlich Alter und Referenzzahl je Eintrag, und im Entwicklungsmodus warnt der Intervalllauf (`:225-226`) bei Einträgen, die länger als die Altersgrenze leben. Warum: A3 lässt sich erst freigeben, wenn es einen Besitzer gibt; bis dahin ist Messen die ehrliche Zwischenstufe.
5. **`src/lib/services/database.ts:113-119`** — `deleteConversation(id, options)` mit ausdrücklichem `assets`-Verhalten, Standard wie bisher. Neu: `src/lib/services/conversation-retention.ts` mit einer benannten `trimConversations()`, die die betroffenen Kennungen und Asset-Zahlen zurückgibt; `src/components/ChatProvider.tsx:503-509` ruft sie abgewartet auf. Warum: P0-2.2 technisch vorbereiten, ohne die Politik zu entscheiden.

**Dauer:** 4 Halbtage.
**Abnahme:** Ein Pruna-Ergebnis aus `/create` ist nach einem harten Reload in der Galerie sichtbar, ein fehlgeschlagenes Speichern erscheint als Meldung mit Grund, und der Ingest-Backfill schreibt nachweislich `storageKey`.

### W3 — Das Laufregister, der Besitz und der Abbruch

**Was hier passiert.** Eine Dexie-Tabelle `runs` wird der Ort, an dem ein Lauf entsteht, lebt und endet. Sie wird vor dem Anbieteraufruf geschrieben und nach dem Ergebnis geschlossen. Sie trägt die Anbieterkennung (`predictionId` bei Pruna, `taskId` beim Sound), den Besitzer (`ownerRef`), den eingefrorenen Auftrag und das Ergebnis. Ein `RunProvider` oberhalb der Oberflächen hängt vorhandene Läufe beim Start an und fragt sie weiter, ohne sie neu zu verschicken. Der Chat bekommt einen Abbruch, `/create` eine Live-Zeile, und beim Fertigwerden passiert endlich etwas.
**Einfacher gesagt.** Bisher weiß nur die Komponente, dass ein Lauf existiert. Wenn der Tab stirbt, stirbt das Wissen. Ab hier steht der Lauf in einer Liste, die den Tab überlebt, und jeder kann nachsehen, was daraus geworden ist.
**Warum.** Alles andere in diesem Plan hängt an dieser Schicht: P0-2.2 braucht den Besitzer, um sagen zu können, welche Assets an einem Chat hängen, A3 braucht ihn, um freigeben zu dürfen, A10 braucht die Adresse des Laufs, um beim Fertigwerden etwas auszulösen, und P0-2.5 braucht ein Objekt, das man abbrechen kann.

**Schritte.**

1. **`src/lib/services/database.ts:61-74`** — `this.version(5).stores({...})` mit den vier bestehenden Tabellen und der neuen `runs: 'id, status, startedAt'`. Warum: siehe Realitätscheck, die Erweiterung ist additiv und ein Vorgänger-Bundle löscht die Tabelle nicht.
2. **`src/lib/generation/run-ledger.ts`** — das Register mit einer kleinen Zustandsmaschine: `running` nach `finished` oder `failed`, `running` nach `orphaned`, `orphaned` zurück nach `running` oder nach `finished`. Felder: `id`, `kind`, `provider`, `providerJobId`, `modelId`, `body`, `params`, `prompt`, `startedAt`, `finishedAt`, `expectedMs`, `assetId`, `ownerRef`, `lastError`. `ownerRef` ist der Gesprächsbezug, der auch am Asset steht (`__playground__` für `/create`, siehe `src/lib/playground/constants.ts:6`). Warum: A1 und die Voraussetzung für P0-2.2 und A3.
3. **`src/lib/generation/run-store.ts:17`** — der `localStorage`-Schlüssel `heyhi.prunaRuns.v1` wird einmalig in die Tabelle umgezogen und erst nach erfolgreichem Schreiben entfernt; der Leser bleibt genau eine Fassung lang stehen. `src/app/create/PlaygroundShell.tsx:455-495` verliert den Mount-Effekt an den Provider. Warum: ein Register, kein zweites daneben.
4. **`src/components/RunProvider.tsx`** (Client-Komponente) — hält das Register, hängt beim Start jeden Lauf mit `providerJobId` über `pollPrediction` (`src/lib/generation/request-generation.ts:92-117`) an und schreibt den Übergang. Ein Lauf ohne Kennung wird nie neu verschickt. Warum: A1, A2, und die Regel, dass Wiederaufnahme kein zweiter Auftrag ist.
5. **`src/components/playground/Gallery.tsx:96-137`** — die Laufkarte liest ihre Daten aus dem Register statt aus dem Zustand der Shell (`src/app/create/PlaygroundShell.tsx:166-167`). Neu: eine Zeile in der Seitenleiste mit `AsciiSpinner` und Text für laufende Aufträge, und `AsciiDone` (`src/components/ascii/index.tsx:116`) beim Abschluss, dazu ein kurzer Ton über einen `AudioContext`, der beim ersten Nutzerkontakt erzeugt wird. Warum: A10. `AsciiProgress` bleibt außen vor, weil Pruna keinen Prozentwert liefert (`src/components/playground/Gallery.tsx:76-77`).
6. **`src/components/playground/Gallery.tsx:120-137`** und die Zustandsanzeige — ein Lauf ohne Kennung zeigt „nicht wiederauffindbar" statt einer Wiederaufnahme; für `/api/generate` in der blockierenden Fassung (`src/app/api/generate/route.ts:315-320,357`) und für `/api/compose` (`src/app/api/compose/route.ts:102-112`) gibt es keine Kennung. Läufe ohne Kennung, die älter sind als `RUN_MAX_AGE_MS` (`src/lib/generation/run-store.ts:20`), werden aufgeräumt. Warum: Ehrlichkeit. Der Satz „läuft beim Anbieter weiter" stimmt, nur wiederfinden lässt sich dort nichts.
7. **`src/lib/services/chat-service.ts:67-71,141-143`**, **`src/lib/chat/chat-send-coordinator.ts:417-439`**, **`src/components/chat/ChatInput.tsx`** — ein `AbortController` zieht durch die Sendekette, der Chat bekommt einen Stop, der Lauf geht auf `orphaned`. Der Text sagt, was passiert: Der Anbieterlauf wird weiter berechnet und abgerechnet, es gibt keinen Anbieterabbruch (`src/lib/pruna/client.ts:33-272` kennt nur Absenden, Status, Herunterladen und Hochladen; `src/app/api/sound/route.ts:145-188` kennt nur POST und GET). Warum: P0-2.5.
8. **`src/lib/services/chat-service.ts:141-143`** — der Chat übergibt denselben `context` wie `/create` (`src/app/create/PlaygroundShell.tsx:342-351`), gefüllt aus den Feldern, die `GenerateImageOptions` (`src/lib/services/chat-service.ts:24-47`) schon trägt. Warum: A2, damit ein Pruna-Bild aus dem Chat nach einem Reload weiterverfolgt wird.
9. **`src/lib/blob-manager.ts:33,68-98,124-146`** — Freigabe bekommt einen Besitzer: Wer eine Object-URL erzeugt, gibt den Besitzer mit, und mit dem Ende des Besitzers (Lauf beendet, Auflösung beendet) wird freigegeben. `cleanupOld` unterscheidet danach zwischen noch gehaltenen und besitzerlosen Einträgen. Der Kommentar `src/lib/blob-manager.test.ts:69-73` wird durch einen Test ersetzt, der die neue Zusage prüft. Warum: A3, und der Besitz entsteht genau in diesem Schritt.
10. **`src/components/ChatProvider.tsx:503-509`** und `src/lib/services/conversation-retention.ts` — die sichtbare Hälfte von P0-2.2, abhängig von der Antwort auf Frage 3. Warum: Die Löschung soll eine Entscheidung des Nutzers oder ein Export sein, kein Nebeneffekt einer Konstante.

**Dauer:** 7,5 Halbtage.
**Abnahme:** Ein Pruna-Video aus `/create` läuft nach einem harten Reload ohne neuen Auftrag weiter (Netzwerk-Tab zeigt Statusabfragen, kein `/api/generate`), ein Chat-Lauf mit Pruna-Kennung ebenso, und beim 51. Chat verschwindet nichts ohne Anzeige der betroffenen Assets.

---

## Realitätscheck

**Bestehende Verträge und Hooks, die der Plan berührt.**

1. **`OutputService.saveGeneratedAsset`** (`src/lib/services/output-service.ts:45`) — der Rückgabetyp wechselt von `string | undefined` auf ein Ergebnis. Betroffen sind die fünf Aufrufer (`src/app/create/PlaygroundShell.tsx:386,600`; `src/hooks/useComposeMusicState.ts:104`; `src/lib/chat/chat-send-orchestrator.ts:150-152`; `src/lib/chat/chat-media-intent-handler.ts:113`) plus die Verträge `RunImageGenerationFlowInput.saveGeneratedAsset` (`src/lib/chat/chat-send-orchestrator.ts:15`) und `ProcessAssistantMediaIntentsInput.saveGeneratedAsset` (`src/lib/chat/chat-media-intent-handler.ts:33`). Abfang: ein Commit, `npm run typecheck` findet jede Stelle; `src/lib/services/output-service.test.ts` wird auf die neuen Rückgaben umgestellt.
2. **`DatabaseService.deleteConversation`** (`src/lib/services/database.ts:113-119`) — neue Signatur mit Standardwert, damit kein Aufrufer sich ändert: `src/hooks/useChatPersistence.ts:59-61` und `src/components/ChatProvider.tsx:507,523`.
3. **`BlobManager`** (`src/lib/blob-manager.ts:33,68-98,124-146`) — der Freigabevertrag ändert sich. Eine zu frühe Freigabe zeigt weiße Flächen statt Bildern. Abfang: Freigabe nur über den Besitzer, und die Handprüfung durch Galerie, Chat und Zeitleiste gehört zur Abnahme dieser Welle.
4. **`useChatState`, `useChatPersistence`, `useChatEffects`** (A6, A8) — die drei Hooks tragen den Chat-Zustand (`src/components/ChatProvider.tsx:65-68`) und sind in `src/hooks/useChatState.test.tsx` geprüft. Abfang: dieselbe Welle, dieselben Tests, zwei neue Fälle dazu.
5. **`useComposeMusicState`** (A5) — lebt in `/unified` (`src/app/unified/page.tsx:42`) und hat keinen Test. Der Guard ist eine Verhaltensänderung in einem ungeprüften Pfad, deshalb gehört der neue Test zum Schritt.
6. **Der Wiederaufnahme-Effekt** (`src/app/create/PlaygroundShell.tsx:455-495`) — sein Vertrag lautet „anhängen, nie neu verschicken" (Kommentar `:454-455`). Abfang: Der Effekt zieht unverändert in den Provider; `pollPrediction` bleibt die einzige Quelle, und ein Test zählt, dass kein POST entsteht.
7. **`run-store.ts`** (`src/lib/generation/run-store.ts:17`) — Doppelschreiber vermeiden. Abfang: einmaliger Umzug mit Erfolgsprüfung, `removeLocal` erst danach, Leser bleibt eine Fassung lang.
8. **Dexie `version(5)`** (`src/lib/services/database.ts:61-74`) — verifiziert in der installierten Fassung 4.2.1: Dexie öffnet mit der deklarierten Version mal zehn (`node_modules/dexie/dist/dexie.js:4103,4116-4118`); scheitert das mit `VersionError`, öffnet es ohne Versionsangabe (`:4190-4193`), und `verifyInstalledSchema` beanstandet überzählige Tabellen nicht (`:3675-3678`). Der Patch-Pfad legt nur fehlende Tabellen und Indizes an und löscht nichts (`:3446-3472`). Ein Vorgänger-Bundle löscht die `runs`-Tabelle also nicht. Zwei Tabs mit unterschiedlichen Bundles sind der reale Fall: Dexie schließt die alte Verbindung (`:5426-5432`), der alte Tab wirft bei der nächsten Schreiboperation `DatabaseClosedError` (`:2772`). Abfang: Prüfung an einer Kopie der Datenbank vor dem Ausrollen, plus Hinweis im Rollout.
9. **`ChatService.generateImage`** (`src/lib/services/chat-service.ts:141-143`) — bekommt in W3 den `context`. Abfang: Der Registereintrag entsteht aus denselben Feldern, die `GenerateImageOptions` schon trägt (`:24-47`), also ohne neue Parameter über die Oberfläche.
10. **`Gallery`-Laufkarte** (`src/components/playground/Gallery.tsx:96-137`) — Props bleiben, die Quelle wechselt. Abfang: die bestehenden Tests `src/components/playground/Gallery.test.tsx` und `src/app/create/PlaygroundShell.test.tsx` halten Karte und Shell.

**Die einfachere Variante.** A1 und A2 lassen sich ohne Schema lösen: `run-store.ts` bekommt die Felder `status` und `ownerRef`, ein Hook liest den Speicher über `readStoredRuns` (`src/lib/generation/run-store.ts:67-82`), und beide Oberflächen hängen an diesem Hook. Das sind etwa drei Halbtage statt sieben und keine Versionserhöhung. Es fehlen dann genau die drei Dinge, die P0-2.2 und A3 brauchen: eine Abfrage „welche Assets hängen an diesem Gespräch", Sichtbarkeit über zwei Tabs und das Überleben eines Routenwechsels. Deshalb empfehle ich Dexie, die Entscheidung steht aber in Frage 1.

**Einbahnstraße.** Der erste Start mit dem neuen Bundle hebt die native Datenbankversion dauerhaft an; verifiziert ist, dass Dexie dabei nichts löscht und ein Vorgänger-Bundle weiterarbeitet (siehe Punkt 8). Wirklich unumkehrbar ist das Zustandsvokabular: Sobald eine installierte Fassung `orphaned` geschrieben hat, ist eine Umbenennung eine Migration. Ebenso endgültig ist das Löschen des `heyhi.prunaRuns.v1`-Schlüssels und jede Löschpolitik, die auf Nutzerdaten wirkt: Was beim 51. Chat einmal weg ist, findet ein späteres „doch behalten" nicht wieder.

**Wo Verschlimmbesserung lauert.**

- **Ein Fortschrittsbalken für Pruna.** Es gibt keinen Prozentwert, die Galerie sagt das selbst (`src/components/playground/Gallery.tsx:76-77`). Ein Balken wäre eine Behauptung.
- **Ein Abbruch, der Halt verspricht.** Für Pruna und den Sound-Dienst existiert im Repo kein Abbruchaufruf (`src/lib/pruna/client.ts:33-272`; `src/app/api/sound/route.ts:145-188`). Der Knopf heißt weiter „Nicht mehr warten" (`src/components/playground/Gallery.tsx:126-135`), und der Satz darunter bleibt wahr.
- **Wiederaufnahme, die neu verschickt.** Doppelte Kosten beim Nutzer. Die Regel steht in W3 Schritt 4 und wird durch einen Test gehalten.
- **Zwei Register.** Ein `localStorage`-Bestand neben der Tabelle ergibt zwei Wahrheiten über denselben Lauf. Der Umzug läuft in derselben Welle, danach gibt es genau einen Schreiber.
- **Freigabe nach Uhrzeit ohne Besitzer.** Sie räumt Blobs weg, die noch angezeigt werden. Deshalb erst messen (W2 Schritt 4), dann besitzen (W3 Schritt 9).
- **Der Trim als „Chat weg, Bilder bleiben".** Assets ohne Gesprächsbezug gelten laut `src/lib/assets/asset-origin.ts:25-29` als `compose`, also falsch etikettiert. Das ist sichtbar und gehört in die Entscheidung zu Frage 3.
- **Das Register als Ersatz für das Speichern.** Ein Lauf ist keine Ablage. Das Asset wird weiter im Moment des Ergebnisses geschrieben (`src/lib/services/output-service.ts:65-92`).

---

## Verifikation

Seriell, ein Kommando nach dem anderen, kein `--watch`, `npm run test` erst am Ende einer Welle (8 GB Maschine, `AGENTS.md`).

```
npm run typecheck
npm run lint
npx jest src/lib/generation/run-store.test.ts src/lib/generation/request-generation.test.ts
npx jest src/app/create/PlaygroundShell.test.tsx src/components/playground/Gallery.test.tsx
npx jest src/components/ChatProvider.test.tsx src/hooks/useChatState.test.tsx
npx jest src/lib/blob-manager.test.ts src/hooks/useUnifiedImageToolState.test.tsx src/lib/services/output-service.test.ts
npm run test
```

**Neue Testdateien.** `fake-indexeddb` ist nicht installiert (`package.json:48-64`), und die vorhandenen Tests zu Dexie-nahem Code mocken `DatabaseService` (`src/lib/services/output-service.test.ts:1-8`). Deshalb wird das Register über einen schmalen Speicher-Port beschrieben: die Zustandsmaschine und der Umzug werden gegen einen In-Memory-Port geprüft, die Dexie-Anbindung bleibt dünn und wird manuell geprüft. Die Alternative ist `fake-indexeddb` als eine Dev-Abhängigkeit, dann lässt sich auch `version(5)` prüfen.

- `src/lib/generation/run-ledger.test.ts` — Die Übergänge `running` nach `finished`, nach `failed` und nach `orphaned` sowie zurück; Aufräumen von Einträgen ohne Kennung ab `RUN_MAX_AGE_MS` (`src/lib/generation/run-store.ts:20`); „anhängen erzeugt keinen neuen Auftrag" (Fetch-Spy zählt null POST); Umzug schreibt alle Sätze aus `heyhi.prunaRuns.v1` und entfernt den Schlüssel erst danach.
- `src/lib/services/asset-merge.test.ts` — die reine Merge-Funktion: Ein Backfill nach dem Blob-Cache verliert den Blob nicht, der Cache nach dem Backfill behält `storageKey`, `undefined`-Felder überschreiben nichts.
- `src/hooks/useComposeMusicState.test.tsx` — ein zweiter Aufruf während `isGenerating` löst kein zweites `fetch('/api/compose')` aus.
- `src/hooks/useChatPersistence.test.tsx` — die Rückgabe bleibt zwischen zwei Renders identisch, `loadConversation` läuft genau einmal.
- Erweiterungen: `src/hooks/useChatState.test.tsx` (die gespeicherte Bildmodellwahl übersteht die Hydration), `src/hooks/useUnifiedImageToolState.test.tsx` (Doppelaufruf ergibt einen Upload), `src/lib/blob-manager.test.ts` (Freigabe über Besitzer, der Kommentar `:69-73` entfällt), `src/components/ChatProvider.test.tsx` (Speicherfehler im Bildpfad erscheint als Bildmeldung, der Trim ruft die Retention-Funktion), `src/app/create/PlaygroundShell.test.tsx` (fehlgeschlagenes Speichern zeigt eine Meldung).

**Manuelle Prüfschritte.**

1. `/create`: Pruna-Video starten, Tab hart neu laden. Die Karte muss weiterlaufen. Im Netzwerk-Tab darf während des Reloads keine `/api/generate`-Anfrage stehen, Statusabfragen dürfen.
2. Ergebnis abwarten, Galerie öffnen, erneut hart neu laden. Das Ergebnis muss weiterhin da sein (P0-2.1).
3. 51 Chats anlegen. Vor dem Entfernen des ältesten muss sichtbar sein, welche Assets daran hängen (nach Frage 3).
4. Im Chat ein Pruna-Bild senden, Tab neu laden. Der Lauf muss im Chat wieder auftauchen (A2).
5. Im Chat eine Textantwort laufen lassen, Stop drücken. Der Send bricht ab, die Blase sagt „abgebrochen" und nicht „Fehler" (P0-2.5).
6. Zwei Tabs mit unterschiedlichen Bundles öffnen und die Datenbank erweitern. Der alte Tab wirft beim nächsten Schreiben `DatabaseClosedError`; das erwartete Verhalten notieren (Realitätscheck Punkt 8).

---

## Nicht in diesem Plan

- **Der zweiphasige Chat-Pfad** (starten, Kennung, veröffentlichen) und eine 202-Antwort für Pollinations. Das ist der Antwortvertrag und gehört zu Strang C.
- **`GET /api/runs` und `Idempotency-Key`.** Adresse für Maschinen, Strang C.
- **Rezeptformat `heyhi.recipe/v1`, Export, Import, Link.** Eigene Entscheidungsrunde; der Registereintrag trägt heute nur den eingefrorenen Auftrag.
- **Der Lesepfad für das Gedächtnis.** In W1 wird der blinde Schreibvorgang stillgelegt; Prompt-Injektion und Anzeige brauchen eine eigene Entscheidung.
- **Ein echter Anbieterabbruch.** Es gibt keinen Aufruf dafür; „Nicht mehr warten" bleibt die ehrliche Fassung.
- **Ersatz des BlobManager durch ein anderes Modell.** Hier geht es um Besitz und Freigabe.
- **Schemaänderungen an `assets` und `conversations`.** Neu ist nur die Tabelle `runs`.
- **Die Arbeit der Stränge B, C und D** (Tastatur, Semantik, Fehlerformat, CI).

---

## Offene Fragen an den Nutzer

1. **Register in Dexie oder im vorhandenen `localStorage`-Bestand?** Dexie kostet die Versionserhöhung und den Umzug, liefert aber Abfragen, Tabübergreifen und die Grundlage für P0-2.2 und A3. `localStorage` ist billiger und bleibt bei einem Schreiber. Empfehlung: Dexie.
2. **Reichweite eines Laufs.** Ein `RunProvider` im Wurzel-Layout (Lauf überlebt auch einen Wechsel zwischen `/create` und dem Chat, wird aber auf jeder Seite mitgeladen) oder ein Provider je Route (nur der Reload auf derselben Seite wird abgedeckt). Empfehlung: Wurzel-Layout, weil der Satz aus `src/lib/playground/constants.ts:16-17` sonst nur halb stimmt.
3. **Was passiert beim 51. Chat?** Vor dem Entfernen fragen und die betroffenen Assets anzeigen, vorher exportieren, oder die Grenze zunächst nur sichtbar machen und noch nichts löschen. Empfehlung: fragen, mit Zahl der betroffenen Assets, weil die Metadatenliste der Engpass ist und die Bilder den Wert tragen.
