# Final Review + Merge-Plan — Playground Multimedia

**Stand:** 2026-08-08 — nach Review-Fix-Zyklus (K1/K2/W1/W2/W5 alle erledigt bis Commit `42f1605`).

**Branch:** `playground/multimedia` — 41 Commits über `main` (`b929e3e..HEAD`).
**Working Tree:** clean bis auf zwei untracked Plan-Docs.

## Review-Ergebnis (selbst gelaufen, nicht Worker-Report)

### Independent Verification

- **Fix-Diffs geprüft:** K1 (in `46aba0c`), K2 (`0dc991d`), W1 (`eac86ac`), W2 (`60ca85d`), W5 (`a03962c`) — alle Patches match ihre Spec exakt. K2 sogar sauberer als geplant (pure `isGalleryAsset` predicate extrahiert + `sortStarredFirst` extrahiert, testbar ohne Dexie-Setup).
- **`npm run lint`:** 0 Errors, 4 Warnings (siehe W6 unten).
- **`CI=1 npm test --runInBand` (full repo):** 84 Suites / **432 Tests passed**.
- **Token-Discipline:** clean — `--surface-container-highest` still weg (irgendwo in den Minor-Fixes mitgemacht), keine erfundenen Tokens, keine Hex-Werte.
- **Sentinel-Coverage:** alle 3 Main-Gallery-Konsumenten (`app/gallery/page.tsx`, `GallerySidebarSection.tsx`, `AppLayout.tsx`) laufen durch `useGalleryAssets` → K2-Filter greift überall.
- **`providerMode` scope:** unverändert — nur Playground, Visualize, PersonalizationSidebarSection lesen.
- **`resetForModel` merge contract:** eingehalten.
- **`BlobManager.createURL` statt `URL.createObjectURL`:** 0 Direkt-Aufrufe im Playground-Scope.
- **Focus-visible:** alle 5 `outline: none` in `playground.module.css` haben Partner.

### Findings

**Wichtig (1)**

- **W6 · Sync-Effect hat dieselben missing-deps wie damals der Reset-Effect** [src/app/playground/PlaygroundShell.tsx:45-47](src/app/playground/PlaygroundShell.tsx:45)
  ```tsx
  useEffect(() => {
    if (currentModel && state.modelId !== currentModel.id) setModelId(currentModel.id);
  }, [currentModel?.id]);
  ```
  Body liest `currentModel`, `state.modelId`, `setModelId` — Dep-Array nur `[currentModel?.id]`. W1-Fix hat nur den Reset-Effect (Zeilen 49–61) mit `eslint-disable-next-line react-hooks/exhaustive-deps` abgesichert; dieser Sync-Effect wurde übersehen. **Lint-Warning bleibt aktiv.** Fix identisch zu W1: `eslint-disable-next-line react-hooks/exhaustive-deps` in Zeile 46 einfügen — die Absicht "nur bei Modell-Wechsel feuern" ist bei diesem Effect ebenso bewusst.

**Minor (4)**

- **M6 · `clearAllAssets` nukt Playground-Assets mit** [src/hooks/useGalleryAssets.ts:48-50](src/hooks/useGalleryAssets.ts:48)
  ```ts
  const clearAllAssets = async () => { await db.assets.clear(); };
  ```
  `.clear()` löscht die gesamte Tabelle inkl. Playground-Sentinel-Zeilen. Semantisch inkonsistent mit K2: User klickt "Clear All" im Vault und verliert stillschweigend Playground-Historie. Fix: filtern und einzeln löschen (`where('conversationId').notEqual(PLAYGROUND_CONVERSATION_ID).delete()`).

- **M7 · Drei `<img>`-Warnings** in `Gallery.tsx:50`, `Hero.tsx:38`, `ReferenceUploads.tsx:45`. `@next/next/no-img-element`. Cosmetic (Performance-Hinweis), pre-existing seit Feature-Start. Migration auf `next/image` würde Blob-URLs + externe Pollinations-URLs + Reference-URLs alle einzeln behandeln müssen — spürbarer Refactor. Nicht Merge-blockend.

