"use client"

import React, { useRef, useEffect, useState } from 'react'

interface Particle {
  x: number
  y: number
  baseX: number
  baseY: number
  size: number
  color: string
  life: number
  glitterPhase: number
}

interface ParticleTextProps {
  text: string
  className?: string
  particleColor?: string // Expect "R, G, B" string
  canvasHeight?: number
}

export function ParticleText({
  text,
  className,
  particleColor = "255, 105, 180", // Pink default
  canvasHeight = 150,
}: ParticleTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mousePositionRef = useRef({ x: -1000, y: -1000 })
  const isTouchingRef = useRef(false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  
  // Parse base color for glitter effect
  // Expecting "R, G, B" string, fallback to pink if parse fails
  const getRGB = (colorStr: string) => {
    const parts = colorStr.split(',').map(s => parseInt(s.trim()))
    if (parts.length === 3 && parts.every(n => !isNaN(n))) {
      return { r: parts[0], g: parts[1], b: parts[2] }
    }
    return { r: 255, g: 105, b: 180 }
  }

  const baseRGB = getRGB(particleColor)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect()
      // On mobile, text needs to be smaller, so height might vary, but we'll stick to fixed height prop or responsive logic
      setDimensions({ width: rect.width, height: canvasHeight })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [canvasHeight])

  useEffect(() => {
    if (dimensions.width === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    canvas.width = dimensions.width
    canvas.height = dimensions.height

    const isMobile = dimensions.width < 768
    
    // Config
    const mouseRepelRadius = isMobile ? 150 : 300 // Significantly increased repulsion radius
    const particleBaseSize = isMobile ? 1.2 : 1.6

    let particles: Particle[] = []
    let textImageData: ImageData | null = null

    // 1. Create Text Image (Rasterize)
    function createTextImage() {
      if (!ctx || !canvas) return 0

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Font settings
      // We want the text to fill a good portion of the canvas height/width
      // Mobile: smaller font to fit width
      const maxFontSize = dimensions.height * 0.6
      let fontSize = maxFontSize
      
      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Check width fit
      let textMetrics = ctx.measureText(text)
      const maxWidth = dimensions.width * 0.9
      
      while (textMetrics.width > maxWidth && fontSize > 10) {
        fontSize -= 2
        ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`
        textMetrics = ctx.measureText(text)
      }

      ctx.fillStyle = 'white'
      ctx.fillText(text, canvas.width / 2, canvas.height / 2)

      textImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      // Clear again to draw particles only
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      return 1 // scale factor (unused for now as we dynamic size above)
    }

    // 2. Create Single Particle (Random Sampling)
    function createParticle() {
      if (!textImageData) return null

      // Try random positions until we hit a pixel
      // Limit attempts to avoid infinite loop on empty text
      for (let attempt = 0; attempt < 50; attempt++) {
        const x = Math.floor(Math.random() * canvas!.width)
        const y = Math.floor(Math.random() * canvas!.height)
        
        const index = (y * canvas!.width + x) * 4
        // Check alpha channel
        if (textImageData.data[index + 3] > 128) {
           return {
            x: x,
            y: y,
            baseX: x,
            baseY: y,
            size: Math.random() * particleBaseSize + 0.5,
            color: `rgb(${baseRGB.r}, ${baseRGB.g}, ${baseRGB.b})`, // Initial color
            life: Math.random() * 100 + 50,
            glitterPhase: Math.random() * Math.PI * 2
          }
        }
      }
      return null
    }

    // 3. Initialize Particles
    function initParticles() {
      particles = []
      // Density calculation
      // V0 uses: 8000 * sqrt(area / referenceArea)
      // We can adapt simpler: Area * densityFactor
      const area = dimensions.width * dimensions.height
      const density = isMobile ? 0.15 : 0.25 // Particles per pixel (rough heuristic)
      // Actually typical canvas text areas are small relative to full screen.
      // Let's use a fixed count scaled by text length/size estimation or just try target count.
      // V0 logic is good:
      const baseCount = isMobile ? 3000 : 6000 
      // Adjusted base count for text (usually less filled area than a big logo)
      
      for (let i = 0; i < baseCount; i++) {
        const p = createParticle()
        if (p) particles.push(p)
      }
    }

    let animationFrameId: number

    // 4. Animation Loop
    function animate() {
      if (!ctx || !canvas) return
      
      // Clear with slight trail or transparent? V0 clears fully.
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const { x: mouseX, y: mouseY } = mousePositionRef.current
      
      // Particle Rendering
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        
        // Physics: Mouse Interaction
        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Only animate glitter when mouse is nearby
        const isNearMouse = distance < mouseRepelRadius * 1.5
        if (isNearMouse) {
          p.glitterPhase += 0.25 // Aggressive glitter speed
        } else {
          p.glitterPhase += 0.01 // Faster idle shimmer
        }

        // Determine target position
        let targetX = p.baseX
        let targetY = p.baseY

        const isInteracting = distance < mouseRepelRadius && (isTouchingRef.current || !(!('ontouchstart' in window) && mousePositionRef.current.x === 0 && mousePositionRef.current.y === 0));

        if (distance < mouseRepelRadius) {
            const force = (mouseRepelRadius - distance) / mouseRepelRadius
            const angle = Math.atan2(dy, dx)
            const move = force * 150 // Very strong explosive force
            targetX = p.baseX - Math.cos(angle) * move
            targetY = p.baseY - Math.sin(angle) * move
        }

        // Snappy physics: Linear interpolation
        p.x += (targetX - p.x) * 0.1
        p.y += (targetY - p.y) * 0.1

        // Color / Glitter - less white, more base color
        const glitter = (Math.sin(p.glitterPhase) + 1) / 2
        
        // Keep base color strong, only subtle white shimmer on hover
        const whiteAmount = isNearMouse ? glitter * 0.25 : glitter * 0.1
        
        const r = Math.floor(baseRGB.r + (255 - baseRGB.r) * whiteAmount)
        const g = Math.floor(baseRGB.g + (255 - baseRGB.g) * whiteAmount)
        const b = Math.floor(baseRGB.b + (255 - baseRGB.b) * whiteAmount)
        
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(p.x, p.y, p.size, p.size)

        // Lifecycle / Respawn
        p.life--
        if (p.life <= 0) {
          // Instead of splicing, just reset this particle to a new random spot
          const newP = createParticle()
          if (newP) {
             particles[i] = newP
          } else {
             // If resize changed text shape heavily, we might fail to find spot, just keep old base or reset life
             p.life = 100
          }
        }
      }

      // Replenish if low (e.g. resize made more room?)
      // Not strictly needed if we just respawn in place.

      animationFrameId = requestAnimationFrame(animate)
    }

    createTextImage()
    initParticles()
    animate()

    // Event Handlers
    const handleMouseMove = (e: MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if(rect) {
            mousePositionRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        // e.preventDefault() // Don't block scroll?
        const rect = containerRef.current?.getBoundingClientRect();
        if(rect) {
            mousePositionRef.current = { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
        }
      }
    }
    
    const handleTouchStart = () => { isTouchingRef.current = true }
    const handleTouchEnd = () => { isTouchingRef.current = false; mousePositionRef.current = { x: -1000, y: -1000 } }
    const handleMouseLeave = () => { mousePositionRef.current = { x: -1000, y: -1000 } }

    const containerEl = containerRef.current
    if (containerEl) {
        containerEl.addEventListener('mousemove', handleMouseMove)
        containerEl.addEventListener('mouseleave', handleMouseLeave)
        containerEl.addEventListener('touchmove', handleTouchMove, { passive: true })
        containerEl.addEventListener('touchstart', handleTouchStart, { passive: true })
        containerEl.addEventListener('touchend', handleTouchEnd, { passive: true })
    }

    return () => {
        if (containerEl) {
            containerEl.removeEventListener('mousemove', handleMouseMove)
            containerEl.removeEventListener('mouseleave', handleMouseLeave)
            containerEl.removeEventListener('touchmove', handleTouchMove)
            containerEl.removeEventListener('touchstart', handleTouchStart)
            containerEl.removeEventListener('touchend', handleTouchEnd)
        }
        cancelAnimationFrame(animationFrameId)
    }
  }, [dimensions, text, baseRGB])

  return (
    <div ref={containerRef} className={className} style={{ width: '100%', height: `${canvasHeight}px`, overflow: 'hidden' }}>
        {dimensions.width > 0 && (
            <canvas ref={canvasRef} style={{ display: 'block' }} />
        )}
    </div>
  )
}
