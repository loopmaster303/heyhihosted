"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
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
        <div className="relative flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-8 h-8"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="flex items-baseline gap-2">
              <h1 className="text-xl font-code text-foreground select-none">&lt;/hey.hi&gt;</h1>
              {userDisplayName && userDisplayName !== "User" && (
                  <span className="text-xl font-code text-foreground/80 select-none">
                      {userDisplayName}
                  </span>
              )}
          </div>
        </div>
      </header>
      
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-background z-40 flex items-center justify-center animate-in fade-in-0 duration-300"
        >
          <nav className="flex flex-col space-y-4 font-code text-3xl w-auto text-left">
            <button onClick={() => handleNavigation('home')} className="text-left text-foreground/80 hover:text-foreground transition-colors w-full">
              {`└home/page`}
            </button>
            {toolTileItems.map((item) => (
              <button key={item.id} onClick={() => handleNavigation(item.id)} className="text-left text-foreground/80 hover:text-foreground transition-colors w-full">
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
