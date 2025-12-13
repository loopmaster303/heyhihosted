# Architecture & Core Features Analysis

## Overview

This document provides a deep dive into the core features and architecture of the "Hey Hi to AI" application. The project is a Next.js 15 (App Router) + React 18 + TypeScript application that provides unified access to multiple AI models and tools through a modern, theme-aware UI powered by Tailwind CSS, shadcn/ui primitives, Framer Motion, and Lucide icons.

**Global Architecture:**
- Root layout (`src/app/layout.tsx`) wires global providers: `ThemeProvider`, `LanguageProvider`, and shared `AppLayout` with `AppSidebar`
- Each tool lives as an isolated App Router page with its own context/state management
- Centralized API routes (`src/app/api/*`) proxy to third-party AI services with Zod validation and environment-guarded secrets
- localStorage-persisted preferences and history enable offline-first UX
- Jest tests cover critical flows like prompt sanitization

---

## Core Features

### 1. Long Language Loops Chat Workspace

**Purpose:** Multi-turn conversational AI workspace with streaming responses, file attachments, optional image generation, web browsing, and TTS/STT capabilities.

#### Capabilities
- **Multi-model chat:** Switch between Pollinations models (OpenAI, Gemini, Claude, DeepSeek, Mistral, etc.) and Replicate models
- **Streaming responses:** Server-Sent Events (SSE) for real-time token streaming via Pollinations API
- **Conversation history:** Persistent localStorage with 50 max stored conversations, full-text search, titled threads
- **System prompt customization:** Predefined response styles (Basic, Precise, Deep Dive, Emotional Support, Philosophical) + custom user-defined prompts
- **File/image uploads:** Camera capture, file selection (images, PDFs, etc.) for vision-enabled models
- **On-demand Pollinations images:** Generate images inline within conversations
- **Code mode:** Toggle for syntax-highlighted code blocks with enhanced formatting
- **Web browsing:** Gemini Search integration for live information retrieval (when available model supports it)
- **Text-to-speech (TTS):** Convert responses to audio via Replicate's MiniMax Speech-02-Turbo with voice selection
- **Speech-to-text (STT):** Deepgram STT for voice input capture
- **Voice selection:** Multiple voice options (German, English variants) with TTS voice config
- **Message editing/deletion:** Full conversation control
- **Image mode toggle:** Switch context for image generation intents
- **Advanced settings panel:** Model, style, voice, and web browsing controls accessible during chat

#### Involved Components/Modules

**Chat Container & Context:**
- `src/components/ChatProvider.tsx` (769 lines) — Central state management
  - Manages: conversations, messages, UI dialogs, streaming state, audio playback, recording state, camera, attachment state
  - Exports: `useChatLogic()` hook and `useChat()` context consumer
  - Integrates custom hooks: `useChatState`, `useChatAudio`, `useChatRecording`, `useChatEffects`
  - Services: `ChatService` from `src/lib/services/chat-service.ts`

**Chat UI Components:**
- `src/components/chat/ChatView.tsx` — Main chat container, message list rendering
- `src/components/chat/MessageBubble.tsx` — Individual message rendering with code blocks, markdown, attachments
- `src/components/chat/ChatInput.tsx` — Input field with file/image/camera controls, mode toggles, history/settings panels
- `src/components/chat/WelcomeScreen.tsx` — Initial greeting and feature hints
- `src/components/chat/HistoryPanel.tsx` — Searchable conversation history with edit/delete actions
- `src/components/chat/AdvancedSettingsPanel.tsx` — Real-time model, style, voice, and web browsing toggles

**Dialog Components:**
- `src/components/dialogs/EditTitleDialog.tsx` — Rename conversation
- `src/components/dialogs/CameraCaptureDialog.tsx` — Webcam capture for images

**Page/Container:**
- `src/app/chat/page.tsx` — Wraps everything with `ChatProvider` and `AppLayout`

