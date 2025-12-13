# Comprehensive Architecture Analysis

## Executive Summary

This is a **Next.js 15 (App Router) + React 18 + TypeScript** application that provides accessible, barrier-free AI tools to democratize creative and conversational AI. Built with modern web standards and styled using **Tailwind CSS**, **shadcn/ui** (Radix primitives), **framer-motion**, **lucide-react** icons, and **next-themes**, the project integrates multiple AI providers including:

- **Pollinations AI** for free, open text chat and image generation
- **Replicate** for premium models (image, video, TTS)
- **Deepgram** for speech-to-text (STT)
- **OpenAI** (fallback) for prompt enhancement

The architecture emphasizes **no paywalls, no data storage, and low barriers to entry**. Global context providers (`ThemeProvider`, `LanguageProvider`, `ChatProvider`) manage theming, localization, and chat state, with localStorage-persisted user preferences and conversation history. API routes proxy third-party AI services with Zod validation and environment-guarded secrets. The application features a conversational AI workspace with streaming responses, image generation tools with advanced controls, personalization settings, and rich media handling (file uploads, camera capture, TTS/STT).

**Target deployment:** Vercel (with scheduled cron job for blob storage cleanup)  
**Testing:** Jest with @testing-library/react  
**Code quality:** ESLint, TypeScript strict mode, custom test suite for prompt sanitization

---

## Project Directory Structure

### Top-Level Organization

The project follows Next.js 15 App Router conventions with a clear separation between application code (`/src`), configuration files, and public assets.

| Directory/File | Purpose | Key Responsibilities |
|----------------|---------|----------------------|
| **`/src`** | Application source code | All TypeScript/React components, pages, API routes, utilities, hooks, and configuration |
| **`/src/app`** | App Router pages and API routes | File-system-based routing: pages, layouts, API endpoints, global styles |
| **`/src/components`** | React components | Reusable UI components (shadcn/ui primitives, custom components), global providers |
| **`/src/config`** | Configuration modules | Model definitions, translations, prompts, unified configs for AI services |
| **`/src/hooks`** | React custom hooks | Shared stateful logic (local storage, chat effects, audio/recording, UI utilities) |
| **`/src/lib`** | Library code and services | API error handling, service layers (chat, image generation), utility functions |
| **`/src/utils`** | Utility functions | Chat helpers, string manipulation, data transformation |
| **`/src/types`** | TypeScript type definitions | API types, domain types, shared interfaces |
| **`/src/ai`** | AI-specific modules | Genkit flows, AI orchestration logic |
| **`/public`** | Static assets | Favicon, icons, images served at root path |
| **`/assets`** | Development assets | Design files, mockups, documentation images |
| **`/docs`** | Project documentation | Architecture documentation, guides, API references |
| **`/node_modules`** | npm dependencies | Third-party packages (auto-generated, gitignored) |

---

### Key Configuration Files

The project's behavior is controlled by several critical configuration files at the root level:

| File | Purpose | Key Configuration |
|------|---------|-------------------|
| **`next.config.ts`** | Next.js configuration | Image optimization domains (`replicate.delivery`, `pollinations.ai`, `vercel-storage.com`), allowed dev origins, build settings |
| **`tailwind.config.ts`** | Tailwind CSS configuration | Custom theme variables, color tokens (HSL-based design system), font families (`Code` monospace), animations (accordion, custom keyframes), plugin integrations (`tailwindcss-animate`) |
| **`tsconfig.json`** | TypeScript compiler configuration | Path aliases (`@/*` → `./src/*`), strict mode enabled, ES2017 target, JSX preserve for Next.js, incremental compilation |
| **`vercel.json`** | Vercel deployment configuration | **Scheduled cron job:** `/api/blob-cleanup` runs daily at 3 AM UTC (`"0 3 * * *"`) to clean up expired blob storage |
| **`package.json`** | npm project manifest | Scripts (`dev`, `build`, `start`, `lint`, `typecheck`, `test`), dependencies (React 18, Next 15, Replicate SDK, Zod, shadcn/ui, framer-motion), dev dependencies (Jest, Testing Library, ESLint) |
| **`jest.config.ts`** | Jest test runner configuration | Test environment (jsdom), setup files, module path mapping, coverage settings |
| **`postcss.config.mjs`** | PostCSS configuration | Tailwind CSS plugin, autoprefixer for vendor prefixes |
| **`components.json`** | shadcn/ui configuration | Component library aliases, style preferences, Tailwind config path |
| **`.eslintrc.json`** | ESLint linter configuration | Next.js lint rules, TypeScript parsing, code style enforcement |

