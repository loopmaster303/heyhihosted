
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
        <div className="relative flex flex-col items-center justify-center h-full p-4">
            <div className="fixed top-0 left-0 w-full h-full -z-10">
              <div style={{padding: '56.25% 0 0 0', position: 'relative', width: '100%', height: '100%'}}>
                <iframe 
                  src="https://player.vimeo.com/video/1103423962?badge=0&autopause=0&player_id=0&app_id=58479&loop=1&autoplay=1&muted=1" 
                  frameBorder="0" 
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" 
                  style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}} 
                  title="glitchkot"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
            <div className="absolute top-4 right-4">
              <ThemeToggle />
            </div>
            <header className="shrink-0 mb-8 md:mb-12 text-center">
                <h1 className="text-5xl md:text-8xl lg:text-9xl font-code">&lt;/hey.hi&gt;</h1>
                <nav className="mt-8 space-y-3 md:space-y-4 font-code text-xl md:text-2xl lg:text-3xl w-auto inline-block text-left">
                    {toolTileItems.map((item) => (
                        <Link key={item.id} href={item.href || '#'} className="block w-full text-left text-foreground/80 hover:text-foreground transition-colors">
                            {`└${item.title}`}
                        </Link>
                    ))}
                </nav>
            </header>
        </div>
    );
};
