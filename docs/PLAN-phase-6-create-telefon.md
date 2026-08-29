# Plan — Phase 6: Create auf dem Telefon

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development`.
> Die Pakete tragen `- [ ]`-Schritte nur dort, wo eine Reihenfolge zählt (V1, Q,
> Abschnitt 8); die Worker-Pakete T1–T9 sind je ein Auftrag am Stück.
> **Zweistufig geschnitten:** Stufe 1 (Urteilsbildung) ist erledigt — die vier Muster in
> Abschnitt 3 sind vom Betreiber am 2026-08-29 entschieden und stehen dort ausgeschrieben;
> **V1** und **Q** bleiben beim Hauptagenten. Stufe 2 (mechanisch) sind T1–T9: jedes nennt
> Datei, Zeile, exakte Änderung, Verifikationsbefehl und Fertig-Kriterium und ist von einem
> günstigen Worker ohne eigene Entscheidung ausführbar.

**Goal:** Create ist auf einem Telefon vollständig bedienbar — die Sendeleiste bleibt bei
offener Tastatur sichtbar, jede Trefferfläche ist unter `md` mindestens 44 px groß, die
Galerie zeigt auf jedem Telefon zwei Spalten, und L-E.2 (kein horizontales Scrollen bei
375 px) ist gemessen statt behauptet.

**Architecture:** Vier Muster (Abschnitt 3) statt Einzelfixes, weil Phase 8 sie erbt. Die
Shell bezieht ihre Höhe künftig aus `--vvh` (gesetzt von `useViewportHeight` aus
`window.visualViewport`) statt aus `dvh`, mit `100dvh` als Fallback im `var()`. Alles
Übrige sind Klassenänderungen in bestehenden Komponenten — keine neue Komponente, kein
neuer Zustand im `PlaygroundShell`.

**Tech Stack:** Next 16.1 (App Router), React 19.2, Tailwind 3.4.19 (`spacing.11` =
2.75 rem = 44 px, verifiziert), vaul 1.1.2 für die Schubladen, Jest + Testing Library.

**Datum:** 2026-08-29
**Branch:** `main`, HEAD `625523c` (= `origin/main`), Arbeitsbaum leer
**Ausgangsstand der Tests:** **111 Suiten, 854 Tests grün** — selbst gezogen mit
`CI=1 npx jest --silent`. Der Review-Handoff vom selben Tag nennt noch 109/852; die
Differenz stammt aus den beiden Testdateien, die `ffefb04` hinzugefügt hat. Für diesen
Plan gilt 111/854 als Untergrenze.
**Grundlage:** [`FAHRPLAN-create.md`](FAHRPLAN-create.md) Phase 6,
[`LAUNCH_CRITERIA.md`](LAUNCH_CRITERIA.md) Bereich E, `CLAUDE.md` Abschnitt
„Create — read before touching `/create`", [`HANDOFF-2026-08-29-audit-review.md`](HANDOFF-2026-08-29-audit-review.md)
Abschnitt 6, plus eine eigene Prüfung jeder Datei unter `src/app/create/` und
`src/components/playground/` gegen HEAD `625523c`.
**Art:** Plan. Kein Produktivcode in der Planungssitzung geschrieben.

**Fertig-Kriterien sind L-E.1 und L-E.2 aus [`LAUNCH_CRITERIA.md`](LAUNCH_CRITERIA.md),
nicht der Fahrplan-Text.** `LAUNCH_CRITERIA.md` ist die Statusquelle dieses Repos.

---

## 0. Vorbedingung — vor dem ersten Paket prüfen

> **Phase 4 und Phase 5 sind nicht gebaut.** Sie fassen dieselben zwei Dateien an, die
> dieser Plan umbaut: [`src/components/playground/Gallery.tsx`](../src/components/playground/Gallery.tsx)
> und [`src/app/create/PlaygroundShell.tsx`](../src/app/create/PlaygroundShell.tsx).

Beleg, gezogen am 2026-08-29:

| Prüfung | Ergebnis |
|---|---|
| `LAUNCH_CRITERIA.md` Bereich C (Phase 4), L-C.1 – L-C.4 | alle vier `Status: offen` |
| `LAUNCH_CRITERIA.md` Bereich D (Phase 5), L-D.1 – L-D.3 | alle drei `Status: offen` |
| `HANDOFF-2026-08-29-audit-review.md`, Abschnitt 7, Punkt 2 | „**Phase 4 ist die nächste Phase.**" |
| `git log --oneline` | `e9b75b0 feat: Phase 4 — Create-Route: /playground nach /create verlegt` |

Der Commit `e9b75b0` ist **nicht** die Fahrplan-Phase 4. Er führt Paket 4 aus
[`PLAN-audit-patch-2026-08-29.md`](PLAN-audit-patch-2026-08-29.md), Abschnitt 3 aus
(„Route `/playground` → `/create`"). Fahrplan-Phase 4 heißt „Fehlerklarheit und
Laufstabilität" und existiert nicht. Wer nur die Commit-Betreffs liest, hält Phase 4 für
erledigt — genau der Fehlertyp, den Befund N2 des letzten Reviews beschreibt.

### Die Kollision ist konkret, nicht theoretisch

Für Phase 4 liegt ein frischer, **nicht ausgeführter** Plan:
[`PLAN-phase-4-fehlerklarheit-2026-08-29.md`](PLAN-phase-4-fehlerklarheit-2026-08-29.md).
(Der ältere [`PLAN-phase-4-fehlerklarheit.md`](PLAN-phase-4-fehlerklarheit.md) vom
2026-08-27 trägt einen Veraltungsvermerk. Für **Phase 5 existiert kein Plan.**)

Dieser Phase-4-Plan nennt `PlaygroundShell.tsx` siebenmal, `Gallery.tsx` sechsmal und
`PromptBar.tsx` viermal. Die Überschneidungen Zeile für Zeile:

| Phase 4 ändert | Fundstelle im Phase-4-Plan | Kollidiert mit |
|---|---|---|
| `messageFrom()`, `PlaygroundShell.tsx:66-74` | Zeile 239 | — (V1 fasst nur `:387` und den Rumpfanfang an) |
| `nextRunId()` kollisionsfrei machen | Zeile 304 | — |
| `RunningCard` (`Gallery.tsx:67-104`), `{secs} s` → `m:ss` | Zeile 345 | **T4 und T7** — beide arbeiten in `:93-100` |
| `FailedCard`, `line-clamp-3` entfernen | Zeile 245 | **T4** — arbeitet in `:126-143` |
| `PromptBar` bekommt neue Props (`keyNotice`) | Zeile 361, 391 | **V1 und T2** |
| „vorher verifizieren, dass `Gallery.tsx` den Knopf ‚Nicht mehr warten' trägt" | Zeile 440 | **T7** lässt den Knopf stehen und ergänzt eine Zeile darunter — die Prüfung hält |

Der Phase-4-Plan hat das Problem selbst erkannt (Zeile 45: „berühren teils dieselben
Dateien"). Es ist also keine Nachlässigkeit auf einer Seite, sondern eine echte
Reihenfolgeentscheidung.

**Konsequenz — der Betreiber entscheidet vor Paket T1:**

- **Weg A (Fahrplan-Reihenfolge, empfohlen):** Erst Phase 4, dann Phase 5, dann dieser
  Plan. Der Fahrplan begründet die Kette (`Phase 4 ─► Phase 5 ─► Phase 6`), und der
  Phase-4-Plan liegt fertig da. Dieser Plan bleibt dann liegen und ist vor der Ausführung
  **erneut gegen den dann aktuellen HEAD zu prüfen** — sämtliche Zeilennummern unten
  stammen aus `625523c`. Betroffen wären vor allem T4 und T7 (`RunningCard`,
  `FailedCard`) sowie V1 und T2 (`PromptBar`).
- **Weg B (Phase 6 vorziehen):** Möglich, aber nicht umsonst. Der Phase-4-Plan müsste
  danach in denselben sechs Blöcken nachgezogen werden, und der Preis fällt zweimal an:
  einmal für Phase 4, einmal für Phase 5 (Herkunftsfilter und Löschen, wieder in
  `Gallery.tsx`). Wer diesen Weg wählt, trägt es in
  `PLAN-phase-4-fehlerklarheit-2026-08-29.md` als Veraltungsvermerk nach — sonst plant
  Phase 4 gegen Zeilen, die es nicht mehr gibt. Das ist genau der Fehler, den die
  bisherigen drei Pläne dieses Repos gemacht haben.

**Ein Berührungspunkt besteht in beiden Wegen und ist in Paket T7 aufgelöst:** L-K.2
(Phase 4) verlangt eine Dauerzeile an der **Sendeleiste**, *bevor* ein Pruna-Lauf startet.
T7 macht denselben Satz an der **laufenden Karte** sichtbar, *nachdem* er gestartet ist.
Zwei Orte, ein Satz — T7 legt ihn deshalb als exportierte Konstante ab, damit Phase 4 ihn
wiederverwendet statt ihn zu duplizieren.

---

## 1. Was Phase 6 wirklich ist

Der Fahrplan-Text zu Phase 6 stammt vom 2026-08-26 und beschreibt einen Zustand, den es
nicht mehr gibt. Erster Punkt dort:

> „Drei-Spalten-Aufbau auf klein: Parameter und Detailleiste als Schubladen"

**Das ist gebaut.** Verifiziert gegen `625523c`:

| Behauptung | Beleg |
|---|---|
| Parameter als Schublade | [`PlaygroundShell.tsx:478-483`](../src/app/create/PlaygroundShell.tsx) — `<Drawer direction="left">` mit `PlaygroundSidebarContent` |
| Detailleiste als Schublade | [`PlaygroundShell.tsx:486-503`](../src/app/create/PlaygroundShell.tsx) — Bottom-`Drawer` mit `MetaRail`, `max-h-[85dvh]` |
| Nur auf klein | [`PlaygroundShell.tsx:411`](../src/app/create/PlaygroundShell.tsx) — Menüknopf `className="md:hidden"` |
| Feste Spalte ab md | [`PlaygroundSidebar.tsx:176`](../src/components/playground/PlaygroundSidebar.tsx) — `hidden … md:flex` |
| Rail ab xl, sonst Drawer | [`PlaygroundShell.tsx:94`](../src/app/create/PlaygroundShell.tsx) `useMediaQuery('(min-width: 1280px)')`, [`:436`](../src/app/create/PlaygroundShell.tsx) `hidden … xl:block` |

**Die Phase ist damit kleiner als ihr Text — aber nicht leer.** Was tatsächlich fehlt,
gemessen am Code, nicht an der Vermutung:

| # | Befund | Beleg |
|---|---|---|
| 1 | Kein `visualViewport`-Code im ganzen Repo | `grep -rn "visualViewport" src/` → 0 Treffer |
| 2 | Kein `viewport`-Export, damit kein `viewport-fit=cover` | [`layout.tsx:10-19`](../src/app/layout.tsx) hat nur `metadata`; [`create/page.tsx`](../src/app/create/page.tsx) nur `metadata` |
| 3 | Kein `safe-area-inset` / `env()` irgendwo | `grep -rn "safe-area" src/` → 0; `grep -n "env(" src/app/globals.css` → 0 |
| 4 | Textarea wächst auf `window.innerHeight * 0.45` | [`PromptBar.tsx:46`](../src/components/playground/PromptBar.tsx) — 365 px auf einem 812-px-Gerät, unabhängig davon, wie viel davon die Tastatur verdeckt |
| 5 | Galerie kippt zwischen 375 und 390 px von einer auf zwei Spalten | [`Gallery.tsx:238`](../src/components/playground/Gallery.tsx) `minmax(168px, 1fr)`, `gap-3` = 12 px, `p-4` = 2 × 16 px. Bei 375 px: 343 px innen, zwei Spalten bräuchten 348 |
| 6 | Trefferflächen zwischen 20 px und 36 px | siehe Tabelle in Abschnitt 3.4 |
| 7 | Der Grund für „Nicht mehr warten" steht in einem `title` | [`Gallery.tsx:96`](../src/components/playground/Gallery.tsx) — auf dem Telefon gibt es kein Hover |
| 8 | `DrawerContent` vergibt Bottom-Sheet-Klassen an alle Richtungen | [`ui/drawer.tsx:46`](../src/components/ui/drawer.tsx) — `fixed inset-x-0 bottom-0 mt-24 rounded-t-3xl`, plus der mittige Griff in [`:51`](../src/components/ui/drawer.tsx); der linke Drawer erbt sie |
| 9 | L-E.2 ist nie gemessen worden | `LAUNCH_CRITERIA.md`, L-E.2, `Status: offen` |

Befund 7 stammt wörtlich aus [`HANDOFF-2026-08-29-audit-review.md`](HANDOFF-2026-08-29-audit-review.md),
Abschnitt 3: „Phase 6 (Telefon) und `L-K.2` sollten den Satz sichtbar machen, statt ihn
im Tooltip zu lassen."

---

## 2. Ausführungsregeln

### 2.1 Skill und Ablauf

Der Hauptagent lädt zu Beginn `superpowers:subagent-driven-development` und folgt ihm.
Je Worker-Paket immer derselbe Ablauf:

1. Hauptagent liest das Paket unten und gibt es **wörtlich** an einen Worker.
2. Worker fasst nur die genannten Dateien an, führt die genannte Verifikation aus und
   meldet Ergebnis plus Verifikationsausgabe zurück.
3. Hauptagent prüft das Fertig-Kriterium selbst nach — er glaubt dem Worker nicht, er
   führt die Verifikation nochmal aus.
4. Erst dann das nächste Paket.

**Kein Worker committet.** Commits macht ausschließlich der Hauptagent.

### 2.2 Modellwahl

| Umgebung | Worker-Modell |
|---|---|
| Claude Code (`Agent`-Tool) | **Sonnet 5** — `model: "sonnet"` |
| OpenCode oder anderer Coding-Agent | **GLM 5.3 Flash** oder **DeepSeek Flash** |

Der Hauptagent bleibt auf dem stärkeren Modell. Die Pakete T1–T9 sind so geschnitten,
dass ein günstiger Worker sie ohne eigene Urteilsbildung schafft: jedes nennt Datei,
Zeile, exakte Änderung, Verifikationsbefehl und Fertig-Kriterium. Wo eine Entscheidung
nötig war, steht sie **schon im Paket** (Abschnitt 3) — der Worker trifft keine.

**V1 und Q sind nicht delegierbar** und bleiben beim Hauptagenten. Begründung jeweils im
Paket.

### 2.3 Verbote für Worker

- Keine Datei anfassen, die im Paket nicht genannt ist.
- Kein „nebenbei aufräumen", kein Umformatieren, keine Umbenennung von Symbolen.
- Kein `git commit`, kein `git push`, kein `git stash`.
- **`src/components/ui/switch.tsx`, `src/components/ui/slider.tsx`, `src/components/ui/button.tsx`
  und `src/components/ui/input.tsx` nicht anfassen** — app-weit geteilt, siehe 3.4.
- Nicht `src/components/playground/`, `src/lib/playground/`, `PlaygroundShell`, die
  `playground.*`-Übersetzungsschlüssel oder `PLAYGROUND_CONVERSATION_ID` umbenennen —
  `LAUNCH_CRITERIA.md` Bereich M schließt das ausdrücklich aus.
- **Keinen Browser öffnen.** Die Preview-Messung ist Paket Q und braucht die Freigabe des
  Betreibers (Abschnitt 5).
- Bei Unklarheit: abbrechen und zurückmelden, nicht raten.

### 2.4 Verifikation

Voller Durchlauf:

```bash
npm run lint && npx tsc --noEmit && CI=1 npx jest --silent && npm run build
```

**Die Testzahl darf in keinem Paket sinken.** Untergrenze: 111 Suiten, 854 Tests.

---

## 3. Die vier Muster — festgelegt, nicht mehr abzuwägen

> **Phase 8 (Musik im Create) erbt diese vier Muster.** Der Fahrplan sagt unter Phase 6:
> „Die Musik-Oberfläche folgt dann dem hier festgelegten Muster, statt zweimal gebaut zu
> werden." Deshalb stehen sie hier als Muster und nicht nur als Änderungen.

### 3.1 Muster „sichtbare Höhe" — die Sendeleiste bleibt über der Tastatur

**Entscheidung des Betreibers, 2026-08-29:** visualViewport-Hook. Die Leiste bleibt
sichtbar, die Galerie schrumpft.

**Warum überhaupt etwas zu tun ist.** Die Sendeleiste ist heute keine fixierte Leiste,
sondern die untere Zeile eines Grids:
[`PlaygroundShell.tsx:387`](../src/app/create/PlaygroundShell.tsx) `h-dvh grid-rows-[46px_1fr]`,
darin [`:421`](../src/app/create/PlaygroundShell.tsx) `grid-rows-[1fr_auto]` mit der
`PromptBar` als `auto`-Zeile. Die Bildschirmtastatur verkleinert auf iOS Safari und
Android Chrome den **visual** viewport; `dvh` folgt dem **layout** viewport und bleibt
gleich groß. Das Grid behält also seine Höhe und schiebt seine untere Zeile unter die
Tastatur. Weil der einzige Scrollbereich innen liegt
([`Gallery.tsx:226`](../src/components/playground/Gallery.tsx) `overflow-y-auto`), kann
der Browser sie auch nicht in Sicht scrollen. Das verletzt L-E.1 wörtlich: „kein
Bedienelement bleibt unerreichbar oder von der Tastatur verdeckt."

**Das Muster:** Ein Hook setzt die tatsächliche sichtbare Höhe als CSS-Variable auf
`document.documentElement`; jede Vollbild-Oberfläche im Create-Zweig nutzt
`h-[var(--vvh,100dvh)]` statt `h-dvh`. Der Fallback im `var()` trägt überall dort, wo es
`visualViewport` nicht gibt — ältere Browser und jsdom.

### 3.2 Muster „Schubladen" — links lang, unten kurz

**Entscheidung des Betreibers, 2026-08-29:** So lassen, nur härten.

- **Lange Eingabelisten** (Provider, Modus, Modell, Parameter, Referenzen, Quellvideo)
  kommen **von links über die volle Höhe**. Sie brauchen die Höhe; ein Bottom-Sheet
  würde ihren inneren Scroll gegen vauls Zieh-Geste stellen.
- **Ergebnis-Details** (kurz, mit Aktionen) kommen **von unten**, daumennah.

Kein Formwechsel in dieser Phase. Was sich ändert, ist ausschließlich Befund 8: der linke
Drawer erbt heute die Bottom-Sheet-Klassen (Paket T8).

**Für Phase 8:** Die Musik-Parameter (Beschreibung, Dauer, instrumental, Modellwahl)
gehören nach links. Die Ergebnisliste mit Abspieler folgt der Galerie, ihre Detailansicht
dem Bottom-Drawer.

### 3.3 Muster „Raster" — zwei Spalten auf jedem Telefon

**Entscheidung des Betreibers, 2026-08-29:** Zwei Spalten erzwingen.

Unter 520 px feste zwei Spalten, darüber unverändert `auto-fill` mit `minmax(168px, 1fr)`.
520 px ist die Grenze, an der `auto-fill` von sich aus mindestens zwei Spalten liefert
(520 − 32 = 488 ≥ 2 × 168 + 12 = 348) — der Übergang ist damit nahtlos und die
Desktop-Ansicht bleibt unverändert. Kacheln behalten ihr natürliches Seitenverhältnis;
es wird weiterhin nichts beschnitten.

### 3.4 Muster „Trefferfläche" — 44 px, nur unter `md`

**Entscheidung des Betreibers, 2026-08-29:** 44 px (Apple HIG), erzwungen nur auf kleinen
Geräten. Der Desktop behält seine kompakte Parameterspalte.

Gemessener Ist-Stand gegen `625523c`:

| Element | heute | Datei:Zeile |
|---|---|---|
| Referenz entfernen | **20 px** (`h-5 w-5`) | [`ReferenceSlots.tsx:132`](../src/components/playground/ReferenceSlots.tsx) |
| Fehlkarte verwerfen | **24 px** (`h-6 w-6`) | [`Gallery.tsx:140`](../src/components/playground/Gallery.tsx) |
| „Nicht mehr warten" | ~24 px (`py-1`, `text-[10.5px]`) | [`Gallery.tsx:93-100`](../src/components/playground/Gallery.tsx) |
| „Erneut versuchen" | ~24 px (`py-1`, `text-[10.5px]`) | [`Gallery.tsx:126-133`](../src/components/playground/Gallery.tsx) |
| Zahlenfeld | 32 px (`h-8`) | [`ParamControls.tsx:99`](../src/components/playground/ParamControls.tsx) |
| Enum-Auswähler | 32 px (`h-8`) | [`ParamControls.tsx:119`](../src/components/playground/ParamControls.tsx) |
| Textfeld einzeilig | 32 px (`h-8`) | [`ParamControls.tsx:176`](../src/components/playground/ParamControls.tsx) |
| Key-Feld / „Verbinden" | 32 px (`h-8`) | [`ProviderSelect.tsx:114,116`](../src/components/playground/ProviderSelect.tsx) |
| Video hochladen | 32 px (`h-8`) | [`PlaygroundSidebar.tsx:140`](../src/components/playground/PlaygroundSidebar.tsx) |
| Modus-Reiter | ~33 px (`py-2`, `text-xs`) | [`ModeTabs.tsx:21`](../src/components/playground/ModeTabs.tsx) |
| MetaRail-Knöpfe | 36 px (`size="sm"`) | [`MetaRail.tsx:113,117,124`](../src/components/playground/MetaRail.tsx) |
| Modell-Auswähler | ~40 px (`h-auto py-2.5`) | [`ModelPicker.tsx:78`](../src/components/playground/ModelPicker.tsx) |
| Kopfzeile / Senden | 40 px (`size="icon"` / `h-10`) | [`ui/button.tsx:26-27`](../src/components/ui/button.tsx) |

**Die Regel, die ein Worker anwendet — zwei Fälle, keine Abwägung:**

- **Fall A — es ist Platz:** echte Mindesthöhe. `min-h-11 md:min-h-0` bei Knöpfen mit
  Textinhalt, `h-11 md:h-8` bei Feldern, die heute `h-8` tragen.
- **Fall B — der Knopf sitzt auf einem Bild und darf nicht wachsen:** unsichtbare
  Trefferfläche über ein Pseudo-Element, `after:absolute after:-inset-3 after:content-['']`.
  20 px + 2 × 12 px = 44 px, ohne dass sich optisch etwas ändert. Gilt genau für den
  Entfernen-Knopf in `ReferenceSlots`.

**Breakpoint-Sonderfall `MetaRail`:** Der Rail-Container ist `xl:block`
([`PlaygroundShell.tsx:436`](../src/app/create/PlaygroundShell.tsx)), nicht `md`. Zwischen
768 px und 1280 px erscheint `MetaRail` **nur** im Bottom-Drawer — dort gilt weiterhin
Fingerbedienung. Seine Knöpfe bekommen deshalb `xl:min-h-0`, nicht `md:min-h-0`.

**Ausdrücklich ausgenommen:** `Switch` und `Slider` in `ParamControls`. Beide kommen aus
`src/components/ui/` und werden app-weit geteilt — Create hat nicht die Autorität, ihre
Maße für den Chat mitzuentscheiden. Als offener Punkt in Abschnitt 7 vermerkt.
`ui/drawer.tsx` ist der einzige `ui/`-Baustein, den dieser Plan anfasst; er wird
ausschließlich von Create benutzt (verifiziert: `grep -rln "ui/drawer" src/` liefert nur
`src/app/create/*`).

---

## 4. Reihenfolge

```
T1 ──► V1 ──► T2                    (Viewport-Kette, streng seriell)
       │
       ├──► T3 ──► T4 ──► T7        (Gallery.tsx, streng seriell)
       │
       ├──► T5                      (ReferenceSlots.tsx, frei)
       ├──► T6                      (Parameterschublade, frei)
       ├──► T8                      (ui/drawer.tsx, frei)
       │
       └──► T9 ──► Q                (Doku zuletzt, dann Querlesen)
```

**Was seriell laufen muss und warum — Dateikollision, nicht Themenverwandtschaft:**

- **T3, T4, T7** fassen alle drei `Gallery.tsx` an. Parallel = Konflikt.
- **V1 und T2** fassen beide `PromptBar.tsx` an; T2 verbraucht außerdem, was T1 setzt.
- **T1 vor V1**, weil V1s Fertig-Kriterium den `viewport`-Export als vorhanden annimmt.

**Was wirklich parallel darf:** T5, T6, T8 — je eigene Dateien, kein Überschneiden mit
T3/T4/T7 oder der Viewport-Kette.

> Diese Auflistung ist bewusst explizit. Ruling 2 des letzten Reviews fand einen Plan, der
> Parallelität behauptete, die es nicht gab — drei Pakete fassten dieselbe Datei an.

---

## 5. Nicht delegierbar — V1

### V1 — Muster „sichtbare Höhe" *(Hauptagent)*

**Warum nicht delegierbar:** Der Hook legt fest, wie jede künftige Vollbild-Oberfläche
im Create-Zweig ihre Höhe bezieht — Phase 8 erbt ihn ungeprüft. Außerdem verlangt er
eine Entscheidung, die kein Paket vorwegnehmen kann: `visualViewport` meldet neben
`height` auch `offsetTop`, und ob der iOS-Fall diesen Versatz braucht, lässt sich **ohne
echtes Gerät nicht entscheiden**. Der Hook wird deshalb bewusst ohne `offsetTop` gebaut
und die Frage als Prüfpunkt an den Betreiber weitergereicht (Abschnitt 8, Punkt 4).

**Dateien:**
- Neu: `src/hooks/useViewportHeight.ts`
- Neu: `src/hooks/useViewportHeight.test.ts`
- Ändern: `src/app/create/PlaygroundShell.tsx:387`
- Ändern: `src/components/playground/PromptBar.tsx:42-49`

**Exakte Änderungen:**

1. `src/hooks/useViewportHeight.ts` anlegen:

```ts
"use client";

import { useEffect } from 'react';

/**
 * Setzt `--vvh` auf die Hoehe des *visual* viewport.
 *
 * Warum nicht `dvh`: Die Bildschirmtastatur verkleinert auf iOS Safari und
 * Android Chrome den visual viewport, nicht den layout viewport. `100dvh`
 * bleibt bei offener Tastatur so gross wie vorher — ein Grid mit `h-dvh`
 * schiebt seine untere Zeile damit unter die Tastatur, und weil der einzige
 * Scrollbereich innen liegt, kann der Browser sie nicht in Sicht scrollen.
 *
 * Ohne `visualViewport` (aeltere Browser, jsdom) wird nichts gesetzt; der
 * CSS-Fallback in `var(--vvh, 100dvh)` traegt dann.
 *
 * `offsetTop` bleibt bewusst unbeachtet: ob iOS den sichtbaren Bereich bei
 * offener Tastatur zusaetzlich verschiebt, ist ohne echtes Geraet nicht zu
 * entscheiden. Siehe docs/PLAN-phase-6-create-telefon.md, Abschnitt 8.
 */
