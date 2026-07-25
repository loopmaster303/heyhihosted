/**
 * Content types that execute in a browser when served back from media storage.
 *
 * Uploads end up behind a public media URL, so anything the browser renders as
 * active content (scripts, markup, SVG with embedded script) would turn the
 * store into a hosting surface for injected content. Everything else — images,
 * video, audio and the document types the composer accepts — stays allowed.
 */
const ACTIVE_CONTENT_TYPES = new Set([
  'text/html',
  'application/xhtml+xml',
  'image/svg+xml',
  'text/javascript',
  'application/javascript',
  'application/x-javascript',
  'application/xml',
  'text/xml',
]);

export function isActiveContentType(contentType: string): boolean {
  const essence = contentType.split(';')[0].trim().toLowerCase();
  return ACTIVE_CONTENT_TYPES.has(essence);
}
