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

*   **Component**: `src/components/tools/UnifiedImageTool.tsx`
*   **State Hook**: `src/hooks/useUnifiedImageToolState.ts`
*   **Context**: Integrated within both `LandingView` and `ChatInterface`.

### Media Generation Flow

1.  **Input Submission**:
    *   Checks for text prompt and/or reference images.
    *   **Reference Upload**: Images are proxied via `/api/upload/temp`.
2.  **API Routing**:
    *   Pollinations models -> `/api/generate`.
    *   Replicate models -> `/api/replicate`.
3.  **Persistence**:
    *   Generated assets are saved to **IndexedDB** (local vault) via `persistRemoteImage`.
    *   Sidebar history is updated via `addImageToHistory`.

---

## 3. Global Chat State (`useChatState`)

*   **Hook**: `src/hooks/useChatState.ts`
*   **Persistence Layer**: `IndexedDB` (via `DatabaseService`).

### Critical Slices

#### Slice 1: Conversation Management
*   **`activeConversation`**: The current session object.
*   **`allConversations`**: The full list loaded from IndexedDB.
*   **`isInitialLoadComplete`**: Guard for hydration.

#### Slice 2: UI Overlays
*   **Panels**: `isHistoryPanelOpen`, `isGalleryPanelOpen`, `isAdvancedPanelOpen`.
*   **Dialogs**: `isEditTitleDialogOpen`, `isCameraOpen`.

#### Slice 3: Fallback Logic
*   **Mistral Fallback**: Stored in `localStorage` (`mistralFallbackEnabled`). Activated when Pollinations returns 5xx/429 errors.

---

## 4. Personalization & Settings

*   **Route**: `/settings`
*   **Component**: `PersonalizationTool.tsx`
*   **Type**: Persisted controlled form using `useLocalStorageState`.

### Key Persistence Keys
*   `userDisplayName`: How the AI addresses the user.
*   `customSystemPrompt`: Overrides the default assistant behavior.
*   `selectedModelId`: The default LLM choice.

