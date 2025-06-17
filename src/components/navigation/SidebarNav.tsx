
"use client";
import type React from 'react';
import type { TileItem, ToolType, Conversation } from '@/types';
import CompactHeader from '@/components/layout/CompactHeader';
import SidebarTileCard from './SidebarTileCard';
import ChatHistoryItem from './ChatHistoryItem';
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
  onEditTitle: (conversationId: string) => void; // Prop for editing title
  onDeleteChat: (conversationId: string) => void; // Prop for deleting chat
  className?: string;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ 
  tileItems, 
  activeToolType, 
  onSelectTile,
  allConversations,
  activeConversationId,
  onSelectChatHistory,
  onEditTitle, // Destructure the prop
  onDeleteChat, // Destructure the prop
  className 
}) => {
  const displayToolItems = tileItems; 
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
              // Active state for tool cards is primarily for non-LLL tools or the LLL general selection
              isActive={item.id === activeToolType && activeConversationId === null} 
              showPlusIcon={item.id === 'Long Language Loops'} // Plus icon for LLL to indicate "new chat"
            />
          ))}
        </nav>
        
        {sortedConversations.length > 0 && (
          <>
            <Separator className="my-3 mx-2 bg-border/50" />
            <div className="px-2 py-1">
              <h3 className="mb-2 px-1 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Recent Chats
              </h3>
              <div className="space-y-1">
                {sortedConversations.map(conv => (
                  <ChatHistoryItem 
                    key={conv.id} 
                    conversation={conv} 
                    onSelect={onSelectChatHistory}
                    isActive={conv.id === activeConversationId}
                    onEditTitle={onEditTitle} // Pass down to ChatHistoryItem
                    onDeleteChat={onDeleteChat} // Pass down to ChatHistoryItem
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

