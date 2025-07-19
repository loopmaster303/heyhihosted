
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
            <div className="absolute top-4 right-4">
              <ThemeToggle />
            </div>
            <header className="shrink-0 mb-8 md:mb-12 text-center">
                <h1 className="text-5xl md:text-8xl lg:text-9xl font-code">&lt;/hey.hi&gt;</h1>
                <p className="text-muted-foreground text-base md:text-lg mt-2">everyone can say hi to ai.</p>
                <nav className="mt-8 space-y-3 md:space-y-4 font-code text-xl md:text-2xl lg:text-3xl w-auto inline-block text-left">
                    {toolTileItems.map((item) => (
                        <Link key={item.id} href={item.href || '#'} className="block w-full text-left text-foreground/80 hover:text-foreground transition-colors">
                            {`└${item.title}`}
                        </Link>
                    ))}
                </nav>
            </header>
            <div className="text-muted-foreground/80 text-xs max-w-lg leading-relaxed space-y-2 text-center md:text-justify">
                <p>
                    Say hi to &lt;/hey.hi&gt; and artificial intelligence. These machines can talk or text to the machine.... chat with you like a real person, answer your questions, or help with your ideas.
                </p>
                <p>
                    In this space, you can chat, get assistant help, have an AI companion, or bring your imagination to life – just like ChatGPT, but with more options. You choose the brain behind it.
                </p>
                <p>
                    No registration, no hidden costs, no limits. AI for everyone accessible.
                </p>
            </div>
        </div>
    );
};

    