
"use client";

import React, { useEffect, useState } from 'react';
import type { TileItem } from '@/types';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import LanguageToggleHomepage from '@/components/LanguageToggleHomepage';

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
    id: 'code reasoning', 
    titleKey: 'tool.reasoning.tag',
    href: '/reasoning',
    tagKey: 'tool.reasoning.tag',
    importTextKey: 'tool.reasoning.importText',
    exportTextKey: 'tool.reasoning.exportText',
    tagColor: 'text-transparent bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text',
    symbolColor: 'text-transparent bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text',
    hoverTitleKey: 'tool.reasoning.hoverTitle',
    translationKey: 'tool.reasoning.hoverDescription'
  },
  { 
    id: 'nocost imagination', 
    href: '/image-gen/no-cost',
    tagKey: 'tool.imageLite.tag',
    importTextKey: 'tool.imageLite.importText',
    exportTextKey: 'tool.imageLite.exportText',
    tagColor: 'text-transparent bg-gradient-to-r from-green-400 to-green-600 bg-clip-text',
    symbolColor: 'text-transparent bg-gradient-to-r from-green-400 to-green-600 bg-clip-text',
    hoverTitleKey: 'tool.imageLite.hoverTitle',
    translationKey: 'tool.imageLite.hoverDescription'
  },
  { 
    id: 'premium imagination', 
    href: '/image-gen/raw',
    tagKey: 'tool.imageRaw.tag',
    importTextKey: 'tool.imageRaw.importText',
    exportTextKey: 'tool.imageRaw.exportText',
    tagColor: 'text-transparent bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text',
    symbolColor: 'text-transparent bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text',
    hoverTitleKey: 'tool.imageRaw.hoverTitle',
    translationKey: 'tool.imageRaw.hoverDescription'
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
                autoPlay
                loop
                muted
                playsInline
                src="/backgroundclip.mp4"
                className="w-full h-full object-cover opacity-30"
              />
            </div>
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <LanguageToggleHomepage />
            </div>

            <main className="w-full flex flex-col items-center p-6 md:p-8 relative" style={{ maxWidth: '1020px' }}>
                <div className="absolute -inset-8 bg-gradient-to-b from-transparent via-purple-900/20 to-transparent -z-10"></div>
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
                                                <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
                                                    <p className="text-sm sm:text-base"><span className="text-gray-400">import </span><span className="text-gray-200">{t(item.importTextKey).match(/\[.*?\]/)?.[0]}</span></p>
                                                </div>
                                                <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
                                                    <p className="text-sm sm:text-base"><span className="text-gray-400">export </span><span className="text-gray-200">{t(item.exportTextKey).match(/\[.*?\]/)?.[0]}</span></p>
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
                                                <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
                                                    <p className="text-sm sm:text-base"><span className="text-gray-400">import </span><span className="text-gray-200">{t(item.importTextKey).match(/\[.*?\]/)?.[0]}</span></p>
                                                </div>
                                                <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
                                                    <p className="text-sm sm:text-base"><span className="text-gray-400">export </span><span className="text-gray-200">{t(item.exportTextKey).match(/\[.*?\]/)?.[0]}</span></p>
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
