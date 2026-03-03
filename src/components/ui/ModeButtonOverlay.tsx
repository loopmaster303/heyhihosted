"use client";

import { motion, AnimatePresence } from 'framer-motion';

type OverlayMode = 'visualize' | 'compose' | 'code';

interface ModeButtonOverlayProps {
  mode: OverlayMode;
  isActive: boolean;
}

// Visualize: animated dashed-rect border that marches around the button
function VisualizeOverlay() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
      style={{ borderRadius: 'inherit', overflow: 'visible' }}
    >
      <motion.rect
        x="1" y="1"
        width="calc(100% - 2px)" height="calc(100% - 2px)"
        rx="999" ry="999"
        stroke="hsl(var(--mode-visualize))"
        strokeWidth="1.2"
        fill="none"
        strokeDasharray="4 7"
        animate={{ strokeDashoffset: [0, -132] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
    </svg>
  );
}

// Compose: sine-wave path that pulses its amplitude
function ComposeOverlay() {
  // Fixed path: flat line across the button at mid-height
  // We animate the d attribute indirectly via scaleY on a group
  return (
    <svg
      className="absolute inset-0 w-full h-full overflow-visible"
      aria-hidden="true"
      style={{ borderRadius: 'inherit' }}
    >
      {/* Top wave */}
      <motion.path
        d="M0,50% Q25%,calc(50% - 4px) 50%,50% Q75%,calc(50% + 4px) 100%,50%"
        stroke="hsl(var(--mode-compose))"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        animate={{ pathLength: [0, 1, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  );
}

// Code: 3×3 dot grid that pulses in a staggered pattern
const CODE_DOTS = [
  { cx: '25%', cy: '25%', delay: 0 },
  { cx: '50%', cy: '25%', delay: 0.15 },
  { cx: '75%', cy: '25%', delay: 0.3 },
  { cx: '25%', cy: '50%', delay: 0.45 },
  { cx: '50%', cy: '50%', delay: 0.6 },
  { cx: '75%', cy: '50%', delay: 0.3 },
  { cx: '25%', cy: '75%', delay: 0.15 },
  { cx: '50%', cy: '75%', delay: 0.45 },
  { cx: '75%', cy: '75%', delay: 0 },
];

function CodeOverlay() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
      style={{ borderRadius: 'inherit' }}
    >
      {CODE_DOTS.map((dot, i) => (
        <motion.circle
          key={i}
          cx={dot.cx}
          cy={dot.cy}
          r="1.5"
          fill="hsl(var(--mode-code))"
          animate={{ opacity: [0.2, 0.85, 0.2] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: dot.delay }}
        />
      ))}
    </svg>
  );
}

export function ModeButtonOverlay({ mode, isActive }: ModeButtonOverlayProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key={mode}
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ borderRadius: 'inherit' }}
        >
          {mode === 'visualize' && <VisualizeOverlay />}
          {mode === 'compose' && <ComposeOverlay />}
          {mode === 'code' && <CodeOverlay />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
