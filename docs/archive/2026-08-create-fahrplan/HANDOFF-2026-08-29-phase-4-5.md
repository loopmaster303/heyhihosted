# Handoff — Phase 4 + Phase 5 (konsolidierte Ausführung, 2026-08-29)

**Ausgangspunkt:** `625523c`, ausgeführt nach
[`PLAN-phase-4-5-koordiniert-2026-08-29.md`](PLAN-phase-4-5-koordiniert-2026-08-29.md).
**Endstand:** `4f70010` — 116 Suiten, **896 Tests grün**, `tsc` sauber, lint sauber,
`next build` erfolgreich. Alle Testzahlen sind selbst gezogen, nicht übernommen.

---

## Was geliefert wurde

### Phase 4 — Fehlerklarheit und Laufstabilität (Commits `54e6320`, `9fe5f81`)

- **Fehlermodule** (`src/lib/errors/`): 24 Codes, Übersetzungstabelle
  `describeError()`/`describeUnknown()`, `readErrorResponse()` für alle drei live
  belegten Fehlerformen plus `Retry-After` und `details` (`field`, `modelLabel`).
- **Server**: `ApiError` trägt `details`; `validateRequest` nennt das erste Zod-Feld;
  `pruna/client` extrahiert den abgelehnten Feldnamen aus der 400-Meldung; Codes für
  `UNKNOWN_MODEL`, `REFERENCE_NOT_SUPPORTED`, `RATE_LIMITED`,
  `POLLEN_KEY_REQUIRED`, `POLLEN_INSUFFICIENT`; `MISSING_PRUNA_KEY` in der Nutzersicht;
  `/api/pollen/account` packt das Upstream-Fehlerobjekt aus (Befund B).
- **Pollen-Lampe**: dritter Zustand `keyStatus` — 403 ist „nicht prüfbar", nur 401 ist
  abgelehnt; Klartext-Grund in den Einstellungen; OAuth fordert `account:usage` an.
- **Laufstabilität**: `vercel.json` maxDuration 300; `run-store` (localStorage über
  safe-storage) + Wiederaufnahme beim PlaygroundShell-Mount; `pollPrediction` exportiert;
  Reissleine benennt den Abbruch. R2 = a: der Retry-Kontext wandert mit in den Store.
- **Create**: `messageFrom()` → `parseFailure()` (Satz + Rohtext + Handlung);
  FailedCard ohne `line-clamp-3`, mit Handlungs-Link und aufklappbarem Rohtext-Detail;
  RunningCard mit `m:ss`, Erwartungsgröße (wan-t2v ≈ 1 Min, VACE 6–12 Min) und
  Überziehungshinweis.
- **CLAUDE.md**: Fehlerkonvention + Laufwiederaufnahme nachgezogen.

### Phase 5 — Eine Galerie (Commits `b9282c0`, `3d8f691`, `4279b02`, `27fbab3`,
`1af83dd`, `c4ffa23`, `565e8bb`, `168a19f`, `4f70010`)

- `assetOrigin()` in `src/lib/assets/asset-origin.ts` ist die **einzige** Stelle, die
  `conversationId` als Herkunft liest (E5.1); `isGalleryAsset` ist entfernt.
- `useGalleryAssets(origins)` mit `totalInScope` (ehrliche Zahl, F12) und Löschpfad über
  `src/lib/assets/delete-assets.ts` — eine Auswahl, Ausführung per `bulkDelete` (R4).
- `OriginFilter` (flüchtig, kein localStorage, E5.2; Chat-Bereich = `['chat','compose']`,
  R3), gerendert in `GalleryPanel` und in der Create-Kopfzeile.
- Chat: Filterzustand in `AppLayout` (Vorgabe eigene Herkunft), `totalAssetCount` aus
  `totalInScope`, Bestätigung „N Objekte aus dieser Ansicht löschen?" (F11).
- Create: Filterzustand in `PlaygroundShell` (Vorgabe `['create']`), `deleteItem` an
  **beiden** MetaRail-Stellen (B7, grep = 2), Object-URL-Freigabe beim Löschen (F7).
- W5: das `playground`-URL-Leck im Generierungspfad ist geschlossen — die URL wird nach
  dem Ladelauf freigegeben, die Detailauswahl bekommt vorher die frische Galerie-URL.
  **Abweichung vom Pakettext:** statt zwei direkter `releaseURL(ownedBlobUrl)`-Aufrufe
  übernimmt ein URL-Tausch (`pendingUrlSwapRef` + `onItemsLoaded`) den Wechsel, damit die
  Detailvorschau nicht auf die revokte URL zeigt. Absicht (F8) erfüllt.
