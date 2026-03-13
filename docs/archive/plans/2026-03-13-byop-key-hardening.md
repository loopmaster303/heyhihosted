# BYOP Key Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the current bring-your-own-Pollinations-key flow without redesigning auth or switching to a cookie/session architecture.

**Architecture:** Keep the existing BYOP request model, but centralize key validation, move account/balance fetching behind a same-origin server route, and reduce scattered raw key access on the client. The implementation should stay local to the existing key helper, hook, and API-route boundaries.

**Tech Stack:** Next.js 16 route handlers, TypeScript, Jest, React Testing Library, existing Pollinations integration.

---

## Chunk 1: Key Validation

**Files:**
- Create: `src/lib/pollen-key-validation.ts`
- Create: `src/lib/__tests__/pollen-key-validation.test.ts`
- Modify: `src/lib/resolve-pollen-key.ts`

- [ ] **Step 1: Write failing tests for valid and invalid BYOP keys**
- [ ] **Step 2: Run the validation test and confirm it fails**
- [ ] **Step 3: Implement minimal Pollinations key normalization/validation**
- [ ] **Step 4: Route `resolvePollenKey()` through the new validation helper**
- [ ] **Step 5: Re-run the validation test and confirm it passes**

## Chunk 2: Same-Origin Account Route

**Files:**
- Create: `src/app/api/pollen/account/route.ts`
- Create: `src/app/api/pollen/account/route.test.ts`

- [ ] **Step 1: Write failing tests for unauthorized and successful account fetch**
- [ ] **Step 2: Run the route test and confirm it fails**
- [ ] **Step 3: Implement the minimal account proxy route**
- [ ] **Step 4: Re-run the route test and confirm it passes**

## Chunk 3: Client Hook Handover

**Files:**
- Modify: `src/hooks/usePollenKey.ts`
- Modify: `src/lib/pollen-key.ts`

- [ ] **Step 1: Write a failing hook test proving account refresh uses the same-origin route**
- [ ] **Step 2: Run the hook test and confirm it fails**
- [ ] **Step 3: Implement the smallest hook/helper change to stop direct browser bearer calls**
- [ ] **Step 4: Re-run the hook test and confirm it passes**

## Chunk 4: Audit Alignment and Verification

**Files:**
- Modify: `docs/PRODUCT_AUDIT_2026-03-13.md`

- [ ] **Step 1: Update the audit finding to the new partially-hardened state**
- [ ] **Step 2: Run targeted tests**
- [ ] **Step 3: Run `npm run typecheck`**
- [ ] **Step 4: Summarize residual risk honestly**
