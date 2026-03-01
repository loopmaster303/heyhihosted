# Replicate Removal & Image Model Update — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Delete all Replicate infrastructure, update the Pollinations image model registry with new/deprecated models, fix a reference-image bug, and sync enhancement prompts.

**Architecture:** All model config in `src/config/`. Replicate spans: one API route, one param-mapping utility, and call-sites in 4 source files + 2 test files. New Pollinations models slot directly into the existing registry pattern. No new dependencies needed.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind, Dexie v3. No external APIs touched (Pollinations only from now on).

---

## PROJECT CONTEXT (read before starting)

### What already happened (do NOT redo)

- `openai`, `openai-fast`, `openai-large`, `grok` text models already removed from `src/config/chat-options.ts`
- `gemini-search` display name already fixed to "Gemini 2.5 Flash Lite + Search"
- `claude` name already fixed to "Claude Sonnet 4.6"
- ElevenMusic free/paid duration already updated in `src/app/api/compose/route.ts`
- Beta Notice in AppLayout already redesigned

### App summary

hey.hi is a privacy-first AI chat UI (Next.js, local IndexedDB). It calls Pollinations.ai for image/video/text generation. All image generation flows through `/api/generate` (Pollinations) or `/api/replicate` (Replicate — **being deleted**). Image model registry lives in `src/config/unified-image-models.ts`. Two components call image generation: `UnifiedImageTool.tsx` (standalone Visualize bar) and `ChatProvider.tsx` (chat image mode).

---

## TASK 1 — Delete Replicate API Route & Param File

### Files to delete
- `src/app/api/replicate/route.ts` — entire file, ~130 lines
- `src/lib/image-generation/replicate-image-params.ts` — entire file, ~40 lines

### Files to verify don't exist (already gone or need deleting)
```bash
ls src/app/api/replicate/route.ts
ls src/lib/image-generation/replicate-image-params.ts
```

**Step 1: Delete both files**

```bash
rm src/app/api/replicate/route.ts
rm src/lib/image-generation/replicate-image-params.ts
```

**Step 2: Check if the directory is now empty**

```bash
ls src/app/api/replicate/ 2>/dev/null && echo "dir still has files" || echo "dir empty or gone"
rmdir src/app/api/replicate/ 2>/dev/null || true
ls src/lib/image-generation/ 2>/dev/null && echo "check if dir has other files" || echo "gone"
```

If `src/lib/image-generation/` has other files, leave the directory. If it's now empty, delete it too.

**Step 3: Verify TypeScript import errors will surface**

```bash
npm run typecheck 2>&1 | grep -i "replicate"
```

Expected: errors about `getReplicateImageParam` not found — that's correct, we'll fix them in Tasks 2 and 3.

**Step 4: Commit just the deletions**

```bash
git rm src/app/api/replicate/route.ts
git rm src/lib/image-generation/replicate-image-params.ts
git commit -m "feat: delete Replicate API route and param mapping file"
```

---

## TASK 2 — Clean Replicate References from unified-image-models.ts

### Current state of file

`src/config/unified-image-models.ts` has:

1. `ImageProvider` type includes `'replicate' | 'mistral'` — **remove both**
2. `requiresPassword?: boolean` in `UnifiedImageModel` interface — **remove**
3. Entire `REPLICATE_MODELS` const array (~lines 119-170, 9 model entries) — **delete**
4. Entire `MISTRAL_MODELS` const array (~lines 177-208, 3 model entries) — **delete**
5. `UNIFIED_IMAGE_MODELS` spread includes `...REPLICATE_MODELS, ...MISTRAL_MODELS` — **remove both**
6. `getPremiumModels()` function returns `m.provider === 'replicate'` — **delete the entire function**

### Exact changes

**Step 1: Read the file first**

```bash
# Confirm line numbers:
grep -n "REPLICATE_MODELS\|MISTRAL_MODELS\|requiresPassword\|getPremiumModels\|ImageProvider" src/config/unified-image-models.ts
```

**Step 2: Edit the file — change type definition**

Find:
```ts
export type ImageProvider = 'pollinations' | 'replicate' | 'mistral';
```
Replace with:
```ts
export type ImageProvider = 'pollinations';
```

**Step 3: Remove requiresPassword from interface**