#### Configuration File Paths

- **Next.js:** `/next.config.ts`
- **Tailwind:** `/tailwind.config.ts`
- **TypeScript:** `/tsconfig.json`
- **Vercel (cron):** `/vercel.json`
- **Package manifest:** `/package.json`
- **Jest testing:** `/jest.config.ts`, `/jest.setup.ts`
- **PostCSS:** `/postcss.config.mjs`
- **ESLint:** `/.eslintrc.json`, `/.eslintignore`

---

### Entry Points and Application Bootstrap

The application initializes through a standard Next.js App Router flow:

#### 1. **Root Layout: `src/app/layout.tsx`**

**Path:** `/src/app/layout.tsx`

**Responsibilities:**
- Defines global HTML structure (`<html>`, `<head>`, `<body>`)
- Sets application metadata (title: "HeyHi", favicon, Apple touch icons)
- Loads Google Fonts (Inter, Code) via preconnect for performance
- Wraps all pages with global providers:
  - **`ThemeProvider`** (from `@/components/ThemeProvider`) — next-themes wrapper for light/dark mode with system preference support, `suppressHydrationWarning` on `<html>` element
  - **`LanguageProvider`** (from `@/components/LanguageProvider`) — manages i18n state (German/English), reads/writes `localStorage('language')`
  - **`Toaster`** (from `@/components/ui/toaster`) — shadcn/ui toast notification system
- Applies global CSS (`./globals.css`) with Tailwind directives and custom CSS variables

**Key Code Excerpt:**
```tsx
<ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
  <LanguageProvider>
    {children}
    <Toaster />
  </LanguageProvider>
</ThemeProvider>
```

---

#### 2. **Root Page: `src/app/page.tsx`**

**Path:** `/src/app/page.tsx`

**Responsibilities:**
- Re-exports the `/entry-draft` page as the home route
- Landing page with typewriter effect, prompt input, and mode selection (chat vs. visualize)

**Code:**
```tsx
"use client";
export { default } from './entry-draft/page';
```

**Actual page implementation:** `/src/app/entry-draft/page.tsx`

---

#### 3. **Global Styles: `src/app/globals.css`**

**Path:** `/src/app/globals.css`

**Responsibilities:**
- Imports Tailwind base, components, utilities layers
- Defines CSS custom properties for theming (HSL color tokens):
  - Light theme: `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`
  - Dark theme: same variables with inverted values under `.dark` class
- Provides tool-specific color variables (`--tool-input-bg`, `--tool-button-bg`)
- Sets global styles (body background, typography, scrollbar customization)

---

## App Router Pages and Routes

### Page Structure Overview

Next.js App Router uses file-system-based routing. Each folder in `/src/app` becomes a route, and `page.tsx` files define the UI for that route.

| Route Path | File Location | Purpose |
|------------|---------------|---------|
| **`/`** (home) | `/src/app/page.tsx` → `/src/app/entry-draft/page.tsx` | Landing page with typewriter animation, prompt input, mode selection (chat/visualize) |
| **`/chat`** | `/src/app/chat/page.tsx` | Conversational AI workspace with Pollinations/Gemini chat, SSE streaming, conversation history, code mode, file uploads, STT/TTS, image generation within chat |
| **`/visualizepro`** | `/src/app/visualizepro/page.tsx` | Image generation tool using Pollinations API with advanced controls (model, width, height, seed, enhance, nologo), batch generation, gallery with localStorage persistence |
| **`/settings`** | `/src/app/settings/page.tsx` | Personalization UI: display name, response style presets, custom system prompts, Replicate password management, language/theme toggles |
| **`/about`** | `/src/app/about/page.tsx` | Project information, credits, links, philosophy (democratize AI, no paywalls) |
| **`/entry-draft`** | `/src/app/entry-draft/page.tsx` | Enhanced landing experience with typewriter effect, quick prompt chips, dual-mode entry (chat vs. visualize) |

---

### Page Details

#### `/chat` — Conversational AI Workspace

**File:** `/src/app/chat/page.tsx`

**Features:**
- Wraps `ChatProvider` for centralized state management (messages, streaming, attachments, TTS/STT)
- Uses `LongLanguageLoops` component (chat UI from `/src/components/page/LongLanguageLoops.tsx`)
- Supports:
  - Multiple AI models (Pollinations, Gemini)
  - Server-sent events (SSE) for streaming responses
  - Conversation history (localStorage persistence)
  - Code mode toggle
  - File/camera uploads via `upload` API
  - Speech-to-text (STT) recording with Deepgram
  - Text-to-speech (TTS) playback with Replicate
  - Inline image generation (Pollinations)
  - System prompt customization

