"use client";

import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageSquareText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Conversation } from '@/types';

interface HistoryPanelProps {
  allConversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectChat: (id: string) => void;
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  allConversations,
  activeConversation,
  onSelectChat,
  onClose,
}) => {
  const filteredConversations = allConversations.filter(c => c.toolType === 'long language loops' && c.messages.length > 0);

  return (
    <div className="absolute bottom-24 left-4 w-72 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border p-2 max-h-80 z-30 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <h3 className="text-sm font-semibold px-2 pt-1 pb-2 text-foreground">Chat History</h3>
      <ScrollArea className="h-full max-h-72">
        <div className="flex flex-col space-y-1 pr-2">
          {filteredConversations.map(conv => (
            <Button
              key={conv.id}
              variant="ghost"
              onClick={() => {
                onSelectChat(conv.id);
                onClose();
              }}
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
                  {formatDistanceToNow(conv.createdAt, { addSuffix: true })}
                </p>
              </div>
            </Button>
          ))}
          {filteredConversations.length === 0 && (
            <p className="text-xs text-muted-foreground p-2 text-center">No history yet.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default HistoryPanel;
