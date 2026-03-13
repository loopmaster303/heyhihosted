# Codex Output Page POV

Scope: Dieses Dokument beschreibt die sichtbare **Output Page** (`src/app/gallery/page.tsx`), nicht das Mini-/Sidebar-Output.

## Current state (aligned with Pollinations Media Storage)
The Output page is backed by a canonical local-first assets table. Generated media is ingested into Pollinations Media Storage, and the asset record stores the media hash as `storageKey`. The UI resolves immutable media URLs on demand via `https://media.pollinations.ai/{hash}`.

## Chat image generation and saving
- `src/components/ChatProvider.tsx`
  - Image prompt flow calls `ChatService.generateImage(...)` and ingests the result via `/api/media/ingest`.
  - The resulting asset record is written to IndexedDB (`DatabaseService.saveAsset`) with `storageKey` and metadata.
  - Assistant messages reference the asset via `metadata.assetId` for hydration.
- `src/lib/services/chat-service.ts`
  - `generateImage(...)` uses `/api/generate` for Pollinations image/video generation.
- `src/app/api/generate/route.ts`
  - Generates Pollinations URLs for image and video models.
- `src/app/api/media/upload/route.ts`
  - Uploads user references to Pollinations Media Storage (`/upload`) and returns hash URL.
- `src/app/api/media/ingest/route.ts`
  - Polls a generated remote URL, uploads binary to Media Storage, returns `key` + content type.
- `src/hooks/useAssetUrl.ts`
  - Resolves assets with fallback chain: local blob -> remote URL -> media hash URL.

## Output Page rendering
- `src/hooks/useGalleryAssets.ts`
  - Live-query of IndexedDB `assets`, most recent first.
- `src/app/gallery/page.tsx`
  - Rendert Assets via `useAssetUrl`, inkl. Image/Video support.

## Out of scope
- `src/components/gallery/GallerySidebarSection.tsx` (Mini-/Sidebar-Output)

## Storage model (Hybrid: Media Storage Primary + Local Blobs)
- **Primary Strategy (Pollinations)**: Generated media is ingested into Pollinations Media Storage. The asset record in IndexedDB stores the `storageKey` hash.
- **Fallback Strategy**: If ingestion fails or is skipped, the raw Blob is stored directly in IndexedDB (`asset.blob`).
- **Local-first persistence**: IndexedDB is the single source of truth for asset metadata.
- **Hydration**: The `useAssetUrl` hook automatically handles both strategies:
  - If `storageKey` is present -> resolves media URL (`https://media.pollinations.ai/{hash}`).
  - If `blob` is present -> creates local Object URL.

## Remaining risks
- Blob-backed object URLs must not be revoked while still in use by mounted components.
- Asset records should remain the canonical source of output media; avoid reintroducing parallel storage paths.

## Bottom line
The Output page is now driven by a single local-first assets store with Media-Storage-backed assets, stable fallback resolution, and local-first metadata. Future changes should keep this single source of truth intact.
