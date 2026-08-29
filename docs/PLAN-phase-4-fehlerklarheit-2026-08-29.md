# Phase 4: Fehlerklarheit und Laufstabilität — Umsetzungsplan (Schnitt 2026-08-29)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Ausführungsform laut Auftrag: zweistufig. Stufe 1 (Diagnose) ist erledigt — alle Befunde
> dieses Plans sind am 2026-08-29 live gegen `chat.hey-hi.cloud` bzw. den lokalen Dev-Server
> gezogen, nicht aus dem Code hergeleitet. Stufe 2 (Umsetzung) läuft als Orchestrator mit
> Worker-Modell GLM 5.3 Flash oder DeepSeek Flash; der Orchestrator führt jeden
> Verifikationsbefehl nach Fertigmeldung des Workers selbst erneut aus.

**Goal:** Jeder Fehlerpfad im Create endet in einem deutschen Satz mit Ursache und nächstem
Schritt; ein Videolauf überlebt einen Reload; L-C.1–L-C.4, L-K.2 und L-I.3 stehen am Ende auf
erledigt in `LAUNCH_CRITERIA.md`.

**Architecture:** Der Server gibt jedem bekannten Fehler einen stabilen `code` (`ApiError.code`,
existiert bereits), der Client übersetzt `code → Satz + Handlung` in einer eigenen Tabelle unter
`src/lib/errors/` und zeigt den Rohtext zusätzlich an. Läufe werden bei `202` in
`localStorage` (über `safe-storage`) persistiert und beim Mount wiederaufgenommen. Keine neue
Abhängigkeit, kein neuer Dienst.

**Tech Stack:** Next.js 16 App Router, React 19, Jest + Testing Library, Zod, `safe-storage`.

**Spec:** [`LAUNCH_CRITERIA.md`](LAUNCH_CRITERIA.md) (L-C.1–C.4, L-K.2, L-I.3 — Statusquelle),
[`FAHRPLAN-create.md`](FAHRPLAN-create.md) Abschnitt Phase 4,
[`HANDOFF-2026-08-28-phase-3.md`](HANDOFF-2026-08-28-phase-3.md) Abschnitte 3 und 6,
[`HANDOFF-2026-08-29-audit-review.md`](HANDOFF-2026-08-29-audit-review.md) Abschnitt 6.

---

## Global Constraints

- **Kostenregel (verschärft gegenüber dem Plan vom 2026-08-27):** Kein Paket darf einen
  kostenpflichtigen Pruna-Lauf auslösen. Erlaubt ist **nur** der Validierungsfehler
  (unbekanntes Feld → 400, kein Lauf). **`https://invalid.invalid/x.jpg` ist verboten** —
  live am 2026-08-29 belegt: der Payload passiert seit den Phase-0-Fixes die Pruna-Validierung
  und **startet einen echten Lauf** (202 + predictionId), der am Mediendownload scheitert.
- **Kein Worker committet.** Der Orchestrator committet nach eigener Nachverifikation.
- **Fertig-Kriterium je Paket:** neue Tests zuerst rot, dann grün; danach
  `CI=1 npx jest --silent` vollständig grün (Ausgangsbasis: **109 Suiten / 852 Tests** —
  die Zahl darf nur wachsen), `npm run lint` und `npx tsc --noEmit` sauber.
- **Sprache:** alle Create-Texte hart deutsch (Betreiberentscheid E3, Bereich M —
  kein `t()`, keine Übersetzungsschlüssel). Schriftregel aus `CLAUDE.md`:
  Modell-IDs, Codes, Zeiten in `font-mono`, gesprochene Sätze proportional.
- **Pakete W1→W2→W3 sind seriell** (W2 konsumiert W1-Codes, W3 konsumiert beides). W4–W8
  berühren teils dieselben Dateien (`PlaygroundShell.tsx`, `PromptBar.tsx`) — insgesamt
  seriell ausführen, keine Worker-Parallelität.
- **Offen (Entscheidung Betreiber, blockiert nichts in W1–W11):** das Async-Protokoll für
  Pollinations-Videos. Seit Betreiberentscheid E1-A (Video vollständig hinter der Pollenwall)
  nutzt **kein angebotenes Modell** den synchronen Pollinations-Videopfad — alle
  aktiven Videomodelle sind Pruna und vom 202-Protokoll gedeckt. Die Alternativen stehen im
  Sitzungsbericht; je nach Entscheidung kommt ein Paket W12 hinzu oder die Zurückstellung
  wird in W9 dokumentiert.
- **Veraltete Plan-Annahmen, die hier korrigiert sind:** `PlaygroundShell` lebt unter
  `src/app/create/` (nicht `src/app/playground/`); L-K.3 ist erledigt (Audit-Patch W7) und
  wird nicht neu gebaut; Altlast 5 (leeres Pollen-Feld) ist durch Phase 0 erledigt; Altlast 6
  (202-Protokoll in `CLAUDE.md`) ist dokumentiert, Rest in W9.

---

## Live-Befunde vom 2026-08-29 (Grundlage, alle selbst gezogen)

