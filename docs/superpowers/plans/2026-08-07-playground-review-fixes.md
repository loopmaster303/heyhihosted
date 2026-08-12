# Fix-Plan — Playground Broad-Review (Tasks 1–21)

**Scope:** 2 Kritisch + 3 Wichtig aus dem Broad-Review vom 2026-08-07. Minor bleiben deferred.

**Worktree:** `/Users/johnmeckel/heyhihosted-playground`
**Arbeits-Branch:** `playground/multimedia-review-fixes` (Sub-Branch, siehe Prolog).
**Ziel-Branch für Merge-Back:** `playground/multimedia`.

## Prolog — Isolations-Branch anlegen

**Warum:** Ein externer Claude-Agent committet parallel auf `playground/multimedia`. Fix-Commits müssen isoliert bleiben, damit sie am Ende als atomarer Merge-Commit erkennbar sind und keine fremden Änderungen mit-committed werden.

**Vor dem ersten Worker-Dispatch (Orchestrator führt selbst aus):**

```bash
cd /Users/johnmeckel/heyhihosted-playground
git status   # muss clean sein — sonst STOPP, User escalieren
git fetch    # nur zur Sicherheit, kein Pull
git checkout -b playground/multimedia-review-fixes
```

Wenn `git status` nicht clean ist (externer Agent hat unfertige Änderungen liegen): **STOPP**, User escalieren, nicht stashen, nicht wegwerfen.

Alle Fix-Worker arbeiten auf `playground/multimedia-review-fixes`. `git rev-parse HEAD` merken als `SUBBRANCH_BASE` für das spätere Ledger.

## Orchestrator-Regeln

- Ein Worker pro Fix, Sonnet-5 (`model: "sonnet"` explizit).
- Nur der einzelne Fix-Abschnitt an den Worker — kein Broad-Review-Report, kein Plan, kein Spec.
- Worker MUSS auf `playground/multimedia-review-fixes` committen (Prolog-Branch). Falls Worker aus Versehen auf `playground/multimedia` committet: sofort `git cherry-pick` auf den Sub-Branch, dann auf `playground/multimedia` per `git reset --hard HEAD~1` zurückrollen — und **nur** wenn dazwischen kein Fremd-Commit reingekommen ist. Sonst User escalieren.
- **Fix 1 (K1) ist bereits erledigt** (Commit `46aba0c` auf `playground/multimedia`). Section 1 überspringen — Worker startet mit Fix 2.
- Fix 2 (K2) 1 Datei + 1 neuer Test. Fix 3–5 je 1 Datei. Reihenfolge egal, keine Cross-Dependencies.
- Task-Reviewer nach jedem Fix: Sonnet-5, prüft NUR das eine Finding + `npm run lint` + betroffene Tests.
- Max 5 Fix-Rounds pro Task, dann adjudicate.

---

## Fix 1 (Kritisch) — `guidance` + `steps` end-to-end

**Problem:** AdvancedPanel exposed `guidance` und `steps`, `PlaygroundState` hält sie, aber `buildGenerateBody` mappt sie nicht, und `/api/generate` Zod-Schema kennt sie nicht.

### Datei A: `src/lib/playground/generate-request.ts`

Interface + Builder erweitern.

**Interface (Zeile 4–15):** hinzufügen:
```ts
guidance?: number;
steps?: number;
```

**Builder (Zeile 17–29):** nach dem `negative_prompt`-Block einfügen:
```ts
const guidanceNum = state.guidance.trim() ? Number(state.guidance.trim()) : NaN;
if (Number.isFinite(guidanceNum)) body.guidance = guidanceNum;
const stepsNum = state.steps.trim() ? parseInt(state.steps.trim(), 10) : NaN;
if (Number.isInteger(stepsNum) && stepsNum > 0) body.steps = stepsNum;
```

### Datei B: `src/lib/playground/generate-request.test.ts`

Neuer Test-Block:
```ts
it('parses guidance and steps as numbers and drops when empty', () => {
  const withVals = buildGenerateBody({ ...baseState, guidance: '7.5', steps: '30' }, modelPollen);
  expect(withVals.guidance).toBe(7.5);
  expect(withVals.steps).toBe(30);
  const empty = buildGenerateBody(baseState, modelPollen);
  expect(empty.guidance).toBeUndefined();
  expect(empty.steps).toBeUndefined();
});
```

