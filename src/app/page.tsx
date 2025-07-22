
"use client";

import React from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { TileItem } from '@/types';
import Link from 'next/link';

const toolTileItems: TileItem[] = [
  { id: 'long language loops', title: 'chat/conversational/assistance', href: '/chat' },
  { id: 'nocost imagination', title: 'generate/visualize/image-gen/fast', href: '/image-gen/no-cost' },
  { id: 'premium imagination', title: 'generate/visualize/image-gen/raw', href: '/image-gen/raw' },
  { id: 'personalization', title: 'settings/personalization', href: '/settings' },
  { id: 'about', title: 'about/hey.hi/readme', href: '/about' },
];

export default function HomePage() {
    return (
        <div className="relative flex flex-col items-center justify-center h-full p-4 overflow-hidden">
            <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
              <video
                autoPlay
                loop
                muted
                playsInline
                src="/background-video.mp4"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute top-4 right-4">
              <ThemeToggle />
            </div>

            {/* Container for the content with background */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-2xl p-6 md:p-8 max-w-max">
                <header className="shrink-0 text-center">
                    <h1 className="text-5xl md:text-8xl lg:text-9xl font-code text-white">&lt;/hey.hi&gt;</h1>
                    <nav className="mt-8 space-y-3 md:space-y-4 font-code text-xl md:text-2xl lg:text-3xl w-auto inline-block text-left">
                        {toolTileItems.map((item) => (
                            <Link key={item.id} href={item.href || '#'} className="block w-full text-left text-gray-300 hover:text-white transition-colors">
                                {`└${item.title}`}
                            </Link>
                        ))}
                    </nav>
                </header>
            </div>
        </div>
    );
};