**Related Components:**
- `/src/components/ChatProvider.tsx` — global chat state context
- `/src/components/chat/*` — message bubbles, input forms, attachment previews
- `/src/components/dialogs/*` — settings dialogs, model pickers, voice selectors

---

#### `/visualizepro` — Image Generation Tool

**File:** `/src/app/visualizepro/page.tsx`

**Features:**
- Dedicated UI for Pollinations image generation
- Uses `VisualizingLoops` component (from `/src/components/tools/VisualizingLoops.tsx`)
- Advanced controls: model selection, dimensions (width/height sliders), seed, enhancement toggle, batch generation
- Gallery with localStorage persistence (history, downloads)
- Prompt chips for quick examples

**Related Components:**
- `/src/components/tools/VisualizingLoops.tsx` — main image generation UI
- `/src/lib/image-generation/unified-api.ts` — unified image generation API client
- `/src/config/unified-image-models.ts` — Pollinations model definitions

---

#### `/settings` — User Preferences and Personalization

**File:** `/src/app/settings/page.tsx`

**Features:**
- Display name input (stored in localStorage)
- Response style presets (casual, professional, creative, etc.)
- Custom system prompt editor
- Replicate password management (for premium features)
- Language toggle (English/German)
- Theme toggle (light/dark)
- Uses `PersonalizationTool` component from `/src/components/tools/PersonalizationTool.tsx`

**Storage:** All preferences stored in `localStorage` via custom hooks (`useLocalStorageState`)

---

#### `/about` — Project Information

**File:** `/src/app/about/page.tsx`

**Features:**
- Static content page with project philosophy
- Credits to Pollinations AI
- Links to external resources
- Disclaimer about AI limitations

---

#### `/entry-draft` — Enhanced Landing Page

**File:** `/src/app/entry-draft/page.tsx`

**Features:**
- Typewriter animation displaying user's display name in code format: `(!hey.hi = 'username')`
- Dual-mode prompt input: chat or visualize
- Quick prompt chips (context-aware based on selected mode)
- Preloads prompt to target page via `localStorage` and custom events
- 5-second delay before typewriter starts
- Smooth transitions with framer-motion

**Key Interaction Flow:**
1. Page loads → idle state (5s delay)
2. Typewriter animation types username
3. User selects mode (chat/visualize)
4. User enters prompt or clicks chip
5. Prompt saved to localStorage (`sidebar-preload-prompt`, `sidebar-preload-target`)
6. Custom event dispatched: `sidebar-reuse-prompt`
7. Router navigates to target page (`/chat` or `/visualizepro`)
8. Target page reads preloaded prompt and auto-submits

---

## API Routes Structure

All API routes are located in `/src/app/api/*` and follow Next.js App Router conventions for route handlers (`route.ts` files).

### API Route Map

| Endpoint | File Location | HTTP Methods | Purpose |
|----------|---------------|--------------|---------|
| **`/api/chat/completion`** | `/src/app/api/chat/completion/route.ts` | POST | Streaming chat completions via Pollinations/Gemini (SSE responses) |
| **`/api/chat/title`** | `/src/app/api/chat/title/route.ts` | POST | Generate conversation title from message history |
| **`/api/generate`** | `/src/app/api/generate/route.ts` | POST | Pollinations image generation proxy with Zod validation |
| **`/api/replicate`** | `/src/app/api/replicate/route.ts` | POST | Replicate API proxy for premium models (image, video, TTS) with password protection |
| **`/api/stt`** | `/src/app/api/stt/route.ts` | POST | Speech-to-text via Deepgram (accepts audio blob, returns transcript) |
| **`/api/tts`** | `/src/app/api/tts/route.ts` | POST | Text-to-speech via Replicate (returns audio URL) |
| **`/api/upload`** | `/src/app/api/upload/route.ts` | POST | File upload to Vercel Blob storage (returns URL) |
| **`/api/enhance-prompt`** | `/src/app/api/enhance-prompt/route.ts` | POST | AI-powered prompt enhancement (OpenAI fallback) |
| **`/api/blob-cleanup`** | `/src/app/api/blob-cleanup/route.ts` | GET | **Scheduled cron job** (daily 3 AM UTC) to delete expired blob storage files |

---

### API Route Details

#### `/api/chat/completion` — Streaming Chat API

**File:** `/src/app/api/chat/completion/route.ts`

