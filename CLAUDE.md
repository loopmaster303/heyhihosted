# CLAUDE.md

Assistant guidance for Claude working in this repository.

## Start Here

1. Read [AGENTS.md](/Users/johnmeckel/heyhihosted/AGENTS.md) first. It is the workflow constitution for this repo.
2. Treat [README.md](/Users/johnmeckel/heyhihosted/README.md), [docs/PRODUCT_AUDIT_2026-03-13.md](/Users/johnmeckel/heyhihosted/docs/PRODUCT_AUDIT_2026-03-13.md), and [docs/PRODUCT_AUDIT_FOLLOWUP_2026-03-13.md](/Users/johnmeckel/heyhihosted/docs/PRODUCT_AUDIT_FOLLOWUP_2026-03-13.md) as the current product/runtime truth.
3. Use [docs/README.md](/Users/johnmeckel/heyhihosted/docs/README.md) as the docs map for active vs archived material.
4. Prefer updating one canonical truth document instead of duplicating architecture notes in multiple places.

## Project Snapshot

**hey.hi** is a local-first AI workspace built on Next.js 16 and Pollinations.ai.

- Unified app shell with `landing` and `chat` states at `/unified`
- Visible user modes: `standard`, `visualize`, `compose`, `research`
- Code mode exists as an internal response-mode flag, not as a separate visible tool
- Generated media lives in Pollinations Media Storage, while conversations, memories, settings, and output metadata live locally in IndexedDB / localStorage
- The product surface now calls the generated-media area **Output**

## Current Runtime Truth

### Visible text models
- `claude-fast`
- `gemini-fast`
- `gemini-search`
- `deepseek`
- `nova-fast`
- `mistral`
- `perplexity-fast`
- `perplexity-reasoning`
- `kimi`
- `glm`
- `minimax`
- `qwen-coder`

### Visible image/video models (free tier)
- `flux`
- `zimage`
- `gpt-image`
- `klein`
- `grok-image`
- `grok-video`

### Additional image/video models (BYOP key required)
- `kontext`, `gptimage-large`, `seedream5`, `nanobanana`, `nanobanana-2`, `nanobanana-pro`
- `qwen-image`, `grok-imagine-pro`, `p-image`, `p-image-edit`
- `wan`, `wan-fast`, `seedance`, `ltx-2`, `p-video`

### Key implementation notes
- Search/research routing is delegated through a single strategy path; `WebContextService` is optional helper logic, not the default delegated path.
- BYOP key handling is partially hardened but still XSS-sensitive because the key remains in web storage.
- Manual availability governance is centralized in [src/config/chat-options.ts](/Users/johnmeckel/heyhihosted/src/config/chat-options.ts) and [src/config/unified-image-models.ts](/Users/johnmeckel/heyhihosted/src/config/unified-image-models.ts).
- Compose state is shared across landing/chat via the unified page layer.

## Important Files

- [src/app/unified/page.tsx](/Users/johnmeckel/heyhihosted/src/app/unified/page.tsx): top-level unified shell
- [src/components/ChatProvider.tsx](/Users/johnmeckel/heyhihosted/src/components/ChatProvider.tsx): state orchestration
- [src/hooks/useChatState.ts](/Users/johnmeckel/heyhihosted/src/hooks/useChatState.ts): persistence-oriented base state
- [src/config/chat-options.ts](/Users/johnmeckel/heyhihosted/src/config/chat-options.ts): text-model truth, response styles, system prompts
- [src/config/unified-image-models.ts](/Users/johnmeckel/heyhihosted/src/config/unified-image-models.ts): visible image/video model truth
- [src/lib/services/output-service.ts](/Users/johnmeckel/heyhihosted/src/lib/services/output-service.ts): output persistence adapter

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
```

For focused tests, prefer:

```bash
CI=1 npm test -- --runInBand path/to/test.ts
```

## Cleanup Rules

- Do not invent new truth docs when an existing active doc can be updated.
- Avoid model-name marketing copy unless it is clearly tied to the current visible registry.
- Treat `README.md`, `CLAUDE.md`, and `GEMINI.md` as synchronized adapters over the same runtime truth.
