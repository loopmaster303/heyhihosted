
"use client";
import type React from 'react';
import type { TileItem, ToolType } from '@/types';
import CompactHeader from '@/components/layout/CompactHeader';
import SidebarTileCard from './SidebarTileCard';
import { cn } from '@/lib/utils';

interface SidebarNavProps {
  tileItems: TileItem[];
  activeToolType: ToolType | null;
  onSelectTile: (toolType: ToolType) => void;
  className?: string;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ tileItems, activeToolType, onSelectTile, className }) => {
  const displayItems = tileItems.filter(item => item.id !== activeToolType);

  return (
    <aside className={cn("flex flex-col", className)}>
      <CompactHeader />
      <nav className="p-2 space-y-1 mt-2 flex-grow overflow-y-auto">
        {displayItems.map(item => (
          <SidebarTileCard 
            key={item.id} 
            item={item} 
            onSelect={onSelectTile}
          />
        ))}
      </nav>
    </aside>
  );
};
export default SidebarNav;
