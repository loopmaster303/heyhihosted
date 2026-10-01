# Plan — Phase 1: Launch-Kriterien festschreiben (P14)

**Datum:** 2026-08-27
**Art:** Implementierungsplan. **Kein Code, kein Commit, kein Push.**
**Zieldatei:** `docs/LAUNCH_CRITERIA.md` (neu)
**Status nach AGENTS.md:** Phase 1 (Kontext) und Phase 2 (Blueprint) unten, Phase 3 (Reality
Check) in Abschnitt 6. **Phase 4 (Ausführung) beginnt erst nach ausdrücklicher Freigabe.**

---

## 1. Ziel

Eine interne Definition of Done als `docs/LAUNCH_CRITERIA.md`, in der jeder Punkt in einem
prüfbaren Satz sagt, was laufen muss, damit `create.hey-hi.cloud` öffentlich geteilt werden
darf — und was ausdrücklich nicht dazugehört.

---

## 2. Warum eine neue Datei gerechtfertigt ist

`CLAUDE.md` verbietet unter „Cleanup Rules" neue Wahrheitsdokumente, wo bestehende reichen.
Geprüft, welches bestehende Dokument die Rolle übernehmen könnte:

| Kandidat | Warum er es nicht ist |
|---|---|
| `docs/FAHRPLAN-create.md` | Beschreibt **Arbeit** in Phasen. Launch-Kriterien beschreiben **Zustand** unabhängig davon, welche Phase ihn herstellt. Ein „Fertig, wenn" je Phase ist keine Freigabeentscheidung für die Adresse. |
| `docs/PRODUCT_IDENTITY.md` | Beschreibt das Produktversprechen, nicht die Freigabeschwelle. Nennt heute schon Dinge, die nicht laufen (`elevenmusic` frei, Compose sichtbar). |
| `docs/PRODUCT_AUDIT_2026-04-21.md` + Follow-up | Rückblickend, Befund-orientiert, Now/Next/Later. Kein Gate. |
| `HANDOFF.md` | Zustand eines Zeitpunkts, wird ständig überschrieben. |
| `AGENTS.md` | Arbeitsablauf, nicht Produkt. |

**Begründung:** Es gibt heute kein Dokument, das die Frage „darf die Adresse raus?" mit
Ja/Nein beantwortet. Das ist eine echte Lücke, keine Doppelung. Die neue Datei ist bewusst
schmal: sie enthält **keine** Architektur, **keine** Modell-Listen, **keine** Ablaufschritte
— sie verlinkt dafür auf `CLAUDE.md`, `FAHRPLAN-create.md` und die Audits.

`docs/README.md` bekommt genau **eine** Zeile unter „Start Here" als Verweis. Kein weiteres
Dokument wird angefasst.

---

## 3. Gliederung des Zieldokuments

Jeder Punkt hat dieselbe Form:

```
**L-x.y — <Kurztitel>**
Kriterium:  <ein prüfbarer Satz, Präsens, ohne Adjektiv ohne Messpunkt>
Prüfweg:    <ein Satz: wer klickt was, wo, und was muss dastehen>
Herkunft:   <Phase N | phasenlos>
```

„Prüfweg" ist Teil des Kriteriums, nicht Beiwerk: ohne ihn ist „ohne Rückfrage prüfbar"
nicht einlösbar.

### Kopf des Dokuments

- Zweck in zwei Sätzen, Verweis auf `FAHRPLAN-create.md` als Weg dorthin
- **Freigaberegel:** Alle Kriterien in A–H **und** J–L sind erfüllt → die Adresse darf geteilt
  werden. Ein offenes Kriterium blockiert; ein bewusst akzeptiertes Risiko (Abschnitt L)
  blockiert nicht, muss aber schriftlich stehen.
- Datum der letzten Prüfung und wer geprüft hat

### Bereich A — Erreichbarkeit und Identität *(Phase 2)*

Beispielformulierung:

