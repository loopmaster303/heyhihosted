# UX/UI Audit & Usability Roadmap

## Executive Summary
**Project**: HeyHi Hosted
**Date**: December 29, 2025
**Focus**: Usability, Accessibility, Consistency, and Technical UX.

The application presents a modern, specialized interface for AI interaction ("chat-centric" with a "code-aesthetic"). However, significant usability and accessibility hurdles exist due to inconsistent styling, thin typography, and mixed state management patterns. The "Unified" concept is powerful but requires smoother transitions and clearer affordances.

---

## 🚨 Critical Issues (P0) - Accessibility & Core Usability

### 1. Typography & Readability
*   **Issue**: `font-weight: 250` (defined in `globals.css`) is extremely thin. On many screens, this renders text nearly invisible or jagged.
*   **Impact**: Severe readability issues for users with average vision, impossible for low-vision users.
*   **Fix**: Standardize body text to `font-weight: 400`. Reserve thin weights (300) only for large display headings.
*   **Font Loading**: `Inter` and `Code` are loaded, but `tailwind.config.ts` maps `font-body` to `Code`. Ensure the intended font (`Inter` for UI, `Code` for code/branding) is actually applied.

### 2. Contrast Ratios
*   **Issue**: The color palette uses soft pinks (`#E89AB8`) and light grays on light backgrounds.
*   **Impact**: Fails WCAG AA standards for text contrast.
*   **Fix**: Darken `foreground` and `muted-foreground` colors. Ensure interactive elements (buttons) have a contrast ratio of at least 4.5:1 against their background.

### 3. Mobile Responsiveness & Hydration
*   **Issue**: Mobile detection relies on `window.innerWidth` inside `useEffect`.
*   **Impact**: Causes "Flash of Unstyled Content" (FOUC) or layout shifts on load. Server-rendered HTML (desktop) differs from Client HTML (mobile).
*   **Fix**: Use CSS media queries (`hidden md:block`) for layout changes whenever possible. For logic, use a robust `useMediaQuery` hook that handles hydration safe defaults.

---

## ⚠️ Usability Improvements (P1) - Flow & Interaction

### 4. Navigation & Sidebar
*   **Issue**: The Sidebar toggle logic and "New Chat" flow can feel disjointed from the current context.
*   **Fix**:
    *   Ensure the "New Chat" button provides immediate feedback (clearing input, resetting context).
    *   The "Gallery" in the sidebar loads full images. Implement lazy loading or thumbnails to prevent sidebar lag.

### 5. Input Experience (`UnifiedInput`)
*   **Issue**: The chat input is the core interaction point but uses inline styles (`fontSize: 1.125rem`) and complex custom heights.
*   **Fix**: Move styling to Tailwind classes for consistency. Ensure the `Textarea` has a visible label or `aria-label="Message input"`.

### 6. Feedback Mechanisms
*   **Issue**: Error states (e.g., failed image generation) rely on `toast` or console logs.
*   **Fix**: Implement inline error states for the chat bubble. If an image fails, show a "Retry" button directly in the message stream, not just a generic error toast.

---

## 🎨 UI Consistency (P2) - Design System

### 7. Hardcoded Colors vs. Theming
*   **Issue**: Files like `ChatInput.tsx` and `UnifiedInput.tsx` contain hardcoded hex values (e.g., `bg-[#1a1a1a]/90`, `text-[#ff4ecd]`).
*   **Impact**: Breaks the Theme Provider (Light/Dark mode switching) and makes global updates difficult.
*   **Fix**: Replace all hex codes with Tailwind semantic classes (e.g., `bg-card/90`, `text-primary`, `text-accent`).

### 8. Inconsistent Spacing & Sizing
*   **Issue**: Buttons appear in various heights (`h-7`, `h-8`, `h-9`, `h-10`) without a clear hierarchy.
*   **Fix**: Standardize on a strict scale:
    *   `h-8` (sm): Compact/Toolbar actions.
    *   `h-10` (default): Primary inputs/buttons.
    *   `h-12` (lg): Hero/Landing actions.

### 9. Component Redundancy
*   **Issue**: `BlinkingCursor` vs CSS `animate-pulse`.
*   **Fix**: Consolidate animation effects into Tailwind utility classes to reduce component overhead.

---

## ⚡ Technical UX (P3) - Performance

### 10. Image Optimization
*   **Issue**: `ChatImageCard` uses standard `<img>` tags.
*   **Impact**: Slower LCP (Largest Contentful Paint) and higher bandwidth usage.
*   **Fix**: Migrate to `next/image` for automatic optimization, especially for the "Gallery" and landing page assets.

### 11. React Render Cycles
*   **Issue**: `TopModelBar` re-renders `ParticleText` on every prop change.
*   **Fix**: Memoize the `ParticleText` component or its parent to prevent expensive canvas redraws when irrelevant state changes.

---

## ✅ Action Plan (Checklist)

### Phase 1: Accessibility Foundation
- [ ] **Typography**: Change global `font-weight` to 400. Fix font family mapping in `tailwind.config.ts`.
- [ ] **Colors**: Audit and replace hardcoded hex colors with semantic Tailwind variables.
- [ ] **ARIA**: Add `aria-label` to `ChatInput` textarea and all icon-only buttons.

### Phase 2: Core Components Refactor
- [ ] **UnifiedInput**: Remove inline styles, use Tailwind classes.
- [ ] **Buttons**: Standardize button heights across the app.
- [ ] **Mobile**: Refactor `useMobile` logic to be hydration-safe or use CSS media queries.

### Phase 3: Visual Polish & Performance
- [ ] **Images**: Replace `<img>` with `next/image` in `ChatImageCard`.
- [ ] **Motion**: Add `motion-reduce` media query support to animations (Matrix rain, particles).
- [ ] **Error Handling**: Add inline retry mechanisms for failed AI responses.

### Phase 4: Usability Refinements
- [ ] **Sidebar**: Optimize Gallery loading (pagination or thumbnails).
- [ ] **Landing**: Ensure `ParticleText` doesn't cause layout shifts on load.
