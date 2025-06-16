
"use client";

import type React from 'react';
import TileCard from './TileCard';
import type { TileItem } from '@/types';
import { Image as ImageIcon, GalleryHorizontal, CodeXml, MessageSquare } from 'lucide-react';

const tileItems: TileItem[] = [
  { id: 'FLUX Kontext', title: 'FLUX Kontext', icon: ImageIcon, description: "Engage with contextual AI" },
  { id: 'Easy Image Loop', title: 'Visualizing Loops', icon: GalleryHorizontal, description: "Generate images effortlessly" },
  { id: 'Code a Loop', title: 'Code some Loops', icon: CodeXml, description: "AI-assisted coding" },
  { id: 'Long Language Loops', title: 'Long Language Loops', icon: MessageSquare, description: "Loops about everything." }, // Changed id from 'Placeholder Loop'
];

interface TileMenuProps {
  onSelectTile: (id: TileItem['id']) => void;
}

const TileMenu: React.FC<TileMenuProps> = ({ onSelectTile }) => {
  return (
    <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6 p-4 animate-in fade-in-0 duration-500">
      {tileItems.map((item) => (
        <TileCard key={item.id} item={item} onSelect={onSelectTile} />
      ))}
    </div>
  );
};

export default TileMenu;
