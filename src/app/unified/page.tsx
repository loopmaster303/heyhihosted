"use client";

import React, { useCallback, useEffect, useState, Suspense, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { ChatProvider, useChat } from '@/components/ChatProvider';
import ChatInterface from '@/components/page/ChatInterface';
import UnifiedImageTool from '@/components/tools/UnifiedImageTool';
import EditTitleDialog from '@/components/dialogs/EditTitleDialog';
import CameraCaptureDialog from '@/components/dialogs/CameraCaptureDialog';
import AppLayout from '@/components/layout/AppLayout';
import PageLoader from '@/components/ui/PageLoader';
import ErrorBoundary from '@/components/ErrorBoundary';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { DEFAULT_POLLINATIONS_MODEL_ID } from '@/config/chat-options';
import { useUnifiedImageToolState } from '@/hooks/useUnifiedImageToolState';
import LandingView from '@/components/page/LandingView';
import { cn } from '@/lib/utils';

// App States
type AppState = 'landing' | 'chat' | 'visualize';

interface UnifiedAppContentProps {
    initialState?: AppState;
}

function UnifiedAppContent({ initialState = 'landing' }: UnifiedAppContentProps) {
    const chat = useChat();
    const visualizeToolState = useUnifiedImageToolState();
    const pathname = usePathname();
    const [userDisplayName] = useLocalStorageState<string>('userDisplayName', 'user');
    const [replicateToolPassword] = useLocalStorageState<string>('replicateToolPassword', '');

    const [isClient, setIsClient] = useState(false);
    const [appState, setAppState] = useState<AppState>(initialState);
    const [landingMode, setLandingMode] = useState<'chat' | 'visualize'>('chat');
    const [landingSelectedModelId, setLandingSelectedModelId] = useState<string>(DEFAULT_POLLINATIONS_MODEL_ID);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // URL-based state initialization - set appState based on pathname on FIRST mount only
    useEffect(() => {
        if (!isClient) return;

        // Only set initial state based on URL, don't override user navigation
        if (pathname === '/chat') {
            setAppState('chat');
        } else if (pathname === '/visualizepro') {
            setAppState('visualize');
        }
        // else stay on landing (default)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isClient]); // Intentionally only depend on isClient to run once on mount

    // Listen for prompt reuse from gallery - should navigate to VisualizePro
    useEffect(() => {
        const handler = (event: Event) => {
            const custom = event as CustomEvent<string>;
            if (typeof custom.detail === 'string') {
                // Set prompt directly on the shared state and navigate
                visualizeToolState.setPrompt(custom.detail);
                setAppState('visualize');
            }
        };
        window.addEventListener('sidebar-reuse-prompt', handler);
        return () => window.removeEventListener('sidebar-reuse-prompt', handler);
    }, [visualizeToolState.setPrompt]);

    // Navigate to Chat
    const handleNavigateToChat = useCallback((initialMessage: string) => {
        if (initialMessage) {
            chat.setChatInputValue(initialMessage);
        }
        chat.startNewChat(landingSelectedModelId);
        setAppState('chat');
    }, [chat, landingSelectedModelId]);

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
            appState={appState}
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
            // Chat Model Props
            selectedModelId={appState === 'landing' ? landingSelectedModelId : (chat.activeConversation?.selectedModelId || 'claude')}
            onModelChange={appState === 'landing' ? setLandingSelectedModelId : chat.handleModelChange}
            // Visualize Model Props
            visualSelectedModelId={visualizeToolState.selectedModelId}
            onVisualModelChange={visualizeToolState.setSelectedModelId}
            isVisualModelSelectorOpen={visualizeToolState.isModelSelectorOpen}
            onVisualModelSelectorToggle={() => visualizeToolState.setIsModelSelectorOpen(!visualizeToolState.isModelSelectorOpen)}
        >
            {/* Landing State */}
            {appState === 'landing' && (
                <LandingView
                    userDisplayName={userDisplayName}
                    onNavigateToChat={handleNavigateToChat}
                    onNavigateToVisualize={handleNavigateToVisualize}
                    selectedModelId={landingSelectedModelId}
                    onModelChange={setLandingSelectedModelId}
                    landingMode={landingMode}
                    setLandingMode={setLandingMode}
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
                    <UnifiedImageTool password={replicateToolPassword} sharedToolState={visualizeToolState} />
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
