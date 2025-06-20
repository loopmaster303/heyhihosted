
"use client";
import type React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  onNavigateToTiles?: () => void;
  onAnimationComplete?: () => void; 
}

const INITIAL_MISSPELLED_TEXT = "just.... </say.hi>";
const CORRECT_TEXT = "</hey.hi>";
const INITIAL_TYPING_SPEED = 180;
const BACKSPACE_SPEED = 40;
const FINAL_TYPING_SPEED = 120;
const PAUSE_DURATION = 1500;

type AnimationPhase = "typingInitial" | "pausing" | "backspacing" | "typingFinal" | "complete";

const AppHeader: React.FC<AppHeaderProps> = ({ onNavigateToTiles, onAnimationComplete }) => {
  const router = useRouter();
  const [animatedTitle, setAnimatedTitle] = useState("");
  const [currentPhase, setCurrentPhase] = useState<AnimationPhase>("typingInitial");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    switch (currentPhase) {
      case "typingInitial":
        if (animatedTitle.length < INITIAL_MISSPELLED_TEXT.length) {
          timer = setTimeout(() => {
            setAnimatedTitle(INITIAL_MISSPELLED_TEXT.substring(0, animatedTitle.length + 1));
          }, INITIAL_TYPING_SPEED);
        } else {
          setCurrentPhase("pausing");
        }
        break;

      case "pausing":
        timer = setTimeout(() => {
          setCurrentPhase("backspacing");
        }, PAUSE_DURATION);
        break;

      case "backspacing":
        if (animatedTitle.length > 0) {
          timer = setTimeout(() => {
            setAnimatedTitle(animatedTitle.substring(0, animatedTitle.length - 1));
          }, BACKSPACE_SPEED);
        } else {
          setCurrentPhase("typingFinal");
        }
        break;

      case "typingFinal":
        if (animatedTitle.length < CORRECT_TEXT.length) {
          timer = setTimeout(() => {
            setAnimatedTitle(CORRECT_TEXT.substring(0, animatedTitle.length + 1));
          }, FINAL_TYPING_SPEED);
        } else {
          setCurrentPhase("complete");
        }
        break;

      case "complete":
        setShowCursor(false);
        onAnimationComplete?.();
        break;
    }

    return () => clearTimeout(timer);
  }, [currentPhase, animatedTitle, onAnimationComplete]);

  const handleClick = () => {
    if (onNavigateToTiles) {
      onNavigateToTiles();
    } else {
      router.push('/');
    }
  };

  return (
    <header
      className="flex justify-start items-center py-6 px-4 md:px-8 bg-transparent sticky top-0 z-10 cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      aria-label="Go to main page"
    >
      <span
        className={cn(
          "font-code text-5xl sm:text-6xl md:text-7xl text-foreground hover:text-primary transition-colors duration-200",
          showCursor && "typing-cursor"
        )}
      >
        {animatedTitle || (currentPhase === "backspacing" && animatedTitle.length === 0 ? "" : " ")}
      </span>
    </header>
  );
};

export default AppHeader;
