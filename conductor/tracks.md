# Conductor Tracks

## Active Tracks

### [TRACK-001] Design System Evolution: "Glass Material Code"
- **Goal**: Implement a new design language combining Material 3 adaptive layouts and Apple-style Glassmorphism while maintaining the "Code" aesthetic.
- **Status**: 🟢 Ready to Start
- **Plan File**: `conductor/tracks/001_design_system/plan.md`
- **Context**: Based on `docs/DESIGN_SYSTEM_PLAN.md`. Focuses on accessibility (typography), glass utility classes, and motion (Framer Motion).

### [TRACK-002] Studio Tool (Advanced UI)
- **Goal**: Create a "Pro" interface exposing all AI model parameters (Steps, CFG, Seed, etc.) for full control, similar to SD Web UI.
- **Status**: ⏸️ Paused (Code Archived)
- **Plan File**: `conductor/tracks/002_studio_tool/plan.md`
- **Context**: Transforms `/studio` into a power-user tool. Code backed up in track folder (`page.tsx.backup`, `useStudioState.ts.backup`).

### [TRACK-003] Personal Knowledge Base & "Playa" Memory
- **Goal**: Fully implement the local-first long-term memory, cross-chat context awareness, and knowledge base export.
- **Status**: 🔄 In Progress
- **Plan File**: `conductor/tracks/003_knowledge_vault/plan.md`
- **Context**: Moves beyond simple chat history to a structured personal brain. Uses IndexedDB for storage and LLM-extractions for summaries.

## Backlog
- [ ] **Storage Migration**: Implement `STORAGE_MIGRATION_PLAN.md` (Local -> Hybrid/Cloud).
- [ ] **Product Identity Polish**: Refine `docs/PRODUCT_IDENTITY.md` based on new features.
