# Design System Evolution Plan: "Glass Material Code"

**Goal**: Synthesize **Material 3 principles** (adaptive sizing, layout), **Apple Glassmorphism** (translucency, blur, depth), and the existing **Code/Minimalist** identity into a cohesive, accessible, and animated design language.

**Context**: Building upon the [UX Audit](UX_AUDIT_AND_ROADMAP.md), this plan addresses critical accessibility issues while elevating the aesthetic.

## 1. Design Language Strategy

### The "Glass Material" Aesthetic
We will replace flat opaque backgrounds with layered, translucent surfaces that provide context and depth.
*   **Surfaces**: Dark, translucent backgrounds with `backdrop-blur-md` or `xl`.
*   **Borders**: Subtle, high-precision borders (`1px` solid `white/10`) to define edges without heavy shadows.
*   **Color**: Retain the "Soft Pink" identity but shift to a semantic system (Primary, Surface, Surface-Variant) to support the glass effect.
*   **Typography**: Fix legibility (Audit P0) by abandoning `font-weight: 250` for standard weights (`400`/`500`), using `Inter` for UI and `Code` for data/branding.

### The "React Motion" Layer
Motion will not be decoration, but communication.
*   **Micro-interactions**: Hover states, button clicks (scale/glow).
*   **Transitions**: Smooth layout shifts using `framer-motion` `layout` prop.
*   **Entrances**: Staggered fades for chat messages and lists.

---

## 2. Implementation Roadmap

### Phase 1: Foundation & Tokens (Tailwind + CSS)
*Objective: Create the utility classes and variables needed for the new look.*

1.  **Typography Overhaul** (Fixes Audit P0)
    *   [ ] Update `globals.css`: Set default body weight to `400`.
    *   [ ] Configure `tailwind.config.ts`: Ensure `font-body` maps to Inter and `font-code` to the monospace stack.
2.  **Glass Utility Classes**
    *   [ ] Create `.glass-panel`: `bg-background/60 backdrop-blur-xl border border-white/10 shadow-lg`.
    *   [ ] Create `.glass-button`: `bg-primary/80 hover:bg-primary/90 backdrop-blur-md text-primary-foreground`.
    *   [ ] Create `.glass-input`: `bg-secondary/30 backdrop-blur-sm border-white/10 focus:border-primary/50`.
3.  **Color Palette Refinement** (Fixes Audit P0)
    *   [ ] Adjust `foreground` colors for AA contrast on glass backgrounds.
    *   [ ] Create "Surface Container" colors in Tailwind for different elevation levels (Low, High, Highest).

### Phase 2: Component Architecture (Material 3 Shapes)
*Objective: Update core UI primitives to match the new aesthetic.*

1.  **Buttons (`src/components/ui/button.tsx`)**
    *   [ ] Apply M3 "Pill" shapes or rounded-rects (`rounded-full` vs `rounded-xl`).
    *   [ ] Add `framer-motion` wrapper (`<motion.button>`) for `whileHover={{ scale: 1.02 }}` and `whileTap={{ scale: 0.98 }}`.
2.  **Unified Input (`src/components/ui/unified-input.tsx`)**
    *   [ ] **Refactor**: Remove custom inline styles (Audit P1).
    *   [ ] **Style**: Make it a "floating" glass capsule.
    *   [ ] **Interaction**: Add a glowing ring effect on focus (using `box-shadow` or `framer-motion` layoutId).
3.  **Cards & Containers**
    *   [ ] Update `MessageBubble.tsx` to use the new glass system (User = Primary Glass, AI = Surface Glass).

### Phase 3: Motion & Flow
*Objective: Add fluid transitions.*

1.  **Page Transitions**
    *   [ ] Create a `PageTransition` wrapper using `AnimatePresence`.
    *   [ ] Define standard variants: `fadeSlideUp`, `fadeScale`.
2.  **Chat Stream Animation**
    *   [ ] Update `MessageBubble` to animate in smoothly (`initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`).
    *   [ ] Ensure "Streaming" text doesn't cause jitter.
3.  **Sidebar & Dialogs**
    *   [ ] Replace CSS transitions in `AppSidebar` with `AnimatePresence` for smoother enter/exit.
    *   [ ] Animate `Dialog` overlays with a soft blur-in effect.

### Phase 4: Apple-Style Polish
*Objective: "The Details"*

1.  **Noise Texture**
    *   [ ] Add a subtle SVG noise overlay to the background (`opacity-5`) to reduce banding and add texture (iOS style).
2.  **Dock/Bar Logic**
    *   [ ] Refactor `TopModelBar` to look like a floating macOS menu bar (glass, detached from top).
3.  **Icons**
    *   [ ] Standardize Lucide icon stroke weights (e.g., `stroke-[1.5px]`) to match the clean aesthetic.

---

## 3. Technical Requirements

*   **Libraries**: `framer-motion` (already installed), `clsx`, `tailwind-merge`.
*   **Performance**: Use `will-change-transform` for heavy glass elements to promote GPU layering.
*   **Accessibility**: Ensure `backdrop-filter` doesn't compromise text readability. Fallback to opaque colors for "Reduce Transparency" system settings (`prefers-reduced-transparency`).

## 4. Immediate Next Steps (Task List)

1.  **Execute Phase 1**: Update `globals.css` and `tailwind.config.ts`.
2.  **Prototype**: Create a `GlassDemo` component to visualize the new buttons/inputs.
3.  **Refactor**: Apply changes to `AppLayout` and `ChatInterface`.
