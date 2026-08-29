# Plan — Phase 4: Fehlerklarheit und Laufstabilität

**Datum:** 2026-08-27
**Status:** Blueprint + Reality Check nach `AGENTS.md`. **Kein Code geschrieben.**
**Deckt ab:** P13 aus [`FAHRPLAN-create.md`](FAHRPLAN-create.md) plus die sieben Altlasten
aus [`HANDOFF-2026-08-26-pruna-video.md`](HANDOFF-2026-08-26-pruna-video.md), Abschnitt „Offen".
**Verifikation:** Alle Fehlerformen unten sind am 2026-08-27 **live gegen
`chat.hey-hi.cloud` und `gen.pollinations.ai` gezogen**, nicht aus dem Code hergeleitet.

> **Kopfstand veraltet.** Geplant wurde gegen `f880389` plus offenen Arbeitsbaum; Phase 0–3 sind seitdem gelandet. Vor der Ausführung gegen den aktuellen HEAD prüfen. Der Abhängigkeitsabschnitt „Phase 3 kommt zuerst" ist erfüllt. Neu hinzugekommen: Async-Protokoll für Pollinations-Videos und die Kriterien L-K.2 / L-K.3 (siehe Audit-Patch-Plan).

---

## Ziel

Jeder Fehlerpfad endet in einem deutschen Satz, der sagt **was passiert ist** und
**was der Nutzer jetzt tun kann** — ohne Konsole, ohne Statuscode-Kenntnis.

Zweites, kleineres Ziel: ein langer Videolauf überlebt einen Reload, und die laufende
Karte sagt, wie lange er schon läuft.

### Fertig-Kriterien, in prüfbare Schritte übersetzt

| # | Kriterium | Prüfschritt |
|---|---|---|
| F1 | Kein Fehler zeigt mehr nur einen Statuscode | Alle 14 Zeilen der Fehlertabelle unten einmal auslösen; jede Anzeige enthält Ursache **und** nächsten Schritt |
| F2 | Kein Fehler zeigt mehr `[object Object]` oder rohes JSON | `/api/pollen/account` mit einem Schlüssel ohne `account:usage` aufrufen → lesbarer Satz in UI und Konsole |
| F3 | Die Meldung wird nicht abgeschnitten | Pruna-400 auf einer schmalen Karte auslösen → volle Meldung erreichbar (Karte oder Detail) |
| F4 | Ein unbekannter Fehler bleibt diagnostizierbar | Route mit unparsbarem Body simulieren → Anzeige nennt Status **und** rohen Text, keine Beschönigung |
| F5 | Die Pollen-Lampe kennt drei Zustände | Schlüssel ohne `account:usage` hinterlegen → Lampe steht auf „nicht prüfbar", nicht auf rot und nicht auf grün |
| F6 | Ein Reload während eines Videolaufs verliert den Lauf nicht | `wan-t2v` starten, nach 10 s neu laden → Karte ist wieder da und läuft weiter bis zum Ergebnis |
| F7 | Die laufende Karte zeigt verstrichene Zeit | Lauf starten → Sekundenzähler läuft; nach 60 s lesbar als `1:05` |
| F8 | `vercel.json` hat ein `maxDuration` | Datei enthält den Wert; `npm run build` grün |
| F9 | `CLAUDE.md` stimmt | Abschnitt zum 202-Protokoll gegen den Code gelesen, Abweichungen nachgezogen |

---

## Abhängigkeit: Phase 3 kommt zuerst

**Diese Phase darf nicht vor Phase 3 laufen.** Der Beleg, live am 2026-08-27:

```
POST https://chat.hey-hi.cloud/api/generate  {"model":"qwen-image","prompt":"a red cube"}
→ 503 {"error":"Model qwen-image requires PRUNA_API_KEY which is not set"}
```

`qwen-image` steht in [`unified-image-models.ts:103`](../src/config/unified-image-models.ts)
als `provider: 'pruna', isFree: true, enabled: true`. Die Oberfläche bietet es als
kostenlos an, der Dispatch schickt es zu Pruna, und ohne Pruna-Schlüssel endet es in einer
Meldung über eine **Server-Umgebungsvariable**, die den Nutzer nichts angeht.

Man kann diesen Satz schöner formulieren. Richtig wird er dadurch nicht — das Modell ist
falsch beschrieben. Vor Phase 3 würde diese Phase Symptome umtexten.

**Konkret vererbt Phase 3 an Phase 4:** ob `qwen-image`, `grok-imagine`,
`ideogram-v4-turbo` überhaupt noch angeboten werden, und ob `gpt-image`,
`wan-image-small`, `ltx-2` verschwunden sind. Jede dieser sechs Zeilen erzeugt heute
einen Fehler, den Phase 4 sonst „übersetzen" müsste, statt ihn abzuschaffen.

---

## Live-Befunde vom 2026-08-27 — was die Altlastenliste korrigiert

