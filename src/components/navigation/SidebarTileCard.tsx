
"use client";
import type React from 'react';
import type { TileItem } from '@/types';
import { cn } from '@/lib/utils';

interface SidebarTileCardProps {
  item: TileItem;
  onSelect: (id: TileItem['id']) => void;
  isActive?: boolean; // Optional: to highlight if this tile represents the active tool
}

const SidebarTileCard: React.FC<SidebarTileCardProps> = ({ item, onSelect, isActive }) => {
  const IconComponent = item.icon;
  return (
    <button
      onClick={() => onSelect(item.id)}
      className={cn(
        "w-full flex items-center p-3 rounded-md text-left transition-colors duration-150 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-primary",
        isActive ? "bg-primary/10 text-primary-foreground" : "hover:bg-accent/50"
      )}
      aria-label={`Switch to ${item.title}`}
      aria-current={isActive ? "page" : undefined}
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