#### API Dependencies
- **POST `/api/chat/completion`** — Stream Pollinations chat completions (SSE)
- **POST `/api/chat/title`** — Generate conversation titles via GPT-3.5
- **POST `/api/generate`** — Inline Pollinations image generation
- **POST `/api/tts`** — Replicate TTS endpoint wrapper
- **POST `/api/stt`** — Deepgram STT endpoint wrapper
- **POST `/api/enhance-prompt`** — Optional prompt enhancement (OpenAI fallback)
- **POST `/api/upload`** — Handle file/image uploads to cloud storage

#### Storage & Permissions
- **localStorage Keys:**
  - `userDisplayName` — User's configured name (default: "john")
  - `customSystemPrompt` — Custom system prompt (empty by default)
  - `selectedModelId` — Active chat model (defaults to `DEFAULT_POLLINATIONS_MODEL_ID`)
  - `selectedVoice` — TTS voice preference (defaults to first AVAILABLE_TTS_VOICES)
  - `selectedImageModelId` — Image generation model for inline requests
  - `conversations` — Array of `Conversation` objects (max 50, latest first)
  - `sidebarExpanded` — UI state for sidebar collapse/expand
  - `webBrowsingEnabled` — Boolean for web browsing toggle state

- **Browser Permissions:**
  - Microphone (STT recording)
  - Camera (image capture)
  - Clipboard (file previews)

#### Data Types
- `ChatMessage` — Single message with ID, role (user/assistant), content, attachments, timestamps
- `Conversation` — Thread container with title, messages, toolType, created/updated timestamps
- `ChatMessageContentPart` — Union of text/image/code content types
- `ImageHistoryItem` — Reference to inline-generated images

#### State Management Hooks
- `useChatState()` — Returns all chat UI state variables and setters
- `useChatAudio()` — Handles TTS playback, voice selection, audio ref
- `useChatRecording()` — Manages STT recording lifecycle (MediaRecorder setup, audio chunks)
- `useChatEffects()` — Side effects for loading/saving conversations on mount
- `useChat()` — Consumer hook to access ChatProvider context

#### UI State Details
- `isAiResponding` — Disables input during streaming
- `isHistoryPanelOpen` / `isAdvancedPanelOpen` — Panel visibility toggles
- `isImageMode` — Flags that next message is image-generation intent
- `isRecording` / `isTranscribing` — STT recording state
- `isCameraOpen` — Camera dialog visibility
- `webBrowsingEnabled` — Web search toggle (only for compatible models)
- `chatInputValue` — Current input text with auto-save to localStorage
- `playingMessageId` — Track which message's TTS is playing
- `isTtsLoadingForId` — Track TTS generation progress per message

#### Configuration
- **Models:** `src/config/chat-options.ts` defines `AVAILABLE_POLLINATIONS_MODELS` (16+ models)
- **Response Styles:** 6 predefined + custom, each with localized system prompts
- **TTS Voices:** German/English variants via `AVAILABLE_TTS_VOICES`

---

### 2. VisualizingLoops / Unified Image Generation

**Purpose:** Advanced image/video generation interface supporting 15+ AI models (Pollinations + Replicate) with reference image uploads, batch operations, configurable model parameters, and gallery persistence.

#### Capabilities
- **Multi-model support:** 15 different generators including:
  - Pollinations: `gpt-image`, `seedream`, `seedream-pro`, `nanobanana`, `nanobanana-pro`, `flux-2-pro`, `veo`, `seedance-pro`, `wan-2.5-t2v`, `wan-2.5-i2v`, `qwen-image-edit-plus`
  - Replicate: `flux-2-pro` (premium), `flux-kontext-pro`, `z-image-turbo`, video models (`veo-3.1-fast`, `wan-2.5-t2v`)
- **Dynamic model selection:** Dropdown with live config changes
- **Reference image uploads:** Support varies by model (1-8 reference images depending on model)
- **Dynamic model parameters:** Aspect ratio, resolution, output format, quality controls (populated from `UnifiedModelConfig`)
- **Batch generation:** Multiple image generation in sequence
- **Gallery persistence:** 100-image local history with thumbnails, metadata (prompt, model, parameters, timestamp)
- **Image reload/refresh:** Manual retry with same parameters
- **Advanced prompts:** Optional AI-powered prompt enhancement before sending
- **Search & filter:** Gallery search by prompt or model
- **Password protection:** Optional Replicate model access gating via localStorage password

