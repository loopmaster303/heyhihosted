
"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { TileItem } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';


// Adjusted to match the new design's text
const toolTileItems = [
  { 
    id: 'long language loops', 
    href: '/chat',
    tag: '</chat.talk.discuss>',
    importText: 'import [voice, text]',
    exportText: 'export [conversational.assistance]',
    tagColor: 'text-blue-400',
    symbolColor: 'text-blue-400',
    hoverTitle: 'chat.talk.discuss',
    hoverDescription: 'Talk here with the machine like you would with a real person, like a friend for example.\nAsk anything, get help, or just have a normal chat—no special rules.'
  },
  { 
    id: 'nocost imagination', 
    href: '/image-gen/no-cost',
    tag: '</generate.visuals.lite>',
    importText: 'import [simple.text, simple.config]',
    exportText: 'export [fast.visualization]',
    tagColor: 'text-green-400',
    symbolColor: 'text-green-400',
    hoverTitle: 'generate.visuals.lite',
    hoverDescription: 'Type your idea in natural language and instantly get a simple visualization—no settings, just magic.'
  },
  { 
    id: 'premium imagination', 
    href: '/image-gen/raw',
    tag: '</generate.visuals.raw>',
    importText: 'import [image, text, expert.config]',
    exportText: 'export [state-of-the-art.visualization]',
    tagColor: 'text-orange-400',
    symbolColor: 'text-orange-400',
    hoverTitle: 'generate.visuals.raw',
    hoverDescription: 'Describe your idea in natural language, modify every detail with expert settings, and create images using next-gen, state-of-the-art models.'
   },
  { 
    id: 'personalization', 
    href: '/settings',
    tag: '</settings.user.preferences>',
    importText: 'import [your.preferences]',
    exportText: 'export [personalized.machine.behavior]',
    tagColor: 'text-gray-400',
    symbolColor: 'text-gray-400',
    hoverTitle: 'settings.user.preferences',
    hoverDescription: 'Personalize how the machine behaves—set your username, adjust responses, language, style, and more to match your vibe.'
  },
  { 
    id: 'about', 
    href: '/about',
    tag: '</about.system.readme>',
    importText: 'import [curiosity]',
    exportText: 'export [transparency, context]',
    tagColor: 'text-gray-500',
    symbolColor: 'text-gray-500',
    hoverTitle: 'about.system.readme',
    hoverDescription: 'Learn more about the project, its components, and the philosophy behind it.'
  },
];

export default function HomePage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isVideoVisible, setIsVideoVisible] = useState(true);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.playbackRate = 0.75;
        }
    }, []);

    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        if (!isVideoVisible) {
            setIsVideoVisible(true);
        }

        if (video.paused) {
            video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    }, [isVideoVisible]);

    const handleStop = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        setIsVideoVisible(false);
        video.pause();
        video.currentTime = 0;
        setIsPlaying(false);
    }, []);

    const firstFourItems = toolTileItems.slice(0, 4);
    const lastItem = toolTileItems.length > 4 ? toolTileItems[4] : null;

    return (
        <div className={cn(
            "relative flex flex-col items-center justify-start min-h-screen p-4 pt-20 overflow-hidden",
            !isVideoVisible && 'bg-black'
        )}>
            <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                src="/backgroundclip.mp4"
                className={cn(
                    "w-full h-full object-cover transition-opacity duration-500",
                    isVideoVisible ? "opacity-100" : "opacity-0"
                )}
              />
            </div>
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button variant="ghost" size="icon" onClick={togglePlay} className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10">
                    {isPlaying ? <Pause className="h-[1.2rem] w-[1.2rem]" /> : <Play className="h-[1.2rem] w-[1.2rem]" />}
                    <span className="sr-only">{isPlaying ? 'Pause video' : 'Play video'}</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleStop} className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10">
                    <Square className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Stop video</span>
                </Button>
            </div>

            <main className="w-full max-w-4xl flex flex-col items-center p-6 md:p-8 relative">
                <div className="absolute -inset-8 bg-radial-gradient-fog -z-10 rounded-full"></div>
                <h1 className="text-5xl md:text-7xl font-code text-white text-glow mb-12 text-center">
                    <span className="text-gray-400">(</span>
                    !hey.hi
                    <span className="text-gray-400"> = </span>
                    <span className="text-pink-500">{`'space'`}</span>
                    <span className="text-gray-400">)</span>
                </h1>

                <nav 
                    className="w-full font-code text-sm md:text-base flex flex-col items-center gap-4"
                    onMouseLeave={() => setHoveredId(null)}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                        {firstFourItems.map((item) => (
                            <Link 
                                key={item.id} 
                                href={item.href || '#'} 
                                className="block group"
                                onMouseEnter={() => setHoveredId(item.id)}
                            >
                                <div className="bg-black/80 rounded-lg p-4 border border-white/10 hover:border-white/30 transition-colors duration-300 h-full min-h-[120px] flex flex-col justify-center">
                                    <AnimatePresence mode="wait">
                                        {hoveredId === item.id ? (
                                            <motion.div
                                                key="description"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <h2 className={`font-bold text-lg mb-2 ${item.tagColor}`}>{item.hoverTitle}</h2>
                                                <p className="text-white/80 text-xs whitespace-pre-line leading-relaxed">{item.hoverDescription}</p>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="code"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={item.symbolColor}>+</span>
                                                    <p className={item.tagColor}>{item.tag}</p>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-yellow-400">!</span>
                                                    <p><span className="text-gray-400">import </span><span className="text-gray-200">{item.importText.match(/\[.*?\]/)?.[0]}</span></p>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-purple-400">#</span>
                                                    <p><span className="text-gray-400">export </span><span className="text-gray-200">{item.exportText.match(/\[.*?\]/)?.[0]}</span></p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </Link>
                        ))}
                    </div>
                    
                    {lastItem && (
                         <div 
                            className="w-full max-w-3xl md:max-w-[calc(50%-0.5rem)] self-center"
                            onMouseEnter={() => setHoveredId(lastItem.id)}
                        >
                            <Link key={lastItem.id} href={lastItem.href || '#'} className="block group">
                                <div className="bg-black/80 rounded-lg p-4 border border-white/10 hover:border-white/30 transition-colors duration-300 h-full min-h-[120px] flex flex-col justify-center">
                                    <AnimatePresence mode="wait">
                                       {hoveredId === lastItem.id ? (
                                            <motion.div
                                                key="description"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <h2 className={`font-bold text-lg mb-2 ${lastItem.tagColor}`}>{lastItem.hoverTitle}</h2>
                                                <p className="text-white/80 text-xs whitespace-pre-line leading-relaxed">{lastItem.hoverDescription}</p>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="code"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={lastItem.symbolColor}>+</span>
                                                    <p className={lastItem.tagColor}>{lastItem.tag}</p>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-yellow-400">!</span>
                                                    <p><span className="text-gray-400">import </span><span className="text-gray-200">{lastItem.importText.match(/\[.*?\]/)?.[0]}</span></p>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-purple-400">#</span>
                                                    <p><span className="text-gray-400">export </span><span className="text-gray-200">{lastItem.exportText.match(/\[.*?\]/)?.[0]}</span></p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </Link>
                        </div>
                    )}
                </nav>
            </main>
        </div>
    );
};
