# Model Cleanup & Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove deprecated/unwanted models, fix naming, delete Replicate entirely, add new Pollinations models, redesign Beta Notice, add music gallery + prompt DB.

**Architecture:** All model config lives in `src/config/`. Replicate is its own route + param file to delete. New features (music gallery, prompt DB) extend the existing Dexie schema + GalleryService pattern.

**Tech Stack:** Next.js App Router, TypeScript, Dexie v3, Tailwind, Radix/Shadcn, Pollinations API

---

## Task 1: Text Model Cleanup (chat-options.ts)

**Files:**
- Modify: `src/config/chat-options.ts`

**Step 1: Remove unwanted models from AVAILABLE_POLLINATIONS_MODELS**

Delete these entries from the array:
- `id: "openai-fast"` (GPT-5 Nano)
- `id: "openai"` (GPT-5)
- `id: "openai-large"` (GPT-5 Large)
- `id: "grok"` (xAI Grok)

**Step 2: Fix display names**

- `id: "gemini-search"` → name: `"Gemini 2.5 Flash Lite + Search"`, description: `"Grounded Google Search, always current."`
- `id: "claude"` → name: `"Claude Sonnet 4.6"` (was 4.5)
- `id: "gemini"` → add `category: "Advanced"` if not already (it's paid_only)

**Step 3: Reorder array so first 4 are free/default**

The first 4 entries should be: `claude-fast`, `gemini-fast`, `gemini-search`, `deepseek`.
Move these to the top of AVAILABLE_POLLINATIONS_MODELS.

**Step 4: Run typecheck**

```bash
npm run typecheck
```
Expected: No errors

**Step 5: Commit**

```bash
git add src/config/chat-options.ts
git commit -m "feat: remove OpenAI/Grok models, fix gemini-search name, reorder free-first"
```

---

## Task 2: Delete Replicate Code

**Files:**
- Delete: `src/app/api/replicate/route.ts`
- Delete: `src/lib/image-generation/replicate-image-params.ts`
- Modify: `src/config/unified-image-models.ts`
- Modify: `src/hooks/useUnifiedImageToolState.ts`
- Modify: `src/types/index.ts` (if ImageProvider type is there)

**Step 1: Delete the Replicate API route**

```bash
rm src/app/api/replicate/route.ts
rm src/lib/image-generation/replicate-image-params.ts
```

**Step 2: Find all Replicate references**

```bash
grep -r "replicate" src/ --include="*.ts" --include="*.tsx" -l
```

**Step 3: Clean unified-image-models.ts**

- Delete entire `REPLICATE_MODELS` array (lines ~119-170)
- Delete entire `MISTRAL_MODELS` array (lines ~177-208) — these are unused
- Change `export type ImageProvider = 'pollinations' | 'replicate' | 'mistral';` → `export type ImageProvider = 'pollinations';`
- Remove `requiresPassword?: boolean` from `UnifiedImageModel` interface
- Remove `REPLICATE_MODELS` and `MISTRAL_MODELS` from the `UNIFIED_IMAGE_MODELS` spread
- Remove `getPremiumModels()` function (references replicate)

**Step 4: Clean useUnifiedImageToolState.ts**

Find and remove:
- `replicateUploadModels` array
- Any `provider === 'replicate'` checks
- Any import of `replicate-image-params`
- Any `requiresPassword` references

**Step 5: Run typecheck**

```bash
npm run typecheck
```
Fix any type errors from removed types.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: delete all Replicate code, simplify to Pollinations-only"
```

---

## Task 3: Image Model Registry Update (unified-image-models.ts)

**Files:**
- Modify: `src/config/unified-image-models.ts`

**Step 1: Remove unwanted models from POLLINATIONS_MODELS**

Delete these entries:
- `id: 'grok-imagine'` (image)
- `id: 'grok-video'` (video, in POLLINATIONS_MODELS or wherever it is)
- `id: 'seedance-pro'` (if it exists — child content risk)
- `id: 'imagen-4'` (if it exists)
- `id: 'veo'` (too expensive)

**Step 2: Mark deprecated models**

- `id: 'seedream'` → `enabled: false, description: 'Deprecated - use seedream5'`
- `id: 'seedream-pro'` → `enabled: false, description: 'Deprecated - use seedream5'`

**Step 3: Fix seedance supportsReference bug**

Change `seedance` entry:
```ts
supportsReference: true,  // was: false — API confirms image input supported
maxImages: 1,             // was: 0
description: 'Seedance Lite (BytePlus) (T2V / optional I2V)',
```

**Step 4: Add new models**

Add after the existing Standard Image Models:
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
  description: 'Seedream 5.0 Lite - ByteDance'
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
  description: 'Gemini 3.1 Flash Image (fast, high quality)'
},
```

**Step 5: Add klein (4B) as disabled internal fallback**

Add to POLLINATIONS_MODELS (disabled, not shown in UI):
```ts
// Internal fallback for klein-large (9B). Not shown in UI.
{
  id: 'klein',
  name: 'Flux.2 klein 4B',
  provider: 'pollinations',
  kind: 'image',
  category: 'Standard',
  supportsReference: true,
  maxImages: 1,
  isFree: true,
  enabled: false,  // hidden — used as automatic fallback when klein-large fails
  description: 'FLUX.2 Klein 4B (fallback for 9B)'
},
```

**Step 6: Update VISUALIZE_MODEL_GROUPS**

- FREE group: `['flux', 'zimage']` — remove `grok-imagine`
- EDITING group: `['kontext', 'klein-large', 'gptimage-large', 'nanobanana']` — unchanged
- ADVANCED group: `['nanobanana-pro', 'nanobanana-2', 'seedream5', 'flux-2-max']` — replace deprecated seedream-pro, add new models (remove flux-2-max since Replicate gone)
  → `['nanobanana-pro', 'nanobanana-2', 'seedream5']`
- VIDEO group: `['seedance', 'wan', 'ltx-2']` — remove `grok-video`

**Step 7: Update CHAT_IMAGE_MODEL_IDS**

At bottom of file:
```ts
const CHAT_IMAGE_MODEL_IDS = ['seedream5', 'zimage', 'nanobanana'];
// was: ['seedream', 'zimage', 'nanobanana']
```

**Step 8: Run typecheck**

```bash
npm run typecheck
```

**Step 9: Commit**

```bash
git add src/config/unified-image-models.ts
git commit -m "feat: add seedream5+nanobanana-2, remove grok/veo/imagen4, fix seedance I2V bug"
```

---

## Task 4: ElevenMusic Duration (Free vs Own Key)

**Files:**
- Modify: `src/app/api/compose/route.ts`

**Step 1: Add duration logic based on API key presence**

Replace the current duration validation line:
```ts
const validDuration = Math.max(3, Math.min(300, Number(duration)));
```

With:
```ts
// Free tier: max 120s. Users with own Pollen key get full 300s.
const apiKey = resolvePollenKey(request);
const maxDuration = apiKey ? 300 : 120;
const validDuration = Math.max(3, Math.min(maxDuration, Number(duration)));
```

Note: `resolvePollenKey(request)` is already called below — move it before the duration line and reuse.

**Step 2: Run typecheck**

```bash
npm run typecheck
```

**Step 3: Commit**

```bash
git add src/app/api/compose/route.ts
git commit -m "feat: ElevenMusic free tier max 120s, own key = 300s"
```

---

## Task 5: Beta Notice Redesign (AppLayout.tsx)

**Files:**
- Modify: `src/components/layout/AppLayout.tsx`

**Step 1: Find current notice (lines ~176-183)**

Current code:
```tsx
<div className="mt-2 text-[10px] sm:text-xs font-bold tracking-[0.3em] text-foreground/30 uppercase pointer-events-auto text-center w-full">
  EVERYONE CAN SAY HI TO AI
</div>
<div className="mt-3 text-[10px] sm:text-xs text-foreground/50 font-medium tracking-wide pointer-events-auto text-center w-full max-w-xl mx-auto px-4 leading-relaxed">
  NOTICE. For Full Access provide your own Pollen Key via Pollinations in the Sidebar. <br className="hidden sm:block" />
  For more Informations visit: <a href="https://enter.pollinations.ai" ...>enter.pollinations.ai</a>
</div>
```

**Step 2: Replace with terminal-style bold notice**

Replace the entire notice block with:
```tsx
<div className="mt-2 text-[10px] sm:text-xs font-bold tracking-[0.3em] text-foreground/30 uppercase pointer-events-auto text-center w-full">
  EVERYONE CAN SAY HI TO AI
</div>
<div className="mt-3 pointer-events-auto mx-auto max-w-lg px-4">
  <div className="rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3 font-mono text-[10px] sm:text-[11px] leading-relaxed text-foreground/60">
    <span className="font-bold text-foreground/80">BETA NOTICE:</span>{' '}
    THIS IS A PROJECT IN PROGRESS. IM A SINGLE VIBE DEV WHOS REFTHINKING AND MAYBE REFACTORING — BUT PLEASE TEST AND REACH OUT FOR FULL ACCESS OR JUST BRING YOUR OWN API KEY{' '}
    <span className="font-bold text-foreground/80">→ SIDEBAR.</span>{' '}
    THIS PROJECT IS KINDLY SUPPORTED BY{' '}
    <a href="https://enter.pollinations.ai" target="_blank" rel="noopener noreferrer" className="font-bold text-foreground/80 underline underline-offset-2 hover:text-foreground transition-colors">POLLINATIONS.</a>{' '}
    THANK YOU GUYS. SUPPORT DEMOCRATIZING AI OUT OF THEIR CORPORATE DRESS.{' '}
    <span className="font-bold">I LOVE HUMANS.</span>
  </div>
</div>
```

**Step 3: Verify visually (if Playwright available)**

```bash
# Start dev server and check landing page
npm run dev
```

**Step 4: Commit**

```bash
git add src/components/layout/AppLayout.tsx
git commit -m "feat: redesign Beta Notice as terminal-style bold statement"
```

---

## Task 6: Enhancement Prompts for New Models

**Files:**
- Modify: `src/config/enhancement-prompts.ts`

**Step 1: Read the file to understand the pattern**

Read `src/config/enhancement-prompts.ts` — look at existing entries for `nanobanana` and `seedream` as templates.

**Step 2: Add prompt for seedream5**

Clone the `seedream` entry, change modelId to `'seedream5'` and update description to reflect Seedream 5.0 Lite. Same prompt content as seedream (ByteDance model family, similar capabilities).

**Step 3: Add prompt for nanobanana-2**

Clone the `nanobanana` entry, change modelId to `'nanobanana-2'`. Update description to mention Gemini 3.1 Flash Image. Same Gemini-style prompt.

**Step 4: Remove prompts for deleted models**

Delete enhancement prompt entries for:
- `grok-imagine`
- `grok-video`
- `seedream-pro` (deprecated, disabled)
- Any Replicate model IDs

**Step 5: Run typecheck**

```bash
npm run typecheck
```

**Step 6: Commit**

```bash
git add src/config/enhancement-prompts.ts
git commit -m "feat: add enhancement prompts for seedream5+nanobanana-2, remove deleted models"
```

---

## Task 7: Music Gallery - Save Audio Assets

**Goal:** After ElevenMusic generation, save the audio as an asset with an auto-generated name (e.g. "raw deephouse groover 280226") and show in Gallery popup below images.

**Files to read first:**
- `src/lib/services/GalleryService.ts` — understand `saveGeneratedAsset()`
- `src/hooks/useComposeMusicState.ts` — understand compose flow
- `src/components/gallery/GallerySidebarSection.tsx` — understand gallery display
- `src/lib/database/DatabaseService.ts` — understand assets table schema
- `src/app/api/chat/title/route.ts` — understand title generation pattern

**Step 1: Read key files to understand data flow**

```bash
# Read these files before implementing:
# - src/lib/services/GalleryService.ts
# - src/hooks/useComposeMusicState.ts
# - src/app/api/chat/title/route.ts
# - src/lib/database/schema.ts (or DatabaseService.ts)
```

**Step 2: Add audio asset saving to compose flow**

In `src/hooks/useComposeMusicState.ts`, after successful generation:

```ts
// After receiving audioUrl from /api/compose:
// 1. Generate a snappy title from the prompt
const titleRes = await fetch('/api/chat/title', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: prompt,
    suffix: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\./g, '')
  })
});
const { title } = await titleRes.json(); // e.g. "raw deephouse groover 280226"

// 2. Save to assets table (reuse GalleryService or DatabaseService directly)
await GalleryService.saveGeneratedAsset({
  conversationId: activeConversationId || 'compose',
  kind: 'audio',
  remoteUrl: null,
  blobDataUrl: audioUrl, // base64 data URL
  modelId: 'elevenmusic',
  prompt: prompt,
  title: title,
});
```

**Step 3: Update assets table schema if needed**

Check if `assets` table has `kind` field supporting `'audio'` and `title` field. If not, add to Dexie schema migration in `DatabaseService.ts`.

**Step 4: Add music section to Gallery popup**

In `src/components/gallery/GallerySidebarSection.tsx` (or the expanded gallery component):
- After the images/videos grid, add a "MUSIC" section
- Each music item shows: title, prompt snippet, play button, download button
- Use HTML `<audio>` element for playback

**Step 5: Run typecheck + lint**

```bash
npm run typecheck && npm run lint
```

**Step 6: Commit**

```bash
git add src/hooks/useComposeMusicState.ts src/components/gallery/ src/lib/database/
git commit -m "feat: save ElevenMusic tracks to gallery with auto-generated names"
```

---

## Task 8: Prompt Database

**Goal:** New Dexie table `prompts` storing prompts that produced good results (image/video/music).

**Files:**
- Modify: `src/lib/database/DatabaseService.ts` (or schema file)
- Create: `src/hooks/usePromptDatabase.ts`

**Step 1: Add prompts table to Dexie schema**

In the Dexie setup (find with `grep -r "Dexie\|version(" src/lib/database/ -l`):

```ts
// Add to schema migration (increment version number):
.stores({
  // existing tables...
  prompts: '++id, kind, modelId, createdAt',
})
```

Schema for each prompt record:
```ts
interface PromptRecord {
  id?: number;
  kind: 'image' | 'video' | 'audio' | 'text';
  modelId: string;
  prompt: string;
  enhancedPrompt?: string;
  createdAt: Date;
  title?: string; // optional human label
}
```

**Step 2: Create usePromptDatabase hook**

```ts
// src/hooks/usePromptDatabase.ts
export function usePromptDatabase() {
  const savePrompt = async (record: Omit<PromptRecord, 'id' | 'createdAt'>) => {
    await db.prompts.add({ ...record, createdAt: new Date() });
  };
  const getRecentPrompts = async (kind?: PromptRecord['kind'], limit = 50) => {
    const query = db.prompts.orderBy('createdAt').reverse();
    const all = kind ? await query.filter(p => p.kind === kind).limit(limit).toArray()
                     : await query.limit(limit).toArray();
    return all;
  };
  return { savePrompt, getRecentPrompts };
}
```

**Step 3: Wire savePrompt calls**

After successful image/video generation in `GalleryService.saveGeneratedAsset()`:
```ts
// Add optional prompt saving (pass prompt + modelId to GalleryService):
await db.prompts.add({ kind, modelId, prompt, enhancedPrompt, createdAt: new Date() });
```

After successful music generation in `useComposeMusicState`:
```ts
await db.prompts.add({ kind: 'audio', modelId: 'elevenmusic', prompt, createdAt: new Date() });
```

**Step 4: Show prompts in gallery popup**

In gallery expanded view, add a "PROMPT HISTORY" section at bottom:
- Shows last 20 prompts (all kinds or filtered by active tab)
- Each shows: kind icon, modelId, prompt text (truncated), copy button
- Click to copy prompt to clipboard

**Step 5: Run typecheck + lint**

```bash
npm run typecheck && npm run lint
```

**Step 6: Commit**

```bash
git add src/lib/database/ src/hooks/usePromptDatabase.ts src/components/gallery/
git commit -m "feat: add prompt database with Dexie table and gallery history view"
```

---

## Task 9: Final Verification

**Step 1: Full typecheck**

```bash
npm run typecheck
```

Expected: 0 errors

**Step 2: Lint**

```bash
npm run lint
```

Expected: 0 errors

**Step 3: Build check**

```bash
npm run build
```

Expected: Successful build

**Step 4: Verify Replicate is fully gone**

```bash
grep -r "replicate" src/ --include="*.ts" --include="*.tsx" | grep -v "// " | grep -v node_modules
```

Expected: Zero results (except possibly in types if kept as legacy)

**Step 5: Verify model counts**

```bash
# Check removed models are gone:
grep -r "openai-fast\|openai-large\|grok-imagine\|grok-video\|imagen-4\|veo\|seedance-pro" src/config/
```

Expected: Zero hits

**Step 6: Final commit if needed**

```bash
git add -A
git commit -m "chore: final cleanup and verification pass"
```

---

## Execution Order (Priority)

1. **Task 2** — Delete Replicate (unblocks Tasks 3+6)
2. **Task 1** — Text model cleanup (fast, independent)
3. **Task 3** — Image model registry (depends on Task 2)
4. **Task 4** — ElevenMusic duration (fast, independent)
5. **Task 5** — Beta Notice redesign (fast, independent)
6. **Task 6** — Enhancement prompts (depends on Task 3)
7. **Task 7** — Music gallery (larger feature)
8. **Task 8** — Prompt database (larger feature)
9. **Task 9** — Final verification
