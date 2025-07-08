"use client";

import React, { useState } from 'react';
import type { TileItem, ToolType } from '@/types';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  toolTileItems: TileItem[];
  onNavigate: (toolType: ToolType | 'home') => void;
  userDisplayName?: string;
  className?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ toolTileItems, onNavigate, userDisplayName, className }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigation = (toolType: ToolType | 'home') => {
    onNavigate(toolType);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className={cn("fixed top-0 left-0 right-0 z-50 flex justify-center items-center p-4", className)}>
        <div className="relative flex items-center">
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-baseline gap-2 text-left hover:opacity-80 transition-opacity"
                aria-label="Toggle navigation menu"
            >
                <h1 className="text-4xl font-code text-foreground select-none">&lt;/hey.hi&gt;</h1>
            </button>
        </div>
      </header>
      
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-background z-40 flex items-start justify-center pt-24 animate-in fade-in-0 duration-300"
        >
          <nav className="flex flex-col space-y-2 md:space-y-4 font-code w-auto text-left">
            <button onClick={() => handleNavigation('home')} className="text-left text-foreground/80 hover:text-foreground transition-colors w-full text-lg md:text-3xl">
              {`└home/page`}
            </button>
            {toolTileItems.map((item) => (
              <button key={item.id} onClick={() => handleNavigation(item.id)} className="text-left text-foreground/80 hover:text-foreground transition-colors w-full text-lg md:text-3xl">
                {`└${item.title}`}
              </button>
            ))}
          </nav>
        </div>
      )}
    </>
  );
};

export default AppHeader;
