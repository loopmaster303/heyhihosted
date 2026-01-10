# hey.hi – the assistant computer.

**hey.hi** is a lightweight, privacy-focused, and fully transparent AI interface. It provides direct, frictionless access to state-of-the-art Large Language Models and Generative Media tools without paywalls, accounts, or server-side tracking.

> **⚡️ Powered by [Pollinations.ai](https://pollinations.ai)**
> 
> Free, open-source text and multimedia generation for the decentralized web.

## 🚀 Vision
To democratize artificial intelligence by creating a high-performance "Local-First" environment where users own their data and the machine acts as an honest, open-source-minded service.

## ✨ Key Features
- **Multimodal Chat**: Discuss ideas with Claude, GPT, Gemini, or Grok. Full vision support included.
- **Generative Media**: Create images and videos instantly using Pollinations' unified API.
- **Local Vault**: Chats and generated assets are stored locally in your browser (IndexedDB). They never expire and stay private.
- **Anonymous Image Relay**: High-fidelity vision analysis via a temporary, privacy-respecting proxy.
- **CRT Terminal Identity**: A specialized UI inspired by terminal aesthetics that provides real-time system feedback.
- **No-Auth Architecture**: Instant utility. No sign-up, no logins, no BS.

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Glassmorphism & CRT effects)
- **Storage**: IndexedDB (via **Dexie.js**)
- **AI Engine**: Pollinations.ai (Text, Image, Video)

## 📂 Project Structure
- `/src/app`: Application routes and API endpoints.
- `/src/components`: Reusable UI components (Radix UI / Shadcn).
- `/src/hooks`: Advanced state management for local persistence.
- `/src/lib/services`: Service layer for AI and storage orchestration.

## 🔒 Privacy & Data
- **Zero Server Storage**: Your chats are never saved on our servers.
- **Local Ownership**: Media assets live in your browser's memory.
- **Transparency**: Request the system prompt anytime. We hide nothing.

---
*Created with 💜 by [Loopmaster](https://github.com/johnmeckel) (John Meckel)*