### Datei C: `src/app/api/generate/route.ts`

Zod-Schema (Zeile 24–41) erweitern — nach `negative_prompt`:
```ts
guidance: z.number().optional(),
steps: z.number().int().positive().optional(),
```

Dann die Destructuring-Zeile (~Zeile 52 ff.) um `guidance, steps` erweitern und in die zwei Weitergabe-Stellen (~Zeile 127, ~Zeile 221) an das Pollinations- bzw. Pruna-Options-Objekt hängen. Grep-Verifikation: `grep -n 'guidance\|steps' src/app/api/generate/route.ts` — muss ≥6 Treffer haben.

### Verifikation

```bash
CI=1 npm test -- --runInBand src/lib/playground/generate-request.test.ts src/app/api/generate/
npm run lint
```

Beides grün. Kein Snapshot-Update ohne User-Rückfrage.

---

## Fix 2 (Kritisch) — Sentinel-Filter im Main-Gallery-Hook

**Problem:** `useGalleryAssets` liefert alle Assets inkl. Playground-Sentinel — kontaminiert Sidebar-Gallery, Vault, GallerySidebarSection.

**Datei:** `src/hooks/useGalleryAssets.ts`

**Aktuelle Query (Zeile 12–24):**
```ts
const all = await db.assets
  .orderBy('timestamp')
  .reverse()
  .limit(50)
  .toArray();
```

**Gewünscht:**
```ts
import { PLAYGROUND_CONVERSATION_ID } from '@/lib/playground/constants';
// …
const all = await db.assets
  .orderBy('timestamp')
  .reverse()
  .filter((a) => a.conversationId !== PLAYGROUND_CONVERSATION_ID)
  .limit(50)
  .toArray();
```

`.filter()` läuft in JS nach dem Index-Scan — akzeptabel bei `limit(50)`. Kein Composite-Index nötig, keine Dexie-Migration.

**Test (neu):** `src/hooks/useGalleryAssets.test.ts` (falls nicht existent):
```ts
import { renderHook, waitFor } from '@testing-library/react';
import { useGalleryAssets } from './useGalleryAssets';
import { db } from '@/lib/services/database';

beforeEach(async () => { await db.assets.clear(); });

it('excludes playground-sentinel assets from main gallery', async () => {
  await db.assets.bulkAdd([
    { id: 'a', remoteUrl: 'x', prompt: '', modelId: 'flux', conversationId: 'chat-1', timestamp: 1, contentType: 'image/png' } as any,
    { id: 'b', remoteUrl: 'y', prompt: '', modelId: 'flux', conversationId: '__playground__', timestamp: 2, contentType: 'image/png' } as any,
  ]);
  const { result } = renderHook(() => useGalleryAssets());
  await waitFor(() => expect(result.current.assets).toHaveLength(1));
  expect(result.current.assets[0].id).toBe('a');
});
```

Wenn Dexie in Jest ohne Mock nicht läuft (fake-indexeddb prüfen): stattdessen die Filter-Logik pure-function extrahieren und die pure function testen. Worker entscheidet basierend auf existing test-setup — grep `fake-indexeddb` in `jest.setup.ts` / `package.json` zeigt das an.

### Verifikation

```bash
CI=1 npm test -- --runInBand src/hooks/useGalleryAssets
CI=1 npm test -- --runInBand src/components/gallery/ src/app/gallery/
npm run lint
```

Bestehende Gallery-Tests dürfen nicht brechen. Wenn ein Bestandstest ein Fixture mit `conversationId: '__playground__'` erwartet und Präsenz assertet → das Fixture in ein neutrales `conversationId: 'chat-1'` umbenennen (Test war falsch).

---

## Fix 3 (Wichtig) — useEffect-Deps im Reset-Effect

**Problem:** `PlaygroundShell.tsx:47–57` liest `state.aspectRatio`, `state.durationSeconds`, `state.uploads`, `resetForModel` — Dep-Array nur `[currentModel?.id]`. Stale-Read bei sequentiellen Model-Wechseln möglich.

**Datei:** `src/app/playground/PlaygroundShell.tsx`

**Ansatz:** State via Ref immer aktuell halten, damit der Effect beim Modell-Wechsel die neusten Werte liest, aber NICHT bei State-Änderungen re-fires.

