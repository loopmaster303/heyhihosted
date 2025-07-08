"use client";

import React from 'react';
import type { TileItem, ToolType } from '@/types';

interface HomePageProps {
    onSelectTile: (id: ToolType) => void;
    toolTileItems: TileItem[];
}

const HomePage: React.FC<HomePageProps> = ({ onSelectTile, toolTileItems }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <header className="shrink-0 mb-16 text-center">
                <h1 className="text-9xl font-code">&lt;/hey.hi&gt;</h1>
                <p className="text-muted-foreground text-lg mt-2">everyone can say hi to ai.</p>
                <nav className="mt-8 space-y-4 font-code text-3xl w-auto inline-block text-left">
                    {toolTileItems.map((item) => (
                        <button key={item.id} onClick={() => onSelectTile(item.id)} className="block w-full text-left text-foreground/80 hover:text-foreground transition-colors">
                            {`└${item.title}`}
                        </button>
                    ))}
                </nav>
            </header>
            <div className="text-muted-foreground/50 text-xs max-w-lg leading-relaxed space-y-2 text-justify">
                <p>
                    Say hi to &lt;/hey.hi&gt; and artificial intelligence. These machines can chat with you like a real person, answer your questions, or help with your ideas.
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

export default HomePage;
