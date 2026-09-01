# Launch-Kriterien — Freigabeschwelle für `chat.hey-hi.cloud`

**Letzte Prüfung:** 2026-08-29 · **Geprüft von:** Phase 6 (Code und Muster; die Messungen
L-E.1/L-E.2 führt der Betreiber selbst durch — keine Agenten-Browser-Tests) · Audit
Phase 0–3 · Patch-Plan `PLAN-patch-p6-p7-nachaudit-2026-08-29.md`.

**Zweck:** Dieses Dokument beantwortet die Frage „Darf die Adresse öffentlich geteilt
werden?" mit Ja oder Nein. Es beschreibt beobachtbare Endzustände aus Nutzersicht —
wie sie hergestellt werden, steht in [`FAHRPLAN-create.md`](FAHRPLAN-create.md).

**Freigaberegel:** Alle Kriterien in **A–G und I–K** sind erfüllt → die Adresse darf
geteilt werden; L-I.1 und L-K.1 werden erst unmittelbar vor der Freigabe geprüft, weil
sie den fertigen Stand messen. Ein offenes Kriterium blockiert. Bereich **H** greift nur, falls der
ASCII-Flow gebaut wird (Phase 9 steht in Bereich M). Ein bewusst akzeptiertes Risiko
(**L**) blockiert nicht, muss aber schriftlich stehen. **M** gehört ausdrücklich nicht
zum Launch.

**Entscheidungen des Betreibers (2026-08-28), die diesem Dokument zugrunde liegen:**
- Impressum und DSGVO gelten als bewusst akzeptiertes Risiko (L-L.4), nicht als Gate.
- Der serverseitige Pollinations-Schlüssel bleibt; L-K.1 bleibt Gate. Pruna ist
  BYOP-only — serverseitig liegt kein Pruna-Schlüssel und soll keiner liegen
  (Entscheidung dokumentiert im Repo, 2026-08-28).
- Phase 9 (ASCII-Flow) ist nicht launchrelevant (Bereich M); L-H.1 gilt nur, falls sie
  gebaut wird.

**Format je Kriterium:** Kriterium (prüfbarer Satz, Präsens, ohne Adjektiv ohne
Messpunkt) · Prüfweg (ein Satz: wer klickt was, wo, und was muss dastehen) ·
Herkunft (Phase N | Abschlussprüfung vor der Freigabe) · Status.

**Die vier Statuswerte, abschließend:**

| Status | Bedeutung | Blockiert die Freigabe |
|---|---|---|
| `offen` | Nicht erfüllt oder nicht geprüft. | **ja** |
| `teilweise` | Ein Teil ist erfüllt und im Text benannt, ein anderer nicht. | **ja** — wie `offen` |
| `erledigt (Datum)` | Vollständig erfüllt und am genannten Datum geprüft. | nein |
| `akzeptiert (Betreiber, Datum)` | Nur in Bereich L. Bewusst getragenes Risiko. | nein |

`teilweise` ist keine dritte Farbe zwischen offen und erledigt: es blockiert genauso,
sagt aber der nächsten Sitzung, wo sie ansetzt. Ein Kriterium ohne einen dieser vier
Werte ist ein Fehler im Dokument.

---

## A — Erreichbarkeit und Identität *(Phase 2)*

**L-A.1 — Create ist unter einer eigenen Adresse erreichbar**
Kriterium: `https://chat.hey-hi.cloud/create` liefert die Create-Oberfläche,
`https://chat.hey-hi.cloud/` den Chat. Der alte Pfad `/playground` leitet auf `/create`.
Prüfweg: Alle drei Adressen in einem frischen Browserprofil öffnen; Titel und erster
sichtbarer Bereich stimmen mit der Erwartung überein, `/playground` landet auf `/create`.
Herkunft: Phase 2
Status: erledigt (2026-08-29)
> Live geprüft 2026-08-29 gegen `chat.hey-hi.cloud`: `/` → 200 (Chat), `/create` →
> 200 (Create), `/playground` → 307 mit `location: /create`.