#### Involved Components/Modules

**Main Tool:**
- `src/components/tools/UnifiedImageTool.tsx` (1211 lines) — Complete UI and state management
  - Form state: prompt, dynamic form fields based on model config, uploaded images
  - UI state: loading, error handling, panel toggles, image selection, config panel state
  - Actions: generate, enhance prompt, upload image, clear uploads, save/load history
  - Image handling: Base64 encoding, preview rendering, cleanup on unmount

**Supporting Components:**
- `src/components/tools/ImageHistoryGallery.tsx` — Thumbnail gallery, search, image selection, metadata display
- `src/components/page/ChatInterface.tsx` — May trigger inline image generation from chat

**Page Container:**
- `src/app/visualizepro/page.tsx` — Wraps with `AppLayout`, injects Replicate password from localStorage

#### Model Configuration
- `src/config/unified-model-configs.ts` (5190 bytes)
  - Defines `UnifiedModelConfig` interface: provider, outputType, supportedParameters, defaults
  - Maps model IDs to configurations: aspect ratios, resolutions, quality levels, seed support
  - Example: `flux-2-pro` supports 8 reference images, multiple aspect ratios

- `src/config/unified-image-models.ts` (4544 bytes)
  - Defines `UnifiedImageModel` interface: id, name, provider, outputType, supportsReference, features
  - Registry of 15 models with capabilities metadata

#### API Dependencies

**Pollinations Flow:**
- **POST `/api/generate`** → Pollinations image generation endpoint
  - Input: model, prompt, params (aspect_ratio, resolution, etc.), reference images (base64)
  - Output: image URL or base64 data
  - Features: Fast, free, batch-capable

**Replicate Flow:**
- **POST `/api/replicate`** — Generic Replicate prediction handler
  - Input: model, password (if gated), parameters, reference image
  - Process: Start prediction → Poll until completion (2-4 sec intervals, up to 60-150 attempts)
  - Output: prediction.output (usually array of image/video URLs)
  - Model endpoints: Hardcoded mapping in `MODEL_ENDPOINTS` dict (WAN, Flux, Z-Image, Veo models)
  - Password validation: Optional `REPLICATE_TOOL_PASSWORD` env check

#### Storage & Permissions
- **localStorage Keys:**
  - `imageHistory` — JSON array of `ImageHistoryItem[]` (max 100)
  - `replicateToolPassword` — User's Replicate password (optional, for premium model access)
  - `selectedImageModelId` — Last selected model ID

- **Image History Item Structure:**
  ```typescript
  {
    id: UUID,
    prompt: string,
    model: string,
    parameters: Record<string, any>,
    imageUrl: string,
    createdAt: Date,
    uploadedImages?: string[], // Base64
  }
  ```

#### Data Types
- `UnifiedModelConfig` — Model-specific parameter schemas and defaults
- `UnifiedImageModel` — Model registry metadata
- `ImageHistoryItem` — Gallery persistence type

#### UI State Details
- `selectedModelId` — Currently active model
- `prompt` — User input text
- `formFields` — Dynamic model-specific params (varies per model)
- `uploadedImages[]` — Array of Base64-encoded reference images
- `loading` — Generation in progress
- `isEnhancing` — Prompt enhancement in progress
- `selectedImage` — Currently viewed history item
- `isHistoryPanelOpen` / `isConfigPanelOpen` — Side panel toggles
- `openConfigParam` — Which parameter panel is open (aspect_ratio, resolution, etc.)
- `isImageUploadOpen` — Reference image upload dialog
- `isUploading` — File upload in progress

#### Model-Specific Behaviors
- **Pollinations models** (gpt-image, seedream, nanobanana):
  - Free, instant
  - Up to 8 reference images
  - Aspect ratio/resolution from model config

- **Replicate Flux models** (flux-2-pro, flux-kontext-pro):
  - Requires API token + optional password
  - Multi-reference support (up to 8)
  - Higher quality, slower (30-60 sec)
  - Polling mechanism with exponential backoff

- **Video models** (wan-2.5-t2v, veo-3.1-fast):
  - Output type: 'video' instead of 'image'
  - Longer polling timeouts (150 attempts, 4 sec intervals)
  - May accept reference images for I2V variants

