# Cleanup & Refactoring Plan (Post-Audit)
**Date:** January 22, 2026
**Status:** In Progress

## 1. Immediate Cleanup (Post-Refactor)
Now that `api/chat/completion` and `ChatInput.tsx` are modernized, we must clean up the artifacts.

- [ ] **Verify `toDataStreamResponse` Fix:** Confirm the API route no longer crashes. If `await streamText` fixed it, mark as done.
- [ ] **Remove Legacy Imports:** Check `src/app/api/chat/completion/route.ts` for unused imports (e.g., `NextResponse` might be unused if we only return `Response` from SDK).
- [ ] **Standardize Types:** `ChatInputProps` in `ChatInput.tsx` replicates types from `useChatInputLogic`. We should export the Props interface from the Hook file and reuse it to avoid drift.

## 2. Documentation Updates
The architecture has shifted significantly. The docs need to reflect the "Vercel AI SDK" adoption.

- [ ] **Update `docs/architecture-view.md`:**
    - Replace custom fetch diagrams with "Vercel AI SDK Stream" flow.
    - Document the "Invisible Router" logic (SmartRouter -> Sona/NomNom).
- [ ] **Update `docs/COMPONENT_STATE_BEHAVIOR.md`:**
    - Document the split between `ChatInput` (View) and `useChatInputLogic` (Brain).

## 3. Next Refactoring Targets
The audit identified `useChatState.ts` as another "God Hook".

- [ ] **Decompose `useChatState.ts`:**
    - It currently aggregates Persistence, UI, Media, and Logic.
    - **Goal:** Users of the hook should only take what they need.
    - *Action:* Verify if `useChatMedia` can be completely isolated from `useChatState`.

## 4. Testing Strategy (Safety Net)
We still lack the E2E tests identified in the audit.

- [ ] **Install Playwright:** `npm init playwright@latest`.
- [ ] **Create Smoke Test:** `tests/chat-smoke.spec.ts`.
    - Scenario: Open App -> Type "Hello" -> Expect "User Message" -> Expect "AI Response".

## 5. Dead Code Removal
- [ ] **Replicate Chat Logic:** Ensure no other files try to use Replicate for *chat* (TTS is okay).
- [ ] **Legacy Utils:** Check `src/lib/utils.ts` for stream parsing helpers that are no longer needed due to AI SDK.

## Execution Order
1. **Fix API Crash** (Priority 0)
2. **Docs Update** (Priority 1 - preserves context)
3. **Smoke Test** (Priority 2 - prevents regression)
4. **Dead Code Cleanup** (Priority 3)