> **Betreiberentscheidung 2026-08-29:** Kein `create.hey-hi.cloud`. Ein zweiter
> Hostname ist ein zweiter Browser-Ursprung und würde IndexedDB und localStorage
> teilen — getrennte Galerie, Schlüssel zweimal, Phase 5 nicht mehr baubar. Create
> lebt deshalb als Pfad auf demselben Ursprung. Die `CREATE_HOST`-Regeln in
> `next.config.ts` bleiben schlafend liegen, falls die Entscheidung je kippt.

**L-A.2 — Rückweg Create → Chat mit einem Klick**
Kriterium: Im Create gibt es ein sichtbares Element, das mit einem Klick zum Chat führt.
Prüfweg: Im Create das Rückkehrelement anklicken; der Chat ist geladen.
Herkunft: Phase 2
Status: erledigt (2026-08-28)

**L-A.3 — Hinweg Chat → Create mit einem Klick**
Kriterium: Im Chat gibt es ein sichtbares Element, das mit einem Klick ins Create führt.
Prüfweg: Im Chat das Element anklicken; das Create ist geladen.
Herkunft: Phase 2
Status: erledigt (2026-08-28)

**L-A.4 — Kein „Playground" als Produktname**
Kriterium: Keine Oberfläche und kein aktives Wahrheitsdokument (CLAUDE.md, README.md,
PRODUCT_IDENTITY.md, FAHRPLAN-create.md) nennt das Produkt noch „Playground".
Prüfweg: Oberfläche (deutschsprachig, Bereich M) sowie die vier genannten Dokumente nach „Playground"
als Produktnennung durchsuchen; Codepfade wie `src/components/playground/` und die
`playground.*`-Übersetzungsschlüssel zählen nicht (Bereich M).
Herkunft: Phase 2
Status: erledigt (2026-08-29)

**L-A.5 — Seitentitel und Metadaten gesetzt**
Kriterium: Unter `/` und `/create` nennt der Seitenquelltext je einen eigenen Titel und
eine Meta-Beschreibung, die das jeweilige Produkt benennt.
Prüfweg: Quelltext beider Adressen öffnen; `<title>` und `description` ablesen. Achtung:
`/create` erbt die Beschreibung heute aus dem Root-Layout und benennt damit den Chat.
Herkunft: Phase 2
Status: offen

## B — Modellwahrheit *(Phase 3)*

**L-B.1 — Kein angebotetes Modell ist unbekannt**
Kriterium: Jedes in Chat, Visualize und Create auswählbare Modell existiert in der
Live-Registry des zugehörigen Anbieters.
Prüfweg: Die sichtbaren Modell-IDs gegen `gen.pollinations.ai/image/models`,
`/audio/models`, `/v1/models` und die Pruna-Modell-Doku abgleichen; Ergebnis mit Datum
in diesem Dokument vermerken.
Herkunft: Phase 3
Status: erledigt (2026-08-28, Phase 3)

**L-B.2 — Kostenlos heißt kostenlos**
Kriterium: Kein als kostenlos markiertes Modell verlangt einen Schlüssel.
Prüfweg: Frisches Profil ohne Schlüssel; jedes als „kostenlos" markierte Modell einmal
anstoßen; keiner der Läufe endet mit „Schlüssel erforderlich".
Herkunft: Phase 3
Status: erledigt (2026-08-28, Phase 3)

**L-B.3 — Keine Drift-Warnung mehr**
Kriterium: `CLAUDE.md` trägt keine Drift-Warnung mehr für Modell-Listen, und die Listen
stimmen mit der Live-Registry.
Prüfweg: `CLAUDE.md` nach der Warnung durchsuchen; sie ist entfernt, die Listen entsprechen
der Prüfung aus L-B.1.
Herkunft: Phase 3
Status: erledigt (2026-08-28, Phase 3)

