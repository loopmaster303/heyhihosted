# Handoff — Review des Audit-Patch und drei Nacharbeiten

**Datum:** 2026-08-29
**Branch:** `main`, Ausgangs-HEAD `ffefb04`
**Status:** Uncommitted — drei Dateien plus dieser Handoff im Arbeitsbaum, Commit und
Push warten auf Freigabe des Betreibers.
**Art der Sitzung:** Unabhängige Nachprüfung des Abschlussberichts zu
[`PLAN-audit-patch-2026-08-29.md`](PLAN-audit-patch-2026-08-29.md) und Behebung dessen,
was die Nachprüfung fand. Kein neues Feature, keine Modelländerung.

---

## 1. Was nachgeprüft wurde — und hielt

Der Abschlussbericht der ausführenden Sitzung wurde nicht geglaubt, sondern nachgerechnet.
Jede Zahl selbst gezogen:

| Behauptung | Befund |
|---|---|
| Arbeitsbaum leer, gepusht | `git status --porcelain -uall` leer; `HEAD` = `origin/main` = `ffefb04` |
| P0: fünf thematische Commits | `fcb1124..ffefb04` = fünf P0-Commits plus ein Abschlusscommit, Schnitt sauber |
| lint / tsc / build | sauber · `rc=0` · `✓ Compiled`, `/create` statisch |
| 852 Tests | **109 Suiten, 852 Tests** grün |
| Drei Plan-Greps leer | alle drei 0 |
| W2, W3, W5, W6, W7, W9, W10 | im Diff gelesen, alle wörtlich nach Paketvorgabe umgesetzt |
| W4 | „tote Schlüssel entfernt" ist raus, Korrekturvermerk steht |
| E1–E3 | in `LAUNCH_CRITERIA.md` **und** im Fahrplan festgeschrieben, L-I.3 neu angelegt |

**Innerhalb** der Arbeitspakete wurde kein einziger Ausführungsfehler gefunden. Die
Doppelverifikation (Worker meldet, Orchestrator prüft selbst nach) hat getragen.

Die Rulings 1, 2 und 4 des Berichts sind fachlich richtig. Ruling 2 deckt einen **Fehler
im Plan** auf, nicht in der Ausführung: der Plan behauptete, W1, W2 und W9 seien
datei-getrennt und parallelisierbar — alle drei fassen `docs/FAHRPLAN-create.md` an. Die
serielle Ausführung war die richtige Korrektur.

---

## 2. Was die Nachprüfung fand — drei Lücken zwischen den Paketen

Alle drei liegen **zwischen** Paketen, keines in einem. Genau die Klasse, die eine
Paket-für-Paket-Verifikation strukturell nicht sehen kann.

### N1 — `L-I.1` und `L-K.1` standen doppelt in der Zuordnungstabelle

W3 hat die `Herkunft:`-Zeilen beider Kriterien auf „Abschlussprüfung vor der Freigabe"
gezogen, die alten `(phasenlos)`-Zeilen in der Zuordnungstabelle aber stehen lassen und
eine dritte Zeile ergänzt. Ergebnis: dieselben zwei Kriterien zweimal gelistet, einmal
mit einer Herkunft, die ihre eigene Kriteriumszeile widerlegt.

Das ist derselbe Defekt, den die ausführende Sitzung für `L-I.2` erkannt und als
Fix-Runde behoben hat (Ruling 3) — bei den zwei anderen ist er stehengeblieben.

**Behoben:** die zwei `(phasenlos)`-Zeilen gelöscht, die verbliebene Zeile heißt jetzt
„Abschlussprüfung vor der Freigabe".

Beim Nachprüfen zeigte sich, dass derselbe Defekt zwei Ebenen höher weiterlief: die
Bereichsüberschriften **I** und **K** trugen weiterhin `*(phasenlos)*`, obwohl beide
Bereiche seit W3 gemischt sind (L-I.2 → Phase 7, L-I.3 und L-K.2/L-K.3 → Phase 4), und
die Formatbeschreibung im Kopf bot `phasenlos` noch als gültigen Herkunftswert an.
Beides mitgezogen. `phasenlos` steht jetzt nur noch in Bereich **L** (akzeptierte
Risiken) — dort zu Recht, denn Risiken haben keine Phase und blockieren nicht.

### N2 — Der Audit-Patch-Handoff beschrieb einen Stand, den es nicht mehr gab

`HANDOFF-2026-08-29-audit-patch.md` sagte „**Nicht gepusht**", „uncommitted, warten auf
Freigabe" und nannte `ffefb04` nirgends — und wurde in genau diesem Commit mitcommittet
und gepusht. Er wurde vor dem letzten Schritt geschrieben und danach nicht nachgezogen.

Das ist dieselbe Klasse wie der falsche Eintrag im Phase-3-Handoff, den W4 in derselben
Sitzung repariert hat: der Prüfpfad zeigt auf einen Zustand, der nicht existiert. Ein
Handoff ist die Prüfspur; steht Falsches darin, sucht die nächste Sitzung am falschen Ort.

**Behoben:** Kopf trägt jetzt End-HEAD `ffefb04` und den Push-Status, „Ergebnis in einem
Satz" nennt die beantworteten Entscheidungen statt einer offenen Freigabe, und der
Abschnitt „Verifikationsstand" zeigt den Endstand statt des Zwischenstands.

### N3 — Phase 4 im Fahrplan deckte ihren neuen Umfang nicht ab