> **L-A.1 — Create ist unter der eigenen Adresse erreichbar**
> Kriterium: `https://create.hey-hi.cloud/` liefert ohne weitere Navigation die
> Create-Oberfläche, `https://chat.hey-hi.cloud/` den Chat.
> Prüfweg: Beide Adressen in einem frischen Browserprofil öffnen; Titel und erster sichtbarer
> Bereich stimmen mit der Erwartung überein.
> Herkunft: Phase 2

Weiter in A: sichtbarer Rückweg Create → Chat mit einem Klick (L-A.2), Hinweg Chat → Create
(L-A.3), keine Oberfläche und kein aktives Dokument nennt die Route noch „Playground" als
Produktnamen (L-A.4), Seitentitel/Metadaten in DE und EN gesetzt (L-A.5).

### Bereich B — Modellwahrheit *(Phase 3)*

Beispielformulierung:

> **L-B.1 — Kein angebotenes Modell ist unbekannt**
> Kriterium: Jedes in Chat, Visualize und Create auswählbare Modell existiert in der
> Live-Registry des zugehörigen Anbieters.
> Prüfweg: Die sichtbaren Modell-IDs gegen `gen.pollinations.ai/image/models`,
> `/audio/models`, `/v1/models` und die Pruna-Modell-Doku abgleichen; Ergebnis mit Datum
> im Dokument vermerken.
> Herkunft: Phase 3

Weiter in B: kein als kostenlos markiertes Modell verlangt einen Schlüssel (L-B.2),
`CLAUDE.md` trägt keine Drift-Warnung mehr für Modell-Listen (L-B.3), jedes sichtbare Modell
hat mindestens einmal erfolgreich erzeugt (L-B.4).

### Bereich C — Fehlerverhalten *(Phase 4)*

Beispielformulierung:

