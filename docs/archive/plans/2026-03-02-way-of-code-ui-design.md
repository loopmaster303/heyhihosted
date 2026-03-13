# Design Plan: Way of Code — Algorithmische UI-Ästhetik
**Datum**: 2026-03-02
**Scope**: Landing Screen, Message Bubbles, Mode-Buttons
**Approach**: CSS-first + Framer Motion (Approach A)

---

## Vision

> "Algorithmen die man *sieht*. Mathematik die atmet."

hey.hi wird um eine visuelle Sprache erweitert die aus Creative Coding stammt — Casey Reas, Processing, openFrameworks. Kein Decoration-Layer, sondern die Algorithmen *sind* die UI. Das bestehende CRT/Terminal-System bleibt erhalten und wird durch diese Sprache vertieft.

**Technischer Rahmen:**
- Keine neuen Canvas-Instanzen in UI-Elementen
- CSS Custom Properties + SVG-Noise-Filter + `mix-blend-mode`
- Framer Motion für Orchestrierung und Sequencing
- `prefers-reduced-motion` wird durchgehend respektiert

---

## Sprint 1: Landing Screen — Flow Field

### Was
Ein algorithmischer Background-Layer für die Landing-Page. Kein statisches Gradient — ein lebendiges SVG-Noise-Feld das auf Mausbewegung und Tippen reagiert.

### Implementierung

**Neue Komponente:** `src/components/ui/FlowField.tsx`
- `<canvas>` mit `position: absolute, inset: 0, pointer-events: none`
- Perlin-Noise-basiertes Flow Field: ~800 Partikel, jede folgt einem Noise-Vektorfeld
- Partikel: `stroke: hsl(var(--primary))`, `opacity: 0.06–0.12`, `lineWidth: 0.5`
- Reagiert auf `isTyping` prop → erhöht Noise-Frequenz subtil
- Fade-out wenn Chat-State aktiv wird (Framer Motion `AnimatePresence`)

**Performance-Guardrails:**
- `requestAnimationFrame` mit 30fps-Cap via `performance.now()`
- Partikel-Count halbiert auf Mobile (`window.innerWidth < 768`)
- `visibility: hidden` wenn Tab nicht aktiv (`document.visibilityState`)

**Integration in `LandingView.tsx`:**
```tsx
<div className="relative h-full">
  <FlowField isTyping={chatInputValue.length > 0} isActive={appState === 'landing'} />
  <div className="relative z-10">
    {/* existing content */}
  </div>
</div>
```

---

## Sprint 2: Message Bubbles — Algorithmische Eingangsanimation

### Was
Nachrichten erscheinen nicht mehr mit simplem `opacity + y`. Jede Bubble hat eine geometrische Eingangs-Sequenz und einen lebendigen Ruhezustand.

### Implementierung

**Eingangs-Animation (Framer Motion):**

Statt `{ opacity: 0, y: 20 } → { opacity: 1, y: 0 }`:

```tsx
// User-Bubble: clip-path morph (rechteck → abgerundetes Rechteck)
initial: { clipPath: 'inset(0 100% 0 0)', opacity: 0 }
animate: { clipPath: 'inset(0 0% 0 0)', opacity: 1 }
transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }

// AI-Bubble: von links, mit leichtem scale
initial: { clipPath: 'inset(0 0 0 100%)', opacity: 0, scale: 0.98 }
animate: { clipPath: 'inset(0 0 0 0%)', opacity: 1, scale: 1 }
transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
```

**Ruhezustand — Noise-Border (CSS + SVG-Filter):**

SVG-feTurbulence-Filter als globaler `<defs>` einmalig in `_app`:
```svg
<filter id="noise-border">
  <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="2" />
  <feDisplacementMap in="SourceGraphic" scale="2" />
</filter>
```

AI-Bubble-Wrapper bekommt `filter: url(#noise-border)` — erzeugt ein minimal organisches, leicht unruhiges Erscheinungsbild. Displacement `scale: 2` = sehr subtil, fast unmerklich.

