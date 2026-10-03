# HANDOFF 2026-10-01 — Variante „Eine Fläche"

**Branch:** `claude/pensive-ramanujan-j2l7in` · **Basis:** `main` @ `a61feed` · **`main` ist unberührt.**
**Auftrag:** „jetzt bau in deinem worktree eine komplett unabhängige eigene hey hi variante nach
deiner optimization -> go". Die offenen Entscheidungen des Plans
[`PLAN-entschlackung-2026-10-01.md`](PLAN-entschlackung-2026-10-01.md) sind nach seinen
Empfehlungen getroffen (unten).

## In drei Sätzen

Chat und Create sind zwei Räume in **einer** Hülle: ein Layout, das nie neu mountet, eine
Kopfzeile mit Raumumschalter, und Verlauf, Galerie und Einstellungen als Sheets darüber, die in
der Adresse stehen und per Zurück schließen. Der Chat kann Text, Stimme, Recherche, Code und
genau ein Bild pro Antwort. Das Bild wächst aus einem pulsierenden ASCII-Feld und steht danach
rahmenlos, Visualize und Compose sind aus dem Chat raus. Darunter liegen 21 % weniger
TypeScript, ein Doku-Archiv statt 49 Planungsdokumenten oben und Server-HTTP ohne Kindprozess.

## Commits

| Commit | Inhalt |
|---|---|
| `b8975c5` | **E1** Ballast: tote Komponenten und Routen, zwei Abhängigkeiten, Logos 12 MB → 124 KB, Altordner |
| `8d06736` | **E3–E5, E9–E15** die Hülle, Sheets, Composer, Nachrichten, Create als Raum, Bewegung, nativ, Zugang, das sichtbar entstehende Bild |
| `221d5aa` | **E7** `https-post.ts` per `fetch`, Musik bekommt 290 s, `public/scripts/auth-proxy.js` (öffentlich ausgeliefert) gelöscht |
| *dieser* | **E2** Doku-Archiv, `CLAUDE.md` neu, Gate-Bereich N; dazu der Fertig-Hinweis aus Create (E13) und ein doppeltes `<main>` |

## Was der Nutzer merkt

- **Ein Raumwechsel lädt nichts neu.** Die Unterhaltung, ein halb getippter Prompt und laufende
  Video-Läufe überleben jeden Wechsel. Der inaktive Raum ist `inert`.
- **Zurück tut, was man erwartet:** erst schließt es das offene Sheet, dann wechselt es den Raum.
  `/gallery` und `/settings` leiten auf `/?panel=…` um, Lesezeichen bleiben gültig.
- **Ein Bild im Chat** steht nicht mehr in einer Blase mit dem Prompt. Die Antwort steht sofort,
  daneben ein ASCII-Feld, das sich verdichtet, dann blendet das Bild rahmenlos ein. Der Marker ist
  nie zu sehen, auch nicht beim Streamen. „In Create weiterarbeiten" nimmt Prompt und Modell mit.
- **Endet ein Create-Lauf, während du im Chat bist**, meldet er sich mit „Bild fertig · Ansehen".
- **Telefon:** Sheets kommen von unten und lassen sich wegwischen, die Eingabe bleibt über der
  Tastatur (`--vvh` für die ganze Hülle), Safe-Area an Kopf, Eingabe und Sheets, installierbar
  als Web-App (`manifest.ts`, Themenfarbe je Theme).
- **Bewegung** hat drei Dauern und eine Kurve. Bei reduzierter Bewegung gleitet nichts, ASCII
  steht still, bleibt aber sichtbar.

## Entscheidungen, wie getroffen

| | Frage | Genommen |
|---|---|---|
| E-1 | Name „Playground Meck" für die Oberfläche? | Nein. Produktname bleibt **Create**, „Meck" ist der Name des gesicherten Stands (E0). |
| E-2 | Visualize im Chat? | **A** — nur `[IMAGE_GEN]`, Modell aus den Einstellungen, Weg ins Create an jedem Bild. |
| E-3 | `[MUSIC_GEN]`? | Entfernt. Der Parser schneidet den Marker still, der Systemprompt-Baustein lehrt ihn nicht mehr. |
| E-4 | About und Englisch? | Beides bleibt. About steht außerhalb der Hülle. |
| E-5 | `scripts/audit/`? | Gelöscht, die wöchentliche Registry-Action bleibt. |
| E-6 | vaul oder Radix Dialog? | vaul für Sheets, Radix Dialog für die Großansicht. |
| E-7 | Raumumschalter wo? | Kopfzeile. |
| E-8 | Sound als Raum? | Modus in Create, wie bisher. |
| E-9 | ASCII-Feld auch in Create? | Ja empfohlen, **nicht gebaut** — Create zeigt weiter `AsciiSpinner`. |

