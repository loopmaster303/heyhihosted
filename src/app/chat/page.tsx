
"use client";
import React, { useEffect, useState } from 'react';
import { ChatProvider } from '@/components/ChatProvider';
import ChatInterface from '@/components/page/ChatInterface';
import AppLayout from '@/components/layout/AppLayout';
import EditTitleDialog from '@/components/dialogs/EditTitleDialog';
import CameraCaptureDialog from '@/components/dialogs/CameraCaptureDialog';
import { useChat } from '@/components/ChatProvider';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import PageLoader from '@/components/ui/PageLoader';
import ErrorBoundary from '@/components/ErrorBoundary';

function ChatPageContent() {
    const chat = useChat();
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return <PageLoader text="Chat wird geladen..." />;
    }

    // Get chat history from ChatProvider
    const chatHistory = chat.allConversations.filter(c => c.toolType === 'long language loops');

    return (
        <AppLayout
            onNewChat={chat.startNewChat}
            chatHistory={chatHistory}
            onSelectChat={chat.selectChat}
        >
            <div className="flex flex-col h-full">
                <ChatInterface />
            </div>
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
        </AppLayout>
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
