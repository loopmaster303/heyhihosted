
"use client";
import type React from 'react';
import type { Conversation } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { MessageSquareText } from 'lucide-react'; 

interface ChatHistoryItemProps {
  conversation: Conversation;
  onSelect: (id: Conversation['id']) => void;
  isActive: boolean;
  onEditTitle: (id: Conversation['id']) => void;
  onDeleteChat: (id: Conversation['id']) => void;
}

const ChatHistoryItem: React.FC<ChatHistoryItemProps> = ({ 
  conversation, 
  onSelect, 
  isActive
}) => {

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(conversation.id);
    }
  };

  return (
    <div
      onClick={() => onSelect(conversation.id)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className={cn(
        "w-full flex items-center p-2.5 rounded-lg text-left transition-colors duration-150 ease-in-out cursor-pointer",
        // Removed explicit background: "bg-input hover:bg-input/80",
        // Relies on sidebar background, hover uses sidebar-accent
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/70 focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar-background", // Adjusted ring offset
        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground", // Active state with subtle highlight
        "group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:p-2" 
      )}
      aria-label={`Continue chat: ${conversation.title}`}
      aria-current={isActive ? "page" : undefined}
    >
      <MessageSquareText 
        className={cn(
          "w-5 h-5 flex-shrink-0",
          isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/70",
          "group-data-[state=expanded]:hidden" 
        )} 
      />

      <div className="flex-col items-start w-full ml-2 group-data-[state=collapsed]:hidden">
        <p className={cn(
          "font-code text-sm truncate w-full",
           isActive ? "text-sidebar-accent-foreground font-semibold" : "text-sidebar-foreground/90"
           )}>
          {conversation.title || "Chat"}
        </p>
        <p className={cn(
            "font-code text-xs",
            isActive ? "text-sidebar-accent-foreground/80" : "text-sidebar-foreground/60"
            )}>
            {format(new Date(conversation.createdAt), "dd/MM/yy HH:mm")}
        </p>
      </div>
    </div>
  );
};
export default ChatHistoryItem;
