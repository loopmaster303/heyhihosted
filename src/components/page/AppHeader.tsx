
"use client";

import React, { useState } from 'react';
import type { TileItem, ToolType } from '@/types';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '../ThemeToggle';
import { X } from 'lucide-react';

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
  
  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  
  const showUserName = userDisplayName && userDisplayName.trim() !== '' && userDisplayName !== 'User';

  return (
    <>
      <header className={cn("fixed top-0 left-0 right-0 z-50 flex items-center p-4 justify-between", className)}>
        <div className="flex-1"></div>
        <div className="flex-1 flex justify-center">
            <button
                onClick={toggleMenu}
                className="flex items-baseline gap-4 text-left hover:opacity-80 transition-opacity"
                aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? (
                 <X className="h-10 w-10 text-foreground" />
              ) : (
                <div className="flex items-baseline gap-4">
                    <h1 className="text-5xl font-code text-foreground select-none">&lt;/hey.hi&gt;</h1>
                    {showUserName && (
                        <span className="text-5xl font-code text-foreground select-none">{userDisplayName}</span>
                    )}
                </div>
              )}
            </button>
        </div>
        <div className="flex-1 flex justify-end">
          <ThemeToggle />
        </div>
      </header>
      
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/95 backdrop-blur-sm z-40 flex items-start justify-center pt-32 animate-in fade-in-0 duration-300"
        >
          <nav className="flex flex-col space-y-1 md:space-y-4 font-code w-auto text-left">
            <button onClick={() => handleNavigation('home')} className="text-left text-foreground/80 hover:text-foreground transition-colors w-full text-xl md:text-3xl">
              {`└home/page`}
            </button>
            {toolTileItems.map((item) => (
              <button key={item.id} onClick={() => handleNavigation(item.id)} className="text-left text-foreground/80 hover:text-foreground transition-colors w-full text-xl md:text-3xl">
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
