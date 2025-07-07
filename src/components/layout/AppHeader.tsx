"use client";
import type React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  onNavigateToTiles?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onNavigateToTiles }) => {
  const router = useRouter();

  const handleClick = () => {
    if (onNavigateToTiles) {
      onNavigateToTiles();
    } else {
      router.push('/');
    }
  };

  return (
    <div
      className="cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      aria-label="Go to main page"
    >
      <div className="flex flex-col items-center gap-2">
        <span
          className={cn(
            "font-code text-5xl sm:text-7xl text-foreground hover:text-primary transition-colors duration-200 leading-none"
          )}
        >
          {"</hey.hi>"}
        </span>
        <p className="font-code text-sm sm:text-lg text-muted-foreground">
          everyone can say hi to ai.
        </p>
      </div>
    </div>
  );
};

export default AppHeader;