---

### 3. Replicate Image/Video + TTS Integrations

**Purpose:** Premium AI model access through Replicate API with optional password gating, SSE-like polling, and direct server-side TTS generation.

#### Capabilities
- **Premium image/video models:** Access to FLUX 2 Pro, Veo 3.1, WAN 2.5, Z-Image-Turbo
- **Image-to-image (I2I):** Edit/manipulate existing images (qwen-image-edit-plus, seedance-pro, wan-2.5-i2v)
- **Text-to-video (T2V):** Generate video from prompt (wan-2.5-t2v, veo-3.1-fast)
- **Image-to-video (I2V):** Animate static images (wan-2.5-i2v, seedance-pro)
- **Long-form video:** Support for up to 10-minute outputs (via polling timeout tuning)
- **Parameter control:** Seed, output quality, duration, aspect ratio per model
- **Password protection:** Optional master password via environment variable
- **TTS with voice selection:** Convert text to speech with emotional expression and language boost
- **Async polling:** Non-blocking prediction status checks with configurable intervals
- **Fallback chain:** Primary Replicate → Fallback error messages

#### Involved Components/Modules

**API Route:**
- `src/app/api/replicate/route.ts` (152 lines)
  - Handler: `POST /api/replicate`
  - Functions: Password validation, model routing, input sanitization, prediction polling
  - Polling strategy:
    - Long-form video (WAN, Hailuo): 4000 ms interval, max 150 attempts (~600 sec)
    - Images: 2000 ms interval, max 60 attempts (~120 sec)
  - Error handling: Malformed input, invalid model, prediction failure, timeout

**TTS Flow:**
- `src/ai/flows/tts-flow.ts` (79 lines)
  - Server action: `textToSpeech(text, voice)`
  - Integration: Direct Replicate MiniMax Speech-02-Turbo model
  - Input validation: Non-empty text, valid voice_id
  - Parameters: emotion="auto", language_boost="Automatic", english_normalization=false
  - Output: Base64 audio data URI for playback
  - Polling: Same as image (2000 ms, up to 40 attempts)

**API Endpoints:**
- `src/app/api/tts/route.ts` — HTTP wrapper around `tts-flow.ts`
- `src/app/api/stt/route.ts` — Deepgram STT (not Replicate, but companion feature)

#### API Dependencies
- **Replicate API:** `https://api.replicate.com/v1/models/{model}/predictions`
- **MiniMax TTS Model:** `minimax/speech-02-turbo` on Replicate
- **Deepgram STT:** Separate provider for speech-to-text

#### Storage & Permissions
- **Environment Variables (Required for Replicate):**
  - `REPLICATE_API_TOKEN` — Required, gated in `requireEnv()` call
  - `REPLICATE_TOOL_PASSWORD` — Optional, enables master password protection

- **localStorage Keys:**
  - `replicateToolPassword` — User-entered password (compared against env var)

- **Password Gate Flow:**
  1. User sets password in PersonalizationTool settings page
  2. Stored in localStorage
  3. On API call, password sent in request body
  4. Server validates against `process.env.REPLICATE_TOOL_PASSWORD`
  5. If mismatch: 401 Unauthorized response

#### Model Endpoint Mapping
```typescript
MODEL_ENDPOINTS = {
  // Video
  "wan-video/wan-2.5-t2v": "wan-video/wan-2.5-t2v",
  "wan-video/wan-2.5-i2v": "wan-video/wan-2.5-i2v",
  "google/veo-3.1-fast": "google/veo-3.1-fast",
  // Premium Images
  "black-forest-labs/flux-2-pro": "black-forest-labs/flux-2-pro",
  "black-forest-labs/flux-kontext-pro": "black-forest-labs/flux-kontext-pro",
  "prunaai/z-image-turbo": "prunaai/z-image-turbo",
  // Legacy support
  "flux-2-pro": "black-forest-labs/flux-2-pro", // fallback
  // ... 7 more
}
```

#### Request/Response Flow
1. **Client:**
   - Collects model, prompt, parameters, optional reference image
   - Calls POST `/api/replicate` with password (if enabled)

