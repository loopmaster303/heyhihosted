
"use client";

import React, { useState, useRef, useCallback } from 'react';
import type { TileItem } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

const toolTileItems: TileItem[] = [
  { id: 'long language loops', title: 'chat/conversational/assistance', href: '/chat' },
  { id: 'nocost imagination', title: 'generate/visualize/image-gen/fast', href: '/image-gen/no-cost' },
  { id: 'premium imagination', title: 'generate/visualize/image-gen/raw', href: '/image-gen/raw' },
  { id: 'personalization', title: 'settings/personalization', href: '/settings' },
  { id: 'about', title: 'about/hey.hi/readme', href: '/about' },
];

export default function HomePage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);

    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    }, []);

    return (
        <div className="relative flex flex-col items-center justify-center h-full p-4 overflow-hidden">
            <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                src="/backgroundclip.mp4"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute top-4 right-4">
                <Button variant="ghost" size="icon" onClick={togglePlay} className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10">
                    {isPlaying ? <Pause className="h-[1.2rem] w-[1.2rem]" /> : <Play className="h-[1.2rem] w-[1.2rem]" />}
                    <span className="sr-only">{isPlaying ? 'Pause video' : 'Play video'}</span>
                </Button>
            </div>

            {/* Container for the content with background */}
            <div className="bg-radial-gradient-fog rounded-xl md:rounded-2xl p-6 md:p-8 max-w-max">
                <header className="shrink-0 text-center">
                    <h1 className="text-5xl md:text-8xl lg:text-9xl font-code text-white text-glow">&lt;/hey.hi&gt;</h1>
                    <nav className="mt-8 space-y-3 md:space-y-4 font-code text-xl md:text-2xl lg:text-3xl w-auto inline-block text-left">
                        {toolTileItems.map((item) => (
                            <Link key={item.id} href={item.href || '#'} className="block w-full text-left text-gray-300 hover:text-white transition-colors text-glow">
                                {`└${item.title}`}
                            </Link>
                        ))}
                    </nav>
                </header>
            </div>
        </div>
    );
};
