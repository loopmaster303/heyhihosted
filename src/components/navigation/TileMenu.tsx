
"use client";

import type React from 'react';
import TileCard from './TileCard';
import type { TileItem } from '@/types';
// tileItems are now passed as a prop

interface TileMenuProps {
  onSelectTile: (id: TileItem['id']) => void;
  tileItems: TileItem[];
}

const TileMenu: React.FC<TileMenuProps> = ({ onSelectTile, tileItems }) => {
  return (
    <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6 p-4 animate-in fade-in-0 duration-500">
      {tileItems.map((item) => (
        <TileCard key={item.id} item={item} onSelect={onSelectTile} />
      ))}
    </div>
  );
};

export default TileMenu;
