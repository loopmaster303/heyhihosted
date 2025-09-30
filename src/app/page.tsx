
"use client";

import React, { useEffect, useState, useRef } from 'react';
import type { TileItem } from '@/types';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import LanguageToggleHomepage from '@/components/LanguageToggleHomepage';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';
import useLocalStorageState from '@/hooks/useLocalStorageState';

// Adjusted to match the new design's text
const toolTileItems = [
  { 
    id: 'long language loops', 
    titleKey: 'tool.chat.tag',
    href: '/chat',
    tagKey: 'tool.chat.tag',
    importTextKey: 'tool.chat.importText',
    exportTextKey: 'tool.chat.exportText',
    tagColor: 'text-transparent bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text',
    symbolColor: 'text-transparent bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text',
    hoverTitleKey: 'tool.chat.hoverTitle',
    translationKey: 'tool.chat.hoverDescription'
  },
  { 
    id: 'image generation', 
    href: '/image-gen',
    tagKey: 'tool.imageGen.tag',
    importTextKey: 'tool.imageGen.importText',
    exportTextKey: 'tool.imageGen.exportText',
    tagColor: 'text-transparent bg-gradient-to-r from-green-400 to-orange-600 bg-clip-text',
    symbolColor: 'text-transparent bg-gradient-to-r from-green-400 to-orange-600 bg-clip-text',
    hoverTitleKey: 'tool.imageGen.hoverTitle',
    translationKey: 'tool.imageGen.hoverDescription'
  },
  { 
    id: 'personalization', 
    href: '/settings',
    tagKey: 'tool.settings.tag',
    importTextKey: 'tool.settings.importText',
    exportTextKey: 'tool.settings.exportText',
    tagColor: 'text-transparent bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text',
    symbolColor: 'text-transparent bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text',
    hoverTitleKey: 'tool.settings.hoverTitle',
    translationKey: 'tool.settings.hoverDescription'
  },
  { 
    id: 'about', 
    href: '/about',
    tagKey: 'tool.about.tag',
    importTextKey: 'tool.about.importText',
    exportTextKey: 'tool.about.exportText',
    tagColor: 'text-transparent bg-gradient-to-r from-gray-500 to-gray-700 bg-clip-text',
    symbolColor: 'text-transparent bg-gradient-to-r from-gray-500 to-gray-700 bg-clip-text',
    hoverTitleKey: 'tool.about.hoverTitle',
    translationKey: 'tool.about.hoverDescription'
  },
];