**Request Schema (Zod):**
```typescript
{
  messages: Array<{role: 'user' | 'assistant' | 'system', content: string}>,
  model?: string,
  systemPrompt?: string,
  attachments?: Array<{url: string, type: string}>
}
```

**Response:** Server-sent events (SSE) stream with incremental tokens

**Features:**
- Proxies to Pollinations text API or Gemini
- Supports multimodal inputs (text + images)
- Applies custom system prompts
- Error handling via `/src/lib/api-error-handler.ts`

---

#### `/api/generate` — Image Generation Proxy

**File:** `/src/app/api/generate/route.ts`

**Request Schema:**
```typescript
{
  prompt: string,
  model?: string,
  width?: number,
  height?: number,
  seed?: number,
  enhance?: boolean,
  nologo?: boolean
}
```

**Response:** JSON with image URL(s)

**Features:**
- Validates inputs with Zod
- Sanitizes prompts (blocks unsafe content)
- Proxies to Pollinations image API
- Supports batch generation

---

#### `/api/replicate` — Premium Model Proxy

**File:** `/src/app/api/replicate/route.ts`

**Authentication:** Requires `REPLICATE_PASSWORD` environment variable match (password gate)

**Request Schema:**
```typescript
{
  model: string,
  input: Record<string, unknown>,
  password?: string
}
```

**Response:** JSON with Replicate prediction results

**Features:**
- Password-protected (checks against `process.env.REPLICATE_PASSWORD`)
- Uses official Replicate Node.js SDK
- Supports async predictions with webhooks
- Handles image, video, audio models

---

#### `/api/blob-cleanup` — Scheduled Maintenance Cron

**File:** `/src/app/api/blob-cleanup/route.ts`

**Trigger:** Vercel cron job (defined in `/vercel.json`)

**Schedule:** `0 3 * * *` (daily at 3:00 AM UTC)

**Purpose:**
- Lists all blobs in Vercel Blob storage
- Deletes files older than 24 hours (or other expiry logic)
- Prevents storage bloat from temporary uploads

