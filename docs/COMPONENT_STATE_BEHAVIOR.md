# Component & App State Behavior Specifications

This document details the actual state machines, routes, and logic flows of the application.

## 1. Global Application State

The app is orchestrated by `src/app/unified/page.tsx` and uses two primary view states.

### App States (`AppState`)

| State | Logic Trigger | UI Component | Purpose |
| :--- | :--- | :--- | :--- |
| **`landing`** | Default; triggered via `chat.startNewChat()` | `LandingView` | Initial entry point, hero section, and quick prompt starters. |
| **`chat`** | Triggered when a message is sent or a history item is selected | `ChatInterface` | The main AI interaction hub (Text, Image, Video). |

### Navigation & Transitions
*   **Landing -> Chat**: Handled by `handleNavigateToChat`. It initializes a new conversation and switches the state.
*   **Chat -> Landing**: Triggered by "New Chat" in the sidebar.

---

## 2. UnifiedImageTool (In-Chat Media Generator)

*   **Logic Component**: `src/components/chat/ChatInput.tsx` (via `VisualizeInlineHeader`)
*   **State Hook**: `src/hooks/useUnifiedImageToolState.ts`
*   **Trigger**: Activated via **Tools -> Visualize** in the Chat Input bar.
*   **Context**: Fully integrated into the chat flow; no longer a standalone view state.

### Media Generation Flow

1.  **Input Submission**:
    *   Checks for text prompt and/or reference images.
    *   **Reference Upload**: Images are proxied via `/api/upload/temp` to provide public URLs for providers.
2.  **API Routing**:
    *   Pollinations models -> `/api/generate` (On-the-fly generation via URL parameters).
    *   Replicate models -> `/api/replicate` (Server-side polling for completion).
3.  **Persistence**:
    *   Generated assets (images/videos) are embedded directly into the chat message content.
    *   Assets are saved to **IndexedDB (Dexie)** via the `assets` table.

---

## 3. Global Chat State (`useChatState`)

The monolithic `useChatState` has been refactored into a composer hook that delegates responsibility to specialized sub-hooks.

### Core Hooks Structure

#### A. `useChatPersistence` (Data Layer)
*   **Responsibility**: Manages all database interactions via `DatabaseService`.
*   **State**: `conversations`, `activeConversationId`, `messages`.
*   **Sync**: Uses Dexie's `useLiveQuery` to reactively update UI when DB changes occur.
*   **Actions**: `createConversation`, `addMessage`, `deleteConversation`.

#### B. `useChatUI` (Interface Layer)
*   **Responsibility**: Manages transient UI state (panels, dialogs).
*   **State**:
    *   `sidebarState` (Expanded/Collapsed)
    *   `rightPanelState` (History/Advanced/None)
    *   `dialogState` (EditTitle/Camera/None)
*   **Actions**: `toggleSidebar`, `openPanel`, `closeDialog`.

#### C. `useChatMedia` (Media Layer)
*   **Responsibility**: Handles audio input/output and camera integration.
*   **State**: `isRecording`, `isPlaying`, `cameraActive`.
*   **Actions**: `startRecording`, `stopRecording`, `captureImage`, `speakText`.

#### D. `useChatEffects` (Side Effects)
*   **Responsibility**: Reacts to state changes (e.g., auto-scrolling, focus management).
*   **Logic**: Handles the delicate restoration of chat state on page load (currently monitoring a known race condition).

---

## 4. Personalization & Settings

*   **Route**: `/settings`
*   **Component**: `PersonalizationTool.tsx`
*   **Type**: Persisted controlled form using `useLocalStorageState`.

### Key Persistence Keys
*   `userDisplayName`: How the AI addresses the user.
*   `customSystemPrompt`: Overrides the default assistant behavior.
*   `selectedModelId`: The default LLM choice.