**L-B.4 — Jedes sichtbare Modell hat erfolgreich erzeugt**
Kriterium: Jedes in B.1 bestätigte Modell hat mindestens einmal ein Ergebnis geliefert.
Prüfweg: Jedes Modell einmal laufen lassen (schlüsselpflichtige mit eigenem Schlüssel);
Ergebnis mit Datum notieren.
Herkunft: Phase 3
Status: erledigt (2026-08-29)
> Live geprüft 2026-08-29 ohne Schlüssel gegen `chat.hey-hi.cloud/api/generate`:
> `flux` (7,3 s), `gpt-image` (38,1 s) und `klein` (7,0 s) antworten je mit 200 und
> einer Medien-URL, die `image/jpeg` ausliefert. Das sind genau die drei Modelle, die
> `getChatImageModelGroups()` führt — die Bestätigungsliste für L-F.1.

## C — Fehlerverhalten *(Phase 4)*

**L-C.1 — Jeder bekannte Fehlerfall ist ohne Konsole verständlich**
Kriterium: Für fehlenden Schlüssel, 401, 402, 403, Pruna-400 („additional properties
forbidden"), Zeitüberschreitung und Anbieterausfall („Pollinations antwortet gar nicht")
steht in der Oberfläche ein Satz, der die Ursache und den nächsten Schritt nennt.
Prüfweg: Jeden der sieben Fälle auslösen (Pruna-400 mit `https://invalid.invalid/x.jpg`,
ohne kostenpflichtigen Lauf) und die angezeigte Meldung notieren.
Herkunft: Phase 4
Status: offen

**L-C.2 — Ein Reload verliert keinen laufenden Videolauf**
Kriterium: Ein Reload der Seite während eines laufenden Videolaufs beendet den Lauf
nicht; der Auftrag erscheint nach dem Reload wieder und endet mit einem Ergebnis.
Prüfweg: Videolauf starten, Seite neu laden; der Auftrag ist wieder sichtbar und die
Galerie erhält das Ergebnis.
Herkunft: Phase 4
Status: offen

**L-C.3 — Die Pollen-Statusanzeige kennt drei Zustände**
Kriterium: Die Statusanzeige unterscheidet „kein Schlüssel", „Schlüssel vorhanden,
Konto nicht abrufbar" und „bestätigt".
Prüfweg: Die drei Zustände nacheinander herstellen (ohne Key, mit ungültigem Key, mit
gültigem Key) und die Beschriftung ablesen.
Herkunft: Phase 4
Status: offen

**L-C.4 — Ein laufender Auftrag zeigt verstrichene Zeit**
Kriterium: Während eines Auftrags zählt die Anzeige die verstrichene Zeit sichtbar hoch.
Prüfweg: Einen Auftrag starten und die Anzeige über eine Minute beobachten.
Herkunft: Phase 4
Status: offen

## D — Ergebnisse behalten *(Phase 5)*

**L-D.1 — Ein Ergebnis überlebt den Reload**
Kriterium: Ein in Create erzeugtes Bild ist nach einem Reload derselben Adresse in der
Galerie sichtbar und anzeigbar.
Prüfweg: Bild erzeugen, Seite neu laden, Galerie öffnen; Vorschau lädt ohne toten Blob.
Herkunft: Phase 5
Status: offen

**L-D.2 — Löschen entfernt Eintrag und Blob**
Kriterium: Nach dem Löschen ist der Eintrag nach einem Reload nicht zurück, und der
Blob ist entfernt.
Prüfweg: Eintrag löschen, Seite neu laden; Galerie und Netzwerktab zeigen weder Eintrag
noch Nachladen des Blobs.
Herkunft: Phase 5
Status: offen

**L-D.3 — Chat-Ergebnisse erscheinen im Create**
Kriterium: Ein im Chat erzeugtes Bild erscheint im Create, nachdem der Herkunftsfilter
auf Chat umgestellt wurde.
Prüfweg: Bild im Chat erzeugen, ins Create wechseln, Galerie öffnen, Filter umstellen;
Eintrag sichtbar und anzeigbar.
Herkunft: Phase 5
Status: offen