Find and delete this line from the `UnifiedImageModel` interface:
```ts
  requiresPassword?: boolean; // Requires password (Replicate premium)
```

**Step 4: Delete the REPLICATE_MODELS array**

Delete from `const REPLICATE_MODELS: UnifiedImageModel[] = [` through the closing `];` (approx 50 lines including all the disabled model entries).

**Step 5: Delete the MISTRAL_MODELS array**

Delete from the comment block `/** Mistral Models... */` through the closing `];` of that array.

**Step 6: Update UNIFIED_IMAGE_MODELS**

Find:
```ts
export const UNIFIED_IMAGE_MODELS: UnifiedImageModel[] = [
  ...POLLINATIONS_MODELS,
  ...REPLICATE_MODELS,
  ...MISTRAL_MODELS,
];
```
Replace with:
```ts
export const UNIFIED_IMAGE_MODELS: UnifiedImageModel[] = [
  ...POLLINATIONS_MODELS,
];
```

**Step 7: Delete getPremiumModels function**

Find and delete the entire function:
```ts
/**
 * Get premium models (Replicate)
 */
export function getPremiumModels(): UnifiedImageModel[] {
  return UNIFIED_IMAGE_MODELS.filter(m => m.provider === 'replicate' && (m.enabled ?? true));
}
```

**Step 8: Run typecheck**

```bash
npm run typecheck 2>&1 | grep -v "node_modules"
```

Expect: errors about `provider === 'replicate'` in other files, `getReplicateImageParam` — those get fixed in Tasks 3 and 4.

**Step 9: Commit**

```bash
git add src/config/unified-image-models.ts
git commit -m "feat: remove Replicate/Mistral models from registry, simplify ImageProvider type"
```

---

## TASK 3 — Remove Replicate Call-Sites from Source Files

Four files still reference Replicate after Tasks 1-2. Fix each one:

### 3a: `src/lib/services/chat-service.ts`

**Current code (around lines 94-130):**

```ts
static async generateImage(options: GenerateImageOptions): Promise<string> {
    const modelInfo = getUnifiedModel(options.modelId);
    const isReplicate = modelInfo?.provider === 'replicate';
    const endpoint = isReplicate ? '/api/replicate' : '/api/generate';

    let body: any = {
        prompt: options.prompt,
        model: options.modelId,
        private: true
    };

    if (isReplicate) {
        if (options.negative_prompt) body.negative_prompt = options.negative_prompt;
        // ... many replicate-specific params
        if (modelInfo?.kind === 'video') {
            // ... replicate video params
        } else {
            // ... replicate image params
        }
    }
```

**Replace the isReplicate block entirely.** After the `let body` declaration, delete everything inside `if (isReplicate) { ... }` AND the `isReplicate` / `endpoint` lines. The endpoint is always `/api/generate` now.

**New code:**

```ts
static async generateImage(options: GenerateImageOptions): Promise<string> {
    const modelInfo = getUnifiedModel(options.modelId);
    const endpoint = '/api/generate';

    let body: any = {
        prompt: options.prompt,
        model: options.modelId,
        private: true
    };
    // (continue with the existing non-Replicate body building below)
```

Read the full function first, then identify the `if (isReplicate) { ... }` block and delete only it. Keep the `isPollinationsModel` / Pollinations-specific body building that follows.

### 3b: `src/components/ChatProvider.tsx`

**Two changes:**

1. Delete the import at the top:
```ts
import { getReplicateImageParam } from '@/lib/image-generation/replicate-image-params';
```

2. Find the Replicate branch in the image params section (around lines 629-638):
```ts
if (resolvedReferenceUrls.length > 0) {
  if (!isPollinationsModel) {
    // Replicate: Use model-specific parameter name (centralized mapping)
    const replicateParam = getReplicateImageParam(selectedImageModelId, resolvedReferenceUrls);
    if (replicateParam) {
      imageParams[replicateParam.paramName] = replicateParam.paramValue;
    }
  } else {
    // Pollinations: Always use 'image'
    imageParams.image = resolvedReferenceUrls;
  }
}
```

Replace the entire `if/else` with just the Pollinations path:
```ts
if (resolvedReferenceUrls.length > 0) {
  // Pollinations: Always use 'image'
  imageParams.image = resolvedReferenceUrls;
}
```

### 3c: `src/components/tools/UnifiedImageTool.tsx`

**Two changes:**