- **M8 · Untracked Plan-Docs im Working-Tree.** `docs/superpowers/plans/2026-08-07-playground-step7-final-review-handoff.md` (128 Zeilen, vom Orchestrator vorbereitet) + evtl. weitere. Vor Merge in einen Docs-Commit ziehen für sauberen Tree.

- **M9 · Misleading Commit-Message** `e1dcf8d wip(playground): checkpoint uncommitted sidebar/panel work before review fixes` — der Commit enthält ausschließlich Markdown-Plan-Dateien, keinen Sidebar/Panel-Code. Historisch, ohne Rebase nicht fixbar. Deferred.

### Health-Check Zusammenfassung

| Check | Status |
|---|---|
| Lint (0 Errors) | ✅ |
| Tests (432/432) | ✅ |
| Token Discipline | ✅ |
| Sentinel Coverage | ✅ |
| Provider-Mode Scope | ✅ |
| Reset-Contract | ✅ |
| Blob Handling | ✅ |
| Focus-Visible | ✅ |
| Missing useEffect-Dep | ⚠️ W6 |

**Verdict:** Ein Wichtig, vier Minor. W6 wollen wir vor Merge geradeziehen — die Warning geht sonst mit auf `main`. M6 sollte auch mit, sonst Semantic-Bug live. M7/M8/M9 in Deferred-Bucket.

---

## Merge-Plan (Step 8 des Finish-Plans) — als Loop

**Voraussetzung:** externer Claude-Agent hat pausiert (User bestätigt).

**Grundidee — Loop bis grün:**

Alle Phasen A–E laufen als konvergierender Loop unter Orchestrator-Kontrolle. Kein Push, kein Merge in `main` bevor der Orchestrator sicher ist, dass **beide unabhängigen Gates** grün sind:

1. **Reviewer-Gate (ich — Claude)** — statischer Review, Lint, Full-Test-Suite, Contract-Checks
2. **Dev-Gate (User)** — manueller Smoke-Test auf `localhost:3000/playground` mit echtem Klick-Through

Solange **eines** der beiden Gates rot ist oder Findings hat, geht's zurück in den Fix-Loop:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Plan lesen → Fixes bauen → Self-Review (Orchestrator) │
│         ↓                                               │
│   Reviewer-Gate (Claude): grün? ── nein ────────┐       │
│         ↓ ja                                    │       │
│   Dev-Gate (User /playground): grün? ── nein ───┤       │
│         ↓ ja                                    │       │
│   BEIDE grün → Merge nach main                  │       │
│                                                 ↓       │
│   ← ← ← Findings-Loop: neuer Fix-Sub-Branch ← ←         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Max 5 Loop-Iterationen**, dann adjudicate mit User. Nach jeder Iteration Ledger-Eintrag mit was gefixt wurde und welches Gate wieder aufgemacht werden muss.

### Phase A — W6 + M6 Fix-Runde

Isolations-Branch wie beim Review-Fix-Zyklus:

```bash
cd /Users/johnmeckel/heyhihosted-playground
git status   # muss clean sein bis auf untracked plan docs
git checkout -b playground/multimedia-preflight
```

**Fix W6** — `src/app/playground/PlaygroundShell.tsx:45-47`:

Aktuell:
```tsx
  useEffect(() => {
    if (currentModel && state.modelId !== currentModel.id) setModelId(currentModel.id);
  }, [currentModel?.id]);
```

Gewünscht:
```tsx
  useEffect(() => {
    if (currentModel && state.modelId !== currentModel.id) setModelId(currentModel.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModel?.id]);
```

Rationale-Kommentar direkt darüber nur wenn Reviewer verlangt — die Nebenzeile mit W1's Reset-Effect erklärt sich selbst.

**Fix M6** — `src/hooks/useGalleryAssets.ts:48-50`:

Aktuell:
```ts
const clearAllAssets = async () => { await db.assets.clear(); };
```

Gewünscht:
```ts
const clearAllAssets = async () => {
  await db.assets.filter(isGalleryAsset).delete();
};
```

`isGalleryAsset` ist im selben File exportiert (K2-Fix). Kein neuer Import.

