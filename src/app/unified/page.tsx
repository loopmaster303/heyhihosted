"use client";

import React, { useCallback, useEffect, useState, Suspense } from 'react';
import { ChatProvider, useChat } from '@/components/ChatProvider';
import ChatInterface from '@/components/page/ChatInterface';
import UnifiedImageTool from '@/components/tools/UnifiedImageTool';
import EditTitleDialog from '@/components/dialogs/EditTitleDialog';
import CameraCaptureDialog from '@/components/dialogs/CameraCaptureDialog';
import AppLayout from '@/components/layout/AppLayout';
import PageLoader from '@/components/ui/PageLoader';
import ErrorBoundary from '@/components/ErrorBoundary';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import LandingView from '@/components/page/LandingView';

// App States
type AppState = 'landing' | 'chat' | 'visualize';

interface UnifiedAppContentProps {
    initialState?: AppState;
}

function UnifiedAppContent({ initialState = 'landing' }: UnifiedAppContentProps) {
    const chat = useChat();
    const [userDisplayName] = useLocalStorageState<string>('userDisplayName', 'user');
    const [replicateToolPassword] = useLocalStorageState<string>('replicateToolPassword', '');

    const [isClient, setIsClient] = useState(false);
    const [appState, setAppState] = useState<AppState>(initialState);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Navigate to Chat
    const handleNavigateToChat = useCallback((initialMessage: string) => {
        if (initialMessage) {
            chat.setChatInputValue(initialMessage);
        }
        setAppState('chat');
    }, [chat]);

    // Navigate to Visualize
    const handleNavigateToVisualize = useCallback((draftPrompt: string) => {
        if (draftPrompt) {
            localStorage.setItem('unified-image-tool-draft', draftPrompt);
        }
        setAppState('visualize');
    }, []);

    // Handle new chat (from sidebar) - reset to landing
    const handleNewChat = useCallback(() => {
        chat.startNewChat();
        setAppState('landing');
    }, [chat]);

    if (!isClient) {
        return <PageLoader text="App wird geladen..." />;
    }

    // Get current path for sidebar
    const currentPath = appState === 'landing' ? '/' : appState === 'chat' ? '/chat' : '/visualizepro';

    // Get chat history from ChatProvider
    const chatHistory = chat.allConversations.filter(c => c.toolType === 'long language loops');

    return (
        <AppLayout
            onNewChat={handleNewChat}
            onToggleHistoryPanel={chat.toggleHistoryPanel}
            onToggleGalleryPanel={chat.toggleGalleryPanel}
            currentPath={currentPath}
            chatHistory={chatHistory}
            onSelectChat={(id) => {
                chat.selectChat(id);
                setAppState('chat');
            }}
            onRequestEditTitle={chat.requestEditTitle}
            onDeleteChat={chat.deleteChat}
            isHistoryPanelOpen={chat.isHistoryPanelOpen}
            isGalleryPanelOpen={chat.isGalleryPanelOpen}
            allConversations={chat.allConversations}
            activeConversation={chat.activeConversation}
        >
            {/* Landing State */}
            {appState === 'landing' && (
                <LandingView
                    userDisplayName={userDisplayName}
                    onNavigateToChat={handleNavigateToChat}
                    onNavigateToVisualize={handleNavigateToVisualize}
                />
            )}

            {/* Chat State */}
            {appState === 'chat' && (
                <div className="flex flex-col h-full">
                    <ChatInterface />
                </div>
            )}

            {/* Visualize State */}
            {appState === 'visualize' && (
                <div className="flex flex-col h-full bg-background text-foreground">
                    <UnifiedImageTool password={replicateToolPassword} />
                </div>
            )}

            {/* Dialogs */}
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

export default function UnifiedAppPage() {
    return (
        <ErrorBoundary
            fallbackTitle="App konnte nicht geladen werden"
            fallbackMessage="Es gab ein Problem beim Laden der App. Bitte versuche es erneut."
        >
            <ChatProvider>
                <Suspense fallback={<PageLoader text="App wird geladen..." />}>
                    <UnifiedAppContent />
                </Suspense>
            </ChatProvider>
        </ErrorBoundary>
    );
}
