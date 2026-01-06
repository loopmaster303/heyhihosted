# Product Identity: HeyHi

> **"the assistant computer for everyone."**

## 1. Product Overview

**HeyHi** is a high-performance, privacy-first AI platform. It acts as a transparent interface ("Assistant Computer") that democratizes access to state-of-the-art AI models without the friction of paywalls, subscriptions, or invasive data tracking.

*   **Core Philosophy**: Absolute transparency, "Local-First" storage, and frictionless exploration.
*   **Unique Identity**: Inspired by terminal aesthetics (CRT/Matrix style), emphasizing that it is a powerful *tool* (a computer program), not a human-mimicking entity.
*   **Data Policy**: No user accounts. No server-side chat storage. Data lives 100% in the user's browser.

## 2. Core Experience

### The "Assistant Computer" Terminal
A specialized header that provides real-time system status in a typewriter/CRT style. It reinforces the identity of the platform as a sophisticated machine service.

### Unified Chat & Vision
Interactions with LLMs (Claude, GPT, Gemini, Grok) with full multimodal support. Images uploaded in chat are analyzed via an anonymous proxy, keeping the user's local environment clean while providing full "vision" capabilities.

### Visualize Pro (Archived / In Development)
A dedicated studio for granular control over generative models (Pollinations, Replicate).
*   **Standard Mode**: Fast, simple, accessible.
*   **Pro/Studio Mode**: Exposes every hyperparameter (Steps, CFG, Seeds, Negative Prompts).

## 3. Technology Stack (The "Safe Mode" Architecture)

### Frontend
- **Framework**: Next.js 15 (App Router), TypeScript.
- **UI**: Tailwind CSS (Glassmorphism), Framer Motion, Radix UI.

### AI Infrastructure & Connectivity
- **Primary Provider**: [Pollinations.ai](https://pollinations.ai) (Free tier / Authenticated 'Pollen' API).
- **Secondary Provider**: [Replicate](https://replicate.com) (Premium high-fidelity models).
- **Vision Proxy**: Anonymous relay (Catbox.moe) for temporary image hosting during AI analysis.

### Data & Vault
- **Persistence**: Hybrid Storage.
    - *Metadata*: `localStorage` (Chat history, settings).
    - *Media Assets*: **IndexedDB** (`idb-keyval`). This "Local Vault" ensures images remain stable and bit-perfect even after provider-side deletion.

## 4. System Ethics (The Identity Protocol)
- **Transparency First**: Fully open system prompts and logic upon request.
- **Honesty**: Strictly avoids claiming human status. Explicitly identifies as a computer program.
- **Safety**: Built-in priority emergency protocols for user distress.

## 5. Directory Structure
- `src/app/`: Modern Next.js routing and API endpoints.
- `src/hooks/`: Custom state logic (`useImageHistory` with IndexedDB hydration, `useChatState`).
- `src/lib/services/`: Core logic for API integration and Local Vault management.
- `src/config/`: Centralized model and identity configurations.