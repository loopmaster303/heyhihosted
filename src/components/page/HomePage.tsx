"use client";

import React from 'react';
import type { TileItem, ToolType } from '@/types';

interface HomePageProps {
    onSelectTile: (id: ToolType) => void;
    toolTileItems: TileItem[];
}

const HomePage: React.FC<HomePageProps> = ({ onSelectTile, toolTileItems }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <header className="shrink-0 mb-12">
                <h1 className="text-7xl font-code">&lt;/hey.hi&gt;</h1>
                <p className="text-muted-foreground text-lg mt-2">everyone can say hi to ai.</p>
                <nav className="mt-6 space-y-2 font-code text-2xl w-auto inline-block text-left">
                    {toolTileItems.map((item) => (
                        <button key={item.id} onClick={() => onSelectTile(item.id)} className="block w-full text-foreground/80 hover:text-foreground transition-colors">
                            {`└${item.title}`}
                        </button>
                    ))}
                </nav>
            </header>
            <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
                Say hi to &lt;/hey.hi&gt; – chat with Artificial Intelligence or create stunning images with it, all for free. Try different models, generate images, and personalize your experience. No paywall, no limits, for everyone.
            </p>
        </div>
    );
};

export default HomePage;