export function useViewportHeight(): void {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const apply = () => root.style.setProperty('--vvh', `${vv.height}px`);
    apply();
    vv.addEventListener('resize', apply);
    return () => {
      vv.removeEventListener('resize', apply);
      root.style.removeProperty('--vvh');
    };
  }, []);
}
```

2. `src/hooks/useViewportHeight.test.ts` anlegen. jsdom kennt `window.visualViewport`
   nicht — der Test legt es selbst an:

```ts
import { renderHook } from '@testing-library/react';
import { useViewportHeight } from './useViewportHeight';

type Listener = () => void;

function fakeViewport(height: number) {
  const listeners: Listener[] = [];
  const vv = {
    height,
    addEventListener: (_: string, fn: Listener) => { listeners.push(fn); },
    removeEventListener: (_: string, fn: Listener) => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    },
  };
  Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true });
  return {
    resizeTo(next: number) { vv.height = next; listeners.forEach((fn) => fn()); },
    get listenerCount() { return listeners.length; },
  };
}

afterEach(() => {
  Object.defineProperty(window, 'visualViewport', { value: undefined, configurable: true });
  document.documentElement.style.removeProperty('--vvh');
});

test('setzt --vvh auf die Hoehe des visual viewport', () => {
  fakeViewport(812);
  renderHook(() => useViewportHeight());
  expect(document.documentElement.style.getPropertyValue('--vvh')).toBe('812px');
});

