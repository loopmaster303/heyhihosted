# Codex Gallery POV

## Current state (aligned with S3 only)
The gallery is now backed by a canonical local-first assets table. Generated media is ingested into S3, and the asset record stores the S3 key. The UI resolves signed URLs on demand via `/api/upload/sign-read`. This removes the prior split between chat message URLs and gallery storage.

## Chat image generation and saving
- `src/components/ChatProvider.tsx`
  - Image prompt flow calls `ChatService.generateImage(...)` and then ingests the result into S3 via `/api/upload/ingest`.
  - The resulting asset record is written to IndexedDB (`DatabaseService.saveAsset`) with `storageKey` and metadata.
  - Assistant messages reference the asset via `metadata.assetId` for hydration.
- `src/lib/services/chat-service.ts`
  - `generateImage(...)` chooses `/api/generate` (Pollinations) or `/api/replicate`.
- `src/app/api/generate/route.ts`
  - Generates Pollinations URLs for image and video models.
- `src/app/api/upload/sign/route.ts`
  - Creates signed S3 upload + read URLs.
- `src/app/api/upload/ingest/route.ts`
  - Polls a remote URL, then writes the binary into S3 and returns `key` + content type.
- `src/hooks/useAssetUrl.ts`
  - Resolves assets: local blob -> immediate object URL; S3 `storageKey` -> signed read URL.

## Gallery and image history
- `src/hooks/useGalleryAssets.ts`
  - Live-query of IndexedDB `assets`, most recent first.
- `src/components/gallery/GallerySidebarSection.tsx` and `src/app/gallery/page.tsx`
  - Render assets using `useAssetUrl`, supporting both images and videos.

## Storage model (Hybrid: S3 Primary + Local Blobs)
- **Primary Strategy (Pollinations)**: Generated media is ingested into S3. The asset record in IndexedDB stores the `storageKey`.
- **Fallback Strategy (Other Providers)**: For providers where ingestion fails or is skipped, the raw Blob is stored directly in IndexedDB (`asset.blob`).
- **Local-first persistence**: IndexedDB is the single source of truth for asset metadata.
- **Hydration**: The `useAssetUrl` hook automatically handles both strategies:
  - If `storageKey` is present -> resolves signed S3 URL.
  - If `blob` is present -> creates local Object URL.

## Remaining risks
- Signed reference URLs can expire; generation flows should re-sign before use when keys are available.
- Asset records should remain the canonical source of gallery media; avoid reintroducing parallel storage paths.

## Bottom line
The gallery is now driven by a single assets vault with S3-backed media, which is stable and easy to reason about. Future changes should keep this single source of truth intact.