**mix-blend-mode:**
- User-Bubble: `mix-blend-mode: normal` (unverändert)
- AI-Bubble im Dark Mode: `mix-blend-mode: screen` auf einem `::before` Pseudo-Element mit `background: radial-gradient(circle at 30% 50%, hsl(var(--primary)/0.04), transparent)`

**Neue Klassen in `globals.css`:**
```css
.message-bubble-ai {
  position: relative;
}
.message-bubble-ai::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at 30% 50%, hsl(var(--primary)/0.05), transparent 70%);
  mix-blend-mode: screen;
  pointer-events: none;
}
```

---

## Sprint 3: Mode-Buttons — Algorithmische Signaturen

### Was
Die drei Mode-Toggles (Image/Visualize, Compose, Code) bekommen je eine eigene algorithmische visuelle Signatur wenn aktiv. Kein Icon-Tausch — die *Border-Geometrie* verändert sich.

### Signaturen per Modus

#### Image Mode (Visualize) — Rotierende Spirale
```tsx
// SVG overlay: stroke-dasharray animation
<motion.svg className="absolute inset-0">
  <motion.rect
    x="1" y="1" width="calc(100%-2)" height="calc(100%-2)"
    rx="8" ry="8"
    stroke="hsl(var(--mode-visualize))"
    strokeWidth="1"
    fill="none"
    strokeDasharray="4 8"
    animate={{ strokeDashoffset: [0, -120] }}
    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
  />
</motion.svg>
```

#### Compose Mode — Sine-Wave Border
```tsx
// SVG path der eine Sine-Welle als Border-Overlay zeichnet
// d="M0,H/2 Q W/4,H/2+A W/2,H/2 Q 3W/4,H/2-A W,H/2"
// animate: A (amplitude) pulst 0 → 3 → 0 rhythmisch
```

#### Code Mode — Grid Pulse
```tsx
// 3x3 dot-grid SVG overlay
// Dots pulsen in einer Conway-Game-of-Life-artigen Sequenz
// opacity: 0.2 → 0.8, timing: staggered
```

### Technische Umsetzung

**Neue Komponente:** `src/components/ui/ModeButtonOverlay.tsx`
- Props: `mode: 'visualize' | 'compose' | 'code'`, `isActive: boolean`
- Rendert das mode-spezifische SVG-Overlay
- `AnimatePresence` für smooth Ein/Ausblenden beim Mode-Wechsel
- `position: absolute, inset: 0, pointer-events: none`

Integration in `ChatInput.tsx` (oder wo die Mode-Buttons leben):
```tsx
<button className="relative ...">
  <ModeButtonOverlay mode="visualize" isActive={isImageMode} />
  {/* existing button content */}
</button>
```

---

## Datei-Übersicht

| Datei | Aktion | Sprint |
|-------|--------|--------|
| `src/components/ui/FlowField.tsx` | NEU | 1 |
| `src/components/page/LandingView.tsx` | EDIT — FlowField integrieren | 1 |
| `src/components/chat/ChatMessage.tsx` o.ä. | EDIT — neue Animations | 2 |
| `src/app/globals.css` | EDIT — noise-border, bubble-before | 2 |
| `src/components/ui/ModeButtonOverlay.tsx` | NEU | 3 |
| `src/components/chat/ChatInput.tsx` | EDIT — ModeButtonOverlay integrieren | 3 |

---

## Constraints + Guardrails

- `prefers-reduced-motion`: alle Animationen deaktivieren, Noise-Filter entfernen
- Dark Mode: Effekte sichtbar (mix-blend-mode: screen funktioniert auf schwarzem BG)
- Light Mode: Effekte stark reduzieren (screen blend auf hellem BG ist zu stark → `opacity: 0.03`)
- Mobile: FlowField-Partikel auf 400 reduzieren, ModeButtonOverlay bleibt unverändert
- Performance Budget: max. +3ms/frame durch alle neuen Effekte kombiniert

---

## Nicht in diesem Sprint

- Chat-Hintergrund generativ machen (separate Initiative)
- Input-Feld Noise-Border (separater Sprint nach Feedback)
- WebGL / Three.js (bewusst ausgeschlossen)
- Globaler Shader-Layer (Approach C — zu heavy)
