'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import type { Language } from '@/config/translations';

const LANGUAGES: readonly Language[] = ['de', 'en'];

/**
 * Sprache und Thema mit einem Tipp — oben im Verlauf, wo sie in der alten
 * Seitenleiste standen. Die Sprache ist ein Paar statt eines Dropdowns: zwei
 * Werte brauchen kein Menue. Die volle Wahl (auch "System") bleibt in den
 * Einstellungen.
 */
export function QuickToggles() {
  const { language, setLanguage } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  return (
    <div className="flex items-center gap-1">
      <div role="group" aria-label="Sprache / Language" className="flex items-center rounded-full border border-sidebar-border/60 p-0.5">
        {LANGUAGES.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLanguage(code)}
            aria-pressed={language === code}
            className={cn(
              'press touch-hit h-6 rounded-full px-2 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors duration-fast',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              language === code ? 'bg-primary/20 text-foreground' : 'text-muted-foreground/70 hover:text-foreground',
            )}
          >
            {code}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label={isDark ? 'Helles Thema / Light theme' : 'Dunkles Thema / Dark theme'}
        className="press touch-hit relative grid h-8 w-8 place-items-center rounded-full text-muted-foreground/70 transition-colors duration-fast hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Sun
          aria-hidden="true"
          className={cn('h-4 w-4 transition-[transform,opacity] duration-med ease-out', isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100')}
        />
        <Moon
          aria-hidden="true"
          className={cn('absolute h-4 w-4 transition-[transform,opacity] duration-med ease-out', isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0')}
        />
      </button>
    </div>
  );
}
