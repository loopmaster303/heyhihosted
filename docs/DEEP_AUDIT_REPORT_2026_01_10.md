# Deep Audit Report - HeyHi Hosted
Date: 2026-01-10
Scope: UI/UX, chat flow and persistence, media/storage pipeline, model/tool selection, and documentation alignment.

Status note: Storage has since been consolidated to S3 only; legacy Vercel Blob and Catbox routes were removed.

## Method
Manual code and docs review. Files sampled include:
- UI/theme: `src/app/globals.css`, `tailwind.config.ts`, `src/components/ui/unified-input.tsx`, `src/components/chat/ChatInput.tsx`, `src/components/chat/MessageBubble.tsx`, `src/components/gallery/GallerySidebarSection.tsx`, `src/components/layout/AppSidebar.tsx`.
- Chat state/persistence: `src/hooks/useChatState.ts`, `src/hooks/useChatPersistence.ts`, `src/hooks/useChatEffects.ts`, `src/components/ChatProvider.tsx`, `src/hooks/useLocalStorageState.ts`.
- Media/storage: `src/lib/services/database.ts`, `src/hooks/useAssetUrl.ts`, `src/lib/upload/s3-upload.ts`, `src/app/api/upload/sign/route.ts`, `src/app/api/upload/sign-read/route.ts`, `src/app/api/upload/ingest/route.ts`, `src/app/api/upload/route.ts`, `src/app/api/upload/temp/route.ts`, `src/app/api/generate/route.ts`, `src/app/api/generate-video/route.ts`.
- Docs: `docs/architecture-view.md`, `docs/DESIGN_SYSTEM_PLAN.md`, `docs/UX_AUDIT_AND_ROADMAP.md`, `docs/STORAGE_MIGRATION_PLAN.md`.

## Executive Summary
- Core features work, but chat restore and storage flows show regressions and drift.
- The media pipeline is fragmented (S3 + Vercel Blob + Catbox), increasing maintenance and doc mismatch risk.
- UI consistency still depends on hardcoded colors and inline styles, conflicting with the design system plan.

## Findings (ordered by severity)

### P1 - Chat restore runs before IndexedDB is ready (regression)
- Evidence: `src/hooks/useChatEffects.ts:79-105` uses `if (!isInitialLoadComplete && allConversations.length >= 0)`, which is true on initial render and triggers `startNewChat()` before Dexie finishes. This can set a new active conversation and persist its ID, skipping restore of existing sessions.
- Impact: users land in a fresh chat even when data exists; previous session is not auto-restored.
- Fix direction: gate restore on `isInitialLoadComplete === true` or use `allConversationsLive !== undefined` and avoid creating a new chat until data arrives.

### P1 - Storage pipeline fragmentation and doc drift
- Evidence:
  - S3 signed uploads: `src/app/api/upload/sign/route.ts`, `src/lib/upload/s3-upload.ts`.
  - S3 ingest for generated media: `src/app/api/upload/ingest/route.ts`.
  - Legacy Vercel Blob: `src/app/api/upload/route.ts` and cleanup route `src/app/api/blob-cleanup/route.ts`.
  - Legacy Catbox temp upload: `src/app/api/upload/temp/route.ts`.
  - Docs still point to Vercel Blob: `docs/architecture-view.md` (Storage diagram).
- Impact: unclear single source of truth; difficult to reason about which storage is authoritative, higher risk of stale or dead code paths.
- Fix direction: choose one canonical pipeline, remove unused routes, and update docs accordingly.

### P2 - Title updates do not bump updatedAt
- Evidence: `src/hooks/useChatPersistence.ts:49-53` updates metadata via `saveConversation` without forcing `updatedAt`. `DatabaseService.saveConversation` persists the passed `updatedAt` value as-is.
- Impact: history ordering and recency UI can be wrong after title edits.
- Fix direction: set `updatedAt: new Date().toISOString()` on metadata updates.

