/**
 * Shared constants for media upload / asset storage.
 *
 * Single source of truth so client and server, as well as the various asset
 * facades, agree on limits and skip-thresholds.
 */

/** Pollinations Media Storage upload endpoint. */
export const MEDIA_UPLOAD_URL = 'https://media.pollinations.ai/upload';

/** Pollinations Media Storage documented max upload size (10 MiB). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Minimum byte size for a fetched/generated asset to be considered worth
 * caching. Smaller payloads are almost certainly error stubs or empty
 * responses and are skipped to avoid polluting the asset store.
 *
 * Used by server-media-ingest, output-service, and asset-fallback-service to
 * keep their "too small to cache" thresholds consistent.
 */
export const SMALL_BLOB_SKIP_BYTES = 1000;
