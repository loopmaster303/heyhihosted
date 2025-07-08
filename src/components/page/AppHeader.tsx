"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
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
  const menuRef = useRef<HTMLDivElement>(null);

  const handleNavigation = (toolType: ToolType | 'home') => {
    onNavigate(toolType);
    setIsMenuOpen(false);
  };

  // Close menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-40 flex justify-center items-center p-4", className)}>
      <div className="relative flex items-center gap-4" ref={menuRef}>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-8 h-8"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {isMenuOpen && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-input text-foreground rounded-lg shadow-xl border border-border p-2 min-w-[200px] z-50">
              <nav className="flex flex-col space-y-1 font-code">
                <button onClick={() => handleNavigation('home')} className="text-left p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors w-full">
                  home/page
                </button>
                {toolTileItems.map((item) => (
                  <button key={item.id} onClick={() => handleNavigation(item.id)} className="text-left p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors w-full">
                    {item.title}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </div>
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
  );
};

export default AppHeader;
