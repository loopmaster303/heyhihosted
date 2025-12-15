"use client";

import React, { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { ChatProvider, useChat } from '@/components/ChatProvider';
import ChatInterface from '@/components/page/ChatInterface';
import UnifiedImageTool from '@/components/tools/UnifiedImageTool';
import EditTitleDialog from '@/components/dialogs/EditTitleDialog';
import CameraCaptureDialog from '@/components/dialogs/CameraCaptureDialog';
import AppLayout from '@/components/layout/AppLayout';
import ChatInput from '@/components/chat/ChatInput';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import PageLoader from '@/components/ui/PageLoader';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useTypewriter } from '@/hooks/useTypewriter';
import { ChevronUp, Mic, Plus, Send, Settings2, Sparkles, ArrowLeft, Home, SmilePlus } from 'lucide-react';

// App States
type AppState = 'landing' | 'chat' | 'visualize';
type LandingMode = 'chat' | 'visualize';

interface UnifiedAppContentProps {
    initialState?: AppState;
}

function UnifiedAppContent({ initialState = 'landing' }: UnifiedAppContentProps) {
    const chat = useChat();
    const [userDisplayName] = useLocalStorageState<string>('userDisplayName', 'user');
    const [replicateToolPassword] = useLocalStorageState<string>('replicateToolPassword', '');

    const [isClient, setIsClient] = useState(false);
    const [appState, setAppState] = useState<AppState>(initialState);
    const [landingMode, setLandingMode] = useState<LandingMode>('chat');
    const [draftPrompt, setDraftPrompt] = useState('');
    const [phase, setPhase] = useState<'idle' | 'transitioning'>('idle');
    const advancedPanelRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Typewriter for landing
    const targetLine = useMemo(() => {
        const safeName = ((userDisplayName || 'user').trim() || 'user').toLowerCase();
        return `(!hey.hi = '${safeName}')`;
    }, [userDisplayName]);

    const { displayedText, isTyping, isComplete } = useTypewriter({
        text: targetLine,
        speed: 55,
        delay: 150,
        skipAnimation: !isClient || appState !== 'landing',
    });

    const canSubmit = draftPrompt.trim().length > 0 && phase === 'idle';

    const placeholder =
        landingMode === 'chat'
            ? 'Worüber möchtest du sprechen?'
            : 'Beschreib deine Idee – vielseitig, schnell, gut für Drafts, Skizzen, Comics, Manga und fotorealistische Experimente.';

    const rightCtaLabel = landingMode === 'chat' ? 'Senden' : 'Generate';
    const rightModelLabel = landingMode === 'chat' ? 'Claude' : 'GPT-Image';

    // Transition to Chat or Visualize
    const beginTransition = useCallback(() => {
        if (!canSubmit) return;

        setPhase('transitioning');

        // Allow animation to play
        window.setTimeout(() => {
            if (landingMode === 'chat') {
                // Set draft in chat input
                chat.setChatInputValue(draftPrompt.trim());
                setAppState('chat');
            } else {
                // Set draft for visualize via localStorage
                localStorage.setItem('unified-image-tool-draft', draftPrompt.trim());
                setAppState('visualize');
            }
            setPhase('idle');
            setDraftPrompt('');
        }, 400);
    }, [canSubmit, draftPrompt, landingMode, chat]);

    // Navigate back to landing
    const goToLanding = useCallback(() => {
        setAppState('landing');
    }, []);

    // Navigate to Chat
    const goToChat = useCallback(() => {
        setAppState('chat');
    }, []);

    // Navigate to Visualize
    const goToVisualize = useCallback(() => {
        setAppState('visualize');
    }, []);

    // Handle new chat (from sidebar)
    const handleNewChat = useCallback(() => {
        chat.startNewChat();
        setAppState('chat');
    }, [chat]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            beginTransition();
        }
    };

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
                <div className="relative flex flex-col items-center justify-center h-full px-4 py-10 overflow-hidden">
                    {/* Background hints (visualize) */}
                    {landingMode === 'visualize' && (
                        <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
                            <div className="absolute top-[44%] left-[14%] font-code text-3xl sm:text-4xl text-foreground/60">Prompt und</div>
                            <div className="absolute top-[52%] left-[14%] font-code text-3xl sm:text-4xl text-foreground/60">Modelvorschlag</div>
                            <div className="absolute top-[44%] right-[14%] font-code text-3xl sm:text-4xl text-foreground/60 text-right">Prompt und</div>
                            <div className="absolute top-[52%] right-[14%] font-code text-3xl sm:text-4xl text-foreground/60 text-right">Modelvorschlag</div>
                        </div>
                    )}

                    <div
                        className={cn(
                            'relative w-full max-w-4xl flex flex-col items-center transition-transform duration-500 ease-out',
                            phase === 'transitioning' && 'translate-y-16 opacity-90'
                        )}
                    >
                        {/* Hero / Typewriter */}
                        <div className="mb-6 font-code text-4xl sm:text-5xl md:text-6xl font-bold text-center">
                            <span className="text-transparent bg-gradient-to-r from-purple-300 to-purple-600 bg-clip-text">
                                {displayedText}
                                {isTyping && <span className="animate-pulse">|</span>}
                            </span>
                        </div>

                        {/* Toggle line */}
                        {isComplete && (
                            <div className="mb-6 text-center text-muted-foreground/80 text-base sm:text-lg">
                                <span>Hier </span>
                                <button
                                    onClick={() => setLandingMode('chat')}
                                    className={cn(
                                        'px-3 py-1 rounded-md border transition-colors',
                                        landingMode === 'chat'
                                            ? 'border-purple-500/80 text-foreground shadow-[0_0_0_1px_rgba(168,85,247,0.35)]'
                                            : 'border-border/60 hover:border-purple-500/40'
                                    )}
                                >
                                    Chatten
                                </button>
                                <span> und da </span>
                                <button
                                    onClick={() => setLandingMode('visualize')}
                                    className={cn(
                                        'px-3 py-1 rounded-md border transition-colors',
                                        landingMode === 'visualize'
                                            ? 'border-purple-500/80 text-foreground shadow-[0_0_0_1px_rgba(168,85,247,0.35)]'
                                            : 'border-border/60 hover:border-purple-500/40'
                                    )}
                                >
                                    Visualisieren
                                </button>
                            </div>
                        )}

                        {/* Prompt Card */}
                        {isComplete && (
                            <div className="w-full relative">
                                {landingMode === 'visualize' ? (
                                    // Gemini-style input for Visualize mode
                                    <div className="bg-white dark:bg-[#252525] rounded-2xl shadow-xl p-3">
                                        <Textarea
                                            value={draftPrompt}
                                            onChange={(e) => setDraftPrompt(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder={placeholder}
                                            className="w-full bg-transparent text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none p-2 m-0 leading-tight resize-none overflow-auto min-h-[80px] max-h-[220px]"
                                            rows={1}
                                            disabled={phase === 'transitioning'}
                                            style={{ lineHeight: '1.5rem', fontSize: '17px' }}
                                        />

                                        <div className="flex w-full items-center justify-between gap-1 mt-2">
                                            {/* Left Side: Settings + Plus Menu */}
                                            <div className="flex items-center gap-0">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white"
                                                    onClick={() => {
                                                        // Toggle settings panel (placeholder for now)
                                                        console.log('Settings clicked');
                                                    }}
                                                    aria-label="Settings"
                                                >
                                                    <Settings2 className="w-[20px] h-[20px]" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white"
                                                    onClick={() => {
                                                        // Handle file upload (placeholder for now)
                                                        console.log('Plus clicked');
                                                    }}
                                                    aria-label="Plus"
                                                >
                                                    <Plus className="w-[20px] h-[20px]" />
                                                </Button>
                                            </div>

                                            {/* Right Side: Model + Enhance + Generate */}
                                            <div className="flex items-center gap-0">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="group rounded-lg h-14 w-auto px-3 md:h-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white min-w-[120px] max-w-[200px]"
                                                    onClick={() => {
                                                        // Toggle model selector (placeholder for now)
                                                        console.log('Model selector clicked');
                                                    }}
                                                    aria-label="Model"
                                                >
                                                    <span className="text-xs md:text-sm font-medium">{rightModelLabel}</span>
                                                </Button>

                                                {landingMode === 'visualize' && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        className="group rounded-lg h-14 w-auto px-3 md:h-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white"
                                                        onClick={() => {
                                                            // Handle enhance prompt (placeholder for now)
                                                            console.log('Enhance clicked');
                                                        }}
                                                        aria-label="Enhance"
                                                    >
                                                        <span className="text-xs md:text-sm font-medium">
                                                            <Sparkles className="w-4 h-4 mr-2 inline" />
                                                            Enhance
                                                        </span>
                                                    </Button>
                                                )}

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={beginTransition}
                                                    className={cn(
                                                        'group rounded-lg h-14 w-auto px-4 md:h-12 transition-colors duration-300',
                                                        canSubmit ? 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300' : 'text-gray-600 dark:text-gray-200'
                                                    )}
                                                    disabled={!canSubmit}
                                                    aria-label={rightCtaLabel}
                                                >
                                                    <span className="text-xs md:text-sm font-medium">
                                                        {rightCtaLabel}
                                                    </span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Chat mode - using actual ChatInput component
                                    <ChatInput
                                        onSendMessage={(message) => {
                                            setDraftPrompt(message);
                                            beginTransition();
                                        }}
                                        isLoading={phase === 'transitioning'}
                                        uploadedFilePreviewUrl={null}
                                        onFileSelect={() => { }}
                                        onClearUploadedImage={() => { }}
                                        isLongLanguageLoopActive={false}
                                        inputValue={draftPrompt}
                                        onInputChange={setDraftPrompt}
                                        isImageMode={false}
                                        onToggleImageMode={() => { }}
                                        chatTitle=""
                                        onToggleHistoryPanel={() => { }}
                                        onToggleGalleryPanel={() => { }}
                                        onToggleAdvancedPanel={() => { }}
                                        isAdvancedPanelOpen={false}
                                        advancedPanelRef={advancedPanelRef}
                                        isHistoryPanelOpen={false}
                                        isGalleryPanelOpen={false}
                                        allConversations={[]}
                                        activeConversation={null}
                                        selectChat={() => { }}
                                        closeHistoryPanel={() => { }}
                                        requestEditTitle={() => { }}
                                        deleteChat={() => { }}
                                        startNewChat={() => { }}
                                        closeAdvancedPanel={() => { }}
                                        toDate={() => new Date()}
                                        selectedModelId="mistral-large"
                                        handleModelChange={() => { }}
                                        selectedResponseStyleName="Basic"
                                        handleStyleChange={() => { }}
                                        selectedVoice="English_ConfidentWoman"
                                        handleVoiceChange={() => { }}
                                        webBrowsingEnabled={false}
                                        onToggleWebBrowsing={() => { }}
                                        mistralFallbackEnabled={true}
                                        onToggleMistralFallback={() => { }}
                                        isRecording={false}
                                        isTranscribing={false}
                                        startRecording={() => { }}
                                        stopRecording={() => { }}
                                        openCamera={() => { }}
                                        availableImageModels={[]}
                                        selectedImageModelId="flux-2-pro"
                                        handleImageModelChange={() => { }}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
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
