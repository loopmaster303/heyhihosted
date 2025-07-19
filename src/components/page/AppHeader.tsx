
"use client";

import React, { useState, useEffect } from 'react';
import type { TileItem } from '@/types';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '../ThemeToggle';
import { X } from 'lucide-react';
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

  // Effect to handle loading indicator on route change
  useEffect(() => {
    // When the menu is open, we don't want to show a loading bar yet
    if (isMenuOpen) {
      setLoading(false);
      return;
    }

    // A simple way to handle loading state on path change
    // This will reset loading to false on re-renders when the path is the same
    setLoading(false);
    
    // We don't need to track the previous path here. The loading state is managed
    // by the Link's onClick and this effect's cleanup.
  }, [pathname, isMenuOpen]);


  const handleNavigation = () => {
    // Start loading indicator immediately on click
    setLoading(true);
    // Menu will close after a short delay to allow the loading bar to appear first
    setTimeout(() => {
        setIsMenuOpen(false);
    }, 150);
  };
  
  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  
  const showUserName = userDisplayName && userDisplayName.trim() !== '' && userDisplayName !== 'User';

  return (
    <>
      {/* Loading Bar */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 h-0.5 z-[99] bg-primary transition-all duration-500 ease-in-out",
          loading ? "w-full" : "w-0"
        )}
      />
      
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
                    <div className="text-5xl font-code text-foreground select-none">&lt;/hey.hi&gt;</div>
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
          onClick={toggleMenu}
        >
          <nav className="flex flex-col space-y-1 md:space-y-4 font-code w-auto text-left">
            <Link href="/" onClick={handleNavigation} className={cn("text-left text-foreground/80 hover:text-foreground transition-colors w-full text-xl md:text-3xl", pathname === '/' && 'text-foreground')}>
              {`└home/page`}
            </Link>
            {toolTileItems.map((item) => (
              <Link key={item.id} href={item.href || '#'} onClick={handleNavigation} className={cn("text-left text-foreground/80 hover:text-foreground transition-colors w-full text-xl md:text-3xl", pathname === item.href && 'text-foreground')}>
                {`└${item.title}`}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
};

export default AppHeader;
