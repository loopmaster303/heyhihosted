# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**hey.hi** is a privacy-focused, local-first AI chat interface powered by Pollinations.ai. Multimodal chat (text, image, video) with no server-side storage—all data lives in the browser's IndexedDB.

## Commands

```bash
npm run dev          # Development server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm test             # Jest tests (watch mode)
npm test -- --testPathPattern="chat-service"  # Run specific test
```

## Architecture

### Unified App Structure

Single-page architecture at `/unified` with two app states (`landing` | `chat`).

The **Visualize Bar** (`VisualizeInlineHeader`) opens inline when image mode is active, providing:
- Model selection (image/video)
- Parameters: aspect ratio, duration (video), audio toggle
- Reference image upload

### Behavioral Modes

Conversation-level flags:

- **isImageMode**: Routes prompts to Pollinations image/video generation
- **isComposeMode**: Music composing with Eleven Music (`model=elevenmusic`) via Pollinations (`/api/compose`) (`useComposeMusicState`)
- **isCodeMode**: Activates `CODE_REASONING_SYSTEM_PROMPT` for programming
- **webBrowsingEnabled**: Deep Research mode → routes to `nomnom` model

### Smart Router (`src/lib/services/smart-router.ts`)

Auto-detects user intent via regex (German + English):
- **Search intent** (temporal keywords, news, prices) → `perplexity-fast`
- **Deep Research toggle** → `nomnom` or `perplexity-reasoning`
- **Normal chat** → User's selected model

### API Layer

**Chat** (`/api/chat/completion`):
- Vercel AI SDK (`generateText`) with `ai-sdk-pollinations` provider

**Image/Video Generation** (`/api/generate`):
- Custom Pollinations SDK shim (`src/lib/pollinations-sdk.ts`)
- All models via Pollinations API
- **Pollinations supports GET only** (`/image/{prompt}?params`) — no POST endpoint
- URL limit ~2000 chars; if exceeded, server fetches image via GET and returns base64 data URL

**Prompt Enhancement** (`/api/enhance-prompt`):
- LLM-based prompt optimization for image and music generation
- Model-specific system prompts (`src/config/enhancement-prompts.ts`)
- Routing: `modelId` selects which enhancement prompt to use
- Image models: max 1000 chars output (3-layer cap: `maxCompletionTokens: 250`, system prompt rule, hard-cap after sanitize)
- Compose/music: max ~4100 chars output (no URL constraint, goes to `/api/compose`)

**Music Generation** (`/api/compose` via Pollinations):
- Compose mode uses `useComposeMusicState` hook with `enhancePrompt()` + `isEnhancing`
- Endpoint: `src/app/api/compose/route.ts` calls Pollinations audio with `model=elevenmusic`
- VibeCraft enhancement prompt (`COMPOSE_ENHANCEMENT_PROMPT` in `enhancement-prompts.ts`)

**Replicate Image/Video** (`/api/replicate`):
- Server-side polling via Replicate predictions API
- Model endpoints mapped in `MODEL_ENDPOINTS` (`src/app/api/replicate/route.ts`)
- Reference images via S3 signed URLs (same upload flow as Pollinations)
- Parameter name mapping: `getReplicateImageParam()` in `src/lib/image-generation/replicate-image-params.ts`
- Hidden defaults injected per model (e.g. `output_quality: 100` for flux-2-max)

**Text-to-Speech** (`/api/tts`):
- Replicate SDK (`minimax/speech-02-turbo`)

**Speech-to-Text** (`/api/stt`):
- Deepgram API via `stt-flow.ts`

**Title Generation** (`/api/chat/title`):
- Auto-generates conversation titles via Pollinations

**Image Proxy** (`/api/proxy-image`):
- Privacy-respecting proxy for external images

**Compose/Music** (`/api/compose`):
- Pollinations Eleven Music (`model=elevenmusic`) composing endpoint

