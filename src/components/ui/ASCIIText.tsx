"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ASCIITextProps {
  text: string;
  enableWaves?: boolean;
  enableMouse?: boolean;
  enableGlitch?: boolean;
  glitchDurationMs?: number;
  glitchIntervalMs?: number; // Repeat glitch every X ms (0 = no repeat)
  glitchIntensity?: number; // 0-1, how strong the glitch effect is
  asciiFontSize?: number;
  densityScale?: number;
  alphaThreshold?: number;
  maxChars?: number;
  className?: string;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

const DEFAULT_FONT = '"JetBrains Mono", "Courier New", monospace';

function truncateText(value: string, maxChars: number) {
  if (value.length <= maxChars) return value;
  const sub = value.substring(0, Math.max(0, maxChars - 3));
  const lastSpace = sub.lastIndexOf(" ");
  const cut = lastSpace > 6 ? sub.substring(0, lastSpace) : sub;
  return `${cut}...`;
}

export default function ASCIIText({
  text,
  enableWaves = false,
  enableMouse = false,
  enableGlitch = false,
  glitchDurationMs = 800,
  glitchIntervalMs = 0, // 0 = no repeat, e.g. 120000 = every 2 min
  glitchIntensity = 1, // 1 = normal, 1.5 = stronger
  asciiFontSize = 8,
  densityScale = 1,
  alphaThreshold = 0.008,
  maxChars = 32,
  className,
  color,
  strokeColor,
  strokeWidth,
}: ASCIITextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const glitchUntilRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const [size, setSize] = useState({ width: 0, height: 0 });

  const displayText = useMemo(() => truncateText(text, maxChars), [text, maxChars]);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const target = containerRef.current;
    if (!target || !enableMouse) return;

    const handleMove = (e: MouseEvent | PointerEvent) => {
      const event = e as PointerEvent;
      const rect = target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const inside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
      mouseRef.current = {
        x: inside ? x : 0,
        y: inside ? y : 0,
        active: inside,
      };
    };

    const handleBlur = () => {
      mouseRef.current.active = false;
    };

    target.addEventListener("pointermove", handleMove);
    target.addEventListener("pointerleave", handleBlur);
    target.addEventListener("blur", handleBlur);
    return () => {
      target.removeEventListener("pointermove", handleMove);
      target.removeEventListener("pointerleave", handleBlur);
      target.removeEventListener("blur", handleBlur);
    };
  }, [enableMouse]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const useWaves = enableWaves && !prefersReduced;
    const useMouse = enableMouse && !prefersReduced;
    const useGlitch = enableGlitch && !prefersReduced;
    // Initial glitch on mount
    if (useGlitch) {
      glitchUntilRef.current = performance.now() + glitchDurationMs;
    }

    // Repeating glitch interval
    let glitchInterval: NodeJS.Timeout | null = null;
    if (useGlitch && glitchIntervalMs > 0) {
      glitchInterval = setInterval(() => {
        glitchUntilRef.current = performance.now() + glitchDurationMs;
      }, glitchIntervalMs);
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(size.width * dpr);
    canvas.height = Math.floor(size.height * dpr);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const fontFamily = DEFAULT_FONT;
    const textColor = color || "rgba(179, 136, 255, 0.95)";

    const baseMaskSize = Math.max(24, asciiFontSize * 4);
    const textCanvas = document.createElement("canvas");
    const textCtx = textCanvas.getContext("2d");
    if (!textCtx) return;

    textCanvas.width = canvas.width;
    textCanvas.height = canvas.height;
    textCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    textCtx.fillStyle = textColor;
    textCtx.font = `bold ${baseMaskSize}px ${fontFamily}`;
    const metrics = textCtx.measureText(displayText);
    const widthScale = metrics.width ? (size.width * 0.95) / metrics.width : 1;
    const heightScale = (size.height * 0.9) / baseMaskSize;
    const maskFontSize = Math.max(24, Math.floor(baseMaskSize * Math.min(widthScale, heightScale)));

    textCtx.clearRect(0, 0, size.width, size.height);
    textCtx.font = `bold ${maskFontSize}px ${fontFamily}`;
    textCtx.textAlign = "center";
    textCtx.textBaseline = "middle";
    textCtx.fillText(displayText, size.width / 2, size.height / 2);

    const imageData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height);

    const glyphSize = Math.max(8, Math.round(asciiFontSize));
    const cellSize = Math.max(2, Math.round(glyphSize * 0.35 * densityScale));

    const cols = Math.max(1, Math.floor(size.width / cellSize));
    const rows = Math.max(1, Math.floor(size.height / cellSize));

    const chars = " .:-=+*#%@";
    const stroke = strokeColor ?? "transparent";
    const strokeSize = strokeWidth ?? 0;
    const shouldStroke = strokeSize > 0 && stroke !== "transparent";

    let time = 0;
    const render = () => {
      time += 0.02;
      const now = performance.now();
      const glitchActive = useGlitch && now < glitchUntilRef.current;
      const glitchJitter = glitchActive ? cellSize * 1.2 * glitchIntensity : 0; // Stronger jitter

      ctx.clearRect(0, 0, size.width, size.height);
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.fillRect(0, 0, size.width, size.height);

      const wave = (x: number, y: number) => {
        if (!useWaves) return 0;
        return (
          Math.sin(time + x * 0.07) * 0.6 +
          Math.cos(time * 0.7 + y * 0.1) * 0.4
        );
      };

      ctx.fillStyle = textColor;
      ctx.font = `bold ${glyphSize}px ${fontFamily}`;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeSize;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const sampleX = Math.floor((x / cols) * textCanvas.width + (glitchActive ? (Math.random() - 0.5) * glitchJitter : 0));
          const sampleY = Math.floor((y / rows) * textCanvas.height + (glitchActive ? (Math.random() - 0.5) * glitchJitter : 0));
          const idx = (sampleY * textCanvas.width + sampleX) * 4;
          const alpha = imageData.data[idx + 3] / 255;

          if (alpha > alphaThreshold) {
            const brightness = alpha;
            const charIndex = Math.min(chars.length - 1, Math.round(brightness * (chars.length - 1)));
            // Slower glitch: 8% char swap (was 15%), but more intense displacement
            const glitchChance = 0.08 * glitchIntensity;
            const char = glitchActive && Math.random() < glitchChance
              ? chars[Math.floor(Math.random() * chars.length)]
              : chars[charIndex];

            const mouse = mouseRef.current;
            let mouseOffset = 0;
            if (useMouse && mouse.active) {
              const dx = x * cellSize - mouse.x;
              const dy = y * cellSize - mouse.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const radius = Math.max(80, cellSize * 10);
              if (dist < radius) {
                const strength = (1 - dist / radius);
                mouseOffset = Math.sin(time * 3 + dist * 0.08) * strength * cellSize * 1.1;
              }
            }

            const offset = (wave(x, y) * cellSize) + mouseOffset;
            const drawX = x * cellSize;
            const drawY = y * cellSize + offset;

            if (shouldStroke) {
              ctx.strokeText(char, drawX, drawY);
            }
            ctx.fillText(char, drawX, drawY);
          }
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (glitchInterval) clearInterval(glitchInterval);
    };
  }, [displayText, enableWaves, enableMouse, enableGlitch, glitchDurationMs, glitchIntervalMs, glitchIntensity, asciiFontSize, densityScale, alphaThreshold, color, strokeColor, strokeWidth, size.width, size.height]);

  return (
    <div ref={containerRef} className={cn("relative w-full h-full", className)}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
