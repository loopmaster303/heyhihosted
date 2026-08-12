# Fix-Plan — Playground Tasks 4–13 Review-Findings

**Scope:** 3 Findings aus dem Broad-Review von `playground/multimedia` (Commits `e888657..893032a`). Ein Kritisch (blockiert Lint/CI), zwei Wichtig (invented token, WCAG focus).

**Worktree:** `/Users/johnmeckel/heyhihosted-playground`
**Branch:** `playground/multimedia`

## Orchestrator-Regeln (an dich)

- Ein Worker pro Task, Sonnet-5 (`model: "sonnet"` explizit).
- Kein Plan/Spec/Handoff an Worker geben. Nur diesen Fix-Brief-Ausschnitt (Task 1 ODER 2 ODER 3, nie alle drei zusammen).
- Task 2 und 3 fassen dieselbe Datei an (`playground.module.css`). **Nicht parallel** dispatchen — Worker 2 startet erst nach Worker 3-Commit (oder umgekehrt).
- Worker-Prompt-Länge: ~15 Zeilen max. Kein "Hintergrund", kein "warum". Nur: Datei, Zeile, aktueller Code, gewünschter Code, Verifikations-Befehl.

## Task-Reviewer

Nach jedem Worker: ein Sonnet-5 Reviewer, der NUR dieses eine Finding gegenprüft (Diff + `npm run lint` bzw. Test-Run). Kein Broad-Review.

---

## Task 1 (Kritisch) — Lazy Init in ApiKeyField

**Datei:** `src/components/playground/ApiKeyField.tsx`
**Problem:** `setPrunaKeyLocal(...)` in `useEffect`-Body → `react-hooks/set-state-in-effect` Lint-Error. `npm run lint` fällt.

**Aktueller Code (Zeilen 11 + 15–23):**

```tsx
const [prunaKey, setPrunaKeyLocal] = useState<string>('');
// …
useEffect(() => {
  if (typeof window === 'undefined') return;
  setPrunaKeyLocal(localStorage.getItem('prunaApiKey') ?? '');
  const onStorage = (e: StorageEvent) => {
    if (e.key === 'prunaApiKey') setPrunaKeyLocal(e.newValue ?? '');
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}, []);
```

**Gewünscht:**

```tsx
const [prunaKey, setPrunaKeyLocal] = useState<string>(() =>
  typeof window === 'undefined' ? '' : (localStorage.getItem('prunaApiKey') ?? '')
);
// …
useEffect(() => {
  if (typeof window === 'undefined') return;
  const onStorage = (e: StorageEvent) => {
    if (e.key === 'prunaApiKey') setPrunaKeyLocal(e.newValue ?? '');
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}, []);
```

**Verifikation:**

```bash
npm run lint 2>&1 | grep -A1 ApiKeyField || echo "lint clean"
CI=1 npm test -- --runInBand src/components/playground/ApiKeyField.test.tsx
```

Beides muss grün sein. Wenn Tests SSR-Mock-abhängig sind (kein `window`), lazy-init greift den Ternary-Zweig → sollte weiter passen.

---

## Task 2 (Wichtig) — Invented `--warning` Token entfernen

**Datei:** `src/app/playground/playground.module.css` Zeilen 371–378
**Problem:** `hsl(var(--warning, ...))` — Token `--warning` existiert nicht in `src/app/globals.css`. Fallback ist Raw-HSL, ignoriert Dark-Mode. Regel "no invented tokens" verletzt.

**Aktueller Code:**

```css
.warn {
  font-size: 11px;
  color: hsl(var(--warning, 38 92% 50%));
  background: hsl(var(--warning, 38 92% 50%) / 0.1);
  padding: 4px 8px;
  border-radius: var(--radius);
  margin: 0;
}
```

**Gewünscht** (offline-fallback ist informational, kein Fehler — neutraler `muted`-Token):

```css
.warn {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted));
  padding: 4px 8px;
  border-radius: var(--radius);
  margin: 0;
}
```

**Verifikation:**

```bash
grep -n 'var(--warning' src/app/playground/playground.module.css   # muss 0 Treffer haben
CI=1 npm test -- --runInBand src/components/playground/ModelSelect.test.tsx
```

Wenn ModelSelect-Test die Klasse `.warn` per `toHaveClass` prüft → weiterhin grün (Klassenname unverändert).

---

## Task 3 (Wichtig) — `:focus-visible` für `.keyInput` + `.promptInput`

**Datei:** `src/app/playground/playground.module.css` Zeilen 280–295 und 528–544
**Problem:** Beide Klassen setzen `outline: none` ohne `:focus-visible`-Ersatz. WCAG 2.4.7 verletzt. Dieselbe Regel wurde in Task 14 + 15 bereits durchgezogen.

**Aktueller Code (Auszug):**

```css
.keyInput {
  /* … */
  outline: none;
  transition: border-color 150ms ease;
}

.keyInput:focus {
  border-color: hsl(var(--ring));
}
```

(Analog `.promptInput` bei Zeile 528–544.)

**Gewünscht:** Nach dem jeweiligen `:focus`-Block einen `:focus-visible`-Block einfügen. Muster wie in Tasks 14/15:

```css
.keyInput:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

.promptInput:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
```

Die bestehenden `:focus`-Blöcke (border-color-change) bleiben unverändert — `:focus-visible` läuft additiv.

**Verifikation:**

```bash
grep -n 'focus-visible' src/app/playground/playground.module.css   # mindestens die zwei neuen Zeilen zusätzlich zu bestehenden
CI=1 npm test -- --runInBand src/components/playground/ApiKeyField.test.tsx src/components/playground/PromptPanel.test.tsx
```

---

## Reihenfolge

1. Task 1 (isoliert, TSX-Datei).
2. Task 3 (CSS, tiefere Zeilen — 528+).
3. Task 2 (CSS, Zeilen 371–378, greift Task 3 nicht an).

Nach allen drei Tasks:

```bash
npm run lint
CI=1 npm test -- --runInBand src/components/playground/
```

Beides grün → in Ledger `.superpowers/sdd/2026-08-07-multimedia-playground/progress.md` eintragen:

```
Fix-round on tasks 4-13 findings: complete (commits BASE7..HEAD7, lint clean, tests green)
- Task 1: ApiKeyField lazy init
- Task 2: playground.module.css .warn → muted tokens
- Task 3: playground.module.css .keyInput + .promptInput :focus-visible
```

Dann bereit für Merge zurück auf `main` (bzw. den Sammel-Branch, den du für Tasks 16/20/21/22 wählst).

## Was NICHT zu tun ist

- Keine Minor-Findings mitfixen (dead code, malformed trailers, `next-env.d.ts`). Die kommen in den Final-Review vor Merge.
- Keine anderen `outline: none` in derselben Datei "prophylaktisch" mit patchen — nur die zwei, die im Review benannt sind.
- Kein `--warning`-Token neu anlegen in `globals.css`. Wir nutzen bestehende shadcn-Tokens.