## Wie geprüft

- **Gate auf dem letzten Stand:** `lint` 0, `tsc` 0, **886 Tests in 111 Suiten** grün, `build` 0.
  Die Basis hatte 974 in 124: Tests gingen mit dem gelöschten Code (Visualize, Compose,
  Bildmodus, alte Galerie-Seite). Neu sind unter anderem jest-axe-Prüfungen für Sheet, Composer,
  Nachricht und Chat-Bild, Tests für `usePanelState`, den zweistufigen Bildablauf, das
  Marker-Schneiden beim Streamen, `https-post` und den Fertig-Hinweis. Der Fertig-Hinweis-Test
  ist per Mutation gegengeprüft: ohne den Aufruf wird er rot.
- **Im Browser** (Playwright gegen den Produktions-Build, APIs abgefangen, Desktop dunkel und
  Telefon hell): leere Fläche, Senden, ASCII-Feld, rahmenloses Bild, Verlauf mit `?panel=history`
  in der Adresse, Escape schließt, Zurück schließt die Einstellungen, Wechsel nach `/create` und
  zurück mit erhaltener Unterhaltung.
- **E7:** Eine temporäre Route schickte per `fetch` `Authorization` und `X-Pollen-Key` an einen
  lokalen Echo-Server, im Dev-Server und im Produktions-Build. Beide kamen an. Die Route ist wieder
  gelöscht.

**Nicht geprüft:**
- Eine echte Erzeugung gegen Pollinations oder Pruna auf dieser Variante (die Wege sind
  unverändert, die Aufrufer schon).
- Ein echtes Telefon.
- axe über die ganze Seite.
- Reduzierte Bewegung im Browser.
- Ob Vercel für diesen Branch eine Vorschau baut.

## Fallstricke für die nächste Sitzung

- **Seiten unter `src/app/(app)/` geben `null` zurück.** Inhalt dort würde bei jedem Raumwechsel neu
  mounten. Alles lebt in `AppShell`.
- **React-Compiler-Lint:** kein `setState` in Effekten, keine Ref-Lesungen im Render. Das Muster
  ist abgeleiteter Zustand mit einem „vorheriger Wert"-State (siehe `GallerySheet`).
- **jest:** `lucide-react` ist global auf `src/test/lucide-mock.tsx` gemappt (ESM). vaul braucht in
  jsdom `fireEvent.click` statt `userEvent`, weil `setPointerCapture` fehlt.
- **Next:** Ordner mit `_` am Anfang sind privat und erzeugen keine Route.
- **Asynchrone Läufe in Create** lesen den aktuellen Raum über einen Ref. Ihre Closure stammt aus dem
  Render, in dem sie starteten.
- **Video 2 Pro trifft auf einen Umzug.** `PlaygroundShell.tsx` liegt jetzt unter
  `src/components/playground/`, nicht mehr unter `src/app/create/`. Die Kopfzeile von Create, der
  Rückweg-Link und das Einstellungs-Popover gehören jetzt der Hülle. Wer den lokalen
  Video-2-Pro-Stand auf diese Variante bringt, muss diese Stellen von Hand zusammenführen.

## Offen

1. **E0 — Betreiber:** Video 2 Pro aus dem lokalen Worktree pushen. Erst dann lässt sich
   entscheiden, ob die Variante auf ihn oder er auf die Variante gezogen wird.
2. **Gate auf der Variante:** L-E.1 und L-E.2 neu messen, weil die Hülle um Create neu ist.
   Bereich N (L-N.1 – L-N.5) abarbeiten: ganze Seite mit axe, Tastatur-Durchgang, Trefferflächen,
   Kontrast des dunklen Themes, reduzierte Bewegung im Browser.
3. **E13 Rest:** die offene Unterhaltung als Adressparameter. Heute stellt der Reload die letzte
   Unterhaltung aus dem Speicher wieder her.
4. **E6** (ein Modell, eine Karte), **E8** (Deko-Doppel, About), **E-9** (ASCII-Feld in Create).
5. **Sound-Plan:** sein Blocker, das 30-s-Limit, ist mit E7 technisch weg. Ein echter Lauf mit
   Schlüssel steht aus.
6. **Merge-Entscheidung:** Die Variante ist eigenständig gebaut. Ob und wie sie nach `main` geht,
   entscheidet der Betreiber. Ein PR ist nicht angelegt.
