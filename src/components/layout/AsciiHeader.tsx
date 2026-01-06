"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface AsciiHeaderProps {
  text?: string
  className?: string
}

const ASCII_DICT: Record<string, string[]> = {
  A: ["  ████  ", " ██  ██ ", "████████", "██    ██", "██    ██", "██    ██"],
  B: ["███████ ", "██    ██", "███████ ", "██    ██", "██    ██", "███████ "],
  C: [" ███████", "██      ", "██      ", "██      ", "██      ", " ███████"],
  D: ["███████ ", "██    ██", "██    ██", "██    ██", "██    ██", "███████ "],
  E: ["████████", "██      ", "██████  ", "██      ", "██      ", "████████"],
  F: ["████████", "██      ", "██████  ", "██      ", "██      ", "██      "],
  G: [" ███████", "██      ", "██  ████", "██    ██", "██    ██", " ███████"],
  H: ["██    ██", "██    ██", "████████", "██    ██", "██    ██", "██    ██"],
  I: ["████████", "   ██   ", "   ██   ", "   ██   ", "   ██   ", "████████"],
  J: ["████████", "      ██", "      ██", "      ██", "██    ██", " ███████"],
  K: ["██    ██", "██  ██  ", "████    ", "██  ██  ", "██    ██", "██    ██"],
  L: ["██      ", "██      ", "██      ", "██      ", "██      ", "████████"],
  M: ["██    ██", "████████", "██ ██ ██", "██    ██", "██    ██", "██    ██"],
  N: ["██    ██", "███   ██", "██ ██ ██", "██   ███", "██    ██", "██    ██"],
  O: [" ███████", "██    ██", "██    ██", "██    ██", "██    ██", " ███████"],
  P: ["███████ ", "██    ██", "███████ ", "██      ", "██      ", "██      "],
  Q: [" ███████", "██    ██", "██    ██", "██ ██ ██", "██   ███", " ████████"],
  R: ["███████ ", "██    ██", "███████ ", "██   ██ ", "██    ██", "██    ██"],
  S: [" ███████", "██      ", " ██████ ", "      ██", "      ██", "███████ "],
  T: ["████████", "   ██   ", "   ██   ", "   ██   ", "   ██   ", "   ██   "],
  U: ["██    ██", "██    ██", "██    ██", "██    ██", "██    ██", " ███████"],
  V: ["██    ██", "██    ██", "██    ██", " ██  ██ ", "  ████  ", "   ██   "],
  W: ["██    ██", "██    ██", "██    ██", "██ ██ ██", "████████", "██    ██"],
  X: ["██    ██", " ██  ██ ", "  ████  ", "  ████  ", " ██  ██ ", "██    ██"],
  Y: ["██    ██", " ██  ██ ", "  ████  ", "   ██   ", "   ██   ", "   ██   "],
  Z: ["████████", "      ██", "    ██  ", "  ██    ", "██      ", "████████"],
  '0': ["  ████  ", " ██  ██ ", "██ ██ ██", "██    ██", " ██  ██ ", "  ████  "],
  '1': ["   ██   ", "  ███   ", "   ██   ", "   ██   ", "   ██   ", " ██████ "],
  '2': [" ██████ ", "██    ██", "    ██  ", "   ██   ", "  ██    ", "████████"],
  '3': [" ██████ ", "██    ██", "    ██  ", "    ██  ", "██    ██", " ██████ "],
  '4': ["██    ██", "██    ██", "████████", "      ██", "      ██", "      ██"],
  '5': ["████████", "██      ", "███████ ", "      ██", "██    ██", " ██████ "],
  '6': [" ██████ ", "██      ", "███████ ", "██    ██", "██    ██", " ██████ "],
  '7': ["████████", "     ██ ", "    ██  ", "   ██   ", "  ██    ", " ██     "],
  '8': [" ██████ ", "██    ██", " ██████ ", "██    ██", "██    ██", " ██████ "],
  '9': [" ██████ ", "██    ██", " ███████", "      ██", "     ██ ", "   ██   "],
  '.': ["        ", "        ", "        ", "        ", "        ", "   ██   "],
  ',': ["        ", "        ", "        ", "        ", "   ██   ", "  ██    "],
  '-': ["        ", "        ", " ██████ ", "        ", "        ", "        "],
  '_': ["        ", "        ", "        ", "        ", "        ", " ██████ "],
  '!': ["   ██   ", "   ██   ", "   ██   ", "   ██   ", "        ", "   ██   "],
  '?': [" ██████ ", "██    ██", "    ██  ", "   ██   ", "        ", "   ██   "],
  " ": ["   ", "   ", "   ", "   ", "   ", "   "]
}