export default function HomePage() {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const { t, language } = useLanguage();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isBgVideoOn, setIsBgVideoOn] = useLocalStorageState<boolean>('homeBgVideoOn', true);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      setHoveredId(null);
    }, [language]);

    const firstFourItems = toolTileItems.slice(0, 4);
    const lastTwoItems = toolTileItems.slice(4);

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-20">
          <div className="text-white text-lg">Loading...</div>
        </div>
      );
    }

    return (
        <div
          key={`home-${language}`}
          className={cn(
            "relative flex flex-col items-center justify-start min-h-screen p-4 pt-20 overflow-hidden"
          )}
        >
            <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
              <div className="absolute inset-0 bg-black"></div>
              <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                src="/backgroundclip.mp4"
                className={cn('w-full h-full object-cover transition-opacity duration-300', isBgVideoOn ? 'opacity-30' : 'opacity-0')}
              />
              {/* Full-screen purple gradient overlay, responsive to viewport */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-purple-900/40 via-purple-900/20 to-transparent"></div>
            </div>
            <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
                <LanguageToggleHomepage />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setIsBgVideoOn(true); videoRef.current?.play().catch(() => {}); }}
                  title="Play background video"
                  aria-label="Play background video"
                  disabled={isBgVideoOn}
                  className={cn(isBgVideoOn ? 'text-foreground/40' : 'text-green-500 hover:text-green-600')}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setIsBgVideoOn(false); videoRef.current?.pause(); }}
                  title="Stop background video"
                  aria-label="Stop background video"
                  disabled={!isBgVideoOn}
                  className={cn(!isBgVideoOn ? 'text-foreground/40' : 'text-red-500 hover:text-red-600')}
                >
                  <Square className="h-4 w-4" />
                </Button>
            </div>

            <main className="w-full flex flex-col items-center p-6 md:p-8 relative" style={{ maxWidth: '1020px' }}>
                {/* Local gradient removed; global full-screen gradient added above */}
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-code text-white text-glow mb-8 sm:mb-12 text-center">
                    <span className="text-gray-400">(</span>
                    !hey.hi
                    <span className="text-gray-400"> = </span> 
                    <span className="text-transparent bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text">{`'space'`}</span>
                    <span className="text-gray-400">)</span>
                </h1>

                <nav
                    className="w-full font-code text-xs sm:text-sm md:text-base flex flex-col items-center gap-4"
                    onMouseLeave={() => setHoveredId(null)}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                        {firstFourItems.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href || '#'}
                                className="block group"
                                onMouseEnter={() => setHoveredId(item.id)}
                            >
                                <div className="bg-black/20 backdrop-blur-md rounded-xl transition-all duration-300 h-full min-h-[100px] sm:min-h-[120px] flex flex-col justify-center p-3 sm:p-4">
                                    <AnimatePresence mode="wait">
                                        {hoveredId === item.id ? (
                                            <motion.div
                                                key="description"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="h-full"
                                            >
                                                <h2 className={`font-bold text-base sm:text-lg mb-1 sm:mb-2 ${item.tagColor}`}>{t(item.hoverTitleKey)}</h2>
                                                <p className="text-white/80 text-[11px] sm:text-xs whitespace-pre-line leading-relaxed">{t(item.translationKey)}</p>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="code"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <p className={`${item.tagColor} text-base sm:text-lg md:text-xl`}>{t(item.tagKey)}</p>
                                                </div>
                                                <div className="space-y-1 mt-0.5 sm:mt-1 text-sm sm:text-base">
                                                    <div className="grid grid-cols-[auto,1fr] gap-x-2">
                                                        <span className="text-gray-400 whitespace-nowrap">import</span>
                                                        <span className="text-gray-200 break-words">{t(item.importTextKey).match(/\[.*?\]/)?.[0]}</span>
                                                    </div>
                                                    <div className="grid grid-cols-[auto,1fr] gap-x-2">
                                                        <span className="text-gray-400 whitespace-nowrap">export</span>
                                                        <span className="text-gray-200 break-words">{t(item.exportTextKey).match(/\[.*?\]/)?.[0]}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </Link>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                        {lastTwoItems.map((item) => (
                             <Link
                                key={item.id}
                                href={item.href || '#'}
                                className="block group"
                                onMouseEnter={() => setHoveredId(item.id)}
                            >
                                <div className="bg-black/20 backdrop-blur-md rounded-xl transition-all duration-300 h-full min-h-[100px] sm:min-h-[120px] flex flex-col justify-center p-3 sm:p-4">
                                    <AnimatePresence mode="wait">
                                       {hoveredId === item.id ? (
                                            <motion.div
                                                key="description"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="h-full"
                                            >
                                                <h2 className={`font-bold text-base sm:text-lg mb-1 sm:mb-2 ${item.tagColor}`}>{t(item.hoverTitleKey)}</h2>
                                                <p className="text-white/80 text-[11px] sm:text-xs whitespace-pre-line leading-relaxed">{t(item.translationKey)}</p>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="code"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <p className={`${item.tagColor} text-base sm:text-lg md:text-xl`}>{t(item.tagKey)}</p>
                                                </div>
                                                <div className="space-y-1 mt-0.5 sm:mt-1 text-sm sm:text-base">
                                                    <div className="grid grid-cols-[auto,1fr] gap-x-2">
                                                        <span className="text-gray-400 whitespace-nowrap">import</span>
                                                        <span className="text-gray-200 break-words">{t(item.importTextKey).match(/\[.*?\]/)?.[0]}</span>
                                                    </div>
                                                    <div className="grid grid-cols-[auto,1fr] gap-x-2">
                                                        <span className="text-gray-400 whitespace-nowrap">export</span>
                                                        <span className="text-gray-200 break-words">{t(item.exportTextKey).match(/\[.*?\]/)?.[0]}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </Link>
                        ))}
                    </div>
                </nav>
            </main>
        </div>
    );
};
