
"use client";
import type React from 'react';
import type { TileItem, ToolType, Conversation } from '@/types';
import CompactHeader from '@/components/layout/CompactHeader';
import SidebarTileCard from './SidebarTileCard';
import ChatHistoryItem from './ChatHistoryItem';
import { cn } from '@/lib/utils';
// ScrollArea import is removed

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
  const sortedConversations = [...allConversations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    // The main 'aside' element itself will be scrolled by SidebarContent from ui/sidebar
    <aside className={cn("flex flex-col h-full", className)}> 
      <CompactHeader />
      {/* ScrollArea component is removed */}
      <nav className="p-2 space-y-1 mt-2 flex-shrink-0">
        {tileItems.map(item => (
          <SidebarTileCard
            key={item.id}
            item={item}
            onSelect={onSelectTile}
            isActive={item.id === activeToolType && (item.id !== 'Long Language Loops' || activeConversationId === null)}
            showPlusIcon={item.id === 'Long Language Loops'}
          />
        ))}
      </nav>

      {sortedConversations.length > 0 && (
        <div className="px-2 py-1 mt-3 flex-grow overflow-y-auto"> {/* Added flex-grow and overflow-y-auto here if this section needs independent scroll, or rely on SidebarContent */}
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
      )}
    </aside>
  );
};
export default SidebarNav;