1. Delete the import at the top:
```ts
import { getReplicateImageParam } from '@/lib/image-generation/replicate-image-params';
```

2. Find the Replicate param section (around lines 144-149):
```ts
const replicateParam = getReplicateImageParam(selectedModelId, referenceUrls);
if (replicateParam) {
  payload[replicateParam.paramName] = replicateParam.paramValue;
}
```

Replace with:
```ts
// Pollinations: Always use 'image'
if (referenceUrls.length > 0) {
  payload.image = referenceUrls;
}
```

Also find the endpoint decision (around line 181):
```ts
const endpoint = isPollinations ? '/api/generate' : '/api/replicate';
```
Replace with:
```ts
const endpoint = '/api/generate';
```

Remove the `isPollinations` variable if it's now unused (check the rest of the function first).

### 3d: `src/components/tools/visualize/VisualizeInlineHeader.tsx`

Find (around line 334):
```ts
getUnifiedModel(selectedModelId)?.provider !== 'replicate' &&
```

Delete just that condition from the `&&` chain. Keep everything else in the conditional.

### 3e: `src/hooks/useUnifiedImageToolState.ts`

**Three changes:**

1. Delete the `replicateUploadModels` exported const (lines 30-38):
```ts
export const replicateUploadModels = [
    'flux-2-pro',
    'flux-kontext-pro',
    'wan-video',
    'z-image-turbo',
    'flux-2-max',
    'flux-2-klein-9b',
    'grok-imagine-video',
];
```