| # | Fall | Live-Antwort (gekürzt) | Herkunft |
|---|---|---|---|
| 1 | `/api/pollen/account` ohne Client-Key | `403 {"error":{"message":"…does not have 'account:usage'…","code":"FORBIDDEN"}}` — **Objekt**, nicht String | Produktion |
| 2 | dto. mit Müll-Key | `401 {"error":{"message":"Authentication required…","code":"UNAUTHORIZED"}}` — Objekt | Produktion |
| 3 | `/api/generate` unbekanntes Modell | `400 {"error":"Unknown or unavailable Pollinations image/video model: gibt-es-nicht"}` — kein Code | Produktion |
| 4 | leerer Prompt | `400 {"error":"Invalid request data","code":"VALIDATION_ERROR"}` — Zod-Detail verworfen | Produktion |
| 5 | flux + Referenzbild | `400 {"error":"Model flux does not support reference images"}` — kein Code | Produktion |
| 6 | flux mit Key ohne Budget | `402 {"error":"Pollinations API error: API key budget too low. This request costs ~0.0020 pollen, but this key has 0.0000."}` — kein Code | Dev-Server |
| 7 | flux mit Müll-Key | `401 {"error":"Pollinations API error: A valid API key is required. Get one at https://enter.pollinations.ai/keys"}` — kein Code | Produktion |
| 8 | 21× `/api/generate` | ab RNr. 20 `429`, Header `retry-after: 19`, Body `{"error":"Too many requests"}` — Header liest niemand | Produktion |
| 9 | Upload multipart | `415 {"error":"Send the file as a raw request body, not multipart/form-data"}` | Produktion |
| 10 | Upload SVG | `415 {"error":"This content type is not allowed for media uploads"}` | Produktion |
| 11 | wan-t2v + `params:{"voellig_unbekanntes_feld":1}` | `400 {"error":"Pruna API error (400): {\"message\":\"…additional properties forbidden, found voellig_unbekanntes_feld\"}","code":"PRUNA_API_ERROR"}` — Feldname in escaped JSON vergraben, **kein Lauf, keine Kosten** | Dev-Server |
| 12 | wan-i2v + `invalid.invalid` | **`202 {"pending":true,"predictionId":"…"}` — der Lauf startet**, danach `502 {"error":"Pruna prediction failed: HTTPSConnectionPool(host='invalid.invalid'…)","code":"PRUNA_PREDICTION_FAILED"}` — rohe Python-Meldung beim Client | Dev-Server |
| 13 | 30-Minuten-Reißleine | `throw new Error('Generierung nach 30 Minuten abgebrochen')` — sagt dem Pruna-Nutzer nicht, dass der Lauf weiterläuft | Code `request-generation.ts:55` |

Dazu unverändert gültig aus dem Plan vom 2026-08-27 (heute gegen den Code geprüft): Befund B
(`pollen/account/route.ts:31` reicht `data?.error` als Objekt durch; `messageFrom()` in
`src/app/create/PlaygroundShell.tsx:66` liest nur `typeof body?.error === 'string'`);
Befund C (der Sekundenzähler existiert in `Gallery.tsx:73-84`, es fehlen `m:ss`, Erwartungsgröße,
Hinweis bei ungewöhnlicher Dauer); `FailedCard` schneidet mit `line-clamp-3` ab
(`Gallery.tsx:123`); `connectOAuth` fordert weiterhin `permissions=profile,balance,usage`
(`usePollenKey.ts:152`); die Pollen-Lampe kennt zwei Zustände
(`SettingsPopover.tsx:102-117`); Altlast 2 (`normalizePollenKey` ohne Präfix-Check) bleibt
bewusst ungeändert — der dritte Lampenzustand fragt das echte Gate (RC4 des Altplans,
hier übernommen).

---

## Fehlertabelle — Zielanzeigen (hart deutsch, mit Handlung)

| Code | Auslöser | Zielanzeige |
|---|---|---|
| `MISSING_PRUNA_KEY` | Pruna-Modell ohne Pruna-Schlüssel (503) | „**<Modellname>** läuft über Pruna und braucht deinen eigenen Pruna-Schlüssel.“ Handlung: Einstellungen öffnen. |
| `PRUNA_API_ERROR` (mit `details.field`) | Pruna lehnt ein Feld ab (400) | „**<Modellname>** kennt die Einstellung `<feld>` nicht. Das ist ein Fehler bei uns, nicht bei dir — bitte melden. Ohne diese Einstellung erneut versuchen.“ |
| `PRUNA_PREDICTION_FAILED` | Pruna-Lauf schlug fehl (502) | „Der Lauf bei Pruna ist fehlgeschlagen: <gekürzte Anbieter-Begründung>. Erneut versuchen.“ |
| `PRUNA_RUN_ABANDONED` | 30-Minuten-Reißleine (client) | „Der Lauf läuft seit 30 Minuten ohne Ergebnis und wurde hier aufgegeben. Bei Pruna kann er weiterlaufen und trotzdem abgerechnet werden.“ |
| `POLLEN_KEY_REQUIRED` | Pollinations 401 | „Dieses Modell braucht einen Pollen-Schlüssel.“ Handlung: Einstellungen öffnen. |
| `POLLEN_INSUFFICIENT` | Pollinations 402 | „Dein Pollen-Guthaben reicht für dieses Modell nicht.“ Handlung: Einstellungen öffnen (Kontostand) oder freies Modell wählen. |
| `UNKNOWN_MODEL` | 400 „Unknown or unavailable…“ | „Das Modell `<id>` gibt es nicht (mehr).“ Handlung: Modellauswahl öffnen. |
| `VALIDATION_ERROR` | 400, Zod | Feldbezogen: „Der Prompt fehlt.“ bzw. „Das Feld `<field>` ist ungültig: <issue>“. |
| `REFERENCE_NOT_SUPPORTED` | 400 „does not support reference images“ | „**<Modellname>** kann keine Referenzbilder. Entferne das Bild oder wähle ein Modell, das sie nimmt.“ |
| `RATE_LIMITED` | 429 (+ `Retry-After`) | „Zu viele Anfragen. Es geht in <N> s weiter.“ (Zahl aus dem Header, eine Zeile `font-mono`.) |
| `PRUNA_STATUS_ERROR` / `PRUNA_NETWORK_ERROR` / `PRUNA_DOWNLOAD_ERROR` / `PRUNA_UPLOAD_ERROR` / `PRUNA_MISSING_STATUS` / `PRUNA_INVALID_ID` / `PRUNA_ABORTED` / `UNKNOWN_PRUNA_MODEL` / `PRUNA_MODEL_CONFIG_ERROR` / `PRUNA_UNSAFE_URL` / `PRUNA_UNSAFE_REDIRECT` / `PRUNA_UPLOAD_MISSING_URL` | übrige Pruna-Codes | je ein kurzer Ursache-Satz; Rohtext immer im Detail sichtbar. |
| kein Code / kein JSON | z. B. Edge-502, Klartext-Body | „Der Dienst hat mit **<Status>** geantwortet und keine Begründung geliefert.“ Rohtext im Detail. Nie „Ein Fehler ist aufgetreten“ ohne Status. |

