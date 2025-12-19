"use client";

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import ChatInput from '@/components/chat/ChatInput';
import VisualizeInputContainer from '@/components/tools/VisualizeInputContainer';
import { cn } from '@/lib/utils';
import { useUnifiedImageToolState } from '@/hooks/useUnifiedImageToolState';
import { useLanguage } from '@/components/LanguageProvider';

type LandingMode = 'chat' | 'visualize';

interface LandingViewProps {
    userDisplayName: string;
    onNavigateToChat: (initialMessage: string) => void;
    onNavigateToVisualize: (draftPrompt: string) => void;
    selectedModelId: string;
    onModelChange: (modelId: string) => void;
    landingMode: LandingMode;
    setLandingMode: (mode: LandingMode) => void;
}

const LandingView: React.FC<LandingViewProps> = ({
    userDisplayName,
    onNavigateToChat,
    onNavigateToVisualize,
    selectedModelId,
    onModelChange,
    landingMode,
    setLandingMode
}) => {
    const { t } = useLanguage();
    const [chatDraft, setChatDraft] = useState(''); // Separate draft for chat
    const [phase, setPhase] = useState<'idle' | 'transitioning'>('idle');
    const [showInputContainer, setShowInputContainer] = useState(false);

    // Use shared hook for Visualize Mode
    const visualizeState = useUnifiedImageToolState();

    const advancedPanelRef = React.useRef<HTMLDivElement>(null);


    const canSubmit = (landingMode === 'chat' ? chatDraft.trim().length > 0 : visualizeState.prompt.trim().length > 0) && phase === 'idle';

    // Show input container after a delay (synced with particle formation)
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowInputContainer(true);
        }, 1200); // Show after particles start forming

        return () => {
            clearTimeout(timer);
        };
    }, []);

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
            {/* Particle Header - Moved to Layout for persistence */}

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
                                selectedModelId={selectedModelId}
                                handleModelChange={onModelChange}
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