**Vercel Configuration:**
```json
{
  "crons": [
    {
      "path": "/api/blob-cleanup",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Security:** Protected by Vercel's cron authorization header (`Authorization: Bearer [cron-secret]`)

---

#### `/api/upload` — File Upload Handler

**File:** `/src/app/api/upload/route.ts`

**Request:** `multipart/form-data` with file field

**Response:** JSON with `{ url: string }` (Vercel Blob storage URL)

**Features:**
- Uploads to Vercel Blob storage (`@vercel/blob`)
- Returns publicly accessible URL
- Used for chat attachments, camera captures
- Integrates with blob cleanup cron

---

#### `/api/stt` and `/api/tts` — Speech APIs

**STT File:** `/src/app/api/stt/route.ts` — Deepgram speech-to-text  
**TTS File:** `/src/app/api/tts/route.ts` — Replicate text-to-speech

**STT Request:** Audio blob (WAV/MP3/WebM)  
**STT Response:** `{ transcript: string }`

**TTS Request:** `{ text: string, voice?: string }`  
**TTS Response:** `{ audioUrl: string }`

**Integration:** Used by chat UI for voice input/output

---

## Source Code Organization

### `/src/components` — UI Component Library

Component library organized by function:

| Directory | Purpose | Key Components |
|-----------|---------|----------------|
| **`/src/components/ui`** | shadcn/ui primitives | Button, Input, Textarea, Select, Slider, Tabs, Dialog, Toast, ScrollArea, Separator (all from Radix UI) |
| **`/src/components/layout`** | Layout components | `AppLayout.tsx` (header, navigation, footer wrapper), responsive grid systems |
| **`/src/components/page`** | Page-level components | `LongLanguageLoops.tsx` (chat workspace), homepage components |
| **`/src/components/chat`** | Chat-specific UI | Message bubbles, input forms, attachment previews, typing indicators |
| **`/src/components/dialogs`** | Modal dialogs | Settings dialogs, model pickers, confirmation dialogs |
| **`/src/components/tools`** | Tool-specific components | `VisualizingLoops.tsx` (image gen), `PersonalizationTool.tsx` (settings), `ReplicateImageTool.tsx` (premium images), `Nonogram.tsx` (game) |
| **Root components** | Global providers & utilities | `ChatProvider.tsx`, `ThemeProvider.tsx`, `LanguageProvider.tsx`, `MarkdownRenderer.tsx`, `ErrorBoundary.tsx` |

---

### `/src/config` — Configuration Modules

Centralized configuration for AI models, prompts, and translations:

| File | Purpose | Exports |
|------|---------|---------|
| **`chat-options.ts`** | Chat model definitions | Available chat models (Pollinations, Gemini), voice options, model capabilities |
| **`replicate-models.ts`** | Replicate model registry | Dozens of premium models (FLUX, Stable Diffusion, video, TTS) with input schemas, tags, metadata |
| **`unified-image-models.ts`** | Pollinations image models | Free image models with presets (dimensions, styles) |
| **`unified-model-configs.ts`** | Unified model configuration | Cross-provider model mappings, default parameters |
| **`enhancement-prompts.ts`** | Prompt enhancement templates | System prompts for AI-powered prompt improvement |
| **`translations.ts`** | i18n strings | German/English translations for all UI text (5000+ lines) |

**Key Configuration Pattern:**
```typescript
// Example from replicate-models.ts
export const REPLICATE_MODELS = [
  {
    id: 'flux-pro',
    name: 'FLUX.1 Pro',
    provider: 'replicate',
    version: 'black-forest-labs/flux-pro',
    type: 'image',
    tags: ['realistic', 'premium'],
    inputSchema: z.object({
      prompt: z.string(),
      aspect_ratio: z.enum(['1:1', '16:9', '9:16']),
    })
  },
  // ... more models
];
```

---

### `/src/hooks` — Custom React Hooks

Reusable stateful logic abstracted into custom hooks:

| Hook | File | Purpose |
|------|------|---------|
| **`useLocalStorageState`** | `/src/hooks/useLocalStorageState.ts` | Persist React state to localStorage with JSON serialization, SSR-safe |
| **`useChatState`** | `/src/hooks/useChatState.ts` | Chat message state management (add, remove, edit messages) |
| **`useChatEffects`** | `/src/hooks/useChatEffects.ts` | Side effects for chat (auto-scroll, typing indicators, focus management) |
| **`useChatAudio`** | `/src/hooks/useChatAudio.ts` | TTS audio playback controls (play, pause, stop, queue management) |
| **`useChatRecording`** | `/src/hooks/useChatRecording.ts` | STT recording controls (MediaRecorder API, audio blob handling) |
| **`useToast`** | `/src/hooks/use-toast.ts` | Toast notification state (from shadcn/ui) |
| **`useDebounce`** | `/src/hooks/useDebounce.ts` | Debounce values for search/input (prevents excessive API calls) |
| **`useEscapeKey`** | `/src/hooks/useEscapeKey.ts` | Keyboard shortcut handler for Escape key |
| **`useOnClickOutside`** | `/src/hooks/useOnClickOutside.ts` | Detect clicks outside element (for dropdowns, modals) |
| **`useTypewriter`** | `/src/hooks/useTypewriter.ts` | Typewriter animation effect (character-by-character reveal) |
| **`useWindowSize`** | `/src/hooks/useWindowSize.ts` | Responsive window dimensions with debounce |

**Example Usage Pattern:**
```typescript
// In a component
const [messages, setMessages] = useLocalStorageState<Message[]>('chat-history', []);
const { toast } = useToast();

const handleError = () => {
  toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
};
```

---

### `/src/lib` — Library Code and Services

Core business logic and service layers:

| Directory/File | Purpose |
|----------------|---------|
| **`api-error-handler.ts`** | Centralized API error handling (logs, formats, returns NextResponse) |
| **`utils.ts`** | Tailwind CSS class merging helper (`cn` function using clsx + tailwind-merge) |
| **`uuid.ts`** | UUID generation utility (crypto-based random IDs) |
| **`/services/chat-service.ts`** | Chat service layer (message parsing, history management, API client) |
| **`/image-generation/unified-api.ts`** | Unified image generation client (abstracts Pollinations vs. Replicate) |

**Service Layer Pattern:**
```typescript
// /src/lib/services/chat-service.ts
export class ChatService {
  async sendMessage(messages: Message[], options: ChatOptions) {
    const response = await fetch('/api/chat/completion', {
      method: 'POST',
      body: JSON.stringify({ messages, ...options })
    });
    return this.parseSSEStream(response.body);
  }
  // ... more methods
}
```

---

### `/src/utils` — Utility Functions

General-purpose helper functions:

**`chatHelpers.ts`** — Chat-specific utilities:
- Prompt sanitization (removes unsafe content)
- Message formatting (converts chat history to API format)
- Token counting (estimates for context limits)
- Attachment processing (validates file types, sizes)

**Example:**
```typescript
// /src/utils/chatHelpers.ts
export function sanitizePrompt(prompt: string): string {
  // Remove potential injection attacks, profanity, etc.
  return prompt.replace(/[<>]/g, '').trim();
}
```

---

### `/src/types` — TypeScript Type Definitions

Shared type definitions for type safety:

**`index.ts`** — Domain types:
```typescript
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
}

