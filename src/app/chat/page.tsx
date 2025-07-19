
"use client";
import React, { useEffect, useState } from 'react';
import { ChatProvider } from '@/components/ChatProvider';
import ChatInterface from '@/components/page/ChatInterface';
import AppHeader from '@/components/page/AppHeader';
import type { TileItem } from '@/types';
import DeleteChatDialog from '@/components/dialogs/DeleteChatDialog';
import EditTitleDialog from '@/components/dialogs/EditTitleDialog';
import { useChat } from '@/components/ChatProvider';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { Loader2 } from 'lucide-react';

const toolTileItems: TileItem[] = [
    { id: 'long language loops', title: 'chat/conversational/assistance', href: '/chat' },
    { id: 'nocost imagination', title: 'generate/visualize/image-gen/fast', href: '/image-gen/no-cost' },
    { id: 'premium imagination', title: 'generate/visualize/image-gen/raw', href: '/image-gen/raw' },
    { id: 'personalization', title: 'settings/personalization', href: '/settings' },
    { id: 'about', title: 'about/hey.hi/readme', href: '/about' },
];

function ChatPageContent() {
    const chat = useChat();
    const [isClient, setIsClient] = useState(false);
    const [userDisplayName] = useLocalStorageState<string>("userDisplayName", "User");
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <div className="flex flex-col h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="relative flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
            <AppHeader toolTileItems={toolTileItems} userDisplayName={userDisplayName} />
            <main className="flex flex-col flex-grow pt-16">
                <ChatInterface />
            </main>
            <DeleteChatDialog
                isOpen={chat.isDeleteDialogOpen}
                onOpenChange={chat.cancelDeleteChat}
                onConfirm={chat.confirmDeleteChat}
                onCancel={chat.cancelDeleteChat}
            />
            <EditTitleDialog
                isOpen={chat.isEditTitleDialogOpen}
                onOpenChange={chat.cancelEditTitle}
                onConfirm={chat.confirmEditTitle}
                onCancel={chat.cancelEditTitle}
                title={chat.editingTitle}
                setTitle={chat.setEditingTitle}
            />
        </div>
    );
}


export default function ChatPage() {
  return (
    <ChatProvider>
        <ChatPageContent />
    </ChatProvider>
  );
}
