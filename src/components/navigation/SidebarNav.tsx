
"use client";
import React, { useState } from 'react';
import type { ToolType, Conversation, TileItem } from '@/types';
import CompactHeader from '@/components/layout/CompactHeader';
import ChatHistoryItem from './ChatHistoryItem';
import { Button } from '@/components/ui/button';
import { History, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarNavProps {
  activeToolType: ToolType | null;
  onSelectNewChat: () => void;
  allConversations: Conversation[];
  activeConversationId: string | null;
  onSelectChatHistory: (conversationId: string) => void;
  onEditTitle: (conversationId: string) => void;
  onDeleteChat: (conversationId: string) => void;
  onNavigateToTiles: () => void;
  className?: string;
  toolTileItems: TileItem[];
  onSelectTile: (id: ToolType) => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({
  onSelectNewChat,
  allConversations,
  activeConversationId,
  onSelectChatHistory,
  onEditTitle,
  onDeleteChat,
  onNavigateToTiles,
  className,
  toolTileItems,
  onSelectTile
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const sortedConversations = [...allConversations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleHistoryToggle = () => {
    setShowHistory(!showHistory);
  }
  
  const handleNewChat = () => {
    onSelectNewChat();
  }


  return (
    <aside className={cn("flex flex-col h-full bg-sidebar-background text-sidebar-foreground", className)}> 
      <CompactHeader onNavigateToTiles={onNavigateToTiles} />
      
      <div className="p-3 space-y-2 flex-shrink-0">
        {toolTileItems.map((item) => (
            <button
            key={item.id}
            onClick={() => onSelectTile(item.id)}
            className="font-code text-lg text-sidebar-foreground/80 hover:text-sidebar-foreground transition-colors duration-150 block w-full text-left py-1"
            aria-label={`Run ${item.title.replace(/\s/g, '')}`}
            >
            └run/{item.title.replace(/\s/g, '')}
            </button>
        ))}
      </div>

      <div className="flex-grow">
      </div>

      {showHistory && (
        <ScrollArea className="flex-shrink max-h-[40vh] mb-2">
          <div className="px-2 py-1 space-y-1">
            {sortedConversations.length > 0 ? (
              sortedConversations.map(conv => (
                <ChatHistoryItem
                  key={conv.id}
                  conversation={conv}
                  onSelect={onSelectChatHistory}
                  isActive={conv.id === activeConversationId}
                  onEditTitle={onEditTitle} 
                  onDeleteChat={onDeleteChat} 
                />
              ))
            ) : (
              <p className="p-2 text-xs text-sidebar-foreground/60 text-center font-code">No chat history yet.</p>
            )}
          </div>
        </ScrollArea>
      )}
      
      <div className={cn(
        "p-2.5 mt-auto border-t border-sidebar-border",
        "flex items-center justify-around" 
      )}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleHistoryToggle} 
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label={showHistory ? "Hide history" : "Show history"}
          >
            <History className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNewChat} 
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Start new chat"
          >
            <Plus className="w-6 h-6" />
          </Button>
      </div>
    </aside>
  );
};
export default SidebarNav;
