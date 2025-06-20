
"use client";
import React, { useState } from 'react';
import type { ToolType, Conversation } from '@/types';
import CompactHeader from '@/components/layout/CompactHeader';
import ChatHistoryItem from './ChatHistoryItem';
import { Button } from '@/components/ui/button';
import { History, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSidebar } from '@/components/ui/sidebar'; // Import useSidebar

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
  // Removed toolsTrigger prop as it's now internal to page.tsx
}

const SidebarNav: React.FC<SidebarNavProps> = ({
  onSelectNewChat,
  allConversations,
  activeConversationId,
  onSelectChatHistory,
  onEditTitle,
  onDeleteChat,
  onNavigateToTiles,
  className
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const sortedConversations = [...allConversations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const { isMobile, setOpenMobile } = useSidebar();

  const handleHistoryToggle = () => {
    setShowHistory(!showHistory);
    if (isMobile && !showHistory) { // If opening history on mobile, ensure sidebar is open
        setOpenMobile(true);
    }
  }
  
  const handleNewChat = () => {
    onSelectNewChat();
     if (isMobile) { // If starting new chat on mobile, ensure sidebar is open
        setOpenMobile(true);
    }
  }


  return (
    <aside className={cn("flex flex-col h-full bg-sidebar-background text-sidebar-foreground", className)}> 
      <CompactHeader onNavigateToTiles={onNavigateToTiles} />
      
      <div className="flex-grow">
        {/* Future content above history */}
      </div>

      {showHistory && (
        <ScrollArea className="flex-shrink max-h-[40vh] mb-2 group-data-[state=expanded]:block hidden">
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
              <p className="p-2 text-xs text-sidebar-foreground/60 text-center group-data-[state=expanded]:block hidden">No chat history yet.</p>
            )}
          </div>
        </ScrollArea>
      )}
      
      <div className={cn(
        "p-2.5 mt-auto border-t border-sidebar-border group-data-[state=collapsed]:border-t-0",
        "group-data-[state=collapsed]:flex group-data-[state=collapsed]:flex-col group-data-[state=collapsed]:items-center group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:py-3"
      )}>
        <div className={cn(
          "flex items-center justify-around",
          "group-data-[state=collapsed]:flex-col group-data-[state=collapsed]:space-y-3"
        )}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleHistoryToggle} 
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent group-data-[state=collapsed]:w-7 group-data-[state=collapsed]:h-7"
            aria-label={showHistory ? "Hide history" : "Show history"}
          >
            <History className="w-5 h-5 group-data-[state=collapsed]:w-6 group-data-[state=collapsed]:h-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNewChat} 
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent group-data-[state=collapsed]:w-7 group-data-[state=collapsed]:h-7"
            aria-label="Start new chat"
          >
            <Plus className="w-6 h-6 group-data-[state=collapsed]:w-7 group-data-[state=collapsed]:h-7" />
          </Button>
        </div>
      </div>
    </aside>
  );
};
export default SidebarNav;
