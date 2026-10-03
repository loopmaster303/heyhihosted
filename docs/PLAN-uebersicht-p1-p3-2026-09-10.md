# Umsetzungspläne P1 bis P3 — Reihenfolge und Register

**Datum:** 2026-09-10
**Grundlage:** [`DEEP_AUDIT_2026-09-10.md`](./DEEP_AUDIT_2026-09-10.md), Abschnitt 3 (P1, 27 Befunde) und Abschnitt 4 (P2/P3, 18 Befunde)
**Status:** Phase 2 und 3 des `AGENTS.md`-Ablaufs. Kein Code geschrieben. Phase 4 beginnt erst nach ausdrücklicher Bestätigung.

Diese Datei ordnet. Sie ersetzt keinen der vier Strang-Pläne, sie sagt, in welcher Reihenfolge sie sich lohnen und was voneinander abhängt.

---

## 1. Die vier Stränge

| Strang | Plandatei | Verantwortlich für | P1 | P2/P3 |
| --- | --- | --- | --- | --- |
| A | [`PLAN-lauf-und-artefakt-2026-09-10.md`](./PLAN-lauf-und-artefakt-2026-09-10.md) | Lebenszyklus von Lauf und Artefakt: Zustand, Persistenz, Blobs, Speicher, Freigabe | 10 | 1 |
| B | [`PLAN-bedienbarkeit-2026-09-10.md`](./PLAN-bedienbarkeit-2026-09-10.md) | Oberfläche, Semantik, Tastatur, Text, Marke | 8 | 7 |
| C | [`PLAN-maschinenvertrag-2026-09-10.md`](./PLAN-maschinenvertrag-2026-09-10.md) | API, Routen, Fehlercodes, Antwortverträge, Discoverability, Ausgang | 8 | 7 |
| D | [`PLAN-fundament-2026-09-10.md`](./PLAN-fundament-2026-09-10.md) | CI, A11y-Gate, Testbasis, Nachweisbarkeit | 1 | 1 + 4 abgeleitete |

Drei Befunde aus Abschnitt 2 des Audits (P0) sind keine eigene Arbeit, sondern die Voraussetzung für Strang A: die verlorenen Medien, die stille Löschung beim 51. Chat und der fehlende Abbruch. Sie stehen deshalb in Plan A und nicht in einer eigenen Datei.

---

## 2. Reihenfolge über alle Stränge

Die Reihenfolge folgt nicht dem Schweregrad, sondern der Abhängigkeit: erst was andere Arbeit absichert, dann was Datenverlust beendet, dann was darauf aufbaut.

**Runde 1 — Nachweis und Kleinkram, unabhängig voneinander.**
CI-Lauf über `test`, `lint` und `typecheck` (D1), damit jede spätere Runde automatisch geprüft wird. Dazu die Tastatur- und Semantikarbeit mit fertigem Vorbild im selben Ordner (B1, B2, B3) und die Vertragsarbeit an den bestehenden Routen, die nichts umbaut: Fehlerformat vereinheitlichen, JSON-Parses absichern, Validierungsdetails mitliefern, `Authorization: Bearer` lesen (C7, C9, C12, C13).

**Runde 2 — Datenverlust beenden.**
Alles in Strang A, was ohne neues Schema geht: Medien, die den Reload überleben (P0-2.1), die stille Löschung beim 51. Chat (P0-2.2), Doppelklickschutz, Modellwahl, Fehlerzuordnung, Persistenz-Effect (A5 bis A8). Diese Runde ist die einzige mit direktem Schaden für den Nutzer und geht deshalb vor allem anderen außer Runde 1.

**Runde 3 — der Lauf bekommt einen Besitzer.**
Das Run-Journal mit Dexie-Schema-Version, Job-Handle, Abbruch, Besitz und Anzeige (A1 bis A4, A10, P0-2.5). Parallel: die Testbasis, die genau das absichert (D2 bis D4). Diese Runde ist die größte und die einzige, die eine Einbahnstraße enthält.