Upload-Fehler (415 multipart/SVG) sind von der Oberfläche nicht auslösbar (unser eigener
Vertrag) und bekommen **keinen UI-Text** — der Servertext bleibt, sie stehen nur in dieser
Tabelle zur Dokumentation.

---

## Pakete

### W1 — Fehlercode-Kern: `src/lib/errors/` (TDD)

**Files:**
- Create: `src/lib/errors/error-codes.ts`
- Create: `src/lib/errors/describe-error.ts`
- Create: `src/lib/errors/read-error-response.ts`
- Test: `src/lib/errors/describe-error.test.ts`, `src/lib/errors/read-error-response.test.ts`

**Interfaces (Produkte für W2/W3):**

```ts
// error-codes.ts
export const ERROR_CODES = [
  'MISSING_PRUNA_KEY', 'PRUNA_API_ERROR', 'PRUNA_PREDICTION_FAILED', 'PRUNA_RUN_ABANDONED',
  'POLLEN_KEY_REQUIRED', 'POLLEN_INSUFFICIENT', 'UNKNOWN_MODEL', 'VALIDATION_ERROR',
  'REFERENCE_NOT_SUPPORTED', 'RATE_LIMITED', 'PRUNA_NETWORK_ERROR', 'PRUNA_STATUS_ERROR',
  'PRUNA_DOWNLOAD_ERROR', 'PRUNA_UPLOAD_ERROR', 'PRUNA_MISSING_STATUS', 'PRUNA_INVALID_ID',
  'PRUNA_ABORTED', 'UNKNOWN_PRUNA_MODEL', 'PRUNA_MODEL_CONFIG_ERROR', 'PRUNA_UNSAFE_URL',
  'PRUNA_UNSAFE_REDIRECT', 'PRUNA_UPLOAD_MISSING_URL', 'INTERNAL_ERROR', 'UNKNOWN_ERROR',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

// describe-error.ts
export interface ErrorDescription { satz: string; aktion?: 'settings' | 'retry' | 'pick-model'; }
export interface DescribeContext { modelLabel?: string; field?: string; retryAfterSeconds?: number; }
export function describeError(code: string | undefined, ctx: DescribeContext): ErrorDescription | null; // null = Code unbekannt → Fallback
export function describeUnknown(status: number, raw: string): ErrorDescription;

// read-error-response.ts
export interface ErrorResponse { status: number; message: string; code?: string; raw: string; field?: string; retryAfterSeconds?: number; }
export async function readErrorResponse(res: Response): Promise<ErrorResponse>;
```

- [ ] **Schritt 1: Tests schreiben (rot).** `read-error-response.test.ts` prüft genau die drei
  live belegten Formen:

```ts
import { readErrorResponse } from './read-error-response';

const jsonResponse = (body: unknown, status = 400) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('liest {error: string} mit Code', async () => {
  const r = await readErrorResponse(jsonResponse({ error: 'Invalid request data', code: 'VALIDATION_ERROR' }));
  expect(r).toMatchObject({ status: 400, message: 'Invalid request data', code: 'VALIDATION_ERROR' });
  expect(r.raw).toContain('Invalid request data');
});

test('liest {error: {message, code}} — die Pollen-Form', async () => {
  const r = await readErrorResponse(jsonResponse({ error: { message: 'nope', code: 'FORBIDDEN' } }, 403));
  expect(r).toMatchObject({ status: 403, message: 'nope', code: 'FORBIDDEN' });
});

test('liest Nicht-JSON-Klartext — die Edge-Form', async () => {
  const r = await readErrorResponse(new Response('error code: 502', { status: 502 }));
  expect(r).toMatchObject({ status: 502, message: '', raw: 'error code: 502' });
});

test('liest Retry-After als retryAfterSeconds', async () => {
  const res = jsonResponse({ error: 'Too many requests' }, 429);
  res.headers.set('Retry-After', '19');
  const r = await readErrorResponse(res);
  expect(r.retryAfterSeconds).toBe(19);
});
```

  `describe-error.test.ts` — der RC1-Wächter: iteriert über `ERROR_CODES` und verlangt für
  **jeden** Code einen nicht-leeren deutschen Satz ohne „undefined“/„null“; zusätzlich
  Einzelfälle: `MISSING_PRUNA_KEY` nennt `ctx.modelLabel`, `PRUNA_API_ERROR` nennt
  `ctx.field` in Mono-Optik (Text: Backticks genügen), `RATE_LIMITED` nennt
  `retryAfterSeconds`, `VALIDATION_ERROR` mit `field: 'prompt'` ergibt „Der Prompt fehlt.“,
  `describeUnknown(502, 'error code: 502')` nennt die 502 und den Rohtext.

