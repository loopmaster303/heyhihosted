"use client";

import React, { useState, useEffect, useRef } from 'react';
import type { TileItem } from '@/types';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../LanguageProvider';
import { Button } from '../ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface NewAppHeaderProps {
  toolTileItems: TileItem[];
  userDisplayName?: string;
  className?: string;
}

const NewAppHeader: React.FC<NewAppHeaderProps> = ({ toolTileItems, userDisplayName, className }) => {
  const { t, language } = useLanguage();
  const { theme, resolvedTheme } = useTheme();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  const handleNavigationStart = () => {
    setLoading(true);
  };
  
  const displayName = userDisplayName && userDisplayName.trim() !== '' ? userDisplayName : 'john';

  // Use resolvedTheme to avoid hydration mismatch
  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <>
      {/* Compact Header: code brand left + inline tool links, toggles right */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-background/95 backdrop-blur-md border-0",
        className
      )}>
        {/* Left: Code-style brand + Tool Links (desktop) */}
        <div className="flex items-center gap-6 min-w-0">
          <Link href="/" className="shrink-0 transition-opacity hover:opacity-80">
            <span className="font-code text-glow text-xl md:text-2xl font-bold">
              <span className="text-muted-foreground">(</span>
              <span className="text-foreground">!hey.hi</span>
              <span className="text-muted-foreground"> = </span>
              <span className="text-transparent bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text">{`'${displayName}'`}</span>
              <span className="text-muted-foreground">)</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 overflow-x-auto">
            {toolTileItems
              ?.filter((item) => item.id !== 'about' && item.href !== '/about')
              .map((item) => {
              const active = pathname === item.href;
              const href = item.href || '/';
              // Derive labels like in the screenshot, based on route + language
              const label = (() => {
                if (href === '/chat') return '</chat>';
                if (href === '/image-gen') return '</generate.multimedia.output>';
                if (href === '/settings') return language === 'de' ? '</einstellungen>' : '</settings>';
                if (href === '/about') return language === 'de' ? '</über>' : '</about>';
                return item.title || href;
              })();
              return (
                <Link
                  key={item.id}
                  href={href}
                  onClick={handleNavigationStart}
                  className={cn(
                    "px-2 py-1 rounded-md text-base md:text-lg font-code font-semibold whitespace-nowrap",
                    active ? "bg-muted text-foreground" : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Mobile menu + Language & Theme */}
        <div className="flex items-center gap-2">
          {/* Mobile Tool Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2 md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {toolTileItems
                ?.filter((item) => item.id !== 'about' && item.href !== '/about')
                .map((item) => (
                <DropdownMenuItem key={item.id} asChild>
                  <Link href={item.href || '/'} onClick={handleNavigationStart} className="flex items-center">
                    <span className="font-code text-sm">{item.title}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Language & Theme */}
          {mounted && <LanguageToggle />}
          {mounted && <ThemeToggle />}
        </div>
      </header>
    </>
  );
};

export default NewAppHeader;