**Runde 4 — Oberfläche und Außenvertrag vollenden.**
Rest von B (Live-Region, Sprache, Kontrast, Reduced Motion, Landmarken, Marke, tote Microcopy) und Rest von C (zweiphasige Läufe, Endpunktform, Modellwahrheit im Antwortkörper, 502 mit Grund, Base64-Musik, BYOP in den Voice-Routen, Rate-Limit, Discoverability, Ausgang). Und die tote Logik aus A11.

**Was auf nichts wartet:** B1 bis B3, C7 bis C13 und D1. Diese acht Posten sind additiv und berühren keinen bestehenden Vertrag.

**Was blockiert:** C8 (Idempotency-Key und wiederholbare Generierung) wartet auf das Run-Objekt aus A. B7 (Live-Region für Läufe) wartet ebenfalls darauf. C1 (Discoverability) ist billig, aber sollte erst kommen, wenn der Vertrag stimmt, sonst beschreibt `llms.txt` Schnittstellen, die es so nicht gibt.

---

## 3. Befundregister

Alle 45 Befunde aus Abschnitt 3 und 4 des Audits, je genau einem Strang zugeordnet. Vierzehn Belegangaben des Audits waren ungenau; die berichtigten Werte stehen in §9 des Audits, und jeder Plan führt seine eigenen Abweichungen auf. Die Zählung deckt sich mit der Tabelle in §8 des Audits.

### Strang A — Lauf und Artefakt

| ID | Befund | Grad |
| --- | --- | --- |
| P0-A1 | Generierte Medien überleben den Reload nicht | P0 |
| P0-A2 | Der 51. Chat löscht still den ältesten Chat samt Assets | P0 |
| P0-A3 | Der Chat kann einen laufenden Lauf nicht abbrechen | P0 |
| A1 | Läufe leben nur im `useState` eines Tabs | P1 |
| A2 | Pruna-Läufe aus dem Chat überleben keinen Reload | P1 |
| A3 | Der BlobManager kann nichts freigeben | P1 |
| A4 | Zwei Schreiber, ein Asset, kein Merge | P1 |
| A5 | Keine In-Flight-Guards bei Uploads und Musik | P1 |
| A6 | Das Standard-Bildmodell überschreibt die Chat-Auswahl | P1 |
| A7 | Ein Bildspeicher-Fehler wird als Musikfehler gemeldet | P1 |
| A8 | Der Persistenz-Effect läuft bei jedem Render | P1 |
| A9 | Das Gedächtnis schreibt, liest aber nie | P1 |
| A10 | Beim Fertigwerden passiert nichts | P1 |
| A11 | Tote Logik: Backoff um einen String-Builder, ungenutzte Exporte | P2 |

### Strang B — Bedienbarkeit

| ID | Befund | Grad |
| --- | --- | --- |
| P0-B1 | Tastaturnutzer können Modus, Seitenverhältnis und Dauer nicht ändern | P0 |
| B1 | Hover-only-Aktionsleisten sind tabbar, aber unsichtbar | P1 |
| B2 | Galerie-Kacheln sind reine Maus-Ziele | P1 |
| B3 | `ModalPopup` ohne Dialog-Semantik | P1 |
| B4 | Vollbild-Vorschau und Lightbox sind für Screenreader nicht vorhanden | P1 |
| B5 | Mobile Sidebar ohne Semantik und ohne Escape | P1 |
| B6 | Keine Live-Region für asynchrone Chat-Zustände | P1 |
| B7 | Der Sprachschalter erreicht `/create` nicht | P1 |
| B8 | Die erste Sitzung ist ein leerer Bildschirm | P1 |
| B9 | Kontrast: Fehlerfarbe und Textstufen unter der Schwelle | P2 |
| B10 | Kein Skip-Link, keine `nav`-Landmarke, drei Ansichten ohne H1 | P2 |
| B11 | Sprachmix ohne `lang`-Auszeichnung | P2 |
| B12 | Reduced Motion punktuell statt systematisch | P2 |
| B13 | 31 hartkodierte Meldungstitel, 28 davon englisch | P2 |
| B14 | Beste Microcopy ist toter Code | P2 |
| B15 | Zwei Sackgassen-Routen mit englischem Banner | P2 |
| B16 | Kein automatisiertes A11y-Gate in der Lint-Konfiguration | P2 |
| B17 | Die Marke widerspricht sich | P2 |

