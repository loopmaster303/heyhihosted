# High-Priority Security And Search Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the two highest-priority audit risks by locking down remote media fetches and collapsing chat search/research to a single upstream strategy per request.

**Architecture:** Keep both fixes small and central. Introduce one shared remote-URL policy helper for the media surfaces, and one explicit routing-policy helper for `/api/chat/completion` so the route chooses either context prefetch or delegated search/research, but never both. Follow the existing route-test style instead of inventing a new test harness.

**Tech Stack:** Next.js 16 route handlers, TypeScript, Jest, zod, existing Pollinations chat/media integration.

---

## File Structure

### Security / Remote Fetch Policy
- Create: `src/lib/media/remote-fetch-policy.ts`
  - Central allowlist + protocol rules for remote fetches used by server routes.
- Create: `src/lib/media/__tests__/remote-fetch-policy.test.ts`
  - Unit tests for allowed/rejected URLs and private-network edge cases.
- Modify: `src/app/api/media/ingest/route.ts`
  - Validate `sourceUrl` before polling; reject unsafe URLs early; avoid buffering obviously invalid sources.
- Modify: `src/app/api/proxy-image/route.ts`
  - Either delete the route if truly unused, or apply the same shared policy and return `400/403` for blocked sources.

### Search / Research Single-Strategy Policy
- Create: `src/lib/chat/chat-search-strategy.ts`
  - Small pure helper that decides the request path: direct model, delegated live search, delegated deep research, or legacy context-injection path if explicitly retained.
- Create: `src/lib/chat/__tests__/chat-search-strategy.test.ts`
  - Unit tests proving that delegated search/research disables web-context prefetch.
- Modify: `src/app/api/chat/completion/route.ts`
  - Replace the current double-decision block with the shared helper.
- Modify: `src/lib/services/web-context-service.ts`
  - Keep the service focused on context fetching only; remove assumptions that it is part of the default search path.

### Verification / Docs
- Modify: `docs/PRODUCT_AUDIT_2026-03-13.md`
  - Mark the two high findings as in-progress or resolved after implementation.
- Modify: `CLAUDE.md`
- Modify: `GEMINI.md`
  - Only if the final chosen behavior changes current active architecture notes.

## Chunk 1: Lock Down Remote Fetch Surfaces

### Task 1: Define the shared remote-fetch policy

**Files:**
- Create: `src/lib/media/remote-fetch-policy.ts`
- Test: `src/lib/media/__tests__/remote-fetch-policy.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { isAllowedRemoteMediaUrl } from '../remote-fetch-policy';

describe('remote media policy', () => {
  it('allows current Pollinations media origins', () => {
    expect(isAllowedRemoteMediaUrl('https://media.pollinations.ai/hash')).toBe(true);
    expect(isAllowedRemoteMediaUrl('https://gen.pollinations.ai/image/...')).toBe(true);
  });

  it('rejects non-https and private-network targets', () => {
    expect(isAllowedRemoteMediaUrl('http://media.pollinations.ai/hash')).toBe(false);
    expect(isAllowedRemoteMediaUrl('http://127.0.0.1:3000/test.png')).toBe(false);
    expect(isAllowedRemoteMediaUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand src/lib/media/__tests__/remote-fetch-policy.test.ts`
Expected: FAIL because the helper does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

Implementation notes:
- Parse with `new URL(...)`
- Require `https:`
- Allow only the currently needed Pollinations origins for generated/hosted media
- Reject loopback, localhost, RFC1918 private ranges, and link-local addresses
- Return a small structured result if that makes route error handling clearer

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand src/lib/media/__tests__/remote-fetch-policy.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/media/remote-fetch-policy.ts src/lib/media/__tests__/remote-fetch-policy.test.ts
git commit -m "test: add remote media fetch policy"
```

### Task 2: Apply the policy to `/api/media/ingest`

**Files:**
- Modify: `src/app/api/media/ingest/route.ts`
- Test: `src/app/api/media/ingest/route.test.ts`

- [ ] **Step 1: Write the failing route test**

```ts
import { POST } from './route';

