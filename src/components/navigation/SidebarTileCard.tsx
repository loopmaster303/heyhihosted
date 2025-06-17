
"use client";
import type React from 'react';
import type { TileItem } from '@/types';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react'; 

interface SidebarTileCardProps {
  item: TileItem;
  onSelect: (id: TileItem['id']) => void;
  isActive?: boolean;
  showPlusIcon?: boolean; 
}

const SidebarTileCard: React.FC<SidebarTileCardProps> = ({ item, onSelect, isActive, showPlusIcon }) => {
  const IconComponent = item.icon;
  return (
    <button
      onClick={() => onSelect(item.id)}
      className={cn(
        "w-full flex items-center p-3 rounded-lg text-left transition-colors duration-150 ease-in-out group",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        isActive 
          ? "bg-primary/10 text-primary" 
          : "text-foreground hover:bg-accent hover:text-accent-foreground"
      )}
      aria-label={`Select tool: ${item.title}${showPlusIcon ? ' or start new chat' : ''}`}
      aria-current={isActive ? "page" : undefined}
    >
      <IconComponent className={cn("w-5 h-5 mr-3 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground")} />
      <div className="flex-grow">
        <p className={cn("font-medium text-sm", isActive ? "text-primary" : "text-foreground")}>{item.title}</p>
        <p className={cn("text-xs truncate", isActive ? "text-primary/80" : "text-muted-foreground group-hover:text-accent-foreground/80")}>{item.description}</p>
      </div>
      {showPlusIcon && (
        <Plus className={cn("w-5 h-5 ml-auto flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground")} />
      )}
    </button>
  );
};
export default SidebarTileCard;

