
"use client";
import React, { useEffect, useState } from 'react';
import { ChatProvider } from '@/components/ChatProvider';
import ChatInterface from '@/components/page/ChatInterface';
import NewAppHeader from '@/components/page/NewAppHeader';
import type { TileItem } from '@/types';
import DeleteChatDialog from '@/components/dialogs/DeleteChatDialog';
import EditTitleDialog from '@/components/dialogs/EditTitleDialog';
import CameraCaptureDialog from '@/components/dialogs/CameraCaptureDialog';
import { useChat } from '@/components/ChatProvider';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import PageLoader from '@/components/ui/PageLoader';
import ErrorBoundary from '@/components/ErrorBoundary';

const toolTileItems: TileItem[] = [
    { id: 'long language loops', title: '</chat.talk.discuss>', href: '/chat' },
    { id: 'nocost imagination', title: '</generate.visuals.lite>', href: '/image-gen/no-cost' },
    { id: 'premium imagination', title: '</generate.visuals.raw>', href: '/image-gen/raw' },
    { id: 'personalization', title: '</settings.user.preferences>', href: '/settings' },
    { id: 'about', title: '</about.system.readme>', href: '/about' },
];

function ChatPageContent() {
    const chat = useChat();
    const [isClient, setIsClient] = useState(false);
    const [userDisplayName] = useLocalStorageState<string>("userDisplayName", "User");
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return <PageLoader text="Chat wird geladen..." />;
    }

    return (
        <div className="relative flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
            <NewAppHeader toolTileItems={toolTileItems} userDisplayName={userDisplayName || 'user'} />
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
            <CameraCaptureDialog
                isOpen={chat.isCameraOpen}
                onOpenChange={chat.closeCamera}
                onCapture={(dataUri) => chat.handleFileSelect(dataUri, 'image/jpeg')}
            />
        </div>
    );
}


export default function ChatPage() {
  return (
    <ErrorBoundary 
      fallbackTitle="Chat konnte nicht geladen werden"
      fallbackMessage="Es gab ein Problem beim Laden des Chats. Bitte versuche es erneut."
    >
      <ChatProvider>
          <ChatPageContent />
      </ChatProvider>
    </ErrorBoundary>
  );
}