2. Find the upload logic (around lines 232-237):
```ts
const needsUpload = modelInfo?.provider === 'replicate' && modelInfo?.supportsReference;
const allUploadModels = [...pollinationUploadModels, ...replicateUploadModels];
```
Replace with:
```ts
const allUploadModels = [...pollinationUploadModels];
```
(Delete the `needsUpload` line — it's now covered by `allUploadModels.includes(selectedModelId)` below.)

Also update the condition that used `needsUpload`:
```ts
if (needsUpload || allUploadModels.includes(selectedModelId)) {
```
→
```ts
if (allUploadModels.includes(selectedModelId)) {
```

3. Also update `pollinationUploadModels` — remove deprecated/removed model IDs:
- Remove: `'seedream-pro'`, `'seedream'`, `'grok-video'`
- Add: `'seedream5'`, `'nanobanana-2'` (the new models from Task 5)
- Add: `'seedance'` (bug fix — it supports reference images)

**Step 4: Typecheck after all 3d-3e changes**

```bash
npm run typecheck 2>&1 | grep -v "node_modules" | grep -v "chat-service.test"
```

**Step 5: Commit**

```bash
git add src/lib/services/chat-service.ts src/components/ChatProvider.tsx src/components/tools/UnifiedImageTool.tsx src/components/tools/visualize/VisualizeInlineHeader.tsx src/hooks/useUnifiedImageToolState.ts
git commit -m "feat: remove all Replicate call-sites, Pollinations-only image generation"
```

---

## TASK 4 — Fix Replicate References in Test Files

Two test files reference Replicate. Update them:

### 4a: `src/config/__tests__/model-invariants.test.ts`

Current file imports `replicateUploadModels` and has a test for it. Since Replicate is gone:

1. Delete the import line:
```ts
import { pollinationUploadModels, replicateUploadModels } from '@/hooks/useUnifiedImageToolState';
```
→ Remove `replicateUploadModels` from the import (keep `pollinationUploadModels`).

2. Find and delete the entire test block:
```ts
test('all replicate models with supportsReference=true are present in replicateUploadModels', () => {
  ...
});
```

3. If there's a test that checks `m.provider === 'replicate'`, delete it.

### 4b: `src/lib/services/__tests__/chat-service.test.ts`

Find (around line 212):
```ts
expect(mockFetch).toHaveBeenCalledWith('/api/replicate', expect.objectContaining({
```

This test verifies Replicate routing. Either:
- Delete the test if it was testing Replicate-specific behavior
- Or update it to expect `/api/generate` instead

Read the full test to understand what it tests, then decide. If the test was specifically for "when model is Replicate, call /api/replicate" — delete the whole test. If it was testing image generation routing in general — update the assertion to use `/api/generate`.

**Step 3: Run tests**

```bash
npm test -- --testPathPattern="model-invariants|chat-service" --watchAll=false 2>&1 | tail -20
```

Expected: All tests pass.

**Step 4: Run typecheck**

```bash
npm run typecheck 2>&1 | grep -v "node_modules"
```

Expected: 0 errors.

**Step 5: Commit**

```bash
git add src/config/__tests__/ src/lib/services/__tests__/
git commit -m "fix: update tests — remove Replicate assertions, Pollinations-only"
```

---

## TASK 5 — Image Model Registry Update

Now update `src/config/unified-image-models.ts` with model changes (Replicate already removed in Task 2).

### 5a: Remove unwanted models from POLLINATIONS_MODELS

Delete these complete object entries:
- `{ id: 'grok-imagine', ... }` — Grok image (remove entirely)
- `{ id: 'grok-video', ... }` — Grok video (remove entirely)
- `{ id: 'seedance-pro', ... }` — if it exists (child content risk)
- `{ id: 'imagen-4', ... }` — if it exists (too expensive)
- `{ id: 'veo', ... }` — if it exists (too expensive, $0.15/s)

Before deleting, search first:
```bash
grep -n "grok-imagine\|grok-video\|seedance-pro\|imagen-4\|id: 'veo'" src/config/unified-image-models.ts
```

### 5b: Mark deprecated models as disabled

Find `id: 'seedream'` entry → change to `enabled: false, description: 'Deprecated — use seedream5'`
Find `id: 'seedream-pro'` entry → change to `enabled: false, description: 'Deprecated — use seedream5'`

### 5c: Fix seedance supportsReference bug

Current (WRONG):
```ts
{
  id: 'seedance',
  ...
  supportsReference: false,
  maxImages: 0,
  ...
  description: 'Seedance Lite (BytePlus) (T2V)',
```

Fix to:
```ts
{
  id: 'seedance',
  ...
  supportsReference: true,   // ← was false; API confirms I2V supported
  maxImages: 1,              // ← was 0
  ...
  description: 'Seedance Lite (BytePlus) (T2V / optional I2V)',
```

### 5d: Add new models

Add these two new entries to POLLINATIONS_MODELS (after `nanobanana-pro` in the Advanced section):

```ts
{
  id: 'seedream5',
  name: 'Seedream 5',
  provider: 'pollinations',
  kind: 'image',
  category: 'Standard',
  supportsReference: true,
  maxImages: 10,
  isFree: true,
  enabled: true,
  description: 'Seedream 5.0 Lite — ByteDance'
},
{
  id: 'nanobanana-2',
  name: 'Nano Banana 2',
  provider: 'pollinations',
  kind: 'image',
  category: 'Advanced',
  supportsReference: true,
  maxImages: 14,
  isFree: true,
  enabled: true,
  description: 'Gemini 3.1 Flash Image'
},
```

### 5e: Add klein 4B as disabled internal fallback

Add this entry (disabled, not shown in UI):
```ts
// Internal fallback for klein-large (9B) when it is unavailable. Not shown in UI.
{
  id: 'klein',
  name: 'Flux.2 klein 4B',
  provider: 'pollinations',
  kind: 'image',
  category: 'Standard',
  supportsReference: true,
  maxImages: 1,
  isFree: true,
  enabled: false,
  description: 'FLUX.2 Klein 4B (internal fallback for 9B)'
},
```

### 5f: Update VISUALIZE_MODEL_GROUPS

Find the `VISUALIZE_MODEL_GROUPS` const and update:

```ts
const VISUALIZE_MODEL_GROUPS: VisualizeModelGroup[] = [
  {
    key: 'image-free',
    label: 'FREE',
    category: 'Standard',
    kind: 'image',
    modelIds: ['flux', 'zimage'],           // removed: 'grok-imagine'
  },
  {
    key: 'image-editing',
    label: 'EDITING',
    category: 'Standard',
    kind: 'image',
    modelIds: ['kontext', 'klein-large', 'gptimage-large', 'nanobanana'],  // unchanged
  },
  {
    key: 'image-advanced',
    label: 'ADVANCED',
    category: 'Advanced',
    kind: 'image',
    modelIds: ['nanobanana-pro', 'nanobanana-2', 'seedream5'],  // removed: seedream-pro, flux-2-max; added: nanobanana-2, seedream5
  },
  {
    key: 'video',
    label: 'VIDEO',
    category: 'Advanced',
    kind: 'video',
    modelIds: ['seedance', 'wan', 'ltx-2'],  // removed: 'grok-video'
  },
];
```

### 5g: Update CHAT_IMAGE_MODEL_IDS

Find at the bottom of the file:
```ts
const CHAT_IMAGE_MODEL_IDS = ['seedream', 'zimage', 'nanobanana'];
```
Replace with:
```ts
const CHAT_IMAGE_MODEL_IDS = ['seedream5', 'zimage', 'nanobanana'];
```

### 5h: Run typecheck

```bash
npm run typecheck 2>&1 | grep -v "node_modules"
```

Expected: 0 errors.

### 5i: Commit

```bash
git add src/config/unified-image-models.ts
git commit -m "feat: add seedream5+nanobanana-2, remove grok models, fix seedance I2V bug, add klein fallback"
```

---

## TASK 6 — Sync Enhancement Prompts

`src/config/enhancement-prompts.ts` is a `Record<string, string>` mapping model IDs to system prompts for the `/api/enhance-prompt` route.

### 6a: Read the file

```bash
grep -n "^  '" src/config/enhancement-prompts.ts | head -30
```

This shows you all current model IDs that have enhancement prompts.

### 6b: Remove prompts for deleted models

Delete these entries entirely (including comments above them):
- `'grok-imagine'` (model removed)
- `'grok-video'` (model removed)
- `'seedream-pro'` (deprecated/disabled — optional to keep, but clean to remove)

Search first:
```bash
grep -n "grok-imagine\|grok-video" src/config/enhancement-prompts.ts
```

### 6c: Add prompt for seedream5

Find the `'seedream'` entry. It has a ByteDance-optimized prompt. Add a `'seedream5'` entry directly after it with the **same prompt content** (same model family, Seedream 5.0 is stylistically identical to 4.0 for prompting purposes):

```ts
'seedream5': `<same content as the 'seedream' entry>`,
```

### 6d: Add prompt for nanobanana-2

Find the `'nanobanana'` entry. Add `'nanobanana-2'` after it with the **same prompt content** (same Gemini-based family):

```ts
'nanobanana-2': `<same content as the 'nanobanana' entry>`,
```

### 6e: Run typecheck + lint

```bash
npm run typecheck && npm run lint
```

### 6f: Commit

```bash
git add src/config/enhancement-prompts.ts
git commit -m "feat: add enhancement prompts for seedream5+nanobanana-2, remove deleted model prompts"
```

---

## TASK 7 — Final Verification

**Step 1: Confirm zero Replicate references in source**

```bash
grep -r "replicate\|replicateUpload\|requiresPassword\|getReplicateImageParam\|api/replicate" \
  src/ --include="*.ts" --include="*.tsx" \
  | grep -v "__tests__" \
  | grep -v "node_modules" \
  | grep -v "// "
```

Expected: Zero results (all clean).

**Step 2: Full typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

**Step 3: Lint**

```bash
npm run lint
```

Expected: 0 errors (the 2 pre-existing issues in OfflineIndicator.tsx and the eslint-disable comment are acceptable if unchanged).

**Step 4: Run all tests**

```bash
npm test -- --watchAll=false 2>&1 | tail -20
```

Expected: All passing.

**Step 5: Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: Successful build with no type errors.

**Step 6: Verify new models appear in groups**

```bash
node -e "
const { getVisualizeModelGroups } = require('./src/config/unified-image-models.ts');
console.log(JSON.stringify(getVisualizeModelGroups().map(g => ({ key: g.key, ids: g.models.map(m => m.id) })), null, 2));
" 2>/dev/null || echo "Run in dev mode to verify model groups"
```

Or check manually: `grep -n "seedream5\|nanobanana-2" src/config/unified-image-models.ts` should show both models with `enabled: true`.

**Step 7: Final commit if anything leftover**

```bash
git status
# Only commit if there are actual changes
git add -A
git commit -m "chore: final cleanup pass after Replicate removal"
```

---

## Execution Order

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7
```

Tasks 1 and 2 must come first (they delete files others import).
Task 3 fixes the broken imports from Tasks 1-2.
Task 4 fixes test files (needs Tasks 1-3 done).
Tasks 5 and 6 are independent of each other but need Task 2 done.
Task 7 is always last.
