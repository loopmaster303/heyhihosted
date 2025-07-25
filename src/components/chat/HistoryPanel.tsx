
"use client";

import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageSquareText, Pencil, Trash2, Plus, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Conversation } from '@/types';

interface HistoryPanelProps {
  allConversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectChat: (id: string) => void;
  onRequestEditTitle: (id: string) => void;
  onRequestDeleteChat: (id: string) => void;
  onStartNewChat: () => void;
  toDate: (timestamp: Date | string | undefined | null) => Date;
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  allConversations,
  activeConversation,
  onSelectChat,
  onRequestEditTitle,
  onRequestDeleteChat,
  onStartNewChat,
  toDate,
  onClose
}) => {
  const filteredConversations = allConversations.filter(c => c.toolType === 'long language loops');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleNewChat = () => {
    onStartNewChat();
  };

  return (
    <div 
      className="absolute bottom-full mb-2 left-0 w-full bg-popover text-popover-foreground rounded-lg shadow-xl border border-border p-2 max-h-80 z-30 animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
    >
      <div className="flex justify-between items-center px-2 pt-1 pb-2">
        <h3 className="text-sm font-semibold text-foreground">Conversations</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-foreground/80 hover:text-foreground">
            <X className="w-4 h-4 mr-1.5" />
            Close
        </Button>
      </div>
      <ScrollArea className="h-full max-h-64">
        {filteredConversations.length === 0 ? (
            <p className="text-xs text-muted-foreground p-2 text-center">No history yet.</p>
        ) : (
            <div className="flex flex-col space-y-1 pr-2">
            {filteredConversations.map(conv => (
                <div
                key={conv.id}
                className="group relative"
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
                >
                <Button
                    variant="ghost"
                    onClick={() => onSelectChat(conv.id)}
                    className={cn(
                    "w-full h-auto text-left p-2 justify-start items-start gap-3",
                    activeConversation?.id === conv.id && "bg-accent"
                    )}
                    title={conv.title}
                >
                    <MessageSquareText className="w-4 h-4 shrink-0 self-start mt-1 text-muted-foreground" />
                    <div className="flex-grow overflow-hidden text-sm">
                    <p className="truncate font-medium text-popover-foreground">{conv.title}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(toDate(conv.updatedAt || conv.createdAt), { addSuffix: true })}
                    </p>
                    </div>
                </Button>

                <div
                    className={cn(
                    "absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 transition-opacity duration-200",
                    "group-hover:opacity-100",
                    hoveredId === conv.id && "opacity-100"
                    )}
                >
                    <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); onRequestEditTitle(conv.id); }}
                    aria-label="Edit title"
                    >
                    <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); onRequestDeleteChat(conv.id); }}
                    aria-label="Delete chat"
                    >
                    <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
                </div>
            ))}
            </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default HistoryPanel;