Vier Punkte der Altlastenliste sehen nach der Live-Prüfung anders aus als dokumentiert.
Das gehört vor die Umsetzung, sonst wird an der falschen Stelle gebaut.

### Befund A — Der Pollen-403 ist geklärt (Altlast 1)

```
GET https://chat.hey-hi.cloud/api/pollen/account          (ohne Nutzer-Schlüssel, Server-Key)
→ 403 {"error":{"message":"API key does not have 'account:usage' permission and no budget
        of its own. Add `account:usage` or set a budget on the key.","code":"FORBIDDEN"}}
```

Zwei Dinge daran:

1. **Der Schlüssel bei Vercel hat die Berechtigung `account:usage` nicht.** Der Schlüssel in
   der lokalen `.env.local` hat sie — derselbe Aufruf direkt gegen
   `gen.pollinations.ai/account/balance` antwortet damit `200` mit Kontostand. Es sind also
   zwei verschiedene Schlüssel, und der in Produktion kann den Kontostand nicht lesen.
2. **`connectOAuth` fordert die falsche Berechtigung an.**
   [`usePollenKey.ts`](../src/hooks/usePollenKey.ts) setzt
   `permissions=profile,balance,usage`. Pollinations verlangt in der Fehlermeldung
   `account:usage`. Das ist der wahrscheinlichste Grund, warum auch der Schlüssel **im
   Browser des Nutzers** 403 bekommt. → Verifikationsschritt V1 unten.

**Der 403 sagt nichts über die Erzeugungsfähigkeit des Schlüssels aus.** Ein Schlüssel ohne
`account:usage` kann Bilder erzeugen und trotzdem keinen Kontostand liefern. Deshalb darf ein
403 die Lampe **nicht** auf rot setzen — genau dafür ist der dritte Zustand da.

### Befund B — Die Route reicht ein Objekt durch, wo alle Leser einen String erwarten

`gen.pollinations.ai` antwortet mit
`{"success":false,"error":{"message":"…","code":"…"},"status":403}`.
[`/api/pollen/account/route.ts:31`](../src/app/api/pollen/account/route.ts) reicht
`data?.error` unverändert weiter — also ein **Objekt**.

Die beiden Leser erwarten einen String:
- `messageFrom()` in `PlaygroundShell.tsx:63` prüft `typeof body?.error === 'string'` → fällt
  auf `"… (403)"` zurück.
- `usePollenKey.ts` loggt `detail?.error` → in der Konsole steht ein Objekt statt des Satzes,
  den der Handoff dort versprochen hat.

**Das ist der wörtliche Mechanismus hinter „oft steht nur Fehler da".** Es fehlt nicht die
Meldung — sie ist da und wird auf dem Weg weggeworfen.

### Befund C — Die verstrichene Zeit gibt es schon (Altlast 5, teilweise erledigt)

`RunningCard` in [`Gallery.tsx:72`](../src/components/playground/Gallery.tsx) zählt seit
`startedAt` und zeigt `{secs} s`, dazu bei Videos „Video kann mehrere Minuten dauern". Das
steht bereits in `HEAD`, nicht nur im Arbeitsbaum.