**L-D.4 — Löschen entfernt auch die externe Kopie**
Kriterium: Wurde ein Asset in den Pollinations Media Storage hochgeladen (`storageKey`),
entfernt das Löschen auch die dortige Kopie — mit dem Schlüssel des Nutzers, nicht dem
des Betreibers. Antwortet der Anbieter nicht mit Erfolg, bleibt die Waise bis zum
10-Jahre-Ablauf und der Befund wird hier als akzeptiertes Risiko nachgetragen.
Prüfweg: Mit hinterlegtem eigenen Pollen-Schlüssel ein Asset mit `storageKey` löschen;
im Netzwerktab zeigt der `DELETE /api/media/delete` den Header `X-Pollen-Key` und eine
Erfolgsantwort. Danach die Medien-URL erneut abrufen; sie liefert kein Objekt mehr.
Herkunft: Phase 5
Status: offen

> **Warum das ein Gate ist und kein Risiko in Bereich L:** Der Punkt stand bis zum
> 2026-08-29 als `L-L.5` in Bereich L — dem Bereich, der per Definition **nicht**
> blockiert — und trug dabei den Status „Betreiberentscheidung ausstehend". Eine
> unentschiedene Frage in einem nicht blockierenden Bereich ist für die Freigabe
> unsichtbar. Solange der Endpunkt nicht mit einem echten Schlüssel verifiziert ist,
> blockiert der Punkt. Fällt die Prüfung negativ aus, wird daraus ein akzeptiertes
> Risiko in Bereich L — dann aber als Entscheidung, nicht als Versäumnis.

## E — Telefon *(Phase 6)*

**L-E.1 — Vollständige Erzeugung auf dem Telefon**
Kriterium: Auf einem echten Telefon lassen sich Bild und Video jeweils vollständig
erzeugen, inklusive Referenz-Upload und Parameterwahl.
Prüfweg: Auf einem iPhone und einem Android-Gerät je einen t2i- und einen i2v-Lauf
durchführen; kein Bedienelement bleibt unerreichbar oder von der Tastatur verdeckt.
Herkunft: Phase 6
Status: offen
> Betreiberaufgabe — Checkliste in [`PLAN-phase-6-create-telefon.md`](PLAN-phase-6-create-telefon.md),
> Abschnitt 8. Braucht zwei echte Geräte.

**L-E.2 — Kein horizontales Scrollen bei 375 px**
Kriterium: Die Seite scrollt bei 375 px Breite nicht horizontal.
Prüfweg: Auf einem 375-px-Gerät oder -Emulator jede Hauptansicht durchblättern; kein
horizontaler Scrollbalken erscheint.
Herkunft: Phase 6
Status: offen
> Betreiberaufgabe — die Browser-Messung macht der Betreiber selbst (keine
> Agenten-Browser-Tests). Prüfweg: Q Schritt 5 in
> [`PLAN-phase-6-create-telefon.md`](PLAN-phase-6-create-telefon.md); die Code-Seite ist
> umgesetzt (Phase 6, Commit `cbf3011`).

## F — Chat-Oberfläche *(Phase 7)*

**L-F.1 — Der Chat zeigt eine reduzierte, funktionierende Auswahl**
Kriterium: Visualize im Chat zeigt ausschließlich in B bestätigte Modelle und benennt
sichtbar den Weg zur vollen Auswahl im Create.
Prüfweg: Modell-Liste im Chat mit der Bestätigungsliste aus L-B.4 vergleichen; der
Verweis ins Create ist als Beschriftung vorhanden und führt dorthin.
Herkunft: Phase 7
Status: erledigt (2026-08-29) — strukturell durch Phase 7 (nur schlüsselfreie
Pollinations-Bildmodelle, Video/Pruna abwesend, Create-Verweis im Panel), und seit
2026-08-29 ist die Bestätigungsliste aus L-B.4 dieselbe: `flux`, `gpt-image`, `klein`
haben live erzeugt.
**Endzustand seit Phase 7:** Der Chat führt `flux`, `gpt-image`, `klein` — die Regel
„schlüsselfrei, Pollinations, Bild" in `getChatImageModelGroups()`. Video und Pruna sind
strukturell abwesend (E7-2, E7-3). Der Verweis steht als letzte Zeile im Modell-Panel.

## G — Musik *(Phase 8)*

