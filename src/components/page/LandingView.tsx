"use client";

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import ChatInput from '@/components/chat/ChatInput';
import VisualizeInputContainer from '@/components/tools/VisualizeInputContainer';
import { cn } from '@/lib/utils';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useUnifiedImageToolState } from '@/hooks/useUnifiedImageToolState';
import { useLanguage } from '@/components/LanguageProvider';

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
    const { t } = useLanguage();
    const [landingMode, setLandingMode] = useState<LandingMode>('chat');
    const [chatDraft, setChatDraft] = useState(''); // Separate draft for chat
    const [phase, setPhase] = useState<'idle' | 'transitioning'>('idle');
    const [landingSelectedModelId, setLandingSelectedModelId] = useState<string>('claude');
    const [showInputContainer, setShowInputContainer] = useState(false);

    // Use shared hook for Visualize Mode
    const visualizeState = useUnifiedImageToolState();

    // Sync visualize prompt with local draft if needed, or just use hook's prompt
    // Hook has its own 'prompt' state.

    const advancedPanelRef = React.useRef<HTMLDivElement>(null);

    // Typewriter for main line
    const targetLine = useMemo(() => {
        const safeName = ((userDisplayName || 'user').trim() || 'user').toLowerCase();
        return `(!hey.hi = '${safeName}')`;
    }, [userDisplayName]);

    const { displayedText, isTyping, isComplete } = useTypewriter({
        text: targetLine,
        speed: 200, // Even slower for terminal effect
        delay: 150,
        skipAnimation: false,
    });

    // Typewriter for subtitle (starts after main line completes)
    const subtitleText = t('home.subtitle');
    const { displayedText: displayedSubtitle, isTyping: isSubtitleTyping, isComplete: isSubtitleComplete } = useTypewriter({
        text: subtitleText,
        speed: 50, // Faster for subtitle
        delay: isComplete ? 300 : 999999, // Start after main text completes
        skipAnimation: false,
    });

    const canSubmit = (landingMode === 'chat' ? chatDraft.trim().length > 0 : visualizeState.prompt.trim().length > 0) && phase === 'idle';

    // Show input container with good timing
    useEffect(() => {
        if (isTyping) {
            const halfwayPoint = (targetLine.length / 2) * 200; // speed * half the characters
            const timer = setTimeout(() => {
                setShowInputContainer(true);
            }, halfwayPoint);
            return () => clearTimeout(timer);
        }
        if (isComplete) {
            setShowInputContainer(true);
        }
    }, [isTyping, isComplete, targetLine.length]);

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
        <div className="relative h-full px-4 py-10 overflow-hidden">
            {/* Terminal Header - Always visible, responsive sizing */}
            <div className="absolute top-6 sm:top-8 md:top-10 left-4 max-w-4xl">
                {/* Hero / Typewriter - Terminal style, top-left aligned */}
                <div className="mb-4 font-code text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-left">
                    <span className="text-transparent bg-gradient-to-r bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, hsl(330 70% 75%), hsl(330 65% 62%))' }}>
                        {displayedText}
                        {isTyping && <span className="animate-pulse">|</span>}
                    </span>
                </div>

                {/* Subtitle - typewriter effect, HIDDEN ON MOBILE */}
                {isComplete && (
                    <div className="hidden md:block mb-12 text-left max-w-2xl mt-8">
                        <p className="text-muted-foreground/80 text-sm md:text-base leading-relaxed font-mono">
                            {displayedSubtitle}
                            {isSubtitleTyping && <span className="animate-pulse">|</span>}
                        </p>
                    </div>
                )}

            </div>

            {/* Input Container - Vertically centered on mobile, independent of text on desktop */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={cn(
                    "w-full max-w-4xl px-4 transition-opacity duration-[2000ms] ease-out pointer-events-auto",
                    showInputContainer ? "opacity-100" : "opacity-0"
                )}>
                    {/* Toggle line - at top of input container */}
                    {showInputContainer && (
                        <div className="mb-6 flex items-center justify-start gap-2 sm:gap-3 text-muted-foreground/80 text-sm sm:text-base md:text-lg flex-wrap">
                            <span className="hidden sm:inline">Lass uns</span>
                            <button
                                onClick={() => setLandingMode('chat')}
                                className={cn(
                                    'px-3 sm:px-4 py-1.5 rounded-full border transition-all duration-300 text-sm sm:text-base',
                                    landingMode === 'chat'
                                        ? 'bg-primary/10 border-primary/50 text-foreground shadow-[0_0_10px_rgba(232,154,184,0.2)]'
                                        : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
                                )}
                            >
                                {t('home.mode.chat')}
                            </button>
                            <span className="hidden sm:inline">oder</span>
                            <button
                                onClick={() => setLandingMode('visualize')}
                                className={cn(
                                    'px-3 sm:px-4 py-1.5 rounded-full border transition-all duration-300 text-sm sm:text-base',
                                    landingMode === 'visualize'
                                        ? 'bg-primary/10 border-primary/50 text-foreground shadow-[0_0_10px_rgba(232,154,184,0.2)]'
                                        : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
                                )}
                            >
                                {t('home.mode.visualize')}
                            </button>
                        </div>
                    )}

                    {showInputContainer && (
                        landingMode === 'visualize' ? (
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
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default LandingView;
