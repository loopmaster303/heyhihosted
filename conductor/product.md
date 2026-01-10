# Product Context: HeyHi

> "Just say </hey.hi> to run multiple AI."

## 1. Project Overview
**HeyHi** is a lightweight, privacy-focused, and accessible AI platform. It aims to democratize access to state-of-the-art AI models (Text, Image, Video, Audio) by removing barriers like paywalls and complex setups.

- **Goal**: Provide easy, free/low-barrier access to AI generation.
- **Philosophy**: Privacy-first (local storage), frictionless experience (no login required for core features).
- **Target Audience**: Creators, prototypers, and anyone needing quick AI tools.

## 2. Technical Architecture

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: React 18, Tailwind CSS, Radix UI, Framer Motion
- **Styling**: `globals.css` with Tailwind variables, dark-mode default.

### Backend & Infrastructure
- **Runtime**: Next.js Server Routes (Edge/Node.js compatible)
- **Deployment**: Vercel
- **Storage**: 
  - **User Data**: **IndexedDB** (Client-side persistence via `DatabaseService`)
  - **Assets**: Vercel Blob (Temporary storage for proxying and sharing)

### AI Integration Layer
- **Core Provider**: [Pollinations.ai](https://pollinations.ai) (Free tier text/image/video)
- **Premium Provider**: [Replicate](https://replicate.com) (High-fidelity models like Flux Pro, Wan Video)
- **Auxiliary**: Mistral AI (Chat & Prompt Enhancement)
- **Features**:
  - **Text**: Unified chat interface with multiple LLM support.
  - **Image**: Integrated **Visualize** tool within chat (Flux, Gemini, Wan Video).
  - **Audio**: Web Speech API for STT, Edge TTS/Pollinations for TTS.

## 3. Core Features
1.  **Unified Chat**: Central hub for all AI interactions (Text, Image, Video). Supports Markdown and code highlighting.
2.  **Integrated Visualize**: In-chat media generation tool with Standard and Advanced modes. Activated via Tools menu.
3.  **Voice Interaction**: Speech-to-Text and Text-to-Speech integration.
4.  **No-Auth Access**: Immediate utility without account creation.

## 4. Key Directory Structure
- `src/app/`: App Router pages and API routes.
- `src/components/`: Reusable UI components (shadcn/ui based).
- `src/ai/`: Logic flows for AI operations (STT, TTS, Chat).
- `src/lib/services/`: API abstractions (`chat-service.ts`, `unified-api.ts`).
- `src/config/`: Model definitions and system constants.
