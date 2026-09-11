# Plan C — Maschinenvertrag: Fehlercodes, Antwortverträge, Routen und Discoverability

**Datum:** 2026-09-10
**Grundlage:** [`DEEP_AUDIT_2026-09-10.md`](./DEEP_AUDIT_2026-09-10.md), Abschnitte 3 und 4, Strang C laut [`PLAN-uebersicht-p1-p3-2026-09-10.md`](./PLAN-uebersicht-p1-p3-2026-09-10.md)
**Stand:** Phase 2 und Phase-3-Teil des `AGENTS.md`-Ablaufs. Kein Code, kein Branch, kein Commit, kein Build, kein Testlauf. Phase 4 beginnt erst nach ausdrücklicher Bestätigung.
**Belege:** jede Aussage über den Code mit Datei:Zeile, alle Angaben am Stand `98ce083` nachgeprüft. Abweichungen vom Audit stehen im Realitätscheck.

## Ziel

Der Nutzer merkt, dass eine Anfrage, die nicht laufen kann, ihm in einem Satz sagt, was fehlt, und dass fremde Aufrufe seine Warteschlange nicht mehr über eine 180-Sekunden-Verbindung blockieren. Der Betreiber merkt, dass kein Fremdaufruf mehr unbegrenzt auf seiner Rechnung läuft, dass jeder Fehler mit Code, Upstream-Status und Modell im Log und in der Antwort steht und dass anonyme Nutzung eine sichtbare Tagesgrenze hat. Der Entwickler merkt, dass er eine Generierung wiederholen kann, ohne sie zweimal zu bezahlen, dass er an einer Fehlerantwort erkennen kann, welches Feld falsch war, und dass eine Maschine die Seite überhaupt findet und aufrufen kann.

## Befunde in diesem Strang

| ID | Befund in einem Satz | Beleg (Datei:Zeile) | Grad |
| --- | --- | --- | --- |
| P0-C1 | Der Server-Schlüssel trägt jede Anfrage ohne eigenen Schlüssel, es gibt keinen Verbrauchszähler und keine Tagesgrenze; 13 Routen rufen `resolvePollenKey` auf, zwei weitere lesen den Umgebungsschlüssel direkt in ihren Flows. | `src/lib/resolve-pollen-key.ts:13-15`; `src/lib/pollen-cost-guard.ts:29-32`; `src/lib/pollen-cost-guard.ts:16-18`; `src/ai/flows/tts-flow.ts:28`; `src/ai/flows/stt-flow.ts:7` | P0 |
| C1 | Es gibt keine `robots.txt`, keine `sitemap`, kein `manifest`, keine `middleware.ts` und kein JSON-LD; `layout.tsx` setzt weder `metadataBase` noch `robots`, `openGraph`, `twitter` oder `alternates`. | `src/app/layout.tsx:10-19`; repo-weit leer (`rg --files -g 'robots.*' -g 'sitemap.*' -g 'manifest.*' -g 'middleware.*'` → 0 Treffer; `rg 'application/ld+json' src` → 0 Treffer) | P1 |
| C2 | Der Limiter lebt als Prozess-Map und leitet die Identität aus `x-forwarded-for` ab; 11 der 20 Routen prüfen gar nichts, und es gibt keine Obergrenze pro Tag. | `src/lib/rate-limit.ts:15,48-58`; `src/lib/rate-limit.ts:4-7`; Aufrufer nur in `chat/completion:128`, `chat/title:45`, `compose:20`, `enhance-prompt:253`, `generate:60`, `pollen/polly:34`, `sound:57`, `stt:11`, `tts:22` | P1 |
| C3 | Der Pollinations-Pfad hält die Anfrage bis zu 180 s offen, während genau eine Instanz läuft; nur der Pruna-Zweig antwortet zweiphasig. | `src/lib/media/server-media-ingest.ts:104`; `src/app/api/generate/route.ts:315`; `apphosting.yaml:7`; 202-Zweig `src/app/api/generate/route.ts:237-243`, zweite Quelle `src/app/api/pruna/status/route.ts:34` | P1 |
| C4 | Der Text-Endpunkt verlangt `modelId` und liefert nur `choices[0].message.content`; die OpenAI-förmige Route kann nur `model: 'polly'` und lehnt `stream: true` über `.strict()` ab. | `src/app/api/chat/completion/route.ts:63-70,312-321`; `src/app/api/pollen/polly/route.ts:13-30,48-55` | P1 |
| C5 | Der Smart Router tauscht das Modell bei Suchintention standardmäßig aus, und die Antwort nennt weder das geroutete Modell noch die Strategie; `skipSmartRouter` ist nirgends dokumentiert. | `src/lib/chat/chat-search-strategy.ts:33-34,40-43,49-52`; `src/app/api/chat/completion/route.ts:168-177,213-217`; `src/app/api/chat/completion/route.ts:68,146` | P1 |
| C6 | Upstream-Fehler werden zu „Upstream model request failed" mit 502, der echte Grund bleibt im Log; der 30-s-Timeout wird ein generisches `Error` und endet als 500 `INTERNAL_ERROR`. | `src/app/api/chat/completion/route.ts:253,277,304`; `src/lib/https-post.ts:18,69-72`; `src/lib/api-error-handler.ts:56-64` | P1 |
| C7 | 46 `error:`-Antworten in 15 Routendateien, 13 dieser Dateien setzen nie einen `code`; vier Routen haben keinen zentralen Handler. | `rg -c 'error:' -g 'route.ts' src/app/api` → 46 Treffer in 15 Dateien; `rg -n 'code:' -g 'route.ts' src/app/api` → nur `sound:60`, `generate:63`; ohne Handler: `src/app/api/capabilities/route.ts:9-13`, `pollen/account`, `pollen/image-models`, `pollen/polly/models` | P2 |
| C8 | Die Antwort auf `/api/generate` enthält nur `imageUrl`/`videoUrl`: kein effektiver Seed, keine aufgelöste Modell-ID, kein Anbieter, und `Idempotency-Key` hat null Treffer im Repo. | `src/app/api/generate/route.ts:357`; `src/lib/pruna/deliver.ts:65-68`; `rg -ni 'idempotency' src` → 0 Treffer | P2 |
| C9 | `validateRequest` reduziert die Validierungsdetails auf das erste Feld; der Zod-Zweig des Handlers liefert dagegen schon alle Fehler. | `src/lib/api-error-handler.ts:89-98`; Gegenbeispiel `src/lib/api-error-handler.ts:41-51` | P2 |
| C10 | Musik kommt als Base64-Daten-URL im JSON, bei 300 s Laufzeit grob 5–7 MB Antwortkörper. | `src/app/api/compose/route.ts:103-112`; `src/app/api/compose/route.ts:15,66,83` | P2 |
| C11 | TTS und STT ignorieren BYOP, und der Titel-Endpunkt ruft `gemini-fast` auf dem Server-Schlüssel, obwohl das Modell als kostenpflichtig markiert ist. | `src/ai/flows/tts-flow.ts:28-30`; `src/app/api/tts/route.ts:35`; `src/ai/flows/stt-flow.ts:7`; `src/app/api/chat/title/route.ts:86,106`; `src/config/chat-options.ts:57-70` | P2 |
| C12 | Nur `X-Pollen-Key` wird gelesen, ein Standard-Client mit `Authorization: Bearer` fällt lautlos auf den Betreiber-Schlüssel zurück; CORS-Header existieren nicht. | `src/lib/resolve-pollen-key.ts:10,13-15`; zweiter Leser `src/lib/pollen-cost-guard.ts:29-32`; `next.config.ts:5-17` (nur Security-Header) | P2 |
| C13 | Acht Stellen lesen den JSON-Body ohne Behandlung eines Parse-Fehlers; aus einem abgeschnittenen Body wird 500 `INTERNAL_ERROR` statt 400. | `generate:68`, `chat/completion:137`, `chat/title:54`, `tts:30`, `media/ingest:21`, `compose:28`, `enhance-prompt:261`, `pollen/polly:47` | P2 |
| C14 | Es gibt keinen Share, keine öffentliche URL und kein Remix; der einzige Rücklesepfad ist der Pruna-Status. | `rg -n 'navigator.share|permalink|publicUrl' src` → 0 Treffer; `src/app/api/pruna/status/route.ts:23-35` | P2 |

