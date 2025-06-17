
"use client";
import type React from 'react';
import type { TileItem, ToolType, Conversation } from '@/types';
import CompactHeader from '@/components/layout/CompactHeader';
import SidebarTileCard from './SidebarTileCard';
import ChatHistoryItem from './ChatHistoryItem';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
// import { Separator } from '@/components/ui/separator'; // Separator is no longer used

interface SidebarNavProps {
  tileItems: TileItem[];
  activeToolType: ToolType | null; 
  onSelectTile: (toolType: ToolType) => void;
  allConversations: Conversation[]; // Should already be filtered for LLL by parent
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
  allConversations, // These are expected to be only 'Long Language Loops' conversations
  activeConversationId,
  onSelectChatHistory,
  onEditTitle, 
  onDeleteChat, 
  className 
}) => {
  // Sort conversations by creation date, most recent first
  const sortedConversations = [...allConversations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <aside className={cn("flex flex-col h-full bg-card", className)}>
      <CompactHeader />
      <ScrollArea className="flex-grow">
        <nav className="p-2 space-y-1 mt-2">
          {tileItems.map(item => (
            <SidebarTileCard 
              key={item.id} 
              item={item} 
              onSelect={onSelectTile}
              // A tile is "active" if its tooltype matches and no specific chat history item is active.
              // For LLL, if a chat history item is active, the LLL tile itself is not visually "active".
              isActive={item.id === activeToolType && (item.id !== 'Long Language Loops' || activeConversationId === null) }
              // Show plus icon only for LLL, as it's the only one that creates new "chat sessions"
              showPlusIcon={item.id === 'Long Language Loops'} 
            />
          ))}
        </nav>
        
        {/* Chat history is only relevant for 'Long Language Loops' */}
        {sortedConversations.length > 0 && (
          <>
            {/* <Separator className="my-3 mx-2 bg-border/50" />  -- Removed Separator */}
            <div className="px-2 py-1 mt-3"> {/* Added mt-3 for spacing previously provided by separator */}
              <h3 className="mb-2 px-1 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Recent Chats
              </h3>
              <div className="space-y-1">
                {sortedConversations.map(conv => (
                  // Ensure ChatHistoryItem is only for LLL conversations
                  // This should be guaranteed if `allConversations` prop is pre-filtered
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