- [ ] **Schritt 2:** `CI=1 npx jest --silent src/lib/errors` → rot (Module fehlen).
- [ ] **Schritt 3: Implementierung.** `readErrorResponse`: `const raw = await res.text()` zuerst
  (der Body darf nur einmal gelesen werden), dann `JSON.parse` im try/catch; `message` aus
  `body.error` (String) oder `body.error.message` oder `body.message`, `code` aus `body.code`,
  `field` aus `body.details?.field ?? body.details?.[0]?.path?.[0]`, `retryAfterSeconds` aus dem
  `Retry-After`-Header (parseInt, NaN → undefined). `describeError`: eine Tabelle
  `Record<ErrorCode, (ctx) => ErrorDescription>` wörtlich nach der Fehlertabelle oben;
  unbekannter Code → `null`. `describeUnknown`: „Der Dienst hat mit **<status>** geantwortet
  und keine Begründung geliefert.“ + Rohtext im `satz`-Anhang, wenn `raw` nicht leer ist.
- [ ] **Schritt 4:** `CI=1 npx jest --silent src/lib/errors` → grün; `npm run lint && npx tsc --noEmit` → sauber.

### W2 — Server: Codes vergeben, Pruna-Feldname auspacken (TDD)

**Files:**
- Modify: `src/lib/api-error-handler.ts` (ApiError um `details?: Record<string, unknown>`
  erweitern; `handleApiError` gibt `details` mit aus; `validateRequest` wirft
  `ApiError(400, 'Invalid request data', 'VALIDATION_ERROR', { field: erstes Zod-Feld, issue: erste Issue-Message })`)
- Modify: `src/lib/pollinations-image-v1.ts` (401 → `POLLEN_KEY_REQUIRED`, 402 →
  `POLLEN_INSUFFICIENT`, sonst `undefined`)
- Modify: `src/app/api/generate/route.ts` — `:110` → Code `UNKNOWN_MODEL`; `:125` →
  `REFERENCE_NOT_SUPPORTED`; `:62` → Code `RATE_LIMITED`; `:243` (und `src/lib/pruna/client.ts:48/136/275`)
  → Message: `` `Model ${canonicalModelId} requires a Pruna key of your own. Connect one in settings.` ``
  (Code `MISSING_PRUNA_KEY` bleibt)
- Modify: `src/lib/pruna/client.ts` — bei `:89-96` den Feldnamen herausziehen:
  `/additional properties forbidden, found ([A-Za-z0-9_]+)/` gegen `errorText`; Treffer →
  `new ApiError(status, msg, 'PRUNA_API_ERROR', { field: match[1] })`
- Modify: `src/lib/generation/request-generation.ts:55` — Message auf den Zieltext aus der
  Fehlertabelle (`PRUNA_RUN_ABANDONED`-Satz; der Code selbst wird clientseitig nicht gebraucht,
  die Karte bekommt den Satz direkt)
- Test: `src/lib/pruna/client.test.ts` (existiert — erweitern),
  `src/app/api/generate/route.test.ts` (existiert? falls nicht: neu anlegen mit dem Muster der
  Nachbar-Route-Tests), Erweiterung `src/lib/errors/describe-error.test.ts` nicht nötig.

**Interfaces:** W3 konsumiert die Response-Form `{ error, code, details?, timestamp }`.

- [ ] **Schritt 1: Tests schreiben (rot).** In `client.test.ts`: der 400-Fall mit dem live
  belegten Body (`{"message":"property input validation failed: additional properties forbidden,
  found voellig_unbekanntes_feld"}`) muss einen `ApiError` mit `code: 'PRUNA_API_ERROR'` und
  `details.field === 'voellig_unbekanntes_feld'` werfen; ohne Treffer im Text bleibt `details`
  undefined. Route-Test: `{"prompt":""}` → 400 mit `code VALIDATION_ERROR` und
  `details.field === 'prompt'`; `{"model":"gibt-es-nicht"}` → 400 `UNKNOWN_MODEL`;
  `{"prompt":"x","model":"flux","image":"https://invalid.invalid/x.jpg"}` → 400
  `REFERENCE_NOT_SUPPORTED`.
- [ ] **Schritt 2:** `CI=1 npx jest --silent src/lib/pruna src/app/api` → rot.
- [ ] **Schritt 3: Implementierung** wie oben.
- [ ] **Schritt 4:** dieselben Tests grün; gesamte Suite grün; lint + tsc sauber.

### W3 — Client-Anzeige: Satz + Rohtext im Create (TDD)

