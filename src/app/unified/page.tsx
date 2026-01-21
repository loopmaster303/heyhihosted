"use client";

import React, { useCallback, useEffect, useState, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { ChatProvider, useChat } from '@/components/ChatProvider';
import ChatInterface from '@/components/page/ChatInterface';
import CameraCaptureDialog from '@/components/dialogs/CameraCaptureDialog';
import AppLayout from '@/components/layout/AppLayout';
import PageLoader from '@/components/ui/PageLoader';
import ErrorBoundary from '@/components/ErrorBoundary';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { DEFAULT_POLLINATIONS_MODEL_ID } from '@/config/chat-options';
import { useUnifiedImageToolState } from '@/hooks/useUnifiedImageToolState';
import LandingView from '@/components/page/LandingView';

// App States - simplified: no more 'visualize' state
type AppState = 'landing' | 'chat';

interface UnifiedAppContentProps {
    initialState?: AppState;
}

function UnifiedAppContent({ initialState = 'landing' }: UnifiedAppContentProps) {
    const chat = useChat();
    const visualizeToolState = useUnifiedImageToolState();
    const pathname = usePathname();
    const [defaultTextModelId] = useLocalStorageState<string>('defaultTextModelId', DEFAULT_POLLINATIONS_MODEL_ID);

    const [isClient, setIsClient] = useState(false);
    const [appState, setAppState] = useState<AppState>(initialState);
    const [landingSelectedModelId, setLandingSelectedModelId] = useState<string>(defaultTextModelId);
    const [pendingMessage, setPendingMessage] = useState<{ text: string, isImage: boolean } | null>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Watch for conversation changes to flush pending message
    useEffect(() => {
        if (!isClient || !pendingMessage || !chat.activeConversation?.id) return;
        
        // Only flush if we are in chat state and the conversation is empty (newly created)
        if (appState === 'chat' && chat.activeConversation.messages.length === 0) {
            const { text, isImage } = pendingMessage;
            setPendingMessage(null); // Clear first to avoid double-send
            chat.sendMessage(text, { isImageModeIntent: isImage });
        }
    }, [chat.activeConversation?.id, chat.sendMessage, pendingMessage, appState, isClient]);

    useEffect(() => {
        if (!isClient) return;
        setLandingSelectedModelId(defaultTextModelId);
    }, [defaultTextModelId, isClient]);

    // URL-based state initialization
    useEffect(() => {
        if (!isClient) return;

        if (pathname === '/chat') {
            setAppState('chat');
        }
        // Redirect visualize to chat with image mode if needed, or just stay here
        else if (pathname === '/visualizepro') {
            setAppState('chat');
            // Hier könnte man noch chat.toggleImageMode() triggern
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isClient]);

    // Navigate to Chat and send message
    const handleNavigateToChat = useCallback((initialMessage: string) => {
        if (!initialMessage) return;
        
        // Capture current state from Landing Page toggles (which affect activeConversation or global state)
        const isImageModeActive = chat.isImageMode;
        const isWebBrowsingActive = chat.webBrowsingEnabled;
        const isCodeModeActive = !!chat.activeConversation?.isCodeMode;

        // 1. Buffer the message
        setPendingMessage({ text: initialMessage, isImage: isImageModeActive });
        
        // 2. Start new chat with CURRENT Landing State flags
        chat.startNewChat({
            initialModelId: landingSelectedModelId,
            isImageMode: isImageModeActive,
            webBrowsingEnabled: isWebBrowsingActive,
            isCodeMode: isCodeModeActive
        });
        
        setAppState('chat');
    }, [chat, landingSelectedModelId]);


    // Handle new chat (from sidebar) - reset to landing
    const handleNewChat = useCallback(() => {
        chat.startNewChat();
        setAppState('landing');
    }, [chat]);

    if (!isClient) {
        return <PageLoader text="App wird geladen..." />;
    }

    // Get current path for sidebar
    const currentPath = appState === 'landing' ? '/' : '/chat';

    // Get chat history from ChatProvider
    const chatHistory = chat.allConversations.filter(c => c.toolType === 'long language loops');

    return (
        <AppLayout
            appState={appState}
            onNewChat={handleNewChat}
            onToggleHistoryPanel={chat.toggleHistoryPanel}
            currentPath={currentPath}
            chatHistory={chatHistory}
            onSelectChat={(id) => {
                chat.selectChat(id);
                setAppState('chat');
            }}
            onDeleteChat={chat.deleteChat}
            isHistoryPanelOpen={chat.isHistoryPanelOpen}
            allConversations={chat.allConversations}
            activeConversation={chat.activeConversation}
            isAiResponding={chat.isAiResponding}
            // Chat Model Props
            selectedModelId={appState === 'landing' ? landingSelectedModelId : (chat.activeConversation?.selectedModelId || 'claude')}
            onModelChange={appState === 'landing' ? setLandingSelectedModelId : chat.handleModelChange}
            selectedResponseStyleName={chat.activeConversation?.selectedResponseStyleName}
            selectedImageModelId={visualizeToolState.selectedModelId}
        >
            {/* Landing State */}
            {appState === 'landing' && (
                <LandingView
                    onNavigateToChat={handleNavigateToChat}
                    selectedModelId={landingSelectedModelId}
                    onModelChange={setLandingSelectedModelId}
                    visualizeToolState={visualizeToolState}
                />
            )}

            {/* Chat State */}
            {appState === 'chat' && (
                <div className="flex flex-col h-full">
                    <ChatInterface visualizeToolState={visualizeToolState} />
                </div>
            )}

            {/* Dialogs */}
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
