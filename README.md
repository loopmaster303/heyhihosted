# hey.hi – the assistant computer.

**Ecosystem:** democrabs — "The crab snaps with everyone but it's yours"

**hey.hi** is a lightweight, privacy-focused, and fully transparent AI interface. It provides direct, frictionless access to state-of-the-art Large Language Models and Generative Media tools without paywalls, accounts, or server-side tracking.

> **Powered by [Pollinations.ai](https://pollinations.ai)**
>
> Free, open-source text and multimedia generation for the decentralized web.

## Vision

To democratize artificial intelligence by creating a high-performance "Local-First" environment where users own their data and the machine acts as an honest, open-source-minded service.

## Key Features

- **Multimodal Chat**: Discuss ideas with Claude, GPT, Gemini, Deepseek, Mistral, and more. Vision support on compatible models.
- **Generative Media**: Create images and videos instantly via Pollinations API.
- **Compose Mode**: Music generation via **Pollinations** (`/api/compose`) — **ACE-Step 1.5** free up to 1 minute, plus **ElevenMusic v2** and **Stable Audio 3 Medium** with a Pollinations key.
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
| **Visible Models** | Claude Haiku 4.5 (`claude-fast`), Gemini 2.5 Flash Lite (`gemini-fast`), Gemini 2.5 Flash Lite + Search (`gemini-search`), DeepSeek V4 Flash Lite (`deepseek`), Amazon Nova Micro (`nova-fast`), Mistral Small 3.2 24B (`mistral`), Perplexity Sonar (`perplexity-fast`), Perplexity Sonar Reasoning (`perplexity-reasoning`), Moonshot Kimi K2.6 (`kimi`), z.ai GLM-5.2 (`glm`), Minimax M3 (`minimax`), Qwen3 Coder 30B (`qwen-coder`) |

The list above is the canonical visible registry in [`src/config/chat-options.ts`](src/config/chat-options.ts). IDs in parentheses are the internal model IDs.

### Image & Video Generation

Visualize offers **two providers**, switchable in the config sidebar:

- **Pollinations** — the default. A free tier (usable without a key) plus more models that unlock with a Pollinations key.
- **Pruna** — the `p-*` image/video family plus a few ByteDance/Wan models (`zimage`, `qwen-image`, `wan-image-small`, …); requires a Pollinations key (server- or user-provided).

Per-model tiers (free · key-required · hidden) are governed by the `isFree` / `enabled` flags in [`src/config/unified-image-models.ts`](src/config/unified-image-models.ts) — **that file is the single source of truth**. Representative free-tier Pollinations image models: Flux.1 Fast (`flux`), GPT Image 1 Mini (`gpt-image`), Flux.2 Klein (`klein`), Flux.1 Kontext (`kontext`), GPT-Image Large (`gptimage-large`), Grok Imagine (`grok-imagine`), Ideogram V4 Turbo (`ideogram-v4-turbo`). Advanced image models (Seedream, Nano Banana family, Grok Imagine Pro, WAN 2.7) and video models (e.g. Grok Video `grok-video`) require a key.

### Compose (Music)

| Model | Access | Length |
| ----- | ------ | ------ |
| **ACE-Step 1.5** (`acestep`) | Free (no key) | up to 1 minute |
| **ACE-Step 1.5** with key | Pollinations key | stepped up to 5 minutes |
| **ElevenMusic v2** (`elevenmusic`) | Pollinations key | stepped up to 5 minutes |
| **Stable Audio 3 Medium** (`stable-audio-3-medium`) | Pollinations key | stepped up to 5 minutes |

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

## Reorg & GODSPACE (Master Plan 2026-06-01)
Master Plan: `/Users/johnmeckel/heyhihosted/docs/plans/2026-06-01-heyhi-ecosystem-reorg-plan.md`
New names: sayhi (ex-heyhiblogheyhiworld, L1 arts/roleplay), heyhiblog (ex-heyhi-ai-or-goodbye, content layer), democrabs (ex-buergerbuddy, "The crab snaps with everyone but it's yours"), heyhireset (GODSPACE central).
Levels: L1 sayhi, L2 heyhihosted (this), L3 advanced (future). Cross-links via docs/project.html XLinks + central heyhi.html in heyhireset.
