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

## 3. Project Status (Feb 2026)

- **Phase 1 (Asset & Gallery Deep-Sync):** Complete. Centralized `GalleryService.saveGeneratedAsset()`, global `BlobManager`, `AssetFallbackService` with retry.
- **Phase 2 (Code-Hygiene & Legacy):** Complete. Legacy model refs removed, streaming deferred (using `generateText`), ChatView evaluated.
- **Phase 3 (Security & Performance):** Long-term. Web Crypto API encryption planned.
- **Upload Pipeline:** Unified via S3 signed URLs (Catbox removed). Reference images use `resolveReferenceUrls()`.
- **Smart Router:** Auto-detects search intent (German + English) → routes to `sona`/`perplexity-fast`. Deep Research → `nomnom`.
- **Compose Mode:** Music generation via ElevenLabs (`useComposeMusicState`) with VibeCraft prompt enhancement.