**Files:**
- Modify: `src/app/create/PlaygroundShell.tsx` — `messageFrom()` (:66-74) ersetzen durch
  `readErrorResponse` + `describeError`: Anzeige-Satz = `describeError(code, ctx).satz`, bei
  `aktion: 'settings'` der Alert einen „Einstellungen öffnen“-Knopf bekommt (setzt
  `settingsOpen = true`); `describeUnknown(status, raw)` als Fallback; `ActiveRun` um
  `detail?: string` (Rohtext) und `aktion?` erweitern; `onEnhance`-Fehlerpfad ebenfalls über
  `readErrorResponse` führen.
- Modify: `src/components/playground/Gallery.tsx` — `FailedCard`: `line-clamp-3` entfernen,
  `run.detail` in einem aufklappbaren `<details>`-Element (Zusammenfassung „Technische Details“,
  Inhalt `font-mono text-[10px] whitespace-pre-wrap break-all`), Handlungs-Knopf wenn
  `run.aktion` gesetzt (`onAktion`-Prop von der Shell).
- Test: `src/app/create/PlaygroundShell.test.tsx` (existiert — erweitern).

**Interfaces:** konsumiert W1 + W2. `GalleryRun` bekommt `detail?: string` und
`aktion?: 'settings' | 'retry' | 'pick-model'`.

- [ ] **Schritt 1: Tests schreiben (rot).** (a) fetch mit 400
  `{error:'Model flux does not support reference images', code:'REFERENCE_NOT_SUPPORTED'}` mocken,
  Lauf starten → Karte zeigt den Übersetzungs-Satz aus W1 und NICHT den Rohtext als Haupttext;
  (b) derselbe Lauf: `<details>` enthält den Rohtext (F4); (c) Edge-Form: fetch mit 502 und
  Body `error code: 502` → Karte zeigt „…mit **502** geantwortet…“ (F4, `[object Object]`-Verbot);
  (d) langer Pruna-400-Text erscheint ungekürzt (kein `line-clamp`) und im Details-Element (F3);
  (e) `aktion: 'settings'` → Knopf vorhanden, Klick öffnet das Settings-Popover (F1).
- [ ] **Schritt 2:** Tests rot.
- [ ] **Schritt 3: Implementierung** wie oben. `/playground`-Importpfade existieren nicht mehr —
  alles unter `src/app/create/` bzw. `src/components/playground/` belassen.
- [ ] **Schritt 4:** Tests grün, Suite grün, lint + tsc sauber.

### W4 — Pollen-Lampe: drei Zustände (L-C.3) und Root Cause (TDD)

**Files:**
- Modify: `src/app/api/pollen/account/route.ts:29-34` — Upstream-Fehler **auspacken**:
  `{ error: data?.error?.message ?? (typeof data?.error === 'string' ? data.error : `Failed to fetch Pollinations account info (${response.status})`), upstreamCode: data?.error?.code }` — immer String.
- Modify: `src/hooks/usePollenKey.ts` — neuer Zustand `keyStatus: 'none' | 'confirmed' | 'unverifiable' | 'rejected'`
  plus `keyStatusReason?: string`: kein Key → `none`; 200 → `confirmed`; **403 → `unverifiable`**
  (Befund A: ein 403 sagt nichts über die Erzeugungsfähigkeit); 401 → `rejected`; Netzfehler →
  `unverifiable`; Grund = der ausgepackte Satz aus der Route. `isConnected` bleibt bestehen
  (`!!pollenKey`) — alle Leser (SettingsPopover, PlaygroundShell:81, useHasPollenKey) unverändert.
- Modify: `src/hooks/usePollenKey.ts:152` — `connectOAuth`: `permissions=profile,balance,usage`
  → `profile,balance,usage,account:usage` (Wurzel des Browser-Key-403; Portal akzeptiert den
  Parameter laut Probe vom 2026-08-29 mit HTTP 200). Verifikation V1 (echter OAuth-Rundlauf)
  bleibt Betreiberarbeit — falls das Portal die superset-Parameter ablehnt, ist der Einzeiler
  rückgängig zu machen.
- Modify: `src/components/settings/SettingsPopover.tsx:100-138` — Lampe dreistufig:
  `confirmed` → grün + „Verbunden, Kontostand geprüft“; `unverifiable` → gelb + „Verbunden —
  Kontostand nicht abrufbar“ + Grundzeile; `rejected` → rot + „Schlüssel wird abgelehnt. Neu
  verbinden.“; `none` → gelb + „Nicht verbunden“.
- Test: `src/hooks/usePollenKey.test.tsx` (existiert — erweitern).

- [ ] **Schritt 1: Tests schreiben (rot).** „403 ergibt nicht rejected“: fetch 403 mit
  Objekt-Body mocken → `keyStatus === 'unverifiable'`, `keyStatusReason` enthält den Satz;
  401 → `rejected`; 200 → `confirmed`; ohne Key → `none`. Routing-Test: Objekt-Error wird als
  String ausgepackt (Supertest-ähnlich über den Route-Export, Muster der Nachbar-Routetests).
- [ ] **Schritt 2:** rot. **Schritt 3:** Implementierung wie oben.
- [ ] **Schritt 4:** grün, Suite grün, lint + tsc sauber. F5-Kriterium: mit Schlüssel ohne
  `account:usage` steht die Lampe auf „nicht abrufbar“, nicht auf rot.

### W5 — Lauf überlebt Reload (L-C.2, Altlast 4) — TDD, Test zuerst

