# Multimedia Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a standalone `/playground` route that unifies every available image/video model behind one provider-scoped shell — Pollinations live-fetched, Pruna config-driven (minus `p-image-try-on` and `p-video-avatar`), same UI vocabulary as the rest of hey.hi.

**Architecture:** New Next.js App Router route `src/app/playground/`, purely client-driven (no server state), with a params sidebar (provider switch → key field → mode → model → prompt → refs → ratio → duration → advanced → generate) and a hero+gallery main area. Reuses existing config truths (`unified-image-models.ts`, `pruna-models.ts`), existing hooks (`useProviderMode`, `usePollenKey`, `useHasPrunaKey`), existing generate endpoint (`/api/generate`), existing persistence (`OutputService`, `BlobManager`). One new proxy route (`/api/pollen/image-models`) shields the Pollinations key from the client.

**Tech Stack:** Next.js 16 App Router (Turbopack), React 19, TypeScript, Tailwind, Jest + React Testing Library, existing Dexie-backed `OutputService`.

## Global Constraints

- Route parallel to `/unified` — no changes to Visualize in this milestone.
- Keys shared with chat: `pollenApiKey`, `prunaApiKey` in localStorage; headers `X-Pollen-Key`, `X-Pruna-Key`.
- Provider mode uses existing `useProviderMode()` (`heyhi-provider-mode` localStorage) → shared with Visualize on purpose.
- Pruna exclusion list in playground: `p-image-try-on`, `p-video-avatar`. No other Pruna model is hidden.
- Never call `URL.createObjectURL` directly — always via `BlobManager.register(context: 'playground')`.
- Never render user-controlled HTML; escape via existing helpers.
- Every new file has a matching `.test.ts(x)` in the same directory (repo convention).
- Commit at the end of every task; use `feat(playground): …`, `test(playground): …`, `chore(playground): …` prefixes.
- Language: DE default, EN fallback — add strings to `src/config/translations.ts`.
- No new Dexie migrations. No changes to `/api/generate` schema.

---

## File Structure

**Create:**

```
src/app/playground/page.tsx
src/app/playground/PlaygroundShell.tsx
src/app/playground/playground.module.css               (structural CSS only)
src/app/api/pollen/image-models/route.ts
src/app/api/pollen/image-models/route.test.ts
src/components/playground/ProviderSwitch.tsx
src/components/playground/ProviderSwitch.test.tsx
src/components/playground/ApiKeyField.tsx
src/components/playground/ApiKeyField.test.tsx
src/components/playground/ModeSwitch.tsx
src/components/playground/ModeSwitch.test.tsx
src/components/playground/ModelSelect.tsx
src/components/playground/ModelSelect.test.tsx
src/components/playground/PromptPanel.tsx
src/components/playground/PromptPanel.test.tsx
src/components/playground/ReferenceUploads.tsx
src/components/playground/ReferenceUploads.test.tsx
src/components/playground/AspectRatioPills.tsx
src/components/playground/DurationSlider.tsx
src/components/playground/AdvancedPanel.tsx
src/components/playground/GenerateButton.tsx
src/components/playground/Hero.tsx
src/components/playground/Gallery.tsx
src/components/playground/Gallery.test.tsx
src/components/playground/MobileBar.tsx
src/hooks/usePlaygroundState.ts
src/hooks/usePlaygroundState.test.ts
src/hooks/usePlaygroundModels.ts
src/hooks/usePlaygroundModels.test.ts
src/lib/playground/mode-mapping.ts
src/lib/playground/mode-mapping.test.ts
src/lib/playground/model-source.ts
src/lib/playground/model-source.test.ts
src/lib/playground/generate-request.ts
src/lib/playground/generate-request.test.ts
```

**Modify:**

- `src/components/layout/AppSidebar.tsx` — add `Playground →` link.
- `src/config/translations.ts` — add `playground.*` DE/EN keys.

---

## Task 1: Route skeleton + shell

**Files:**
- Create: `src/app/playground/page.tsx`
- Create: `src/app/playground/PlaygroundShell.tsx`
- Create: `src/app/playground/playground.module.css`

**Interfaces:**
- Consumes: nothing yet.
- Produces: A rendered `/playground` route with grid `topbar / (sidebar | main)`. The sidebar and main area render placeholder text so we can iterate on children in later tasks.

- [ ] **Step 1: Create the route entry**

`src/app/playground/page.tsx`:

```tsx
import { PlaygroundShell } from './PlaygroundShell';

export const metadata = { title: 'heyhi / playground' };

export default function PlaygroundPage() {
  return <PlaygroundShell />;
}
```

- [ ] **Step 2: Create the shell with topbar + workspace grid**

`src/app/playground/PlaygroundShell.tsx`:

```tsx
"use client";
import styles from './playground.module.css';

export function PlaygroundShell() {
  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <div className={styles.logo}>
          <span className={styles.logoDot} aria-hidden />
          <span>heyhi</span>
          <span className={styles.slash}>/</span>
          <span className={styles.sub}>playground</span>
        </div>
      </header>
      <main className={styles.workspace}>
        <aside className={styles.params} aria-label="Parameters">
          <div className={styles.paramsScroll} data-testid="params-panel">
            <p style={{ color: 'var(--text-mute)' }}>Params sidebar</p>
          </div>
        </aside>
        <section className={styles.output}>
          <div className={styles.hero} data-testid="hero-placeholder">
            <p style={{ color: 'var(--text-mute)' }}>Hero placeholder</p>
          </div>
          <div className={styles.gallery} data-testid="gallery-placeholder">
            <p style={{ color: 'var(--text-mute)' }}>Gallery placeholder</p>
          </div>
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Add structural CSS ported from playground-v2.html**

`src/app/playground/playground.module.css` — copy the layout blocks (`.app`, `.topbar`, `.logo`, `.workspace`, `.params`, `.paramsScroll`, `.output`, `.hero`, `.gallery`, plus mobile media queries and reduced-transparency fallback) from `playground/playground-v2.html:159-1078`. Replace CSS variables `--bg`, `--surface`, `--accent`, `--text*`, `--font-*`, `--radius*` with the tokens already in `src/app/globals.css` (do not re-declare them). Drop the iris-specific colors — the module inherits whatever hey.hi defines. Convert kebab-case class names to camelCase for CSS Modules and update the JSX above.

- [ ] **Step 4: Manual smoke — verify route renders**

Run: `npm run dev` and open `http://localhost:3000/playground` in a browser.
Expected: See topbar with "heyhi / playground", sidebar with "Params sidebar", main area with "Hero placeholder" and "Gallery placeholder". No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/playground
git commit -m "feat(playground): scaffold /playground route with sidebar shell"
```

---

## Task 2: Playground state hook

**Files:**
- Create: `src/hooks/usePlaygroundState.ts`
- Create: `src/hooks/usePlaygroundState.test.ts`

**Interfaces:**
- Consumes: `useLocalStorageState` from `src/hooks/useLocalStorageState.ts`.
- Produces:
  ```ts
  export type PlaygroundMode = 't2i' | 'i2i' | 't2v' | 'i2v';
  export interface PlaygroundState {
    mode: PlaygroundMode;
    modelId: string | null;
    prompt: string;
    aspectRatio: string | null;
    durationSeconds: number | null;
    seed: string;
    negativePrompt: string;
    guidance: string;
    steps: string;
    uploads: string[];        // uploaded URLs
    sourceVideo: string | null;
  }
  export function usePlaygroundState(): {
    state: PlaygroundState;
    setMode: (m: PlaygroundMode) => void;
    setModelId: (id: string | null) => void;
    setPrompt: (p: string) => void;
    setAspectRatio: (r: string | null) => void;
    setDurationSeconds: (d: number | null) => void;
    setAdvanced: (patch: Partial<Pick<PlaygroundState, 'seed'|'negativePrompt'|'guidance'|'steps'>>) => void;
    setUploads: (u: string[]) => void;
    setSourceVideo: (v: string | null) => void;
    resetForModel: (defaults: Partial<PlaygroundState>) => void;
  };
  ```
- LocalStorage key: `playgroundState` (single JSON blob, schema version tagged inside).

- [ ] **Step 1: Write the failing test**

`src/hooks/usePlaygroundState.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react';
import { usePlaygroundState } from './usePlaygroundState';

