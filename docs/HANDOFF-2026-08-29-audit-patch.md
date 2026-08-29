# Handoff — Audit-Patch 2026-08-29 (Phase 0–3-Befunde abarbeiten)

**Datum:** 2026-08-29
**Branch:** `main`, Ausgangs-HEAD `fcb1124`, nach P0 `9b47bf0`
**Plan:** `docs/PLAN-audit-patch-2026-08-29.md` (ausgeführt in eigener Sitzung,
Subagent-Driven Development; Worker-Modell GLM-5.3-Flash, Orchestrator verifizierte
jedes Fertig-Kriterium selbst nach)

## Ergebnis in einem Satz

Der Arbeitsbaum ist sortiert (P0, fünf thematische Commits), alle zehn
Arbeitspakete W1–W10 sind ausgeführt und verifiziert — **852 Tests grün** (851 + 1
aus W5), lint/tsc/build sauber. Offen sind nur die drei Betreiber-Entscheidungen
E1–E3 und die Freigabe für Commit/Push der Paketänderungen.

## P0 — Arbeitsbaum sortiert *(Orchestrator, nicht delegiert)*

Vorher: 50 offene Einträge aus zwei Sitzungen (eine zweite Sitzung war im Repo
geöffnet — als idle verifiziert, Betreiber bestätigt). Nachher: fünf Commits, jeder
einzeln mit vollem Loop (lint, tsc, Jest, Build) geprüft grün:

| Commit | Inhalt |
|---|---|
| `7a7f064` | fix: Phase 3 — Modellwahrheit: Defaults, Registry-Status, BYOP-Klartext (21 Dateien) |
| `51ed1b5` | feat: Phase 3 — Registry-Prüfwerkzeug: Live-Check, Fixtures, CI-Wächter (5 Dateien) |
| `aaafd41` | feat: Phase 3 — Pollenwall: Schlüsselpflichtige Modelle im Picker abweisen (3 Dateien) |
| `e9b75b0` | feat: Phase 4 — Create-Route: /playground nach /create verlegt (7 Dateien, 100 % renames) |
| `9b47bf0` | docs: Wahrheitsdokumente nach Phase 0–3 nachziehen (13 Dateien) |

`next-env.d.ts` (Autogen-Rauschen) wurde ausgecheckt und ist in keinem Commit.
**Nicht gepusht** — Push gesammelt nach Betreiber-Freigabe (main auto-deployt nach
Vercel).

## W-Pakete — ausgeführt, jeweils vom Orchestrator nachverifiziert

| Paket | Ergebnis | Verifikation (selbst nachgeprüft) |
|---|---|---|
| W1 | Statuswahrheit vereinheitlicht: CLAUDE.md sagt „Phases 0–3 are done" + verweist auf LAUNCH_CRITERIA.md und den Phase-3-Handoff; Fahrplan-Marker auf Phasen 0–3; Zusatzsatz Domain-Entfall zu Phase 2; HANDOFF.md Zeilen 1+2 durchgestrichen; docs/README.md nennt alle vier Phasen-Handoffs | `grep "Phase 0 is done" CLAUDE.md` → 0 Treffer |
| W2 | Warnblock „⚠ Historisch — Stand 2026-08-26, überholt" steht direkt unter „## Live-Registry-Befund (2026-08-26)"; Tabelleninhalt unangetastet | sed-Prüfung: Block unter der Überschrift |
| W3 | Kopf „Letzte Prüfung: 2026-08-29 · Audit Phase 0–3"; 6 Kriterien erledigt gesetzt (L-A.2/A.3/A.4, L-B.1/B.2/B.3); fünf Herkunftszeilen verortet (L-I.1/L-K.1 → Abschlussprüfung, L-I.2 → Phase 7, L-K.2/L-K.3 → Phase 4); Zuordnungstabelle ergänzt; Freigaberegel um L-I.1/L-K.1-Halbsatz ergänzt | `Status: offen` 29 → 23 (−6), `Herkunft: phasenlos` → 0 Treffer |
| W4 | Phase-3-Handoff korrigiert: die falsche Zeile „tote Schlüssel entfernt" ersetzt durch Korrekturvermerk mit Verweis auf W6 | `grep "tote Schlüssel entfernt"` → 0 Treffer |
| W5 | Neuer Test „provider und PRUNA_MODEL_MAP widersprechen sich nicht" in `registry-truth.test.ts` (+14 Zeilen, inkl. Begründungskommentar) | Suite 61 → 62 Tests grün; Gesamt 851 → **852** |
| W6 | `playground.title`, `playground.cancel`, `playground.enhance` in beiden Sprachblöcken gelöscht (6 Zeilen); bleibende playground.*-Schlüssel unangetastet | grep-Zähler 0; 852 Tests grün; tsc sauber |
| W7 | Beschriftung `Abbrechen` → `Nicht mehr warten` + `title="Der Lauf läuft beim Anbieter weiter und wird berechnet."` (Gallery.tsx:93–99); Selektoren in den drei Testdateien gezogen; `onCancel`/`onCancelRun` unbenannt | grep „Abbrechen" in `src/components/playground` + `src/app/create` → 0 Treffer; 852 Tests grün |
| W9 | Zwei Aufzählungspunkte im Phase-4-Abschnitt ergänzt (Async-Protokoll Pollinations-Videos; schlüsselpflichtiges Video als Entscheidung mit Verweis auf E1) | sed Phase 4→5: beide Punkte wörtlich vorhanden |
| W10 | Beide Phasenpläne tragen Kopfblock: Phase 3 „Ausgeführt am 2026-08-28 …", Phase 4 „Kopfstand veraltet …" | head-20 beider Dateien |

