# Plan — Phase 4 + 5 koordiniert ausführen (eine Sitzung)

**Datum:** 2026-08-29
**Anlass:** Zwei Sitzungen haben am 2026-08-29 **parallel in demselben Arbeitsbaum**
gearbeitet — eine an Phase 4 (Fehlerklarheit), eine an Phase 5 (Eine Galerie). Beide
Phasen fassen dieselben zwei Dateien an (`Gallery.tsx`, `PlaygroundShell.tsx`). Die
Kollision ist **gegistert**, nicht geschehen: Der Phase-4-Stand hat die geteilten
Dateien noch nicht berührt, der Phase-5-Stand auch nicht. Dieser Plan legt fest, wie
beide Phasen **in einer einzigen Sitzung** zu Ende geführt werden, damit es keine
Konflikte gibt.
**Betreiber-Entscheidung (2026-08-29, wörtlich):** Phase 4 wird gestoppt; nach Analyse
beider Stände wird ein Plan geschrieben, der beide in einer Sitzung zusammenführt.

---

## 1. Was die Phase-4-Sitzung hinterlassen hat (Analysiert am 2026-08-29)

Alles **uncommitted** im Arbeitsbaum. Quellen: `docs/PLAN-phase-4-fehlerklarheit.md`
(Datum 2026-08-27), Dateizeitstempel 16:27–16:35.

### Fertig — die reinen Fehler-Module (Paket „Neu" aus dem Phase-4-Plan, bis auf eines)

| Datei | Zustand | Anmerkung |
|---|---|---|
| `src/lib/errors/error-codes.ts` | **vollständig** | 24 Codes als `as const`-Liste + `ErrorCode`-Typ |
| `src/lib/errors/describe-error.ts` | **vollständig** | Tabelle über alle 24 Codes, `describeError()` (unbekannt → `null`), `describeUnknown(status, raw)` als Fallback |
| `src/lib/errors/read-error-response.ts` | **vollständig** | Liest alle drei live belegten Formen (`{error:"…"}`, `{error:{message,code}}`, Nicht-JSON) + `Retry-After` + Zod-`details.field` |
| `src/lib/errors/describe-error.test.ts` | **7 Tests, grün** | Darunter der RC1-Wächter: jeder Code muss einen Satz haben |
| `src/lib/errors/read-error-response.test.ts` | **4 Tests, grün** | |

### Nicht begonnen (laut Code, nicht laut Behauptung geprüft)

- **`src/lib/generation/run-store.ts`** existiert nicht (Laufstabilität L3).
- **Sämtliche „Geändert"-Pakete:** `PlaygroundShell.tsx` hat weiterhin `messageFrom()`
  (Zeile 66, Aufrufe 177/205) — `readErrorResponse`/`describeError` sind **nirgends
  importiert**. `Gallery.tsx` (`FailedCard`/`RunningCard`), `usePollenKey.ts`,
  `SettingsPopover.tsx`, `pollinations-image-v1.ts`, `generate/route.ts`,
  `api-error-handler.ts`, `request-generation.ts`, `pruna/client.ts`, `vercel.json`,
  `CLAUDE.md` — alle unberührt.
- Die Phase-4-Rückfragen **R1–R5** sind im Plan offen; ob die andere Sitzung sie mit dem
  Betreiber geklärt hat, ist aus dem Baum **nicht** ersichtlich. Die gemeinsame Sitzung
  muss das klären, bevor sie die betroffenen Pakete ausführt (Lampe: R1, Retry: R2,
  Sprache: R3, vercel.json: R4, Reihenfolge der Fehlertabelle: R5).

### Bekannte Verfalldaten im Phase-4-Plan

Der Plan verweist an vier Stellen auf `src/app/playground/PlaygroundShell.tsx` — dieser
Pfad existiert seit `e9b75b0` nicht mehr; richtig ist `src/app/create/PlaygroundShell.tsx`.
Gleiches gilt für den Testpfad `src/app/playground/PlaygroundShell.test.tsx` im
Testplan (richtig: `src/app/create/PlaygroundShell.test.tsx`).

---

## 2. Was die Phase-5-Sitzung hinterlassen hat (dieselbe Analyse)

### Fertig — Paket U1, vollständig verifiziert, **uncommitted**