**Files:**
- Create: `src/lib/generation/run-store.ts` + `src/lib/generation/run-store.test.ts`
- Modify: `src/lib/generation/request-generation.ts` — Options um
  `onPending?: (info: { predictionId: string; model: string }) => void` erweitern (beim 202
  aufrufen); Poll-Loop in exportierte Funktion `pollPrediction(predictionId, model, { headers,
  signal })` herausziehen, `requestGeneration` nutzt sie intern (Signatur und Rückgabetyp
  bleiben — `chat-service.ts` unverändert).
- Modify: `src/app/create/PlaygroundShell.tsx` — `nextRunId()` kollisionsfrei machen
  (`` `run-${Date.now().toString(36)}-${++runCounter}` ``); bei `startRun` den
  `onPending`-Callback übergeben, der `storeRun({ runId: run.id, predictionId, model, body,
  prompt, params, modelId, isVideo, aspectRatio, startedAt: run.startedAt })` schreibt; bei
  Erfolg/Abbruch/Fehlschlag `removeStoredRun(run.id)`; beim Mount `loadStoredRuns()` → für
  jeden Eintrag eine laufende Karte mit dem **ursprünglichen** `startedAt` anlegen und statt des
  POST `pollPrediction` aufrufen; Einträge älter als 30 min beim Laden verwerfen. Retry-Knopf
  funktioniert für wiederaufgenommene Läufe, weil `body`/`params` mitgespeichert werden
  (R2-Entscheid (a) des Altplans übernommen).
- Test: `src/app/create/PlaygroundShell.test.tsx` (erweitern), `request-generation.test.ts` (erweitern).

**Interfaces:** `run-store.ts`:

```ts
export interface StoredRun {
  runId: string; predictionId: string; model: string;
  body: unknown; prompt: string; params: Record<string, string | number | boolean>;
  modelId: string; isVideo: boolean; aspectRatio?: string; startedAt: number;
}
export function loadStoredRuns(): StoredRun[];   // über safe-storage; >30 min verworfen
export function storeRun(run: StoredRun): void;  // wirft nie
export function removeStoredRun(runId: string): void;
```

- [ ] **Schritt 1: Der L-C.2-Test zuerst (rot).** „Reload verliert den Lauf“:
  (1) Shell rendern, fetch für `/api/generate` mit 202
  `{pending:true, predictionId:'abc123', model:'wan-t2v'}` mocken, Lauf senden → laufende Karte
  sichtbar, `localStorage` enthält den Eintrag; (2) **unmount**; (3) frisch mounten, fetch so
  mocken, dass `/api/pruna/status` 200 `{videoUrl:'https://media.pollinations.ai/x.mp4'}`
  liefert → die Karte ist **sofort** wieder sichtbar (aus dem Store, ursprüngliches `startedAt`)
  und das Ergebnis landet in der Galerie; Eintrag aus dem Store entfernt. Dazu
  `run-store.test.ts`: schreiben/lesen/löschen, 31-min-Eintrag wird verworfen, `storeRun` wirft
  auch dann nicht, wenn `safe-storage` sabotiert ist.
- [ ] **Schritt 2:** rot. **Schritt 3:** Implementierung wie oben.
- [ ] **Schritt 4:** grün, Suite grün, lint + tsc sauber. Pollinations-Läufe (keine
  predictionId) bleiben bewusst ungeschützt — sie dauern Sekunden (Altplan, „nicht Teil“).

### W6 — Verstrichene Zeit lesbar (L-C.4, Altlast 5-Rest)

**Files:**
- Create: `src/lib/playground/format-elapsed.ts` + `format-elapsed.test.ts`
- Modify: `src/components/playground/Gallery.tsx` — `RunningCard` (:67-104): `{secs} s` →
  `formatElapsed(secs)`; Erwartungsgröße: Map `VIDEO_EXPECTATION_SECONDS` (`wan-t2v: 45`,
  `wan-i2v: 90`, `vace: 600`, Default Video: 180, Bild: 30) mit Satz
  „Dauert typischerweise etwa <N> min.“ statt der pauschalen Zeile; ab 2× Erwartung zusätzlich
  „Dieser Lauf braucht ungewöhnlich lange — er kann noch laufen oder fehlgeschlagen sein.“
  Kein Balken (Pruna liefert keinen Prozentwert).

- [ ] **Schritt 1: Test (rot).** `formatElapsed(45) === '45 s'`; `formatElapsed(60) === '1:00'`;
  `formatElapsed(700) === '11:40'`.
- [ ] **Schritt 2:** rot. **Schritt 3:** Implementierung.
- [ ] **Schritt 4:** grün, Suite grün, lint + tsc sauber. F7: Anzeige zählt sichtbar hoch und
  ist nach 60 s als `m:ss` lesbar.

### W7 — L-K.2: dauerhafte Pruna-Zeile + einmalige Bestätigung (Form E2)

**Files:**
- Modify: `src/components/playground/PromptBar.tsx` — neue Props
  `prunaNotice?: string` (dauerhafte Zeile, immer sichtbar wenn gesetzt, über der Statuszeile,
  Farbe `text-foreground/80` für Sichtbarkeit auf dem Telefon) und
  `keyNotice?: string` (W8) — beide Zeilen stapelbar; es bleibt beim bestehenden
  Vorrang `queueFullHint > status`.
