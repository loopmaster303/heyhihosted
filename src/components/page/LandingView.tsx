"use client";

import React, { useCallback, useState, useEffect } from 'react';
import ChatInput from '@/components/chat/ChatInput';
import { cn } from '@/lib/utils';
import { useChat } from '@/components/ChatProvider';
import type { UnifiedImageToolState } from '@/hooks/useUnifiedImageToolState';

interface LandingViewProps {
    userDisplayName: string;
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
    const [showInputContainer, setShowInputContainer] = useState(false);

    const advancedPanelRef = React.useRef<HTMLDivElement>(null);

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
            {/* Input Container - Vertically centered */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={cn(
                    "w-full max-w-4xl px-4 transition-opacity duration-[2000ms] ease-out pointer-events-auto",
                    showInputContainer ? "opacity-100" : "opacity-0"
                )}>
                    {/* Full ChatInput with real functionality */}
                    {showInputContainer && (
                        <ChatInput
                            onSendMessage={handleSendMessage}
                            isLoading={chat.isAiResponding}
                            uploadedFilePreviewUrl={chat.activeConversation?.uploadedFilePreview || null}
                            onFileSelect={chat.handleFileSelect}
                            onClearUploadedImage={chat.clearUploadedImage}
                            isLongLanguageLoopActive={true}
                            inputValue={chat.chatInputValue}
                            onInputChange={chat.setChatInputValue}
                            isImageMode={chat.isImageMode}
                            onToggleImageMode={chat.toggleImageMode}
                            isCodeMode={chat.activeConversation?.isCodeMode || false}
                            onToggleCodeMode={() => {
                                chat.setActiveConversation(prev => 
                                    prev ? { ...prev, isCodeMode: !prev.isCodeMode } : prev
                                );
                            }}
                            chatTitle=""
                            onToggleHistoryPanel={chat.toggleHistoryPanel}
                            onToggleGalleryPanel={chat.toggleGalleryPanel}
                            onToggleAdvancedPanel={chat.toggleAdvancedPanel}
                            isAdvancedPanelOpen={chat.isAdvancedPanelOpen}
                            advancedPanelRef={advancedPanelRef}
                            isHistoryPanelOpen={chat.isHistoryPanelOpen}
                            isGalleryPanelOpen={chat.isGalleryPanelOpen}
                            allConversations={chat.allConversations}
                            activeConversation={chat.activeConversation}
                            selectChat={chat.selectChat}
                            closeHistoryPanel={chat.closeHistoryPanel}
                            requestEditTitle={chat.requestEditTitle}
                            deleteChat={chat.deleteChat}
                            startNewChat={chat.startNewChat}
                            closeAdvancedPanel={chat.closeAdvancedPanel}
                            toDate={chat.toDate}
                            selectedModelId={selectedModelId}
                            handleModelChange={onModelChange}
                            selectedResponseStyleName={chat.activeConversation?.selectedResponseStyleName || "Basic"}
                            handleStyleChange={chat.handleStyleChange}
                            selectedVoice={chat.selectedVoice}
                            handleVoiceChange={chat.handleVoiceChange}
                            webBrowsingEnabled={chat.webBrowsingEnabled}
                            onToggleWebBrowsing={chat.toggleWebBrowsing}
                            mistralFallbackEnabled={chat.mistralFallbackEnabled}
                            onToggleMistralFallback={chat.toggleMistralFallback}
                            isRecording={chat.isRecording}
                            isTranscribing={chat.isTranscribing}
                            startRecording={chat.startRecording}
                            stopRecording={chat.stopRecording}
                            openCamera={chat.openCamera}
                            visualizeToolState={visualizeToolState}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default LandingView;