test('zieht --vvh nach, wenn die Tastatur den viewport verkleinert', () => {
  const vv = fakeViewport(812);
  renderHook(() => useViewportHeight());
  vv.resizeTo(476);
  expect(document.documentElement.style.getPropertyValue('--vvh')).toBe('476px');
});

test('raeumt Listener und Variable beim Unmount ab', () => {
  const vv = fakeViewport(812);
  const { unmount } = renderHook(() => useViewportHeight());
  unmount();
  expect(vv.listenerCount).toBe(0);
  expect(document.documentElement.style.getPropertyValue('--vvh')).toBe('');
});

test('ohne visualViewport passiert nichts', () => {
  renderHook(() => useViewportHeight());
  expect(document.documentElement.style.getPropertyValue('--vvh')).toBe('');
});
```

3. `PlaygroundShell.tsx`: Import ergänzen und den Hook in der Komponente aufrufen. Der
   Import gehört zu den übrigen Hook-Importen (nach Zeile 15):

```ts
import { useViewportHeight } from '@/hooks/useViewportHeight';
```

   Aufruf als erste Zeile im Rumpf von `PlaygroundShell`, direkt vor
   `const { state, setMode, … } = usePlaygroundState();`:

```ts
  useViewportHeight();
```

4. `PlaygroundShell.tsx:387`: im `className` des äußeren `div` **`h-dvh` durch
   `h-[var(--vvh,100dvh)]` ersetzen**. Alle übrigen Klassen bleiben unverändert.

5. `PromptBar.tsx:42-49`: Das Textarea-Maximum hängt an `window.innerHeight`, das die
   Tastatur nicht kennt. An dieselbe Variable koppeln:

```tsx
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    // An die sichtbare Hoehe koppeln, nicht an window.innerHeight: bei offener
    // Tastatur ist innerHeight unveraendert und das Feld waechst ueber den
    // sichtbaren Bereich hinaus. useViewportHeight setzt --vvh.
    const visible = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--vvh'),
    ) || window.innerHeight;
    const max = Math.round(visible * 0.45);
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  }, [value]);
```

**Verifikation:**
```bash
CI=1 npx jest --silent src/hooks/useViewportHeight.test.ts
grep -n "h-\[var(--vvh,100dvh)\]" src/app/create/PlaygroundShell.tsx
grep -c "h-dvh" src/app/create/PlaygroundShell.tsx
grep -n "window.innerHeight" src/components/playground/PromptBar.tsx
CI=1 npx jest --silent && npx tsc --noEmit && npm run lint
```

**Fertig, wenn:** Die vier neuen Tests sind grün. Der erste `grep` findet die Klasse in
Zeile 387. Der `grep -c "h-dvh"` steht auf **1** — der linke Drawer in Zeile 479 behält
sein `h-dvh` bewusst, weil vaul ihn `fixed` positioniert und er nicht am Grid hängt. In
`PromptBar.tsx` steht `window.innerHeight` nur noch als Fallback hinter `||`.
Gesamtsuite ≥ 111 Suiten / 858 Tests, `tsc` und `lint` sauber.

---

## 6. Arbeitspakete für Worker

### T1 — `viewport-fit=cover` für `/create`

**Befund:** Ohne `viewport-fit=cover` liefert `env(safe-area-inset-bottom)` auf iOS
konstant `0`. Die Sendeleiste kann deshalb heute gar keinen Abstand zum Home-Indicator
halten, egal wie sie gestylt wird. Next setzt ohne eigenen Export nur
`width=device-width, initial-scale=1`; ein `viewport`-Export existiert nirgends im Repo
(`grep -rn "export const viewport" src/` → 0 Treffer).

**Datei:** `src/app/create/page.tsx` (7 Zeilen, vollständig unten)

**Exakte Änderung — die Datei danach vollständig:**

```tsx
import type { Viewport } from 'next';
import { PlaygroundShell } from './PlaygroundShell';

