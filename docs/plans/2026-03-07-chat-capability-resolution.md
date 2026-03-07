# Chat Capability Resolution Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Preserve seamless chat UX while extracting the first safe refactor seam for mode, model, and capability handling in the chat flow.

**Architecture:** Keep the central `ChatProvider` for now, but move capability-aware decision making into a dedicated pure helper layer. The first extraction focuses on resolving effective mode/model/request constraints for chat sends and landing-to-chat transitions, without changing memory behavior yet.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Jest

---

### Task 1: Freeze capability and mode invariants

**Files:**
- Modify: `src/components/ChatProvider.tsx`
- Modify: `src/components/page/ChatInterface.tsx`
- Modify: `src/components/page/LandingView.tsx`
- Modify: `src/app/unified/page.tsx`
- Test: `src/lib/chat/__tests__/chat-capability-resolution.test.ts`

**Step 1: Write failing tests for invariant cases**

Cover these cases:
- image upload with non-vision model falls back predictably
- compose and image modes remain mutually exclusive
- landing-to-chat preserves chosen mode flags
- web browsing and code mode remain attached to new-chat initialization

**Step 2: Run focused tests to verify failures**

Run: `npm test -- chat-capability-resolution`

**Step 3: Document the current runtime invariants in code-adjacent helper tests**

Assert exact outputs for:
- selected text model sanitization
- initial mode state normalization
- effective request mode derivation
- capability fallback behavior

**Step 4: Run tests again**

Run: `npm test -- chat-capability-resolution`

### Task 2: Extract capability resolution helper

**Files:**
- Create: `src/lib/chat/chat-capability-resolution.ts`
- Test: `src/lib/chat/__tests__/chat-capability-resolution.test.ts`
- Modify: `src/components/ChatProvider.tsx`

**Step 1: Create pure helper API**

Add helpers for:
- safe text model resolution
- mode normalization for new chats
- effective send-mode derivation
- model capability lookup
- vision fallback resolution for upload-driven requests

**Step 2: Keep helper return values explicit**

The helper should return data, not mutate React state.

**Step 3: Replace inline resolution logic in `ChatProvider`**

Only swap out duplicated decision logic. Do not move `sendMessage` orchestration yet.

**Step 4: Run focused tests**

Run: `npm test -- chat-capability-resolution`

### Task 3: Route `startNewChat` and landing handoff through normalized mode state

**Files:**
- Modify: `src/components/ChatProvider.tsx`
- Modify: `src/app/unified/page.tsx`

**Step 1: Normalize new-chat option handling**

Use the helper to sanitize:
- initial text model
- image/compose/code/web flags
- mutual exclusivity rules

**Step 2: Preserve current behavior for empty active chats**

Do not change the “reuse empty active conversation” behavior.

**Step 3: Run focused tests**

Run: `npm test -- chat-capability-resolution`

### Task 4: Route `sendMessage` through effective request resolution

**Files:**
- Modify: `src/components/ChatProvider.tsx`
- Modify: `src/lib/chat/chat-capability-resolution.ts`

**Step 1: Replace ad hoc request setup with helper outputs**

Use helper data to derive:
- effective text model
- whether upload implies vision handling
- whether fallback model switch is required
- request mode guardrails before prompt/context work starts

**Step 2: Keep exact user-visible behavior**

Preserve:
- toast semantics
- retry behavior
- streaming message shape
- title generation trigger timing
- memory extraction trigger timing

**Step 3: Run focused tests and type checks**

Run:
- `npm test -- chat-capability-resolution`
- `npm run typecheck`

### Task 5: Decide next seam after verification

**Files:**
- Modify: `docs/plans/2026-03-07-chat-capability-resolution.md`

**Step 1: Reassess post-change blast radius**

Choose the next extraction in this order:
1. message normalization
2. context windowing
3. prompt builder
4. `sendMessage` orchestrator
5. context split

**Step 2: Record follow-up recommendation**

Add a short note documenting whether the capability seam reduced risk enough for the next extraction.