jest.mock('@/lib/resolve-pollen-key', () => ({
  resolvePollenKey: jest.fn(() => 'sk_test'),
}));

describe('/api/media/ingest', () => {
  it('rejects disallowed source URLs before fetching', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const request = new Request('http://localhost/api/media/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceUrl: 'http://127.0.0.1:3000/pwn.png', kind: 'image' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand src/app/api/media/ingest/route.test.ts`
Expected: FAIL because the route currently accepts arbitrary URLs.

- [ ] **Step 3: Implement the minimal route change**

Implementation notes:
- Validate `sourceUrl` via the shared helper before entering the polling loop
- Return a clear client error (`400` or `403`) for blocked URLs
- Keep the existing happy path unchanged for valid Pollinations media sources
- If practical, add a fast-path size/content sanity check before creating the final `Buffer`

- [ ] **Step 4: Run the route test**

Run: `npm test -- --runInBand src/app/api/media/ingest/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/media/ingest/route.ts src/app/api/media/ingest/route.test.ts
git commit -m "fix: restrict media ingest source urls"
```

### Task 3: Remove or harden `/api/proxy-image`

**Files:**
- Modify or Delete: `src/app/api/proxy-image/route.ts`
- Test: `src/app/api/proxy-image/route.test.ts`
- Modify: `CLAUDE.md`
- Modify: `GEMINI.md`

- [ ] **Step 1: Confirm current route usage**

Run: `rg -n "/api/proxy-image|proxy-image" src`
Expected: No internal callsites, or a very small known set.

- [ ] **Step 2: Choose the smallest safe path**

Recommended path:
- If there are no real callsites, remove the route and strip active-doc references.
- If the route must stay for compatibility, apply the shared allowlist and reject unknown hosts early.

- [ ] **Step 3: Write the failing test for the chosen path**

Example keep-route test:

```ts
import { GET } from './route';

describe('/api/proxy-image', () => {
  it('rejects disallowed remote urls', async () => {
    const response = await GET(new Request('http://localhost/api/proxy-image?url=http://127.0.0.1:3000/x.png'));
    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 4: Implement the minimal change**

Implementation notes:
- Prefer deletion if dead
- Otherwise reuse the same policy helper, do not duplicate host logic in the route

- [ ] **Step 5: Run the targeted test**

Run: `npm test -- --runInBand src/app/api/proxy-image/route.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/api/proxy-image/route.ts src/app/api/proxy-image/route.test.ts CLAUDE.md GEMINI.md
git commit -m "fix: harden image proxy surface"
```

## Chunk 2: Remove Search / Research Double Calls

### Task 4: Extract a pure search-strategy helper

**Files:**
- Create: `src/lib/chat/chat-search-strategy.ts`
- Test: `src/lib/chat/__tests__/chat-search-strategy.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { resolveChatSearchStrategy } from '../chat-search-strategy';

describe('resolveChatSearchStrategy', () => {
  it('delegates live-search queries to the live-search model without web-context prefetch', () => {
    expect(resolveChatSearchStrategy({
      modelId: 'gemini-fast',
      userQuery: 'bitcoin price today',
      smartRouterEnabled: true,
      webBrowsingEnabled: false,
    })).toMatchObject({
      routedModelId: 'perplexity-fast',
      shouldFetchWebContext: false,
      strategy: 'delegated-live-search',
    });
  });

  it('delegates deep-research queries to nomnom without web-context prefetch', () => {
    expect(resolveChatSearchStrategy({
      modelId: 'gemini-fast',
      userQuery: 'deep research on lithium supply chain',
      smartRouterEnabled: true,
      webBrowsingEnabled: true,
    })).toMatchObject({
      routedModelId: 'nomnom',
      shouldFetchWebContext: false,
      strategy: 'delegated-deep-research',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand src/lib/chat/__tests__/chat-search-strategy.test.ts`
Expected: FAIL because the helper does not exist yet.

- [ ] **Step 3: Implement the minimal strategy helper**

Implementation notes:
- Preserve current `SmartRouter.shouldRouteToSearch(...)`
- For delegated live-search and deep-research, route directly and set `shouldFetchWebContext = false`
- Keep a standard/direct path for non-search queries
- Only keep a context-prefetch path if there is still a real non-delegated use case

- [ ] **Step 4: Run the strategy tests**

Run: `npm test -- --runInBand src/lib/chat/__tests__/chat-search-strategy.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat/chat-search-strategy.ts src/lib/chat/__tests__/chat-search-strategy.test.ts
git commit -m "test: codify single-path chat search routing"
```

### Task 5: Wire `/api/chat/completion` to the new policy

**Files:**
- Modify: `src/app/api/chat/completion/route.ts`
- Test: `src/app/api/chat/completion/route.test.ts`

- [ ] **Step 1: Write the failing route test**

```ts
import { POST } from './route';

const getContextMock = jest.fn();
const httpsPostMock = jest.fn();

jest.mock('@/lib/services/web-context-service', () => ({
  WebContextService: { getContext: (...args: unknown[]) => getContextMock(...args), injectIntoSystemPrompt: jest.fn((p: string) => p) },
}));

jest.mock('@/lib/https-post', () => ({
  httpsPost: (...args: unknown[]) => httpsPostMock(...args),
}));

describe('/api/chat/completion', () => {
  it('does not prefetch web context when the request is delegated to live search', async () => {
    // build request for "bitcoin price today"
    // expect getContextMock not called
    // expect httpsPostMock called once with model perplexity-fast
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand src/app/api/chat/completion/route.test.ts`
Expected: FAIL because the current route still fetches context before the final completion call.

- [ ] **Step 3: Implement the minimal route refactor**

Implementation notes:
- Replace the local decision block with the pure helper result
- Keep the system date handling
- Only call `WebContextService.getContext(...)` when the helper explicitly says so
- Preserve the final response shape exactly

- [ ] **Step 4: Run the route test**

Run: `npm test -- --runInBand src/app/api/chat/completion/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/chat/completion/route.ts src/app/api/chat/completion/route.test.ts
git commit -m "fix: remove duplicate search context calls"
```

### Task 6: Trim `WebContextService` to its actual remaining role

**Files:**
- Modify: `src/lib/services/web-context-service.ts`
- Modify: `docs/PRODUCT_AUDIT_2026-03-13.md`
- Modify: `CLAUDE.md`
- Modify: `GEMINI.md`

- [ ] **Step 1: Update code comments and service docs**

Make sure the service describes itself as optional context fetching, not the default path for delegated search/research.

- [ ] **Step 2: Update active docs only if behavior changed materially**

Document:
- search intent now delegates once
- deep research now delegates once
- web-context prefetch is no longer part of those delegated paths

- [ ] **Step 3: Run the route and strategy tests together**

Run: `npm test -- --runInBand src/lib/chat/__tests__/chat-search-strategy.test.ts src/app/api/chat/completion/route.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/services/web-context-service.ts docs/PRODUCT_AUDIT_2026-03-13.md CLAUDE.md GEMINI.md
git commit -m "docs: align search routing and context service notes"
```

## Chunk 3: Full Verification

### Task 7: Run the verification set

**Files:**
- No code changes

- [ ] **Step 1: Run focused new tests**

Run: `npm test -- --runInBand src/lib/media/__tests__/remote-fetch-policy.test.ts src/app/api/media/ingest/route.test.ts src/app/api/proxy-image/route.test.ts src/lib/chat/__tests__/chat-search-strategy.test.ts src/app/api/chat/completion/route.test.ts`
Expected: PASS

- [ ] **Step 2: Run existing regression-sensitive tests**

Run: `npm test -- --runInBand src/lib/services/__tests__/chat-service.test.ts src/lib/chat/__tests__/chat-send-orchestrator.test.ts src/config/__tests__/model-invariants.test.ts`
Expected: PASS

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: verify security and search routing fixes"
```

## Expected Outcomes

- Arbitrary third-party and private-network URLs can no longer be fetched by the server media surfaces.
- Search/deep-research requests perform one upstream completion path instead of two serial Pollinations calls.
- Active docs and the audit note reflect the new, simpler architecture.
- The fixes stay localized instead of scattering special cases across routes.