export const metadata = { title: 'heyhi / create' };

// viewport-fit=cover ist die Voraussetzung dafuer, dass env(safe-area-inset-*)
// auf iOS ueberhaupt Werte ungleich 0 liefert — ohne das kann die Sendeleiste
// keinen Abstand zum Home-Indicator halten. Bewusst nur hier und nicht im
// Root-Layout: der Chat behandelt safe-area nirgends und wuerde die Aenderung
// ungefragt mitbekommen.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function PlaygroundPage() {
  return <PlaygroundShell />;
}
```

**Nicht anfassen:** `metadata`. Die Meta-Beschreibung von `/create` ist L-A.5 und gehört
zu Phase 2 — sie steht in `LAUNCH_CRITERIA.md` weiterhin auf `offen`.

**Verifikation:**
```bash
grep -n "viewportFit" src/app/create/page.tsx
npx tsc --noEmit && npm run build
```
**Fertig, wenn:** Der `grep` findet `viewportFit: 'cover'`. `tsc` sauber, `npm run build`
erfolgreich und `/create` weiterhin als statische Route ausgewiesen.

---

### T2 — Sendeleiste: Abstand zum Home-Indicator

**Voraussetzung:** T1 und V1 sind fertig.

**Befund:** Die Sendeleiste endet mit `pb-3.5` (14 px). Auf einem Gerät mit
Home-Indicator liegt der Senden-Knopf damit im Wischbereich des Systems.

**Datei:** `src/components/playground/PromptBar.tsx:55`

**Exakte Änderung:** Im äußeren `div`

```tsx
    <div className="px-4 pb-3.5 pt-3">
```

ersetzen durch

```tsx
    {/* max() statt env(): auf Geraeten ohne Home-Indicator ist der Inset 0 und
        die bisherigen 14px bleiben stehen. Braucht viewport-fit=cover aus
        src/app/create/page.tsx, sonst ist der Inset immer 0. */}
    <div className="px-4 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
```

`0.875rem` ist der exakte Wert von `pb-3.5` — der Abstand ändert sich also nirgends dort,
wo es keinen Inset gibt.

**Verifikation:**
```bash
grep -n "safe-area-inset-bottom" src/components/playground/PromptBar.tsx
npm run build && grep -rl "safe-area-inset-bottom" .next/static/css/ | head -1
CI=1 npx jest --silent src/components/playground/PromptBar.test.tsx
```
**Fertig, wenn:** Der erste `grep` findet die Klasse. Der zweite Befehl nennt mindestens
eine CSS-Datei — das belegt, dass Tailwind den arbitrary value tatsächlich erzeugt hat
und die Klasse nicht still verschluckt wurde. `PromptBar.test.tsx` bleibt grün.

---

### T3 — Galerie: zwei Spalten auf jedem Telefon

**Voraussetzung:** keine. Läuft parallel zur Viewport-Kette. **Danach T4, dann T7 — alle
drei in `Gallery.tsx`.**

**Befund:** siehe 3.3. Bei 375 px eine Spalte, ab 390 px zwei.

**Datei:** `src/components/playground/Gallery.tsx:236-239`

**Exakte Änderung:** Das `div` mit dem Inline-`style`

```tsx
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))' }}
      >
