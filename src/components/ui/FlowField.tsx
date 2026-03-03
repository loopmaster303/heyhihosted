"use client";

import { useEffect, useRef } from 'react';

interface FlowFieldProps {
  isTyping?: boolean;
  isActive?: boolean;
  className?: string;
}

// Minimal Perlin noise — no external dep
function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a: number, b: number, t: number) { return a + t * (b - a); }
function grad(hash: number, x: number, y: number) {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
}

class Perlin {
  private p: number[];
  constructor(seed = Math.random()) {
    const perm = Array.from({ length: 256 }, (_, i) => i);
    let s = seed * 9301 + 49297;
    for (let i = 255; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    this.p = [...perm, ...perm];
  }
  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const a = this.p[X] + Y;
    const b = this.p[X + 1] + Y;
    return lerp(
      lerp(grad(this.p[a], x, y), grad(this.p[b], x - 1, y), u),
      lerp(grad(this.p[a + 1], x, y - 1), grad(this.p[b + 1], x - 1, y - 1), u),
      v
    );
  }
}

interface Particle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  steps: number;
  maxSteps: number;
  opacity: number;
}

export default function FlowField({ isTyping = false, isActive = true, className = '' }: FlowFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isTypingRef = useRef(isTyping);
  const isActiveRef = useRef(isActive);

  useEffect(() => { isTypingRef.current = isTyping; }, [isTyping]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dpr = window.devicePixelRatio || 1;
    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 350 : 750;
    const SCALE = 0.0022;
    const BASE_SPEED = 1.1;
    const MAX_STEPS = 90;

    const perlin = new Perlin(0.42);
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let rafId: number;
    let lastFrame = 0;
    const FPS_CAP = 30;
    const FRAME_DURATION = 1000 / FPS_CAP;
    let time = 0;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = spawnAll();
    };

    const spawnParticle = (): Particle => {
      const x = Math.random() * width;
      const y = Math.random() * height;
      return {
        x, y,
        prevX: x, prevY: y,
        steps: 0,
        maxSteps: MAX_STEPS * (0.5 + Math.random() * 0.8),
        opacity: 0,
      };
    };

    const spawnAll = (): Particle[] =>
      Array.from({ length: PARTICLE_COUNT }, spawnParticle);

    const tick = (ts: number) => {
      rafId = requestAnimationFrame(tick);
      if (!isActiveRef.current) return;
      if (document.visibilityState === 'hidden') return;

      const delta = ts - lastFrame;
      if (delta < FRAME_DURATION) return;
      lastFrame = ts - (delta % FRAME_DURATION);

      const typingBoost = isTypingRef.current ? 1.6 : 1.0;
      const speed = BASE_SPEED * typingBoost;
      time += 0.0008 * typingBoost;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Fade in / out
        if (p.steps < 8) {
          p.opacity = Math.min(1, p.opacity + 0.12);
        } else if (p.steps > p.maxSteps - 12) {
          p.opacity = Math.max(0, p.opacity - 0.1);
        }

        // Noise angle
        const nx = p.x * SCALE;
        const ny = p.y * SCALE;
        const angle = perlin.noise(nx + time, ny + time) * Math.PI * 2.8;

        p.prevX = p.x;
        p.prevY = p.y;
        p.x += Math.cos(angle) * speed;
        p.y += Math.sin(angle) * speed;
        p.steps++;

        // Alpha: max 0.10 base, up to 0.22 when typing
        const maxAlpha = isTypingRef.current ? 0.22 : 0.10;
        const alpha = p.opacity * maxAlpha;

        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `hsla(267, 78%, 65%, ${alpha})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // Respawn when out of bounds or lifespan done
        const oob = p.x < -2 || p.x > width + 2 || p.y < -2 || p.y > height + 2;
        if (oob || p.steps >= p.maxSteps) {
          particles[i] = spawnParticle();
        }
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.8s ease' }}
    />
  );
}