**S3 Upload** (`/api/upload/sign`, `/api/upload/sign-read`, `/api/upload/ingest`):
- Signed URL generation for uploads and reads
- Asset ingestion pipeline (polls Pollinations, copies to S3)

### Reference Images

**Upload Flow (unified for Pollinations + Replicate):**
1. User selects image(s) → uploaded to S3 via signed URL
2. Stored as `UploadedReference[]`: `{ url, key, expiresAt }`
3. Before API call: `resolveReferenceUrls()` refreshes expired URLs
4. Passed to API with correct parameter name per provider/model

**Critical: Upload Model Lists** (`useUnifiedImageToolState.ts`):
- `pollinationUploadModels` — every Pollinations model with `supportsReference: true` **must** be listed
- `replicateUploadModels` — every Replicate model with `supportsReference: true` **must** be listed
- If missing, upload falls back to local Data-URI (base64 ~940K chars) which explodes GET URLs

**Replicate Parameter Mapping** (`src/lib/image-generation/replicate-image-params.ts`):
Replicate models use different API parameter names for reference images. The centralized `getReplicateImageParam()` maps model IDs to the correct parameter:

| Model | API Parameter | Value Type |
|-------|---------------|------------|
| flux-2-max, flux-2-klein-9b, flux-2-pro | `input_images` | `string[]` |
| flux-kontext-pro | `input_image` | `string` |
| grok-imagine-video, wan-video | `image` | `string` |
| All Pollinations models | `image` | `string[]` |

This mapping is used by **both** code paths:
- `UnifiedImageTool.tsx` (standalone Visualize tool → `/api/replicate` direct)
- `ChatProvider.tsx` → `ChatService.generateImage()` (chat input with image mode)

**Model Limits** (`src/config/unified-image-models.ts`):

| Model | Max Images | Provider | Notes |
|-------|------------|----------|-------|
| nanobanana(-pro) | 14 | Pollinations | Gemini-based |
| seedream(-pro) | 10 | Pollinations | ByteDance |
| gptimage-large | 8 | Pollinations | OpenAI |
| gpt-image | 4 | Pollinations | OpenAI Mini (disabled) |
| flux-2-max | 4 | Replicate | Black Forest Labs, `input_images` |
| kontext, klein-large | 1 | Pollinations | Context editing |
| grok-imagine-video | 1 | Replicate | Video, `image` param |
| wan, seedance(-pro) | 1 | Pollinations | **Image-to-Video only** |
| flux, flux-2-dev, zimage | 0 | Pollinations | No reference support |

Logic in `useUnifiedImageToolState`: auto-truncates images when switching to model with lower limit.

### Visualize Model Groups

The Visualize Bar organizes models into 4 groups (`src/config/unified-image-models.ts`):

| Group | Category | Models | Visibility |
|-------|----------|--------|------------|
| **FAST** | Standard | zimage, flux, flux-2-dev | Always visible |
| **EDITING** | Standard | kontext, klein-large, gptimage-large, nanobanana | Always visible |
| **ADVANCED** | Advanced | nanobanana-pro, seedream-pro, flux-2-max | Behind "Show More" |
| **VIDEO** | Advanced | seedance-fast, wan, ltx-video, grok-imagine-video | Behind "Show More" |

Standard groups are always visible; Advanced groups are behind a "Show More" toggle.
Order of `modelIds` in each group determines display order in the UI.
Disabled models (`enabled: false`) are automatically filtered out by `getVisualizeModelGroups()`.

### Asset Storage (Gallery)

**After Generation:**
1. Pollinations returns URL → `/api/upload/ingest` polls until ready
2. Copies to S3: `generated/{sessionId}/{timestamp}.{ext}`
3. IndexedDB stores metadata + `storageKey` (no blob)

**Display:**
- `useGalleryAssets()` loads from IndexedDB (limit 50)
- `useAssetUrl(id)` resolves: `storageKey` → signed S3 URL

### State Management

