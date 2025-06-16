
"use client";
import type React from 'react';
import type { Conversation } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns'; // For formatting dates

interface ChatHistoryItemProps {
  conversation: Conversation;
  onSelect: (id: Conversation['id']) => void;
  isActive: boolean;
}

const ChatHistoryItem: React.FC<ChatHistoryItemProps> = ({ conversation, onSelect, isActive }) => {
  return (
    <button
      onClick={() => onSelect(conversation.id)}
      className={cn(
        "w-full flex flex-col items-start p-2.5 rounded-md text-left transition-colors duration-150 ease-in-out",
        "focus:outline-none focus:ring-1 focus:ring-primary/50",
        isActive ? "bg-accent/70 text-accent-foreground" : "hover:bg-accent/30 text-muted-foreground hover:text-foreground"
      )}
      aria-label={`Continue chat: ${conversation.title}`}
      aria-current={isActive ? "page" : undefined}
    >
      <p className={cn(
        "font-medium text-sm truncate w-full",
         isActive ? "text-primary-foreground" : "text-foreground/90"
         )}>
        {conversation.title || "Chat"} 
      </p>
      <p className={cn(
        "text-xs mt-0.5",
         isActive ? "text-primary-foreground/70" : "text-muted-foreground/80"
         )}>
        {format(new Date(conversation.createdAt), "dd/MM/yy HH:mm")}
      </p>
    </button>
  );
};
export default ChatHistoryItem;
