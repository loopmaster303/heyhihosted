
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
  onEditTitle: (conversationId: string) => void;
  onDeleteChat: (conversationId: string) => void;
  className?: string;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ 
  tileItems, 
  activeToolType, 
  onSelectTile,
  allConversations,
  activeConversationId,
  onSelectChatHistory,
  onEditTitle,
  onDeleteChat,
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
              isActive={item.id === activeToolType && item.id !== 'Long Language Loops'} 
              showPlusIcon={item.id === 'Long Language Loops'}
            />
          ))}
        </nav>
        
        {sortedConversations.length > 0 && (
          <>
            <Separator className="my-3 mx-2 bg-border/50" />
            <div className="px-2 py-1">
              <div className="space-y-1">
                {sortedConversations.map(conv => (
                  <ChatHistoryItem 
                    key={conv.id} 
                    conversation={conv} 
                    onSelect={onSelectChatHistory}
                    isActive={conv.id === activeConversationId}
                    onEditTitle={onEditTitle}
                    onDeleteChat={onDeleteChat}
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
