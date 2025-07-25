
"use client";

import React, { useState, useEffect } from 'react';
import type { TileItem } from '@/types';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '../ThemeToggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppHeaderProps {
  toolTileItems: TileItem[];
  userDisplayName?: string;
  className?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ toolTileItems, userDisplayName, className }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
    setIsMenuOpen(false);
  }, [pathname]);

  const handleNavigationStart = () => {
    setLoading(true);
  };
  
  const toggleMenu = () => {
    if (loading) return;
    setIsMenuOpen(prev => !prev);
  }
  
  const displayName = userDisplayName && userDisplayName.trim() !== '' ? userDisplayName : 'user';

  return (
    <>
      <div
        className={cn(
          "fixed top-0 left-0 right-0 h-0.5 z-[99]",
          loading ? "w-full bg-primary" : "w-0"
        )}
      />
      
      <header className={cn("fixed top-0 left-0 right-0 z-50 flex items-center p-4 justify-between bg-background", className)}>
        <div className="flex-1"></div>
        <div className="flex-1 flex justify-center">
            <button
                onClick={toggleMenu}
                className="flex items-baseline gap-4 text-left hover:opacity-80 transition-opacity"
                aria-label="Toggle navigation menu"
                disabled={loading}
            >
              <h1 className="text-3xl md:text-4xl font-code text-foreground text-glow text-center">
                  <span className="text-foreground/60">(</span>
                  !hey.hi
                  <span className="text-foreground/60"> = </span>
                  <span className="text-pink-500">{`'${displayName}'`}</span>
                  <span className="text-foreground/60">)</span>
              </h1>
            </button>
        </div>
        <div className="flex-1 flex justify-end">
          <ThemeToggle />
        </div>
      </header>
      
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/95 backdrop-blur-sm z-[60] flex flex-col items-center justify-start pt-24 animate-in fade-in-0 duration-300"
        >
          <button 
            onClick={toggleMenu} 
            className="text-5xl md:text-8xl lg:text-9xl font-code font-bold text-foreground mb-8 hover:opacity-80 transition-opacity"
            aria-label="Close navigation menu"
            disabled={loading}
          >
             <h1 className="text-4xl md:text-5xl font-code text-foreground text-glow text-center">
                  <span className="text-foreground/60">(</span>
                  !hey.hi
                  <span className="text-foreground/60"> = </span>
                  <span className="text-pink-500">{`'${displayName}'`}</span>
                  <span className="text-foreground/60">)</span>
              </h1>
          </button>
          
          <nav className="flex flex-col space-y-2 font-code text-left">
            <Link href="/" onClick={handleNavigationStart} className={cn("text-left text-foreground/60 hover:text-foreground transition-colors w-full text-lg md:text-xl", pathname === '/' && 'text-foreground')}>
              {'</home.space>'}
            </Link>
            {toolTileItems.map((item) => (
              <Link key={item.id} href={item.href || '#'} onClick={handleNavigationStart} className={cn("text-left text-foreground/60 hover:text-foreground transition-colors w-full text-lg md:text-xl", pathname === item.href && 'text-foreground')}>
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
};

export default AppHeader;
