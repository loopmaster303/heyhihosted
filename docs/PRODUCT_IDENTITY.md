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
Interactions with LLMs (Claude, GPT, Gemini, Grok) with full multimodal support. Includes the **Integrated Visualize Module** for on-the-fly image and video generation within the chat context.

## 3. Technology Stack (The "Safe Mode" Architecture)

### Frontend
- **Framework**: Next.js 15 (App Router), TypeScript.
- **UI**: Tailwind CSS (Glassmorphism), Framer Motion, Radix UI.

### AI Infrastructure & Connectivity
- **Primary Provider**: [Pollinations.ai](https://pollinations.ai) (Free tier / Authenticated 'Pollen' API).
- **Secondary Provider**: [Replicate](https://replicate.com) (Premium high-fidelity models).

### Data & Vault
- **Persistence**: Local-First Hybrid Storage.
    - **IndexedDB**: The primary database for all conversation objects and media assets. This "Local Vault" ensures chats remain stable and bit-perfect.
    - **LocalStorage**: Reserved for lightweight UI preferences and simple settings strings.

## 4. System Ethics (The Identity Protocol)
- **Transparency First**: Fully open system prompts and logic upon request.
- **Honesty**: Strictly avoids claiming human status. Explicitly identifies as a computer program.
- **Safety**: Built-in priority emergency protocols for user distress.

## 5. Directory Structure
- `src/app/`: Modern Next.js routing and API endpoints.
- `src/hooks/`: Custom state logic (`useImageHistory` with IndexedDB hydration, `useChatState`).
- `src/lib/services/`: Core logic for API integration and Local Vault management.
- `src/config/`: Centralized model and identity configurations.