export interface Attachment {
  url: string;
  type: 'image' | 'audio' | 'file';
  name?: string;
  size?: number;
}
```

**`api.ts`** — API request/response types:
```typescript
export interface ChatCompletionRequest {
  messages: Message[];
  model?: string;
  systemPrompt?: string;
  stream?: boolean;
}

export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  seed?: number;
}
```

---

### `/src/ai` — AI Orchestration

**`/src/ai/flows`** — Genkit AI flows (if using Firebase Genkit):
- Flow definitions for complex AI workflows
- Multi-step reasoning chains
- Agentic behaviors

(Note: This directory appears present but may be future-reserved based on codebase exploration)

---

## Global Providers and State Management

### Theme Management: `ThemeProvider`

**File:** `/src/components/ThemeProvider.tsx`

**Purpose:** Wraps `next-themes` provider for light/dark mode

**Features:**
- System preference detection
- Persistent theme selection (localStorage)
- CSS class-based theming (`class` attribute on `<html>`)
- No flash on page load (`suppressHydrationWarning`)

**Usage in Layout:**
```tsx
<ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
  {children}
</ThemeProvider>
```

**Companion Component:** `ThemeToggle.tsx` (sun/moon icon button)

---

### Internationalization: `LanguageProvider`

**File:** `/src/components/LanguageProvider.tsx`

**Purpose:** Global i18n context for English/German support

**API:**
```typescript
const { language, setLanguage, t } = useLanguage();
// language: 'en' | 'de'
// t(key: string): string — translation lookup
```

**Storage:** Reads/writes `localStorage('language')`

**Translations:** Loaded from `/src/config/translations.ts` (5000+ lines)

**Companion Component:** `LanguageToggle.tsx` (EN/DE flag buttons)

---

### Chat State: `ChatProvider`

**File:** `/src/components/ChatProvider.tsx` (30,000+ characters)

**Purpose:** Centralized chat state management (messages, streaming, attachments, TTS/STT, model selection)

**Context API:**
```typescript
const {
  messages, setMessages,
  isStreaming, streamingMessage,
  attachments, addAttachment, removeAttachment,
  currentModel, setCurrentModel,
  sendMessage, stopStreaming,
  startRecording, stopRecording, isRecording,
  playTTS, stopTTS, isTTSPlaying,
  conversationHistory, loadConversation, deleteConversation,
  // ... 50+ more properties/methods
} = useChat();
```

**Key Responsibilities:**
- Message CRUD operations
- SSE streaming state management
- Attachment handling (upload, preview, validation)
- TTS/STT integration
- Conversation history (localStorage)
- Model/voice selection
- Dialog state (settings, history, model picker)
- System prompt management

**Usage Pattern:**
```tsx
// Wrap chat pages
<ChatProvider>
  <LongLanguageLoops />
</ChatProvider>
```

---

### Toast Notifications: `Toaster`

**File:** `/src/components/ui/toaster.tsx`

**Purpose:** Global toast notification system (shadcn/ui + Radix Toast)

**Usage:**
```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();
toast({
  title: 'Success',
  description: 'Image generated!',
  variant: 'default' // or 'destructive'
});
```

**Rendered in Layout:** Always mounted at root level

---

## Static Assets and Public Files

### `/public` Directory

**Path:** `/public`

**Contents:**
- `favicon.ico` — Browser favicon (700 bytes)
- `icon.svg` — SVG app icon
- `apple-touch-icon.png` — iOS home screen icon (180x180)
- `apple-touch-icon-precomposed.png` — Legacy iOS icon

**URL Mapping:** Files in `/public` are served at root path (e.g., `/favicon.ico` → `/public/favicon.ico`)

**Configuration in Layout:** Icons explicitly linked in `<head>` of `/src/app/layout.tsx`:
```tsx
<link rel="icon" href="/favicon.ico?v=3" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

---

### `/assets` Directory

**Path:** `/assets`

**Purpose:** Development-only assets (not served in production)
- Design mockups
- Figma exports
- Documentation images
- Marketing materials

---

## Development and Testing Infrastructure

### Testing Setup

**Framework:** Jest with React Testing Library