> **L-C.1 — Jeder bekannte Fehlerfall ist ohne Konsole verständlich**
> Kriterium: Für fehlenden Schlüssel, 401, 402, 403, Pruna-400 („additional properties
> forbidden"), Zeitüberschreitung und Anbieterausfall steht in der Oberfläche ein Satz, der
> die Ursache und den nächsten Schritt nennt.
> Prüfweg: Jeden der sieben Fälle auslösen (Pruna-400 mit `https://invalid.invalid/x.jpg`,
> ohne kostenpflichtigen Lauf) und die angezeigte Meldung notieren.
> Herkunft: Phase 4

Weiter in C: ein Reload während eines laufenden Videolaufs verliert den Lauf nicht (L-C.2),
die Pollen-Statusanzeige unterscheidet „kein Schlüssel", „Schlüssel vorhanden, Konto nicht
abrufbar" und „bestätigt" (L-C.3), ein laufender Auftrag zeigt verstrichene Zeit (L-C.4).

### Bereich D — Ergebnisse behalten *(Phase 5)*

Beispielformulierung:

> **L-D.1 — Ein Ergebnis überlebt den Reload**
> Kriterium: Ein in Create erzeugtes Bild ist nach einem Reload derselben Adresse in der
> Galerie sichtbar und abspielbar/anzeigbar.
> Prüfweg: Bild erzeugen, Seite neu laden, Galerie öffnen; Vorschau lädt ohne toten Blob.
> Herkunft: Phase 5

Weiter in D: Löschen entfernt Eintrag **und** Blob und ist nach Reload nicht zurück (L-D.2),
ein im Chat erzeugtes Bild erscheint in Create nach Umschalten des Herkunftsfilters (L-D.3).

### Bereich E — Telefon *(Phase 6)*

Beispielformulierung:

> **L-E.1 — Auf dem Telefon ist eine vollständige Erzeugung möglich**
> Kriterium: Auf einem echten Telefon lassen sich Bild und Video jeweils vollständig erzeugen,
> inklusive Referenz-Upload und Parameterwahl.
> Prüfweg: Auf einem iPhone und einem Android-Gerät je einen t2i- und einen i2v-Lauf
> durchführen; kein Bedienelement bleibt unerreichbar oder von der Tastatur verdeckt.
> Herkunft: Phase 6

Weiter in E: kein horizontales Scrollen der Seite auf 375 px Breite (L-E.2).

### Bereich F — Chat-Oberfläche *(Phase 7)*

Beispielformulierung:

> **L-F.1 — Der Chat zeigt eine reduzierte, funktionierende Auswahl**
> Kriterium: Visualize im Chat zeigt ausschließlich in Bereich B bestätigte Modelle und
> benennt sichtbar den Weg zur vollen Auswahl im Create.
> Prüfweg: Modell-Liste im Chat mit der Bestätigungsliste aus L-B.4 vergleichen; der Verweis
> ins Create ist als Beschriftung vorhanden und führt dorthin.
> Herkunft: Phase 7

### Bereich G — Musik *(Phase 8)*

Beispielformulierung:

> **L-G.1 — Musik ohne Schlüssel erklärt statt zu scheitern**
> Kriterium: Ohne Pollen-Schlüssel zeigt der Musikmodus einen Hinweis auf die Schlüsselpflicht
> samt Weg zu den Einstellungen und keine Fehlermeldung.
> Prüfweg: In einem frischen Browserprofil ohne Schlüssel den Musikmodus öffnen und den
> Erzeugen-Knopf betätigen.
> Herkunft: Phase 8

Weiter in G: mit Schlüssel erzeugt jedes geführte Musikmodell einen abspielbaren Track
(L-G.2), der Track landet im gemeinsamen Pool aus Bereich D (L-G.3), `acestep` kommt im Code
nicht mehr vor (L-G.4).

### Bereich H — Darstellung und Zugänglichkeit *(Phase 9 + Bestandsschulden)*

Beispielformulierung:

> **L-H.1 — Der ASCII-Effekt kostet keine laufende Erzeugung**
> Kriterium: Der Effekt im Create ist abschaltbar, pausiert oder reduziert sich bei
> `prefers-reduced-motion` und läuft während einer aktiven Erzeugung nicht auf voller Last.
> Prüfweg: Mit gesetztem `prefers-reduced-motion` laden; während eines laufenden Auftrags
> die Bildrate beobachten; den Schalter betätigen.
> Herkunft: Phase 9

### Bereich I — Verhalten ohne Schlüssel *(phasenlos, siehe Abschnitt 5)*

Beispielformulierung:

> **L-I.1 — Ohne Schlüssel ist das Produkt benutzbar, nicht nur sichtbar**
> Kriterium: In einem frischen Browserprofil ohne jeden Schlüssel lassen sich mindestens ein
> Chatverlauf und mindestens ein Bild vollständig erzeugen.
> Prüfweg: Frisches Profil, keine Eingabe in den Einstellungen, je ein Chat- und ein
> Bildlauf mit dem Vorgabemodell.
> Herkunft: phasenlos

Weiter in I: schlüsselpflichtige Angebote sind **vor** dem Absenden als solche erkennbar
(L-I.2).

### Bereich J — Datenschutz-Aussage und Rechtliches *(phasenlos)*

Beispielformulierung:

> **L-J.1 — Eine Datenschutz-Aussage ist von jeder Adresse aus erreichbar**
> Kriterium: Von `create.hey-hi.cloud` und `chat.hey-hi.cloud` führt ein Link zu einer Seite,
> die benennt, welche Daten lokal bleiben, welche an Pollinations bzw. Pruna übertragen werden
> und dass Prompts und Referenzbilder den Rechner verlassen.
> Prüfweg: Von beiden Adressen aus dem Link folgen; die drei genannten Aussagen stehen dort
> wörtlich.
> Herkunft: phasenlos

Weiter in J: die heutige Aussage auf `/about` („local-first", „kein Account") widerspricht
nicht dem tatsächlichen Datenfluss (L-J.2). **Impressumspflicht ist offene Frage 1** in
Abschnitt 7 — kein Kriterium ohne Entscheidung.

### Bereich K — Kostenrisiko *(phasenlos)*

Beispielformulierung:

> **L-K.1 — Kein fremder Klick kann auf meine Rechnung erzeugen**
> Kriterium: Ohne eigenen Schlüssel des Nutzers löst keine Oberfläche einen
> kostenpflichtigen Pruna- oder Pollen-Lauf gegen einen serverseitig hinterlegten Schlüssel
> aus.
> Prüfweg: Serverseitige Env-Schlüssel prüfen; ohne Client-Schlüssel jeden Erzeugen-Pfad
> auslösen und im Anbieter-Konto gegenprüfen, dass kein Lauf entstanden ist.
> Herkunft: phasenlos

Weiter in K: Pruna hat keinen Cancel-Endpunkt — die Oberfläche sagt vor dem Start, dass ein
gestarteter Lauf nicht abbrechbar ist und abgerechnet wird (L-K.2); ein Abbruch in der
Oberfläche wird nicht als Stornierung dargestellt (L-K.3).

### Bereich L — Bewusst akzeptierte Risiken *(phasenlos)*

Kein Gate, aber Teil der Freigabe: Diese Punkte **müssen schriftlich stehen**, dann blockieren
sie nicht.

Beispielformulierung:

> **L-L.1 — Das BYOP-Schlüsselrisiko ist benannt, nicht gelöst**
> Kriterium: Die Datenschutz-Aussage nennt, dass Pollen- und Pruna-Schlüssel im Browser-Speicher
> liegen und bei einer XSS-Lücke auslesbar wären; das Risiko ist als bewusst getragen markiert.
> Prüfweg: Der Satz steht auf der Datenschutzseite und wird in diesem Dokument mit Datum
> als akzeptiert geführt.
> Herkunft: phasenlos

Weiter in L: Chatverläufe liegen unverschlüsselt in IndexedDB (L-L.2), Ergebnisse in
Pollinations Media Storage sind über ihre URL erreichbar (L-L.3).

### Bereich M — Ausdrücklich **nicht** Teil des Launch

Liste ohne Prüfsatz, mit je einem Halbsatz Begründung:

- **Phase 10 — Musik auf eigener Infrastruktur.** Vom Nutzer zurückgestellt; Musik bleibt
  hinter der Pollenwall.
- **Echtes Streaming im Chat.** Bewusst offen, siehe `docs/streaming-status.md`.
- **Web-Crypto-Verschlüsselung lokaler Daten.** Audit-Punkt D, kein Launch-Gate.
- **Öffentliche Produktseite / Marketing.** Nutzerentscheidung vom 2026-08-27.
- **Umbenennung von `src/components/playground/` und `src/lib/playground/`.** Ausdrücklich
  nicht Ziel von Phase 2.
- **Offene Tech-Debt aus dem April-Audit** (Sub-Extraktion `chat-send-coordinator`,
  `font-body`-Mapping, restliche `next/image`-Flächen).
- **Ökosystem-Verlinkung** zu Level 1 und Level 3.

---

## 4. Zuordnungstabelle Phase → Kriterium

| Phase | Inhalt | Kriterien | Deckung |
|---|---|---|---|
| **2** | Create-Identität, Domain, Navigation | L-A.1 – L-A.5 | vollständig |
| **3** | Modellwahrheit | L-B.1 – L-B.4, stützt L-C.1, L-F.1, L-G.2 | vollständig |
| **4** | Fehlerklarheit, Laufstabilität | L-C.1 – L-C.4 | vollständig |
| **5** | Eine Galerie, Löschen | L-D.1 – L-D.3 | vollständig |
| **6** | Create auf dem Telefon | L-E.1, L-E.2 | vollständig |
| **7** | Chat entschlanken | L-F.1 | vollständig |
| **8** | Musik im Create | L-G.1 – L-G.4 | vollständig |
| **9** | ASCII-Flow im Create | L-H.1 | **nur negativ — siehe Befund** |
| **10** | Musik auf eigener Infrastruktur | keine | ausdrücklich in Bereich M |

### Befund zu Phase 9

Phase 9 lässt sich **keinem Kriterium zuordnen, das den Launch trägt.** Der ASCII-Effekt
fügt keine Fähigkeit hinzu, die ein Nutzer braucht; L-H.1 ist ein reines Schadensverbot
(„kostet keine Erzeugung, ist abschaltbar, respektiert `prefers-reduced-motion"). Ein
Kriterium, das nur greift, wenn die Phase überhaupt gebaut wird, ist kein Launch-Gate.

Zwei ehrliche Auswege, beide sind Nutzerentscheidung (**offene Frage 3**):

1. Phase 9 wandert nach Bereich M — nicht launchrelevant, jederzeit nachrüstbar. L-H.1 bleibt
   als Bedingung stehen, falls sie doch gebaut wird.
2. Phase 9 bleibt drin, weil der Effekt zur Identität gehört (`PRODUCT_IDENTITY.md`,
   „Terminal-Ästhetik") — dann braucht sie ein **positives** Kriterium, etwa: „Create und Chat
   zeigen denselben Effekt auf der Startfläche."

Ich entscheide das nicht.

---

## 5. Kriterien ohne Phasenherkunft

Diese Punkte stehen in keiner Phase des Fahrplans, blockieren aber einen öffentlichen Start.
Sie sind der Grund, warum das Zieldokument mehr ist als eine Umformulierung des Fahrplans.

| ID | Kriterium | Warum es fehlt und warum es blockiert |
|---|---|---|
| L-I.1, L-I.2 | Verhalten ohne Schlüssel | Der Fahrplan behandelt Schlüssel nur im Musikkontext (Phase 8). Für einen öffentlichen Start ist der Erstkontakt **immer** ohne Schlüssel. Wenn der erste Klick eines Fremden 402 liefert, ist der Launch gescheitert, auch wenn alle Phasen abgehakt sind. Berührt Phase 3 (falsche `isFree`-Marken) und Phase 4 (Meldung), fällt aber in keine hinein. |
| L-J.1, L-J.2 | Datenschutz-Aussage | Existiert heute nur als Marketingtext in `AboutPrivacy.tsx` / `translations.ts:184-188` — drei Sätze über Local-First, keine Aussage darüber, dass Prompts, Referenzbilder und Uploads an Pollinations und Pruna gehen und Ergebnisse in fremdem Speicher landen. Eine geteilte Adresse macht das zur Pflichtaussage. Keine Phase adressiert es. |
| L-K.1 – L-K.3 | Kostenrisiko | `CLAUDE.md` hält fest: BYOP-Schlüssel fallen serverseitig auf eine Env-Variable zurück. Ist die gesetzt, erzeugen **fremde** Besucher auf Rechnung des Betreibers. Pruna hat zusätzlich keinen Cancel-Endpunkt, jeder gültige Payload ist ein bezahlter Lauf. Der Fahrplan erwähnt das nur als Test-Fallstrick, nie als Launch-Risiko. |
| L-L.1 – L-L.3 | Bewusst akzeptierte Risiken | Dokumentiert und akzeptiert (BYOP-XSS in `CLAUDE.md`, unverschlüsselte IndexedDB im April-Audit-Punkt D). Ohne schriftliche Fixierung im Freigabedokument ist „akzeptiert" nur mündlich — und der Audit-Trail zeigt, dass mündliche Freigaben hier bereits einmal nachdokumentiert werden mussten (A1, Creative Director). |
| Anbieterausfall | Teil von L-C.1 | Der Fahrplan kennt Fehlerklarheit (Phase 4), aber nicht den Fall „Pollinations antwortet gar nicht". Für eine öffentliche Adresse ist das der wahrscheinlichste Ausfall, weil das gesamte Produkt auf einem einzigen fremden Anbieter steht. Ausdrücklich als eigener Fall in L-C.1 aufgenommen. |

---

## 6. Reality Check (AGENTS.md Phase 3)

**Führt das zu Doppelwahrheit?** Das ist das Hauptrisiko. Der Fahrplan hat je Phase ein
„Fertig, wenn"; die Formulierungen oben klingen stellenweise ähnlich. Gegenmaßnahme: Das
Zieldokument formuliert **nur beobachtbaren Endzustand aus Nutzersicht**, nie Arbeitsschritte,
und verweist für das „wie" auf den Fahrplan. Wo ein Kriterium ein „Fertig, wenn" wörtlich
wiederholen würde, wird stattdessen darauf verlinkt. Bereiche I–L sind ohnehin
überschneidungsfrei — sie stehen in keiner Phase.

**Baue ich ein Dokument, das sofort veraltet?** Die Modell-Listen sind das Lehrstück: sie
sind in vier Dokumenten wiederholt und in allen falsch. Deshalb enthält `LAUNCH_CRITERIA.md`
**keine einzige Modell-ID**. L-B.1 nennt den Prüfweg gegen die Live-Registry, nicht das
Ergebnis.

**Ist es ohne Rückfrage prüfbar?** Der Test für jedes Kriterium: Kann eine Person, die dieses
Projekt nicht kennt, den Prüfweg ausführen und Ja/Nein sagen? Formulierungen wie „gut
bedienbar", „stabil", „schnell" fallen deshalb raus. L-E.1 nennt „echtes Telefon, je ein t2i-
und ein i2v-Lauf" statt „mobil nutzbar". Wo mir das nicht gelingt, wird der Punkt zur offenen
Frage statt zum weichen Kriterium.

**Kollidiert es mit bestehenden Hooks oder Code?** Nein — diese Phase schreibt genau zwei
Dateien: `docs/LAUNCH_CRITERIA.md` (neu) und eine Zeile in `docs/README.md`. Kein Produktivcode.

**Gibt es einen einfacheren Weg?** Ja, denkbar: die Kriterien als Abschnitt in
`FAHRPLAN-create.md`. Dagegen spricht, dass der Fahrplan nach Abschluss der Phasen abgeschlossen
ist, die Freigabeschwelle aber auch danach gilt — bei jedem weiteren Ausrollen. Die Trennung
ist der Grund, nicht die Länge.

**Was macht das Dokument angreifbar?**
- Es kann **heute nicht verifiziert werden.** Phase 0 ist nicht abgeschlossen, der Arbeitsbaum
  ist offen, `create.hey-hi.cloud` existiert noch nicht. Das Dokument wird geschrieben, nicht
  abgehakt. Jeder Punkt startet als offen.
- Bereiche I–L könnten als Scope-Ausweitung gelesen werden. Sie sind es der Sache nach, aber
  der Auftrag verlangt sie ausdrücklich: Kriterien, die einen öffentlichen Start blockieren,
  auch wenn keine Phase sie kennt. Sie erzeugen möglicherweise **neue Arbeit außerhalb des
  Fahrplans** — das ist ein Befund, keine Nebenwirkung, siehe offene Frage 2.

**Verschlimmbesserung?** Der plausibelste Fehlschlag ist ein Dokument mit 40 Punkten, das
niemand durchprüft. Deshalb: Zielgröße 25 ± 3 Kriterien, harte Trennung zwischen Gate (A–L)
und Nicht-Gate (M), und Bereich L blockiert bewusst nicht.

---

## 7. Offene Fragen an dich

1. **Impressum und DSGVO.** `hey-hi.cloud` ist deutschsprachig und wird öffentlich geteilt.
   Impressumspflicht (§5 DDG) und eine echte Datenschutzerklärung sind damit im Raum — heute
   gibt es beides nicht, nur drei Marketingsätze in `AboutPrivacy.tsx`. Soll das ein
   **blockierendes** Kriterium in Bereich J werden, ein bewusst akzeptiertes Risiko in
   Bereich L, oder aus dem Dokument bleiben? Ich entscheide das nicht — es ist eine
   Rechtsfrage mit deinem Namen darauf.
2. **Serverseitige Fallback-Schlüssel (L-K.1).** Sind auf dem Vercel-Projekt heute
   `POLLINATIONS`- bzw. `PRUNA`-Env-Schlüssel gesetzt? Falls ja: sollen sie zum Launch
   **entfernt** werden (jeder bringt seinen eigenen Schlüssel mit), oder mit Limit
   weiterlaufen? Davon hängt ab, ob L-K.1 ein Gate oder ein akzeptiertes Kostenrisiko ist.
3. **Phase 9.** Nach Bereich M verschieben oder mit einem positiven Kriterium im Launch
   halten? Siehe Befund in Abschnitt 4.
4. **Systemprompt.** `src/config/chat-options.ts` enthält laut `CLAUDE.md` „Burn the Corpos"
   und Filter-Evasion-Passagen; der Creative-Director-Style ist im April-Audit (A1)
   ausdrücklich als Jailbreak-Persona autorisiert — für den **internen** Gebrauch. Ein
   öffentlich geteilter Link ändert die Lage, weil Fremde ihn nutzen und Anbieter-ToS
   berührt sind. Diese Entscheidung hat noch niemand getroffen. Soll sie als offener Punkt
   ins Dokument (Bereich L, benannt und ungelöst), als Gate in Bereich J, oder gar nicht?
   **Ich treffe sie nicht.**
5. **Bereiche I–L erzeugen Arbeit, die im Fahrplan nicht steht** — Datenschutzseite,
   Schlüssel-Verhalten, Kostenschutz. Soll daraus eine **neue Phase 11** im Fahrplan werden,
   oder verteilt sich die Arbeit auf die bestehenden Phasen 2 und 4?
6. **Wer prüft ab?** Trägst du die Freigabe selbst ein, oder soll das Dokument einen Platz
   für Prüfdatum und Prüfer je Kriterium vorsehen?

---

## 8. Ausdrücklich **nicht** Teil dieser Phase

- Kein Produktivcode, keine Konfiguration, kein Commit, kein Push.
- **Keine Kriterien abprüfen.** Diese Phase schreibt die Liste, sie hakt sie nicht ab.
- Keine Domain im Vercel-Projekt anlegen (Phase 2).
- Keine Modell-Liste anfassen oder gegen die Registry ziehen (Phase 3) — das Dokument nennt
  bewusst keine Modell-IDs.
- Keine Datenschutzseite schreiben. Diese Phase stellt nur fest, dass eine gebraucht wird.
- `HANDOFF.md`, `CLAUDE.md`, `README.md`, `AGENTS.md`, `GEMINI.md` bleiben unberührt. Einzige
  Ausnahme: eine Zeile in `docs/README.md`.
- Keine Entscheidung zu Systemprompt, Impressum, Env-Schlüsseln oder Phase 9 — alles offene
  Fragen in Abschnitt 7.
- Phase 0 wird **nicht** miterledigt.

---

## 9. Annahmen

1. **Phase 0 ist nicht abgeschlossen**, der Arbeitsbaum ist offen (65 geänderte, ~20 neue
   Dateien). Für diese Phase unkritisch, weil sie nur `docs/` anfasst und keine Datei
   berührt, die im Arbeitsbaum offen liegt. **Aber:** Kein Kriterium kann heute verifiziert
   werden. Das Dokument entsteht mit durchgehend offenem Status.
2. Die Entscheidungen aus Abschnitt 3 des Fahrplan-Handoffs (Domain, ein Asset-Pool, Musik
   hinter der Pollenwall, Phase 10 zurückgestellt) gelten unverändert.
3. `create.hey-hi.cloud` — **mit** Bindestrich, wie live registriert. Vor Phase 2 im
   Vercel-Projekt gegenprüfen.
4. Die Modell-Listen in `CLAUDE.md` und `README.md` sind veraltet; das Zieldokument nennt
   deshalb keine Modelle, sondern nur Prüfwege.

---

## 10. Umsetzungsschritte (erst nach Freigabe)

1. `docs/LAUNCH_CRITERIA.md` nach der Gliederung aus Abschnitt 3 schreiben, Zielgröße
   25 ± 3 Kriterien, jedes mit Kriterium / Prüfweg / Herkunft / Status `offen`.
   → **Verifikation:** Jede Phase 2–9 kommt in der Herkunftsspalte vor; Phase 10 steht in
   Bereich M.
2. Die in Abschnitt 7 offenen Punkte als benannte offene Fragen ins Dokument aufnehmen,
   nicht als Kriterien.
   → **Verifikation:** Kein Kriterium formuliert eine Entscheidung, die du nicht getroffen hast.
3. Eine Verweiszeile in `docs/README.md` unter „Start Here".
   → **Verifikation:** Kein weiteres Dokument im Diff.
4. Gegenlesen auf Prüfbarkeit: jedes Adjektiv ohne Messpunkt streichen oder mit einem
   Prüfweg unterlegen.
   → **Verifikation:** `git diff --stat` zeigt genau zwei Dateien.