Was **wirklich** fehlt: eine lesbare Form jenseits von 60 Sekunden (`700 s` statt `11:40`),
eine Erwartungsgröße („VACE braucht typischerweise 6–12 Minuten") und derselbe Zähler auf
der Chat-Seite. Der Aufwand ist damit klein — die Altlast ist zu 70 % abgehakt.

### Befund D — Zwei Fehler kommen gar nicht aus unserer Route

```
POST /api/generate {"model":"wan-i2v","image":"https://invalid.invalid/x.jpg",
                    "aspectRatio":"16:9","duration":5}   +  gültiger X-Pruna-Key
→ 502, Body: "error code: 502"   (Klartext, kein JSON, nach 0,7 s — zweimal reproduziert)
```

Kein JSON, keine `{ error }`-Hülle, viel zu schnell für ein Timeout. Das kommt von der Kante
vor der Function, nicht aus `handleApiError`. Der Client zeigt dafür heute
„Generierung fehlgeschlagen (502)" — und mehr **kann** er auch nicht zeigen.

Plausible Ursache: Live läuft `HEAD f880389`, also **ohne** die `wan-i2v`-Payload-Korrektur
aus dem Arbeitsbaum (`aspect_ratio` und `optimize_prompt` verwerfen). Ob der 502 nach
Phase 0 verschwindet, ist eine Prüfung, keine Annahme. → Verifikationsschritt V2.

Ebenso: `/api/pruna/status` antwortet live mit `404` samt HTML-Seite — die Route ist
uncommitted und existiert im Deploy nicht. Erwartbar, aber es zeigt, dass ein
**nicht-JSON-Body ein realer, häufiger Fall ist** und der Fallback ihn tragen muss.

---

## Die Fehlertabelle

Alles in Spalte „heute" ist am 2026-08-27 live ausgelöst worden, sofern nicht anders vermerkt.
Spalte „gewünscht" ist der vorgeschlagene Wortlaut — Wortwahl ist Rückfrage R3.

| # | Fehlerfall | Heutige Anzeige | Gewünschte Anzeige | Fundort |
|---|---|---|---|---|
| 1 | Pruna-Modell ohne Pruna-Schlüssel | `Model qwen-image requires PRUNA_API_KEY which is not set` (503) | „**Qwen Image** läuft über Pruna und braucht deinen eigenen Pruna-Schlüssel. Einstellungen öffnen ▸" | [`generate/route.ts:240`](../src/app/api/generate/route.ts) · Code `MISSING_PRUNA_KEY` |
| 2 | Pruna lehnt ein Feld ab | `Pruna API error (400): {"message":"property input validation failed: additional properties forbidden, found voellig_unbekanntes_feld"}` | „**Wan T2V** kennt die Einstellung `voellig_unbekanntes_feld` nicht. Das ist ein Fehler bei uns, nicht bei dir — bitte melden. Ohne diese Einstellung erneut versuchen ▸" | [`pruna/client.ts:89`](../src/lib/pruna/client.ts) · Code `PRUNA_API_ERROR` |
| 3 | Pollinations-Modell ohne gültigen Schlüssel | `Pollinations API error: A valid API key is required. Get one at https://enter.pollinations.ai/keys` (401) | „Dieses Modell braucht einen Pollen-Schlüssel. Pollen verbinden ▸" | [`pollinations-image-v1.ts:70`](../src/lib/pollinations-image-v1.ts) → **kein Code gesetzt** |
| 4 | Pollen aufgebraucht (402) | ungeprüft — vermutlich `Pollinations API error: <upstream>` | „Dein Pollen-Guthaben reicht für dieses Modell nicht. Kontostand ansehen ▸ oder ein freies Modell wählen." | s. o., neuer Code `POLLEN_INSUFFICIENT` |
| 5 | Kontostand nicht abrufbar (403) | Lampe bleibt grün · Konsole: Objekt statt Satz · UI: nichts | „Schlüssel hinterlegt, Kontostand nicht abrufbar: dem Schlüssel fehlt `account:usage`. Erzeugen funktioniert trotzdem." | [`pollen/account/route.ts:31`](../src/app/api/pollen/account/route.ts) + [`usePollenKey.ts`](../src/hooks/usePollenKey.ts) |
| 6 | Schlüssel abgelaufen/falsch (401) | Lampe bleibt grün, stiller Konsolen-Log | „Dein Pollen-Schlüssel wird abgelehnt. Neu verbinden ▸" | wie 5 |
| 7 | Unbekanntes Modell | `Unknown or unavailable Pollinations image/video model: gibt-es-nicht` (400) | „Das Modell **gibt-es-nicht** gibt es nicht mehr. Wähle ein anderes ▸" (Auswahl öffnet sich) | [`generate/route.ts:110`](../src/app/api/generate/route.ts) |
| 8 | Leerer / ungültiger Request | `Invalid request data` (400, `VALIDATION_ERROR`) — Zod-Detail wird verworfen | „Der Prompt fehlt." bzw. das konkrete Feld | [`api-error-handler.ts:validateRequest`](../src/lib/api-error-handler.ts) |
| 9 | Referenzbild auf Modell ohne Support | `Model flux does not support reference images` (400) | „**Flux** kann keine Referenzbilder. Entferne das Bild oder wähle ein Modell, das es kann ▸" | [`generate/route.ts:124`](../src/app/api/generate/route.ts) |
| 10 | Zu viele Anfragen | `Too many requests` (429) — `Retry-After` wird nicht gelesen | „Zu viele Anfragen. Es geht in **34 s** weiter." (Zähler) | [`generate/route.ts:62`](../src/app/api/generate/route.ts) |
| 11 | Upload: multipart | `Send the file as a raw request body, not multipart/form-data` (415) | „Der Upload ist fehlgeschlagen. Bitte erneut versuchen." + technische Zeile im Detail (Nutzer kann das nicht auslösen — es ist unser Bug) | [`media/upload/route.ts`](../src/app/api/media/upload/route.ts) |
| 12 | Upload: SVG / aktiver Typ | `This content type is not allowed for media uploads` (415) | „**SVG** wird nicht angenommen. Nimm PNG, JPG oder WebP." | wie 11 |
| 13 | Antwort ohne JSON-Body | `Generierung fehlgeschlagen (502)` — Text `error code: 502` geht verloren | „Der Dienst hat mit **502** geantwortet und keine Begründung geliefert. Erneut versuchen ▸" + roher Text im Detail | `messageFrom()` in [`PlaygroundShell.tsx:63`](../src/app/playground/PlaygroundShell.tsx) |
| 14 | Lauf über 30 min abgebrochen | `Generierung nach 30 Minuten abgebrochen` | „Der Lauf läuft seit 30 Minuten ohne Ergebnis und wurde aufgegeben. Bei Pruna kann er weiterlaufen und trotzdem abgerechnet werden." | [`request-generation.ts:56`](../src/lib/generation/request-generation.ts) |

### Wie die Übersetzung technisch aussieht

**Nicht** ein Status-Code-Übersetzer. `503` heißt an einer Stelle „du brauchst einen
Schlüssel" und an einer anderen „der Dienst ist unten" — eine Tabelle über Statuscodes
verdeckt mehr, als sie erklärt (dazu Reality Check RC2).

Stattdessen:

1. **Der Server bleibt die Instanz, die sagt was passiert ist.** `ApiError` trägt bereits
   ein `code`. Fehlende Codes werden ergänzt (Zeilen 3, 4, 7, 8, 9, 10 haben heute keins).
2. **Der Client übersetzt `code` → Satz + Handlung.** Eine explizite Tabelle, eine Zeile je
   bekanntem Fall, in einem neuen Modul `src/lib/errors/`.
3. **Der Fallback verschweigt nichts.** Unbekannter Code, kein Code, kein JSON: Anzeige aus
   Status **und** rohem Text. Nie „Ein Fehler ist aufgetreten".
4. **Der Rohtext geht nie verloren.** Er hängt als Detail an der Karte, auch wenn eine
   freundliche Übersetzung existiert.

---

## Component Mapping — Datei für Datei, mit Begründung

### Neu

| Datei | Warum |
|---|---|
| `src/lib/errors/error-codes.ts` | Die Codes als eine Liste. Heute erfindet jede Route ihre eigenen Strings; ohne einen gemeinsamen Ort driften Server und Übersetzung auseinander — genau das ist mit der doppelten Alias-Tabelle in `enhance-prompt` schon einmal passiert (`CLAUDE.md`, Abschnitt Prompt Enhancement). |
| `src/lib/errors/describe-error.ts` | `code → { satz, handlung? }`. Getrennt von den Codes, damit der Server sie nicht importieren muss (sie ist reiner Client-Text). |
| `src/lib/errors/read-error-response.ts` | Ersetzt `messageFrom()`. Liest `{error: string}`, `{error: {message}}` **und** Nicht-JSON. Befund B zeigt, dass alle drei Formen real vorkommen. |
| `src/lib/generation/run-store.ts` | Laufende `predictionId`s in `localStorage`, über `safe-storage`. Siehe Laufstabilität. |
| `src/lib/errors/*.test.ts` | Die Übersetzung ist reine Logik ohne DOM — der billigste Ort für Abdeckung. |

### Geändert

| Datei | Änderung | Warum |
|---|---|---|
| [`src/app/playground/PlaygroundShell.tsx`](../src/app/playground/PlaygroundShell.tsx) | `messageFrom()` → `readErrorResponse()` + `describeError()`; Fehler tragen Satz **und** Rohtext | Das Gerüst steht (`setError` Z. 89, Anzeige Z. 439, `status:'failed'` Z. 259). Nur der Inhalt ändert sich, keine Struktur. |
| [`src/components/playground/Gallery.tsx`](../src/components/playground/Gallery.tsx) | `FailedCard`: `line-clamp-3` weg, Handlungs-Link, aufklappbares Detail · `RunningCard`: `m:ss` statt `700 s`, Erwartungsgröße bei Video | `line-clamp-3` ist die Stelle, an der die Pruna-Meldung heute abgeschnitten wird (F3). Der Zähler existiert schon (Befund C). |
| [`src/app/api/pollen/account/route.ts`](../src/app/api/pollen/account/route.ts) | Upstream-`error` **auspacken**, immer als String weitergeben; Statusklasse mitschicken | Befund B. Ohne das ist jede weitere Arbeit an der Lampe wirkungslos. |
| [`src/hooks/usePollenKey.ts`](../src/hooks/usePollenKey.ts) | Dritter Zustand `keyStatus`; `connectOAuth`-Berechtigungen prüfen und ggf. korrigieren | Altlast 3 und Befund A. Der 403 darf nicht als Trennung gedeutet werden. |
| [`src/components/settings/SettingsPopover.tsx`](../src/components/settings/SettingsPopover.tsx) | Lampe liest `keyStatus` statt `isConnected`; Grund im Klartext daneben | Z. 105/116: heute zwei Farben aus `!!pollenKey`. |
| [`src/lib/pollinations-image-v1.ts`](../src/lib/pollinations-image-v1.ts) | `ApiError` bekommt Codes: 401 → `POLLEN_KEY_REQUIRED`, 402 → `POLLEN_INSUFFICIENT` | Zeilen 3 und 4 der Tabelle haben heute keinen Code und sind darum nicht übersetzbar. |
| [`src/app/api/generate/route.ts`](../src/app/api/generate/route.ts) | Codes für Zeilen 7, 9, 10; Wortlaut von `MISSING_PRUNA_KEY` von „PRUNA_API_KEY is not set" auf die Nutzersicht drehen | Der heutige Satz beschreibt eine Server-Umgebungsvariable. Der Nutzer hat keine. |
| [`src/lib/api-error-handler.ts`](../src/lib/api-error-handler.ts) | `validateRequest` gibt das erste Zod-Feld mit; `handleApiError` bleibt maskierend | Zeile 8. Die Maskierung generischer `Error` ist **Absicht** (kein Stack nach außen) und bleibt — sie ist keine Fehlerquelle, weil die relevanten Pfade `ApiError` werfen. |
| [`src/lib/generation/request-generation.ts`](../src/lib/generation/request-generation.ts) | Lauf beim Dispatch merken, beim Ergebnis löschen; Wiederaufnahme-Einstieg; Abbruchmeldung nach Zeile 14 | Laufstabilität. |
| [`src/lib/pruna/client.ts`](../src/lib/pruna/client.ts) | Feldname aus `additional properties forbidden, found <feld>` herausziehen und als `details.field` mitgeben | Zeile 2. Der Feldname ist die einzige verwertbare Information in der Meldung; heute steckt er in doppelt geschachteltem JSON in einem String. |
| [`vercel.json`](../vercel.json) | `maxDuration` für `src/app/api/**` | Altlast 7. |
| [`CLAUDE.md`](../CLAUDE.md) | Abschnitt „Long runs answer 202" gegen den Code prüfen; Laufwiederaufnahme und die neue Fehlerkonvention ergänzen | Altlast 6 ist seit dem 2026-08-27 im Wesentlichen erledigt; hier bleibt Nachziehen. |

### Ausdrücklich nicht angefasst

- `src/hooks/useUnifiedImageToolState.ts` — der Chat-Visualize-Pfad meldet über `toast()`
  mit englischen Titeln (`Upload failed`, `Enhancement Failed`). Er gehört zu **Phase 7**
  (Chat entschlanken) und würde hier zweimal angefasst.
- `src/components/ChatProvider.tsx` — die Medien-Intent-Meldungen (Z. 424) hängen an
  Phase 8 (Musik) und der `acestep`-Bereinigung.

---

## Laufstabilität

Drei Punkte, in aufsteigendem Risiko.

### L1 — `vercel.json` bekommt ein `maxDuration` (Altlast 7)

`vercel.json` enthält `{}`. Vercels Vorgabe liegt heute bei 300 s. Seit dem 202-Protokoll
wartet keine Route mehr auf ein Video, also ist das kein akuter Blocker — aber es gibt auch
kein gesetztes Netz.

Vorschlag: `maxDuration: 300` für `src/app/api/**`. Bewusst **nicht** höher: kein Pfad soll
wieder anfangen zu warten, und eine hohe Grenze lädt genau dazu ein. Das Netz fängt lange
Media-Ingests ab, nicht Videoerzeugung.

Zu prüfen: Vercel empfiehlt inzwischen `vercel.ts` statt `vercel.json`. Für einen einzigen
Wert ist das Overkill — Rückfrage R4.

### L2 — Verstrichene Zeit lesbar machen (Altlast 5, Rest)

Befund C: der Zähler existiert. Zu tun:

- `700 s` → `11:40` ab 60 Sekunden.
- Bei Videomodellen eine Erwartungsgröße aus den Messwerten des 2026-08-26:
  wan-t2v ≈ 45 s, VACE 348–700 s. Als Satz, nicht als Balken — es gibt keinen Prozentwert,
  und ein Balken, der ihn vortäuscht, ist schlechter als keiner.
- Ab der doppelten Erwartungszeit ein Hinweis, dass der Lauf ungewöhnlich lange braucht,
  statt ihn stumm weiterzählen zu lassen.

### L3 — Der Lauf überlebt einen Reload (Altlast 4)

Das ist der einzige Punkt mit echtem Entwurfsrisiko.

**Heute:** `requestGeneration()` hält `predictionId` in einer lokalen Variablen. Reload =
Lauf weg. Bei Pruna läuft er weiter und wird abgerechnet — der Nutzer sieht nur nichts mehr.

**Vorschlag:**

1. Beim `202` wird ein Eintrag geschrieben:
   `{ runId, predictionId, model, prompt, params, isVideo, aspectRatio, startedAt }` unter
   einem Schlüssel in `localStorage`, über
   [`safe-storage.ts`](../src/lib/safe-storage.ts) — der Wrapper ist Safari-gehärtet und
   wirft nie, was hier zählt, weil der Schreibvorgang mitten in einem Generierungspfad liegt.
2. Ergebnis, Fehler oder Abbruch löschen den Eintrag.
3. `PlaygroundShell` liest die Liste beim Mount, legt für jeden Eintrag eine `ActiveRun`-Karte
   an (mit dem ursprünglichen `startedAt`, damit der Zähler stimmt) und nimmt das Polling auf
   `/api/pruna/status` wieder auf.
4. Einträge älter als die 30-Minuten-Reißleine werden beim Lesen verworfen, nicht
   wiederaufgenommen.

**Warum der `QueuedRun`-Kontext mitgespeichert wird:** „Erneut versuchen" wiederholt heute
bewusst genau den abgeschickten Lauf, nicht den Composer-Stand (Kommentar bei
`PlaygroundShell.tsx:29`). Ein wiederaufgenommener Lauf ohne diesen Kontext hätte einen
Retry-Knopf, der etwas anderes tut als der daneben. Also mitspeichern — oder den Retry für
wiederaufgenommene Läufe abschalten. Das ist Rückfrage R2.

**Was der Vorschlag ausdrücklich nicht kann:** Pollinations-Läufe. Die laufen im Request und
haben keine Lauf-Id. Ein Reload verliert sie weiterhin — richtig so, sie dauern Sekunden.

---

## Reality Check (Phase 3 nach `AGENTS.md`)

### RC1 — Führt das zu Spaghetti?

Ein neuer Ordner `src/lib/errors/` mit drei kleinen Modulen. Das Risiko ist nicht der Ordner,
sondern **eine zweite Wahrheit**: Wenn die Codes im Server-Modul und die Sätze im
Client-Modul auseinanderdriften, haben wir denselben Fehler wie bei der doppelten
Alias-Tabelle in `/api/enhance-prompt` — jede Änderung landet in genau einem der beiden.

**Gegenmittel:** Ein Test, der über die Code-Liste iteriert und für jeden Code einen Satz
verlangt. Ein neuer Code ohne Übersetzung macht den Test rot. Das ist billig und hält.

### RC2 — Verdeckt eine gemeinsame Übersetzungsschicht mehr, als sie hilft?

**Teilweise ja — und das begrenzt den Entwurf.** Die live gezogenen Formen sind strukturell
verschieden:

| Anbieter | Form | Verwertbar |
|---|---|---|
| Pruna | `{"message":"property input validation failed: additional properties forbidden, found <feld>"}` | der Feldname |
| Pollinations | `{"success":false,"error":{"message":"…","code":"UNAUTHORIZED"},"status":401}` | Satz + Code |
| Kante/Edge | `error code: 502`, Klartext | nichts außer dem Status |

Eine Schicht, die daraus **einen** Satz macht, muss zwangsläufig Information wegwerfen —
genau das tut `messageFrom()` heute. Deshalb die Grenzen:

- Die Schicht übersetzt **nur** über `code`, nie über Status oder Textmuster. Codes sind von
  uns vergeben und stabil; Anbietertexte sind es nicht.
- Sie hat **keinen** generischen Zweig, der Unbekanntes glättet. Unbekannt heißt: Status
  plus Rohtext, sichtbar.
- Das Auspacken der Anbieterform bleibt **beim Anbieter** (`pruna/client.ts`,
  `pollinations-image-v1.ts`), nicht in der gemeinsamen Schicht. Die Schicht sieht nur noch
  Code plus Details.

Damit ist es keine Übersetzungsschicht über Fehler, sondern eine Tabelle über **unsere
eigenen** Codes. Das trägt.

### RC3 — Breche ich bestehende Hooks?

- `usePollenKey` bekommt ein Feld dazu, `pollenKey`/`isConnected` bleiben. Die Leser
  (`SettingsPopover`, `PlaygroundShell:80`, `useHasPollenKey`) laufen unverändert weiter.
- `messageFrom()` ist modulprivat in `PlaygroundShell` — der Austausch hat keine Reichweite.
- `requestGeneration()` behält Signatur und Rückgabetyp. `chat-service.ts:141` nutzt sie
  ebenfalls und wird nicht angefasst; die Wiederaufnahme ist eine zusätzliche, exportierte
  Funktion, kein verändertes Verhalten der bestehenden.

### RC4 — Gibt es einen einfacheren Weg?

Für die Fehlermeldungen: ja, man könnte die Sätze direkt in die Routen schreiben und den
Client unverändert lassen. Verworfen, weil die Routen dann deutschen Produkttext tragen und
die Grenze zwischen API und Oberfläche verwischt — und weil Zeile 13 (kein JSON) so gar nicht
lösbar ist.

Für Altlast 2 (`normalizePollenKey` prüft kein Präfix): **Hier ist der einfachere Weg, es
nicht zu tun.** Ein Präfix-Check ist eine Formprüfung, die nichts über Gültigkeit sagt, und
er kann gültige Schlüssel aussperren, sobald Pollinations das Format ändert. Der lokale
Schlüssel beginnt mit `sk_` und ist 35 Zeichen lang — **ein** Muster ist keine Spezifikation.
Der dritte Lampenzustand aus L2/Befund A löst dasselbe Problem besser: er fragt das echte
Gate. **Vorschlag: Altlast 2 als erledigt-durch-Ersatz schließen.** Rückfrage R1.

### RC5 — Was kann diese Phase kaputt machen?

Der Pruna-Testpfad. Jeder gültige Payload startet einen kostenpflichtigen Lauf, und Pruna hat
keinen Cancel-Endpunkt. Beim Messen am 2026-08-26 sind so echte Kosten entstanden.

**Regel für die Umsetzung:** Jede Pruna-Prüfung in dieser Phase läuft entweder über einen
Validierungsfehler (unbekanntes Feld → 400, kein Lauf) oder mit
`https://invalid.invalid/x.jpg` als Medien-URL. Beide Wege sind am 2026-08-27 gegen die
Live-Route benutzt worden, ohne einen Lauf auszulösen.

### RC6 — Der Arbeitsbaum

`PlaygroundShell.tsx`, `Gallery.tsx`, `usePollenKey.ts`, `SettingsPopover.tsx`,
`request-generation.ts`, `pruna/client.ts`, `unified-image-models.ts` liegen **alle** offen
im Arbeitsbaum. Phase 0 muss vorher durch sein, sonst editiert diese Phase Dateien mit
uncommitteten Fremdänderungen — und `git diff` wird als Prüfmittel wertlos.

---

## Verifikationsschritte vor der Umsetzung

Drei Dinge, die gegen den laufenden Dienst geklärt gehören, bevor Code entsteht:

- **V1 — OAuth-Berechtigung.** `connectOAuth` fordert `profile,balance,usage`, Pollinations
  nennt `account:usage`. Klären, welche Namen `enter.pollinations.ai/authorize` heute
  akzeptiert, dann einmal durch den echten OAuth-Flow gehen und
  `/api/pollen/account` prüfen. **Das ist der Test für Altlast 1.**
- **V2 — Der wan-i2v-502.** Nach Phase 0 (mit den Payload-Korrekturen aus dem Arbeitsbaum)
  denselben Aufruf wiederholen. Bleibt der 502, ist es ein eigener Bug und kein
  Anzeigeproblem.
- **V3 — Der Produktions-Pollen-Schlüssel.** Der Schlüssel bei Vercel hat `account:usage`
  nicht, der lokale schon. Klären, ob das Absicht ist. Betrifft nur die Kontostandsanzeige,
  nicht das Erzeugen — belegt durch den erfolgreichen anonymen `flux`-Lauf gegen die
  Live-Route.
  *Nachprüfen ließ sich das am 2026-08-27 nicht:* `vercel env ls production` hat keine
  Anmeldedaten gefunden und wollte in den Device-Login. Der Weg ist erst nach einem
  `vercel login` offen — oder direkt über die Projekteinstellungen im Vercel-Dashboard.

---

## Testplan

### Automatisiert (`npm test`)

| Was | Wo | Prüft |
|---|---|---|
| `readErrorResponse()` gegen alle drei Live-Formen: `{error:"…"}`, `{error:{message:"…"}}`, `error code: 502` | `src/lib/errors/read-error-response.test.ts` | F2, F4 — die Formen sind live belegt, nicht erfunden |
| Jeder Code aus `error-codes.ts` hat einen Satz | `src/lib/errors/describe-error.test.ts` | RC1 — verhindert die zweite Wahrheit |
| Feldname aus der Pruna-400-Meldung extrahiert | `src/lib/pruna/client.test.ts` (existiert) | Tabelle Zeile 2 |
| `keyStatus`: kein Schlüssel / 200 / 401 / 403 / Netzfehler | `src/hooks/usePollenKey.test.tsx` (existiert) | F5 — besonders: **403 ergibt nicht `rejected`** |
| Lauf schreiben, lesen, löschen; abgelaufene Einträge verworfen; `safe-storage` wirft nicht | `src/lib/generation/run-store.test.ts` | L3 |
| `requestGeneration` legt bei 202 einen Eintrag an und räumt ihn bei 200 und bei Abbruch weg | `src/lib/generation/request-generation.test.ts` (existiert) | L3 |
| Fehlerkarte zeigt Satz **und** Rohtext, nicht abgeschnitten | `src/app/playground/PlaygroundShell.test.tsx` (existiert) | F1, F3 |
| Wiederaufgenommener Lauf erscheint beim Mount als laufende Karte | `PlaygroundShell.test.tsx` | F6 |

### Gegen die Live-Route (kostenfrei)

Diese sieben liefen am 2026-08-27 schon einmal und sind nach der Umsetzung zu wiederholen —
diesmal wird die **Anzeige** geprüft, nicht die Antwort:

```
POST /api/generate {"model":"gibt-es-nicht"}                    → Tabelle 7
POST /api/generate {"prompt":"","model":"flux"}                 → Tabelle 8
POST /api/generate {"model":"flux","image":"https://invalid.invalid/x.jpg"} → Tabelle 9
GET  /api/pollen/account                                        → Tabelle 5
GET  /api/pollen/account  (X-Pollen-Key: Mist)                  → Tabelle 6
POST /api/media/upload  -F file=@…                              → Tabelle 11
POST /api/media/upload  Content-Type: image/svg+xml             → Tabelle 12
```

### Gegen Pruna — nur diese zwei, beide ohne Kosten

```
POST /api/generate {"model":"wan-t2v","params":{"unbekanntes_feld":1}}   → 400, kein Lauf
POST /api/generate {"model":"wan-i2v","image":"https://invalid.invalid/x.jpg"} → V2
```

### Der eine Lauf, der Geld kostet

**F6 braucht einen echten Lauf.** `wan-t2v` mit `go_fast` lag am 2026-08-26 bei 45 s — das
ist der günstigste Weg, einen Reload mitten in einem 202-Lauf zu prüfen. Einmal, am Ende,
nach Absprache. Kein VACE.

### Vor dem Abschluss

`npm run lint` · `npm run typecheck` · `npm test` · `npm run build` — alle vier grün.

---

## Nicht Teil dieser Phase

| Ausgeschlossen | Warum |
|---|---|
| **Modell-Listen korrigieren** | Phase 3. Diese Phase erbt das Ergebnis. |
| **Fehlermeldungen ins Englische übersetzen (i18n)** | Create ist heute durchgehend hart deutsch (nur `ModelPicker` nutzt `useLanguage`). Das zu ändern ist ein eigener Schnitt. → Rückfrage R3 |
| **Chat-Visualize-Meldungen** (`useUnifiedImageToolState`, englische Toasts) | Phase 7 fasst dieselben Dateien an. |
| **Medien-Intent-Meldungen im Chat** (`ChatProvider:424`) | Phase 8, hängt an der `acestep`-Bereinigung. |
| **Löschen in der Galerie, gemeinsamer Asset-Pool** | Phase 5. |
| **Abbrechen bei Pruna** | Pruna hat keinen Cancel-Endpunkt. Der lokale Abbruch stoppt nur das Polling; der Lauf läuft weiter und wird abgerechnet. Das gehört **benannt** (Tabelle 14), nicht gelöst. |
| **Fortschritt in Prozent** | Pruna liefert `starting`/`processing`/`succeeded`. Ein Balken wäre erfunden. |
| **Die Maskierung generischer `Error` in `handleApiError` aufheben** | Absicht (kein Stack nach außen). Die relevanten Pfade werfen `ApiError`. |
| **`predictionId` für Pollinations-Läufe** | Es gibt keine. |
| **Wechsel auf `vercel.ts`** | Ein Wert rechtfertigt keinen Konfigurationsumbau. → R4 |
| **BYOP-Schlüssel aus dem Web-Storage holen** | Bekannt, dokumentiert, akzeptiert (`CLAUDE.md`). Eigener Schnitt. |

---

## Rückfragen

**R1 — Altlast 2 (Präfix-Prüfung) streichen?**
Mein Vorschlag: ja. Eine Formprüfung sagt nichts über Gültigkeit, kann gültige Schlüssel
aussperren, und der dritte Lampenzustand fragt das echte Gate. Ich habe genau **einen**
Schlüssel als Muster (`sk_`, 35 Zeichen) — zu wenig für eine Regel. Einverstanden, oder
soll die Prüfung trotzdem rein?

**R2 — Retry für wiederaufgenommene Läufe.**
Ein nach Reload wiederaufgenommener Lauf kann seinen Retry-Kontext nur behalten, wenn Prompt
und Parameter mit in den `localStorage` wandern. Zwei Wege:
*(a)* Kontext mitspeichern — Retry funktioniert wie vorher, kostet ein paar KB Storage je Lauf.
*(b)* Nur `predictionId` speichern — der wiederaufgenommene Lauf zeigt sein Ergebnis, hat
aber keinen Retry-Knopf.
Ich neige zu **(a)**, weil sonst zwei Karten nebeneinander unterschiedlich funktionieren.

**R3 — Sprache und Tonfall.**
Alle Vorschläge in der Tabelle sind hartes Deutsch, mit „du" und mit einem Link als Handlung
(„Einstellungen öffnen ▸"). Passt das zum Create, oder sollen Fehlermeldungen von Anfang an
durch `translations.ts` laufen? Letzteres ist mehr Arbeit und macht die Sätze steifer.

**R4 — `vercel.json` oder `vercel.ts`?**
Vercel empfiehlt inzwischen `vercel.ts`. Für ein einzelnes `maxDuration` halte ich das für
Overkill und würde bei `vercel.json` bleiben.

**R5 — Welcher Fehler ist dir am häufigsten begegnet?**
Ich habe vierzehn Fälle live ausgelöst, aber nicht deine Sitzung nachgestellt. Wenn du sagen
kannst, welche Meldung dir am öftesten als bloßes „Fehler" begegnet ist, ziehe ich die Zeile
in der Tabelle nach vorn — dann steht der Fall zuerst, der wirklich weh tut.