**Configuration:**
- **`jest.config.ts`** — Test runner config (jsdom environment, module aliases)
- **`jest.setup.ts`** — Test setup file (extends matchers, mocks localStorage)

**Test Files:**
- **`/src/utils/__tests__/chatHelpers.test.ts`** — Prompt sanitization tests
- *Other test files following `*.test.ts` or `*.test.tsx` pattern*

**Run Tests:**
```bash
npm test         # Watch mode
npm run test:ci  # CI mode (if configured)
```

---

### Code Quality Tools

**ESLint:**
- Config: `/.eslintrc.json`
- Ignore: `/.eslintignore`
- Next.js recommended rules
- TypeScript parser

**TypeScript:**
- Strict mode enabled (`tsconfig.json`)
- Path aliases: `@/*` → `./src/*`
- Incremental compilation for speed

**Prettier:** (Optional, not explicitly configured but recommended)

---

### Development Scripts

From `/package.json`:

```bash
npm run dev       # Start dev server with Turbopack (port 3000)
npm run build     # Production build
npm start         # Start production server
npm run lint      # Run ESLint
npm run typecheck # TypeScript type checking (no emit)
npm test          # Run Jest tests (watch mode)
```

---

## Deployment and Production Configuration

### Vercel Deployment

**Platform:** Vercel (Next.js native platform)

**Configuration:** `/vercel.json`

**Scheduled Jobs:**
```json
{
  "crons": [
    {
      "path": "/api/blob-cleanup",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Environment Variables Required:**
- `REPLICATE_API_KEY` — Replicate API token
- `REPLICATE_PASSWORD` — Password gate for premium features
- `DEEPGRAM_API_KEY` — Deepgram STT service
- `OPENAI_API_KEY` — OpenAI fallback for prompt enhancement
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob storage access token

**Build Output:**
- Static pages: Pre-rendered at build time
- Dynamic routes: Rendered on-demand (ISR/SSR)
- API routes: Serverless functions (Edge runtime where possible)

---

### Firebase Hosting (Alternative)

**Configuration:** `/apphosting.yaml`

**Purpose:** Alternative deployment target (Firebase App Hosting)

**Firestore Rules:** `/firestore.rules` (if using Firestore for data storage)

---

## Summary and Key Architectural Patterns

### Design Principles

1. **Accessibility First:** No paywalls, low barrier to entry, free AI tools
2. **Provider Abstraction:** Unified APIs abstract Pollinations, Replicate, Deepgram, OpenAI
3. **Type Safety:** Strict TypeScript, Zod validation on API boundaries
4. **Performance:** Turbopack dev server, image optimization, incremental compilation
5. **Responsive Design:** Mobile-first Tailwind CSS, shadcn/ui primitives
6. **State Locality:** Context providers for global state, custom hooks for reusable logic
7. **Error Resilience:** Centralized error handling, graceful degradation, toast notifications
8. **Security:** Environment-guarded secrets, password protection, prompt sanitization

---

### Technology Stack Summary

| Layer | Technologies |
|-------|-------------|
| **Framework** | Next.js 15 (App Router), React 18, TypeScript 5 |
| **Styling** | Tailwind CSS 3.4, shadcn/ui (Radix primitives), Framer Motion animations |
| **State Management** | React Context (ThemeProvider, LanguageProvider, ChatProvider), custom hooks |
| **Data Persistence** | localStorage (preferences, history), Vercel Blob (file uploads) |
| **AI Providers** | Pollinations (chat/image), Replicate (premium models), Deepgram (STT), OpenAI (fallback) |
| **API Layer** | Next.js API Routes (App Router), Zod validation, SSE streaming |
| **Testing** | Jest, React Testing Library, @testing-library/user-event |
| **Deployment** | Vercel (primary), Firebase App Hosting (alternative) |
| **Icons & UI** | Lucide React, next-themes (dark mode), react-markdown, react-syntax-highlighter |

---

### File Path Reference Index

**Configuration:**
- `/next.config.ts` — Next.js configuration
- `/tailwind.config.ts` — Tailwind CSS theme
- `/tsconfig.json` — TypeScript compiler
- `/vercel.json` — Vercel deployment + cron jobs
- `/package.json` — npm dependencies
- `/jest.config.ts` — Test runner
- `/.eslintrc.json` — Linter rules

**Entry Points:**
- `/src/app/layout.tsx` — Root layout with providers
- `/src/app/page.tsx` — Home page (re-exports `/entry-draft`)
- `/src/app/globals.css` — Global styles

**Pages:**
- `/src/app/entry-draft/page.tsx` — Landing page
- `/src/app/chat/page.tsx` — Chat workspace
- `/src/app/visualizepro/page.tsx` — Image generation
- `/src/app/settings/page.tsx` — User settings
- `/src/app/about/page.tsx` — About page

**API Routes:**
- `/src/app/api/chat/completion/route.ts` — Chat streaming
- `/src/app/api/chat/title/route.ts` — Conversation title
- `/src/app/api/generate/route.ts` — Image generation
- `/src/app/api/replicate/route.ts` — Premium models
- `/src/app/api/stt/route.ts` — Speech-to-text
- `/src/app/api/tts/route.ts` — Text-to-speech
- `/src/app/api/upload/route.ts` — File uploads
- `/src/app/api/enhance-prompt/route.ts` — Prompt enhancement
- `/src/app/api/blob-cleanup/route.ts` — Scheduled cleanup cron

**Core Components:**
- `/src/components/ChatProvider.tsx` — Chat state context
- `/src/components/ThemeProvider.tsx` — Theme context
- `/src/components/LanguageProvider.tsx` — i18n context
- `/src/components/layout/AppLayout.tsx` — Page layout wrapper
- `/src/components/page/LongLanguageLoops.tsx` — Chat UI
- `/src/components/tools/VisualizingLoops.tsx` — Image gen UI
- `/src/components/tools/PersonalizationTool.tsx` — Settings UI

**Configuration Modules:**
- `/src/config/chat-options.ts` — Chat models
- `/src/config/replicate-models.ts` — Replicate model registry
- `/src/config/unified-image-models.ts` — Image models
- `/src/config/translations.ts` — i18n strings
- `/src/config/enhancement-prompts.ts` — Prompt templates

**Hooks:**
- `/src/hooks/useLocalStorageState.ts` — Persistent state
- `/src/hooks/useChatState.ts` — Chat state management
- `/src/hooks/useChatEffects.ts` — Chat side effects
- `/src/hooks/useChatAudio.ts` — TTS controls
- `/src/hooks/useChatRecording.ts` — STT controls
- `/src/hooks/use-toast.ts` — Toast notifications

**Services:**
- `/src/lib/services/chat-service.ts` — Chat service layer
- `/src/lib/image-generation/unified-api.ts` — Image API client
- `/src/lib/api-error-handler.ts` — Error handling
- `/src/lib/utils.ts` — Tailwind class merger

**Types:**
- `/src/types/index.ts` — Domain types
- `/src/types/api.ts` — API types

**Utilities:**
- `/src/utils/chatHelpers.ts` — Chat utilities

---

## Scheduled Tasks and Cron Jobs

### Blob Storage Cleanup Cron

**Endpoint:** `/api/blob-cleanup`  
**Schedule:** Daily at 3:00 AM UTC (`0 3 * * *`)  
**File:** `/src/app/api/blob-cleanup/route.ts`

**Trigger Mechanism:**
Vercel's cron service sends authenticated GET request to `/api/blob-cleanup` at scheduled time.

**Configuration in `/vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/blob-cleanup",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Security:**
- Vercel automatically adds `Authorization: Bearer <cron-secret>` header
- Route handler should verify this header (implementation detail)

