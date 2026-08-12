# VACE Endpoint Recovery Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route VACE through the live standard Pruna API and surface submit-network failures as explicit 502 errors.

**Architecture:** Keep provider dispatch centralized in the existing Pruna registry/client. Remove the unused shared-endpoint variant after moving VACE, and normalize raw submit fetch failures at the client boundary.

**Tech Stack:** TypeScript, Next.js route services, Jest, native Fetch API

---

## Chunk 1: VACE endpoint and submit errors

### Task 1: Recover VACE submission

**Files:**
- Modify: `src/config/pruna-models.ts`
- Modify: `src/config/__tests__/pruna-models.test.ts`
- Modify: `src/lib/pruna/client.ts`
- Modify: `src/lib/pruna/client.test.ts`

- [ ] **Step 1: Write failing endpoint tests**

Add tests asserting that the VACE mapping uses `endpoint: 'default'`, VACE submission calls `https://api.pruna.ai/v1/predictions`, and the retired shared hostname is not used.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --runInBand src/config/__tests__/pruna-models.test.ts src/lib/pruna/client.test.ts`

Expected: failures because VACE still selects `shared` and because raw submit fetch rejection is not normalized.

- [ ] **Step 3: Add failing network-error test**

Mock the first submit fetch to reject with a DNS-style `TypeError`. Assert rejection with status 502, code `PRUNA_NETWORK_ERROR`, and a safe message identifying the affected Pruna model.

- [ ] **Step 4: Implement the minimal fix**

Set VACE to the standard endpoint, reduce `PrunaEndpoint` to the remaining endpoint type (or remove the distinction if cleaner), remove `PRUNA_SHARED_BASE_URL`, and wrap only the initial submit fetch rejection in a typed 502 `ApiError`. Preserve existing HTTP-response error handling.

- [ ] **Step 5: Verify GREEN and regressions**

Run focused Jest, full Jest, ESLint on changed files, and `git diff --check`. Do not invoke a live paid VACE generation automatically.

