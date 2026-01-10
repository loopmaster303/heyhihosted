# Gemini Context: hey.hi

## Project Vision

**HeyHi - Local First AI Command Center.** A privacy-focused, high-performance platform for multimodal AI interactions, prioritizing local storage and seamless UX.

## Tech Stack

- **Framework**: Next.js 15
- **UI**: Shadcn UI, Tailwind CSS
- **State**: React Context + Custom Hooks (Local First)
- **Storage**: IndexedDB (Dexie)
- **AI**: Pollinations (Image/Chat). Replicate is optional/legacy.

## Current State & Known Issues

- [x] **Gallery Assets Vault**: IndexedDB assets table is the single source of truth. Supports Hybrid Storage (S3 `storageKey` preferred, local `blob` fallback).
- [x] **"God Hook" Refactor**: `useChatState` successfully split into specialized persistence, UI, and media hooks.
- [x] **IndexedDB v3 Foundation**: Migrated to a structured local-first storage using Dexie.js.
- [x] **Model Selector**: Successfully moved to Input Bar (Compact Mode).
- [x] **Storage Migration**: Phase 1 (IndexedDB) complete. Ready for E2E encryption layer.

## Architecture Highlights

- **`UnifiedImageTool`**: Centralized logic for image generation and handling.
- **`conductor/`**: Structured task and track management for development.
- **The "Pollen" Standard**: Optimized API communication with Pollinations.

## Critical Technical Constraints

### 1. API Usage

- **Image Generation**: Use the `/api/generate` endpoint which proxies to `gen.pollinations.ai`.
- **Parameters**: Always send `nologo=true` and `private=true`.
- **Quality Boost**: `z-image-turbo` requires specific quality tags ("8k uhd, hyperrealistic") and `enhance=true` at the API level.

### 2. Storage Architecture ("Safe Mode")

- **Never store Blobs in localStorage** (Use Dexie/IndexedDB).
- **Local Vault**: Assets are stored in IndexedDB (Dexie).
- **Hybrid Media**: 
  - **S3 (Primary)**: Pollinations media is ingested to S3; DB stores `storageKey`.
  - **Blob (Fallback)**: Other media is stored as `Blob` directly in DB.
- **Hydration**: `useGalleryAssets` + `useAssetUrl` resolve object URLs (blobs) or signed S3 URLs on demand.

### 3. UI & Identity

- **Header**: CRT/Terminal style identity.
- **Modality**: Focus mode for "visualize" state (hides text-only tools).
- **Consistency**: Code monospace for UI and data. Glassmorphism theme.
