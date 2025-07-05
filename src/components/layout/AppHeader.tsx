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
    <header
      className="py-6 px-4 md:px-8 bg-transparent sticky top-0 z-10 cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      aria-label="Go to main page"
    >
      <div className="flex items-end space-x-4">
        <span
          className={cn(
            "font-code text-5xl sm:text-6xl md:text-7xl text-foreground hover:text-primary transition-colors duration-200 leading-none"
          )}
        >
          {"</hey.hi>"}
        </span>
        <p className="font-code text-base sm:text-lg text-muted-foreground pb-1">
          everyone can say hi to ai.
        </p>
      </div>
    </header>
  );
};

export default AppHeader;
