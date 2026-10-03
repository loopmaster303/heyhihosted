# hey.hi – the assistant computer.

**Ecosystem:** democrabs — "The crab snaps with everyone but it's yours"

**hey.hi** is a lightweight, privacy-focused, and fully transparent AI interface. It provides direct, frictionless access to state-of-the-art Large Language Models and Generative Media tools without paywalls, accounts, or server-side tracking.

> **Powered by [Pollinations.ai](https://pollinations.ai)**
>
> Free, open-source text and multimedia generation for the decentralized web.

## Vision

To democratize artificial intelligence by creating a high-performance "Local-First" environment where users own their data and the machine acts as an honest, open-source-minded service.

## Key Features

- **One surface**: Chat and Create live in one shell. Switching keeps both alive — the conversation and running generations survive every switch. History, gallery and settings open as sheets on top, not as separate pages; the browser's Back button closes them.
- **Multimodal Chat**: Discuss ideas with Claude, Gemini, DeepSeek, Mistral, and more. Vision support on compatible models. Two switches on the composer: **Research** (live web search and sources) and **Code**.
- **Images in the conversation**: Ask for an image and the assistant draws one. It grows out of a pulsing ASCII field and then stands on its own, frameless — one tap takes it into Create with prompt and model prefilled.
- **Create**: Full-screen workspace at `/create` — provider switch (Pollinations / Pruna), text-to-image, image-to-image, text-to-video, image-to-video and sound, reference uploads, up to three parallel runs, and a detail panel with download / retry / reuse. Long video runs survive a reload.
- **Voice I/O**: Speech-to-text and text-to-speech via Pollinations.
- **Prompt Enhancement**: Model-aware prompt optimization for image, video and music.
- **Local-First**: Chats, memories, settings and the gallery live in your browser (IndexedDB), generated media in Pollinations Media Storage.
- **Native feel**: Installable as a web app, safe-area aware, keyboard-aware on phones, reduced motion respected, WCAG 2.2 AA as the gate.
- **No-Auth Architecture**: No sign-up, no logins.

## Available Models

### Chat (LLMs)

| Category | Models |
| -------- | ------ |
| **Visible Models** | Claude Haiku 4.5 (`claude-fast`), Gemini 2.5 Flash Lite (`gemini-fast`), Gemini 2.5 Flash Lite + Search (`gemini-search`), DeepSeek V4 Flash Lite (`deepseek`), Amazon Nova Micro (`nova-fast`), Mistral Small 3.2 24B (`mistral`), Perplexity Sonar (`perplexity-fast`), Perplexity Sonar Reasoning (`perplexity-reasoning`), Moonshot Kimi K2.6 (`kimi`), z.ai GLM-5.2 (`glm`), Minimax M3 (`minimax`), Qwen3 Coder 30B (`qwen-coder`) |

The list above is the canonical visible registry in [`src/config/chat-options.ts`](src/config/chat-options.ts). IDs in parentheses are the internal model IDs.

### Image & Video Generation

**In the chat**, images come from one free Pollinations model, chosen in settings (default Flux). The chat's choice follows one rule — free, Pollinations, image — and never grows with a key.

**In Create**, two providers, switchable at the top of the parameter panel:

- **Pollinations** — the default. A free tier plus more models that unlock with a Pollinations key.
- **Pruna** — the `p-*` image/video family and a few ByteDance/Wan models. Pruna is **BYOP-only**: every run needs your own Pruna key.

The switch only scopes the model list; the selected model decides where a run goes. Chat, voice and prompt enhancement always run through Pollinations.

Per-model tiers (free · key-required · hidden) are governed by the `isFree` / `enabled` / `byopVisible` flags in [`src/config/unified-image-models.ts`](src/config/unified-image-models.ts) — **that file is the single source of truth**. `node scripts/check-model-registry.mjs` checks it against the live registry.

### Sound

Create's **sound** mode runs ACE-Step 1.5 on a self-hosted endpoint (`/api/sound`). The Pollinations music models are all key-gated; wiring them into Create is the open [sound plan](docs/PLAN-sound-modellwahl-2026-09-03.md).

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with motion tokens (`--motion-fast/med/slow`)
- **UI Components**: Radix UI / Shadcn, vaul sheets, framer-motion
- **Storage**: IndexedDB (via Dexie.js) + Pollinations Media Storage (content-addressed)
- **AI Transport**: Direct Pollinations HTTPS calls + lightweight SDK shim for image/video URLs
- **AI Providers**: Pollinations.ai (chat, image, video, audio) + Pruna AI (image/video, bring your own key)

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

## Ecosystem

hey.hi is Level 2 ("use") of the heyhi ecosystem; the canonical level model lives in `~/heyhi/LEVELS.md`. The historical reorganization plan remains available in Git history.