**L-G.1 — Musik ohne Schlüssel erklärt statt zu scheitern**
Kriterium: Ohne Pollen-Schlüssel zeigt der Musikmodus einen Hinweis auf die
Schlüsselpflicht samt Weg zu den Einstellungen und keine Fehlermeldung.
Prüfweg: In einem frischen Browserprofil ohne Schlüssel den Musikmodus öffnen und den
Erzeugen-Knopf betätigen; der Hinweis erscheint.
Herkunft: Phase 8
Status: offen

**L-G.2 — Mit Schlüssel erzeugt jedes geführte Musikmodell einen Track**
Kriterium: Mit hinterlegtem Schlüssel erzeugt jedes im Musikmodus geführte Modell einen
abspielbaren Track.
Prüfweg: Je geführtem Modell einen Lauf starten; das Ergebnis lässt sich abspielen.
Herkunft: Phase 8
Status: offen

**L-G.3 — Tracks landen im gemeinsamen Pool**
Kriterium: Ein erzeugter Track erscheint im selben Galerie-Pool wie die Bilder aus
Bereich D.
Prüfweg: Track erzeugen, Galerie öffnen; der Track ist gelistet und abspielbar.
Herkunft: Phase 8
Status: offen

**L-G.4 — Kein `acestep` mehr im Code**
Kriterium: Der Bezeichner `acestep` kommt im Code unter `src/` nicht mehr vor.
Prüfweg: `src/` nach `acestep` durchsuchen; null Treffer.
Herkunft: Phase 8
Status: offen

## H — Darstellung *(gilt nur, falls Phase 9 gebaut wird — Phase 9 steht in M)*

**L-H.1 — Der ASCII-Effekt kostet keine laufende Erzeugung**
Kriterium: Der Effekt im Create ist abschaltbar, pausiert oder reduziert sich bei
`prefers-reduced-motion` und läuft während einer aktiven Erzeugung nicht auf voller Last.
Prüfweg: Mit gesetztem `prefers-reduced-motion` laden; während eines laufenden Auftrags
die Bildrate beobachten; den Schalter betätigen.
Herkunft: Phase 9
Status: offen

## I — Verhalten ohne Schlüssel *(L-I.1 Abschlussprüfung · L-I.2 Phase 7 · L-I.3 Phase 4)*

**L-I.1 — Ohne Schlüssel ist das Produkt benutzbar, nicht nur sichtbar**
Kriterium: In einem frischen Browserprofil ohne jeden Schlüssel lassen sich mindestens
ein Chatverlauf und mindestens ein Bild vollständig erzeugen.
Prüfweg: Frisches Profil, keine Eingabe in den Einstellungen, je ein Chat- und ein
Bildlauf mit dem Vorgabemodell.
Herkunft: Abschlussprüfung vor der Freigabe
Status: offen

**L-I.2 — Schlüsselpflicht ist vor dem Absenden erkennbar**
Kriterium: Schlüsselpflichtige Angebote sind als solche gekennzeichnet, bevor etwas
abgesendet wird — nicht erst als Fehler danach.
Prüfweg: Ohne Schlüssel jedes schlüsselpflichtige Angebot öffnen; die Kennzeichnung
erscheint vor dem Absenden.
Herkunft: Phase 7
Status: teilweise — Text (Phase 3, Pollenwall im `ModelSelectorPanel`) und Bild/Video
(Phase 7, strukturell: der Chat führt kein schlüsselpflichtiges Bild- oder Videomodell
mehr) sind erfüllt. Offen bleibt der Musikmodus, siehe L-G.1 (Phase 8).

**L-I.3 — Videomodelle sind vor dem Absenden als schlüsselpflichtig erkennbar**
Kriterium: Die Oberfläche sagt vor dem Absenden, dass Videogenerierung einen Schlüssel
braucht — es gibt kein kostenloses Videomodell (Betreiberentscheidung E1, 2026-08-29).
Prüfweg: Ein Videomodell wählen und ohne Schlüssel absenden wollen; die Schlüsselpflicht
ist vor dem Absenden erkennbar, nicht erst aus einer Fehlermeldung.
Herkunft: Phase 4
Status: offen

## K — Kostenrisiko *(L-K.1 Abschlussprüfung · L-K.2 und L-K.3 Phase 4)*