describe('usePlaygroundState', () => {
  beforeEach(() => localStorage.clear());

  it('starts with defaults', () => {
    const { result } = renderHook(() => usePlaygroundState());
    expect(result.current.state.mode).toBe('t2i');
    expect(result.current.state.modelId).toBeNull();
    expect(result.current.state.prompt).toBe('');
    expect(result.current.state.uploads).toEqual([]);
  });

  it('persists mode change to localStorage', () => {
    const { result } = renderHook(() => usePlaygroundState());
    act(() => result.current.setMode('t2v'));
    const raw = JSON.parse(localStorage.getItem('playgroundState')!);
    expect(raw.mode).toBe('t2v');
  });

  it('resetForModel merges defaults but preserves prompt and uploads', () => {
    const { result } = renderHook(() => usePlaygroundState());
    act(() => result.current.setPrompt('hello'));
    act(() => result.current.setUploads(['https://example.com/a.png']));
    act(() => result.current.resetForModel({ aspectRatio: '16:9', durationSeconds: 5 }));
    expect(result.current.state.prompt).toBe('hello');
    expect(result.current.state.uploads).toEqual(['https://example.com/a.png']);
    expect(result.current.state.aspectRatio).toBe('16:9');
    expect(result.current.state.durationSeconds).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=1 npm test -- --runInBand src/hooks/usePlaygroundState.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

`src/hooks/usePlaygroundState.ts`:

```ts
"use client";
import { useCallback } from 'react';
import useLocalStorageState from '@/hooks/useLocalStorageState';

export type PlaygroundMode = 't2i' | 'i2i' | 't2v' | 'i2v';

export interface PlaygroundState {
  mode: PlaygroundMode;
  modelId: string | null;
  prompt: string;
  aspectRatio: string | null;
  durationSeconds: number | null;
  seed: string;
  negativePrompt: string;
  guidance: string;
  steps: string;
  uploads: string[];
  sourceVideo: string | null;
}

const DEFAULT_STATE: PlaygroundState = {
  mode: 't2i',
  modelId: null,
  prompt: '',
  aspectRatio: null,
  durationSeconds: null,
  seed: '',
  negativePrompt: '',
  guidance: '',
  steps: '',
  uploads: [],
  sourceVideo: null,
};

export function usePlaygroundState() {
  const [state, setState] = useLocalStorageState<PlaygroundState>('playgroundState', DEFAULT_STATE);

  const patch = useCallback(
    (p: Partial<PlaygroundState>) => setState((prev) => ({ ...prev, ...p })),
    [setState],
  );

  return {
    state,
    setMode: (mode: PlaygroundMode) => patch({ mode }),
    setModelId: (modelId: string | null) => patch({ modelId }),
    setPrompt: (prompt: string) => patch({ prompt }),
    setAspectRatio: (aspectRatio: string | null) => patch({ aspectRatio }),
    setDurationSeconds: (durationSeconds: number | null) => patch({ durationSeconds }),
    setAdvanced: (advanced: Partial<Pick<PlaygroundState, 'seed'|'negativePrompt'|'guidance'|'steps'>>) => patch(advanced),
    setUploads: (uploads: string[]) => patch({ uploads }),
    setSourceVideo: (sourceVideo: string | null) => patch({ sourceVideo }),
    resetForModel: (defaults: Partial<PlaygroundState>) => patch(defaults),
  };
}
```

- [ ] **Step 4: Run tests**

Run: `CI=1 npm test -- --runInBand src/hooks/usePlaygroundState.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePlaygroundState.ts src/hooks/usePlaygroundState.test.ts
git commit -m "feat(playground): add usePlaygroundState hook with localStorage persistence"
```

---

## Task 3: Provider switch component

**Files:**
- Create: `src/components/playground/ProviderSwitch.tsx`
- Create: `src/components/playground/ProviderSwitch.test.tsx`

**Interfaces:**
- Consumes: `useProviderMode` from `src/hooks/useProviderMode.ts` (returns `{ providerMode, setProviderMode, prunaAvailable }`, type `ImageProvider = 'pollinations' | 'pruna'`).
- Produces: `<ProviderSwitch />` — no props; internally reads/writes provider mode.

- [ ] **Step 1: Failing test**

`src/components/playground/ProviderSwitch.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProviderSwitch } from './ProviderSwitch';

jest.mock('@/hooks/useProviderMode', () => ({
  useProviderMode: jest.fn(),
}));
import { useProviderMode } from '@/hooks/useProviderMode';

describe('ProviderSwitch', () => {
  it('renders both providers and marks the active one', () => {
    (useProviderMode as jest.Mock).mockReturnValue({
      providerMode: 'pollinations', setProviderMode: jest.fn(), prunaAvailable: true,
    });
    render(<ProviderSwitch />);
    const pollen = screen.getByRole('tab', { name: /pollinations/i });
    const pruna = screen.getByRole('tab', { name: /pruna/i });
    expect(pollen).toHaveAttribute('aria-selected', 'true');
    expect(pruna).toHaveAttribute('aria-selected', 'false');
  });

  it('switches provider on click', () => {
    const setProviderMode = jest.fn();
    (useProviderMode as jest.Mock).mockReturnValue({
      providerMode: 'pollinations', setProviderMode, prunaAvailable: true,
    });
    render(<ProviderSwitch />);
    fireEvent.click(screen.getByRole('tab', { name: /pruna/i }));
    expect(setProviderMode).toHaveBeenCalledWith('pruna');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL (module not found)**

Run: `CI=1 npm test -- --runInBand src/components/playground/ProviderSwitch.test.tsx`

- [ ] **Step 3: Implement**

`src/components/playground/ProviderSwitch.tsx`:

```tsx
"use client";
import { useProviderMode } from '@/hooks/useProviderMode';
import type { ImageProvider } from '@/config/unified-image-models';

const OPTIONS: { id: ImageProvider; label: string }[] = [
  { id: 'pollinations', label: 'Pollinations' },
  { id: 'pruna', label: 'Pruna' },
];

export function ProviderSwitch() {
  const { providerMode, setProviderMode } = useProviderMode();
  return (
    <div role="tablist" aria-label="Provider" className="segmented">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          role="tab"
          aria-selected={providerMode === opt.id}
          className={`segment ${providerMode === opt.id ? 'active' : ''}`}
          onClick={() => setProviderMode(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
```

Add `.segmented` and `.segment` styles to `playground.module.css` (port from playground-v2.html:245-287, keep the sliding indicator). Import styles via className mapping (`import styles from '../../app/playground/playground.module.css'`).

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/components/playground/ProviderSwitch.tsx src/components/playground/ProviderSwitch.test.tsx src/app/playground/playground.module.css
git commit -m "feat(playground): add provider switch component"
```

---

## Task 4: API key field

**Files:**
- Create: `src/components/playground/ApiKeyField.tsx`
- Create: `src/components/playground/ApiKeyField.test.tsx`

**Interfaces:**
- Consumes: `useProviderMode`, `usePollenKey` (`{ pollenKey, setPollenKey }` from existing hook), `useHasPrunaKey`, plus a small local helper to read/write `prunaApiKey` in localStorage.
- Produces: `<ApiKeyField />` — switches label + storage target based on current provider; masked input; `Test` button pings `/api/pollen/account` (Pollinations) or `/api/capabilities` (Pruna) and shows a status dot.

- [ ] **Step 1: Failing test**

`src/components/playground/ApiKeyField.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiKeyField } from './ApiKeyField';

jest.mock('@/hooks/useProviderMode', () => ({ useProviderMode: jest.fn() }));
jest.mock('@/hooks/usePollenKey', () => ({ usePollenKey: jest.fn() }));
import { useProviderMode } from '@/hooks/useProviderMode';
import { usePollenKey } from '@/hooks/usePollenKey';

describe('ApiKeyField', () => {
  beforeEach(() => localStorage.clear());
  it('shows Pollinations label when provider is pollinations', () => {
    (useProviderMode as jest.Mock).mockReturnValue({ providerMode: 'pollinations', setProviderMode: jest.fn(), prunaAvailable: false });
    (usePollenKey as jest.Mock).mockReturnValue({ pollenKey: '', setPollenKey: jest.fn(), account: null, refresh: jest.fn(), isValidating: false });
    render(<ApiKeyField />);
    expect(screen.getByLabelText(/pollinations key/i)).toBeInTheDocument();
  });

  it('writes prunaApiKey to localStorage when provider is pruna', () => {
    (useProviderMode as jest.Mock).mockReturnValue({ providerMode: 'pruna', setProviderMode: jest.fn(), prunaAvailable: true });
    (usePollenKey as jest.Mock).mockReturnValue({ pollenKey: '', setPollenKey: jest.fn(), account: null, refresh: jest.fn(), isValidating: false });
    render(<ApiKeyField />);
    const input = screen.getByLabelText(/pruna key/i);
    fireEvent.change(input, { target: { value: 'sk_test' } });
    expect(localStorage.getItem('prunaApiKey')).toBe('sk_test');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

`src/components/playground/ApiKeyField.tsx`:

```tsx
"use client";
import { useEffect, useState } from 'react';
import { useProviderMode } from '@/hooks/useProviderMode';
import { usePollenKey } from '@/hooks/usePollenKey';

export function ApiKeyField() {
  const { providerMode } = useProviderMode();
  const { pollenKey, setPollenKey } = usePollenKey();
  const [prunaKey, setPrunaKeyLocal] = useState<string>('');
  const [status, setStatus] = useState<'idle'|'ok'|'error'|'checking'>('idle');
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPrunaKeyLocal(localStorage.getItem('prunaApiKey') ?? '');
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'prunaApiKey') setPrunaKeyLocal(e.newValue ?? '');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isPollen = providerMode === 'pollinations';
  const value = isPollen ? (pollenKey ?? '') : prunaKey;
  const label = isPollen ? 'Pollinations Key' : 'Pruna Key';
  const inputId = isPollen ? 'pollen-key' : 'pruna-key';

  const onChange = (v: string) => {
    if (isPollen) setPollenKey(v);
    else {
      setPrunaKeyLocal(v);
      if (v) localStorage.setItem('prunaApiKey', v);
      else localStorage.removeItem('prunaApiKey');
    }
    setStatus('idle');
  };

  const runTest = async () => {
    if (!value) return;
    setStatus('checking');
    try {
      const url = isPollen ? '/api/pollen/account' : '/api/capabilities';
      const headers: Record<string, string> = isPollen ? { 'X-Pollen-Key': value } : { 'X-Pruna-Key': value };
      const res = await fetch(url, { headers });
      setStatus(res.ok ? 'ok' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="field">
      <label htmlFor={inputId} className="field-label">{label}</label>
      <div className="key-row">
        <input
          id={inputId}
          type={reveal ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <button type="button" aria-label={reveal ? 'Hide key' : 'Show key'} onClick={() => setReveal((r) => !r)}>
          {reveal ? '🙈' : '👁'}
        </button>
        <button type="button" onClick={runTest} disabled={!value || status === 'checking'}>
          {status === 'checking' ? '…' : 'Test'}
        </button>
        <span data-testid="key-status" data-status={status} aria-live="polite" />
      </div>
    </div>
  );
}
```

Add matching CSS classes (`.field`, `.field-label`, `.key-row`, `[data-status="ok"]`, `[data-status="error"]`) to `playground.module.css`.

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/components/playground/ApiKeyField.tsx src/components/playground/ApiKeyField.test.tsx src/app/playground/playground.module.css
git commit -m "feat(playground): add api-key field with provider-scoped storage and test button"
```

---

## Task 5: Live image-models proxy route

**Files:**
- Create: `src/app/api/pollen/image-models/route.ts`
- Create: `src/app/api/pollen/image-models/route.test.ts`

**Interfaces:**
- Consumes: `resolvePollenKey` from `src/lib/resolve-pollen-key.ts`.
- Produces: `GET /api/pollen/image-models` → forwards to `https://gen.pollinations.ai/image/models` with `Authorization: Bearer <key>` when a key is present. Response body is the upstream JSON verbatim. 60-second in-memory cache keyed by SHA-256 of the key string (or `anon`).

- [ ] **Step 1: Failing test**

`src/app/api/pollen/image-models/route.test.ts`:

```ts
const resolvePollenKeyMock = jest.fn((_r?: Request): string | undefined => undefined);
jest.mock('@/lib/resolve-pollen-key', () => ({ resolvePollenKey: (r?: Request) => resolvePollenKeyMock(r) }));

import { GET } from './route';

const originalFetch = global.fetch;

describe('/api/pollen/image-models', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    resolvePollenKeyMock.mockReturnValue(undefined);
    global.fetch = jest.fn(async () => new Response(JSON.stringify([{ id: 'flux' }]), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;
  });
  afterAll(() => { global.fetch = originalFetch; });

  it('proxies without Authorization when no key present', async () => {
    const res = await GET(new Request('http://localhost/api/pollen/image-models'));
    expect((global.fetch as jest.Mock).mock.calls[0][1].headers.Authorization).toBeUndefined();
    expect(await res.json()).toEqual([{ id: 'flux' }]);
  });

  it('forwards Authorization when key present', async () => {
    resolvePollenKeyMock.mockReturnValue('sk-abc');
    await GET(new Request('http://localhost/api/pollen/image-models'));
    expect((global.fetch as jest.Mock).mock.calls[0][1].headers.Authorization).toBe('Bearer sk-abc');
  });

  it('serves the cached body on the second call within 60s', async () => {
    await GET(new Request('http://localhost/api/pollen/image-models'));
    await GET(new Request('http://localhost/api/pollen/image-models'));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

`src/app/api/pollen/image-models/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { resolvePollenKey } from '@/lib/resolve-pollen-key';
import crypto from 'node:crypto';

const UPSTREAM = 'https://gen.pollinations.ai/image/models';
const TTL_MS = 60_000;
const cache = new Map<string, { at: number; body: string; contentType: string }>();

function keyHash(key: string | undefined): string {
  return key ? crypto.createHash('sha256').update(key).digest('hex').slice(0, 16) : 'anon';
}

export async function GET(request: Request) {
  const apiKey = resolvePollenKey(request);
  const hash = keyHash(apiKey);
  const now = Date.now();
  const hit = cache.get(hash);
  if (hit && now - hit.at < TTL_MS) {
    return new Response(hit.body, { status: 200, headers: { 'content-type': hit.contentType } });
  }
  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const upstream = await fetch(UPSTREAM, { headers });
  const body = await upstream.text();
  const contentType = upstream.headers.get('content-type') ?? 'application/json';
  if (upstream.ok) cache.set(hash, { at: now, body, contentType });
  return new Response(body, { status: upstream.status, headers: { 'content-type': contentType } });
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/pollen/image-models
git commit -m "feat(playground): proxy /image/models with per-key 60s cache"
```

---

## Task 6: Mode-mapping predicates

**Files:**
- Create: `src/lib/playground/mode-mapping.ts`
- Create: `src/lib/playground/mode-mapping.test.ts`

**Interfaces:**
- Consumes: `UnifiedImageModel` type from `src/config/unified-image-models.ts`.
- Produces:
  ```ts
  export type PlaygroundMode = 't2i' | 'i2i' | 't2v' | 'i2v';
  export interface ModeCandidate {
    id: string;
    kind: 'image' | 'video';
    supportsReference: boolean;
    requiresReference: boolean;   // true for I2V/I2I-only pruna models
  }
  export function modesFor(model: ModeCandidate): PlaygroundMode[];
  export function isModelInMode(model: ModeCandidate, mode: PlaygroundMode): boolean;
  ```

- [ ] **Step 1: Failing test**

`src/lib/playground/mode-mapping.test.ts`:

```ts
import { modesFor, isModelInMode } from './mode-mapping';

describe('mode-mapping', () => {
  it('pure T2I model lands only in T2I', () => {
    expect(modesFor({ id: 'flux', kind: 'image', supportsReference: false, requiresReference: false })).toEqual(['t2i']);
  });
  it('image model with optional ref lands in T2I and I2I', () => {
    expect(modesFor({ id: 'klein', kind: 'image', supportsReference: true, requiresReference: false }).sort()).toEqual(['i2i', 't2i']);
  });
  it('I2I-only model lands only in I2I', () => {
    expect(modesFor({ id: 'qwen-image-edit-plus', kind: 'image', supportsReference: true, requiresReference: true })).toEqual(['i2i']);
  });
  it('T2V model lands only in T2V', () => {
    expect(modesFor({ id: 'wan-t2v', kind: 'video', supportsReference: false, requiresReference: false })).toEqual(['t2v']);
  });
  it('smart video model lands in both T2V and I2V', () => {
    expect(modesFor({ id: 'p-video', kind: 'video', supportsReference: true, requiresReference: false }).sort()).toEqual(['i2v', 't2v']);
  });
  it('I2V-only model lands only in I2V', () => {
    expect(modesFor({ id: 'wan-i2v', kind: 'video', supportsReference: true, requiresReference: true })).toEqual(['i2v']);
  });
  it('isModelInMode agrees with modesFor', () => {
    const m: any = { id: 'p-video', kind: 'video', supportsReference: true, requiresReference: false };
    expect(isModelInMode(m, 't2v')).toBe(true);
    expect(isModelInMode(m, 'i2v')).toBe(true);
    expect(isModelInMode(m, 't2i')).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

`src/lib/playground/mode-mapping.ts`:

```ts
export type PlaygroundMode = 't2i' | 'i2i' | 't2v' | 'i2v';

export interface ModeCandidate {
  id: string;
  kind: 'image' | 'video';
  supportsReference: boolean;
  requiresReference: boolean;
}

export function modesFor(model: ModeCandidate): PlaygroundMode[] {
  const out: PlaygroundMode[] = [];
  if (model.kind === 'image') {
    if (!model.requiresReference) out.push('t2i');
    if (model.supportsReference) out.push('i2i');
  } else {
    if (!model.requiresReference) out.push('t2v');
    if (model.supportsReference) out.push('i2v');
  }
  return out;
}

export function isModelInMode(model: ModeCandidate, mode: PlaygroundMode): boolean {
  return modesFor(model).includes(mode);
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/playground/mode-mapping.ts src/lib/playground/mode-mapping.test.ts
git commit -m "feat(playground): mode-mapping predicates for T2I/I2I/T2V/I2V"
```

---

## Task 7: Model source (provider-gated list)

**Files:**
- Create: `src/lib/playground/model-source.ts`
- Create: `src/lib/playground/model-source.test.ts`

**Interfaces:**
- Consumes: `PRUNA_MODEL_IDS`, `getPrunaModelMapping` from `src/config/pruna-models.ts`; `getUnifiedModel`, `UnifiedImageModel` from `src/config/unified-image-models.ts`; `ModeCandidate` from `mode-mapping.ts`.
- Produces:
  ```ts
  export interface PlaygroundModelEntry {
    id: string;
    name: string;
    provider: 'pollinations' | 'pruna';
    kind: 'image' | 'video';
    supportsReference: boolean;
    requiresReference: boolean;
    maxImages: number;
    referenceMode?: 'multi-image' | 'start-frame' | 'start-end-frame';
    unmapped: boolean;
  }
  export interface PollinationsLiveModel {
    id: string;
    outputModalities?: string[];
    inputModalities?: string[];
    name?: string;
  }
  export const PRUNA_HIDDEN_IN_PLAYGROUND: ReadonlySet<string>;
  export function buildPrunaEntries(): PlaygroundModelEntry[];
  export function buildPollinationsEntries(live: PollinationsLiveModel[]): PlaygroundModelEntry[];
  ```

- [ ] **Step 1: Failing test**

`src/lib/playground/model-source.test.ts`:

```ts
import { buildPrunaEntries, buildPollinationsEntries, PRUNA_HIDDEN_IN_PLAYGROUND } from './model-source';

describe('model-source', () => {
  it('pruna list excludes try-on and avatar', () => {
    const ids = buildPrunaEntries().map((m) => m.id);
    expect(ids).not.toContain('p-image-try-on');
    expect(ids).not.toContain('p-video-avatar');
    expect(PRUNA_HIDDEN_IN_PLAYGROUND.size).toBe(2);
    expect(ids).toContain('zimage');
    expect(ids).toContain('wan-t2v');
    expect(ids).toContain('p-video-animate');
  });

  it('pollinations entries mark unknown ids as unmapped', () => {
    const entries = buildPollinationsEntries([{ id: 'brand-new-model', outputModalities: ['image'], inputModalities: ['text'] }]);
    expect(entries[0].unmapped).toBe(true);
    expect(entries[0].kind).toBe('image');
  });

  it('pollinations entries hydrate from config for known ids', () => {
    const entries = buildPollinationsEntries([{ id: 'flux', outputModalities: ['image'], inputModalities: ['text'] }]);
    expect(entries[0].unmapped).toBe(false);
    expect(entries[0].name).toBe('Flux.1 Fast');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

`src/lib/playground/model-source.ts`:

```ts
import { PRUNA_MODEL_IDS, isPrunaModel } from '@/config/pruna-models';
import { getUnifiedModel } from '@/config/unified-image-models';

export interface PlaygroundModelEntry {
  id: string;
  name: string;
  provider: 'pollinations' | 'pruna';
  kind: 'image' | 'video';
  supportsReference: boolean;
  requiresReference: boolean;
  maxImages: number;
  referenceMode?: 'multi-image' | 'start-frame' | 'start-end-frame';
  unmapped: boolean;
}

export interface PollinationsLiveModel {
  id: string;
  outputModalities?: string[];
  inputModalities?: string[];
  name?: string;
}

export const PRUNA_HIDDEN_IN_PLAYGROUND: ReadonlySet<string> = new Set(['p-image-try-on', 'p-video-avatar']);

const PRUNA_REQUIRES_REF: ReadonlySet<string> = new Set(['qwen-image-edit-plus', 'p-image-edit', 'p-image-upscale', 'wan-i2v', 'p-video-animate', 'p-video-replace']);

export function buildPrunaEntries(): PlaygroundModelEntry[] {
  return PRUNA_MODEL_IDS
    .filter((id) => !PRUNA_HIDDEN_IN_PLAYGROUND.has(id))
    .map((id) => {
      const cfg = getUnifiedModel(id);
      const kind: 'image' | 'video' = cfg?.kind ?? (id.includes('video') || id.startsWith('wan-') && id.endsWith('v') ? 'video' : 'image');
      return {
        id,
        name: cfg?.name ?? id,
        provider: 'pruna' as const,
        kind,
        supportsReference: cfg?.supportsReference ?? false,
        requiresReference: PRUNA_REQUIRES_REF.has(id),
        maxImages: cfg?.maxImages ?? (cfg?.supportsReference ? 1 : 0),
        referenceMode: cfg?.referenceMode,
        unmapped: !cfg,
      };
    });
}

export function buildPollinationsEntries(live: PollinationsLiveModel[]): PlaygroundModelEntry[] {
  return live
    .filter((m) => !isPrunaModel(m.id))
    .map((m) => {
      const cfg = getUnifiedModel(m.id);
      const isVideo = (m.outputModalities ?? []).includes('video');
      const acceptsImage = (m.inputModalities ?? []).includes('image');
      return {
        id: m.id,
        name: cfg?.name ?? m.name ?? m.id,
        provider: 'pollinations' as const,
        kind: cfg?.kind ?? (isVideo ? 'video' : 'image'),
        supportsReference: cfg?.supportsReference ?? acceptsImage,
        requiresReference: isVideo && acceptsImage && (m.inputModalities ?? []).length === 1 && (m.inputModalities ?? [])[0] === 'image',
        maxImages: cfg?.maxImages ?? (acceptsImage ? 1 : 0),
        referenceMode: cfg?.referenceMode,
        unmapped: !cfg,
      };
    });
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/playground/model-source.ts src/lib/playground/model-source.test.ts
git commit -m "feat(playground): provider-scoped model source with Pruna exclusion + Pollinations merge"
```

---

## Task 8: usePlaygroundModels hook

**Files:**
- Create: `src/hooks/usePlaygroundModels.ts`
- Create: `src/hooks/usePlaygroundModels.test.ts`

**Interfaces:**
- Consumes: `useProviderMode`, `buildPrunaEntries`, `buildPollinationsEntries`, `PlaygroundModelEntry`, `usePollenKey`.
- Produces:
  ```ts
  export interface UsePlaygroundModelsResult {
    entries: PlaygroundModelEntry[];
    loading: boolean;
    error: string | null;
    fallbackActive: boolean;    // true when live fetch failed and we used config fallback
    reload: () => void;
  }
  export function usePlaygroundModels(): UsePlaygroundModelsResult;
  ```

- [ ] **Step 1: Failing test**

`src/hooks/usePlaygroundModels.test.ts`:

```ts
import { act, renderHook, waitFor } from '@testing-library/react';
import { usePlaygroundModels } from './usePlaygroundModels';

jest.mock('@/hooks/useProviderMode', () => ({ useProviderMode: jest.fn() }));
jest.mock('@/hooks/usePollenKey', () => ({ usePollenKey: jest.fn(() => ({ pollenKey: '' })) }));
import { useProviderMode } from '@/hooks/useProviderMode';

const originalFetch = global.fetch;

describe('usePlaygroundModels', () => {
  afterAll(() => { global.fetch = originalFetch; });

  it('returns pruna entries when provider is pruna, no fetch', async () => {
    (useProviderMode as jest.Mock).mockReturnValue({ providerMode: 'pruna', setProviderMode: jest.fn(), prunaAvailable: true });
    global.fetch = jest.fn() as any;
    const { result } = renderHook(() => usePlaygroundModels());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.entries.every((e) => e.provider === 'pruna')).toBe(true);
    expect(result.current.entries.some((e) => e.id === 'zimage')).toBe(true);
  });

  it('fetches live models when provider is pollinations', async () => {
    (useProviderMode as jest.Mock).mockReturnValue({ providerMode: 'pollinations', setProviderMode: jest.fn(), prunaAvailable: false });
    global.fetch = jest.fn(async () => new Response(JSON.stringify([{ id: 'flux', outputModalities: ['image'], inputModalities: ['text'] }]), { status: 200 })) as any;
    const { result } = renderHook(() => usePlaygroundModels());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries.some((e) => e.id === 'flux' && e.provider === 'pollinations')).toBe(true);
  });

  it('falls back to config when live fetch fails', async () => {
    (useProviderMode as jest.Mock).mockReturnValue({ providerMode: 'pollinations', setProviderMode: jest.fn(), prunaAvailable: false });
    global.fetch = jest.fn(async () => new Response('boom', { status: 500 })) as any;
    const { result } = renderHook(() => usePlaygroundModels());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.fallbackActive).toBe(true);
    expect(result.current.entries.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

`src/hooks/usePlaygroundModels.ts`:

```ts
"use client";
import { useCallback, useEffect, useState } from 'react';
import { useProviderMode } from '@/hooks/useProviderMode';
import { usePollenKey } from '@/hooks/usePollenKey';
import {
  buildPollinationsEntries,
  buildPrunaEntries,
  type PlaygroundModelEntry,
  type PollinationsLiveModel,
} from '@/lib/playground/model-source';
import { UNIFIED_IMAGE_MODELS } from '@/config/unified-image-models';

export interface UsePlaygroundModelsResult {
  entries: PlaygroundModelEntry[];
  loading: boolean;
  error: string | null;
  fallbackActive: boolean;
  reload: () => void;
}

export function usePlaygroundModels(): UsePlaygroundModelsResult {
  const { providerMode } = useProviderMode();
  const { pollenKey } = usePollenKey();
  const [entries, setEntries] = useState<PlaygroundModelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackActive, setFallbackActive] = useState(false);
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFallbackActive(false);

    if (providerMode === 'pruna') {
      setEntries(buildPrunaEntries());
      setLoading(false);
      return () => {};
    }

    (async () => {
      try {
        const headers: Record<string, string> = {};
        if (pollenKey) headers['X-Pollen-Key'] = pollenKey;
        const res = await fetch('/api/pollen/image-models', { headers });
        if (!res.ok) throw new Error(`image-models ${res.status}`);
        const raw = (await res.json()) as PollinationsLiveModel[] | { data: PollinationsLiveModel[] };
        const live = Array.isArray(raw) ? raw : raw.data ?? [];
        if (cancelled) return;
        setEntries(buildPollinationsEntries(live));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load models');
        setFallbackActive(true);
        setEntries(
          buildPollinationsEntries(
            UNIFIED_IMAGE_MODELS
              .filter((m) => m.provider === 'pollinations' && m.enabled && m.isFree)
              .map((m) => ({ id: m.id, outputModalities: [m.kind], inputModalities: m.supportsReference ? ['text', 'image'] : ['text'], name: m.name }))
          ),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [providerMode, pollenKey, nonce]);

  return { entries, loading, error, fallbackActive, reload };
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePlaygroundModels.ts src/hooks/usePlaygroundModels.test.ts
git commit -m "feat(playground): usePlaygroundModels hook with live fetch + config fallback"
```

---

## Task 9: Mode switch component

**Files:**
- Create: `src/components/playground/ModeSwitch.tsx`
- Create: `src/components/playground/ModeSwitch.test.tsx`

**Interfaces:**
- Consumes: `PlaygroundMode` from `@/lib/playground/mode-mapping`.
- Produces: `<ModeSwitch value={mode} onChange={setMode} />` — 4-segment control with a sliding indicator (structural CSS from playground-v2.html:245-287 already ported in Task 3).

- [ ] **Step 1: Failing test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ModeSwitch } from './ModeSwitch';

describe('ModeSwitch', () => {
  it('renders 4 tabs and marks active', () => {
    render(<ModeSwitch value="t2v" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 't2v', selected: true })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
  });
  it('emits onChange when a tab is clicked', () => {
    const onChange = jest.fn();
    render(<ModeSwitch value="t2i" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'i2v' }));
    expect(onChange).toHaveBeenCalledWith('i2v');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

```tsx
"use client";
import type { PlaygroundMode } from '@/lib/playground/mode-mapping';

const MODES: PlaygroundMode[] = ['t2i', 'i2i', 't2v', 'i2v'];

export function ModeSwitch({ value, onChange }: { value: PlaygroundMode; onChange: (m: PlaygroundMode) => void }) {
  return (
    <div role="tablist" className="segmented segmented-4">
      {MODES.map((m) => (
        <button
          key={m}
          role="tab"
          aria-selected={value === m}
          className={`segment ${value === m ? 'active' : ''}`}
          onClick={() => onChange(m)}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/components/playground/ModeSwitch.tsx src/components/playground/ModeSwitch.test.tsx
git commit -m "feat(playground): mode switch component"
```

---

## Task 10: Model select component

**Files:**
- Create: `src/components/playground/ModelSelect.tsx`
- Create: `src/components/playground/ModelSelect.test.tsx`

**Interfaces:**
- Consumes: `PlaygroundModelEntry` from `model-source`, `isModelInMode` from `mode-mapping`, `PlaygroundMode`.
- Produces: `<ModelSelect entries mode value onChange loading fallbackActive />` — filters entries by mode, dropdown menu with the item shape from playground-v2.html:339-372.

- [ ] **Step 1: Failing test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ModelSelect } from './ModelSelect';

const entries = [
  { id: 'flux', name: 'Flux', provider: 'pollinations', kind: 'image', supportsReference: false, requiresReference: false, maxImages: 0, unmapped: false } as any,
  { id: 'wan-t2v', name: 'Wan T2V', provider: 'pollinations', kind: 'video', supportsReference: false, requiresReference: false, maxImages: 0, unmapped: false } as any,
];

describe('ModelSelect', () => {
  it('filters to the given mode', () => {
    render(<ModelSelect entries={entries} mode="t2i" value={null} onChange={() => {}} loading={false} fallbackActive={false} />);
    fireEvent.click(screen.getByRole('button', { name: /choose model/i }));
    expect(screen.getByText('Flux')).toBeInTheDocument();
    expect(screen.queryByText('Wan T2V')).not.toBeInTheDocument();
  });
  it('shows a fallback warning when fallbackActive', () => {
    render(<ModelSelect entries={entries} mode="t2i" value={null} onChange={() => {}} loading={false} fallbackActive={true} />);
    expect(screen.getByText(/offline list/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

```tsx
"use client";
import { useMemo, useState } from 'react';
import { isModelInMode, type PlaygroundMode } from '@/lib/playground/mode-mapping';
import type { PlaygroundModelEntry } from '@/lib/playground/model-source';

interface Props {
  entries: PlaygroundModelEntry[];
  mode: PlaygroundMode;
  value: string | null;
  onChange: (id: string) => void;
  loading: boolean;
  fallbackActive: boolean;
}

export function ModelSelect({ entries, mode, value, onChange, loading, fallbackActive }: Props) {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => entries.filter((e) => isModelInMode(e, mode)), [entries, mode]);
  const current = filtered.find((e) => e.id === value);
  return (
    <div className={`select ${open ? 'open' : ''}`}>
      {fallbackActive && <p className="warn">Offline list — live registry unavailable</p>}
      <button className="select-btn" onClick={() => setOpen((o) => !o)} aria-label="Choose model" disabled={loading || filtered.length === 0}>
        <span className="dot" aria-hidden />
        <span className="model-name">{current?.name ?? (loading ? 'Loading…' : 'No model')}</span>
      </button>
      {open && (
        <ul className="select-menu" role="listbox">
          {filtered.map((e) => (
            <li key={e.id}>
              <button
                className={`select-item ${e.id === value ? 'active' : ''}`}
                onClick={() => { onChange(e.id); setOpen(false); }}
              >
                <span>{e.name}</span>
                {e.unmapped && <span className="chip">unmapped</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/components/playground/ModelSelect.tsx src/components/playground/ModelSelect.test.tsx
git commit -m "feat(playground): model select with mode filter and fallback badge"
```

---

## Task 11: Prompt panel

**Files:**
- Create: `src/components/playground/PromptPanel.tsx`
- Create: `src/components/playground/PromptPanel.test.tsx`

**Interfaces:**
- Consumes: none new.
- Produces: `<PromptPanel value onChange onEnhance />` — textarea with char count and an `Enhance` button (calls `onEnhance` callback so parent can wire `/api/enhance-prompt`).

- [ ] **Step 1: Failing test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PromptPanel } from './PromptPanel';

describe('PromptPanel', () => {
  it('emits onChange when typing', () => {
    const onChange = jest.fn();
    render(<PromptPanel value="" onChange={onChange} onEnhance={() => {}} enhancing={false} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hi' } });
    expect(onChange).toHaveBeenCalledWith('hi');
  });
  it('disables Enhance when empty or enhancing', () => {
    const { rerender } = render(<PromptPanel value="" onChange={() => {}} onEnhance={() => {}} enhancing={false} />);
    expect(screen.getByRole('button', { name: /enhance/i })).toBeDisabled();
    rerender(<PromptPanel value="x" onChange={() => {}} onEnhance={() => {}} enhancing={true} />);
    expect(screen.getByRole('button', { name: /enhance/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

```tsx
"use client";
interface Props { value: string; onChange: (v: string) => void; onEnhance: () => void; enhancing: boolean; }
export function PromptPanel({ value, onChange, onEnhance, enhancing }: Props) {
  const disabled = enhancing || value.trim().length === 0;
  return (
    <div className="prompt-box">
      <div className="field-label"><span>Prompt</span><span className="hint">{value.length} / 1000</span></div>
      <textarea
        className="prompt-input"
        value={value}
        maxLength={1000}
        onChange={(e) => onChange(e.target.value)}
        placeholder="describe what you want to see..."
        rows={4}
      />
      <div className="prompt-actions">
        <button className="prompt-action" onClick={onEnhance} disabled={disabled}>
          {enhancing ? 'Enhancing…' : 'Enhance'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/components/playground/PromptPanel.tsx src/components/playground/PromptPanel.test.tsx
git commit -m "feat(playground): prompt panel with enhance action"
```

---

## Task 12: Reference uploads

**Files:**
- Create: `src/components/playground/ReferenceUploads.tsx`
- Create: `src/components/playground/ReferenceUploads.test.tsx`

**Interfaces:**
- Consumes: `uploadPlaygroundReference` helper (added in this task) that picks the right endpoint per provider (`/api/media/upload` for Pollinations, `/api/pruna/upload` for Pruna).
- Produces: `<ReferenceUploads model uploads onChange />` — slot grid whose count and labels come from the model entry (`maxImages`, `referenceMode`).

- [ ] **Step 1: Failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { ReferenceUploads } from './ReferenceUploads';

const model: any = { id: 'wan-i2v', name: 'Wan I2V', provider: 'pruna', kind: 'video', supportsReference: true, requiresReference: true, maxImages: 2, referenceMode: 'start-end-frame', unmapped: false };

describe('ReferenceUploads', () => {
  it('renders start/end labels for start-end-frame models', () => {
    render(<ReferenceUploads model={model} uploads={[]} onChange={() => {}} />);
    expect(screen.getByText(/start/i)).toBeInTheDocument();
    expect(screen.getByText(/end/i)).toBeInTheDocument();
  });
  it('renders nothing when the model does not support references', () => {
    const noref: any = { ...model, supportsReference: false, maxImages: 0 };
    const { container } = render(<ReferenceUploads model={noref} uploads={[]} onChange={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

```tsx
"use client";
import type { PlaygroundModelEntry } from '@/lib/playground/model-source';

function labelFor(model: PlaygroundModelEntry, i: number): string {
  if (model.referenceMode === 'start-end-frame') return i === 0 ? 'Start' : 'End';
  if (model.maxImages === 1) return 'Source';
  return `#${i + 1}`;
}

interface Props {
  model: PlaygroundModelEntry;
  uploads: string[];
  onChange: (u: string[]) => void;
}

export function ReferenceUploads({ model, uploads, onChange }: Props) {
  if (!model.supportsReference || model.maxImages === 0) return null;
  const slots = Array.from({ length: model.maxImages }, (_, i) => i);
  return (
    <div className="upload-slots" role="group" aria-label="Reference images">
      {slots.map((i) => {
        const url = uploads[i];
        return (
          <label key={i} className={`upload-slot ${url ? 'filled' : ''}`}>
            <span className="slot-label">{labelFor(model, i)}</span>
            {url
              ? <img src={url} alt="reference" />
              : <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const form = new FormData();
                    form.append('file', file);
                    const endpoint = model.provider === 'pruna' ? '/api/pruna/upload' : '/api/media/upload';
                    const res = await fetch(endpoint, { method: 'POST', body: form });
                    if (!res.ok) return;
                    const { url: uploadedUrl } = await res.json();
                    const next = [...uploads];
                    next[i] = uploadedUrl;
                    onChange(next);
                  }}
                />}
          </label>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/components/playground/ReferenceUploads.tsx src/components/playground/ReferenceUploads.test.tsx
git commit -m "feat(playground): reference uploads with per-provider endpoint routing"
```

---

## Task 13: Aspect ratio pills

**Files:**
- Create: `src/components/playground/AspectRatioPills.tsx`

**Interfaces:**
- Consumes: `getAspectRatioPresetsForModel` from `@/config/image-aspect-ratio-presets`.
- Produces: `<AspectRatioPills modelId value onChange />`.

- [ ] **Step 1: Implement (thin wrapper — no dedicated test file, covered by shell integration)**

```tsx
"use client";
import { getAspectRatioPresetsForModel } from '@/config/image-aspect-ratio-presets';

export function AspectRatioPills({ modelId, value, onChange }: { modelId: string; value: string | null; onChange: (r: string) => void }) {
  const presets = getAspectRatioPresetsForModel(modelId);
  if (presets.length === 0) return null;
  return (
    <div className="pill-row">
      {presets.map((p) => (
        <button
          key={p.id ?? p.aspectRatio ?? p.label}
          type="button"
          className={`pill ${value === (p.aspectRatio ?? p.id) ? 'active' : ''}`}
          onClick={() => onChange(p.aspectRatio ?? p.id ?? p.label)}
        >
          {p.label ?? p.aspectRatio}
        </button>
      ))}
    </div>
  );
}
```

Verify preset property names against `src/config/image-aspect-ratio-presets.ts` before running — if the property names differ (`aspectRatio` vs `ratio` vs `value`), adjust to match the actual shape.

- [ ] **Step 2: Commit**

```bash
git add src/components/playground/AspectRatioPills.tsx
git commit -m "feat(playground): aspect-ratio pills wrapper over existing presets"
```

---

## Task 14: Duration slider

**Files:**
- Create: `src/components/playground/DurationSlider.tsx`

**Interfaces:**
- Consumes: `getDurationOptionsSeconds`, `getDefaultDurationSeconds`, `getUnifiedModel` from `@/config/unified-image-models`.
- Produces: `<DurationSlider modelId value onChange />`.

- [ ] **Step 1: Implement**

```tsx
"use client";
import { getDurationOptionsSeconds, getDefaultDurationSeconds, getUnifiedModel } from '@/config/unified-image-models';

export function DurationSlider({ modelId, value, onChange }: { modelId: string; value: number | null; onChange: (v: number) => void }) {
  const model = getUnifiedModel(modelId);
  const options = getDurationOptionsSeconds(model);
  if (options.length === 0) return null;
  const min = options[0];
  const max = options[options.length - 1];
  const step = options.length > 1 ? options[1] - options[0] : 1;
  const current = value ?? getDefaultDurationSeconds(model) ?? min;
  const pct = max === min ? 100 : ((current - min) / (max - min)) * 100;
  return (
    <div className="slider-row">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{ ['--slider-pct' as any]: `${pct}%` }}
      />
      <div className="slider-value">{current}s</div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/playground/DurationSlider.tsx
git commit -m "feat(playground): duration slider bound to model's temporalControl"
```

---

## Task 15: Advanced panel

**Files:**
- Create: `src/components/playground/AdvancedPanel.tsx`

**Interfaces:**
- Consumes: `unifiedModelConfigs` from `@/config/unified-model-configs` to know which advanced inputs (seed, guidance, steps, negative prompt) the current model actually accepts.
- Produces: `<AdvancedPanel modelId values onChange />`.

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState } from 'react';
import { unifiedModelConfigs } from '@/config/unified-model-configs';

type Vals = { seed: string; negativePrompt: string; guidance: string; steps: string };
type Field = keyof Vals;

const KNOWN: Record<Field, string> = {
  seed: 'seed',
  negativePrompt: 'negative_prompt',
  guidance: 'guidance',
  steps: 'steps',
};

export function AdvancedPanel({ modelId, values, onChange }: { modelId: string; values: Vals; onChange: (patch: Partial<Vals>) => void }) {
  const [open, setOpen] = useState(false);
  const inputs = unifiedModelConfigs[modelId]?.inputs ?? [];
  const accepted = new Set(inputs.map((i) => i.name));
  const visibleFields = (Object.keys(KNOWN) as Field[]).filter((f) => accepted.has(KNOWN[f]));
  if (visibleFields.length === 0) return null;

  return (
    <div className={`advanced ${open ? 'open' : ''}`}>
      <button className="advanced-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>Advanced</span>
      </button>
      {open && (
        <div className="advanced-body">
          {visibleFields.map((f) => (
            <div className="mini-field" key={f}>
              <label htmlFor={f}>{f}</label>
              <input id={f} value={values[f]} onChange={(e) => onChange({ [f]: e.target.value } as Partial<Vals>)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/playground/AdvancedPanel.tsx
git commit -m "feat(playground): advanced panel filtered by model's accepted inputs"
```

---

## Task 16: Generate request builder

**Files:**
- Create: `src/lib/playground/generate-request.ts`
- Create: `src/lib/playground/generate-request.test.ts`

**Interfaces:**
- Consumes: `PlaygroundState` from `usePlaygroundState`, `PlaygroundModelEntry` from `model-source`.
- Produces:
  ```ts
  export interface GenerateBody {
    prompt: string; model: string;
    aspectRatio?: string; duration?: number; audio?: boolean;
    seed?: number; negative_prompt?: string;
    image?: string | string[]; srcRefImages?: string[]; video?: string;
  }
  export function buildGenerateBody(state: PlaygroundState, model: PlaygroundModelEntry): GenerateBody;
  export function buildGenerateHeaders(pollenKey?: string, prunaKey?: string): Record<string, string>;
  ```

- [ ] **Step 1: Failing test**

```ts
import { buildGenerateBody, buildGenerateHeaders } from './generate-request';

const modelPruna: any = { id: 'wan-i2v', provider: 'pruna', kind: 'video', supportsReference: true, requiresReference: true, maxImages: 2, referenceMode: 'start-end-frame', unmapped: false, name: 'Wan I2V' };
const modelPollen: any = { id: 'flux', provider: 'pollinations', kind: 'image', supportsReference: false, requiresReference: false, maxImages: 0, unmapped: false, name: 'Flux' };

const baseState: any = { mode: 't2i', modelId: null, prompt: 'hi', aspectRatio: '1:1', durationSeconds: null, seed: '', negativePrompt: '', guidance: '', steps: '', uploads: [], sourceVideo: null };

describe('buildGenerateBody', () => {
  it('passes uploads as `image` array for start-end-frame', () => {
    const body = buildGenerateBody({ ...baseState, uploads: ['a', 'b'], durationSeconds: 5 }, modelPruna);
    expect(body.image).toEqual(['a', 'b']);
    expect(body.duration).toBe(5);
  });
  it('omits image when no uploads', () => {
    const body = buildGenerateBody(baseState, modelPollen);
    expect(body.image).toBeUndefined();
  });
  it('parses seed as number and drops it when empty', () => {
    const withSeed = buildGenerateBody({ ...baseState, seed: '42' }, modelPollen);
    expect(withSeed.seed).toBe(42);
    const noSeed = buildGenerateBody(baseState, modelPollen);
    expect(noSeed.seed).toBeUndefined();
  });
});

describe('buildGenerateHeaders', () => {
  it('sends both headers when both keys are set', () => {
    expect(buildGenerateHeaders('p', 'q')).toEqual({ 'X-Pollen-Key': 'p', 'X-Pruna-Key': 'q' });
  });
  it('omits headers when a key is empty', () => {
    expect(buildGenerateHeaders(undefined, 'q')).toEqual({ 'X-Pruna-Key': 'q' });
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

```ts
import type { PlaygroundState } from '@/hooks/usePlaygroundState';
import type { PlaygroundModelEntry } from './model-source';

export interface GenerateBody {
  prompt: string;
  model: string;
  aspectRatio?: string;
  duration?: number;
  audio?: boolean;
  seed?: number;
  negative_prompt?: string;
  image?: string | string[];
  srcRefImages?: string[];
  video?: string;
}

export function buildGenerateBody(state: PlaygroundState, model: PlaygroundModelEntry): GenerateBody {
  const body: GenerateBody = { prompt: state.prompt, model: model.id };
  if (state.aspectRatio) body.aspectRatio = state.aspectRatio;
  if (state.durationSeconds != null) body.duration = state.durationSeconds;
  const seedNum = state.seed.trim() ? parseInt(state.seed.trim(), 10) : NaN;
  if (!Number.isNaN(seedNum)) body.seed = seedNum;
  if (state.negativePrompt.trim()) body.negative_prompt = state.negativePrompt.trim();
  if (state.uploads.length > 0) {
    body.image = state.uploads.length === 1 ? state.uploads[0] : [...state.uploads];
  }
  if (state.sourceVideo) body.video = state.sourceVideo;
  return body;
}

export function buildGenerateHeaders(pollenKey?: string, prunaKey?: string): Record<string, string> {
  const h: Record<string, string> = {};
  if (pollenKey) h['X-Pollen-Key'] = pollenKey;
  if (prunaKey) h['X-Pruna-Key'] = prunaKey;
  return h;
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/playground/generate-request.ts src/lib/playground/generate-request.test.ts
git commit -m "feat(playground): generate request/header builders"
```

---

## Task 17: Generate button

**Files:**
- Create: `src/components/playground/GenerateButton.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `<GenerateButton state onClick onCancel />` — three visual states: `idle`, `working` (shows cancel), `disabled`.

- [ ] **Step 1: Implement**

```tsx
"use client";
type State = 'idle' | 'working' | 'disabled';
interface Props { state: State; onClick: () => void; onCancel: () => void; }
export function GenerateButton({ state, onClick, onCancel }: Props) {
  if (state === 'working') {
    return <button className="generate working" onClick={onCancel} aria-label="Cancel">Cancel</button>;
  }
  return (
    <button className="generate" onClick={onClick} disabled={state === 'disabled'}>
      Generate
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/playground/GenerateButton.tsx
git commit -m "feat(playground): generate button with cancel"
```

---

## Task 18: Hero component

**Files:**
- Create: `src/components/playground/Hero.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `<Hero state={'empty'|'working'|'ready'} media?={{url,kind:'image'|'video',prompt,modelName,ratio,durationSeconds}} error?={string} />`.

- [ ] **Step 1: Implement**

```tsx
"use client";
export interface HeroMedia { url: string; kind: 'image' | 'video'; prompt: string; modelName: string; ratio?: string | null; durationSeconds?: number | null; }
interface Props { state: 'empty' | 'working' | 'ready' | 'error'; media?: HeroMedia; error?: string; }

export function Hero({ state, media, error }: Props) {
  return (
    <div className="hero" data-state={state}>
      {state === 'empty' && <p>Ready to generate</p>}
      {state === 'working' && <div className="spinner" aria-label="Generating" />}
      {state === 'ready' && media && (
        <>
          <div className="frame">
            {media.kind === 'video'
              ? <video src={media.url} controls autoPlay loop />
              : <img src={media.url} alt={media.prompt} />}
          </div>
          <div className="hero-meta">
            <strong>{media.modelName}</strong>
            {media.ratio && <span> · {media.ratio}</span>}
            {media.durationSeconds != null && <span> · {media.durationSeconds}s</span>}
          </div>
        </>
      )}
      {state === 'error' && <p role="alert">{error ?? 'Something went wrong'}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/playground/Hero.tsx
git commit -m "feat(playground): hero component with empty/working/ready/error states"
```

---

## Task 19: Gallery

**Files:**
- Create: `src/components/playground/Gallery.tsx`
- Create: `src/components/playground/Gallery.test.tsx`

**Interfaces:**
- Consumes: `OutputService` from `@/lib/services/output-service`.
- Produces: `<Gallery onPick(asset) />` — renders latest 50 assets with tag `source: 'playground'`, click loads asset back into the shell.

- [ ] **Step 1: Failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { Gallery } from './Gallery';

jest.mock('@/lib/services/output-service', () => ({
  OutputService: { listBySource: jest.fn(async () => [
    { id: '1', url: 'https://x/1.png', kind: 'image', prompt: 'a', modelId: 'flux', createdAt: 1 },
  ])}
}));

describe('Gallery', () => {
  it('renders items with model name and prompt', async () => {
    render(<Gallery onPick={() => {}} />);
    expect(await screen.findByText(/flux/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement — plus add `listBySource(source: string, limit = 50)` to `OutputService` in the same task (small addition)**

Extend `src/lib/services/output-service.ts` with:

```ts
async listBySource(source: string, limit = 50) {
  return this.db.assets.where('source').equals(source).reverse().sortBy('createdAt').then((rows) => rows.slice(0, limit));
}
```

Only add the method — do not change existing behavior. The `assets` table already has an indexed `source` field (verify in `src/lib/db.ts`; if it doesn't, use a `filter` fallback rather than adding an index in this milestone).

`src/components/playground/Gallery.tsx`:

```tsx
"use client";
import { useEffect, useState } from 'react';
import { OutputService } from '@/lib/services/output-service';

interface Item { id: string; url: string; kind: 'image' | 'video'; prompt: string; modelId: string; createdAt: number; }
export function Gallery({ onPick }: { onPick: (item: Item) => void }) {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    let cancelled = false;
    OutputService.listBySource('playground').then((rows) => { if (!cancelled) setItems(rows as Item[]); });
    return () => { cancelled = true; };
  }, []);
  return (
    <div className="gallery-grid">
      {items.map((it) => (
        <button key={it.id} className="gallery-item" onClick={() => onPick(it)}>
          {it.kind === 'video'
            ? <video src={it.url} muted playsInline />
            : <img src={it.url} alt={it.prompt} />}
          <div className="item-meta"><span>{it.modelId}</span></div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/components/playground/Gallery.tsx src/components/playground/Gallery.test.tsx src/lib/services/output-service.ts
git commit -m "feat(playground): gallery from OutputService with source tag"
```

---

## Task 20: Wire the shell — enhance callback, generate flow, reset-on-model-change

**Files:**
- Modify: `src/app/playground/PlaygroundShell.tsx`

**Interfaces:**
- Consumes: everything from tasks 2–19.
- Produces: fully wired sidebar + hero + gallery. On generate: POST `/api/generate` with the built body and headers, handle JSON `{imageUrl}` / `{videoUrl}` or raw binary body (Pruna without Pollen key) via `BlobManager.register(context:'playground')`, persist via `OutputService.save({source:'playground', ...})`, then reload gallery and swap hero to `ready`.

- [ ] **Step 1: Assemble the shell**

Replace `PlaygroundShell.tsx` body with:

```tsx
"use client";
import { useEffect, useRef, useState } from 'react';
import styles from './playground.module.css';
import { ProviderSwitch } from '@/components/playground/ProviderSwitch';
import { ApiKeyField } from '@/components/playground/ApiKeyField';
import { ModeSwitch } from '@/components/playground/ModeSwitch';
import { ModelSelect } from '@/components/playground/ModelSelect';
import { PromptPanel } from '@/components/playground/PromptPanel';
import { ReferenceUploads } from '@/components/playground/ReferenceUploads';
import { AspectRatioPills } from '@/components/playground/AspectRatioPills';
import { DurationSlider } from '@/components/playground/DurationSlider';
import { AdvancedPanel } from '@/components/playground/AdvancedPanel';
import { GenerateButton } from '@/components/playground/GenerateButton';
import { Hero, type HeroMedia } from '@/components/playground/Hero';
import { Gallery } from '@/components/playground/Gallery';
import { usePlaygroundState } from '@/hooks/usePlaygroundState';
import { usePlaygroundModels } from '@/hooks/usePlaygroundModels';
import { usePollenKey } from '@/hooks/usePollenKey';
import { buildGenerateBody, buildGenerateHeaders } from '@/lib/playground/generate-request';
import { isModelInMode } from '@/lib/playground/mode-mapping';
import { getDefaultDurationSeconds, getUnifiedModel } from '@/config/unified-image-models';
import { getAspectRatioPresetsForModel } from '@/config/image-aspect-ratio-presets';
import { BlobManager } from '@/lib/blob-manager';
import { OutputService } from '@/lib/services/output-service';

export function PlaygroundShell() {
  const { state, setMode, setModelId, setPrompt, setAspectRatio, setDurationSeconds, setAdvanced, setUploads, resetForModel } = usePlaygroundState();
  const { entries, loading, fallbackActive } = usePlaygroundModels();
  const { pollenKey } = usePollenKey();
  const [enhancing, setEnhancing] = useState(false);
  const [heroState, setHeroState] = useState<'empty'|'working'|'ready'|'error'>('empty');
  const [heroMedia, setHeroMedia] = useState<HeroMedia | undefined>();
  const [heroError, setHeroError] = useState<string | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  const modeEntries = entries.filter((e) => isModelInMode(e, state.mode));
  const currentModel = modeEntries.find((e) => e.id === state.modelId) ?? modeEntries[0];

  useEffect(() => {
    if (currentModel && state.modelId !== currentModel.id) setModelId(currentModel.id);
  }, [currentModel?.id]);

  useEffect(() => {
    if (!currentModel) return;
    const presets = getAspectRatioPresetsForModel(currentModel.id);
    const defaultRatio = presets[0]?.aspectRatio ?? presets[0]?.id ?? null;
    const defaultDuration = getDefaultDurationSeconds(getUnifiedModel(currentModel.id)) ?? null;
    resetForModel({
      aspectRatio: state.aspectRatio && presets.some((p) => (p.aspectRatio ?? p.id) === state.aspectRatio) ? state.aspectRatio : defaultRatio,
      durationSeconds: state.durationSeconds ?? defaultDuration,
      uploads: state.uploads.slice(0, currentModel.maxImages),
    });
  }, [currentModel?.id]);

  const onEnhance = async () => {
    if (!state.prompt.trim()) return;
    setEnhancing(true);
    try {
      const res = await fetch('/api/enhance-prompt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: state.prompt }) });
      const data = await res.json();
      if (data?.enhanced) setPrompt(data.enhanced);
    } finally {
      setEnhancing(false);
    }
  };

  const onGenerate = async () => {
    if (!currentModel || !state.prompt.trim()) return;
    setHeroState('working');
    setHeroError(undefined);
    const body = buildGenerateBody(state, currentModel);
    const prunaKey = typeof window !== 'undefined' ? (localStorage.getItem('prunaApiKey') ?? undefined) : undefined;
    const headers = { 'Content-Type': 'application/json', ...buildGenerateHeaders(pollenKey || undefined, prunaKey || undefined) };
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers, body: JSON.stringify(body), signal: ctrl.signal });
      if (!res.ok) throw new Error(`generate ${res.status}: ${await res.text()}`);
      const ct = res.headers.get('content-type') ?? '';
      let mediaUrl: string;
      let kind: 'image' | 'video';
      if (ct.startsWith('application/json')) {
        const data = await res.json();
        mediaUrl = data.videoUrl ?? data.imageUrl;
        kind = data.videoUrl ? 'video' : 'image';
      } else {
        const blob = await res.blob();
        mediaUrl = BlobManager.register(blob, 'playground');
        kind = ct.startsWith('video/') ? 'video' : 'image';
      }
      await OutputService.save({ url: mediaUrl, kind, prompt: state.prompt, modelId: currentModel.id, source: 'playground', createdAt: Date.now() });
      setHeroMedia({ url: mediaUrl, kind, prompt: state.prompt, modelName: currentModel.name, ratio: state.aspectRatio, durationSeconds: state.durationSeconds });
      setHeroState('ready');
    } catch (e) {
      if ((e as Error).name === 'AbortError') { setHeroState('empty'); return; }
      setHeroError((e as Error).message);
      setHeroState('error');
    } finally {
      abortRef.current = null;
    }
  };

  const genDisabled = loading || !currentModel || !state.prompt.trim();
  const genState = heroState === 'working' ? 'working' : (genDisabled ? 'disabled' : 'idle');

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <div className={styles.logo}><span className={styles.logoDot} aria-hidden /><span>heyhi</span><span className={styles.slash}>/</span><span className={styles.sub}>playground</span></div>
      </header>
      <main className={styles.workspace}>
        <aside className={styles.params}>
          <div className={styles.paramsScroll}>
            <ProviderSwitch />
            <ApiKeyField />
            <ModeSwitch value={state.mode} onChange={setMode} />
            <ModelSelect entries={entries} mode={state.mode} value={state.modelId} onChange={setModelId} loading={loading} fallbackActive={fallbackActive} />
            <PromptPanel value={state.prompt} onChange={setPrompt} onEnhance={onEnhance} enhancing={enhancing} />
            {currentModel && <ReferenceUploads model={currentModel} uploads={state.uploads} onChange={setUploads} />}
            {currentModel && <AspectRatioPills modelId={currentModel.id} value={state.aspectRatio} onChange={setAspectRatio} />}
            {currentModel && <DurationSlider modelId={currentModel.id} value={state.durationSeconds} onChange={setDurationSeconds} />}
            {currentModel && <AdvancedPanel modelId={currentModel.id} values={{ seed: state.seed, negativePrompt: state.negativePrompt, guidance: state.guidance, steps: state.steps }} onChange={setAdvanced} />}
          </div>
          <div className={styles.paramsFooter}>
            <GenerateButton state={genState} onClick={onGenerate} onCancel={() => abortRef.current?.abort()} />
          </div>
        </aside>
        <section className={styles.output}>
          <Hero state={heroState} media={heroMedia} error={heroError} />
          <Gallery onPick={(item) => {
            setModelId(item.modelId);
            setPrompt(item.prompt);
            setHeroMedia({ url: item.url, kind: item.kind, prompt: item.prompt, modelName: item.modelId });
            setHeroState('ready');
          }} />
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Manual smoke — every path**

Run `npm run dev`. Verify in a browser:

1. Provider switch flips model list; Pruna without key shows empty select.
2. `Test` on the key field lights the green dot with a valid key.
3. Enter a prompt, pick `flux`, click Generate — hero shows spinner then image, gallery gets a new tile.
4. Switch to `zimage` (Pruna, with key) and Generate — expect an image via the Pruna path.
5. Change model to `wan-i2v` — mode auto-restricts to I2V, upload slots appear labeled Start/End.
6. Cancel a running generate — hero returns to empty.
7. Reload the page — provider, mode, model, prompt, ratio survive.

- [ ] **Step 3: Commit**

```bash
git add src/app/playground/PlaygroundShell.tsx
git commit -m "feat(playground): wire full sidebar+hero+gallery generate flow"
```

---

## Task 21: Mobile bar + bottomsheet

**Files:**
- Create: `src/components/playground/MobileBar.tsx`
- Modify: `src/app/playground/PlaygroundShell.tsx` (mount `<MobileBar />`, add `mobile-open` toggle on the params aside)
- Modify: `src/app/playground/playground.module.css` (already carries the mobile rules from Task 3)

**Interfaces:**
- Produces: `<MobileBar prompt onPrompt onGenerate onOpenParams />`.

- [ ] **Step 1: Implement**

```tsx
"use client";
export function MobileBar({ prompt, onPrompt, onGenerate, onOpenParams }: { prompt: string; onPrompt: (v: string) => void; onGenerate: () => void; onOpenParams: () => void }) {
  return (
    <div className="mobile-bar mobile-only">
      <button className="settings-btn" onClick={onOpenParams} aria-label="Settings">⚙</button>
      <input value={prompt} onChange={(e) => onPrompt(e.target.value)} placeholder="quick prompt..." />
      <button className="generate-mobile" onClick={onGenerate}>Generate</button>
    </div>
  );
}
```

- [ ] **Step 2: Mount in shell**

In `PlaygroundShell.tsx`, add `const [mobileOpen, setMobileOpen] = useState(false);`, toggle `mobile-open` on the `<aside>` className based on that flag, mount `<MobileBar ... onOpenParams={() => setMobileOpen(true)} />` right before the closing `</div>` of the app.

- [ ] **Step 3: Verify**

Resize the browser to 375×812 (or use the responsive dev tool). Confirm the params panel is hidden by default, opens as a bottom sheet from the `⚙` button, closes with the `✕`, mobile bar Generate works.

- [ ] **Step 4: Commit**

```bash
git add src/components/playground/MobileBar.tsx src/app/playground/PlaygroundShell.tsx
git commit -m "feat(playground): mobile bar and bottom-sheet params"
```

---

## Task 22: Sidebar link + translations + verification pass

**Files:**
- Modify: `src/components/layout/AppSidebar.tsx`
- Modify: `src/config/translations.ts`

- [ ] **Step 1: Add sidebar link**

In `AppSidebar.tsx`, add near the bottom of the primary nav a link element:

```tsx
<Link href="/playground" className="sidebar-link" data-testid="playground-link">
  {t('playground.sidebarLink', 'Playground →')}
</Link>
```

Match the surrounding styling and translation call convention already used in that file.

- [ ] **Step 2: Add translation keys**

In `src/config/translations.ts`, add under both `de` and `en`:

```
playground.sidebarLink: 'Playground →'
playground.title: 'Playground'
playground.prunaEmpty: 'Add a Pruna key to unlock 14 Pruna models'
playground.fallbackNotice: 'Offline list — live registry unavailable'
playground.generate: 'Generate'
playground.cancel: 'Cancel'
playground.enhance: 'Enhance'
```

Use the same string values for both languages initially; refine German copy in a follow-up.

Update the components to consume translations where user-facing strings appear (`ModelSelect` fallback banner, `GenerateButton`, `PromptPanel`, empty state text).

- [ ] **Step 3: End-to-end verification**

Run:

```
CI=1 npm test -- --runInBand
npm run typecheck
npm run lint
npm run dev
```

Verify in the browser:

1. Sidebar shows `Playground →`, click navigates to `/playground`.
2. Cold-load with no keys: Pollinations shows free live models only; Pruna shows empty state.
3. Add Pollen key: `Test` turns green; more models appear if the key is paid.
4. Add Pruna key: switch to Pruna; all 14 non-hidden Pruna models appear; `p-image-try-on` / `p-video-avatar` are NOT in the list.
5. Generate one T2I (Pollinations `flux`), one T2V (Pollinations video model), one Pruna T2I (`zimage`), one Pruna I2V (`wan-i2v` with an uploaded start frame).
6. Reload — state persists; gallery persists.
7. Kill the network to `gen.pollinations.ai` (browser DevTools), reload — model list shows the offline banner and still lets you pick free models.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/AppSidebar.tsx src/config/translations.ts src/components/playground
git commit -m "feat(playground): sidebar link + translations + integration polish"
```

---

## Self-Review Checklist (performed while writing this plan)

- **Spec coverage:** Sections 1–11 of the spec are each covered by explicit tasks — route (1), layout structure (2, 3, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21), provider switch/keys (3, 4), model list source (5, 6, 7, 8), params panel (11, 12, 13, 14, 15), generate flow (16, 17, 20), persistence (2, 19), new/touched files (1–22), error handling (all component tests + Task 20 wiring), testing strategy (each task has a test step), sidebar link + translations (22). Follow-ups explicitly out of scope — matches spec §11.
- **Placeholder scan:** No `TBD`, no `TODO`, no "handle edge cases" fluff. Every code block is complete enough to compile with only trivial edits (aspect-ratio preset property name in Task 13 is called out to verify).
- **Type consistency:** `PlaygroundMode` defined identically in `usePlaygroundState` and `mode-mapping`; `PlaygroundModelEntry` produced in Task 7 and consumed unchanged in Tasks 10, 12, 16, 20; header set `{ 'X-Pollen-Key', 'X-Pruna-Key' }` matches server resolvers used by `/api/generate` and `/api/capabilities`.
- **Ambiguity:** `PRUNA_REQUIRES_REF` set in Task 7 is authoritative; if a Pruna model's requirement changes upstream, edit that set in one place.
