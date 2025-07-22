
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
            <div className="fixed top-0 left-0 w-full h-full -z-10">
              <div style={{width: '100%', height: '100%', overflow: 'hidden', position: 'relative'}}>
                <iframe
                  src="https://player.vimeo.com/video/1103423962?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '177.77vh', // 16/9 aspect ratio
                    minWidth: '100vw',
                    height: '100vw', // 9/16 aspect ratio
                    minHeight: '100vh',
                    transform: 'translate(-50%, -50%) scale(1.2)'
                  }}
                  title="glitchkot"
                  allowFullScreen
                ></iframe>
              </div>
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
