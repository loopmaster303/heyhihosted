"use client";

import { cn } from "@/lib/utils";
import ScrambledText from "@/components/ScrambledText";

interface AsciiHeaderProps {
  text?: string;
  className?: string;
}

export default function AsciiHeader({ text = "HEY.HI", className }: AsciiHeaderProps) {
  return (
    <div
      className={cn(
        "w-full h-full bg-transparent relative flex items-center justify-center overflow-hidden select-none py-2",
        className
      )}
    >
      <ScrambledText
        key={text}
        radius={180}
        duration={1.4}
        speed={0.7}
        scrambleChars=".:*#@"
        className="w-full text-center text-[clamp(20px,3vw,40px)] font-bold tracking-tight text-primary/80 pointer-events-auto"
      >
        {text}
      </ScrambledText>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-5 animate-scanline pointer-events-none" />
    </div>
  );
}