Am Anfang der Component (nach Zeile 32) einfügen:
```ts
import { useRef } from 'react';
// …
const stateRef = useRef(state);
useEffect(() => { stateRef.current = state; }, [state]);
```
(`useRef`-Import zum bestehenden react-Import mergen, nicht duplizieren.)

**Effect (Zeile 47–57)** ersetzen mit:
```ts
useEffect(() => {
  if (!currentModel) return;
  const presetKeys = Object.keys(getAspectRatioPresetsForModel(currentModel.id));
  const defaultRatio = presetKeys[0] ?? null;
  const defaultDuration = getDefaultDurationSeconds(getUnifiedModel(currentModel.id)) ?? null;
  const prev = stateRef.current;
  resetForModel({
    aspectRatio: prev.aspectRatio && presetKeys.includes(prev.aspectRatio) ? prev.aspectRatio : defaultRatio,
    durationSeconds: prev.durationSeconds ?? defaultDuration,
    uploads: prev.uploads.slice(0, currentModel.maxImages),
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentModel?.id]);
```

Der `eslint-disable`-Kommentar bleibt drin — Absicht ist bewusst: nur bei Modell-Wechsel feuern, nie bei State-Change. Ref-Zugriff garantiert Fresh-Read.

### Verifikation

```bash
npm run lint
CI=1 npm test -- --runInBand src/app/playground/ src/hooks/usePlaygroundState.test.ts
```

Kein Lint-Error (Disable-Kommentar deckt exhaustive-deps ab). Bestehende Tests bleiben grün.

---

## Fix 4 (Wichtig) — Media-URL-Guard in `onGenerate`

**Problem:** `PlaygroundShell.tsx:88` → `mediaUrl = data.videoUrl ?? data.imageUrl`. Wenn API keins von beidem sendet, wird `undefined` an `OutputService.saveGeneratedAsset({url: undefined})` und `setHeroMedia({url: undefined, ...})` weitergegeben.

**Datei:** `src/app/playground/PlaygroundShell.tsx` Zeilen 86–89.

**Aktuell:**
```ts
if (ct.startsWith('application/json')) {
  const data = await res.json();
  mediaUrl = data.videoUrl ?? data.imageUrl;
  kind = data.videoUrl ? 'video' : 'image';
}
```

**Gewünscht:**
```ts
if (ct.startsWith('application/json')) {
  const data = await res.json();
  const candidate = data.videoUrl ?? data.imageUrl;
  if (typeof candidate !== 'string' || !candidate) {
    throw new Error('generate response missing videoUrl/imageUrl');
  }
  mediaUrl = candidate;
  kind = data.videoUrl ? 'video' : 'image';
}
```

Der `throw` fällt in den bestehenden `catch` (Zeile 105 ff.) → `heroError` wird gesetzt, `heroState` auf `'error'` — sichtbar für User.

### Verifikation

```bash
npm run lint
CI=1 npm test -- --runInBand src/app/playground/
```

Kein bestehender Test sollte Response ohne `imageUrl`/`videoUrl` mocken — wenn doch: der Test war schwach und deckt jetzt korrekt den Error-Pfad ab. Test-Update im gleichen Commit.

---

## Fix 5 (Wichtig) — PlaygroundShell Smoke-Test

**Problem:** Keine Test-Coverage für `PlaygroundShell.tsx` — die einzige Wire-Datei. Task 22 macht später einen E2E-Pass, aber ein Unit/Integration-Smoke-Test darunter schützt gegen Regression bei jedem Refactor davor.

**Datei:** `src/app/playground/PlaygroundShell.test.tsx` (neu)

**Scope:** Nur Render + Smoke — kein voller Generate-Flow, das ist Task 22.

Test-Suite:
1. Rendert ohne Crash bei leerem Model-List (loading state).
2. Rendert alle Kern-Komponenten (`ProviderSwitch`, `ApiKeyField`, `ModeSwitch`, `ModelSelect`, `PromptPanel`, `Hero`, `Gallery`, `MobileBar`) — `screen.getByRole`/`getByLabelText`-basiert, keine DOM-Snapshots.
3. `GenerateButton` ist disabled solange Prompt leer.
4. Nach `userEvent.type` in PromptPanel: `GenerateButton` wird enabled (bei geladenem Modell).

