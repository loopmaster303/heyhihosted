
"use client";
import type React from 'react';
import type { TileItem, ToolType } from '@/types';
import CompactHeader from '@/components/layout/CompactHeader';
import SidebarTileCard from './SidebarTileCard';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';


interface SidebarNavProps {
  tileItems: TileItem[];
  activeToolType: ToolType | null;
  onSelectTile: (toolType: ToolType) => void;
  className?: string;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ tileItems, activeToolType, onSelectTile, className }) => {
  const displayItems = tileItems.filter(item => item.id !== activeToolType);

  return (
    <aside className={cn("flex flex-col h-full", className)}>
      <CompactHeader />
      <ScrollArea className="flex-grow">
        <nav className="p-2 space-y-1 mt-2">
          {displayItems.map(item => (
            <SidebarTileCard 
              key={item.id} 
              item={item} 
              onSelect={onSelectTile}
            />
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
};
export default SidebarNav;
