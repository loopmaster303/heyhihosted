# AI Code Reviewer Audit: Accelerating Delivery & Quality
**Date:** January 22, 2026
**Reviewer:** Gemini CLI (AI Agent)
**Focus:** Delivery Velocity, Engineering Efficiency, Quality Excellence

## 1. Executive Summary

The `heyhihosted` codebase is a feature-rich Next.js application with a sophisticated but brittle architecture. While it successfully integrates multiple AI providers (Pollinations, Replicate) and complex client-side state (Dexie.js), it suffers from "organic growth" patterns that threaten delivery speed and stability.

**Key Health Indicators:**
*   **Velocity Risk:** HIGH. Lack of automated tests means every refactor risks regression.
*   **Maintainability:** MEDIUM. "God Components" and mixed concerns in hooks require high cognitive load.
*   **Quality Assurance:** LOW. Reliance on manual testing is a bottleneck.

## 2. Strategic Recommendations

### Goal 1: Accelerate Delivery Cycles
*   **Current Bottleneck:** Fear of breaking existing features (Regressions).
*   **Observation:** There are almost **no automated tests** for core logic (`src/hooks/useChatPersistence.ts`, `src/components/chat/ChatInput.tsx`).
*   **Action Plan:**
    1.  **Smoke Tests:** Implement Cypress or Playwright E2E tests for the critical path: "Load App -> Send Message -> Receive Stream -> Persist".
    2.  **Unit Tests:** Add Jest tests for `useChatPersistence` (mocking Dexie) and `SmartRouter` logic.
    3.  **Result:** Developers can merge PRs in minutes, not hours, knowing core flows are safe.

### Goal 2: Save Senior Engineering Time
*   **Current Bottleneck:** High Context Requirements.
*   **Observation:** `ChatInput.tsx` (~400 lines) and `route.ts` (~250 lines) are monolithic. A senior engineer must understand mobile detection, file handling, mode switching, and UI rendering just to change a button color.
*   **Observation:** `useChatState.ts` is a "God Hook" wrapper that obscures data flow.
*   **Action Plan:**
    1.  **Decompose UI:** Split `ChatInput.tsx` into `ChatModeSelector`, `ChatFileUpload`, `ChatTextField`.
    2.  **Strategy Pattern for API:** Refactor `src/app/api/chat/completion/route.ts` to use a `ModelProviderStrategy` pattern instead of nested loops and `if/else` blocks.
    3.  **Result:** Junior engineers can work on isolated components without breaking the global state, freeing seniors for architecture.

### Goal 3: Drive Quality Excellence
*   **Current Bottleneck:** Data Integrity & Type Safety.
*   **Observation:** The `Conversation` type in `src/types/index.ts` mixes database concerns (`id`, `messages`) with ephemeral UI state (`uploadedFile`, `selectedModelId`).
*   **Observation:** `useChatPersistence.ts` manually casts types (`as Conversation`), bypassing TypeScript's safety net.
*   **Action Plan:**
    1.  **Strict Typing:** Separate `PersistedConversation` (DB) from `RuntimeConversation` (UI).
    2.  **Zod Everywhere:** Use Zod schemas not just for API validation, but for validating data loaded from IndexedDB to catch schema drift early.
    3.  **Result:** "It works on my machine" bugs vanish; data structure issues are caught at compile time.

## 3. Deep Dive Findings

### A. The "God Component": `ChatInput.tsx`
*   **Location:** `src/components/chat/ChatInput.tsx`
*   **Issue:** Handles mobile layout, drag-and-drop, badges, specific tool logic (`visualizeToolState`), and form submission.
*   **Risk:** High. Any change here impacts the primary user interaction point.
*   **Fix:** Extract `useChatInputLogic` hook for state/handlers and break render methods into sub-components.

### B. The "God Route": `api/chat/completion/route.ts`
*   **Location:** `src/app/api/chat/completion/route.ts`
*   **Issue:** Contains complex imperative logic for "Smart Routing", Replicate polling, and multi-provider fallback.
*   **Risk:** Medium. Hard to test different fallback scenarios.
*   **Fix:** Move routing logic to `src/lib/ai/router.ts` and provider logic to `src/lib/ai/providers/*.ts`.

### C. Persistence Blind Spot
*   **Location:** `src/hooks/useChatPersistence.ts`
*   **Issue:** Uses `useLiveQuery` to fetch `allConversations.toArray()` on every change.
*   **Risk:** Performance. As a user's history grows, this will cause frame drops on every message save.
*   **Fix:** Implement pagination or `limit(20)` for the sidebar list. Only load full lists when searching.

## 4. Immediate Roadmap (Next 48 Hours)

1.  **Setup E2E Testing Harness:** Install Playwright and write **one** test: "User can send a message."
2.  **Refactor ChatInput:** Move `MobileOptionsMenu` and badge logic to their own files (mostly done, but needs cleanup).
3.  **Type Separation:** Create `PersistedConversation` type and update `DatabaseService` to use it.

## 5. Metrics for Success
*   **PR Review Time:** < 15 mins (automated checks pass, reviewer focuses on logic).
*   **Regression Rate:** 0 critical regressions per release.
*   **Lighthouse Score:** > 90 for Performance (currently at risk due to heavy client-side logic).
