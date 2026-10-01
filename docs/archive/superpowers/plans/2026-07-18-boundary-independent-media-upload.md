# Boundary-Independent Media Upload Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the fragile multipart-boundary dependency from browser-to-app media uploads without changing Pollinations' upstream multipart contract.

**Architecture:** `uploadFileToPollinationsMedia` sends raw file bytes and their MIME type to the existing Next.js route. The route supports both the new raw input and legacy multipart input, normalizes either form to a `File`, enforces existing limits, and forwards a newly constructed multipart request upstream.

**Tech Stack:** Next.js 16 App Router, browser Fetch/FormData APIs, TypeScript, Jest.

---

## Chunk 1: Lock the Transport Contract with Tests

### Task 1: Client Request Shape

**Files:**
- Create: `src/lib/upload/pollinations-media.test.ts`
- Modify: `src/lib/upload/pollinations-media.ts`

- [ ] **Step 1: Write a failing test**

Call `uploadFileToPollinationsMedia` with a small image `File`, mock `fetch`, and
assert the request body is the original file rather than `FormData`, the
`Content-Type` is `image/png`, and `X-Pollen-Key` is preserved.

- [ ] **Step 2: Verify RED**

Run:
```bash
npx jest --watch=false --runInBand src/lib/upload/pollinations-media.test.ts
```
Expected: FAIL because the current body is a `FormData` instance.

- [ ] **Step 3: Implement the minimal client change**

Use the normalized `File` directly as `body` and set only its real MIME type:
```ts
const response = await fetch('/api/media/upload', {
  method: 'POST',
  headers: {
    'Content-Type': normalizedContentType,
    ...getPollenHeaders(),
  },
  body: uploadFile,
});
```

- [ ] **Step 4: Verify GREEN**

Run the focused Jest command and expect PASS.

## Chunk 2: Accept Raw and Legacy Multipart Inputs

### Task 2: Route Normalization

**Files:**
- Modify: `src/app/api/media/upload/route.ts`
- Modify: `src/app/api/media/upload/route.test.ts`

- [ ] **Step 1: Write a failing raw-upload route test**

Create a request with `Content-Type: image/png` and a byte body. Assert the route
returns the upstream response and that upstream receives `FormData` with a
non-empty `file` entry.

- [ ] **Step 2: Verify RED**

Run:
```bash
npx jest --watch=false --runInBand src/app/api/media/upload/route.test.ts
```
Expected: FAIL because the current route always calls `request.formData()`.

- [ ] **Step 3: Add minimal input normalization**

Branch on `request.headers.get('content-type')`:
```ts
if (contentType.toLowerCase().startsWith('multipart/form-data')) {
  const formData = await request.formData();
  file = formData.get('file');
} else {
  const body = await request.arrayBuffer();
  file = new File([body], `upload-${Date.now()}.bin`, {
    type: contentType || 'application/octet-stream',
  });
}
```
Then reuse the existing empty-size, maximum-size, and upstream multipart logic.

- [ ] **Step 4: Preserve multipart compatibility**

Add a success test using a real multipart `Request` and assert the upstream file
is forwarded. Keep the current missing-key, preflight-size, empty-file, and
upstream-failure tests green.

- [ ] **Step 5: Verify GREEN**

Run both focused test files with `--runInBand` and expect PASS.

## Chunk 3: Verification and Handoff

### Task 3: Static and Regression Verification

**Files:**
- Verify only; no additional production files.

- [ ] Run `npm run typecheck` and expect exit 0.
- [ ] Run the focused media/generate tests and expect all tests to pass.
- [ ] Run `git diff --check` and expect no output.
- [ ] Confirm no dev server or background terminal was started.
- [ ] Hand off to the user for the requested local browser test; do not run browser automation.

## Reality Check

The implementation remains inside the existing upload adapter boundary. It does
not touch `useChatState`, `useUnifiedImageToolState`, or the generation routing.
Supporting legacy multipart prevents accidental breakage for any unlocated
caller, while the primary client path becomes boundary-independent.