const FALLBACK_CHAR = ["██████", "██  ██", "██████", "██  ██", "██  ██", "██  ██"];

export default function AsciiHeader({ text = "HEY.HI", className }: AsciiHeaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const animationRef = useRef<number | null>(null)
  const [displayText, setDisplayText] = useState(text)

  useEffect(() => {
    // Smart truncation: limit to 25, but try to cut at space
    if (text.length > 25) {
        const sub = text.substring(0, 22);
        const lastSpace = sub.lastIndexOf(" ");
        setDisplayText((lastSpace > 10 ? sub.substring(0, lastSpace) : sub) + "...");
    } else {
        setDisplayText(text);
    }
  }, [text])

  useEffect(() => {
    if (!preRef.current || !containerRef.current) return

    const generateBitmap = (input: string) => {
      const chars = input.toUpperCase().split("")
      const lines: string[] = ["", "", "", "", "", ""]
      
      chars.forEach(char => {
        const matrix = ASCII_DICT[char] || FALLBACK_CHAR
        for (let i = 0; i < 6; i++) {
          lines[i] += matrix[i] + "  " // 2 spaces for clarity
        }
      })
      return lines
    }

    const targetLines = generateBitmap(displayText)
    const totalWidth = targetLines[0].length
    
    let progress = 0 
    let time = 0
    const glitchChance = 0.008 // Even rarer glitches

    const render = () => {
      time += 0.015 // Slower, smoother movement
      
      if (progress < totalWidth) {
        progress += 2.0 // Faster typing for better UX
      }

      const frameLines = targetLines.map((line, rowIndex) => {
        const visiblePart = line.substring(0, Math.floor(progress))
        const isCursorVisible = Math.floor(time * 6) % 2 === 0
        const cursor = (progress < totalWidth && isCursorVisible) ? "█" : ""
        
        // Stabilized drift: lower amplitude (2)
        const floatShift = Math.floor(Math.sin(time + rowIndex * 0.6) * 2)
        const padding = " ".repeat(Math.max(0, 4 + floatShift))

        // Subtle random jitter
        let glitchOffset = ""
        if (Math.random() < glitchChance) {
           glitchOffset = " ".repeat(Math.floor(Math.random() * 2))
        }

        return glitchOffset + padding + visiblePart + cursor
      })

      if (preRef.current) {
        preRef.current.textContent = frameLines.join("\n")
      }

      animationRef.current = requestAnimationFrame(render)
    }

    animationRef.current = requestAnimationFrame(render)

    const handleResize = () => {
      if (!containerRef.current || !preRef.current) return
      const containerWidth = containerRef.current.clientWidth
      // Better font size scaling
      const calculatedSize = Math.max(4, Math.min(8, containerWidth / (totalWidth * 0.6)))
      preRef.current.style.fontSize = `${calculatedSize}px`
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      window.removeEventListener("resize", handleResize)
    }
  }, [displayText])

  return (
    <div
      ref={containerRef}
      className={cn("w-full h-full bg-transparent relative flex items-center justify-center overflow-hidden pointer-events-none select-none py-2", className)}
    >
      <pre 
        ref={preRef}
        className="font-mono leading-[1.1] text-primary text-center whitespace-pre text-glow transition-colors duration-300"
        style={{ 
          fontFamily: '"JetBrains Mono", "Courier New", monospace',
          filter: 'drop-shadow(0 0 4px hsla(var(--primary) / 0.2))'
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-5 animate-scanline pointer-events-none" />
    </div>
  )
}
