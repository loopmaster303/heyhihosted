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
- **isCodeMode**: Activates `CODE_REASONING_SYSTEM_PROMPT` for programming
- **webBrowsingEnabled**: Deep Research mode → routes to `nomnom` model

### Smart Router (`src/lib/services/smart-router.ts`)

Auto-detects user intent via regex (German + English):
- **Search intent** (temporal keywords, news, prices) → `perplexity-fast`
- **Deep Research toggle** → `nomnom` or `perplexity-reasoning`
- **Normal chat** → User's selected model

### API Layer

**Chat** (`/api/chat/completion`):
- Vercel AI SDK (`streamText`) with `ai-sdk-pollinations` provider

**Image/Video Generation** (`/api/generate`):
- Custom Pollinations SDK shim (`src/lib/pollinations-sdk.ts`)
- All models via Pollinations API

**Text-to-Speech** (`/api/tts`):
- Only Replicate usage in the app (`minimax/speech-02-turbo`)

### Reference Images

**Upload Flow:**
1. User selects image(s) → uploaded to S3 via signed URL
2. Stored as `UploadedReference[]`: `{ url, key, expiresAt }`
3. Before API call: `resolveReferenceUrls()` refreshes expired URLs
4. Passed to Pollinations as URL parameter—Pollinations fetches them

**Model Limits** (`src/config/unified-image-models.ts`):

| Model | Max Images | Notes |
|-------|------------|-------|
| nanobanana(-pro) | 14 | Gemini-based |
| seedream(-pro) | 10 | ByteDance |
| gptimage-large | 8 | OpenAI |
| gpt-image | 4 | OpenAI Mini |
| veo | 2 | Video, supports audio |
| kontext, klein-large | 1 | Context editing |
| wan, seedance(-pro) | 1 | **Image-to-Video only** (no text-to-video) |
| flux, zimage | 0 | No reference support |

Logic in `useUnifiedImageToolState`: auto-truncates images when switching to model with lower limit.

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
└── useChatEffects()            # Side effects
```

### Database (Dexie v3 / IndexedDB)

```typescript
conversations: 'id, title, updatedAt, toolType'
messages: 'id, conversationId, timestamp'
memories: '++id, key, updatedAt'
assets: 'id, conversationId, timestamp, storageKey'
```

## Key Configurations

### Chat Models (`src/config/chat-options.ts`)

- Default: `claude-fast` (Claude Haiku 4.5)
- Auto-routed search: `perplexity-fast`
- Deep research: `nomnom`

### Response Styles

Five personas: Basic, Precise, Deep Dive, Emotional Support, Philosophical—with XML-structured system prompts.

## Current Migration Status (BROKEN)

**Status: Chat API not working - returns "Sorry, I couldn't get a response"**

**Versions:**
- `ai`: 6.0.45
- `ai-sdk-pollinations`: 0.0.1 (very early)

**Chat** (`/api/chat/completion`):
- Using `ai-sdk-pollinations` with `generateText` (non-streaming)
- Streaming (`streamText` + `toDataStreamResponse`) failed due to SDK version incompatibility
- Frontend `ChatService` expects JSON: `{ choices: [{ message: { content, role } }] }`

**Known Issues:**
1. `toDataStreamResponse is not a function` - SDK version mismatch
2. Stream vs JSON format mismatch - Frontend expected JSON, backend sent raw text
3. **Auth errors from Pollinations** - API Key required (`POLLEN_API_KEY`)
4. JSON body validation failed - Model ID or parameter format incompatibility

**Requires:** `POLLEN_API_KEY` environment variable for Pollinations API access

**Image**: Custom SDK shim (`src/lib/pollinations-sdk.ts`) - working
**Replicate SDK**: Installed for future use, only TTS active

## Known Technical Debt

1. **Large Components**: `ChatInput.tsx` (~400 lines), `ChatProvider.tsx` (~1000 lines)
2. **Type Safety**: `Conversation` mixes persisted and runtime state
3. **Test Coverage**: Low on core logic

## Roadmap (2026-01-22)

### Phase 1: Asset & Gallery Deep-Sync (HIGH)
- [x] Image-Generation Loop: Centralized `GalleryService.saveGeneratedAsset()` handles all generation flows (2026-01-22)
  - Refactored duplicate code in `ChatProvider.tsx` and `UnifiedImageTool.tsx`
  - Supports both Pollinations (S3) and Replicate (blob) storage
- [ ] Blob-Management: Global registry for `URL.revokeObjectURL` to prevent memory leaks
- [ ] Fallback-Handling: Auto re-fetch from remote URL if vault asset missing

### Phase 2: Code-Hygiene & Legacy (MEDIUM)
- [ ] Remove legacy model refs (`gpt-oss-120b`)
- [ ] Re-enable `streamText` when AI SDK compatible
- [ ] Extract `ChatView.tsx` logic into hooks

### Phase 3: Security & Performance (LONG-TERM)
- [ ] Web Crypto API encryption for `messages` and `memories` tables
- [ ] Migrate remaining localStorage settings to Dexie

## Environment Variables

```
POLLEN_API_KEY            # Pollinations API
REPLICATE_API_TOKEN       # TTS only
DEEPGRAM_API_KEY          # STT
AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
```

## Import Alias

`@/*` maps to `./src/*`