- Modify: `src/app/create/PlaygroundShell.tsx` —
  `prunaNotice = currentModel?.provider === 'pruna' ? 'Pruna-Läufe sind nicht abbrechbar: Abbrechen verlässt nur diese Ansicht, der Lauf läuft beim Anbieter weiter und wird berechnet.' : undefined`;
  `onSend`: bei Pruna-Modell und `!readLocal('prunaRunConfirmSeen')` statt zu senden einen
  Bestätigungsdialog öffnen (bestehendes `ModalPopup`-Muster wie in `SettingsPopover`):
  Titel „Erster Pruna-Lauf“, Text = die Pruna-Zeile + „Der Lauf startet jetzt und kann nicht
  gestoppt werden.“, Knöpfe „Lauf starten“ (setzt `prunaRunConfirmSeen` über `writeLocal`,
  schließt, sendet dann) und „Abbrechen“.
- Test: `src/app/create/PlaygroundShell.test.tsx` + PromptBar-Renderingtest (neu:
  `src/components/playground/PromptBar.test.tsx`).

- [ ] **Schritt 1: Tests (rot).** Pruna-Modell gewählt → die Zeile steht ohne weiteres Zutun
  (Prüfweg L-K.2 Teil 1); erster Send → Dialog sichtbar, **kein** fetch; „Lauf starten“ →
  Flag gesetzt, fetch erfolgt; zweiter Send → kein Dialog (Teil 2).
- [ ] **Schritt 2:** rot. **Schritt 3:** Implementierung.
- [ ] **Schritt 4:** grün, Suite grün, lint + tsc sauber.

### W8 — L-I.3: Schlüsselpflicht vor dem Absenden

**Files:**
- Modify: `src/app/create/PlaygroundShell.tsx` —
  `keyNotice`: gesetzt, wenn `currentModel?.paidOnly` und der zugehörige Schlüssel fehlt
  (Provider `pollinations` ohne `pollenKey` / Provider `pruna` ohne `readLocal('prunaApiKey')`):
  „**<Modellname>** braucht einen <Pollen|Pruna>-Schlüssel — in den Einstellungen hinterlegen.“;
  Senden-Knopf gesperrt, solange `keyNotice` gesetzt ist (`canSend` um diesen Fall erweitern;
  Grund steht sichtbar in der Zeile, nicht nur im `title`).
- Modify: `src/components/playground/PromptBar.tsx` — `canSend`-Logik um `keyNotice` erweitern.
- Test: `PromptBar.test.tsx` + `PlaygroundShell.test.tsx`.

- [ ] **Schritt 1: Tests (rot).** Pruna-Videomodell (z. B. `wan-t2v`, `paidOnly`) ohne
  Pruna-Key gewählt → Zeile sichtbar, Senden disabled; mit Key → Zeile weg, Senden enabled.
  Pollinations-Vergleichsfall (`paidOnly` ohne Pollen-Key) analog.
- [ ] **Schritt 2:** rot. **Schritt 3:** Implementierung.
- [ ] **Schritt 4:** grün, Suite grün, lint + tsc sauber. L-I.3 damit erfüllt: die
  Schlüsselpflicht ist vor dem Absenden erkennbar (alle aktiven Videomodelle sind Pruna —
  der Fall ist durch die Pruna-Prüfung abgedeckt; der Pollinations-Zweig deckt L-I.2 vor).

### W9 — Infrastruktur und Wahrheitsdokumente (Altlast 6/7 + Plan-Verweise)

**Files:**
- Modify: `vercel.json` — `{}` →
  `{ "functions": { "src/app/api/**": { "maxDuration": 300 } } }` (Bewusst nicht höher; R4:
  bei `vercel.json` bleiben, kein `vercel.ts`). Verifikation: `npm run build` grün; die
  Deploy-Wirksamkeit ist erst nach dem Push am Deployment prüfbar — im Handoff benennen.
- Modify: `CLAUDE.md` — (a) den Satz „A reload still loses the run; the `predictionId` lives
  only in memory.“ durch die Wiederaufnahme-Beschreibung ersetzen; (b) den Hinweis „to exercise
  validation without paying, send an unreachable media URL (`https://invalid.invalid/x.jpg`)“
  **korrigieren**: seit den Payload-Fixes startet dieser Payload einen echten Lauf —
  kostenfrei ist nur der Validierungsfehler mit einem unbekannten Feld; (c) kurzer Abschnitt
  zur Fehlerkonvention (`src/lib/errors/`, Codes, Rohtext bleibt sichtbar).
- Modify: `docs/PLAN-phase-4-fehlerklarheit.md` — unter dem Kopfstand-Vermerk eine Zeile
  „Abgelöst durch [`PLAN-phase-4-fehlerklarheit-2026-08-29.md`](PLAN-phase-4-fehlerklarheit-2026-08-29.md) (auditiert und live geprüft).“
- Modify: `docs/README.md` — eine Zeile für den neuen Plan im Plan-Abschnitt.
- Falls der Betreiber das Async-Protokoll zurückstellt: die Zurückstellung mit Begründung
  (E1-A, kein angebotenes Modell betroffen) in `CLAUDE.md` beim `nova-reel`-Absatz vermerken.

- [ ] **Schritt 1:** Änderungen ausführen. **Schritt 2:** `npm run build` grün;
  `npm run lint && npx tsc --noEmit` sauber; grep-Gegenproben: `grep -c "invalid.invalid"
  CLAUDE.md` → 1 (nur noch mit Warnung), `grep -n "loses the run" CLAUDE.md` → 0.

