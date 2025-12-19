"use client";

import type { FC } from 'react';
import { cn } from '@/lib/utils';
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
        <div className="w-full">
            <ScrollArea className="h-64 w-full">
                {sortedConversations.length === 0 ? (
                    <div className="text-center text-muted-foreground text-xs py-4">
                        Keine Gespräche
                    </div>
                ) : (
                    <div className="space-y-1">
                        {sortedConversations.map((conversation) => (
                            <div
                                key={conversation.id}
                                className="px-2 py-1.5 flex justify-start w-full"
                            >
                                <div
                                    onClick={() => handleSelectChat(conversation.id)}
                                    className={cn(
                                        "group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all border border-transparent",
                                        "w-fit max-w-full",
                                        activeConversation?.id === conversation.id
                                            ? 'bg-accent/80 border-accent-foreground/10 shadow-sm'
                                            : 'bg-muted/40 hover:bg-accent/50 hover:border-accent/20'
                                    )}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate leading-tight">
                                            {conversation.title}
                                        </p>
                                        <p className="text-[9px] text-muted-foreground truncate mt-0.5">
                                            {format(new Date(conversation.updatedAt), 'dd.MM. HH:mm')}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-pink-500 hover:text-pink-600 hover:bg-pink-500/10 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRequestEditTitle(conversation.id);
                                            }}
                                            title="Rename"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteChat(conversation.id);
                                            }}
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};

export default SidebarHistoryPanel;