### Strang C — Maschinenvertrag

| ID | Befund | Grad |
| --- | --- | --- |
| P0-C1 | Dreizehn Routen rufen `resolvePollenKey` auf und fallen ohne Nutzerschlüssel auf den Betreiber zurück; zwei weitere Flows lesen den Umgebungsschlüssel direkt | P0 |
| C1 | Für Maschinen existiert die Seite nicht | P1 |
| C2 | Der Rate-Limiter ist ein Prozess-Map, keine Identität | P1 |
| C3 | Der Chat-Pfad blockiert bis zu 180 s bei einer Instanz | P1 |
| C4 | Der Text-Endpunkt ist nicht OpenAI-förmig, der kompatible kann fast nichts | P1 |
| C5 | Modelle werden still ausgetauscht | P1 |
| C6 | Upstream-Fehler werden zu einem bedeutungslosen 502 | P1 |
| C7 | Das Fehlerformat ist über die Fläche inkonsistent | P2 |
| C8 | Generieren ist nicht wiederholbar | P2 |
| C9 | Validierungsdetails werden auf das erste Feld reduziert | P2 |
| C10 | Musik kommt als Base64-Daten-URL im JSON | P2 |
| C11 | Die Voice-Routen ignorieren BYOP | P2 |
| C12 | Nur `X-Pollen-Key` wird gelesen | P2 |
| C13 | Ungeguardete JSON-Parses | P2 |
| C14 | Es gibt keinen Ausgang nach außen | P2 |

### Strang D — Fundament und Nachweis

| ID | Befund | Grad |
| --- | --- | --- |
| D1 | Kein CI für Tests, Lint oder Typen | P1 |
| D2 | Kein automatisiertes A11y-Gate im Nachweis | P2 |
| D3 | Die 121 Testdateien laufen nur, wenn sie jemand lokal startet; fünf Module ohne Test | abgeleitet |
| D4 | Der Test-Mock für `matchMedia` steuert `matches` nicht | abgeleitet |
| D5 | Vorhandene Audit-Werkzeuge hängen an keinem CI-Lauf | abgeleitet |
| D6 | Keine gemeinsame Testbasis für Schema-Migration, Tastaturbedienung und Fehlervertrag | abgeleitet |

---

## 4. Was die drei Vorschläge aus §6 darauf aufsetzen

Die drei Ideen aus dem Audit sind keine vierte Warteschlange. Sie liegen auf den Strängen und werden erst nach deren Fundament sinnvoll.

**Vorschlag 1, die Befehlsschicht** steht auf Strang B. Die Registry braucht genau die Aktionsliste, die B ohnehin erheben muss, und die Pfeiltastensteuerung aus P0-B1 ist der erste Eintrag darin. Der Ansagekanal, der dabei verdrahtet wird, ist derselbe, den B6 braucht.

**Vorschlag 2, der laufende Betrieb** ist Strang A in seiner vollen Form. Run-Journal, Abbruch, Besitz und Anzeige sind die drei mittleren Wellen von A; der Unterschied ist nur, ob der Lauf zusätzlich eine Adresse für Maschinen bekommt. Diese Adresse ist C8.

**Vorschlag 3, Rezept statt Ergebnis** braucht C14 als Voraussetzung, weil ein Rezept ein Ausgang nach außen ist. Der Rezepttyp selbst ist eine Einbahnstraße und gehört deshalb in die gleiche Entscheidungsrunde wie das Run-Schema.

---

## 5. Einbahnstraßen

Entscheidungen, die später nur noch mit Migration oder Bruch zurückzunehmen sind. Sie brauchen vor Runde 3 eine ausdrückliche Antwort, nicht unterwegs.

