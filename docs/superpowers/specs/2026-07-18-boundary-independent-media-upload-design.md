# Boundary-Independent Media Upload Design

## Objective

Make reference-image uploads reliable when the browser-to-app request reaches
`/api/media/upload` without a usable multipart boundary, while preserving the
existing server-side Pollinations upload contract and 10 MB limit.

## Confirmed Evidence

- The UI upload failed in `request.formData()` with `no boundary found in multipart body`.
- A direct `curl -F` request to the same route returned HTTP 200.
- The checked-in client does not explicitly set a multipart `Content-Type` header.
- Pollinations Media Storage accepts the server-generated multipart request.

The exact external source of the malformed browser header is not proven. The
failure boundary is proven: the internal Browser-to-App contract currently
depends on multipart boundary integrity even though the App route immediately
repackages the file for Pollinations.

## Design

The browser client sends the file bytes directly to `/api/media/upload` with
the file MIME type and pollen-key header. The route accepts this raw-body
contract and retains multipart parsing for compatibility. Both paths normalize
to a `File`, apply the existing empty-file and 10 MB checks, then create a fresh
multipart request for Pollinations Media Storage.

No chat, gallery, generation, or image-tool state contract changes. The
multi-image loop continues to call the same upload helper sequentially.

## Error Handling

- Reject a missing key before reading the body.
- Reject an oversized `Content-Length` before buffering.
- Reject empty raw and multipart bodies.
- Preserve upstream status and error messages.
- Treat `multipart/form-data` as the legacy compatibility path; all other
  content types use the raw-body path.

## Verification

- Unit-test the client request shape so it cannot regress to boundary-dependent
  multipart.
- Route-test raw uploads and retained multipart compatibility.
- Run focused tests, TypeScript, and `git diff --check`.
- Do not run browser automation; the user performs the local UI test.

## Reality Check

This keeps the existing route as the authentication, size-limit, and upstream
adapter. It does not add a second upload service, touch `useUnifiedImageToolState`,
or refactor unrelated media paths. Raw Browser-to-App transfer is simpler than
base64 JSON and avoids its size overhead.