2. **Server API Route (`route.ts`):**
   - Validates master password (if set)
   - Extracts model and routes to Replicate endpoint
   - Sanitizes input (integer conversion for seed/duration/quality)
   - Sends prediction start request
   - Polls status with intervals based on model type
   - Returns `{ output: prediction.output }` on success

3. **TTS Flow (`tts-flow.ts`):**
   - Constructs MiniMax input with voice_id
   - Starts prediction, polls until succeeded/failed
   - Returns audio data URI

4. **Client Handling:**
   - Shows loading spinner during polling
   - Displays image/video URL or error on completion
   - Optional auto-save to gallery history

#### Error Handling
- Invalid model: 400 Bad Request
- Missing password: 401 Unauthorized
- Replicate API unreachable: 502 Bad Gateway
- Prediction failed: 500 Internal Server Error + error message from Replicate
- Polling timeout: 504 Gateway Timeout (>150 attempts exceeded)
- Prediction incomplete: 500 (reached max attempts without final status)

---

### 4. Personalization / Settings UI

**Purpose:** Centralized configuration panel for user preferences, model selections, system prompts, and password management.

#### Capabilities
- **Display name:** User-facing name (default: "john")
- **System prompt customization:** Override default style prompts with custom instructions
- **Response style selection:** Choose predefined styles or enable custom prompt mode
- **Chat model selection:** Dropdown to switch between Pollinations models + vision/web indicators
- **TTS voice selection:** Choose language and voice variant for text-to-speech
- **Image model selection:** Default model for inline/gallery image generation
- **Replicate password:** Optional password for premium model access
- **Real-time preview:** Shows active system prompt based on selected style
- **Help text:** Descriptions of each setting with localization support

#### Involved Components/Modules

**Settings Page:**
- `src/app/settings/page.tsx` (60 lines)
  - Entry point for settings UI
  - Loads all preferences from localStorage via `useLocalStorageState()` hook
  - Wraps with ErrorBoundary and AppLayout
  - Injects state setters into PersonalizationTool

**Tool Component:**
- `src/components/tools/PersonalizationTool.tsx` (337 lines)
  - Central form with 7 card sections:
    1. Display Name Input
    2. Response Style Selector
    3. System Prompt Textarea (editable preview)
    4. Chat Model Dropdown with badges
    5. TTS Voice Dropdown with voice listing
    6. Image Model Dropdown
    7. Replicate Password Input (masked)
  - Auto-updates response style based on custom prompt presence
  - Shows localized descriptions and capability badges (Vision, Web Search)
  - Real-time system prompt preview that updates when style changes
  - Uses shadcn `Card`, `Input`, `Textarea`, `Select` components

**Config Dependencies:**
- `src/config/chat-options.ts` — `AVAILABLE_RESPONSE_STYLES`, `AVAILABLE_POLLINATIONS_MODELS`, `AVAILABLE_TTS_VOICES`, `CODE_REASONING_SYSTEM_PROMPT`
- `src/config/unified-image-models.ts` — `getImageModels()` for image model list

#### Storage & Permissions
- **localStorage Keys (all synchronized with ChatProvider + settings):**
  - `userDisplayName` — User name (string, default: "john")
  - `customSystemPrompt` — Custom prompt override (string, default: "")
  - `replicateToolPassword` — Password for premium models (string, encrypted client-side recommended)
  - `selectedModelId` — Active chat model ID (string, default: `DEFAULT_POLLINATIONS_MODEL_ID`)
  - `selectedVoice` — TTS voice ID (string, default: first voice in list)
  - `selectedImageModelId` — Default image generation model (string, default: `DEFAULT_IMAGE_MODEL`)

#### UI State Details
- `userDisplayName` — Text input
- `customSystemPrompt` — Textarea with real-time preview
- `selectedResponseStyle` — Dropdown, auto-set to "User's Default" if custom prompt exists
- `selectedModelId` — Dropdown with Vision/Web indicators
- `selectedVoice` — Dropdown filtered by language
- `selectedImageModelId` — Dropdown of available image generators
- `replicateToolPassword` — Password input (type="password")
- `isClient` — Hydration flag to prevent SSR mismatch

