# hey.hi – the assistant computer.

**hey.hi** is a lightweight, privacy-focused, and fully transparent AI interface. It provides direct, frictionless access to state-of-the-art Large Language Models and Generative Media tools without paywalls, accounts, or server-side tracking.

> **Powered by [Pollinations.ai](https://pollinations.ai)**
>
> Free, open-source text and multimedia generation for the decentralized web.

## Vision

To democratize artificial intelligence by creating a high-performance "Local-First" environment where users own their data and the machine acts as an honest, open-source-minded service.

## Key Features

- **Multimodal Chat**: Discuss ideas with Claude, GPT, Gemini, Grok, Deepseek, Mistral, and more. Full vision support included.
- **Generative Media**: Create images and videos instantly via Pollinations API.
- **Compose Mode**: Music composing with **Eleven Music** via **Pollinations** (`/api/compose`).
- **Code Questions**: Ask directly in chat; responses already use the normal code formatting you expect.
- **Deep Research**: Toggle web browsing for real-time search and source analysis (Sonar / Sonar Reasoning).
- **Smart Router**: Auto-detects search intent (German + English) and routes to the right model.
- **Voice I/O**: Speech-to-text and text-to-speech via Pollinations (OpenAI-compatible endpoints).
- **Prompt Enhancement**: AI-powered prompt optimization for image and music generation.
- **Local-First Output**: Chats, memories, and generated assets stay in your browser (IndexedDB metadata plus Pollinations media storage for generated media).
- **Output Panel**: Quick overlay and full view for browsing generated images, videos, and tracks.
- **CRT Terminal Identity**: A specialized UI inspired by terminal aesthetics with real-time system feedback.
- **No-Auth Architecture**: Instant utility. No sign-up, no logins.

## Available Models

### Chat (LLMs)

| Category | Models |
| -------- | ------ |
| **Visible Free Models** | Claude Sonnet 4.6 (`claude-airforce`), Claude Haiku 4.5, Gemini 2.5 Flash Lite, Gemini Search, Amazon Nova Micro, Step 3.5 Flash, DeepSeek V3.2, Mistral, Sonar, Sonar Reasoning, Kimi K2.5, GLM-5, MiniMax M2.5, Qwen3 Coder 30B, Qwen Character, NomNom |

### Image & Video Generation

| Group        | Models |
| ------------ | ------ |
| **Free**     | Flux.1 Fast, Z-Image Turbo |
| **Editing**  | GPT Image 1 Mini |
| **Advanced** | Imagen 4, Grok Imagine |
| **Video**    | Grok Video |

Model visibility follows current Pollinations availability. The app only exposes models that are enabled in the local registry.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS (Glassmorphism & CRT effects)
- **UI Components**: Radix UI / Shadcn
- **Storage**: IndexedDB (via Dexie.js) + Pollinations Media Storage (content-addressed)
- **AI Transport**: Direct Pollinations HTTPS calls + lightweight SDK shim for image/video URLs
- **AI Providers**: Pollinations.ai (chat, image, video, audio)

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

- **Zero Server Chat Storage**: Your chats are not persisted on our servers.
- **Local Ownership**: Conversations, preferences, and output metadata live in your browser.
- **Generated Media**: Stored in Pollinations Media Storage and referenced by your local database.
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