**L-K.1 — Kein fremder Klick erzeugt Kosten auf der Betreiberrechnung**
Kriterium: Ohne eigenen Schlüssel des Nutzers löst keine Oberfläche einen
kostenpflichtigen Lauf gegen den serverseitig hinterlegten Pollinations-Schlüssel aus.
Pruna ist BYOP-only — serverseitig existiert kein Pruna-Schlüssel (Entscheidung
2026-08-28), damit ist dieser Pfad strukturell geschlossen.
Prüfweg: Serverseitige Env-Schlüssel prüfen; ohne Client-Schlüssel jeden Erzeugen-Pfad
auslösen und im Pollinations-Konto gegenprüfen, dass kein kostenpflichtiger Lauf
entstanden ist.
Herkunft: Abschlussprüfung vor der Freigabe
Status: offen

**L-K.2 — Nicht abbrechbare Pruna-Läufe werden vor dem Start gesagt**
Kriterium: Die Oberfläche sagt vor dem Absenden, dass ein gestarteter Pruna-Lauf nicht
abbrechbar ist und abgerechnet wird — als dauerhafte Zeile an der Sendeleiste, sobald
ein Pruna-Modell gewählt ist, plus einem einmaligen Bestätigungsschritt beim ersten
Pruna-Lauf pro Browser (Betreiberentscheidung E2, 2026-08-29).
Prüfweg: Bei gewähltem Pruna-Modell die Dauerzeile an der Sendeleiste prüfen; den
einmaligen Bestätigungsschritt beim ersten Pruna-Lauf öffnen — der Hinweis ist sichtbar,
ohne den Lauf zu starten.
Herkunft: Phase 4
Status: offen
> Hinweis (Phase 6, Querlesen): Der Satz existiert als Konstante `RUN_CONTINUES_NOTICE`
> (`src/lib/playground/constants.ts`) und steht sichtbar an der laufenden Karte in der
> Galerie. Die dauerhafte Zeile an der Sendeleiste vor dem Start ist noch nicht gebaut —
> die Phase-4-Anteile an `PromptBar.tsx` (W7/W8) fehlen im Stand `cbf3011`.

