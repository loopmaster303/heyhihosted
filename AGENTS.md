# AGENTS.md: The Constitution

This document defines the strict workflow and principles for all AI Agents working on the HeyHi project. These rules are absolute and must be followed for every task.

## 1. The 4-Phase Workflow

### PHASE 1: BRAINSTORMING & CONTEXT

- **Goal Understanding:** Clearly state the objective.
- **Context Gathering:** Identify and read all relevant files (`@Files`).
- **Vibe Definition:** Define the aesthetic and logical direction (e.g., "Cyberpunk UI", "Pragmatic Senior Logic").

### PHASE 2: BLUEPRINT (The Roadmap)

- **Natural Language Plan:** Create a step-by-step implementation guide.
- **Component Mapping:** List exactly which files and modules will be modified or created.

### PHASE 3: REALITY CHECK (Architectural Audit) -> **CRITICAL**

- **STOP.** Before writing any code:
- **Comparison:** Compare the Blueprint with the _existing_ codebase.
- **Inquiry:**
  - "Does this lead to spaghetti code?"
  - "Am I breaking existing hooks (e.g., `useChatState`, `useUnifiedImageToolState`)?"
  - "Is there a simpler, more idiomatic way?"
- **Mitigation:** If uncertainties are found, report them and adjust the Blueprint. **Avoid "Verschlimmbesserung" (making it worse while trying to improve it).**

> [!CAUTION] > **MANDATORY USER CONFIRMATION:** After presenting the Blueprint and Reality Check, the Agent **MUST STOP** and wait for explicit user confirmation (e.g., "leg los", "bestätigt", "approved", "go") **BEFORE** starting Phase 4. No exceptions. Do NOT proceed to execution automatically.

### PHASE 4: EXECUTION & VERIFICATION

- **Prerequisite:** User has explicitly approved the plan.
- **Implementation:** Write the code according to the audited Blueprint.
- **Verification:**
  - Does it build? (`npm run dev` / `tsc`)
  - Are types correct?
  - Does it meet the Phase 1 goals?

## 2. General Principles

- **Local-First:** Prioritize IndexedDB and local state over cloud dependencies where possible.
- **Anti-Slop:** No empty promises or "todo" comments without action. Deliver working code or nothing.
- **Tone:** Direct, concise, Senior Engineer level. No fluff.
- **Anti-Browser Tool (USER-ENFORCED):** Never use `browser_subagent` or `read_browser_page` for verification. It is considered "slop". Rely on code reviews and manual verification.
- **Seniority:** Think before you act. Assume complexity but aim for simplicity.
- **Plan Validation (Always Stated):** Explicitly validate the Blueprint in the response (Phase 3) even if the user did not ask.
- **Explain Twice + Why:** Provide a normal explanation and then a simpler explanation; always state the rationale ("why") for the chosen plan/changes and the key context used.

## 3. Project Status (August 2026)

- **Phase 1 (Asset & Gallery Deep-Sync):** Complete. Centralized `OutputService.saveGeneratedAsset()`, global `BlobManager`, `AssetFallbackService` with retry.
- **Phase 2 (Code-Hygiene & Legacy):** Complete. Legacy model refs removed, streaming deferred (JSON responses via `/api/chat/completion`), ChatView evaluated.
- **Phase 3 (Security & Performance):** Long-term. Web Crypto API encryption planned. Upload size limits and content-type policy landed (`src/lib/upload/`).
- **Phase 4 (Playground Merge):** Complete. The former `heyhihosted-playground` worktree has been merged into `main` as the `/create` route. Live at `https://chat.hey-hi.cloud/create`; the product name is **Create**. The route moved from `/playground` to `/create` on 2026-08-29; the old path still redirects.
- **Upload Pipeline:** Unified via Pollinations Media Storage (`/api/media/upload`, `/api/media/ingest`). Raw bodies only — multipart is rejected. Reference images use `resolveReferenceUrls()`; Pruna models upload via `/api/pruna/upload`.
- **Smart Router:** Auto-detects search intent (German + English) → routes to `perplexity-fast`. Deep Research picks from the visible capable models via `getPreferredDeepResearchModel()`.
- **Compose Mode:** Music via `/api/compose` (`useComposeMusicState`) with model-specific prompt enhancement — ACE-Step 1.5 (free tier), ElevenMusic v2 and Stable Audio 3 Medium (key required).
- **Create Mode:** Dedicated full-screen generation workspace at `/create`. Supports Pollinations + Pruna providers, t2i/i2i/t2v/i2v modes, reference uploads, aspect-ratio controls, generation progress, and result details.
- **Providers:** Pollinations plus Pruna. See `CLAUDE.md` for the provider-switch rules before touching Visualize or Playground.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