## Wellen

### W1 — Fehlerform, Körper, Schlüssel (additiv)

**Ziel:** Jede Route antwortet in derselben Form, ein kaputter Body ergibt 400 mit einem Code, `Authorization: Bearer` wird gelesen, und die Chat-Antwort nennt das tatsächlich verwendete Modell. Kein bestehendes Feld ändert Bedeutung; `PlaygroundShell.tsx:121` liest die neue Form schon (`src/lib/errors/read-error-response.ts:16-60`).

**Schritte**

1. Neuen Helfer `src/lib/api-json-body.ts` anlegen: `readJsonBody(request, { maxBytes, tooLargeMessage })` ruft `readBodyWithLimit` (`src/lib/upload/read-body-with-limit.ts:18-40`) und fängt den Parse-Fehler ab, wirft `ApiError(400, 'Request body is not valid JSON', 'VALIDATION_ERROR', { reason: 'invalid-json' })`. Danach die acht Stellen umstellen: `generate:68`, `chat/completion:137`, `chat/title:54`, `tts:30`, `media/ingest:21`, `compose:28`, `enhance-prompt:261`, `pollen/polly:47`. Warum: heute wird daraus 500 `INTERNAL_ERROR` über `src/lib/api-error-handler.ts:56-64`. Kein neuer Fehlercode, damit `describe-error.ts:16` (voller `Record<ErrorCode, …>`) und die deutschen Sätze unverändert bleiben.
2. `code` und `requestId` an allen Fehlerantworten: `handleApiError` erzeugt eine Request-ID, gibt sie als Header `x-request-id` und im Body zurück (`src/lib/api-error-handler.ts:27-65`). Die vier Routen ohne zentralen Handler bekommen `try/catch` + `handleApiError`: `src/app/api/capabilities/route.ts:9-13`, `pollen/account:8-51`, `pollen/image-models:9`, `pollen/polly/models:9`; die Erfolgsantworten bleiben Wort für Wort. Die 15 übrigen Dateien bekommen an jeder `error:`-Antwort einen Code aus `src/lib/errors/error-codes.ts:2-11`. Warum: der Client liest `code` bereits (`read-error-response.ts:31-46`), und die Übersetzungstabelle existiert (`describe-error.ts:148-151` gibt `null` für unbekannte Codes).
3. `validateRequest` mit vollständigen Details (`src/lib/api-error-handler.ts:82-100`): zusätzlich `details.fields` mit allen Fehlern aus `result.error.errors` (Pfad + Nachricht), `details.field` bleibt das erste Feld wie bisher. Warum: ein Client oder Agent kann sich mit einem Versuch korrigieren; `read-error-response.ts:44-52` liest beide Formen, also bricht nichts.
4. `Authorization: Bearer <key>` als zweite Schlüsselquelle (`src/lib/resolve-pollen-key.ts:9-16`): nur wenn `X-Pollen-Key` fehlt, nur bei exaktem Präfix `Bearer `, Wert durch `normalizePollenKey` (`src/lib/pollen-key-validation.ts:4-12`). `hasUserKey` in `src/lib/pollen-cost-guard.ts:29-32` wird auf `hasUserProvidedPollenKey` umgestellt, damit es genau einen Header-Leser gibt. Warum: heute fällt ein Standard-Client lautlos auf den Betreiber-Schlüssel zurück, und zwei Leser würden auseinanderlaufen.
5. Smart-Router sichtbar machen (C5, additiv): Antwortfelder `model` und `routedModelId`, `requestedModelId`, `strategy` in `src/app/api/chat/completion/route.ts:312-321`; `skipSmartRouter` an Schema (`:68`) und Route dokumentieren. Warum: der Austausch ist heute unsichtbar, und der Ausweg ist unbekannt.
6. Tests: siehe Verifikation.

