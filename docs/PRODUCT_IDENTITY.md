# Product Identity: HeyHi

**"Just say</hey.hi> to run multiple AI."**

## 1. Product Overview

**HeyHi** is a lightweight, accessible AI platform designed to democratize access to artificial intelligence. It removes barriers such as paywalls, subscriptions, and complex setups, allowing users to interact with state-of-the-art text, image, and video generation models instantly.

*   **Core Philosophy**: Privacy-focused (local storage), free-tier first, open exploration.
*   **Target Audience**: Artists, prototypers, learners, and anyone wanting quick access to AI tools without friction.
*   **Data Policy**: No user account required. No server-side storage of user chats.

## 2. Core Experience

### Unified Chat Interface
A central hub for interacting with various Large Language Models (LLMs). The interface supports markdown rendering, code highlighting, and fluid conversation flows.

### Visualize Pro (Image & Video Generation)
A powerful studio for generative media, aggregating models from multiple providers into a unified interface.
*   **Standard Mode**: Optimized for speed and ease of use (mostly free models).
*   **Advanced Mode**: Unlocks professional-grade models and granular controls (aspect ratio, seeds, negative prompts).
*   **Video Generation**: Text-to-Video and Image-to-Video capabilities.

### Voice & Audio
*   **Speech-to-Text (STT)**: Transcribe voice input directly into chat.
*   **Text-to-Speech (TTS)**: Vocalize AI responses.

## 3. Technology Stack

### Frontend & Framework
*   **Framework**: Next.js 15 (App Router)
*   **Language**: TypeScript
*   **UI Library**: React 18
*   **Styling**: Tailwind CSS, `tailwindcss-animate`
*   **Components**: Radix UI (Primitives), Lucide React (Icons), Framer Motion (Animations)

### AI Infrastructure
*   **Primary Provider (Free)**: [Pollinations.ai](https://pollinations.ai) (Text & Image)
    *   *Role*: Powers the core free experience for democratized access.
*   **Premium Provider**: [Replicate](https://replicate.com)
    *   *Role*: Access to high-end, compute-intensive models (Flux Pro, Wan Video, Veo).
*   **Auxiliary**: Mistral (via API) for prompt enhancement and chat.

### Data & State
*   **Persistence**: `localStorage` (Client-side only)
*   **Storage**: Vercel Blob (for temporary asset handling if needed)
*   **Deployment**: Vercel

## 4. Model Ecosystem

HeyHi curates a diverse selection of models, categorized by capability and tier.

### Image Generation
| Model Name | Provider | Tier | Key Features |
| :--- | :--- | :--- | :--- |
| **Flux1 Ultra** | Pollinations | Free (Standard) | High quality, fast, supports reference images. |
| **Flux1 Kontext** | Pollinations | Free (Standard) | Context-aware generation. |
| **GPT-Image** | Pollinations | Free (Standard) | DALL-E 3 class generation. |
| **Seedream** | Pollinations | Free (Standard) | ByteDance ARK powered. |
| **Nano Banana** | Pollinations | Free (Standard) | Powered by Gemini Flash. |
| **Z-Image Turbo** | Pollinations | Free (Standard) | Ultra-fast generation. |
| **Flux 2 Pro** | Replicate | Premium | Professional grade quality. |

### Video Generation
| Model Name | Provider | Tier | Key Features |
| :--- | :--- | :--- | :--- |
| **Seedance** | Pollinations | Free (Standard) | Reactive video generation. |
| **Veo 3.1** | Replicate/Pollinations | Hybrid | Google's advanced video model. |
| **Wan 2.5** | Replicate | Premium | T2V and I2V capabilities. |

## 5. Design System

*   **Visual Theme**: Dark mode default, clean, minimalist, code-centric aesthetics.
*   **Typography**:
    *   Body: `Inter`
    *   Monospace/Brand: `Code` font family
*   **UX Patterns**:
    *   **Particle Text**: Dynamic, interactive text effects for branding.
    *   **Unified Inputs**: Text areas that support multi-modal input (text + images).
    *   **Toasts**: Non-intrusive notifications for system status.

## 6. Architecture Highlights

*   **`src/ai`**: Logic flows for specific AI tasks (STT, TTS, Chat).
*   **`src/components/tools`**: Specialized UI widgets for AI interaction (e.g., `UnifiedImageTool`, `PersonalizationTool`).
*   **`src/config`**: Centralized configuration for all AI models (`unified-image-models.ts`, `unified-model-configs.ts`).
*   **`src/lib/services`**: Abstractions for API calls (`chat-service.ts`, `unified-api.ts`).