### W10 — Verifikation und Statusquelle

- [ ] **Vollgerüst:** `npm run lint` · `npx tsc --noEmit` · `CI=1 npx jest --silent` (≥ 109
  Suiten / ≥ 852 Tests, alles grün) · `npm run build`.
- [ ] **Live-Routen gegen den lokalen Dev-Server** (alle kostenfrei; nach dem Umbau prüfen sie
  die **Antwortform**, nicht die Anzeige — die Anzeige ist in W3 jest-seitig geprüft):
  `{"prompt":"","model":"flux"}` → 400 + `VALIDATION_ERROR` + `details.field` ·
  `{"model":"gibt-es-nicht"}` → 400 + `UNKNOWN_MODEL` ·
  `{"model":"flux","image":"https://invalid.invalid/x.jpg"}` → 400 + `REFERENCE_NOT_SUPPORTED`
  · `GET /api/pollen/account` → 403 mit **String**-Error · dto. mit Müll-Key → 401 String ·
  Upload multipart/SVG → 415 (unverändert) ·
  `{"model":"wan-t2v","params":{"unbekannt_feld":1}}` → 400 + `PRUNA_API_ERROR` +
  `details.field === 'unbekannt_feld'` (kein Lauf).
- [ ] **`docs/LAUNCH_CRITERIA.md`** (Statusquelle): L-C.1–L-C.4, L-K.2, L-I.3 →
  `Status: erledigt (2026-08-29, Phase 4)`; L-K.3 → `Status: erledigt (2026-08-29, Audit-Patch W7)` —
  vorher verifizieren, dass `Gallery.tsx` den Knopf „Nicht mehr warten“ trägt (grep) und die
  W7-Zeile aus W7/W8 den Grund sichtbar macht.
- [ ] **`docs/FAHRPLAN-create.md`** Phase 4: Überschrift um „✅ ERLEDIGT am 2026-08-29“
  ergänzen (Muster Phase 0–3) — nur nach grüner Vollverifikation.

### W11 — Querlesen gegen alle vorherigen Pakete (NICHT delegierbar)

Läuft nach W10, vor dem Handoff. Prüft genau die Klasse, die in der letzten Sitzung drei
Fehler zwischen den Paketen verursachte:

- [ ] **Dokumente, die mehrere Pakete anfassen:** `CLAUDE.md` (W9; gegen den gebauten Code
  lesen — stimmt jede Beschreibung mit dem Verhalten?), `LAUNCH_CRITERIA.md` (W10; jede der
  sieben Statuszeilen gegen den tatsächlichen Prüfweg im gebauten Stand nachspielen oder
  mindestens gegen den jest-Beweis stellen), `FAHRPLAN-create.md` (W10; Fertig-Kriterium der
  Phase 4 Wort für Wort gegen die Kriterienliste abgleichen), `PlaygroundShell.tsx` /
  `PromptBar.tsx` / `Gallery.tsx` (W3, W5, W6, W7, W8 haben alle dieselben Dateien berührt —
  das Zusammenspiel lesen: funktioniert der Pruna-Dialog, wenn gleichzeitig `keyNotice` und
  `prunaNotice` gesetzt sind? Verdrängt `queueFullHint` die neuen Zeilen korrekt?).
- [ ] **Verschobene Kriterien ohne Querverweis:** L-K.3-Rest (Tooltip-Sichtbarkeit → bleibt
  Phase 6 zugeordnet? In LAUNCH_CRITERIA vermerkt?), Async-Protokoll-Entscheid (wo immer der
  Betreiber entschieden hat — steht die Entscheidung im vereinbarten Dokument?), L-B.4 /
  L-A.1 / L-A.5 (Betreiberreste aus Phase 2/3 — unberührt lassen, aber im Handoff wiederholen).
- [ ] **Abschluss:** die vier Befehle aus W10 ein letztes Mal; danach erst der Handoff
  (`docs/HANDOFF-<datum>-phase-4.md`) **nach** Commit und Push.

---

## Nicht Teil dieser Phase

| Ausgeschlossen | Warum |
|---|---|
| Modell-Listen korrigieren | Phase 3, erledigt. |
| Async-Protokoll für Pollinations-Videos | Entscheidung des Betreibers steht aus (W12 oder W9-Vermerk). Seit E1-A benötigt kein angebotetes Modell es. |
| Chat-Visualize-Meldungen (`useUnifiedImageToolState`, englische Toasts) | Phase 7. |
| Medien-Intent-Meldungen im Chat (`ChatProvider`) | Phase 8 (`acestep`-Bereinigung). |
| Löschen in der Galerie, gemeinsamer Pool | Phase 5. |
| Abbrechen bei Pruna (echtes Storno) | Kein Cancel-Endpunkt. Benannt durch W7, nicht lösbar. |
| Fortschritt in Prozent | Pruna liefert keinen. |
| Maskierung generischer `Error` in `handleApiError` aufheben | Absicht (kein Stack nach außen). |
| `predictionId` für Pollinations-Läufe | Existiert nicht; Läufe dauern Sekunden. |
| Präfix-Check für Pollen-Keys (Altlast 2) | Erledigt-durch-Ersatz: der dritte Lampenzustand fragt das echte Gate (RC4 Altplan). |
| BYOP-Keys aus dem Web-Storage holen | Akzeptiertes Risiko (L-L.1). |