| Datei | Zustand |
|---|---|
| `src/lib/assets/asset-origin.ts` | **neu, vollständig** — `AssetOrigin`, `ALL_ORIGINS`, `assetOrigin()`, `isInScope()` |
| `src/lib/assets/asset-origin.test.ts` | **7 Tests, grün** |
| `src/hooks/useGalleryAssets.ts` | **umgebaut** — `origins`-Parameter, `totalInScope` (ehrliche Zahl), Löschfunktionen noch inline (kommen in U2 auf den gemeinsamen Pfad), `isGalleryAsset` entfernt |
| `src/hooks/useGalleryAssets.test.ts` | **ersetzt** — 3 Bereichs-Vertragstests statt der 4 `isGalleryAsset`-Tests |

Verifiziert am 2026-08-29: `CI=1 npx jest --silent` → **869/869 grün** ·
`grep -rn "isGalleryAsset" src/` → leer · lint/tsc gegen den gemischten Stand grün.

### Offen

W1 (Create-Galerie auf Bereich), U2 (Löschpfad + Bestätigungsschlüssel), W2
(OriginFilter), W3 (Chat-Verdrahtung), W4 (Create-Verdrahtung), W5 (Object-URL-Leck),
W6 (`/gallery`-Knopf weg), U3 (Querlesen), W7 (Wahrheitsdokumente — Schritt 2 erst nach
Browser-Verifikation). Die Pakettexte stehen vollständig in
[`PLAN-phase-5-eine-galerie.md`](PLAN-phase-5-eine-galerie.md), Abschnitt 7.

### Die Betreiber-Entscheidungen zu Phase 5 stehen bereits (2026-08-29)

