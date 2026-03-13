# Product Context: hey.hi

> "Just say </hey.hi> to run multiple AI."

## 1. Project Overview
**hey.hi** is a lightweight, privacy-focused, and accessible AI platform. It aims to democratize access to state-of-the-art AI models (text, image, video, audio) by removing barriers like paywalls and complex setups.

- **Goal**: Provide easy, free/low-barrier access to AI generation.
- **Philosophy**: Privacy-first (local storage), frictionless experience (no login required for core features).
- **Target Audience**: Creators, prototypers, and anyone needing quick AI tools.

## 2. Technical Architecture

### Frontend
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS, Radix UI, Framer Motion
- **Styling**: `globals.css` with Tailwind variables, dark-mode default.

### Backend & Infrastructure
- **Runtime**: Next.js Server Routes (Edge/Node.js compatible)
- **Deployment**: Vercel
- **Storage**:
  - **User Data**: **IndexedDB** via Dexie v4 (conversations, messages, memories, output metadata)
  - **Generated Media**: Pollinations Media Storage (hash-based media URLs with local metadata)
  - **UI Prefs**: LocalStorage

### AI Integration Layer
- **Primary Provider**: [Pollinations.ai](https://pollinations.ai) — Chat, image, video, audio, music
- **Features**:
  - **Text**: Unified chat with Smart Router (auto-detects search intent → Sonar)
  - **Image/Video**: Integrated **Visualize** tool (Pollinations-only, visible set depends on current enabled registry)
  - **Music**: Compose Mode via Eleven Music (`model=elevenmusic`) with VibeCraft prompt enhancement
  - **Audio**: Pollinations STT + TTS

## 3. Core Features
1.  **Unified Chat**: Central hub for all AI interactions (Text, Image, Video). Supports Markdown and code highlighting.
2.  **Integrated Visualize**: In-chat media generation tool for image and video workflows. Activated via the Tools menu.
3.  **Voice Interaction**: Speech-to-Text and Text-to-Speech integration.
4.  **No-Auth Access**: Immediate utility without account creation.

## 4. Key Directory Structure
- `src/app/`: App Router pages and API routes.
- `src/components/`: Reusable UI components (shadcn/ui based).
- `src/lib/`: Services, utilities, SDK shims (`chat-service.ts`, `smart-router.ts`, `pollinations-sdk.ts`).
- `src/lib/services/`: API abstractions (`chat-service.ts`, `smart-router.ts`).
- `src/config/`: Model definitions and system constants.
