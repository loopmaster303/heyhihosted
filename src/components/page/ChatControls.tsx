"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, History } from 'lucide-react';
import type { Conversation } from '@/types';

interface ChatControlsProps {
    conversation: Conversation;
    onNewChat: () => void;
    onRequestEditTitle: (id: string) => void;
    onRequestDeleteChat: (id: string) => void;
    onToggleHistory: () => void;
}

const ChatControls: React.FC<ChatControlsProps> = ({ conversation, onNewChat, onRequestEditTitle, onRequestDeleteChat, onToggleHistory }) => {
    return (
        <div className="flex items-center justify-center text-center py-2 px-2 bg-transparent space-x-2">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={onToggleHistory}>
              <History className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={onNewChat}>
              <Plus className="w-4 h-4" />
            </Button>
            <span className="text-sm font-code font-extralight text-foreground/80 tracking-normal select-none px-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] sm:max-w-xs">
              {conversation.title || "Chat"}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => onRequestEditTitle(conversation.id)}>
              <Pencil className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onRequestDeleteChat(conversation.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
        </div>
    );
};

export default ChatControls;