R1 = **a** (Stern ist nur Sortierung, „alles löschen" löscht auch Markierte) ·
R2 = **a** (zwei `useState`, Kommentar am `<a>`, kein Singleton) ·
R3 = Chat-Bereich ist `['chat', 'compose']` · R4 = gemeinsame Auswahl, Ausführung per
`bulkDelete`. W7 Schritt 2 (`LAUNCH_CRITERIA.md` L-D.1–L-D.3 auf „erledigt") bleibt
solange offen, bis der Betreiber F1–F12 im Browser geprüft hat.

---

## 3. Der Arbeitsbaum als Ganzes — Bestandsaufnahme

```
HEAD                    625523c (+ 1 Docs-Commit: e477dfa, Plan-Dateien Phase 4-7)
Uncommitted, Phase 4:   src/lib/errors/  (5 Dateien, +11 Tests, grün)
Uncommitted, Phase 5:   src/hooks/useGalleryAssets.{ts,test.ts}, src/lib/assets/  (U1, +6 Tests netto, grün)
Stash@{0}:              "WIP Model-Selector/Visualize (rot, useUnifiedImageToolState 15 fails)"
                        — NICHT Teil einer der beiden Phasen; eigenes, unvollendetes Thema
```

**Test-Ledger (wichtig, korrigiert zwei Zahlen aus den Plan-Dokumenten):**

| Stand | Suiten | Tests | Bemerkung |
|---|---|---|---|
| `625523c` sauber | 112 | **852** | Plan-Phase-5-Ausgangsstand (Suiten dort mit 109 angegeben — gemessen 112) |
| + Phase-4-Fehlermodule | 114 | **863** | 7 + 4 neue Tests |
| + Phase-5-U1 | 115 | **869** | +7 (asset-origin) + 3 (Hook) − 4 (alte Hook-Tests) |

Die erste Baseline-Messung der Phase-5-Sitzung („852") lief, während die
Phase-4-Sitzung gleichzeitig schrieb — sie hat deshalb die 11 Fehlermodul-Tests noch
nicht gezählt. **Die ehrliche Vergleichszahl für alles Weitere ist 869, nicht 852.**

Beide uncommitteten Stände zusammen sind **grün** (869/869), und die Codebereiche
disjunkt: `src/lib/errors/` + `src/lib/generation/` + Lampe + Routen (Phase 4) gegen
`src/lib/assets/` + `useGalleryAssets` (Phase 5). Der einzige Überlappungspunkt sind die
zwei weiter unten genannten geteilten Dateien — und genau dort hat **noch niemand**
geschrieben.

---

## 4. Konsolidierungsentscheidung: eine Sitzung, vier Stufen

**Warum diese Reihenfolge:** Phase 4 hat ihre Pflichtpakete an den geteilten Dateien
noch vor sich, Phase 5 ebenso. Läuft Phase 5 zuerst, muss Phase 4 ihre eigenen
Zeilenangaben wegwerfen und gegen einen fremden Stand arbeiten (das warnt schon der
Phase-5-Plan, Abschnitt 1). Läuft Phase 4 zuerst, trifft sie auf U1 — das ist
unkritisch, weil U1 die geteilten Dateien nicht berührt, sondern nur den Hook
unterhalb von ihnen. **Phase 4 zuerst an den geteilten Dateien, Phase 5 danach** —
genau die empfohlene Reihenfolge aus `PLAN-phase-5-eine-galerie.md` Abschnitt 1, jetzt
in einer Sitzung durchsetzbar, weil niemand mehr parallel schreibt.

### Stufe 0 — Voraussetzungen (vor jedem Code)

1. Betreiber bestätigt: die Phase-4-Sitzung ist **gestoppt** (zugesagt am 2026-08-29).
   `git status --porcelain` muss genau die Bestandsaufnahme aus Abschnitt 3 zeigen —
   keine neuen Dateien aus der anderen Sitzung. Sind neue da: **Abbruch, neu
   analysieren**, nicht raten.
2. Phase-4-Rückfragen R1–R5 klären (siehe Abschnitt 1). Ohne R1–R4 dürfen die
   betreffenden Phase-4-Pakete nicht starten.
3. **Commits zur Sicherung des Ist-Zustands** — zwei getrennte Commits, damit die
   Diffs der Phasen nicht vermengt werden:

   ```bash
   git add src/lib/errors/
   git commit -m "feat: Phase 4 — Fehlercodes, Uebersetzungstabelle und Response-Leser (ohne Verdrahtung)"

   git add src/lib/assets/ src/hooks/useGalleryAssets.ts src/hooks/useGalleryAssets.test.ts
   git commit -m "feat: Phase 5 — assetOrigin als einzige Herkunftsdeutung, Galerie-Hook mit Bereich"
   ```

   Das entspricht den geplanten Commits U1 Schritt 8 bzw. dem Anfang des
   Phase-4-„Geändert"-Umfangs; beide Commits sind jeweils für sich grün.

### Stufe 1 — Phase 4 zu Ende (an den geteilten Dateien zuerst)

Ausführen wie im Phase-4-Plan, mit drei Zusätzen:

1. **Pfadkorrektur vor Start:** alle vier `src/app/playground/…`-Verweise im Plan auf
   `src/app/create/…` umgestellt lesen (Abschnitt 1 dieses Dokuments).
2. **Reihenfolge innerhalb Phase 4:** erst die geteilten Dateien
   (`PlaygroundShell.tsx`: `messageFrom()` → `readErrorResponse()` + `describeError()`;
   `Gallery.tsx`: `FailedCard`/`RunningCard`), danach die unstrittigen
   (`pollen/account/route.ts`, `usePollenKey.ts`, `SettingsPopover.tsx`,
   `pollinations-image-v1.ts`, `generate/route.ts`, `api-error-handler.ts`,
   `pruna/client.ts`), dann Laufstabilität L1–L3 (`vercel.json`, `m:ss`-Zähler,
   `run-store.ts` + Wiederaufnahme), zuletzt `CLAUDE.md`.
3. **Verifikation je Paket** wie im Phase-4-Plan (Testplan-Abschnitt); Gesamtstand nach
   Stufe 1: lint + tsc + `CI=1 npx jest --silent` grün, **mindestens 869 Tests**.

Phase 4 committet ihre Pakete einzeln (Nachrichtenstil wie bisher:
`feat: Phase 4 — …`).

### Stufe 2 — Phase 5 zu Ende (liest die geteilten Dateien NEU)

**Wichtig:** W1, W4 und W3 arbeiten gegen die **nach Stufe 1 aktuellen** Dateien. Die
Zeilennummern in den Pakettexten des Phase-5-Plans (z. B. „Gallery.tsx:184-188",
„PlaygroundShell.tsx:436") sind nach Phase 4 **verfallsdatumshaft** — die Pakete sind
gegen den dann aktuellen Stand neu zu lesen; die exakten Änderungen (Query-Form,
Props, Freigabe-Pfade) bleiben unverändert gültig, nur ihre Lage verschiebt sich.
Konkret:

- **W1** — Query auf `orderBy().reverse().filter(isInScope).limit(50).toArray()`, die
  zwei Test-Mocks mitziehen (Befund B8).
- **U2** — `delete-assets.ts` (gemeinsame Auswahl, `bulkDelete` gemäß R4),
  Übersetzungsschlüssel `gallery.clearConfirmScoped` + `origin*`/`filter*`.
- **W2** — `OriginFilter`, Chat-Bereich `['chat', 'compose']` (R3).
- **W3 / W4** — Verdrahtung beider Oberflächen; W4 an **beiden** `MetaRail`-Stellen
  (Befund B7, `grep -c` muss `2` ergeben).
- **W5** — Object-URL-Leck im Generierungspfad (`grep -c "releaseURL(ownedBlobUrl)"`
  muss `2` ergeben).
- **W6** — „Vault leeren" von `/gallery` entfernen.
- **W7** — Schritte 1, 3, 4 (Fahrplan, `CLAUDE.md`, `docs/README.md`). **Schritt 2
  (`LAUNCH_CRITERIA.md`) ausdrücklich zurückstellen** bis der Betreiber F1–F12 im
  Browser geprüft hat (Abschnitt 9 des Phase-5-Plans).
- **U3** — Querlesen Q1–Q10, mit korrigierter Erwartung: Testzahl
  **≥ 869 + 12** (U2: 4, W2: 4, W4: 1, plus Reserven) statt der alten Rechnung ab 852.

Phase 5 committet je Paket wie im Plan vorgesehen.

### Stufe 3 — Abschluss

1. U3 Q10: `git diff 625523c..HEAD` Satz für Satz gegen die Paketlisten beider Pläne
   lesen; was sich nicht zurückführen lässt, ist Scope-Kriechen.
2. Gesamtverifikation: `npm run lint && npx tsc --noEmit && CI=1 npx jest --silent && npm run build`.
3. Browser-Checkliste F1–F12 (Phase 5) und die Live-Prüfliste aus dem Phase-4-Plan an
   den Betreiber ausliefern; **erst danach** W7 Schritt 2 (`LAUNCH_CRITERIA.md`) und die
   Phase-4-Gegenstücke in den Kriterien auf „erledigt" setzen.
4. Handoff-Dokument schreiben (nach dem Push, wie in U3 vorgesehen).

---

## 5. Der Stash — eigenes Thema, kein Bestandteil dieser Konsolidierung

`stash@{0}` (Model-Selector/Visualize, 15 rote Tests in `useUnifiedImageToolState`)
ist **weder Phase 4 noch Phase 5**. Er wird nicht in die Konsolidierung gemischt.
Hinweise für das spätere Auflösen:

- `translations.ts`: Der Stash ergänzt `modelSelector.*`-Schlüssel, Phase 5 U2 ergänzt
  `gallery.*`-Schlüssel — **verschiedene Abschnitte derselben Datei**. Ein `stash pop`
  nach Stufe 2 sollte sauber durchgehen; im Zweifel von Hand zusammenführen.
- `docs/README.md`: beide Seiten fügen Listenzeilen hinzu — same pattern, geringes
  Konfliktrisiko.
- Der Stash ist **rot** (15 Fehlschläge). Vor jedem Wiedereinbringen zuerst
  `useUnifiedImageToolState.test.tsx` anschauen; nicht poppen, nur um ihn los zu sein.

---

## 6. Was dieser Plan bewusst offen lässt

- **Phase-4-Rückfragen R1–R5** — Stufe 0 Schritt 2.
- **Der gekostete Pruna-Lauf** für Phase 4 F6 (Reload während eines Videolaufs) —
  bleibt beim Betreiber, „einmal, am Ende, nach Absprache".
- **W7 Schritt 2 und alle LAUNCH_CRITERIA-Einträge** — nach der Browser-Runde.
- **Der Stash** — eigenes Thema (Abschnitt 5).
- **Phase 6 und 7** (Plan-Dateien liegen vor, unberührt) — kommen nach dieser
  Konsolidierung, nicht damit.
