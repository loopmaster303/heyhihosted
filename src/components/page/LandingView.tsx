"use client";

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import ChatInput from '@/components/chat/ChatInput';
import VisualizeInputContainer from '@/components/tools/VisualizeInputContainer';
import { cn } from '@/lib/utils';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useUnifiedImageToolState } from '@/hooks/useUnifiedImageToolState';

type LandingMode = 'chat' | 'visualize';

interface LandingViewProps {
    userDisplayName: string;
    onNavigateToChat: (initialMessage: string) => void;
    onNavigateToVisualize: (draftPrompt: string) => void;
}

const LandingView: React.FC<LandingViewProps> = ({
    userDisplayName,
    onNavigateToChat,
    onNavigateToVisualize
}) => {
    const [landingMode, setLandingMode] = useState<LandingMode>('chat');
    const [chatDraft, setChatDraft] = useState(''); // Separate draft for chat
    const [phase, setPhase] = useState<'idle' | 'transitioning'>('idle');
    const [landingSelectedModelId, setLandingSelectedModelId] = useState<string>('claude');

    // Use shared hook for Visualize Mode
    const visualizeState = useUnifiedImageToolState();

    // Sync visualize prompt with local draft if needed, or just use hook's prompt
    // Hook has its own 'prompt' state.

    const advancedPanelRef = React.useRef<HTMLDivElement>(null);

    // Typewriter
    const targetLine = useMemo(() => {
        const safeName = ((userDisplayName || 'user').trim() || 'user').toLowerCase();
        return `(!hey.hi = '${safeName}')`;
    }, [userDisplayName]);

    const { displayedText, isTyping, isComplete } = useTypewriter({
        text: targetLine,
        speed: 55,
        delay: 150,
        skipAnimation: false,
    });

    const canSubmit = (landingMode === 'chat' ? chatDraft.trim().length > 0 : visualizeState.prompt.trim().length > 0) && phase === 'idle';

    // Transition to Chat or Visualize
    const beginTransition = useCallback(() => {
        if (!canSubmit) return;

        setPhase('transitioning');

        // Allow animation to play
        window.setTimeout(() => {
            if (landingMode === 'chat') {
                onNavigateToChat(chatDraft.trim());
            } else {
                // Persist full visualize state
                const stateToPersist = {
                    prompt: visualizeState.prompt,
                    selectedModelId: visualizeState.selectedModelId,
                    formFields: visualizeState.formFields,
                    uploadedImages: visualizeState.uploadedImages
                };
                localStorage.setItem('unified-image-tool-state', JSON.stringify(stateToPersist));

                onNavigateToVisualize(visualizeState.prompt.trim());
            }
        }, 400);
    }, [canSubmit, chatDraft, landingMode, onNavigateToChat, onNavigateToVisualize, visualizeState]);

    return (
        <div className="relative flex flex-col items-center justify-center h-full px-4 py-10 overflow-hidden">


            <div
                className={cn(
                    'relative w-full max-w-4xl flex flex-col items-center transition-transform duration-500 ease-out',
                    phase === 'transitioning' && 'translate-y-16 opacity-90'
                )}
            >
                {/* Hero / Typewriter */}
                <div className="mb-6 font-code text-4xl sm:text-5xl md:text-6xl font-bold text-center">
                    <span className="text-transparent bg-gradient-to-r bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, hsl(330 70% 75%), hsl(330 65% 62%))' }}>
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
                                    ? 'border-primary/80 text-foreground shadow-[0_0_0_1px_rgba(232,154,184,0.35)]'
                                    : 'border-border/60 hover:border-primary/40'
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
                                    ? 'border-primary/80 text-foreground shadow-[0_0_0_1px_rgba(232,154,184,0.35)]'
                                    : 'border-border/60 hover:border-primary/40'
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
                            // Visualize mode
                            <VisualizeInputContainer
                                // Spread hook state
                                {...visualizeState}
                                // Fix prop mapping
                                onPromptChange={visualizeState.setPrompt}
                                onModelChange={visualizeState.setSelectedModelId}
                                onModelSelectorToggle={() => visualizeState.setIsModelSelectorOpen(!visualizeState.isModelSelectorOpen)}
                                onConfigPanelToggle={() => visualizeState.setIsConfigPanelOpen(!visualizeState.isConfigPanelOpen)}
                                onImageUploadToggle={() => visualizeState.setIsImageUploadOpen(!visualizeState.isImageUploadOpen)}
                                onEnhancePrompt={visualizeState.handleEnhancePrompt}

                                // Overrides
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    beginTransition();
                                }}
                                loading={phase === 'transitioning'}
                                disabled={phase === 'transitioning'}
                            />
                        ) : (
                            // Chat mode
                            <ChatInput
                                onSendMessage={(message) => {
                                    setChatDraft(message);
                                    beginTransition();
                                }}
                                isLoading={phase === 'transitioning'}
                                uploadedFilePreviewUrl={null}
                                onFileSelect={() => { }}
                                onClearUploadedImage={() => { }}
                                isLongLanguageLoopActive={false}
                                inputValue={chatDraft}
                                onInputChange={setChatDraft}
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
                                selectedModelId={landingSelectedModelId}
                                handleModelChange={(modelId) => setLandingSelectedModelId(modelId)}
                                selectedResponseStyleName="Basic"
                                handleStyleChange={() => { }}
                                selectedVoice="English_ConfidentWoman"
                                handleVoiceChange={() => { }}
                                webBrowsingEnabled={false}
                                onToggleWebBrowsing={() => { }}
                                mistralFallbackEnabled={false}
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
    );
};

export default LandingView;