**Dauer:** 3 Halbtage.

**Abnahmekriterium:** Ein abgeschnittener Body liefert 400 mit `code` und `details`, jede Fehlerantwort trägt einen Code aus `ERROR_CODES` und eine `x-request-id`, ein Aufruf mit `Authorization: Bearer` läuft mit eigenem Schlüssel, und die Chat-Antwort nennt das geroutete Modell.

**Explain twice + Why.** Normal: Wir vereinheitlichen die Sprache, in der das System Nein sagt — überall dieselbe Form, ein maschinenlesbarer Code, alle falschen Felder, eine Vorgangsnummer. Einfacher: Das Haus bekommt eine einheitliche Türklingel für Fehler, und der Türsteher lässt auch den Standardausweis durch. Warum: der billigste Nutzen im ganzen Strang, weil die Gegenstücke — Fehlercodes, Übersetzungstabelle, Fehlerleser im Client — schon existieren und nur nicht angeschlossen sind (`read-error-response.ts:16-60`, `error-codes.ts:2-11`); gleichzeitig ist es die Voraussetzung dafür, dass ein Agent sich selbst korrigieren kann.

### W2 — Ursachen sichtbar machen

**Ziel:** Fehler nennen den Grund, die Voice-Routen reichen den Nutzerschlüssel durch, der Titel-Endpunkt kostet den Betreiber nichts mehr, und der Text-Endpunkt liefert die Felder, die ein Client erwartet.

**Schritte**

1. C6: Upstream-Fehler behalten ihren Status (kein pauschales 502), bekommen `code` und `details.upstreamStatus` plus eine gekürzte Upstream-Nachricht in `src/app/api/chat/completion/route.ts:249-305`. Der Timeout aus `src/lib/https-post.ts:18,69-72` wird zu `ApiError(504, …, 'PROVIDER_UNAVAILABLE', { timeoutMs })` statt generischem `Error`. Zusätzlich `request.signal` an den Upstream-Aufruf durchreichen, damit ein abgebrochener Client den Lauf beendet. Warum: heute sieht der Client nichts vom Grund, und ein Timeout sieht aus wie ein Programmfehler.
2. C11, Voice: `src/app/api/tts/route.ts:35` übergibt den Request, `textToSpeech` bekommt den Schlüssel als Parameter statt ihn in `src/ai/flows/tts-flow.ts:28-30` aus der Umgebung zu lesen; dasselbe für STT (`src/ai/flows/stt-flow.ts:7`). Warum: `src/lib/resolve-pollen-key.ts:7` erklärt sich als einzige Quelle, und heute zahlt jeder Voice-Nutzer mit dem Betreiber-Schlüssel.
3. C11, Titel: `src/app/api/chat/title/route.ts:106` läuft hart auf `gemini-fast`, das in `src/config/chat-options.ts:57-70` als `isFree: false` markiert ist. Vorgabe: Titel auf einem freien Standardmodell erzeugen; wer das kostenpflichtige Modell behalten will, hängt `assertKeyForPaidModel` (`src/lib/pollen-cost-guard.ts:69-82`) davor und lässt die Route auf den Fallback-Titel zurückfallen (`chat/title/route.ts:117-121`). Warum: pro Chat läuft heute ein bezahlter Lauf auf der Betreiberrechnung, außerhalb jeder Kostenprüfung.
4. C4, additive Felder: Antwort in `src/app/api/chat/completion/route.ts:312-321` um `id`, `model`, `created`, `finish_reason` und `usage` ergänzen, soweit der Upstream sie liefert; nichts erfinden, was nicht zurückkommt. `pollinationsResponse.body` ist an dieser Stelle schon geparst (`:307`). Warum: ein OpenAI-Client bricht ohne diese Felder oder zeigt leere Metadaten.
5. Tests: siehe Verifikation.