#### Localization
- All labels, descriptions, and style names are i18n-aware via `useLanguage()` hook
- Translations in `src/config/translations.ts` with keys like:
  - `responseStyle.precise.label`, `responseStyle.precise.description`
  - `systemPrompt.precise`, `systemPrompt.basic`, etc.
  - Model names and capability labels

#### Related Integration
- Settings changes **immediately** available to ChatProvider via context consumer
- Image model selection affects both chat inline generation and gallery default
- Custom system prompt overrides all predefined styles
- TTS voice selection applied to next TTS playback request

---

### 5. Nonogram Mini-App

**Purpose:** Interactive puzzle game with multiple modes (preset, freestyle, builder) and persistence.

#### Status: **Incomplete**

**Current State:**
- Translations exist in `src/config/translations.ts` with keys for:
  - `nonogram.title`, `nonogram.description`
  - `nonogram.mode.preset`, `nonogram.mode.freestyle`, `nonogram.mode.builder`
  - `nonogram.difficulty.*` and `nonogram.ui.*` labels
  - Hints, solution reveal, confetti celebration messages

- **No actual implementation found:**
  - No route in `src/app/nonogram/` or similar
  - No component in `src/components/nonogram/` or similar
  - No Nonogram context or state management
  - No puzzle solver logic
  - Mentioned in config but unreferenced in actual code

**Planned Capabilities (from translations):**
- **Preset Mode:** Predefined puzzles with difficulty levels (Easy, Medium, Hard, Expert)
- **Freestyle Mode:** Random puzzle generation or manual entry
- **Builder Mode:** User-created puzzles with custom rules
- **Hints System:** Reveal cell(s) or hint row/column clues
- **Solution Reveal:** Show complete solution
- **Progress Tracking:** Save state locally for in-progress puzzles
- **Celebration:** Confetti animation on successful completion
- **Leaderboard:** Track solve times (inferred from feature names)
- **Dark/Light Theme:** Automatic theme awareness via `useTheme()`

**Implications:**
- Nonogram feature is **planned but not yet developed**
- Sidebar navigation does NOT include nonogram link (only chat + image tools)
- If enabled, would need:
  1. New page: `src/app/nonogram/page.tsx`
  2. New component: `src/components/tools/NonogramGame.tsx` or similar
  3. State management: Context for puzzle state, settings, progress
  4. Solver algorithm: Constraint propagation or backtracking
  5. UI: Grid rendering, clue display, hint system, mode selector
  6. Storage: localStorage for progress, custom puzzles
  7. Sidebar integration: Add navigation button to AppSidebar

**Related Files (Translation References Only):**
- `src/config/translations.ts` — 100+ lines of nonogram-related i18n keys (de/en)

---

## Cross-Feature Patterns & Shared Infrastructure

### Providers & Context
- **ThemeProvider** (`src/components/ThemeProvider.tsx`) — next-themes integration for dark/light mode, auto-persists to localStorage
- **LanguageProvider** (`src/components/LanguageProvider.tsx`) — i18n context, localStorage-persisted language selection (de/en)
- **ChatProvider** (`src/components/ChatProvider.tsx`) — Centralized chat state exported via `useChat()` hook
- **AppLayout** (`src/components/layout/AppLayout.tsx`) — Combines AppSidebar + main content area
- **AppSidebar** (`src/components/layout/AppSidebar.tsx`) — Navigation hub for all tools, user name display, theme/language toggles

### Shared Utilities
- `useLocalStorageState()` — Custom hook for localStorage key-value state synchronization (default value + getter/setter pattern)
- `useOnClickOutside()` — Close panels on external clicks
- `useEscapeKey()` — Dismiss dialogs/panels with Escape key
- `useChatState()`, `useChatAudio()`, `useChatRecording()` — ChatProvider helper hooks
- `generateUUID()` — ID generation for conversations, messages, history items
- `toDate()` — Timestamp conversion utility

### UI Components (shadcn/ui)
- Button, Input, Textarea, Select — Form controls
- Card, CardContent, CardHeader, CardTitle — Layout containers
- Badge — Model capability indicators (Vision, Web, etc.)
- Dropdown, Dialog — Modals and menus
- All styled with Tailwind CSS + next-themes color system

