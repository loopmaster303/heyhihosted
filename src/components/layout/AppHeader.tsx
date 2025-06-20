
"use client";
import type React from 'react';
import { useRouter } from 'next/navigation'; 
import { useTypingEffect } from '@/hooks/useTypingEffect';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  onNavigateToTiles?: () => void; 
}

const APP_TITLE = "</hey.hi>";
const TITLE_TYPING_SPEED = 120; // ms per character

const AppHeader: React.FC<AppHeaderProps> = ({ onNavigateToTiles }) => {
  const router = useRouter();
  const { text: animatedTitle, isComplete: titleIsComplete } = useTypingEffect(APP_TITLE, TITLE_TYPING_SPEED);

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
          !titleIsComplete && "typing-cursor"
        )}
      >
        {animatedTitle}
      </span>
    </header>
  );
};

export default AppHeader;