**Dauer:** 4 Halbtage.

**Abnahmekriterium:** Ein Upstream-Fehler liefert den Upstream-Status und einen Code, ein Timeout liefert 504 statt 500, TTS/STT laufen mit dem Nutzerschlüssel, und die Chat-Antwort trägt die Standardfelder, soweit der Anbieter sie liefert.

**Explain twice + Why.** Normal: Wir reichen die Ursache durch, statt sie im Log zu begraben, und schließen die zwei Stellen, an denen der Betreiber-Schlüssel ohne Prüfung arbeitet. Einfacher: Das System sagt jetzt, wer nein gesagt hat und warum, und zwei Nebenwege zahlen nicht mehr aus der Haushaltskasse. Warum: Der Betreiber kann heute nicht unterscheiden, ob ein Modell überlastet ist, ein Kontingent leer ist oder der Code einen Fehler hat; genau diese Unterscheidung braucht jede spätere Wiederholungslogik.

### W3 — Der Außenvertrag (Einbahnstraßen und sichtbare Änderungen)

**Ziel:** Die Seite ist für Maschinen auffindbar und aufrufbar, Läufe sind wiederholbar, Musik verlässt den JSON-Körper, es gibt einen Ausgang nach außen, und anonyme Aufrufe haben eine sichtbare Grenze. Diese Welle ist keine Runde, sondern acht; jeder Schritt braucht eine eigene Freigabe nach `AGENTS.md`.

**Schritte**