- `/gallery`: „Vault leeren" entfernt (E5.5), sonst nichts.
- Wahrheitsdokumente: Fahrplan Phase 5 erledigt + „/gallery zeigt weiterhin alles"
  korrigiert, CLAUDE.md Herkunfts-Abschnitt, README-Index.
  **`LAUNCH_CRITERIA.md` L-D.1–L-D.3 bleiben offen** — erst nach der Browser-Runde
  (Abschnitt „Offen").

---

## Test-Ledger (korrigiert)

| Stand | Tests |
|---|---|
| `625523c` sauber | 852 |
| + Phase-4-Fehlermodule (andere Sitzung) | 863 |
| + Phase-5-U1 | 869 |
| + Phase-4-Wiring | 887 |
| + U2/W2/W4 | 896 |

Die „852"-Angabe im Phase-5-Plan war gemessen worden, während parallel eine zweite
Sitzung schrieb — die 11 Fehlermodul-Tests fehlten in der Zählung.

## U3-Querlesen (Q1–Q10)

Q1 ✓ (beide MetaRail-Stellen) · Q2 ✓ (Sentinel wird nur geschrieben, nie gelesen) ·
Q3 ✓ (kein localStorage für den Filter) · Q5 ✓ (`totalInScope` überall) ·
Q6 ✓ (DE+EN) · Q7: F1–F12 verlangen die Browser-Runde, F13 ✓, F14 außer
LAUNCH_CRITERIA ✓ · Q8 ✓ (LAUNCH_CRITERIA nennt keine Vault-Kriterien) ·
Q9 ✓ (896 grün, Build ok) · Q10 ✓ (jede Datei einem Paket zuordenbar).

**Zwei dokumentierte Ausnahmen:** `useGalleryAssets.ts` nutzt `db.assets.filter()…count()`
für `totalInScope` — Zählen, nicht Löschen (F12 braucht die Query). Der W2-Grep auf
`localStorage` trifft den erklärenden Kommentar, keinen Code.

## Lokale Live-Checks (kostenfrei, gegen `next dev`)

Tabelle 7 (`UNKNOWN_MODEL` + modelLabel) ✓ · Tabelle 8 (`VALIDATION_ERROR`, field=prompt) ✓ ·
Tabelle 9 (`REFERENCE_NOT_SUPPORTED`) ✓ · Tabelle 10 (`RATE_LIMITED`) ✓ ·
Tabelle 2 (Pruna-400: `PRUNA_API_ERROR` + `details.field=unbekanntes_feld`, **kein Lauf**) ✓ ·
Tabelle 5/6 (Kontostand 200; Ablehnung als Klartext-String — Befund B behoben) ✓.
Tabelle 1 entfällt live: `qwen-image` ist seit Phase 3 kein Pruna-Modell mehr; der
503-Wortlaut ist von den Route-Tests abgedeckt.

## Offen — beim Betreiber

1. **Browser-Verifikation F1–F12** (Tabelle in `PLAN-phase-5-eine-galerie.md` Abschnitt 2).
   Erst danach L-D.1–L-D.3 in `LAUNCH_CRITERIA.md` auf „erledigt" setzen.
2. **Phase 4 Live-Reste**: V1 (echter OAuth-Flow gegen die korrigierten Permissions) und
   F6 (ein bezahlter wan-t2v-Lauf mit Reload-Mitten-Drin — Reload jetzt gefahrlos, der
   Lauf wird wiederaufgenommen).
3. **Der Arbeitsbaum trägt fremde, uncommittete Arbeit**: die Model-Selector-Sitzung hat
   ihren Stash-Inhalt neu geschrieben (`useUnifiedImageToolState`, `ChatInput`,
   `ImageModelOptions`, `VisualizeInlineHeader`, `unified-image-models`, `translations.ts`,
   `LAUNCH_CRITERIA.md`, u. a.) — bewusst NICHT von mir committet. Der ursprüngliche Stash
   liegt weiter in `stash@{0}`. `docs/LOG-phase-6-teil1-2026-08-29.md` (untracked) gehört
   der Phase-6-Sitzung; deren Commit `5e3bdf1` ist Teil dieser History.
4. **Phase 6 Teil 2** wird dieselben Dateien anfassen (`PlaygroundShell`, `Gallery`) —
   erst starten, wenn die Sitzungen koordiniert sind (eine Schreibende je Datei).
