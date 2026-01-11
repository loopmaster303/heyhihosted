# Documentation & Codebase Audit Report
**Date**: January 7, 2026
**Scope**: Strict Software Engineering Audit

## 1. Critical Conflicts (Code vs. Documentation)

### A. Persistence Layer Mismatch
*   **Documentation**: `docs/product.md` and `docs/architecture-view.md` state that User Data uses **`localStorage`**.
*   **Code**: `src/hooks/useChatState.ts` uses **`IndexedDB`** via `DatabaseService`.
*   **Severity**: **High**. New developers relying on docs will look for localStorage keys that don't exist or contain stale data.
*   **Recommendation**: Update all architecture docs to reflect the migration to IndexedDB.

## 2. "Messy" Code Patterns

### A. The `useChatState` "God Hook"
*   **Issue**: `src/hooks/useChatState.ts` manages too many concerns:
    *   Database persistence (Complex async logic)
    *   UI Toggles (Panels, Dialogs)
    *   Media State (Audio, Recording, Camera)
    *   Model Configuration (Fallbacks, Voices)
*   **Risk**: High coupling. Modifying audio logic triggers re-renders for UI panels. Hard to test.
*   **Recommendation**: Refactor into `useChatPersistence`, `useChatUI`, and `useChatMedia`.

### B. Backup & Dead Files
*   **Issue**: `conductor/tracks/002_studio_tool/*.backup` files exist in the repo.
*   **Issue**: `src/app/studio` is an empty directory.
*   **Severity**: **Low (Cleanliness)**. Adds noise to file searches and git history.

## 3. Documentation Gaps

### A. Design System Implementation
*   **Doc**: `docs/DESIGN_SYSTEM_PLAN.md` outlines "Glass Material" and "React Motion".
*   **Code**: `src/components/ui/` components (like `card.tsx`, `button.tsx`) seem to follow standard shadcn/ui patterns. It is unclear if the "Glass" plan was fully implemented or abandoned.
*   **Recommendation**: Audit CSS/Components to see if `backdrop-blur` and glass tokens are actually used. If not, mark the plan as "Proposed" or "Deprecated".

## 4. Actionable Next Steps
1.  **Update `docs/product.md`**: Change "localStorage" to "IndexedDB".
2.  **Delete** `src/app/studio` and `*.backup` files.
3.  **Refactor `useChatState`**: (Long term) Split into smaller hooks.
4.  **Consolidate Docs**: Merge testing notes; update Architecture diagram.
