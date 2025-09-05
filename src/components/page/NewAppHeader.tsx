"use client";

import React, { useState, useEffect } from 'react';
import type { TileItem } from '@/types';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../LanguageProvider';
import { Button } from '../ui/button';
import { Menu, X } from 'lucide-react';
import { useTheme } from 'next-themes';

interface NewAppHeaderProps {
  toolTileItems: TileItem[];
  userDisplayName?: string;
  className?: string;
}

const NewAppHeader: React.FC<NewAppHeaderProps> = ({ toolTileItems, userDisplayName, className }) => {
  const { t, language } = useLanguage();
  const { theme, resolvedTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  
  const displayName = userDisplayName && userDisplayName.trim() !== '' ? userDisplayName : 'john';

  // Use resolvedTheme to avoid hydration mismatch
  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <>
      {/* Loading bar - completely removed */}
      
      {/* Main Header */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-md border-0",
        className
      )}>
        
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-baseline gap-2 text-left transition-all duration-200 hover:opacity-80">
            <h1 className="text-xl md:text-2xl font-code text-glow">
              <span className={isDark ? "text-gray-400" : "text-black/60"}>(</span>
              <span className={isDark ? "text-white" : "text-black"}>{`!hey.hi`}</span>
              <span className={isDark ? "text-gray-400" : "text-black/60"}> = </span> 
              <span className="text-transparent bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text">{`'${displayName}'`}</span>
              <span className={isDark ? "text-gray-400" : "text-black/60"}>)</span>
            </h1>
          </Link>
        </div>

        {/* Center: Navigation (Desktop) */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/chat" className={cn(
            "text-sm md:text-base font-code transition-colors",
            isDark 
              ? "text-gray-400 hover:text-white" 
              : "text-black/60 hover:text-black"
          )}>
            {'</chat>'}
          </Link>
          <Link href="/image-gen/no-cost" className={cn(
            "text-sm md:text-base font-code transition-colors",
            isDark 
              ? "text-gray-400 hover:text-white" 
              : "text-black/60 hover:text-black"
          )}>
            {mounted && language === 'de' ? '</bild.gen.lite>' : '</img.gen.lite>'}
          </Link>
          <Link href="/image-gen/raw" className={cn(
            "text-sm md:text-base font-code transition-colors",
            isDark 
              ? "text-gray-400 hover:text-white" 
              : "text-black/60 hover:text-black"
          )}>
            {mounted && language === 'de' ? '</bild.gen.expert>' : '</img.gen.expert>'}
          </Link>
          <Link href="/reasoning" className={cn(
            "text-sm md:text-base font-code transition-colors",
            isDark 
              ? "text-gray-400 hover:text-white" 
              : "text-black/60 hover:text-black"
          )}>
            {'</code>'}
          </Link>
          <Link href="/settings" className={cn(
            "text-sm md:text-base font-code transition-colors",
            isDark 
              ? "text-gray-400 hover:text-white" 
              : "text-black/60 hover:text-black"
          )}>
            {mounted && language === 'de' ? '</einstellungen>' : '</settings>'}
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMenu}
            className="md:hidden p-2"
            disabled={loading}
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          
          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-2">
            {mounted && <LanguageToggle />}
            {mounted && <ThemeToggle />}
          </div>
        </div>
      </header>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/95 backdrop-blur-md z-[60] flex flex-col items-center justify-start pt-20 animate-in fade-in-0 duration-300 md:hidden"
        >
          <nav className="flex flex-col space-y-4 font-code text-center w-full px-4">
            <Link 
              href="/chat" 
              onClick={handleNavigationStart} 
              className={cn(
                "text-lg transition-colors py-2",
                isDark 
                  ? "text-foreground/70 hover:text-foreground" 
                  : "text-black/70 hover:text-black",
                pathname === '/chat' && (isDark ? 'text-foreground' : 'text-black')
              )}
            >
              {'</chat.talk.discuss>'}
            </Link>
            <Link 
              href="/image-gen/no-cost" 
              onClick={handleNavigationStart} 
              className={cn(
                "text-lg transition-colors py-2",
                isDark 
                  ? "text-foreground/70 hover:text-foreground" 
                  : "text-black/70 hover:text-black",
                pathname === '/image-gen/no-cost' && (isDark ? 'text-foreground' : 'text-black')
              )}
            >
              {'</generate.visuals.lite>'}
            </Link>
            <Link 
              href="/image-gen/raw" 
              onClick={handleNavigationStart} 
              className={cn(
                "text-lg transition-colors py-2",
                isDark 
                  ? "text-foreground/70 hover:text-foreground" 
                  : "text-black/70 hover:text-black",
                pathname === '/image-gen/raw' && (isDark ? 'text-foreground' : 'text-black')
              )}
            >
              {'</generate.visuals.raw>'}
            </Link>
            <Link 
              href="/reasoning" 
              onClick={handleNavigationStart} 
              className={cn(
                "text-lg transition-colors py-2",
                isDark 
                  ? "text-foreground/70 hover:text-foreground" 
                  : "text-black/70 hover:text-black",
                pathname === '/reasoning' && (isDark ? 'text-foreground' : 'text-black')
              )}
            >
              {'</code.reasoning>'}
            </Link>
            <Link 
              href="/settings" 
              onClick={handleNavigationStart} 
              className={cn(
                "text-lg transition-colors py-2",
                isDark 
                  ? "text-foreground/70 hover:text-foreground" 
                  : "text-black/70 hover:text-black",
                pathname === '/settings' && (isDark ? 'text-foreground' : 'text-black')
              )}
            >
              {'</einstellungen.user.preferences>'}
            </Link>
            
            {/* Mobile Controls */}
            <div className="flex items-center justify-center gap-4 pt-4">
              {mounted && <LanguageToggle />}
              {mounted && <ThemeToggle />}
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default NewAppHeader;