### P2 - Signed reference URLs expire without refresh
- Evidence:
  - Signed URLs expire after 1 hour: `src/app/api/upload/sign/route.ts:14-38`.
  - `uploadFileToS3` returns `downloadUrl` only: `src/lib/upload/s3-upload.ts:52-66`.
  - `useUnifiedImageToolState` stores signed URLs in `uploadedImages`: `src/hooks/useUnifiedImageToolState.ts:187-229`.
- Impact: if users keep the session open, reference URLs can expire and break image/video generation or regeneration.
- Fix direction: store the S3 key (not just signed URL) and resolve via `/api/upload/sign-read` on demand, or re-sign before each request.

### P2 - Hardcoded UI colors bypass theme tokens
- Evidence: `src/components/chat/ChatInput.tsx:459-474` uses `#00d2ff` and `#00ff88` for badges.
- Impact: color contrast and light/dark consistency break; changes to theme tokens do not propagate.
- Fix direction: replace with tokenized colors (`text-primary`, `text-accent`, or new semantic tokens).

### P2 - Typography mismatch with design system plan
- Evidence:
  - Tailwind maps body to monospaced `Code` font: `tailwind.config.ts:15-18`.
  - Design system plan states Inter for UI and Code for branding: `docs/DESIGN_SYSTEM_PLAN.md` (Typography Overhaul section).
- Impact: doc vs. code drift and readability issues (monospace for body text).
- Fix direction: align font stacks to the design plan or update the plan to reflect current intent.

### P2 - Inline styles in core input
- Evidence: `src/components/ui/unified-input.tsx:98-114` sets `style={{ fontSize: '1.125rem', lineHeight: '1.5' }}`.
- Impact: reduces design-system consistency and makes global scaling harder.
- Fix direction: move to Tailwind classes or theme tokens.

### P3 - Client-side mobile detection causes layout shift
- Evidence: `src/components/chat/ChatInput.tsx:201-208` uses `window.innerWidth` in `useEffect` to toggle mobile UI.
- Impact: initial render is desktop, then flips to mobile after mount; subtle layout shift and FOUC.
- Fix direction: rely on CSS media queries where possible or a hydration-safe `useMediaQuery` hook.

### P3 - Duplicate API routes for Pollinations video
- Evidence: `src/app/api/generate/route.ts` already supports video models; `src/app/api/generate-video/route.ts` duplicates similar logic.
- Impact: redundancy and potential divergence if only one route is maintained.
- Fix direction: consolidate or ensure both routes are used intentionally with shared logic.

### P3 - localStorage parse errors are noisy and not recovered
- Evidence: `src/hooks/useLocalStorageState.ts:14-27` logs parse errors and retains defaults; does not sanitize invalid values.
- Impact: persistent console noise; customSystemPrompt can break if a raw string is stored manually.
- Fix direction: add a fallback path for raw string values or auto-clear invalid keys.

## Doc Drift Summary
- `docs/architecture-view.md` still references Vercel Blob as the asset store, but runtime code now uses S3 for uploads and ingest.
- `docs/STORAGE_MIGRATION_PLAN.md` and `docs/DESIGN_SYSTEM_PLAN.md` still describe localStorage and Inter typography decisions that no longer match current implementation.

## Suggested Remediation Order
1. Fix chat restore gating (`useChatEffects`).
2. Normalize storage pipeline and remove unused upload routes.
3. Update metadata updates to refresh `updatedAt`.
4. Replace hardcoded UI colors with theme tokens.
5. Align typography with the design system or update docs.
6. Remove inline input styles; use tokens.
7. Address signed URL refresh for references.

## Open Questions
- Is the intended canonical storage now S3 only, or is Vercel Blob still required for any edge use case?
- Should uploaded reference images be persisted in the gallery, or are they strictly transient?
- Should the design system plan be treated as binding spec or as a historical draft?