W3 hat `L-K.2`, `L-K.3` und `L-I.3` der Phase 4 zugeordnet. Das Fertig-Kriterium der
Phase 4 im Fahrplan blieb unverändert und nannte nur Fehlermeldungen und den Reload. Wer
Phase 4 gegen ihr eigenes Kriterium prüft, hätte sie für fertig erklärt, während drei
Gates offen sind.

**Behoben:** Das Fertig-Kriterium von Phase 4 verlangt jetzt ausdrücklich, dass L-K.2,
L-K.3 und L-I.3 auf erledigt stehen.

---

## 3. Zwei Anmerkungen ohne Nacharbeit

- **Ein Commit für zehn Pakete.** `ffefb04` bündelt W1–W10 plus E1–E3: neun
  Doku-Dateien, ein neuer Test, drei gelöschte Übersetzungsschlüssel und eine
  UI-Beschriftung. Kein Schaden — aber ein Reviewer kann W7 nicht von W5 trennen, und
  P0 war ein ganzes Paket über genau diese Trennbarkeit. Nicht rückwirkend zerlegt:
  ein History-Rewrite auf einem gepushten Branch kostet mehr als er hier brächte.
- **W7: der Grund steht nur im `title`.** „Der Lauf läuft beim Anbieter weiter und wird
  berechnet" ist ein Tooltip; auf dem Telefon gibt es kein Hover. `L-K.3` ist trotzdem
  erfüllt — das Kriterium betrifft allein die Beschriftung, und die heißt jetzt
  ehrlich „Nicht mehr warten". Phase 6 (Telefon) und `L-K.2` sollten den Satz sichtbar
  machen, statt ihn im Tooltip zu lassen.

---

## 4. Geänderte Dateien

| Datei | Änderung |
|---|---|
| `docs/LAUNCH_CRITERIA.md` | N1: zwei doppelte `(phasenlos)`-Zeilen aus der Zuordnungstabelle entfernt; Bereichsüberschriften I und K auf die tatsächlichen Herkünfte gezogen; Formatbeschreibung im Kopf nachgezogen |
| `docs/HANDOFF-2026-08-29-audit-patch.md` | N2: Kopf, „Ergebnis in einem Satz", P0-Push-Notiz und „Verifikationsstand" auf den Endstand `ffefb04` gezogen |
| `docs/FAHRPLAN-create.md` | N3: Fertig-Kriterium der Phase 4 um L-K.2, L-K.3, L-I.3 erweitert |
| `docs/HANDOFF-2026-08-29-audit-review.md` | dieses Dokument |
| `docs/README.md` | eine Zeile unter „Start Here" |

Kein Produktivcode berührt.

---

## 5. Verifikation

```text
npm run lint           → sauber
npx tsc --noEmit       → sauber
CI=1 npx jest --silent → 109 Suiten, 852 Tests grün
npm run build          → erfolgreich
```

Gegenproben zu den drei Nacharbeiten:

```text
grep -c "(phasenlos)" docs/LAUNCH_CRITERIA.md            → 0
grep -n "phasenlos" docs/LAUNCH_CRITERIA.md              → nur Bereich L (Risiken)
grep -c "Nicht gepusht" docs/HANDOFF-2026-08-29-audit-patch.md → 0
sed -n '/### Phase 4/,/### Phase 5/p' docs/FAHRPLAN-create.md
  → Fertig-Kriterium nennt L-K.2, L-K.3, L-I.3
```

---

## 6. Lehre für den nächsten Plan dieser Art

Die Doppelverifikation je Paket hat innerhalb der Pakete alles gefangen. Alle drei
Befunde entstanden trotzdem — weil niemand über das Ganze geschaut hat, bevor der
Handoff geschrieben wurde.

**Ein Plan mit N Paketen braucht ein Paket N+1: „Querlesen gegen alle vorherigen
Pakete".** Es läuft nach dem letzten Arbeitspaket und vor dem Handoff, prüft die
Dokumente, die mehrere Pakete gemeinsam angefasst haben, und die Kriterien, die ein
Paket verschoben hat, ohne dass ein anderes davon wusste. Es ist nicht delegierbar an
einen Worker, der nur ein Paket kennt.

Der Handoff wird **nach** dem Push geschrieben, nicht davor — oder danach nachgezogen.

---

## 7. Für den nächsten Thread

1. Commit und Push nachholen, sobald der Betreiber freigibt.
2. **Phase 4 ist die nächste Phase.** Ihr Umfang ist seit heute größer als der
   Fahrplan-Text von 2026-08-26: die sieben Altlasten, plus das Async-Protokoll für
   Pollinations-Videos (Beleg: `nova-reel` 524 nach 125 s), plus L-K.2, L-K.3, L-I.3.
   [`PLAN-phase-4-fehlerklarheit.md`](PLAN-phase-4-fehlerklarheit.md) trägt seit W10
   einen Veraltungsvermerk und ist vor der Ausführung gegen den aktuellen HEAD zu prüfen.
3. `LAUNCH_CRITERIA.md` ist die Statusquelle, nicht der Fahrplan. Phasenabschlüsse
   ziehen dort die Status-Spalten nach.
4. Offen aus Phase 2, unverändert: **L-A.1 und L-A.5** brauchen eine Browser-Sicht auf
   `chat.hey-hi.cloud/create`. Und **L-B.4** aus Phase 3 verlangt, dass jedes sichtbare
   Modell einmal erzeugt hat — beides Betreiberarbeit nach dem Deploy.
