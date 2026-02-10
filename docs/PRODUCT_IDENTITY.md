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

### Unified Chat & Vision
Interactions with LLMs (Claude, GPT, Gemini, Grok, Deepseek, Mistral, Kimi, Qwen) with full multimodal support. Includes the **Integrated Visualize Module** for on-the-fly image and video generation within the chat context.

### Compose Mode
Music generation via ElevenLabs with VibeCraft prompt enhancement. Users describe a vibe, the system enhances the prompt, and generates a track.

### Code Mode
Dedicated programming assistant with specialized system prompts and curated model routing (Qwen Coder, Deepseek, GLM, Gemini Large).

### Deep Research
Toggle web browsing for real-time search and source analysis via NomNom and Sonar models.

## 3. Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router, Turbopack), TypeScript.
- **UI**: Tailwind CSS (Glassmorphism), Framer Motion, Radix UI / Shadcn.

### AI Infrastructure & Connectivity
- **Primary Provider**: [Pollinations.ai](https://pollinations.ai) — Chat, image, and video generation (free tier + authenticated Pollen API).
- **Secondary Provider**: [Replicate](https://replicate.com) — Premium image/video models, TTS.
- **Music**: [ElevenLabs](https://elevenlabs.io) — Music generation via Compose mode.
- **STT**: [Deepgram](https://deepgram.com) — Speech-to-text transcription.
- **SDK**: Vercel AI SDK with `ai-sdk-pollinations` provider for chat completions.

### Data & Vault
- **Persistence**: Local-First Hybrid Storage.
    - **IndexedDB (Dexie v3)**: Primary database for conversations, messages, memories, and asset metadata.
    - **AWS S3**: Remote storage for generated images/videos with signed URL access.
    - **LocalStorage**: Lightweight UI preferences and settings.

## 4. System Identity (Embedded in System Prompts)

The app's self-knowledge is defined in `src/config/chat-options.ts`:

### Identity Protocol (`SYSTEM_IDENTITY_PROTOCOL`)
- **Name**: hey.hi
- **Nature**: High-performance AI Interface (UI), not a standalone model.
- **Brain**: Connects to external models via APIs (Pollinations.ai, Replicate.com).
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

### Response Styles (5 Personas)
| Style | Identity | Tone |
|-------|----------|------|
| **Basic** | Smart, authentic companion | Casual Professional |
| **Precise** | Sharp, analytical assistant | Business Expert |
| **Deep Dive** | Expert analyst | Academic depth |
| **Emotional Support** | Empathetic companion | Warm, validating |
| **Philosophical** | Thought partner | Reflective, Socratic |

## 5. System Ethics (The Identity Protocol)
- **Transparency First**: Fully open system prompts and logic upon request.
- **Honesty**: Strictly avoids claiming human status. Explicitly identifies as a computer program.
- **Safety**: Built-in priority emergency protocols for user distress.
- **Neutrality**: Does not judge, filter, or moralize about user interests.
