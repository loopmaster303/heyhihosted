
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
  onEditTitle: (id: Conversation['id']) => void; // Kept for future use if active chat has edit
  onDeleteChat: (id: Conversation['id']) => void; // Kept for future use if active chat has delete
}

const ChatHistoryItem: React.FC<ChatHistoryItemProps> = ({ 
  conversation, 
  onSelect, 
  isActive
  // onEditTitle and onDeleteChat are not used directly on the history item in this design
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
        "bg-input hover:bg-input/80", // Matches screenshot's dark box style
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/70 focus-visible:ring-offset-1 focus-visible:ring-offset-card",
        isActive ? "ring-2 ring-primary" : "", // Highlight active chat
        "group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:p-2" 
      )}
      aria-label={`Continue chat: ${conversation.title}`}
      aria-current={isActive ? "page" : undefined}
    >
      {/* Icon for collapsed state - always visible as per screenshot */}
      <MessageSquareText 
        className={cn(
          "w-5 h-5 flex-shrink-0 text-muted-foreground",
          "group-data-[state=expanded]:hidden" 
        )} 
      />

      {/* Expanded state content */}
      <div className="flex-col items-start w-full ml-2 group-data-[state=collapsed]:hidden">
        <p className={cn(
          "font-code text-sm truncate w-full",
           isActive ? "text-foreground font-semibold" : "text-foreground/80"
           )}>
          {conversation.title || "Chat"}
        </p>
        <p className={cn(
            "font-code text-xs",
            isActive ? "text-muted-foreground/90" : "text-muted-foreground/70"
            )}>
            {format(new Date(conversation.createdAt), "dd/MM/yy HH:mm")}
        </p>
      </div>
    </div>
  );
};
export default ChatHistoryItem;
