# Availability Governance Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize manual model availability governance so selectors, defaults, and fallback logic all read the same visible product truth.

**Architecture:** Keep availability fully manual. Introduce one authoritative visible text-model policy in config, route all text-model consumers through it, tighten invariant tests, and then refresh the audit on the cleaner baseline.

**Tech Stack:** Next.js 16, TypeScript, Jest, existing config-driven model registries.

---

## Chunk 1: Centralize Text Model Availability

**Files:**
- Modify: `src/config/chat-options.ts`
- Test: `src/config/__tests__/model-invariants.test.ts`

- [ ] **Step 1: Write/expand failing invariants for manual visible text-model governance**
- [ ] **Step 2: Run the targeted invariant test and confirm it fails**
- [ ] **Step 3: Add a single visible-model policy and helper accessors**
- [ ] **Step 4: Re-run the targeted invariant test and confirm it passes**

## Chunk 2: Route Consumers Through The Same Truth

**Files:**
- Modify: `src/components/chat/input/ModelSelector.tsx`
- Modify: `src/components/sidebar/PersonalizationSidebarSection.tsx`
- Modify: `src/components/tools/PersonalizationTool.tsx`
- Modify: `src/components/layout/AppLayout.tsx`
- Modify: `src/lib/chat/chat-capability-resolution.ts`

- [ ] **Step 1: Write or expand a failing test that proves visible-model helpers drive consumers/fallbacks**
- [ ] **Step 2: Run the targeted test and confirm it fails**
- [ ] **Step 3: Update consumers to use the centralized visible-model helpers**
- [ ] **Step 4: Re-run targeted tests and confirm they pass**

## Chunk 3: Audit Follow-Up

**Files:**
- Modify: `docs/PRODUCT_AUDIT_2026-03-13.md`
- Optionally create: short follow-up audit note if the findings warrant it

- [ ] **Step 1: Mark availability governance as manually centralized**
- [ ] **Step 2: Record remaining residual risks honestly**

## Chunk 4: Verification

- [ ] **Step 1: Run targeted config/chat tests**
- [ ] **Step 2: Run `npm run typecheck`**
- [ ] **Step 3: Run `npm run build`**
- [ ] **Step 4: Summarize next audit candidates**
