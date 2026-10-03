# Product Identity: hey.hi

> **"the assistant computer for everyone."**

## 1. Product Overview

**hey.hi** is a high-performance, privacy-first AI platform. It acts as a transparent interface ("Assistant Computer") that democratizes access to state-of-the-art AI models without the friction of paywalls, subscriptions, or invasive data tracking.

* **Core Philosophy**: Absolute transparency, "Local-First" storage, and frictionless exploration.
* **Unique Identity**: Inspired by terminal aesthetics (CRT/Matrix style), emphasizing that it is a powerful *tool* (a computer program), not a human-mimicking entity.
* **Data Policy**: No user accounts. No server-side chat storage. Data lives 100% in the user's browser.

## 2. Core Experience

### The "Assistant Computer" Terminal
A specialized header that provides real-time system status in a typewriter/CRT style. It reinforces the identity of the platform as a sophisticated machine service.

### One Surface
Chat and Create are two spaces in one shell. Switching never reloads and never loses state; history, gallery and settings are sheets on top of whichever space is in front.

### Chat & Vision
Interactions with LLMs (Claude, Gemini, DeepSeek, Mistral, Kimi, Qwen and more) with multimodal input. When an answer calls for an image, the assistant draws one: it grows out of a pulsing ASCII field and then stands on its own, frameless — one tap takes it into Create.

### Create
The full generation workspace at `/create`, the second space of the shell, on the same origin as the chat, so gallery and keys stay shared. A separate `create.hey-hi.cloud` was dropped on 2026-08-29: a second hostname is a second browser origin, which would split IndexedDB and localStorage. Users can switch between Pollinations and Pruna providers, pick text-to-image / image-to-image / text-to-video / image-to-video / sound modes, upload reference images, adjust parameters, and inspect generation details with download / retry / reuse actions.

### Sound
Music lives in Create's sound mode (ACE-Step on a self-hosted endpoint). The chat does not compose; the Pollinations music models are key-gated and wait on the sound plan.

### Code
A **Code** switch on the composer turns on the code-focused response mode for the conversation.

### Research
A **Research** switch on the composer turns on live web search and source analysis via Sonar models.

## 3. Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router, Turbopack), TypeScript.
- **UI**: Tailwind CSS with motion tokens, Framer Motion, Radix UI / Shadcn, vaul sheets.

### AI Infrastructure & Connectivity
- **Primary Provider**: [Pollinations.ai](https://pollinations.ai) — Chat, image, and video generation (free tier + authenticated Pollen API).
- **Music**: ACE-Step 1.5 on a self-hosted endpoint (`/api/sound`); `/api/compose` stays for the Pollinations music models.
- **Voice I/O**: STT + TTS via Pollinations (OpenAI-compatible audio endpoints).
- **Transport**: Direct Pollinations HTTPS calls for chat; lightweight URL shim for image/video generation.

### Data & Output
- **Persistence**: Local-First Hybrid Storage.
    - **IndexedDB (Dexie v3)**: Primary database for conversations, messages, memories, and asset metadata.
    - **Pollinations Media Storage**: Content-addressed remote storage for generated images/videos.
    - **LocalStorage**: Lightweight UI preferences and settings.

## 4. System Identity (Embedded in System Prompts)

The app's self-knowledge is defined in `src/config/chat-options.ts`:

### Identity Protocol (`SYSTEM_IDENTITY_PROTOCOL`)
- **Name**: hey.hi
- **Nature**: High-performance AI Interface (UI), not a standalone model.
- **Brain**: Connects to external models via Pollinations.ai API.
- **Privacy**: Local-First. No server-side chat storage. Data lives ONLY in user's browser.
- **Not Human**: Computer program. Never claims human status.
- **Neutrality**: Does not judge user intent or conversation topics.
- **Transparency**: 100% open about logic and system prompt when asked.

### Safety Protocol (`SHARED_SAFETY_PROTOCOL`)
- Detects user distress (Condition A) and acute danger (Condition B).
- Condition A: Stay present, validate feelings, ask open questions.
- Condition B: Immediate intervention, redirect to 112 or crisis hotline (0800 111 0 111).
- Forbidden: Never say "I cannot help" for thoughts only. No guilt-tripping.

### Language Guard (`OUTPUT_LANGUAGE_GUARD`)
- Default response language: German.
- Switches to English if user writes in English.
- Matches user's tone and detail level.

### Response Styles (6 Personas)
| Style | Identity | Tone |
|-------|----------|------|
| **Basic** | Smart, authentic companion | Casual Professional |
| **Precise** | Sharp, analytical assistant | Business Expert |
| **Deep Dive** | Expert analyst | Academic depth |
| **Emotional Support** | Empathetic companion | Warm, validating |
| **Philosophical** | Thought partner | Reflective, Socratic |
| **Creative Director** | Decisive creative strategy partner | Bold, execution-oriented |

## 5. System Ethics (The Identity Protocol)
- **Transparency First**: Fully open system prompts and logic upon request.
- **Honesty**: Strictly avoids claiming human status. Explicitly identifies as a computer program.
- **Safety**: Built-in priority emergency protocols for user distress.
- **Safety**: Refuses requests that materially enable harm, abuse, illegal intrusion, or exploitation, while staying useful with adjacent safe help.
