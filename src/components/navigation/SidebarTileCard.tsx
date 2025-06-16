
"use client";
import type React from 'react';
import type { TileItem } from '@/types';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react'; // Import Plus icon

interface SidebarTileCardProps {
  item: TileItem;
  onSelect: (id: TileItem['id']) => void;
  isActive?: boolean;
  showPlusIcon?: boolean; // New prop to show plus icon
}

const SidebarTileCard: React.FC<SidebarTileCardProps> = ({ item, onSelect, isActive, showPlusIcon }) => {
  const IconComponent = item.icon;
  return (
    <button
      onClick={() => onSelect(item.id)}
      className={cn(
        "w-full flex items-center p-3 rounded-md text-left transition-colors duration-150 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-primary",
        isActive ? "bg-primary/10 text-primary-foreground" : "hover:bg-accent/50"
      )}
      aria-label={`Switch to ${item.title}${showPlusIcon ? ' and start new chat' : ''}`}
      aria-current={isActive && !showPlusIcon ? "page" : undefined} // Plus icon tiles are actions, not states
    >
      <IconComponent className="w-5 h-5 mr-3 text-primary-foreground flex-shrink-0" />
      <div className="flex-grow">
        <p className="font-medium text-sm text-foreground">{item.title}</p>
        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
      </div>
      {showPlusIcon && (
        <Plus className="w-5 h-5 ml-auto text-primary-foreground flex-shrink-0" />
      )}
    </button>
  );
};
export default SidebarTileCard;
