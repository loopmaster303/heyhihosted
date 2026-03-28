'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Animated dither grain overlay in stamp purple.
 * Regenerates noise every few frames for a subtle living texture.
 */
export function GrainOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const imageData = ctx.createImageData(w, h);
    const d = imageData.data;

    // Stamp purple: #B388FF → rgb(179, 136, 255)
    for (let i = 0; i < d.length; i += 4) {
      const r = Math.random();
      if (r > 0.5) {
        // Purple-tinted noise dot
        d[i] = 179;      // R
        d[i + 1] = 136;  // G
        d[i + 2] = 255;  // B
        d[i + 3] = Math.floor(Math.random() * 60); // varied alpha
      }
      // else: transparent pixel
    }

    ctx.putImageData(imageData, 0, 0);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Small tile for performance
    canvas.width = 128;
    canvas.height = 128;

    let lastTime = 0;
    const interval = 1000 / 8; // ~8 fps for grain flicker

    const animate = (time: number) => {
      if (time - lastTime >= interval) {
        draw();
        lastTime = time;
      }
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: 0.15,
        imageRendering: 'pixelated',
      }}
    />
  );
}
