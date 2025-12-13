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
        <div className="border-t border-border bg-background">
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        <h3 className="text-sm font-semibold">Gesprächs-Historie</h3>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        ×
                    </Button>
                </div>


                <ScrollArea className="h-64 w-full">
                    {sortedConversations.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm py-8">
                            Keine Gespräche vorhanden
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sortedConversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent group ${activeConversation?.id === conversation.id
                                        ? 'bg-accent border-accent-foreground'
                                        : 'border-border'
                                        }`}
                                    onClick={() => handleSelectChat(conversation.id)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium truncate">
                                                {conversation.title}
                                            </h4>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(conversation.updatedAt), 'dd.MM.yyyy HH:mm')}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {conversation.messages.length} Nachrichten
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRequestEditTitle(conversation.id);
                                                }}
                                            >
                                                <Edit className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-destructive hover:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteChat(conversation.id);
                                                }}
                                            >
                                                <Trash2 className="w-3 h-3" />
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