```
ChatProvider.tsx (orchestrator)
├── useChatState()              # Core state & persistence
├── useChatAudio()              # TTS playback
├── useChatRecording()          # Voice input
├── useUnifiedImageToolState()  # Visualize bar state
├── useComposeMusicState()      # Compose/music bar state
└── useChatEffects()            # Side effects
```

**MemoryService isolation**: `MemoryService.extractMemories()` is called in the `finally` block of `sendMessage()` but **only for text chat** (`!isImagePrompt`). It internally calls `ChatService.sendChatCompletion()`, which would route through Smart Router and potentially trigger search models — must never run during image/video generation.

### Database (Dexie v3 / IndexedDB)

```typescript
conversations: 'id, title, updatedAt, toolType'
messages: 'id, conversationId, timestamp'
memories: '++id, key, updatedAt'
assets: 'id, conversationId, timestamp'  // storageKey is a field but not indexed
```

## App Identity & System Prompts (`src/config/chat-options.ts`)

The app's self-knowledge is embedded in system prompts sent with every chat request:

- **`SYSTEM_IDENTITY_PROTOCOL`**: Name ("hey.hi"), nature ("AI Interface, not standalone model"), privacy policy, transparency rules, "Not Human" identity.
- **`SHARED_SAFETY_PROTOCOL`**: Crisis intervention — detects distress (Condition A → stay present) and acute danger (Condition B → redirect to 112/crisis hotline 0800 111 0 111).
- **`OUTPUT_LANGUAGE_GUARD`**: Default German, switches to English if user writes English.
- **`CODE_REASONING_SYSTEM_PROMPT`**: Code Mode identity ("Senior Software Engineer").

All five **Response Styles** (Basic, Precise, Deep Dive, Emotional Support, Philosophical) compose these protocols into their system prompt via XML structure.

See [docs/PRODUCT_IDENTITY.md](docs/PRODUCT_IDENTITY.md) for full identity specification.

## Key Configurations

### Chat Models (`src/config/chat-options.ts`)

- Default: `claude-fast` (Claude Haiku 4.5)
- Auto-routed search: `perplexity-fast` (Sonar)
- Deep research: `nomnom`
- Code Mode models: `qwen-coder`, `deepseek`, `glm`, `gemini-large`

### Chat Model Categories

| Category | Models |
|----------|--------|
| **Standard** | `claude-fast`, `gemini-search`, `openai-fast`, `openai`, `grok`, `gemini-fast`, `mistral` |
| **Advanced** | `openai-large`, `claude-large`, `claude`, `gemini-large`, `gemini`, `deepseek`, `perplexity-reasoning`, `nomnom`, `perplexity-fast`, `kimi-k2-thinking`, `glm` |
| **Specialized** | `qwen-coder`, `qwen-character` |

### Response Styles

Five personas: Basic, Precise, Deep Dive, Emotional Support, Philosophical — each with XML-structured system prompts composing Safety Protocol + Identity Protocol + Language Guard + persona-specific identity.

## Current API Status ✅

**Status: All APIs Working**

**Versions:**
- `ai`: 6.0.45 (installed)
- `ai-sdk-pollinations`: 0.0.1 (installed)

**Chat** (`/api/chat/completion`):
- ✅ Using `ai-sdk-pollinations` with `generateText` (non-streaming)
- ✅ Smart Router integration for auto search detection
- ✅ Web Context Service for enhanced responses
- ✅ Returns JSON: `{ choices: [{ message: { content, role } }] }`
- ⏳ Streaming (`streamText`) deferred until SDK stabilizes (see Phase 2 docs)

**Image/Video — Pollinations** (`/api/generate`):
- ✅ Custom SDK shim (`src/lib/pollinations-sdk.ts`)
- ✅ All Pollinations models supported
- ✅ Server-side GET fetch fallback for URLs >2000 chars (returns base64 data URL)
- ✅ Prompt enhancement pipeline (`/api/enhance-prompt`) with 1000-char cap

