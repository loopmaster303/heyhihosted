
"use client";
import type React from 'react';
import type { TileItem, ToolType, Conversation } from '@/types';
import CompactHeader from '@/components/layout/CompactHeader';
import SidebarTileCard from './SidebarTileCard';
import ChatHistoryItem from './ChatHistoryItem'; // New component for history
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface SidebarNavProps {
  tileItems: TileItem[];
  activeToolType: ToolType | null;
  onSelectTile: (toolType: ToolType) => void;
  allConversations: Conversation[];
  activeConversationId: string | null;
  onSelectChatHistory: (conversationId: string) => void;
  className?: string;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ 
  tileItems, 
  activeToolType, 
  onSelectTile,
  allConversations,
  activeConversationId,
  onSelectChatHistory,
  className 
}) => {
  // Display all tool tiles, including the active one if desired, or filter it out.
  // For now, let's show all tiles, the active one won't be visually distinct here unless styled in SidebarTileCard
  const displayToolItems = tileItems; 

  // Sort conversations by most recent first
  const sortedConversations = [...allConversations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <aside className={cn("flex flex-col h-full", className)}>
      <CompactHeader />
      <ScrollArea className="flex-grow">
        <nav className="p-2 space-y-1 mt-2">
          {displayToolItems.map(item => (
            <SidebarTileCard 
              key={item.id} 
              item={item} 
              onSelect={onSelectTile}
              // Add isActive prop if you want to highlight the active tool tile
              isActive={item.id === activeToolType} 
            />
          ))}
        </nav>
        
        {sortedConversations.length > 0 && (
          <>
            <Separator className="my-3 mx-2 bg-border/50" />
            <div className="px-2 py-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Chat History</h3>
              <div className="space-y-1">
                {sortedConversations.map(conv => (
                  <ChatHistoryItem 
                    key={conv.id} 
                    conversation={conv} 
                    onSelect={onSelectChatHistory}
                    isActive={conv.id === activeConversationId}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </ScrollArea>
    </aside>
  );
};
export default SidebarNav;
