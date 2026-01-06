# Plan: Studio Tool (Advanced UI)

**Goal**: Create a "Pro" interface (`/studio`) that exposes **all** available parameters for AI models, similar to *Stable Diffusion Web UI*. Users should have granular control over settings that are currently hidden or defaulted in the standard chat/visualize flow.

## 1. Requirements

### Core Philosophy
- **No Hidden Defaults**: Every parameter supported by the API (Pollinations/Replicate) should be exposed.
- **Power User UX**: Dense, functional UI (likely sidebar-heavy) rather than the simplified "Chat" aesthetic.
- **Model Agnostic**: Controls should dynamically adapt based on the selected model's capabilities (e.g., Video models show FPS/Duration, Image models show Sampler/Steps).

### Key Features
1.  **Parameter Control Center**:
    - **Prompting**: Positive & Negative Prompts.
    - **Generation**: Steps, Guidance Scale (CFG), Seed, Sampler/Scheduler.
    - **Dimensions**: Exact Width/Height (not just aspect ratio presets).
    - **Quality/Safety**: Output Quality (1-100), Safety Filter levels (allow disabling if API permits).
    - **Advanced**: Refiner switch, LoRA weights (if supported in future).
2.  **Model Selection**:
    - Granular version selection (if applicable).
    - Clear distinction between Provider (Pollinations vs. Replicate).
3.  **History & Management**:
    - "Send to Image-to-Image" flow.
    - Inspect metadata of generated images (view used seed/settings).

## 2. Implementation Strategy

### Phase 1: Parameter Exposure (Data Layer)
- [ ] Audit `unified-model-configs.ts` and `unified-image-models.ts` to map *all* possible API parameters for each model.
- [ ] Extend `UnifiedImageToolState` to hold a dynamic `params` object (key-value store for advanced settings).
- [ ] Update `UnifiedImageTool.tsx` `handleSubmit` to pass these params through to the API.

### Phase 2: UI Construction (The "Studio" Interface)
- [ ] Create a new layout for `/studio` (distinct from `/visualizepro`).
    - **Left Sidebar**: Advanced Controls (Accordions/Tabs).
    - **Center**: Canvas/Preview Area.
    - **Right**: History/Gallery (Metadata Inspector).
- [ ] Build reusable "Control Inputs":
    - `SliderWithInput` (for Steps/CFG).
    - `DimensionSelector` (Width x Height).
    - `SeedInput` (Randomize vs Fixed).

### Phase 3: Integration
- [ ] Connect the UI to the `handleSubmit` logic.
- [ ] Ensure "Save/Load Settings" capability (persist studio state).

## 3. Technical Stack
- **State Management**: Existing `useUnifiedImageToolState` (extended).
- **UI Components**: Shadcn UI (Sliders, Selects, Switches, Collapsibles).
- **Validation**: Zod schemas for parameter limits (min/max steps).
