
"use client";
import type React from 'react';
import type { Conversation } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Pencil, Trash2, MessageSquareText } from 'lucide-react'; // Added MessageSquareText for collapsed view

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
  isActive, 
  onEditTitle, 
  onDeleteChat 
}) => {

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    onEditTitle(conversation.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    onDeleteChat(conversation.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(conversation.id);
    }
  };

  const iconContainerClasses = cn(
    "flex items-center space-x-1.5 transition-opacity duration-150 ease-in-out",
    isActive ? "opacity-100" : "opacity-0 group-hover/item:opacity-100" // Use group-hover/item for specificity
  );

  const iconButtonBaseClasses = "p-0.5 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-primary";

  const editIconButtonClasses = cn(
    iconButtonBaseClasses,
    isActive ? "text-accent-foreground hover:text-accent-foreground/80" : "text-muted-foreground hover:text-foreground"
  );

  const deleteIconButtonClasses = cn(
    iconButtonBaseClasses,
    isActive ? "text-accent-foreground hover:text-destructive" : "text-muted-foreground hover:text-destructive"
  );


  return (
    <div
      onClick={() => onSelect(conversation.id)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className={cn(
        "w-full group/item flex items-center p-2.5 rounded-lg text-left transition-colors duration-150 ease-in-out cursor-pointer", // Added group/item
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/70 focus-visible:ring-offset-1 focus-visible:ring-offset-card",
        isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50 text-foreground",
        "group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0" // Center content when collapsed
      )}
      aria-label={`Continue chat: ${conversation.title}`}
      aria-current={isActive ? "page" : undefined}
    >
      {/* Icon for collapsed state */}
      <MessageSquareText className={cn("w-5 h-5 flex-shrink-0 group-data-[state=expanded]:hidden", isActive ? "text-accent-foreground" : "text-muted-foreground")} />

      {/* Expanded state content */}
      <div className="flex-col items-start w-full group-data-[state=collapsed]:hidden">
        <p className={cn(
          "font-medium text-sm truncate w-full",
           isActive ? "text-accent-foreground" : "text-foreground"
           )}>
          {conversation.title || "Chat"}
        </p>
        <div className="flex justify-between items-center w-full mt-0.5">
          <p className={cn(
            "text-xs",
             isActive ? "text-accent-foreground/70" : "text-muted-foreground/80"
             )}>
            {format(new Date(conversation.createdAt), "dd/MM/yy HH:mm")}
          </p>
          {conversation.toolType === 'Long Language Loops' && (
              <div className={iconContainerClasses}>
              <button
                  onClick={handleEditClick}
                  className={editIconButtonClasses}
                  aria-label="Edit chat title"
              >
                  <Pencil size={14} />
              </button>
              <button
                  onClick={handleDeleteClick}
                  className={deleteIconButtonClasses}
                  aria-label="Delete chat"
              >
                  <Trash2 size={14} />
              </button>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ChatHistoryItem;