## Rulings der Sitzung (Abweichungen mit Begründung)

1. **Kein Push in P0.** Plan P0 nennt „gepusht" als Fertig-Kriterium; Betreiberorder
   sagt „Commit und Push erst nach meiner Freigabe". Push ist Seiten-Effekt auf einen
   Shared Branch mit Auto-Deploy. → Push am Ende nach Freigabe.
2. **W2 und W9 seriell statt parallel.** Der Plan behauptet, die Doku-Pakete seien
   datei-getrennt geschnitten — falsch für `docs/FAHRPLAN-create.md` (W1, W2, W9
   fassen alle drei dieselbe Datei). W1/W3/W4/W10 liefen parallel, W2 und W9 seriell.
3. **W3 Fix-Runde 1:** Die Tabellenzeile „— | Verhalten ohne Schlüssel" listete
   L-I.2 weiter mit „(phasenlos)", obwohl L-I.2 jetzt Phase 7 ist (vom Worker
   gemeldet, vom Orchestrator adjudiziert als Teil der Paketabsicht). Zeile steht nun
   auf `L-I.1 (phasenlos)`.
4. **W7 Kommentar-Mitänderung:** Ein deutscher Codekommentar in `Gallery.tsx`
   enthielt „Abbrechen" und musste mitgezogen werden, sonst wäre das Fertig-Kriterium
   (null Treffer in den Pfaden) nicht erreichbar gewesen.
5. **Kein separater Review-Subagent je Paket:** Die Pakete sind mechanisch geschnitten
   (Datei + exakte Änderung + Verifikation vorgeschrieben); die Verifikation lief je
   zweimal — beim Worker und beim Orchestrator.

## Entscheidungen E1–E3 — vom Betreiber beantwortet (2026-08-29)

Die drei im Plan ausdrücklich nicht delegierbaren Entscheidungen wurden am
2026-08-29 getroffen und in die Wahrheitsdokumente eingetragen (nicht nur in den
Chatverlauf):

- **E1 — Video bleibt hinter der Pollenwall (Variante A).** Fahrplan Phase 4 trägt
  den Entscheidungsvermerk; `LAUNCH_CRITERIA.md` hat das neue Kriterium
  **L-I.3** (Oberfläche sagt die Schlüsselpflicht vor dem Absenden), Herkunft
  Phase 4, Status offen.
- **E2 — Form entschieden: dauerhafte Zeile an der Sendeleiste, sobald ein
  Pruna-Modell gewählt ist, plus einmaliger Bestätigungsschritt beim ersten
  Pruna-Lauf pro Browser.** Festgeschrieben im Kriterium **L-K.2** (inkl. neuem
  Prüfweg), Status weiterhin offen — die Umsetzung ist Phase-4-Arbeit.
- **E3 — Create ist deutschsprachig; ein EN-Create wird nicht nachgezogen.**
  Festgeschrieben in Bereich M („Zweisprachiges Create"); der Prüfweg von **L-A.4**
  sagt jetzt „Oberfläche (deutschsprachig, Bereich M)" statt „in DE und EN".

Offen bleibt damit nur die Umsetzung der Entscheidungen im Code (L-I.3, L-K.2 —
beide mit Herkunft Phase 4 verortet).

## Verifikationsstand zum Zeitpunkt dieses Handoffs

```text
npm run lint     → sauber
npx tsc --noEmit → sauber
CI=1 npx jest --silent → 109 Suiten, 852 Tests grün
npm run build    → erfolgreich
git status --porcelain -uall → 14 geänderte Dateien (W-Pakete) + dieser Handoff,
                               uncommitted, warten auf Freigabe
```

Plan-Greps: „Phase 0 is done" → 0 · „Herkunft: phasenlos" → 0 · „Abbrechen" in
`src/components/playground` und `src/app/create` → 0.

## Bewusst nicht angefasst (Kleinbefunde, Plan Abschnitt 6)

`normalizeLegacyImageModelId`-Tote-Ziele, Pollenwall an `useHasPollenKey()` (nicht an
Schlüsselgültigkeit), die sechs Geister in `unified-model-configs.ts`, 7 `acestep`-
Treffer in `src/`, `vercel.json` weiterhin `{}` — alles dokumentiert im Plan und den
jeweiligen Phasen zugeordnet, hier ohne Auftrag nicht berührt.
