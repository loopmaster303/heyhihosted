"use client"

import { useEffect, useRef, useState } from "react"

interface Particle {
  x: number
  y: number
  originalX: number
  originalY: number
  vx: number
  vy: number
  life: number
  size: number
}

interface ParticleTextProps {
  text: string
  className?: string
  particleColor?: string
  fontSize?: number
  canvasHeight?: number
  baseSpacing?: number
  particleSize?: number
  mouseRepelRadius?: number
}

export function ParticleText({
  text,
  className,
  particleColor = "255, 105, 180",
  fontSize: propFontSize,
  canvasHeight = 150,
  baseSpacing: propSpacing,
  particleSize = 2,
  mouseRepelRadius = 80
}: ParticleTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const particles = useRef<Particle[]>([])
  const mousePos = useRef({ x: -1000, y: -1000 })
  const animationFrameId = useRef<number>()
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Get container dimensions
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect()
      setDimensions({ width: Math.floor(rect.width), height: canvasHeight })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [canvasHeight])

  // Initialize particles when dimensions are ready
  useEffect(() => {
    if (dimensions.width === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Set canvas size to match container
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // Large bold font for header or small for top-bar
    let fontSize = propFontSize || (dimensions.width < 500 ? 44 : dimensions.width < 800 ? 56 : 72)
    ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`
    ctx.fillStyle = `rgb(${particleColor})`
    ctx.textBaseline = "middle"

    // Measure and scale down if needed (only if text is too wide)
    let textMetrics = ctx.measureText(text)
    while (textMetrics.width > dimensions.width - 20 && fontSize > 10) {
      fontSize -= 1
      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`
      textMetrics = ctx.measureText(text)
    }

    // Draw text
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillText(text, 0, canvas.height / 2)

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data

    // Create particles - Optimized spacing for better performance
    const particleArray: Particle[] = []
    const spacing = propSpacing || (fontSize < 30 ? 2 : 4)

    for (let y = 0; y < canvas.height; y += spacing) {
      for (let x = 0; x < canvas.width; x += spacing) {
        const index = (y * canvas.width + x) * 4
        if (index + 3 < pixels.length && pixels[index + 3] > 128) {
          particleArray.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            originalX: x,
            originalY: y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 0,
            size: particleSize,
          })
        }
      }
    }

    particles.current = particleArray

    // Mouse handlers - Throttled for performance
    let lastMouseUpdate = 0
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now()
      if (now - lastMouseUpdate < 16) return // Throttle to ~60fps
      lastMouseUpdate = now
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const handleMouseLeave = () => {
      mousePos.current = { x: -1000, y: -1000 }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("mousemove", handleMouseMove)
      container.addEventListener("mouseleave", handleMouseLeave)
    }

    let startTime = performance.now()

    // Animation
    const animate = (currentTime: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / 2000, 1)
      const ease = 1 - Math.pow(1 - progress, 4)

      particles.current.forEach((p, i) => {
        const stagger = (i / particles.current.length) * 0.3
        const pProgress = Math.max(0, Math.min(1, (progress - stagger) / (1 - stagger)))
        const pEase = 1 - Math.pow(1 - pProgress, 4)

        p.life = Math.min(1, pEase * 1.5)

        const dx = p.originalX - p.x
        const dy = p.originalY - p.y
        const force = progress < 1 ? 0.03 + pEase * 0.05 : 0.08
        p.vx += dx * force
        p.vy += dy * force

        // Mouse repel - always active but only when close
        const mx = mousePos.current.x - p.x
        const my = mousePos.current.y - p.y
        const distSq = mx * mx + my * my // Use squared distance to avoid sqrt
        const repelRadiusSq = mouseRepelRadius * mouseRepelRadius
        if (distSq < repelRadiusSq) {
          const dist = Math.sqrt(distSq)
          const f = (mouseRepelRadius - dist) / mouseRepelRadius
          p.vx -= (mx / dist) * f * 2
          p.vy -= (my / dist) * f * 2
        }

        // Return to origin if not repelled
        if (progress >= 1) {
          const dx = p.originalX - p.x
          const dy = p.originalY - p.y
          p.vx += dx * 0.05
          p.vy += dy * 0.05
          p.life = 1; // Keep visible
        }

        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.9
        p.vy *= 0.9

        ctx.fillStyle = `rgba(${particleColor}, ${p.life})`
        ctx.fillRect(p.x, p.y, p.size, p.size)
      })

      animationFrameId.current = requestAnimationFrame(animate)
    }

    animationFrameId.current = requestAnimationFrame(animate)

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove)
        container.removeEventListener("mouseleave", handleMouseLeave)
      }
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
    }
  }, [dimensions, text, particleColor, propFontSize, propSpacing, particleSize, mouseRepelRadius])

  return (
    <div ref={containerRef} className={className} style={{ width: "100%", height: `${canvasHeight}px` }}>
      {dimensions.width > 0 && (
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{ width: dimensions.width, height: dimensions.height, willChange: 'transform', pointerEvents: 'none' }}
        />
      )}
    </div>
  )
}
