# Session-Handoff — Phase 1 abgeschlossen: die Freigabeschwelle steht

**Datum:** 2026-08-28
**Branch:** `main`, HEAD `bff5c8d`
**Status:** **Uncommitted** — drei Dateien im Arbeitsbaum, Commit und Push warten
ausdrücklich auf Freigabe des Nutzers.
**Art der Sitzung:** Ausführung von [`PLAN-phase-1-launch-kriterien.md`](PLAN-phase-1-launch-kriterien.md)
nach Audit und Entscheidungsrounde. Kein Produktivcode, kein Fahrplan-Kontakt.

---

## 1. Was entstanden ist

| Datei | Art | Inhalt |
|---|---|---|
| `docs/LAUNCH_CRITERIA.md` | neu | Die Freigabeschwelle: 29 Gate-Kriterien (A–G, I, K), 1 bedingtes Kriterium (H), 4 akzeptierte Risiken (L), Nicht-Ziele (M), Zuordnungstabelle, Verweise |
| `docs/README.md` | +1 Zeile | Verweis auf `LAUNCH_CRITERIA.md` unter „Start Here" |
| `docs/HANDOFF-2026-08-28-phase-1.md` | neu | dieses Dokument |

Keine weitere Datei wurde angefasst. `next-env.d.ts` war vor Sitzungsbeginn bereits
modified (autogen-Churn) und blieb unberührt.

## 2. Entscheidungen des Nutzers (2026-08-28) — Bindung

1. **Impressum/DSGVO** → akzeptiertes Risiko, nicht Gate (L-L.4). Bereich J des Plans
   ist damit aufgelöst; die Datenfluss-Benennung aus L-J.1 lebt im Riskotext weiter.
2. **Pollinations-Server-Key bleibt**; L-K.1 bleibt Gate und wurde auf den
   Pollinations-Fall zugeschnitten. Pruna ist BYOP-only (Repo-Entscheidung `a0a2eb9`)
   und wird in L-K.1 als strukturell geschlossen benannt.
3. **Phase 9 → Bereich M.** L-H.1 bleibt als Bedingung stehen, falls der ASCII-Flow
   doch gebaut wird.
4. **Systemprompt-Thema („Burn the Corpos", `chat-options.ts:251`) kommt nicht ins
   Dokument.** Entscheidung getroffen, nicht dokumentiert.
5. **Kein Kontakt zum Fahrplan.** Keine Phase 11, keine Anpassung an
   `FAHRPLAN-create.md`.
6. **Commit/Push erst nach Abschluss + Doku + ausdrücklicher Freigabe.** Deshalb ist
   dieser Stand uncommitted.

## 3. Abweichungen vom Plan

1. **Annahme 1 des Plans ist tot.** Der Plan (2026-08-27) ging von offenem Arbeitsbaum
   und „Phase 0 nicht abgeschlossen" aus. Phase 0 ist seitdem abgeschlossen
   ([`HANDOFF-2026-08-28-phase-0.md`](HANDOFF-2026-08-28-phase-0.md)); geplant wurde
   gegen `f880389` plus offenen Baum, ausgeführt gegen `bff5c8d`. Für diese Phase
   folgenlos — sie fasst nur `docs/` an.
2. **Zielgröße „25 ± 3" ist aufgelöst, nicht erfüllt.** Die Gliederung des Plans zählt
   34 Kriterien; nach der J-Verschiebung sind es 33. Bewusst alle behalten: Jeder
   Prüfpunkt ist einzeln prüfbar, Zusammenlegen hätte Prüfwegs verschmolzen. Die
   Zielgröße war eine Selbstauflage des Plans und kollidierte mit seiner eigenen
   Gliederung.
3. **Eine Modell-ID taucht doch auf: `acestep` in L-G.4.** Der Reality-Check des Plans
   („keine einzige Modell-ID") bezog sich auf Modell-Kataloge; L-G.4 braucht den
   Bezeichner als greifbaren Grep. Einzige Ausnahme, bewusst.
4. **Die Freigaberegel nennt A–G und I–K** statt der geplanten Bereiche „A–H und J–L":
   J ist aufgelöst (Entscheidung 1), H ist bedingt (Entscheidung 3).
5. **Keine offenen-Fragen-Sektion im Zieldokument.** Alle sechs offenen Fragen des
   Plans sind entschieden (drei inhaltlich in den Kopf übernommen, zwei durch
   Plan-Defaults abgedeckt: Status-Spalte und Kopffeld „Letzte Prüfung/Geprüft von",
   eine laut Nutzer nicht dokumentiert).

## 4. Audit des Plans — Befunde vor der Ausführung

Vor der Ausführung wurde der Plan gegen `bff5c8d` und den Code geprüft
(`src/config/chat-options.ts:251` verifiziert, `translations.ts:184-188` verifiziert,
`docs/README.md` „Start Here" verifiziert, `LAUNCH_CRITERIA.md` nicht vorhanden
verifiziert). Drei Befunde flossen in Abschnitt 3 ein; der vierte — der Plan verbot
Commit/Push, der Auftrag verlangte Handoff — ist in Entscheidung 6 aufgelöst.

## 5. End-to-End-Verifikation

| Prüfung | Ergebnis |
|---|---|
| Jede Phase 2–9 in der Herkunft | 2→A, 3→B, 4→C, 5→D, 6→E, 7→F, 8→G, 9→H (bedingt); 10 in M |
| Status-Spalte je Kriterium | 29 × „offen" (A–G, I, K als Gates, H als Bedingung) |
| Akzeptierte Risiken mit Datum | 4 (L-L.1 – L-L.4) |
| Kein Modell-Katalog im Dokument | nur `acestep` als Legacy-Grep (Abschnitt 3.3) |
| Kein Adjektiv ohne Messpunkt | jede Formulierung mit Prüfweg |
| Kein Produktivcode berührt | `git status` zeigt nur die drei Docs-Dateien |
| `docs/README.md` | genau eine Zeile ergänzt |
| Kein Commit, kein Push | Arbeitsbaum trägt den Stand, HEAD bleibt `bff5c8d` |

## 6. Was nicht passiert ist

- Keine Kriterien abgehakt — das Dokument schreibt die Schwelle, es prüft sie nicht.
- Kein Domain-Kontakt, keine Vercel-Änderung (Phase 2).
- Kein Registry-Abgleich (Phase 3).
- Keine Datenschutzerklärung geschrieben — ihre Notwendigkeit steht als akzeptiertes
  Risiko in L-L.4.
- Fahrplan, `HANDOFF.md`, `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` unberührt.

## 7. Für den nächsten Thread

1. **Commit/Push nachholen, sobald der Nutzer freigibt** — der Stand liegt uncommitted
   im Arbeitsbaum; nach dem Push gehört eine Zeile zum neuen Handoff in
   `docs/README.md` („Start Here") dazu, wenn gewünscht.
2. `LAUNCH_CRITERIA.md` ist ab jetzt die Freigabereferenz — Phasen-Abschlüsse sollten
   ihre Kriterien dort auf Status prüfen, nicht im Fahrplan.
3. Phase 2 (`PLAN-phase-2-create-identität.md`) nimmt den Bereich A als Zielbild mit;
   der Plan stammt wie dieser von vor Phase-0-Abschluss und ist vor Ausführung gegen
   `bff5c8d` zu prüfen.
