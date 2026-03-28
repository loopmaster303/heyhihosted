"use client";

import React, { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ChatInput from '@/components/chat/ChatInput';
import FlowField from '@/components/ui/FlowField';
import { useChatComposer, useChatConversation, useChatMedia, useChatModes } from '@/components/ChatProvider';
import { useLanguage } from '@/components/LanguageProvider';
import type { ComposeMusicActions, ComposeMusicState } from '@/hooks/useComposeMusicState';
import type { UnifiedImageToolState } from '@/hooks/useUnifiedImageToolState';
import { cn } from '@/lib/utils';

interface LandingViewProps {
    onNavigateToChat: (initialMessage: string) => void;
    selectedModelId: string;
    onModelChange: (modelId: string) => void;
    visualizeToolState: UnifiedImageToolState;
    composeToolState: ComposeMusicState & ComposeMusicActions;
}

const LandingView: React.FC<LandingViewProps> = ({
    onNavigateToChat,
    selectedModelId,
    onModelChange,
    visualizeToolState,
    composeToolState,
}) => {
    const composer = useChatComposer();
    const conversation = useChatConversation();
    const media = useChatMedia();
    const modes = useChatModes();
    const { language } = useLanguage();
    const isEn = language === 'en';
    const [showInputContainer, setShowInputContainer] = useState(false);
    const [viewportHeight, setViewportHeight] = useState(() =>
        typeof window !== 'undefined' ? window.innerHeight : 900
    );
    const isShortViewport = viewportHeight < 820;
    const isVeryShortViewport = viewportHeight < 700;

    // Show input container after a delay (synced with particle formation)
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowInputContainer(true);
        }, 1200);

        return () => {
            clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        const syncViewportHeight = () => {
            setViewportHeight(window.innerHeight);
        };
        syncViewportHeight();
        window.addEventListener('resize', syncViewportHeight);
        return () => window.removeEventListener('resize', syncViewportHeight);
    }, []);

    // Handle send - navigate to chat regardless, image mode state is preserved
    const handleSendMessage = useCallback((message: string) => {
        if (!message.trim()) return;

        // Set the prompt in visualizeToolState if in image mode
        if (modes.isImageMode) {
            visualizeToolState.setPrompt(message.trim());
        }
        // Navigate to chat - the isImageMode flag is already set so ChatInterface will handle it
        onNavigateToChat(message.trim());
    }, [modes.isImageMode, visualizeToolState, onNavigateToChat]);

    // Compose submit on landing: navigate to chat (compose will be active)
    const handleComposeSubmit = useCallback((e?: React.FormEvent) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        if (!composer.chatInputValue.trim()) return;
        onNavigateToChat(composer.chatInputValue.trim());
    }, [composer.chatInputValue, onNavigateToChat]);

    return (
        <div
            className={cn(
                "relative h-full px-4 overflow-hidden",
                isVeryShortViewport ? "py-4" : isShortViewport ? "py-6" : "py-10"
            )}
        >
            <FlowField isTyping={composer.chatInputValue.length > 0} isActive={true} />
            <div
                className={cn(
                    "absolute inset-0 flex flex-col items-center pointer-events-none px-4",
                    isVeryShortViewport
                        ? "justify-end pb-4"
                        : isShortViewport
                            ? "justify-end pb-8 sm:pb-10"
                            : "justify-center"
                )}
            >
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{
                        opacity: showInputContainer ? 1 : 0,
                        y: showInputContainer ? 0 : 30
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={cn(
                        "w-full pointer-events-auto flex flex-col items-center",
                        isVeryShortViewport
                            ? "max-w-3xl gap-1.5"
                            : isShortViewport
                                ? "max-w-4xl gap-2"
                                : "max-w-4xl gap-3"
                    )}
                >
                    {/* ChatInput Bar */}
                    <div className="w-full">
                        {showInputContainer && (
                            <ChatInput
                                onSendMessage={handleSendMessage}
                                isLoading={composer.isAiResponding}
                                uploadedFilePreviewUrl={conversation.activeConversation?.uploadedFilePreview || null}
                                onFileSelect={media.handleFileSelect}
                                isLongLanguageLoopActive={true}
                                inputValue={composer.chatInputValue}
                                onInputChange={composer.setChatInputValue}
                                isImageMode={modes.isImageMode}
                                onToggleImageMode={modes.toggleImageMode}
                                isCodeMode={conversation.activeConversation?.isCodeMode || false}
                                onToggleCodeMode={(forcedState?: boolean) => {
                                    conversation.setActiveConversation(prev =>
                                        prev ? { ...prev, isCodeMode: forcedState !== undefined ? forcedState : !prev.isCodeMode } : prev
                                    );
                                }}
                                isComposeMode={modes.isComposeMode}
                                onToggleComposeMode={modes.toggleComposeMode}
                                composeToolState={composeToolState}
                                onComposeSubmit={handleComposeSubmit}
                                selectedModelId={selectedModelId}
                                handleModelChange={onModelChange}
                                selectedResponseStyleName={conversation.activeConversation?.selectedResponseStyleName || "Basic"}
                                handleStyleChange={modes.handleStyleChange}
                                selectedVoice={modes.selectedVoice}
                                handleVoiceChange={modes.handleVoiceChange}
                                selectedTtsSpeed={modes.selectedTtsSpeed}
                                handleTtsSpeedChange={modes.handleTtsSpeedChange}
                                webBrowsingEnabled={modes.webBrowsingEnabled}
                                onToggleWebBrowsing={modes.toggleWebBrowsing}
                                isRecording={media.isRecording}
                                isTranscribing={media.isTranscribing}
                                startRecording={media.startRecording}
                                stopRecording={media.stopRecording}
                                openCamera={media.openCamera}
                                visualizeToolState={visualizeToolState}
                                placeholder={isEn ? "What do you want to discover?" : "Was willst du heute entdecken?"}
                            />
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LandingView;