**L-K.3 — Abbruch wird nicht als Stornierung dargestellt**
Kriterium: Ein Abbruch in der Oberfläche wird nicht als Stornierung oder Erstattung
beschriftet.
Prüfweg: Einen laufenden Auftrag in der Oberfläche abbrechen; die Beschriftung sagt
„verlassen" o. ä., nicht „storniert".
Herkunft: Phase 4
Status: erledigt (2026-08-29)
> `Gallery.tsx`: der Knopf heißt „Nicht mehr warten", nicht „Abbrechen". Der Grund
> („Der Lauf läuft beim Anbieter weiter und wird berechnet") hängt am `title`. Dass er
> dort auf dem Telefon unsichtbar ist, gehört zu L-K.2 und Phase 6.

## L — Bewusst akzeptierte Risiken *(phasenlos — blockiert nicht, muss schriftlich stehen)*

**L-L.1 — BYOP-Schlüssel im Browser-Speicher sind XSS-empfindlich**
Pollen- und Pruna-Schlüssel liegen im Browser-Speicher und wären bei einer XSS-Lücke
auslesbar. Dokumentiert in `CLAUDE.md`, bewusst getragen.
Status: akzeptiert (Betreiber, 2026-08-28)

**L-L.2 — Chatverläufe liegen unverschlüsselt in IndexedDB**
Lokale Daten sind unverschlüsselt; Web-Crypto-Verschlüsselung ist Audit-Punkt D und
steht ausdrücklich in Bereich M.
Status: akzeptiert (Betreiber, 2026-08-28)

**L-L.3 — Ergebnisse in Pollinations Media Storage sind über ihre URL erreichbar**
Wer die URL kennt, kann das Ergebnis abrufen; es gibt keine Zugriffsbeschränkung.
Status: akzeptiert (Betreiber, 2026-08-28)

**L-L.4 — Impressum und Datenschutzerklärung fehlen**
Es existieren weder Impressum noch eine Datenschutzerklärung; die heutigen
`/about`-Aussagen („local-first", „kein Account") qualifizieren den Datenfluss nicht.
Der Datenfluss ist hiermit benannt: Prompts, Referenzbilder und Uploads gehen an
Pollinations bzw. Pruna, Ergebnisse landen in fremdem Speicher (L-L.3), Chatverläufe
und Einstellungen bleiben lokal im Browser.
Status: akzeptiert (Betreiber, 2026-08-28)

## M — Ausdrücklich **nicht** Teil des Launch

- **Phase 9 — ASCII-Flow im Create.** Betreiberentscheidung 2026-08-28: nicht
  launchrelevant, jederzeit nachrüstbar. L-H.1 bleibt Bedingung, falls sie gebaut wird.
- **Phase 10 — Musik auf eigener Infrastruktur.** Zurückgestellt; Musik bleibt hinter
  der Pollenwall.
- **Echtes Streaming im Chat.** Bewusst offen, siehe `docs/streaming-status.md`.
- **Web-Crypto-Verschlüsselung lokaler Daten.** Audit-Punkt D, kein Launch-Gate.
- **Öffentliche Produktseite / Marketing.** Nutzerentscheidung 2026-08-27.
- **Umbenennung von `src/components/playground/`, `src/lib/playground/`, der
  `playground.*`-Übersetzungsschlüssel und von `PlaygroundShell`.** Ausdrücklich nicht
  Ziel von Phase 2. Der Routenpfad ist am 2026-08-29 auf `/create` gezogen, die
  Verzeichnis- und Symbolnamen bewusst nicht.
- **Eine eigene Domain `create.hey-hi.cloud`.** Betreiberentscheidung 2026-08-29,
  Begründung bei L-A.1.
- **Offene Tech-Debt aus dem April-Audit** (Sub-Extraktion `chat-send-coordinator`,
  `font-body`-Mapping, restliche `next/image`-Flächen).
- **Ökosystem-Verlinkung** zu Level 1 und Level 3.
- **Zweisprachiges Create.** Betreiberentscheidung 2026-08-29 (E3): Create ist
  deutschsprachig; ein EN-Create wird nicht nachgezogen. Nur `ModelPicker` nutzt
  `t()`, alle übrigen Create-Texte sind hart deutsch — akzeptiert.

---

## Zuordnung Phase → Kriterien

| Phase | Inhalt | Kriterien |
|---|---|---|
| 2 | Create-Identität, Domain, Navigation | L-A.1 – L-A.5 |
| 3 | Modellwahrheit | L-B.1 – L-B.4 (stützt L-C.1, L-F.1, L-G.2) |
| 4 | Fehlerklarheit, Laufstabilität | L-C.1 – L-C.4, L-K.2, L-K.3, L-I.3 |
| 5 | Eine Galerie, Löschen | L-D.1 – L-D.4 |
| 6 | Create auf dem Telefon | L-E.1, L-E.2 |
| 7 | Chat entschlanken | L-F.1, L-I.2 |
| 8 | Musik im Create | L-G.1 – L-G.4 |
| 9 | ASCII-Flow | L-H.1 — kein Gate, gilt nur falls gebaut (Bereich M) |
| 10 | Musik auf eigener Infrastruktur | keine — Bereich M |
| — | Abschlussprüfung vor der Freigabe | L-I.1, L-K.1 |

## Verweise

- [`FAHRPLAN-create.md`](FAHRPLAN-create.md) — der Weg dorthin, Phase für Phase
- [`CLAUDE.md`](../CLAUDE.md) — Laufzeitwahrheit (Achtung: Modell-Listen bis Phase 3 gedriftet)
- [`PRODUCT_IDENTITY.md`](PRODUCT_IDENTITY.md) — Produktversprechen und Sprache
- [`PRODUCT_AUDIT_2026-04-21.md`](PRODUCT_AUDIT_2026-04-21.md) +
  [`PRODUCT_AUDIT_FOLLOWUP_2026-04-21.md`](PRODUCT_AUDIT_FOLLOWUP_2026-04-21.md) — offener Rückstand
