"use client";

import React, { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ChatInput from '@/components/chat/ChatInput';
import { useChat } from '@/components/ChatProvider';
import { useLanguage } from '@/components/LanguageProvider';
import type { UnifiedImageToolState } from '@/hooks/useUnifiedImageToolState';

interface LandingViewProps {
    onNavigateToChat: (initialMessage: string) => void;
    selectedModelId: string;
    onModelChange: (modelId: string) => void;
    visualizeToolState: UnifiedImageToolState;
}

const LandingView: React.FC<LandingViewProps> = ({
    onNavigateToChat,
    selectedModelId,
    onModelChange,
    visualizeToolState,
}) => {
    const chat = useChat();
    const { language } = useLanguage();
    const isEn = language === 'en';
    const [showInputContainer, setShowInputContainer] = useState(false);

    // Show input container after a delay (synced with particle formation)
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowInputContainer(true);
        }, 1200);

        return () => {
            clearTimeout(timer);
        };
    }, []);

    // Handle send - navigate to chat regardless, image mode state is preserved
    const handleSendMessage = useCallback((message: string) => {
        if (!message.trim()) return;
        
        // Set the prompt in visualizeToolState if in image mode
        if (chat.isImageMode) {
            visualizeToolState.setPrompt(message.trim());
        }
        // Navigate to chat - the isImageMode flag is already set so ChatInterface will handle it
        onNavigateToChat(message.trim());
    }, [chat.isImageMode, visualizeToolState, onNavigateToChat]);

    return (
        <div className="relative h-full px-4 py-10 overflow-hidden">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ 
                        opacity: showInputContainer ? 1 : 0, 
                        y: showInputContainer ? 0 : 30 
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full max-w-4xl pointer-events-auto flex flex-col items-center"
                >
                    {/* ChatInput Bar */}
                    <div className="w-full">
                        {showInputContainer && (
                            <ChatInput
                                onSendMessage={handleSendMessage}
                                isLoading={chat.isAiResponding}
                                uploadedFilePreviewUrl={chat.activeConversation?.uploadedFilePreview || null}
                                onFileSelect={chat.handleFileSelect}
                                isLongLanguageLoopActive={true}
                                inputValue={chat.chatInputValue}
                                onInputChange={chat.setChatInputValue}
                                isImageMode={chat.isImageMode}
                                onToggleImageMode={chat.toggleImageMode}
                                // Code Mode temporarily disabled (keep logic in codebase, hide from users).
                                isCodeMode={false}
                                isComposeMode={chat.isComposeMode}
                                onToggleComposeMode={chat.toggleComposeMode}
                                selectedModelId={selectedModelId}
                                handleModelChange={onModelChange}
                                selectedResponseStyleName={chat.activeConversation?.selectedResponseStyleName || "Basic"}
                                handleStyleChange={chat.handleStyleChange}
                                selectedVoice={chat.selectedVoice}
                                handleVoiceChange={chat.handleVoiceChange}
                                webBrowsingEnabled={chat.webBrowsingEnabled}
                                onToggleWebBrowsing={chat.toggleWebBrowsing}
                                isRecording={chat.isRecording}
                                isTranscribing={chat.isTranscribing}
                                startRecording={chat.startRecording}
                                stopRecording={chat.stopRecording}
                                openCamera={chat.openCamera}
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