1. **Dexie-Schema-Version und Indexwahl** für die Run-Tabelle (A). Additiv machbar, aber ein falsch gewählter Index wird später teuer.
2. **Run-Tabelle in Dexie oder im `localStorage`.** Dexie ist konsistent mit dem Rest, kostet aber eine Migration.
3. **Feldnamen im Antwortkörper von `/api/generate`** (C8). Effektiver Seed, aufgelöste Modell-ID und Provider lassen sich nachträglich ergänzen, aber einmal veröffentlicht kaum umbenennen.
4. **Eigene Route im OpenAI-Format oder Änderung der bestehenden** (C4). Die zweite Variante bricht jeden heutigen Aufrufer.
5. **Farbtoken für Fehlertext** (B9). Das ändert das Aussehen, das ist eine Gestaltungsentscheidung, keine Fehlerbehebung.
6. **Rezeptformat** (`heyhi.recipe/v1`), falls Vorschlag 3 kommt. Versionierte Formate sind nur mit Aufwand rückholbar.

---

## 6. Nachweis

Jeder Strang bringt seine eigenen Prüfschritte mit. Gemeinsam gilt:

- `npm run typecheck`, `npm run lint`, `npm run test` vor jedem Commit.
- Ab Runde 1 läuft dasselbe in CI, damit niemand es lokal vergessen kann.
- Für Tastatur- und Fokusarbeit gibt es keinen automatischen Nachweis, der eine manuelle Prüfung ersetzt. Die Prüfschritte stehen im jeweiligen Plan.
- Kein Strang startet Phase 4 ohne die Bestätigung nach `AGENTS.md`. Diese Übersicht selbst ist noch kein Auftrag.

---

## 7. Empfehlung

Runde 1 zuerst, und dort in der Reihenfolge: CI, Tastatur und Semantik, Fehlervertrag. Diese drei Posten sind zusammen deutlich kleiner als jede der späteren Runden, sie ändern kein sichtbares Verhalten zum Schlechteren und sie sorgen dafür, dass die folgenden Wellen überhaupt nachweisbar sind.

Danach Runde 2, weil sie den einzigen Schaden beendet, den der Nutzer heute nicht bemerkt: verlorene Medien und gelöschte Chats.

**Keine der vorgeschlagenen Änderungen wurde begonnen.**

---

## 8. Nachtrag 2026-09-10: was die gemessene API-Wahrheit an den Plänen ändert

Die API wurde am 2026-09-10 gegen `gen.pollinations.ai/openapi.json` (v0.3.0) und
live nachgemessen; die Fakten stehen in
[POLLINATIONS-API-2026-09-10.md](./POLLINATIONS-API-2026-09-10.md). Sechs Befunde
des Audits sind dadurch genauer, zwei sind erledigt, einer kommt hinzu.

**Genauer geworden, Strang C:**

| ID | vorher | jetzt |
| --- | --- | --- |
| C12 | "Nur `X-Pollen-Key` wird gelesen" | Die API akzeptiert genau zwei Formen: `Authorization: Bearer` und `?key=`. Ein proprietärer `X-Pollen-Key`-Header ist unsere Erfindung — beides lesen, den eigenen Header als Alias behalten |
| C4 | "Text-Endpunkt nicht OpenAI-förmig" | Der kompatible Weg ist `POST /v1/chat/completions` mit `stream`, `tools`, `reasoning_effort`, `prompt_cache_key`; `POST /v1/responses` existiert zusätzlich. Unser `/api/chat/completion` liefert heute JSON statt SSE — C4 ist damit eine Angleichung, kein Neubau |
| C6 | "Upstream-Fehler werden zu bedeutungslosem 502" | Die API hat eine kanonische Fehlerform `{status, success:false, error:{code,message}}` mit klarer Bedeutung: 400 Parameter, 401 Key, **402 Guthaben**, **403 Key darf das Modell nicht**, 429 Rate-Limit, 500 Server, 503 Safety. Ein 403 darf nie als 502 beim Nutzer ankommen |
| C8 | "Generieren ist nicht wiederholbar" | Der Anbieter **sagt selbst**: bei Timeout exakt denselben Request nochmal senden (Endpunkt, Body, Query, Seed unverändert). Die Generierung läuft nach dem Verbindungsabbruch weiter, die Wiederholung bekommt das laufende oder das gecachte Ergebnis — **abgerechnet wird nur einmal**. Unser 504 "Timed out waiting for media" ist damit kein Endzustand, sondern ein fehlender Retry |
| C10 | "Musik kommt als Base64-URL im JSON" | `POST /v1/audio/speech` liefert **binär** mit `content-type: audio/mpeg\|opus\|aac\|flac\|wav\|pcm` und setzt `Link: <media-URL>; rel="enclosure"`. Base64 ist unsere Umgehung, nicht die API-Form |
| C11 | "Voice-Routen ignorieren BYOP" | BYOP hat jetzt einen offiziellen Namen und Weg: **Connect User Wallets** — App-Key `pk_` als OAuth-`client_id`, Nutzer autorisiert per PKCE oder Device-Flow, wir bekommen ein befristetes `sk_`. Der frühere Weg (roher `pk_` im Browser) ist ausdrücklich **Legacy** |