### API Error Handling
- `src/lib/api-error-handler.ts` — Centralized error normalization
- `handleApiError()` — Converts errors to structured API responses
- Zod schemas for request validation (minimal, mostly in route handlers)

### Type System
- `src/types/` — TypeScript interfaces for chat messages, conversations, API responses, predictions
- `src/types/api.ts` — API-specific types (Pollinations responses, Replicate predictions, error responses)

---

## Data Flow Diagrams

### Chat Message Flow
```
User Input (ChatInput)
  → onSendMessage(text, options)
    → ChatProvider.sendMessage()
      → ChatService.addMessage()
      → POST /api/chat/completion (SSE)
      → Stream tokens → ChatProvider.setActiveConversation()
      → localStorage.conversations updated
      → ChatView re-renders with new bubble
```

### Image Generation Flow
```
UnifiedImageTool Prompt
  → Prompt Enhancement (optional: POST /api/enhance-prompt)
  → Determine provider (Pollinations vs Replicate)

  Pollinations Flow:
    → POST /api/generate
    → Instant return with image URL
    → Add to history + localStorage

  Replicate Flow:
    → Validate password
    → POST /api/replicate with model + params
    → Poll until prediction.status === "succeeded"
    → Extract URL from prediction.output
    → Add to history + localStorage
```

### TTS Flow
```
Chat Response Bubble → TTS Button Click
  → ChatProvider.handlePlayAudio()
    → POST /api/tts with text + voice
    → Returns audio data URI
    → HTMLAudioElement.play()
    → Shows playing state + loading spinner
    → Cleanup on unmount or next playback
```

---

## Environment Variables & Secrets

**Required:**
- `REPLICATE_API_TOKEN` — Replicate API authentication (checked via `requireEnv()`)
- `POLLINATIONS_API_KEY` — Optional, may be public API (depends on Pollinations setup)

**Optional:**
- `REPLICATE_TOOL_PASSWORD` — Master password for premium model access (if not set, all users get access)
- `DEEPGRAM_API_KEY` — STT provider key
- `OPENAI_API_KEY` — Fallback for prompt enhancement

**Client-Side Secrets:**
- `replicateToolPassword` from localStorage — User-entered password (not environment-guarded)

---

## Testing & Validation

**Jest Tests:**
- `src/__tests__/` — Prompt sanitization, error handling, API validation
- No E2E tests documented, but ErrorBoundary provides runtime error recovery

---

## Performance Considerations

- **Chat streaming:** SSE for low-latency token delivery
- **Image generation:** Polling intervals tuned per model (2-4 sec for images, 4 sec for video)
- **localStorage:** 50 conversations max, 100 images max (soft limits, not enforced)
- **Lazy loading:** Pages use `useState` + `useEffect` for client-side hydration checks
- **Memory:** Audio/recording buffers cleaned up on unmount
- **Caching:** No explicit caching beyond localStorage (relies on browser HTTP cache for images)

---

## Security Notes

1. **Password Protection:** Replicate tool password sent plaintext in request body (should use HTTPS in production)
2. **CORS:** API routes are same-origin (next-auth optional, not implemented)
3. **Rate Limiting:** None documented (relies on provider rate limits)
4. **Input Validation:** Zod schemas minimal, mostly string/number type coercion
5. **File Uploads:** Base64 encoding on client, server-side validation needed
6. **XSS:** MarkdownRenderer uses `dangerouslySetInnerHTML` (should sanitize markdown output)

---

## Known Gaps & TODOs

- [ ] Nonogram game not implemented (translations only)
- [ ] No persistent database (localStorage only, single-device)
- [ ] No user authentication (settings/history not synced across devices)
- [ ] No image URL validation before rendering
- [ ] Rate limiting not enforced
- [ ] TTS audio not cached (re-generates on each playback)
- [ ] STT/Deepgram integration basic (no real-time streaming)
- [ ] Web browsing limited to Gemini models (no fallback to Perplexity/DuckDuckGo)
- [ ] Error recovery limited (no automatic retry with backoff)
