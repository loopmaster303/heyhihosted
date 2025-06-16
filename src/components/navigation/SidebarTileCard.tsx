
"use client";
import type React from 'react';
import type { TileItem } from '@/types';
import { cn } from '@/lib/utils';

interface SidebarTileCardProps {
  item: TileItem;
  onSelect: (id: TileItem['id']) => void;
}

const SidebarTileCard: React.FC<SidebarTileCardProps> = ({ item, onSelect }) => {
  const IconComponent = item.icon;
  return (
    <button
      onClick={() => onSelect(item.id)}
      className={cn(
        "w-full flex items-center p-3 rounded-md text-left transition-colors duration-150 ease-in-out",
        "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary"
      )}
      aria-label={`Switch to ${item.title}`}
    >
      <IconComponent className="w-5 h-5 mr-3 text-primary-foreground flex-shrink-0" />
      <div className="flex-grow">
        <p className="font-medium text-sm text-foreground">{item.title}</p>
        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
      </div>
    </button>
  );
};
export default SidebarTileCard;
