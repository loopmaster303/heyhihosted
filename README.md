# hey.hi – the assistant computer.

**hey.hi** is a lightweight, privacy-focused, and fully transparent AI interface. It provides direct, frictionless access to state-of-the-art Large Language Models and Generative Media tools without paywalls, accounts, or server-side tracking.

> **Powered by [Pollinations.ai](https://pollinations.ai)**
>
> Free, open-source text and multimedia generation for the decentralized web.

## Vision

To democratize artificial intelligence by creating a high-performance "Local-First" environment where users own their data and the machine acts as an honest, open-source-minded service.

## Key Features

- **Multimodal Chat**: Discuss ideas with Claude, GPT, Gemini, Grok, Deepseek, Mistral, and more. Full vision support included.
- **Generative Media**: Create images and videos instantly via Pollinations and Replicate APIs.
- **Compose Mode**: Music composing with **Eleven Music** (`model=elevenmusic`) via **Pollinations** (`/api/compose`).
- **Code Mode**: Dedicated coding assistant with specialized system prompts and model routing.
- **Deep Research**: Toggle web browsing for real-time search and source analysis (Sonar / Sonar Reasoning).
- **Smart Router**: Auto-detects search intent (German + English) and routes to the right model.
- **Voice I/O**: Speech-to-text and text-to-speech via Pollinations (OpenAI-compatible endpoints).
- **Prompt Enhancement**: AI-powered prompt optimization for image and music generation.
- **Local Vault**: Chats, memories, and generated assets stored locally in your browser (IndexedDB). They never expire and stay private.
- **Gallery**: Browse and manage all generated images and videos with S3-backed storage.
- **CRT Terminal Identity**: A specialized UI inspired by terminal aesthetics with real-time system feedback.
- **No-Auth Architecture**: Instant utility. No sign-up, no logins.

## Available Models

### Chat (LLMs)

| Category            | Models                                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Standard (Free)** | Gemini 2.5 Flash, Mistral, Amazon Nova Micro, GPT-5 Nano, Gemini 3 Flash Search, Grok 4 Fast, Claude Haiku 4.5                         |
| **Advanced (Paid)** | _Requires Pollen Key_ <br> Claude Sonnet 4.5, Claude Opus 4.6, GPT-5.2, Gemini 3 Pro, Gemini 3 Flash, Deepseek V 3.2, Kimi K2.5, GLM-5 |
| **Search**          | Sonar (fast), Sonar Reasoning                                                                                                          |
| **Specialized**     | Qwen 3 Coder 30B, Qwen 3 Character                                                                                                     |

### Image & Video Generation

| Group        | Models                                           |
| ------------ | ------------------------------------------------ |
| **Fast**     | Z-Image, Flux.1                                  |
| **Editing**  | Kontext, Klein Large, GPT-Image 1.5, Nano Banana |
| **Advanced** | Nano Banana Pro, Seedream Pro, Flux 2 Max        |
| **Video**    | Seedance, Wan, LTX 2, Grok Imagine Video         |

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS (Glassmorphism & CRT effects)
- **UI Components**: Radix UI / Shadcn
- **Storage**: IndexedDB (via Dexie.js) + AWS S3 for generated assets
- **AI SDK**: Vercel AI SDK with `ai-sdk-pollinations` provider
- **AI Providers**: Pollinations.ai (chat, image, video, audio), Replicate (image, video)

## Project Structure

```
src/
├── app/          # Next.js routes & API endpoints
├── components/   # React components (Radix UI / Shadcn)
├── hooks/        # Custom hooks for state management
├── lib/          # Services, utilities, SDK shims
├── config/       # Model configs, prompts, translations
└── types/        # TypeScript type definitions
```

## Privacy & Data

- **Zero Server Storage**: Your chats are never saved on our servers.
- **Local Ownership**: All data lives in your browser's IndexedDB.
- **Generated Assets**: Stored on S3 for reliability, referenced by your local database.
- **Transparency**: Request the system prompt anytime. We hide nothing.

## Development

```bash
npm run dev          # Development server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm test             # Jest tests
```

---

_Created with energy by [Loopmaster](https://github.com/johnmeckel) (John Meckel)_