**Erledigt:** C5 ("Modelle werden still ausgetauscht") ist durch die Kuration vom
2026-09-10 abgedeckt — die Auswahlliste liefert die Schluessel-Sicht, jeder
Eintrag trägt `runnable`. Die Legacy-Host-Bereinigung (vorher Teil des
Kurationsplans) ist durchgeführt.

**Neu, und zwar in Strang A — dort, wo Lebensdauer verhandelt wird:**

| ID | Befund | Warum er zählt |
| --- | --- | --- |
| A12 | **Hochgeladene und generierte Medien verfallen nach 30 Tagen** | `media.pollinations.ai` gibt Dateien 30 Tage; ein `GET` verlängert erst, wenn die Datei **mindestens 15 Tage** alt ist. Eine media-URL ist damit kein Besitz. Alles, was bleiben soll, muss bei uns liegen (BlobManager/IndexedDB) — genau die Schicht, die P0-A1 heute verliert |
| A13 | **Video ist mit dem Betreiber-Schlüssel nicht lieferbar** | `GET /video/models` antwortet mit Key mit **0** Einträgen, ohne Key mit 19. Jede Video-Zusage im Free-Tier ist heute unerfüllbar; Video braucht BYOP oder den Nutzer-Schlüssel |
| A14 | **Modell-Metadaten sind live, nicht gepflegt** | `max_reference_images`, `resolutions`, `input_modalities`, `supported_endpoints`, `video_capabilities`, `allowed_durations` stehen pro Modell in `/image/models`. Unsere Config pflegt dieselben Werte von Hand (`maxImages`, `supportsReference`, `resolution`) — eine Drift-Quelle, die sich abschalten lässt |
| A15 | **Safety ist ungenutzt** | `safe` (auch `Pollinations-Safe`-Header) und `required_safety` pro Modell sind da, wir setzen sie nirgends. Entweder bewusst dagegen entscheiden und das dokumentieren, oder `X-Safety-Applied`/Code `safety_error` auswerten |

**Was das für die Reihenfolge heißt:** Die Runden 1 bis 4 bleiben, wie sie sind.
Neu ist, dass in **Runde 1** zwei Posten dazukommen, die kein Schema anfassen und
sofort Schaden beenden: der Retry auf den identischen Request (C8) und die
durchgereichten Upstream-Fehlercodes (C6). Beide sind reine Serverarbeit, beide
sind heute falsch, und beide sind kleiner als jeder andere Posten der Runde.

**Eine offene Produktentscheidung, die nicht in einen Strang passt:** ob wir
`@pollinations/sdk` (5.0.0, ohne Runtime-Abhängigkeiten) einsetzen. Es würde die
handgeschriebenen Fetch-Schichten in `src/lib/pollinations/` und
`src/lib/media/` ersetzen. Der Nutzen ist Wartbarkeit, der Preis eine neue
Abhängigkeit in einem Repo, das heute bewusst dünn aufgestellt ist. Das gehört in
dieselbe Entscheidungsrunde wie die Einbahnstraßen aus §5, nicht in eine
Umsetzungsrunde.