**Image/Video — Replicate** (`/api/replicate`):
- ✅ Server-side prediction polling with configurable timeouts
- ✅ Reference images via S3 signed URLs (same flow as Pollinations)
- ✅ Centralized parameter mapping (`replicate-image-params.ts`)
- ✅ Models: flux-2-max, grok-imagine-video (+ disabled: flux-2-pro, flux-kontext-pro, etc.)

**Compose/Music** (`/api/compose` via Pollinations):
- ✅ Compose mode with `useComposeMusicState` hook
- ✅ Pollinations audio with `model=elevenmusic`
- ✅ VibeCraft enhancement prompt for music descriptions

**TTS** (`/api/tts`):
- ✅ Replicate SDK (`minimax/speech-02-turbo`)

**Requirements:**
- `POLLEN_API_KEY` - Pollinations API access
- `REPLICATE_API_TOKEN` - TTS + Replicate image/video generation
- AWS credentials for S3 asset storage

## Known Technical Debt

1. **Large Components**: `ChatInput.tsx` (~470 lines), `ChatProvider.tsx` (~1000 lines)
2. **Type Safety**: `Conversation` mixes persisted and runtime state
3. **Test Coverage**: Low on core logic

## Roadmap (2026-01-22)

### Phase 1: Asset & Gallery Deep-Sync ✅ COMPLETE

**Completion**: 2026-01-22 | **Full Summary**: [docs/phase-1-complete.md](docs/phase-1-complete.md)
- [x] Image-Generation Loop: Centralized `GalleryService.saveGeneratedAsset()` handles all generation flows (2026-01-22)
  - Refactored duplicate code in `ChatProvider.tsx` and `UnifiedImageTool.tsx`
  - Supports both Pollinations (S3) and Replicate (blob) storage
- [x] Blob-Management: Global `BlobManager` with automatic cleanup (2026-01-22)
  - Reference counting for shared blob URLs
  - Automatic cleanup on unmount and page unload
  - Periodic cleanup of old URLs (5-minute intervals)
  - React hooks: `useBlobUrl()` and `useBlobUrls()`
  - Integrated into `useAssetUrl`, `DatabaseService.getAssetUrl()`
  - Debug stats: `BlobManager.getStats()` and `BlobManager.debug()`
- [x] Fallback-Handling: `AssetFallbackService` with comprehensive fallback chain (2026-01-22)
  - Auto-fetch from S3 with exponential backoff retry (max 3 attempts)
  - Automatic download and cache of missing blobs in background
  - Fallback priority: blob → remoteUrl → S3 signed URL → download & cache
  - Enhanced `useAssetUrl` with `refresh()` method for expired URLs
  - `useAssetPrecache()` hook for gallery pre-loading
  - `GalleryService.verifyAndRepairAssets()` for bulk asset repair

### Phase 2: Code-Hygiene & Legacy ✅ COMPLETE

**Completion**: 2026-01-22

- [x] Remove legacy model refs: Verified `gpt-oss-120b` already removed from codebase
- [x] Streaming status documented: `generateText` working, `streamText` deferred until SDK stable
  - See: [docs/streaming-status.md](docs/streaming-status.md)
- [x] ChatView.tsx evaluated: 143 lines, well-structured, no refactoring needed

### Phase 3: Security & Performance (LONG-TERM)
- [ ] Web Crypto API encryption for `messages` and `memories` tables
- [ ] Migrate remaining localStorage settings to Dexie

## Environment Variables

```
POLLEN_API_KEY            # Pollinations API (also accepts POLLINATIONS_API_KEY / POLLINATIONS_API_TOKEN)
REPLICATE_API_TOKEN       # TTS + Replicate image/video generation
REPLICATE_TOOL_PASSWORD   # Optional: password-protects /api/replicate endpoint
DEEPGRAM_API_KEY          # STT (used in stt-flow.ts)
AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
```

## Import Alias

`@/*` maps to `./src/*`