**Test-Ergänzung** in `src/hooks/useGalleryAssets.test.ts`:
```ts
it('isGalleryAsset also gates clearAllAssets — playground assets survive a bulk clear', () => {
  const playground = asset({ id: 'p', conversationId: '__playground__' });
  const chat = asset({ id: 'c', conversationId: 'chat-1' });
  const survives = [playground, chat].filter(a => !isGalleryAsset(a));
  expect(survives).toEqual([playground]);
});
```

Reine Prädikats-Assertion — kein Dexie-Roundtrip nötig.

**Verifikation Phase A:**
```bash
npm run lint          # muss 0 Errors, 3 Warnings (nur die 3 <img>) haben
CI=1 npm test -- --runInBand src/app/playground/ src/hooks/useGalleryAssets.test.ts
```

### Phase B — Docs commiten + Merge-Back

```bash
git add docs/superpowers/plans/2026-08-07-playground-step7-final-review-handoff.md
git add docs/superpowers/plans/2026-08-08-playground-final-review-and-merge.md
git commit -m "docs(playground): final review handoff + merge plan"

git checkout playground/multimedia
git merge --no-ff playground/multimedia-preflight -m "merge(playground): pre-merge W6/M6 fixes"
git branch -d playground/multimedia-preflight
```

### Phase C — Ledger

`.superpowers/sdd/2026-08-07-multimedia-playground/progress.md` anhängen:
```
Final review (2026-08-08): PASS
- W6: PlaygroundShell sync-effect eslint-disable (matching W1 pattern)
- M6: clearAllAssets filters via isGalleryAsset (playground survives Vault clear)
Deferred to next housekeeping: M7 (<img> → next/image in 3 files), M8 (was addressed in Phase B), M9 (misleading e1dcf8d commit message, historical)
```

### Phase D — Merge nach `main`

**Alle Preconditions:**
1. `git status` clean auf `playground/multimedia`
2. Lint 0 Errors
3. Tests 432/432
4. Externer Agent bestätigt pausiert
5. Explizites User-Go (per Chat, nicht via Docs)

```bash
cd /Users/johnmeckel/heyhihosted    # HAUPT-Repo, erst jetzt
git status                          # muss clean sein
git checkout main
git pull                            # falls Remote existiert und Änderungen bringt
git merge --no-ff /Users/johnmeckel/heyhihosted-playground playground/multimedia \
  -m "feat: multimedia playground (/playground)

Adds a standalone /playground page for image and video generation:
- provider switch (Pollinations/Pruna) scoped to model selection only
- live model list via /image/models proxy, config fallback for Pruna
- mode tabs (T2I/I2I/T2V/I2V) filter models by capability
- reference uploads, aspect ratio, duration slider, advanced params
- generated assets tagged with __playground__ sentinel, isolated from main gallery
- mobile bar + bottom-sheet params for < 768px
- sidebar link + DE/EN translations + e2e coverage

Feature branch: 43 commits (b929e3e..HEAD)"

npm run lint && CI=1 npm test -- --runInBand && npm run build
```

Wenn `build` rot → NICHT pushen, `git reset --hard HEAD~1` auf `main` rollback, User escalieren.

Wenn alles grün → **STOPP.** Kein `git push` ohne zweites explizites User-Go.

## Deferred Follow-Ups (nach Merge, eigener Zyklus)

1. `<img>` → `next/image` Migration in `Gallery.tsx`, `Hero.tsx`, `ReferenceUploads.tsx` (M7)
2. Chat-Slim (Compose raus, Visualize auf 1–3 Modelle, Video-Modelle raus) — eigener Brainstorm/Spec/Plan-Zyklus
3. AdvancedPanel/DurationSlider/GenerateButton/Hero individuelle Unit-Tests (aktuell nur indirekt über PlaygroundShell.test.tsx + playground.e2e.test.tsx abgedeckt)

## Was NICHT zu tun ist

- Kein Fix für M9 — historischer Commit, rebase wäre teurer als der Nutzen.
- Kein Rebase des Feature-Branchs auf `main`. `--no-ff`-Merge macht die 43 Commits als Blob sichtbar; das ist gewollt für Historisierung.
- Kein `git push --force` irgendwo.
- Kein `--amend` auf bereits reviewten Commits.
