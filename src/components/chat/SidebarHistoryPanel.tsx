"use client";

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Edit, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import type { Conversation } from '@/types';
import { useLanguage } from '../LanguageProvider';

interface SidebarHistoryPanelProps {
    allConversations: Conversation[];
    activeConversation: Conversation | null;
    onSelectChat: (id: string) => void;
    onRequestEditTitle: (id: string) => void;
    onDeleteChat: (id: string) => void;
    onClose: () => void;
}

const SidebarHistoryPanel: FC<SidebarHistoryPanelProps> = ({
    allConversations,
    activeConversation,
    onSelectChat,
    onRequestEditTitle,
    onDeleteChat,
    onClose
}) => {
    const { t } = useLanguage();

    const handleSelectChat = (conversationId: string) => {
        onSelectChat(conversationId);
        // Wenn wir nicht im Chat sind, zur Chat-Seite navigieren
        if (window.location.pathname !== '/chat') {
            window.location.href = '/chat';
        }
    };

    const filteredConversations = allConversations.filter(c => c.toolType === 'long language loops');
    const sortedConversations = [...filteredConversations].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return (
        <div className="bg-muted/30 border-t border-border/50">
            <div className="p-2">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-muted-foreground">Historie</h3>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={onClose}>
                        ×
                    </Button>
                </div>

                <ScrollArea className="h-48 w-full">
                    {sortedConversations.length === 0 ? (
                        <div className="text-center text-muted-foreground text-xs py-4">
                            Keine Gespräche
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {sortedConversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    className={`p-2 rounded cursor-pointer transition-colors hover:bg-accent/50 ${activeConversation?.id === conversation.id ? 'bg-accent' : ''}`}
                                    onClick={() => handleSelectChat(conversation.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">
                                                {conversation.title}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {format(new Date(conversation.updatedAt), 'dd.MM. HH:mm')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 relative z-40">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-60 hover:opacity-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteChat(conversation.id);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    );
};

export default SidebarHistoryPanel;
