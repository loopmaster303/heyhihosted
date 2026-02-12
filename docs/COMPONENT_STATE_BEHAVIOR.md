# Component & App State Behavior Specifications

This document details the actual state machines, routes, and logic flows of the application.
**Last Updated:** February 2026

## 1. Global Application State

The app is orchestrated by `src/app/unified/page.tsx` and uses two primary view states.

### App States (`AppState`)

| State | Logic Trigger | UI Component | Purpose |
| :--- | :--- | :--- | :--- |
| **`landing`** | Default; triggered via `chat.startNewChat()` | `LandingView` | Initial entry point, hero section, and quick prompt starters. |
| **`chat`** | Triggered when a message is sent or a history item is selected | `ChatInterface` | The main AI interaction hub (Text, Image, Video, Music). |

### Navigation & Transitions
* **Landing -> Chat**: Handled by `handleNavigateToChat`. Initializes a new conversation and switches state.
* **Chat -> Landing**: Triggered by "New Chat" in the sidebar.

---

## 2. ChatProvider (Orchestrator)

`src/components/ChatProvider.tsx` is the central orchestrator (~1000 lines). It exposes `useChatLogic()` which composes all state hooks.

### Hook Composition

```
ChatProvider.tsx → useChatLogic()
├── useChatState()                    # Composer hook (see Section 3)
│   ├── useChatPersistence()          # IndexedDB via Dexie
│   ├── useChatUI()                   # Panel toggles, AI responding state
│   └── useChatMedia()                # Audio/Recording/Camera state declarations
├── useChatAudio()                    # TTS playback logic
├── useChatRecording()                # Voice recording logic (STT)
├── useChatEffects()                  # Side effects (auto-scroll, restore)
├── useUnifiedImageToolState()        # Visualize bar (via ChatInput)
├── useComposeMusicState()            # Compose/music bar (via ChatInput)
└── (Shortcuts wired in `ChatInterface.tsx`) # Global keyboard shortcuts
```

### Props Interface (`UseChatLogicProps`)
```typescript
interface UseChatLogicProps {
  userDisplayName?: string;
  customSystemPrompt?: string;
  defaultTextModelId?: string;
}
```

---

## 3. State Hook Architecture

### A. `useChatState` (Composer Hook)

**File**: `src/hooks/useChatState.ts`

Composes three sub-hooks and adds global settings:

```typescript
const persistence = useChatPersistence();
const ui = useChatUI();
const media = useChatMedia();
```

**Additional state managed directly:**
- `persistedActiveConversationId` (localStorage)
- `selectedImageModelId` (localStorage, synced from `defaultImageModelId`)
- `chatInputValue` (ephemeral)
- `lastUserMessageId` (ephemeral)
- `lastFailedRequest` / `retryLastRequestRef` (error recovery)

**Computed values:**
- `isImageMode` — from `activeConversation?.isImageMode`
- `isComposeMode` — from `activeConversation?.isComposeMode`
- `webBrowsingEnabled` — from `activeConversation?.webBrowsingEnabled`

Runs `MigrationService.migrateIfNeeded()` on mount.

---

### B. `useChatPersistence` (Data Layer)

**File**: `src/hooks/useChatPersistence.ts`

| Return | Type | Description |
|--------|------|-------------|
| `allConversations` | `Conversation[]` | Reactive list via `useLiveQuery` (metadata only, no messages) |
| `activeConversation` | `Conversation \| null` | Full conversation with messages |
| `setActiveConversation` | setter | Direct state update |
| `loadConversation(id)` | async | Loads full conversation from DB |
| `saveConversation(conv)` | async | Writes full conversation to DB |
| `updateConversationMetadata(id, updates)` | async | Partial metadata update |
| `deleteConversation(id)` | async | Deletes conversation + messages |
| `isInitialLoadComplete` | boolean | `true` when `useLiveQuery` has resolved |

---

### C. `useChatUI` (Interface Layer)

**File**: `src/hooks/useChatUI.ts`

| Return | Type | Description |
|--------|------|-------------|
| `isAiResponding` | boolean | Whether AI is currently generating a response |
| `isHistoryPanelOpen` | boolean | Chat history sidebar panel |
| `isAdvancedPanelOpen` | boolean | Advanced settings panel |

All with corresponding `set*` setters. No named actions — uses raw setState.

---

### D. `useChatMedia` (Media State Declarations)

**File**: `src/hooks/useChatMedia.ts`

State declarations only — logic lives in `useChatAudio` and `useChatRecording`.

