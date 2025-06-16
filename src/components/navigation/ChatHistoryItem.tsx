
"use client";
import type React from 'react';
import type { Conversation } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns'; // For formatting dates
import { Pencil, Trash2 } from 'lucide-react';

interface ChatHistoryItemProps {
  conversation: Conversation;
  onSelect: (id: Conversation['id']) => void;
  isActive: boolean;
  onEditTitle: (id: Conversation['id']) => void;
  onDeleteChat: (id: Conversation['id']) => void;
}

const ChatHistoryItem: React.FC<ChatHistoryItemProps> = ({ conversation, onSelect, isActive, onEditTitle, onDeleteChat }) => {
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the parent div's onClick from firing
    onEditTitle(conversation.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the parent div's onClick from firing
    onDeleteChat(conversation.id);
  };

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
        "w-full group flex flex-col items-start p-2.5 rounded-md text-left transition-colors duration-150 ease-in-out cursor-pointer",
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
      <div className="flex justify-between items-center w-full mt-0.5">
        <p className={cn(
          "text-xs",
           isActive ? "text-primary-foreground/70" : "text-muted-foreground/80"
           )}>
          {format(new Date(conversation.createdAt), "dd/MM/yy HH:mm")}
        </p>
        <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={handleEditClick}
            className={cn(
              "p-0.5 rounded hover:bg-muted-foreground/20",
              isActive ? "text-primary-foreground/70 hover:text-primary-foreground" : "text-muted-foreground/70 hover:text-foreground"
            )}
            aria-label="Edit chat title"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={handleDeleteClick}
            className={cn(
              "p-0.5 rounded hover:bg-destructive/20",
               isActive ? "text-primary-foreground/70 hover:text-destructive" : "text-muted-foreground/70 hover:text-destructive"
            )}
            aria-label="Delete chat"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHistoryItem;