**Purpose:**
- Prevent Vercel Blob storage quota exhaustion
- Remove temporary uploads (chat attachments, camera captures)
- Delete files older than 24 hours (or custom expiry logic)

**Execution Flow:**
1. Vercel cron service triggers request
2. Route handler lists all blobs via `@vercel/blob`
3. Filters blobs by age (upload timestamp)
4. Deletes expired blobs
5. Logs results (count, errors)
6. Returns JSON summary

---

## Conclusion

This architecture provides a **modern, scalable, and accessible** foundation for AI-powered creative tools. Key strengths include:

- **Clear separation of concerns** (pages, components, services, config)
- **Type-safe API boundaries** with Zod validation
- **Flexible provider abstraction** (easy to swap AI services)
- **Rich user experience** with streaming, real-time updates, multimodal inputs
- **Production-ready deployment** with scheduled maintenance, error handling, monitoring

The codebase follows **Next.js 15 best practices**, leverages **React 18 features** (Server Components where applicable, Client Components for interactivity), and maintains **strict TypeScript compliance** for reliability.

For future enhancements, consider:
- GraphQL or tRPC for type-safe client-server communication
- React Query for advanced data fetching/caching
- Zustand or Jotai for lighter state management
- Playwright or Cypress for E2E testing
- Storybook for component documentation
- OpenTelemetry for observability

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-13  
**Maintained By:** Project maintainer (single-developer project)
