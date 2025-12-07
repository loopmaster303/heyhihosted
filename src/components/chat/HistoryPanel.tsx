
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MessageSquareText, Pencil, Trash2, Plus, X, Search, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Conversation, ChatMessage } from '@/types';
import { useLanguage } from '../LanguageProvider';

interface HistoryPanelProps {
  allConversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectChat: (id: string) => void;
  onRequestEditTitle: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onStartNewChat: () => void;
  toDate: (timestamp: Date | string | undefined | null) => Date;
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  allConversations,
  activeConversation,
  onSelectChat,
  onRequestEditTitle,
  onDeleteChat,
  onStartNewChat,
  toDate,
  onClose
}) => {
  const { t } = useLanguage();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const getMessageText = useCallback((message: ChatMessage): string => {
    if (typeof message.content === 'string') {
      return message.content;
    }
    if (Array.isArray(message.content)) {
      return message.content
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join(' ');
    }
    return '';
  }, []);

  // Filter conversations by tool type first
  const toolFilteredConversations = useMemo(() => 
    allConversations.filter(c => c.toolType === 'long language loops'),
    [allConversations]
  );

  // Then filter by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return toolFilteredConversations;
    }

    const query = searchQuery.toLowerCase();
    return toolFilteredConversations.filter(conv => {
      if (conv.title.toLowerCase().includes(query)) {
        return true;
      }

      return conv.messages.some(msg => {
        const textContent = getMessageText(msg).toLowerCase();
        return textContent.includes(query);
      });
    });
  }, [toolFilteredConversations, searchQuery, getMessageText]);

  const handleNewChat = () => {
    onStartNewChat();
  };

  return (
    <div 
      className="absolute bottom-full mb-2 left-0 w-full max-w-[min(100vw-1.5rem,32rem)] bg-popover text-popover-foreground rounded-lg shadow-xl border border-border z-30 animate-in fade-in-0 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[70vh]"
    >
      {/* Header - Fixed */}
      <div className="flex justify-between items-center px-3 pt-2 pb-2 flex-shrink-0 border-b border-border/50">
        <h3 className="text-sm font-semibold text-foreground">{t('nav.conversations')}</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-foreground/80 hover:text-foreground h-7">
            <X className="w-4 h-4 mr-1.5" />
            {t('imageGen.close')}
        </Button>
      </div>
      
      {/* Search Input - Fixed */}
      <div className="px-3 py-2 flex-shrink-0 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder={t('chat.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-sm h-8"
          />
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-muted-foreground">
                {searchQuery.trim() ? 'Keine Gespräche gefunden für diese Suche.' : t('chat.noHistory')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col py-1 px-1">
              {filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  className="group relative"
                  onMouseEnter={() => setHoveredId(conv.id)}
                  onMouseLeave={() => {
                    // Don't reset hover if delete is pending
                    if (pendingDeleteId !== conv.id) {
                      setHoveredId(null);
                    }
                  }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => onSelectChat(conv.id)}
                    className={cn(
                      "w-full h-auto text-left p-2.5 justify-start items-start gap-2.5 min-h-[3.5rem]",
                      activeConversation?.id === conv.id && "bg-accent"
                    )}
                    title={conv.title}
                  >
                    <MessageSquareText className="w-4 h-4 shrink-0 self-start mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="truncate font-medium text-sm text-popover-foreground leading-tight mb-0.5">
                        {conv.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight">
                        {formatDistanceToNow(toDate(conv.updatedAt || conv.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </Button>

                  <div
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 transition-opacity duration-200 z-10",
                      "group-hover:opacity-100",
                      (hoveredId === conv.id || pendingDeleteId === conv.id) && "opacity-100"
                    )}
                  >
                    {pendingDeleteId === conv.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950/20"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onDeleteChat(conv.id);
                            setPendingDeleteId(null);
                          }}
                          aria-label="Confirm delete"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setPendingDeleteId(null);
                          }}
                          aria-label="Cancel delete"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={(e) => { e.stopPropagation(); onRequestEditTitle(conv.id); }}
                          aria-label="Edit title"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setPendingDeleteId(conv.id);
                          }}
                          aria-label="Delete chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};

export default HistoryPanel;
