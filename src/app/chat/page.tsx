
"use client";
import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
    const searchParams = useSearchParams();
    const [isClient, setIsClient] = useState(false);

    const draft = useMemo(() => {
        const value = searchParams.get('draft');
        return value ? value : '';
    }, [searchParams]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Prefill draft prompt from landing (no auto-send)
    useEffect(() => {
        if (!draft) return;
        // Set input in provider
        chat.setChatInputValue(draft);
        // Clean URL to avoid re-prefill on refresh
        try {
            const url = new URL(window.location.href);
            url.searchParams.delete('draft');
            window.history.replaceState({}, '', url.toString());
        } catch {
            // ignore
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft]);

    if (!isClient) {
        return <PageLoader text="Chat wird geladen..." />;
    }

    // Get chat history from ChatProvider
    const chatHistory = chat.allConversations.filter(c => c.toolType === 'long language loops');

    return (
        <AppLayout
            onNewChat={chat.startNewChat}
            onToggleHistoryPanel={chat.toggleHistoryPanel}
            onToggleGalleryPanel={chat.toggleGalleryPanel}
            currentPath="/chat"
            chatHistory={chatHistory}
            onSelectChat={chat.selectChat}
            onRequestEditTitle={chat.requestEditTitle}
            onDeleteChat={chat.deleteChat}
            isHistoryPanelOpen={chat.isHistoryPanelOpen}
            isGalleryPanelOpen={chat.isGalleryPanelOpen}
            allConversations={chat.allConversations}
            activeConversation={chat.activeConversation}
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
                <Suspense fallback={<PageLoader text="Chat wird geladen..." />}>
                    <ChatPageContent />
                </Suspense>
            </ChatProvider>
        </ErrorBoundary>
    );
}