```

ersetzen durch

```tsx
      {/* Unter 520px feste zwei Spalten: auto-fill mit 168px kippt sonst
          zwischen 375px (eine Spalte) und 390px (zwei) — zwei Telefone saehen
          voellig verschieden aus. Ab 520px liefert auto-fill von sich aus
          mindestens zwei, der Uebergang ist damit nahtlos und der Desktop
          unveraendert. */}
      <div className="grid grid-cols-2 gap-3 min-[520px]:[grid-template-columns:repeat(auto-fill,minmax(168px,1fr))]">
```

Das Inline-`style` entfällt ersatzlos.

**Verifikation:**
```bash
grep -n "gridTemplateColumns" src/components/playground/Gallery.tsx
grep -n "min-\[520px\]" src/components/playground/Gallery.tsx
npm run build && grep -rho "minmax(168px,1fr)" .next/static/css/ | head -1
CI=1 npx jest --silent src/components/playground/Gallery.test.tsx
```
**Fertig, wenn:** Der erste `grep` findet **nichts** mehr. Der zweite findet die
Breakpoint-Klasse. Der dritte gibt `minmax(168px,1fr)` aus — das belegt, dass Tailwind
die arbitrary property erzeugt hat; bliebe die Ausgabe leer, wäre die Klasse still
verschluckt worden und der Desktop hätte gar kein Raster mehr. `Gallery.test.tsx` grün.

---

### T4 — Galerie-Karten: Trefferflächen

**Voraussetzung:** T3 ist fertig (dieselbe Datei).

**Befund:** Drei Bedienelemente auf den Lauf-Karten liegen zwischen 24 px und 24 px,
siehe Tabelle in 3.4. Regel Fall A aus 3.4 gilt: es ist Platz, also echte Mindesthöhe.

**Datei:** `src/components/playground/Gallery.tsx`

**Exakte Änderungen — drei Stellen:**

1. Zeile 93-100, Knopf „Nicht mehr warten". `className` ersetzen:

```tsx
          className="mt-1 min-h-11 rounded-md border border-border bg-background px-3 py-1 text-[10.5px] font-medium text-muted-foreground transition-colors hover:border-primary/55 hover:text-foreground md:min-h-0 md:px-2"
```

2. Zeile 126-133, Knopf „Erneut versuchen". `className` ersetzen:

```tsx
            className="min-h-11 rounded-md border border-border bg-background px-3 py-1 text-[10.5px] font-medium text-foreground transition-colors hover:border-primary/55 md:min-h-0 md:px-2"
```

3. Zeile 135-143, Knopf „Verwerfen". `className` ersetzen:

```tsx
            className="grid size-11 place-items-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-primary/55 hover:text-foreground md:size-6"
```

**Verifikation:**
```bash
grep -n "min-h-11\|size-11" src/components/playground/Gallery.tsx
grep -c "h-6 w-6" src/components/playground/Gallery.tsx
CI=1 npx jest --silent src/components/playground/Gallery.test.tsx
npm run lint
```
**Fertig, wenn:** Der erste `grep` findet genau drei Zeilen (93er, 126er, 135er Block).
Der zweite steht auf **0**. `Gallery.test.tsx` grün, `lint` sauber.

---

### T5 — Referenz-Slots: entfernen mit dem Finger

**Voraussetzung:** keine. Läuft parallel.

**Befund:** Der Entfernen-Knopf ist 20 px groß und sitzt auf dem Vorschaubild
([`ReferenceSlots.tsx:128-135`](../src/components/playground/ReferenceSlots.tsx)). Regel
Fall B aus 3.4 gilt: er darf nicht wachsen, also unsichtbare Trefferfläche.

**Datei:** `src/components/playground/ReferenceSlots.tsx:128-135`

**Exakte Änderung:** Im Knopf `aria-label={`${label} entfernen`}` das `className`
ersetzen:

```tsx
                  className="absolute right-1.5 top-1.5 z-10 grid h-5 w-5 place-items-center rounded bg-black/70 text-white backdrop-blur-sm transition-colors after:absolute after:-inset-3 after:content-[''] hover:bg-black/85"
```

Das `after`-Pseudo-Element vergrößert die Trefferfläche von 20 px auf 20 + 2 × 12 = 44 px,
ohne dass sich optisch etwas ändert. Der Knopf ist bereits `absolute`, das Pseudo-Element
bezieht sich also auf ihn.

**Nicht ändern:** Der Slot selbst (`aspect-square`, `grid-cols-2`) bleibt wie er ist. In
der Parameterschublade (max. 310 px breit, `p-3.5`) ergibt das ~127 px pro Kachel — weit
über 44 px.

**Verifikation:**
```bash
grep -n "after:-inset-3" src/components/playground/ReferenceSlots.tsx
CI=1 npx jest --silent src/components/playground/ReferenceSlots.test.tsx
npm run lint
```
**Fertig, wenn:** Der `grep` findet genau eine Zeile. `ReferenceSlots.test.tsx` grün
(198 Zeilen, rendert die echte Komponente — nur `lucide-react` ist gemockt, die Klassen
sind also real prüfbar). `lint` sauber.

---

### T6 — Parameterschublade und Detailleiste: Trefferflächen

**Voraussetzung:** keine. Läuft parallel.

**Befund:** Neun Bedienelemente in fünf Dateien liegen bei 32–36 px, siehe Tabelle in
3.4. Regel Fall A gilt überall.

**Dateien:** `ParamControls.tsx`, `ProviderSelect.tsx`, `ModeTabs.tsx`,
`PlaygroundSidebar.tsx`, `ModelPicker.tsx`, `MetaRail.tsx` — alle unter
`src/components/playground/`.

**Exakte Änderungen — `h-8` wird zu `h-11 md:h-8`, sonst `min-h-11 md:min-h-0`:**

1. `ParamControls.tsx:99` (Zahlenfeld): `className="h-8 text-xs"` →
   `className="h-11 text-xs md:h-8"`
2. `ParamControls.tsx:119` (Enum-Auswähler): `className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-xs hover:bg-accent"` →
   dasselbe mit `h-11` statt `h-8` und `md:h-8` angehängt
3. `ParamControls.tsx:176` (einzeiliges Textfeld): `className="h-8 text-xs"` →
   `className="h-11 text-xs md:h-8"`
4. `ProviderSelect.tsx:114` (Key-Feld): `className="h-8 flex-1 text-xs"` →
   `className="h-11 flex-1 text-xs md:h-8"`