| Return | Type | Description |
|--------|------|-------------|
| `playingMessageId` | `string \| null` | ID of message currently playing TTS |
| `isTtsLoadingForId` | `string \| null` | ID of message loading TTS |
| `audioRef` | `RefObject<HTMLAudioElement>` | Audio element reference |
| `selectedVoice` | string | Selected TTS voice ID |
| `isRecording` | boolean | Voice recording active |
| `isTranscribing` | boolean | STT transcription in progress |
| `mediaRecorderRef` | `RefObject<MediaRecorder>` | Recorder reference |
| `audioChunksRef` | `RefObject<Blob[]>` | Recording chunks |
| `isCameraOpen` | boolean | Webcam dialog open |

---

### E. `useChatAudio` (TTS Playback Logic)

**File**: `src/hooks/useChatAudio.ts`

Consumes `playingMessageId`, `audioRef`, `selectedVoice` from `useChatMedia` state.

**Key action:** `handlePlayAudio(messageId, text)` — calls `/api/tts`, manages playback lifecycle.

---

### F. `useChatRecording` (Voice Recording Logic)

**File**: `src/hooks/useChatRecording.ts`

Consumes `isRecording`, `mediaRecorderRef`, `audioChunksRef` from `useChatMedia` state.

**Key actions:**
- `startRecording()` — starts MediaRecorder
- `stopRecording()` — stops, sends blob to `/api/stt`, returns transcription

---

### G. `useChatEffects` (Side Effects)

**File**: `src/hooks/useChatEffects.ts`

Handles:
- Auto-scrolling on new messages
- Conversation state restoration on page load
- Focus management

---

### H. `useKeyboardShortcuts`

**File**: `src/hooks/useKeyboardShortcuts.ts`

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | New Chat |
| `Cmd/Ctrl + /` | Toggle Sidebar |
| `Escape` | Close panels |

Skips shortcuts when typing in input/textarea (except Escape).

---

## 4. UnifiedImageTool (Visualize Mode)

* **UI Component**: `src/components/tools/UnifiedImageTool.tsx` (via `VisualizeInlineHeader`)
* **State Hook**: `src/hooks/useUnifiedImageToolState.ts`
* **Trigger**: Activated via **Tools -> Visualize** in the Chat Input bar.

### Image Generation Flow

1. **Input Submission**: Checks for text prompt and/or reference images.
2. **Reference Upload**: Images uploaded to S3 via `/api/upload/sign` (signed URL), stored as `UploadedReference[]`.
3. **API Routing**:
   - Pollinations models → `/api/generate` (GET-based URL generation)
   - Replicate models → `/api/replicate` (server-side polling)
4. **Persistence**: Assets saved via `GalleryService.saveGeneratedAsset()` to IndexedDB `assets` table. Chat message stores an `assetId` reference, not the asset itself.

---

## 5. Compose Mode (Music Generation)

* **State Hook**: `src/hooks/useComposeMusicState.ts`
* **UI Component**: `src/components/tools/ComposeTool.tsx` (via `ComposeInlineHeader`)
* **Trigger**: Activated via **Tools -> Compose** in the Chat Input bar.

### State

| Field | Type | Description |
|-------|------|-------------|
| `duration` | number | Track duration |
| `instrumental` | boolean | Instrumental only |
| `isGenerating` | boolean | Generation in progress |
| `isEnhancing` | boolean | Prompt enhancement in progress |
| `audioUrl` | `string \| null` | Generated audio URL |
| `error` | `string \| null` | Error message |

### Actions
- `generateMusic(prompt)` — calls `/api/compose` (Pollinations Eleven Music, `model=elevenmusic`)
- `enhancePrompt(prompt)` — calls `/api/enhance-prompt` with VibeCraft prompt
- `reset()` — clears state

---

## 6. ChatInput Logic

* **Hook**: `src/hooks/useChatInputLogic.ts`
* **Component**: `src/components/chat/ChatInput.tsx`

### Tool Modes (`ToolMode`)

```typescript
type ToolMode = 'standard' | 'visualize' | 'compose' | 'research' | 'code';
```

Manages badge row toggles, mode switching, file selection, and submit handling. Code mode has preset model IDs: `qwen-coder`, `deepseek`, `glm`, `gemini-large`.

---

## 7. Personalization & Settings

* **Component**: `src/components/tools/PersonalizationTool.tsx`
* **Type**: Controlled form, state managed via props from ChatProvider.

### Settings (all persisted via `useLocalStorageState`)

| Prop | Description |
|------|-------------|
| `userDisplayName` | How the AI addresses the user |
| `customSystemPrompt` | Overrides default assistant behavior |
| `replicateToolPassword` | Optional auth for `/api/replicate` |
| `selectedModelId` | Default LLM choice |
| `selectedVoice` | TTS voice selection |
| `selectedImageModelId` | Default image model |
