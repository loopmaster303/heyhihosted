# Handoff — Phase 6: Create auf dem Telefon (2026-08-29)

**Ausgangspunkt:** `625523c` (Plan: [`PLAN-phase-6-create-telefon.md`](PLAN-phase-6-create-telefon.md))
**End-HEAD:** `41938e7` — **gepusht**, `origin/main = 41938e7` (selbst verifiziert).
**Tests:** 117 Suiten / **902 Tests grün** (`CI=1 npx jest --silent`), `npm run lint`,
`npx tsc --noEmit` und `npm run build` sauber; `/create` weiterhin statische Route.
**Koordination:** Ein zweiter Agent führte parallel Phase 4 + 5 aus (`54e6320`, `9fe5f81`,
`b9282c0`–`1606f1e`) und hat Phase 7 pausiert mit uncommittetem WIP im Baum
(Chat/Visualize/Config + Doc-Hunks). Diese Änderungen sind **nicht** Teil meiner Commits —
gestagt wurde pro Hunk (Hand-Patches gegen HEAD), geprüft auf Kontamination.

## Was geliefert wurde

| Paket | Commit | Inhalt |
|---|---|---|
| T1 | `5e3bdf1` | `viewport`-Export mit `viewportFit: 'cover'` in `src/app/create/page.tsx` |
| T5 | `5e3bdf1` | Referenz-Entfernen: `after:-inset-3` → 44 px Trefferfläche ohne Optik-Änderung |
| T6 (Pkt. 1–9) | `5e3bdf1` | ParamControls, ProviderSelect, ModeTabs, PlaygroundSidebar, ModelPicker: `h-11 md:h-8` bzw. `min-h-11 md:min-h-0` |
| T8 Teil 1 | `5e3bdf1` | `ui/drawer.tsx`: `DrawerContent` richtungsbewusst (`isBottom`), Default `bottom` = altes Verhalten |
| V1 Teil 1 | `5e3bdf1` | `src/hooks/useViewportHeight.ts` + 4 Tests (`--vvh` auf visual viewport) |
| V1 Teil 2 + T8 Teil 2 | `cbf3011` | Wiring: Shell nutzt `h-[var(--vvh,100dvh)]` (genau ein `h-dvh` bleibt: linker Drawer), Hook-Aufruf in `PlaygroundShell`, `direction="left"` an `DrawerContent` |
| T2 | `cbf3011` | `pb-[max(0.875rem,env(safe-area-inset-bottom))]`; CSS-Gegenprobe im Build bestanden; Textarea-Max an `--vvh` gekoppelt, `window.innerHeight` nur als Fallback |
| T3 | `cbf3011` | `grid-cols-2` unter 520 px, darüber `auto-fill minmax(168px,1fr)`; CSS-Gegenprobe bestanden |
| T4 | `cbf3011` | Drei Karten-Knöpfe auf 44 px (`min-h-11`/`size-11`, Desktop `md:`-Rückwert) |
| T7 | `cbf3011` | `RUN_CONTINUES_NOTICE` in `lib/playground/constants.ts`; `title` gestrichen, Satz sichtbar an der laufenden Karte; +1 Test |
| T6 Punkt 10 | `cbf3011` | MetaRail: drei Knöpfe `min-h-11 xl:min-h-0` (nachdem Phase 5 W4 MetaRail erweitert hatte) |
| T9 | `41938e7` | Wahrheitsdokumente: L-E.1/L-E.2 bleiben `offen` mit Betreiber-Vermerk, Kopf-Prüfzeile, L-K.2-Querverweis zur Konstante, Fahrplan-Marker „TEILWEISE", Telefon-Muster in `CLAUDE.md`, README-Index |

**Querlesen (Q):** Muster-Konsistenz per grep geprüft — `h-dvh` genau einmal in der Shell,
kein freiliebendes `h-8` in `src/components/playground/`, drei `min-h-11` in der Galerie,
kein `title=` mehr, MetaRail trägt `xl:` nicht `md:`. Kein Kriterium steht auf `erledigt`
ohne Messung.

## Betreiberaufgaben (ausdrückliche Anmerkung)

**Browser-Tests macht der Betreiber selbst, nicht der Agent.** Deshalb:

- **L-E.1** bleibt `offen` — Gerätetest mit zwei echten Geräten (iPhone + Android),
  Checkliste: [`PLAN-phase-6-create-telefon.md`](PLAN-phase-6-create-telefon.md) Abschnitt 8.
  Vorher Deploy-Stand abwarten (Push ist erfolgt); Pollen- **und** Pruna-Schlüssel
  hinterlegen; Warnung vor Abrechnung beim i2v-Lauf beachten (Abschnitt 8, Startbox).
- **L-E.2** bleibt `offen` — Messung bei 375 px (Q Schritt 5 im Plan: in jeder Hauptansicht
  `document.documentElement.scrollWidth` gegen `clientWidth`). Auffällige Schritte
  notieren; die Schrittnummer nennt das verantwortliche Paket.

## Abweichungen vom Plan

1. **Reihenfolge (Weg A):** Phase 4 + 5 liefen vorher beim Parallel-Agenten; alle
   Zeilennummern des Plans wurden gegen den dann aktuellen HEAD neu hergeleitet.
2. **T6 geteilt:** Punkt 10 (MetaRail) war durch Phase 5 B7 blockiert und folgte nach
   deren Landing.
3. **T8 geteilt:** `drawer.tsx` (inert, Default `bottom`) vorab, Aktivierung über
   `direction="left"` mit dem Shell-Commit.
4. **T4:** Der `className` von „Erneut versuchen" war nicht einzigartig (identisch bei den
   W3-Knöpfen „Einstellungen öffnen"/„Modell wählen"); eingegrenzt über `onClick={onRetry}`.
   Nur die drei im Plan genannten Knöpfe wurden geändert.
5. **T7:** Der im Plan angenommene bestehende `constants`-Import existierte nicht mehr —
   neuer Import nur mit `RUN_CONTINUES_NOTICE`.
6. **T2:** Das Plan-Snippet positionierte den JSX-Kommentar ungültig (nach `return (`);
   der Kommentar steht als `//`-Zeilen über dem `return`.

## Beobachtungen für die nächste Phase

- **Phase-4-Lücke:** W7/W8 wurden nicht an `PromptBar.tsx` ausgeführt — die dauerhafte
  Pruna-Zeile (L-K.2) und die Schlüsselpflicht-Zeile (L-I.3) an der Sendeleiste fehlen;
  der Bestätigungsdialog beim ersten Pruna-Lauf ebenso. `RUN_CONTINUES_NOTICE` steht als
  Konstante bereit (Vermerk steht bei L-K.2 in `LAUNCH_CRITERIA.md`).
- Die W3-Knöpfe „Einstellungen öffnen"/„Modell wählen" auf Fehlkarten haben kompakte
  Trefferflächen (< 44 px) — waren nicht in der Phase-6-Tabelle (W3 kam später).
- Offene Gerätefragen aus Plan Abschnitt 8 (Schritt 6: `offsetTop`; Schritt 15:
  `safe-area-inset-bottom` bei offener Tastatur) sind im Hook bewusst offen gelassen.