1. C2, Identität (1 Halbtag): `src/lib/rate-limit.ts:48-58` bekommt eine Identitätsfunktion in einem eigenen Modul (Schlüssel-Fingerprint, sonst IP, sonst eigener Eimer statt des gemeinsamen `unknown`), eine dokumentierte Vertrauensregel für die Reihenfolge in `x-forwarded-for` je Plattform und einen Tageszähler (`windowMs: 86_400_000`). Die 11 Routen ohne Limit bekommen eines, `capabilities` bleibt frei (kein Upstream-Aufruf, `src/app/api/capabilities/route.ts:9-13`). Warum: der Zustand pro Prozess ist auf `apphosting.yaml:7` exakt und auf Vercel bestenfalls eine Näherung; ein externer Speicher wäre eine eigene Entscheidung (siehe offene Frage 3).
2. P0-C1, Tagesgrenze (1 Halbtag): Auf den Routen mit Modellkosten prüft ein Tagesbudget pro Identität, bevor der Upstream-Aufruf startet (`src/app/api/generate/route.ts:96`, `src/app/api/compose/route.ts:54`, `src/app/api/enhance-prompt/route.ts:279`); Ablehnung als `429` oder `402` mit einem Code, den `describe-error.ts:16` kennt, plus `Retry-After` und einem Hinweis in der Oberfläche. Die Begründung, warum das die ehrliche Obergrenze ist, steht im Realitätscheck. Warum: ohne Grenze ist der Betreiber-Schlüssel ein offenes Konto.
3. C3, zweiphasig (3 Halbtage): `/api/generate` bekommt einen ausdrücklichen asynchronen Modus (`202 { runId, pending: true, provider, modelId }`) nach dem Muster, das Pruna schon fährt (`src/app/api/generate/route.ts:237-243`, `src/app/api/pruna/status/route.ts:23-35`); für den Pollinations-Pfad, der kein Job-Handle hat, wird das Zeitbudget in `src/lib/media/server-media-ingest.ts:104` verkürzt und der Abbruch über `request.signal` durchgereicht, bis Strang A eine Run-Tabelle liefert. Der Standard bleibt vorerst blockierend; der Umschaltpunkt (Client pollt, Route antwortet immer 202) ist die sichtbare Änderung und kommt zuletzt. Warum: bei einer Instanz wartet heute die gesamte Nutzerschaft auf einen einzelnen Lauf.
4. C4, Entscheidung und Umsetzung (2 Halbtage): neue Route `src/app/api/v1/chat/completions/route.ts` als dünne Übersetzungsschicht auf dieselbe Logik, bestehende Routen bleiben unangetastet. `/api/pollen/polly` behält sein `.strict()` (`src/app/api/pollen/polly/route.ts:13-30`) und bekommt eine dokumentierte Antwort, wenn `stream: true` ankommt, statt der heutigen Sammelmeldung (`:48-55`). Warum: die Alternative wäre, `/api/chat/completion` auf `model` umzustellen, und das bricht jeden heutigen Aufrufer.
5. C8, Wiederholbarkeit (2 Halbtage, hängt an Strang A): `src/app/api/generate/route.ts:357` und `src/lib/pruna/deliver.ts:65-68` liefern zusätzlich `id`, `modelId`, `provider`, `seed`, `createdAt`; der Header `Idempotency-Key` wird angenommen. Was von A gebraucht wird und was bis dahin zwischengespeichert wird, steht unter „Abhängigkeit A" im Realitätscheck. Warum: ohne stabile Feldnamen kann kein Agent einen Lauf wiederfinden, und ohne Schlüssel zahlt ein Wiederholungsversuch doppelt.
6. C10, Musik (1 Halbtag): `src/app/api/compose/route.ts:103-112` liefert `audioUrl` als Speicher-URL mit `contentType`, `duration` und `expiresAt`; der Client (`src/hooks/useComposeMusicState.ts:101-111`, `src/components/page/ChatInterface.tsx:73-84`, `src/components/chat/AudioMessage.tsx:82,95`) behält den Feldnamen. Der Daten-URL-Weg bleibt über ein ausdrückliches `inline: true` erreichbar, solange die Ablage nicht steht. Warum: 5–7 MB im JSON blockieren jede maschinelle Nutzung, und eine ablaufende URL ohne Ablage würde gespeicherte Musik nachträglich verderben.
7. C1, Discoverability (2 Halbtage): `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/manifest.ts` nach den Konventionen dieser Next-Version (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/` enthält `robots.md`, `sitemap.md`, `manifest.md`), dazu `metadataBase`, `openGraph`, `twitter`, `alternates` in `src/app/layout.tsx:10-19` und JSON-LD auf der Startseite. `llms.txt` erst, wenn die Routen aus Schritt 4 und 5 stehen. Warum: heute existiert nichts davon, und ohne `metadataBase` sind relative Vorschaubilder nicht auflösbar.
8. C14, Ausgang (2 Halbtage): Rezept als versioniertes Objekt (`heyhi.recipe/v1`) mit Kodierung in den URL-Fragmentpfad, `navigator.share` und Datei-Download; keine serverseitige Ablage. Die sichtbaren Bedienelemente liegen in Strang B. Warum: ohne Ausgang bleibt jede Agenten- und Teilen-Fähigkeit eine Ankündigung.

**Dauer:** 14 Halbtage (acht Teilrunden, jede einzeln freigabepflichtig).

**Abnahmekriterium:** `curl` findet `robots.txt`, `sitemap.xml` und `manifest.webmanifest`, ein zweiter identischer Aufruf mit demselben `Idempotency-Key` liefert dieselbe Antwort ohne zweiten Anbieter-Aufruf, ein Musikauftrag liefert eine URL statt eines mehrstelligen MB-Bodys, und ein anonymer Aufruf über der Tagesgrenze wird mit Code und Hinweis abgelehnt.

**Explain twice + Why.** Normal: Wir veröffentlichen die Fläche, geben Läufen eine Adresse und eine Identität und beenden die zwei Stellen, an denen das Produkt nach außen nichts hergibt. Einfacher: Die Maschine bekommt eine Haustür mit Klingelschild, eine Quittung für jeden Lauf und eine Rechnung, die nicht mehr offen im Flur liegt. Warum: Diese Schritte sind die einzigen im Strang, die später nur mit Migration oder Bruch zurückzunehmen sind — Feldnamen im Antwortkörper, die Entscheidung über die OpenAI-Route, die Bedeutung der Identität im Limiter und die Veröffentlichung von Metadaten.

## Realitätscheck

### Abweichungen vom Audit

1. `apphosting.yaml`: `maxInstances: 1` steht in Zeile 7, der Audit nennt `:5`.
2. `ERROR_CODES` enthält 32 Einträge (`src/lib/errors/error-codes.ts:2-11`), der Audit nennt 33.
3. Rate-Limiter: neun der zwanzig Routen rufen `checkRateLimit` auf, also fehlt das Limit in elf; der Audit nennt sechs. Die zwanzig Routendateien selbst stimmen (`rg --files -g 'route.ts' src/app/api` → 20).
4. Fehlerformat: gemessen 46 `error:`-Vorkommen in 15 Routendateien, davon 13 ohne jeden `code` (nur `sound:60` und `generate:63` setzen `RATE_LIMITED`). Die Verteilung stimmt, die Zahl 33 im Audit ist zu niedrig.
5. P0-2.3: 13 Routen rufen `resolvePollenKey` auf (`rg -n 'resolvePollenKey\(' -g 'route.ts' src/app/api`), zwei weitere Routen lesen den Umgebungsschlüssel direkt in ihren Flows (`src/ai/flows/tts-flow.ts:28`, `src/ai/flows/stt-flow.ts:7`) — zusammen 15 statt der genannten zwölf.
6. C13: `src/app/api/generate/route.ts:68` ist kein `JSON.parse`, sondern `await request.json()`; das Ergebnis ist dasselbe, der Fehler landet unbehandelt in `src/lib/api-error-handler.ts:56-64`.
7. `src/app/layout.tsx`: das Metadatenobjekt endet in Zeile 19, der Audit nennt 10-18.
8. C3 ist bestätigt; ergänzend existiert eine zweite 202-Quelle in `src/app/api/pruna/status/route.ts:34`, die der Audit nicht nennt.

### Abhängigkeit A (Idempotency-Key)

Der Idempotency-Key gehört an das Run-Objekt aus Strang A, weil nur ein Lauf eine Adresse hat, die ein zweiter Aufruf wiederfinden kann. **Gebraucht wird von A:** eine clientseitig erzeugte Lauf-ID, die der Server akzeptiert, und eine Ablage für den Laufzustand, die den Prozess überlebt. **Solange A nicht gebaut ist**, nimmt die Route den Header trotzdem an und führt ein prozesslokales Kurzzeitjournal (Map mit TTL 15 Minuten, Schlüssel aus `Idempotency-Key` + Routenname + Hash des normalisierten Bodys). **Zwischengespeichert wird** der vollständige Antwortkörper des ersten Aufrufs (Status, Body, `createdAt`, Body-Hash) und im Pruna-Fall die `predictionId` — keine Mediendaten, nur Metadaten. Ein Wiederholungsaufruf liefert denselben Körper mit `Idempotency-Replayed: true`; derselbe Schlüssel mit anderem Body ergibt 409 mit eigenem Code (neuer Eintrag in `ERROR_CODES` und in der Tabelle `src/lib/errors/describe-error.ts:16`, sonst bricht `npm run typecheck`). Ehrliche Kennzeichnung: der Header `X-Idempotency: process-local` steht an jeder Antwort, weil das Journal bei mehreren Instanzen nicht trägt und `apphosting.yaml:7` diesen Zustand nur für die aktuelle Bereitstellung garantiert.

### Berührte Verträge und Haken

- `readErrorResponse` (`src/lib/errors/read-error-response.ts:16-60`) und sein Test: liest `{error: string}` **und** `{error: {message, code}}`, dazu `details.field`, `details.modelLabel` und Array-Details. Deshalb bleibt `error` in jeder Antwort ein String; `code` und `details` kommen daneben. Abgefangen durch einen erweiterten Test.
- `describeError` (`src/lib/errors/describe-error.ts:148-151`): liefert `null` für unbekannte Codes, und die Tabelle ist ein voller `Record<ErrorCode, …>` (`:16`). Neue Codes brauchen also immer einen Tabelleneintrag; W1 führt deshalb keine neuen Codes ein.
- `validateRequest` (`src/lib/api-error-handler.ts:82-100`): `details.field` wird von der Oberfläche gelesen. Der Plan behält es und ergänzt `details.fields`.
- `resolvePollenKey`/`hasUserProvidedPollenKey` (`src/lib/resolve-pollen-key.ts:9-20`): 13 Aufrufstellen. Die Priorität bleibt (Nutzer-Schlüssel schlägt Umgebung); `hasUserKey` in `src/lib/pollen-cost-guard.ts:29-32` wird auf dieselbe Funktion umgestellt.
- `readBodyWithLimit` (`src/lib/upload/read-body-with-limit.ts:18-40`): wird nicht verändert, nur aufgerufen; `media/upload:37` bleibt unberührt.
- `checkRateLimit` (`src/lib/rate-limit.ts:48-70`): neun Aufrufer, Signatur bleibt, Identität und Tageszähler kommen additiv dazu. Die bestehenden Limits werden nicht gesenkt.
- `useComposeMusicState` (`src/hooks/useComposeMusicState.ts:101-111`) und `ChatInterface.tsx:73-84`: der Feldname `audioUrl` bleibt, die Bedeutung wechselt von Daten-URL zu Adresse mit Ablaufdatum. Abgefangen durch `inline: true` als Übergang und `expiresAt` im Body.
- `/api/generate`-Antwortkörper (`src/app/api/generate/route.ts:357`, `src/lib/pruna/deliver.ts:65-68`): einziger Aufrufer ist `requestGeneration` (`src/lib/generation/request-generation.ts:49`), genutzt von `src/app/create/PlaygroundShell.tsx:342` und `src/lib/services/chat-service.ts:141`; alle neuen Felder sind zusätzlich.
- `skipSmartRouter` (`src/app/api/chat/completion/route.ts:68,146,168`; Aufrufer `src/lib/services/chat-service.ts:63-64`, `src/lib/chat/chat-send-coordinator.ts:454`, `src/lib/chat/chat-send-orchestrator.ts:93`, `src/lib/services/memory-service.ts:38`): nur Dokumentation und Antwortfelder, keine Semantikänderung.

### Außenvertrag oder Innenleben

- **Nur innen, kein Vertrag nach außen:** C7, C9, C13, C12, die Antwortfelder aus C5 und die Codes aus C6. Sie ändern nur, was zusätzlich in einer Antwort steht.
- **Außenvertrag mit Übergang nötig:** C4 (neue Route neben der alten), C3 (asynchroner Modus hinter einem ausdrücklichen Feld, Standard bleibt), C8 (neue Feldnamen und Header, additiv), C10 (Bedeutung von `audioUrl`), C2 (spürbare Limits), P0-C1 (neue Ablehnung), C14 (neues Format `heyhi.recipe/v1`), C1 (Veröffentlichung).
- **Versionierung:** `/api/generate` und `/api/chat/completion` bleiben unversioniert und additiv; die OpenAI-Fläche bekommt mit `/api/v1/chat/completions` einen eigenen Pfad, das Rezept die Versionsangabe im Namen. Kein Bruch in bestehenden Pfaden.

### Was ist die einfachere Variante?

- Fehlerform: die bestehende `{error, code, details, timestamp}`-Form behalten und `code`/Felder ergänzen, statt auf `{error: {…}}` umzubauen.
- Body-Prüfung: ein kleiner Helfer vor den acht Stellen statt einer Umbauaktion an jeder Route.
- OpenAI-Form: eine dünne zweite Route über derselben Logik statt Umbau der bestehenden.
- Rate-Limit: Identität und Tageszähler im vorhandenen Modul, solange `maxInstances: 1` gilt; ein externer Speicher wäre erst bei mehreren Instanzen nötig.
- Musik: eine gespeicherte URL plus `inline`-Schalter statt eines neuen Antwortformats.
- Discoverability: `robots.ts`, `sitemap.ts`, `manifest.ts` als wenige Dateien in `src/app` statt einer `middleware.ts`.

### Einbahnstraßen

1. Feldnamen im Antwortkörper von `/api/generate` (Schritt W3.5) — einmal veröffentlicht kaum umbenennbar.
2. Die Entscheidung „eigene OpenAI-Route oder Änderung der bestehenden" (W3.4) bestimmt, welche Aufrufer für immer welche Felder senden.
3. Die Identität im Limiter und erst recht ein externer Speicher (W3.1) — ein späterer Wechsel entwertet alle laufenden Zählerstände und kostet einen Dienst.
4. Die Veröffentlichung von `sitemap` und `llms.txt` (W3.7) — einmal indexiert, ist Rücknahme langsam.
5. Öffentliche Share-Adressen (W3.8) — sobald es eine öffentliche URL gibt, braucht sie Moderation und Aufbewahrungsregeln.
6. Die Idempotenz-Semantik selbst: TTL, Konfliktverhalten und „wird der Fehler mitgespeichert" sind nach der ersten Client-Integration nur noch mit Bruch änderbar.

### Wo „Verschlimmbesserung" lauert

- Die Fehlerform umbauen und damit `read-error-response.ts` sowie die Übersetzung in `PlaygroundShell.tsx:121-122` brechen.
- Einen zweiten Header-Leser einführen oder `Authorization: Bearer` ohne Formatprüfung als Nutzerschlüssel zählen: ein fremdes Bearer-Token würde als BYOP gelten, die Kostenprüfung umgehen und den Aufruf mit einem fremden Schlüssel scheitern lassen.
- Die JSON-Härtung stillschweigend einbauen: aus heute 500 wird 400, aber die Oberfläche zeigt weiter den englischen Rohtext. Die neuen 400er brauchen `code` und `details`, sonst wandert die Verwirrung nur.
- Eine Tagesgrenze pro IP einführen, ohne die eigene Browser-Oberfläche zu bedenken: die App ruft selbst ohne Schlüssel auf, also trifft die Grenze die eigenen Nutzer zuerst. Sie muss großzügig sein, im Antwortheader `X-Pollen-Budget-Remaining` sichtbar und in der Oberfläche erklärt.
- Musik auf eine URL umstellen, ohne die Ablage: die gespeicherte Adresse läuft ab, und die Galerie verliert den Ton nachträglich.
- Den 180-Sekunden-Pfad verkürzen, ohne dem Client eine Adresse zu geben: der Nutzer sieht dann schneller einen Fehler statt eines Ergebnisses.

### Der ehrliche Kostenschutz (P0-2.3)

Ohne Konto gibt es keine Identität, und ohne Identität gibt es keinen Spend-Cap. Was heute existiert, ist eine Sperre für Modelle, die positiv als kostenpflichtig bekannt sind (`src/lib/pollen-cost-guard.ts:44-82`), und ein Rückfall auf den Server-Schlüssel für alles andere (`src/lib/resolve-pollen-key.ts:13-15`). Ein Tageslimit pro IP ist die einzige Grenze, die ohne Konto überhaupt adressierbar ist, aber sie ist eine Bremse, keine Rechnung: IPs sind geteilt (Mobilfunk, NAT), sie wechseln, und die Vertrauenswürdigkeit des `x-forwarded-for`-Kopfes hängt an der Plattform (`src/lib/rate-limit.ts:53-55`). Ehrlich ist deshalb genau das: ein Modell, das Geld kostet, bleibt ohne Nutzerschlüssel gesperrt; alles andere läuft anonym mit einem Tageskontingent pro IP, das im Antwortheader und in der Oberfläche sichtbar ist; der Betreiber bekommt zusätzlich eine Warnung aus dem Anbieterkonto, die außerhalb dieses Repos liegt. Wer eine echte Obergrenze will, braucht Identität — Konto oder Pflichtschlüssel. Das ist eine Produktentscheidung, keine Codefrage, und sie steht als offene Frage 3.

## Verifikation

Nach jedem Schritt, in dieser Reihenfolge, jeweils mit gestoppten Hintergrundprozessen:

```
npm run typecheck
npm run lint
npm run test
```

Gezielte Läufe (vorhandene Dateien):

```
npx jest src/lib/rate-limit.test.ts src/lib/errors/read-error-response.test.ts
npx jest src/app/api/chat/completion/route.test.ts src/app/api/generate/route.test.ts
npx jest src/app/api/pollen/polly/route.test.ts src/app/api/compose/route.test.ts
npx jest src/app/api/tts/route.test.ts src/app/api/stt/route.test.ts src/app/api/chat/title/route.test.ts
```

Neue Testdateien:

- `src/lib/api-json-body.test.ts` (neu): abgeschnittener Body ergibt `ApiError` 400 mit `code: 'VALIDATION_ERROR'` und `details.reason`; zu großer Body behält den 413-Pfad aus `src/lib/upload/read-body-with-limit.ts:23-26`; gültiger Body kommt unverändert durch.
- `src/lib/api-error-handler.test.ts` (neu): `validateRequest` liefert `details.fields` mit allen Fehlern und `details.field` mit dem ersten; `handleApiError` gibt `x-request-id` zurück; ein unbekannter Fehler bleibt 500 `INTERNAL_ERROR`.
- `src/lib/resolve-pollen-key.test.ts` (neu): `X-Pollen-Key` schlägt `Authorization`; `Bearer <gültig>` wird gelesen; `Bearer` mit unzulässigen Zeichen wird ignoriert und die Umgebung greift; `hasUserProvidedPollenKey` und `hasUserKey` stimmen überein.
- `src/lib/rate-limit.test.ts` (erweitern): fehlender IP-Kopf fällt in einen eigenen Eimer; zwei Identitäten teilen sich kein Fenster; der Tageszähler läuft über das Minutenfenster hinaus; `_resetRateLimitForTesting` (`src/lib/rate-limit.ts:43-46`) bleibt wirksam.
- `src/app/api/chat/completion/route.test.ts` (erweitern): Antwort trägt `model`, `routedModelId` und `strategy`; ein Upstream-Fehler trägt `details.upstreamStatus`; ein Parse-Fehler im Body ergibt 400 statt 500.
- `src/app/api/generate/route.test.ts` (erweitern): Antwort trägt `seed`, `modelId`, `provider`; zweiter Aufruf mit demselben `Idempotency-Key` löst keinen zweiten Anbieter-Aufruf aus (Mock zählt Aufrufe); derselbe Schlüssel mit anderem Body ergibt 409.
- `src/app/api/compose/route.test.ts` (erweitern): `audioUrl` ist keine `data:`-URL (W3), `expiresAt` und `contentType` sind gesetzt; der `inline: true`-Weg liefert weiter die Daten-URL.

Manuelle Prüfung, mit lokal gestartetem Server in Phase 4 (keine Browser-Werkzeuge, `browser_subagent` und `read_browser_page` bleiben gesperrt):

```
curl -sS -w '\n%{http_code}\n' -X POST http://localhost:3000/api/chat/completion \
  -H 'Content-Type: application/json' -d '{"messages":['
curl -sS -D - -o /dev/null -X POST http://localhost:3000/api/generate \
  -H 'Content-Type: application/json' -H 'Authorization: Bearer test-key' \
  -d '{"prompt":"x","model":"flux"}'
curl -sS -X POST http://localhost:3000/api/generate -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: 11111111-1111-1111-1111-111111111111' \
  -d '{"prompt":"x","model":"flux"}'
curl -sS http://localhost:3000/robots.txt
curl -sS http://localhost:3000/manifest.webmanifest
```

Erwartet: abgeschnittener Body → 400 mit `code` und `details`; `Bearer`-Aufruf läuft auf dem Aufrufer-Schlüssel; der zweite Aufruf mit gleichem Schlüssel liefert dieselbe Antwort mit `Idempotency-Replayed`; `robots.txt` und `manifest.webmanifest` antworten mit 200. Kein Testlauf und kein Serverstart in diesem Auftrag.

## Nicht in diesem Plan

- Run-Objekt, Abbruch, Dexie-Run-Tabelle, Besitz und Freigabe (Strang A) — hier steht nur, was der Vertrag von A braucht.
- Fehlertexte, Übersetzungen, Tastatur, Semantik, Kontrast, Marke (Strang B).
- CI, `jsx-a11y`, `jest-axe`, Testbasis (Strang D).
- MCP-Server, Befehlsschicht und Rezept-Fortsetzungsvorschläge aus §6 des Audits; hier stehen nur ihre API-seitigen Voraussetzungen (C8, C14).
- Keine Änderung an `docs/DEEP_AUDIT_2026-09-10.md`, keine Änderung an der Modell-Registry, keine Verschlüsselung (Phase 3 des Projekts).
- Kein neuer externer Dienst (Redis, Upstash, Konto bei einem Anbieter) — das wäre erst mit offener Frage 3 zu entscheiden.

## Offene Fragen an den Nutzer

1. **C4:** Eigene Route `/api/v1/chat/completions` im OpenAI-Format neben den bestehenden Routen — oder die bestehende Route umbauen und damit jeden heutigen Aufrufer brechen? Empfehlung: die neue Route, die alte bleibt unverändert.
2. **C8/C14:** Feldnamen flach (`seed`, `modelId`, `provider`) oder in einem genesteten `meta`-Objekt, und reicht für den Ausgang ein Rezept im URL-Fragment (`/#r=…`) ohne serverseitige Ablage — oder soll es öffentliche Adressen geben, die Moderation und Aufbewahrung nach sich ziehen? Empfehlung: flache Felder und das Fragment.
3. **P0-C1:** Ist die ehrliche Fassung — kostenpflichtige Modelle ohne Nutzerschlüssel gesperrt, alles andere anonym mit sichtbarem Tageskontingent pro IP — akzeptiert, oder soll anonymes Erzeugen ganz entfallen (nur mit eigenem Schlüssel oder Konto)? Ohne diese Antwort lässt sich die Tagesgrenze nicht festlegen, und ein echter Spend-Cap ist ohne Identität nicht möglich.