5. `ProviderSelect.tsx:116` (Knopf „Verbinden"): `className="h-8 shrink-0 px-3 text-xs"` →
   `className="h-11 shrink-0 px-3 text-xs md:h-8"`
6. `ModeTabs.tsx:21` (Modus-Reiter): `'rounded-lg py-2 text-xs font-medium transition-colors'` →
   `'min-h-11 rounded-lg py-2 text-xs font-medium transition-colors md:min-h-0'`
7. `PlaygroundSidebar.tsx:140` (Video hochladen): `className="flex h-8 cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground hover:border-primary/60 hover:text-foreground"` →
   dasselbe mit `h-11` statt `h-8` und `md:h-8` angehängt
8. `ModelPicker.tsx:78` (Auswähler-Knopf): `className="w-full justify-start gap-2 h-auto py-2.5 text-[12.5px]"` →
   `className="w-full justify-start gap-2 h-auto min-h-11 py-2.5 text-[12.5px] md:min-h-0"`
9. `ModelPicker.tsx:93-101` und `:109-119` (die beiden `DropdownMenuItem`-Blöcke):
   `className={cn(entry.id === value && 'bg-accent')}` →
   `className={cn('min-h-11 md:min-h-0', entry.id === value && 'bg-accent')}`
10. `MetaRail.tsx:113`, `:117`, `:124` (drei Knöpfe): jeweils `min-h-11 xl:min-h-0` an das
    bestehende `className` anhängen — also `className="min-h-11 gap-1.5 xl:min-h-0"`,
    zweimal, und `className="col-span-2 min-h-11 gap-1.5 xl:min-h-0"` beim dritten.

**Warum bei `MetaRail` `xl:` und nicht `md:`:** Der Rail-Container ist
`hidden … xl:block` ([`PlaygroundShell.tsx:436`](../src/app/create/PlaygroundShell.tsx)).
Zwischen 768 px und 1280 px erscheint `MetaRail` ausschließlich im Bottom-Drawer, wird
also mit dem Finger bedient. `md:min-h-0` würde ihn dort fälschlich schrumpfen lassen.

**Nicht anfassen:** `Switch` (`ParamControls.tsx:146`) und `Slider`
(`ParamControls.tsx:191`). Beide kommen aus `src/components/ui/` und werden app-weit
geteilt — siehe 3.4 und Abschnitt 7.

**Verifikation:**
```bash
grep -rn "min-h-11\|h-11" src/components/playground/ | grep -v test | wc -l
grep -rn "\"h-8 \|h-8 flex-1\|h-8 shrink-0\|flex h-8" src/components/playground/ | grep -v test
grep -n "xl:min-h-0" src/components/playground/MetaRail.tsx
CI=1 npx jest --silent src/components/playground/
npm run lint && npx tsc --noEmit
```
**Fertig, wenn:** Der erste Zähler steht auf **mindestens 11**. Der zweite `grep` findet
**nichts** mehr — kein `h-8` ohne `md:`-Gegenstück in `src/components/playground/`. Der
dritte findet drei Zeilen in `MetaRail.tsx`. Alle Playground-Tests grün, `lint` und `tsc`
sauber.

---

### T7 — Der Grund für „Nicht mehr warten" wird sichtbar

**Voraussetzung:** T4 ist fertig (dieselbe Datei).

**Befund, wörtlich aus [`HANDOFF-2026-08-29-audit-review.md`](HANDOFF-2026-08-29-audit-review.md)
Abschnitt 3:** „‚Der Lauf läuft beim Anbieter weiter und wird berechnet' ist ein Tooltip;
auf dem Telefon gibt es kein Hover." Der Satz steht heute in
[`Gallery.tsx:96`](../src/components/playground/Gallery.tsx) als `title`-Attribut.

**Warum als Konstante:** L-K.2 (Phase 4) verlangt denselben Satz als Dauerzeile an der
Sendeleiste, *bevor* ein Pruna-Lauf startet. Zwei Orte, ein Satz — er wird deshalb einmal
abgelegt, damit Phase 4 ihn importiert statt ihn abzuschreiben.

**Dateien:** `src/lib/playground/constants.ts`, `src/components/playground/Gallery.tsx`

**Exakte Änderungen:**

1. In `src/lib/playground/constants.ts` ans Dateiende anfügen:

```ts
/**
 * Was ein Abbruch in der Oberflaeche wirklich bedeutet. Stand bis 2026-08-29
 * nur in einem `title` — auf dem Telefon gibt es kein Hover, der Satz war dort
 * unsichtbar.
 *
 * Phase 4 (L-K.2) braucht denselben Satz als Dauerzeile an der Sendeleiste,
 * bevor ein Pruna-Lauf startet. Deshalb hier und nicht zweimal im Markup.
 */
export const RUN_CONTINUES_NOTICE =
  'Der Lauf läuft beim Anbieter weiter und wird berechnet.';
```

2. In `Gallery.tsx` den Import ergänzen — die bestehende Zeile 6

```ts
import { PLAYGROUND_CONVERSATION_ID } from '@/lib/playground/constants';
```

ersetzen durch

```ts
import { PLAYGROUND_CONVERSATION_ID, RUN_CONTINUES_NOTICE } from '@/lib/playground/constants';
```

3. In `RunningCard` das `title`-Attribut am Knopf (nach T4 im Block ab Zeile 93) **ersatzlos
   streichen** und den Satz als sichtbare Zeile darunter setzen. Der `{onCancel && (…)}`-Block
   wird dabei zu einem Fragment:

```tsx
      {onCancel && (
        // Der Abbruch haengt an der Karte, nicht an der Leiste: bei mehreren
        // Laeufen muss erkennbar bleiben, welcher gemeint ist. Der Grund steht
        // sichtbar darunter statt in einem `title` — auf dem Telefon gibt es
        // kein Hover.
        <>
          <button
            type="button"
            onClick={onCancel}
            className="mt-1 min-h-11 rounded-md border border-border bg-background px-3 py-1 text-[10.5px] font-medium text-muted-foreground transition-colors hover:border-primary/55 hover:text-foreground md:min-h-0 md:px-2"
          >
            Nicht mehr warten
          </button>
          <span className="text-[10px] leading-snug text-muted-foreground/70">
            {RUN_CONTINUES_NOTICE}
          </span>
        </>
      )}
```

4. In `Gallery.test.tsx` einen Test ergänzen, der belegt, dass der Satz ohne Hover
   dasteht. Er gehört in den `describe`-Block, der die laufende Karte prüft:

```tsx
test('nennt den Grund fuer "Nicht mehr warten" sichtbar, nicht nur im title', () => {
  render(
    <Gallery
      selectedId={null}
      onSelect={jest.fn()}
      runs={[{
        id: 'r1', prompt: 'p', modelId: 'p-video', startedAt: Date.now(),
        isVideo: true, status: 'running',
      }]}
      onCancelRun={jest.fn()}
    />,
  );
  const knopf = screen.getByRole('button', { name: 'Nicht mehr warten' });
  expect(knopf).not.toHaveAttribute('title');
  expect(
    screen.getByText('Der Lauf läuft beim Anbieter weiter und wird berechnet.'),
  ).toBeVisible();
});
```

**Verifikation:**
```bash
grep -n "title=" src/components/playground/Gallery.tsx
grep -n "RUN_CONTINUES_NOTICE" src/lib/playground/constants.ts src/components/playground/Gallery.tsx
CI=1 npx jest --silent src/components/playground/Gallery.test.tsx
```
**Fertig, wenn:** Der erste `grep` findet **kein** `title=` mehr in `Gallery.tsx`. Der
zweite findet die Konstante in beiden Dateien. Der neue Test ist grün, die bestehenden
`Gallery.test.tsx`-Tests bleiben grün.

---

### T8 — Der linke Drawer erbt keine Bottom-Sheet-Klassen mehr

**Voraussetzung:** keine. Läuft parallel.

**Befund:** [`ui/drawer.tsx:46`](../src/components/ui/drawer.tsx) vergibt
`fixed inset-x-0 bottom-0 mt-24 rounded-t-3xl` an **jeden** `DrawerContent`, und Zeile 51
setzt einen mittigen Zieh-Griff. Der linke Drawer in
[`PlaygroundShell.tsx:478`](../src/app/create/PlaygroundShell.tsx) (`direction="left"`)
bekommt beides mit: eine oben abgerundete Kante an einem Panel, das links andockt, einen
24 px hohen `mt-24`-Vorschub und einen waagerechten Griff über einer senkrechten Fläche.

**Dass diese Datei angefasst werden darf, ist geprüft:** `grep -rln "ui/drawer" src/`
liefert ausschließlich `src/app/create/PlaygroundShell.tsx`, `PlaygroundShell.test.tsx`
und `create.e2e.test.tsx`. Der Chat nutzt eine eigene Komponente
(`src/components/chat/input/UnifiedMobileDrawer.tsx`). Kein anderer Bereich der App ist
betroffen.

**Datei:** `src/components/ui/drawer.tsx:37-56`

**Exakte Änderung:** `DrawerContent` liest die Richtung aus dem `direction`-Prop, das vaul
ohnehin durchreicht, und vergibt die Bottom-Klassen nur noch dort, wo sie hingehören:

```tsx
const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
    direction?: "top" | "bottom" | "left" | "right"
  }
>(({ className, children, direction = "bottom", ...props }, ref) => {
  // Die Klassen unten waren bis 2026-08-29 fuer jede Richtung gesetzt — ein
  // linker Drawer bekam damit eine oben abgerundete Kante, einen mt-24-Vorschub
  // und einen waagerechten Ziehgriff ueber einer senkrechten Flaeche.
  const isBottom = direction === "bottom"
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 flex flex-col border border-glass-border bg-popover/80 backdrop-blur-2xl shadow-glass-heavy",
          isBottom
            ? "inset-x-0 bottom-0 mt-24 h-auto rounded-t-3xl"
            : "inset-y-0 left-0 rounded-r-3xl",
          className
        )}
        {...props}
      >
        {isBottom && <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted/40" />}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
})
DrawerContent.displayName = "DrawerContent"
```

Dann in `PlaygroundShell.tsx:486` und `:479` das `direction`-Prop an den Content
durchreichen, damit die Verzweigung greift:

- Zeile 479: `<DrawerContent className="h-dvh w-[84%] max-w-[310px]">` →
  `<DrawerContent direction="left" className="h-dvh w-[84%] max-w-[310px]">`
- Zeile 487 bleibt unverändert — `bottom` ist der Vorgabewert.

**Achtung:** Die `right`-Richtung wird hier bewusst **nicht** behandelt. Sie kommt im Repo
nicht vor (`grep -rn 'direction=' src/ | grep -i drawer` → genau ein Treffer, `"left"`).
Ein Zweig für einen Fall, den es nicht gibt, ist Spekulation.

**Verifikation:**
```bash
grep -rn "direction=" src/ | grep -i drawer
grep -n "isBottom" src/components/ui/drawer.tsx
CI=1 npx jest --silent src/app/create/
npx tsc --noEmit && npm run lint
```
**Fertig, wenn:** Der erste `grep` findet zwei Treffer (Root und Content, beide `"left"`).
`isBottom` steht dreimal in `drawer.tsx`. `PlaygroundShell.test.tsx` und
`create.e2e.test.tsx` bleiben grün — beide mocken `ui/drawer` weg, die Änderung darf sie
also nicht berühren; täte sie es, wäre das ein Signal. `tsc` und `lint` sauber.

---

### T9 — Wahrheitsdokumente nachziehen

**Voraussetzung:** T1–T8 und V1 sind fertig und geprüft.

**Dateien:** `docs/LAUNCH_CRITERIA.md`, `docs/FAHRPLAN-create.md`, `CLAUDE.md`,
`docs/README.md`

**Exakte Änderungen:**

1. `docs/LAUNCH_CRITERIA.md`, Kopffeld: `**Letzte Prüfung:**` auf das Ausführungsdatum und
   `**Geprüft von:** Phase 6` setzen.
2. `docs/LAUNCH_CRITERIA.md`, **L-E.2**: `Status: offen` → `Status: erledigt (<Datum>,
   Phase 6)` — **nur wenn Paket Q die Messung tatsächlich durchgeführt hat.** Ohne
   Browser-Messung bleibt der Status `offen`; ein Codestand ist kein Beleg für ein
   Layout.
3. `docs/LAUNCH_CRITERIA.md`, **L-E.1**: bleibt `Status: offen`. Darunter eine Zeile
   anfügen: `> Betreiberaufgabe — Checkliste in [`PLAN-phase-6-create-telefon.md`](PLAN-phase-6-create-telefon.md), Abschnitt 8. Braucht zwei echte Geräte.`
4. `docs/FAHRPLAN-create.md`, Überschrift `### Phase 6 — Create auf dem Telefon (**P12**)`:
   den Marker ` · ✅ ERLEDIGT am <Datum>` anhängen — **nur wenn L-E.2 erledigt ist**;
   sonst ` · TEILWEISE — L-E.1 offen (Betreiberaufgabe)`.
5. `docs/FAHRPLAN-create.md`, im Phase-6-Block den ersten Aufzählungspunkt
   („Drei-Spalten-Aufbau auf klein: Parameter und Detailleiste als Schubladen") durch
   ersetzen:
   `- ~~Drei-Spalten-Aufbau auf klein: Parameter und Detailleiste als Schubladen~~ — **war bereits gebaut** (PlaygroundShell.tsx:478-503, Menüknopf md:hidden). Befund der Phase-6-Planung, 2026-08-29.`
6. `CLAUDE.md`, Abschnitt „Create — read before touching `/create`", nach dem
   Aufzählungspunkt **Provider switch** einen neuen anfügen:
   `- **Telefon:** Die Shell bezieht ihre Höhe aus \`--vvh\` (\`useViewportHeight\`), nicht aus \`dvh\` — die Tastatur verkleinert den visual viewport, \`dvh\` folgt ihm nicht. Trefferflächen unter \`md\` sind 44 px. Parameter kommen als linke Schublade, Details als Bottom-Drawer. Phase 8 folgt demselben Muster.`
7. `docs/README.md`, Abschnitt „Start Here": eine Zeile für
   `PLAN-phase-6-create-telefon.md` ergänzen.

**Verifikation:**
```bash
grep -n "L-E.1\|L-E.2" docs/LAUNCH_CRITERIA.md
grep -n "war bereits gebaut" docs/FAHRPLAN-create.md
grep -n "useViewportHeight" CLAUDE.md
grep -n "PLAN-phase-6-create-telefon" docs/README.md
```
**Fertig, wenn:** Alle vier `grep` liefern Treffer. Kein Status steht auf `erledigt`, für
den keine Messung vorliegt.

---

## 7. Was ich prüfen kann und was nicht

### 7.1 Prüfbar in dieser Umgebung — ohne Browser

| Prüfung | Werkzeug |
|---|---|
| Klassen, Zeilen, Struktur | `grep`, `sed`, Lesen |
| Ob Tailwind einen arbitrary value erzeugt | `npm run build` + `grep` im `.next/static/css/` |
| Verhalten des Hooks | Jest mit selbstgebautem `visualViewport` (V1) |
| Sichtbarkeit statt `title` | Jest + Testing Library (T7) |
| Typen, Lint, Gesamtsuite, Build | `npx tsc --noEmit`, `npm run lint`, `CI=1 npx jest`, `npm run build` |

### 7.2 Prüfbar nur mit Browser-Freigabe — Paket Q

Der Preview-Pane bei 375 px kann Layout lesen, Konsole und Netzwerk prüfen, und
**L-E.2 messen**. `AGENTS.md` verbietet Browser-Verifikation ausdrücklich
(„Anti-Browser-Tool (USER-ENFORCED)"), und der Betreiber hat für diesen Plan die
Rückfrage vor jedem Browserstart verlangt. **Also: Paket Q fragt, bevor es einen Browser
öffnet, und läuft ohne Freigabe nicht.**

Was ein Jest-Test hier **nicht** kann und wo dieser Plan deshalb keinen Test vorsieht:
jsdom rechnet kein Layout. `document.body.scrollWidth > 375` ist in jsdom immer `0` — ein
Test, der L-E.2 zu prüfen vorgibt, wäre Theater. L-E.2 ist eine Messung, kein Testfall.

**Warum nur V1 und T7 neue Tests mitbringen.** Die Pakete T1–T6 und T8 ändern
ausschließlich CSS-Klassen. Ein Test, der prüft, ob ein Element die Klasse trägt, die das
Paket eine Zeile vorher gesetzt hat, ist eine Tautologie: er kann nur fehlschlagen, wenn
jemand die Änderung zurücknimmt, und beweist nichts über das Ergebnis am Gerät. Ihre
Verifikation ist deshalb bewusst zweiteilig — `grep` gegen die Quelle, plus `npm run build`
mit einem `grep` im erzeugten CSS überall dort, wo Tailwind einen *arbitrary value*
erzeugen muss (T2, T3). Der zweite Teil ist kein Zierrat: eine verschluckte
arbitrary-Klasse ist genau der Fehler, den man an der Quelle nicht sieht.

Getestet wird, wo Verhalten entsteht: **V1** (der Hook reagiert auf ein
`visualViewport`-Ereignis und räumt beim Unmount ab) und **T7** (der Satz steht sichtbar
im Dokument statt in einem Attribut).

### 7.3 Nicht prüfbar — Betreiberaufgabe

**L-E.1 verlangt wörtlich zwei echte Geräte:** „Auf einem iPhone und einem Android-Gerät
je einen t2i- und einen i2v-Lauf durchführen." Kein Simulator, kein Emulator, kein
schmales Fenster. Der Fahrplan sagt dasselbe: „Auf einem echten Gerät prüfen, nicht nur
im schmalen Fenster." Das kann ich nicht. Checkliste in Abschnitt 8.

---

## 8. Betreiber-Checkliste für L-E.1 — abarbeitbar ohne Rückfrage

**Voraussetzung:** Der Code aus V1 und T1–T9 ist deployt und unter
`https://chat.hey-hi.cloud/create` erreichbar. **Ein Pollen-Schlüssel und ein
Pruna-Schlüssel müssen hinterlegt sein** — Video ist seit Phase 3 vollständig
schlüsselpflichtig (Betreiberentscheidung E1, `LAUNCH_CRITERIA.md` L-I.3), und der
i2v-Lauf ist ohne Schlüssel nicht durchführbar.

**Warnung vor dem Start:** Pruna hat keinen Abbruch-Endpunkt. Jeder gestartete i2v-Lauf
wird abgerechnet, auch wenn du die Seite schließt. Zwei Geräte = zwei bezahlte Läufe.
VACE braucht gemessen 348–700 s.

### Gerät 1 — iPhone (Safari)

- [ ] 1. `chat.hey-hi.cloud/create` öffnen. Kein horizontaler Scrollbalken, nichts ragt
      seitlich heraus. *(→ L-E.2)*
- [ ] 2. Menüknopf oben rechts antippen. Die Parameterschublade fährt **von links** ein,
      hat eine **senkrecht passende Kante** und **keinen waagerechten Zieh-Griff** oben.
      *(→ T8)*
- [ ] 3. In der Schublade: Modus `t2i`, ein freies Modell wählen. Jedes Feld —
      Modus-Reiter, Modell-Auswähler, Zahlenfelder, Auswahllisten — lässt sich mit dem
      Daumen treffen, ohne zu zoomen. *(→ T6)*
- [ ] 4. Schublade schließen, ins Prompt-Feld tippen. **Die Tastatur geht auf. Die
      Sendeleiste samt Senden-Knopf bleibt vollständig sichtbar, direkt über der
      Tastatur.** *(→ V1, der Kern der Phase)*
- [ ] 5. Bei offener Tastatur einen langen Prompt eingeben, bis das Feld wächst. Es hört
      auf zu wachsen, bevor es die Sendeleiste aus dem Bild schiebt. *(→ V1, Punkt 5)*
- [ ] 6. **Bei offener Tastatur nach oben und unten wischen.** Bleibt die Sendeleiste an
      ihrem Platz? *Falls sie wegwandert, notieren — dann braucht der Hook zusätzlich
      `visualViewport.offsetTop`, was ohne echtes Gerät nicht entscheidbar war.*
- [ ] 7. Senden. Die laufende Karte zeigt den Modellnamen, die Sekunden, den Knopf
      „Nicht mehr warten" **und darunter den Satz „Der Lauf läuft beim Anbieter weiter
      und wird berechnet." — sichtbar, ohne irgendwo draufzutippen.** *(→ T7)*
- [ ] 8. Nach dem Ergebnis: Die Galerie zeigt **zwei Spalten nebeneinander**, nicht eine.
      *(→ T3)*
- [ ] 9. Ein Ergebnis antippen. Die Detailschublade fährt **von unten** ein. Die drei
      Knöpfe („Laden", „Nochmal", „Als Referenz übernehmen") sind mit dem Daumen
      treffbar. *(→ T6, `xl:`-Sonderfall)*
- [ ] 10. Schublade schließen. Modus auf `i2v` stellen, ein Pruna-Videomodell wählen.
      Der Bereich „Referenzen" erscheint.
- [ ] 11. **Referenz-Upload:** Auf den leeren Slot tippen, ein Foto aus der Mediathek
      wählen. Die Vorschau erscheint im Slot. *(→ L-E.1, „inklusive Referenz-Upload")*
- [ ] 12. **Referenz entfernen:** Das kleine × oben rechts auf der Vorschau antippen —
      **beim ersten Versuch, ohne zu zielen.** Der Slot ist wieder leer. *(→ T5)*
- [ ] 13. Erneut hochladen, Prompt eingeben, senden. **Warten — VACE braucht 6–12
      Minuten.** Das Video erscheint in der Galerie und lässt sich abspielen.
- [ ] 14. Am unteren Rand: Der Senden-Knopf liegt **nicht** im Wischbereich des
      Home-Indicators. *(→ T1, T2)*
- [ ] 15. Falls in Schritt 4 oder 14 der Abstand unter der Leiste bei **offener**
      Tastatur unnötig groß wirkt: notieren. *Dann liefert iOS `safe-area-inset-bottom`
      auch bei offener Tastatur ungleich 0 — ebenfalls ohne Gerät nicht entscheidbar.*

### Gerät 2 — Android (Chrome)

Schritte 1 bis 14 identisch. Zusätzlich:

- [ ] 16. In Schritt 4: Android verkleinert bei offener Tastatur den Viewport meist von
      selbst. Die Sendeleiste muss trotzdem sichtbar bleiben — ohne dass die Kopfzeile
      („heyhi / create", „← chat") verschwindet.
- [ ] 17. Schritt 15 entfällt — Android hat keinen Home-Indicator-Inset.

### Ergebnis eintragen

- Alle Schritte auf **beiden** Geräten grün → in `docs/LAUNCH_CRITERIA.md` **L-E.1** auf
  `Status: erledigt (<Datum>, Phase 6)` setzen, mit Gerätemodellen und Browserversionen
  in einer Zeile darunter.
- Ein Schritt rot → L-E.1 bleibt `offen`. Den Schritt und das Gerät notieren; die
  Schrittnummer nennt das verantwortliche Paket.
- Schritt 6 oder 15 auffällig → als eigenen Punkt in den Handoff schreiben. Beides ist in
  V1 bewusst offengelassen worden, nicht übersehen.

---

## 9. Letztes Paket — nicht delegierbar

### Q — Querlesen gegen alle vorherigen Pakete *(Hauptagent, nach T9, vor dem Handoff)*

**Warum es existiert:** Wörtlich aus [`HANDOFF-2026-08-29-audit-review.md`](HANDOFF-2026-08-29-audit-review.md),
Abschnitt 6: „Ein Plan mit N Paketen braucht ein Paket N+1: ‚Querlesen gegen alle
vorherigen Pakete'. Es läuft nach dem letzten Arbeitspaket und vor dem Handoff, prüft die
Dokumente, die mehrere Pakete gemeinsam angefasst haben, und die Kriterien, die ein Paket
verschoben hat, ohne dass ein anderes davon wusste. Es ist nicht delegierbar an einen
Worker, der nur ein Paket kennt."

Alle drei Befunde des letzten Reviews (N1, N2, N3) lagen **zwischen** Paketen. Genau die
Klasse, die eine Paket-für-Paket-Verifikation strukturell nicht sieht.

**Schritte:**

- [ ] 1. **Gemeinsam angefasste Dateien im Diff lesen, nicht im Bericht.**
      `Gallery.tsx` wurde von T3, T4 **und** T7 verändert; `PromptBar.tsx` von V1 **und**
      T2; `PlaygroundShell.tsx` von V1 **und** T8. `git diff` je Datei am Stück lesen —
      hat ein späteres Paket ein früheres überschrieben?
      Insbesondere: trägt der Knopf „Nicht mehr warten" nach T7 noch die
      `min-h-11`-Klasse aus T4?
- [ ] 2. **Muster-Konsistenz gegen Abschnitt 3.** Trägt jedes in 3.4 gelistete Element
      seine Klasse, und trägt `MetaRail` `xl:` statt `md:`? Ist `h-dvh` genau einmal in
      `PlaygroundShell.tsx` übrig (der linke Drawer) und nirgends sonst?
- [ ] 3. **Statuswahrheit.** Steht in `LAUNCH_CRITERIA.md` ein Kriterium auf `erledigt`,
      für das keine Messung vorliegt? L-E.1 darf nach reiner Codearbeit **nicht** erledigt
      sein. L-E.2 nur, wenn Schritt 5 unten gelaufen ist.
- [ ] 4. **Kein Kriterium verschoben, ohne dass ein anderes Dokument davon weiß.** Der
      `RUN_CONTINUES_NOTICE`-Satz aus T7 gehört auch zu L-K.2 (Phase 4) — steht das in
      `LAUNCH_CRITERIA.md` bei L-K.2 als Hinweis, dass die Konstante bereits existiert?
      Wenn nicht: eine Zeile ergänzen. Das ist Befund N3 in neuer Kleidung.
- [ ] 5. **L-E.2 messen — Betreiber vorher fragen.** Genau eine Frage:
      *„Darf ich den Preview-Pane bei 375 px öffnen, um L-E.2 zu messen?"* Bei Ja:
      `/create` bei 375 px laden, in jeder Hauptansicht (leere Galerie, gefüllte Galerie,
      offene Parameterschublade, offene Detailschublade, laufende Karte, Fehlkarte)
      `document.documentElement.scrollWidth` gegen `clientWidth` prüfen. Bei Nein: L-E.2
      bleibt `offen`, und der Handoff sagt warum.
- [ ] 6. **Voller Durchlauf.**
      `npm run lint && npx tsc --noEmit && CI=1 npx jest --silent && npm run build`.
      Suitenzahl ≥ 111, Testzahl ≥ 858 (854 Ausgangsstand + 4 aus V1; T7 bringt einen
      weiteren, also praktisch ≥ 859).
- [ ] 7. **Handoff schreiben — nach dem Push, nicht davor.** Ebenfalls Lehre aus dem
      letzten Review (Befund N2): Der Audit-Patch-Handoff sagte „Nicht gepusht" und wurde
      in genau dem Commit gepusht. Der Handoff trägt den End-HEAD und den echten
      Push-Status.

**Fertig, wenn:** Alle sieben Schritte abgehakt, der volle Durchlauf grün, der Handoff
liegt und nennt den tatsächlichen End-HEAD.

---

## 10. Fertig-Kriterium der Phase

Phase 6 ist fertig, wenn:

1. **L-E.2** in `LAUNCH_CRITERIA.md` auf `erledigt` steht — gestützt auf eine Messung bei
   375 px, nicht auf einen Codestand.
2. **L-E.1** entweder auf `erledigt` steht (beide Geräte durch, Abschnitt 8) oder als
   ausdrückliche, terminierte Betreiberaufgabe im Handoff und in `LAUNCH_CRITERIA.md`
   vermerkt ist.
3. Der volle Durchlauf grün ist und die Testzahl nicht gesunken.
4. Die vier Muster aus Abschnitt 3 in `CLAUDE.md` stehen, damit Phase 8 sie nicht neu
   erfinden muss.

**Ausdrücklich nicht Teil dieser Phase:**

- Umbenennung von `src/components/playground/`, `PlaygroundShell` oder den
  `playground.*`-Schlüsseln — `LAUNCH_CRITERIA.md` Bereich M.
- `Switch` und `Slider` in `src/components/ui/` auf 44 px ziehen. App-weit geteilt; das
  ist eine Entscheidung für den Chat mit, nicht für Create allein. **Offener Punkt für
  eine spätere Phase.**
- Die Meta-Beschreibung von `/create` (**L-A.5**, Phase 2, weiterhin `offen`).
- Eine Fortschrittsanzeige oder Reload-Festigkeit für laufende Videos (**L-C.2**,
  **L-C.4**, Phase 4).
- Ein Herkunftsfilter oder Löschen in der Galerie (**L-D.1**–**L-D.3**, Phase 5).
- Zweisprachigkeit im Create — `LAUNCH_CRITERIA.md` Bereich M, Betreiberentscheidung E3.
  Alle neuen Texte in diesem Plan sind hart deutsch, wie der Rest von Create.