**Mocks:**
- `usePlaygroundModels` → `{ entries: [ /* 1 dummy pollen model */ ], loading: false, fallbackActive: false }`
- `usePollenKey` → `{ pollenKey: null, connectManual: jest.fn(), disconnect: jest.fn() }`
- `useProviderMode` → `{ providerMode: 'pollinations', setProviderMode: jest.fn(), prunaAvailable: true }`
- `OutputService`, `BlobManager`, `fetch` — nicht relevant für Smoke, nicht mocken (Generate-Klick wird nicht getestet).

Kein globaler Mock von `usePlaygroundState` — der Hook soll real laufen, sonst testet der Test nichts.

### Verifikation

```bash
CI=1 npm test -- --runInBand src/app/playground/PlaygroundShell.test.tsx
npm run lint
```

Alle 4 Test-Cases grün.

---

## Nach allen 4 offenen Fixes (K1 überspringen)

Vollverifikation auf `playground/multimedia-review-fixes`:

```bash
cd /Users/johnmeckel/heyhihosted-playground
git branch --show-current   # muss playground/multimedia-review-fixes sein
npm run lint
CI=1 npm test -- --runInBand src/app/playground/ src/components/playground/ src/hooks/useGalleryAssets src/hooks/usePlaygroundState.test.ts src/hooks/usePlaygroundModels.test.ts src/lib/playground/ src/app/api/generate/
```

Beides grün → **Epilog: Merge-Back auf `playground/multimedia`.**

## Epilog — Merge-Back

**Voraussetzung:** externer Claude-Agent hat pausiert (User bestätigt explizit). Ohne diese Bestätigung: STOPP, warten.

```bash
cd /Users/johnmeckel/heyhihosted-playground
git log --oneline playground/multimedia..playground/multimedia-review-fixes   # muss die neuen Fix-Commits zeigen
git checkout playground/multimedia
git pull   # nur falls externer Agent Commits gepusht hat (rebase-frei, merge nur wenn nötig)
git merge --no-ff playground/multimedia-review-fixes -m "merge(playground): broad-review fixes K2/W1/W2/W5"
npm run lint && CI=1 npm test -- --runInBand src/
```

Konflikt wahrscheinlich? Nein — Fix 2 touchesnur `src/hooks/useGalleryAssets.ts` (kaum aktiv), Fix 3/4 nur `src/app/playground/PlaygroundShell.tsx` (Wire-Datei — der externe Agent arbeitet vermutlich woanders). Fix 5 ist eine neue Datei (`PlaygroundShell.test.tsx`). Wenn Konflikt: **auflösen**, nicht `--abort`.

Merge grün → Sub-Branch löschen:

```bash
git branch -d playground/multimedia-review-fixes
```

Dann Ledger-Eintrag in `.superpowers/sdd/2026-08-07-multimedia-playground/progress.md`:

```
Broad-review fixes (Tasks 1-21 review, 2026-08-07): complete
- K1: guidance/steps end-to-end — pre-existing in 46aba0c on playground/multimedia
- K2 + W1 + W2 + W5: sub-branch playground/multimedia-review-fixes, merged --no-ff as MERGE_SHA7
  - K2: useGalleryAssets excludes __playground__ sentinel
  - W1: reset-effect reads state via ref (no stale-read)
  - W2: onGenerate guards against missing videoUrl/imageUrl
  - W5: PlaygroundShell smoke-test
Deferred minors: M1 --surface-container-highest, M2 dead sourceVideo, M3 silent onEnhance error, M4 stale heroError on gallery pick, M5 dead srcRefImages type field
```

Dann bereit für Task 22 (Sidebar-Link + Translations + E2E) und Final-Broad-Review.

## Was NICHT zu tun ist

- Keine Refaktorierung von `usePlaygroundState`. `resetForModel` bleibt (defaults) → patch(defaults). Fix 3 löst das via Ref, nicht via API-Change.
- Kein Fix für M1–M5 — die kommen in den Final-Review vor Merge nach `main`.
- Keine neuen Utility-Layer, keine "während-wir-dabei-sind"-Cleanups. Fünf Fixes, fünf Commits (oder ein Commit pro Fix — Worker entscheidet nach SDD-Konvention).
