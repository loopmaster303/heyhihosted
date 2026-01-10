import React, { useEffect } from 'react';
import ChatView from '@/components/chat/ChatView';
import ChatInput from '@/components/chat/ChatInput';
import type { UnifiedImageToolState } from '@/hooks/useUnifiedImageToolState';
import { useChat } from '@/components/ChatProvider';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import ErrorBoundary from '@/components/ErrorBoundary';

interface ChatInterfaceProps {
    visualizeToolState: UnifiedImageToolState;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ visualizeToolState }) => {
    const {
        activeConversation,
        isAiResponding,
        sendMessage,
        chatInputValue,
        setChatInputValue,
        isImageMode,
        toggleImageMode,
        handleFileSelect,
        closeHistoryPanel,
        toggleWebBrowsing,
        webBrowsingEnabled,
        startNewChat,
        handleModelChange,
        handleStyleChange,
        handleVoiceChange,
        selectedVoice,
        selectedImageModelId,
        lastUserMessageId,
        handlePlayAudio,
        playingMessageId,
        isTtsLoadingForId,
        handleCopyToClipboard,
        regenerateLastResponse,
        isRecording, isTranscribing, startRecording, stopRecording,
        openCamera,
        setActiveConversation,
        handleImageModelChange,
    } = useChat();

    // Keyboard shortcuts: Cmd+K = new chat
    useKeyboardShortcuts({
        onNewChat: startNewChat,
        onEscape: () => {
            closeHistoryPanel();
        },
    });

    // Sync image model when in image mode
    useEffect(() => {
        if (!isImageMode) return;
        if (visualizeToolState.selectedModelId !== selectedImageModelId) {
            handleImageModelChange(visualizeToolState.selectedModelId);
        }
    }, [isImageMode, visualizeToolState.selectedModelId, selectedImageModelId, handleImageModelChange]);

    if (!activeConversation) {
        return null; // Don't show anything while loading to prevent flicker
    }

    const { messages, selectedModelId, selectedResponseStyleName, uploadedFilePreview } = activeConversation;

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
            <div className="flex-grow overflow-y-auto pt-4 pb-4 px-4 no-scrollbar">
                {messages && messages.length > 0 ? (
                    <ErrorBoundary
                        fallbackTitle="Chat konnte nicht geladen werden"
                        fallbackMessage="Es gab ein Problem beim Anzeigen der Nachrichten. Versuche die Seite neu zu laden."
                        showHomeButton={false}
                    >
                        <ChatView
                            messages={messages}
                            lastUserMessageId={lastUserMessageId}
                            isAiResponding={isAiResponding}
                            onPlayAudio={handlePlayAudio}
                            playingMessageId={playingMessageId}
                            isTtsLoadingForId={isTtsLoadingForId}
                            onCopyToClipboard={handleCopyToClipboard}
                            onRegenerate={regenerateLastResponse}
                        />
                    </ErrorBoundary>
                ) : (
                    // Completely empty area - no branding, no text, nothing
                    <div className="h-full"></div>
                )}
            </div>

            <div className="shrink-0 px-4 pb-4">
                <ChatInput
                    onSendMessage={(msg, opts) => sendMessage(msg, {
                        ...opts,
                        imageConfig: {
                            formFields: visualizeToolState.formFields,
                            uploadedImages: visualizeToolState.uploadedImages,
                            selectedModelId: visualizeToolState.selectedModelId
                        }
                    })}
                    isLoading={isAiResponding}
                    uploadedFilePreviewUrl={uploadedFilePreview || null}
                    onFileSelect={(file, type) => handleFileSelect(file, type)}
                    isLongLanguageLoopActive={true}
                    inputValue={chatInputValue}
                    onInputChange={setChatInputValue}
                    isImageMode={isImageMode}
                    onToggleImageMode={toggleImageMode}
                    webBrowsingEnabled={webBrowsingEnabled}
                    onToggleWebBrowsing={toggleWebBrowsing}
                    isCodeMode={!!activeConversation.isCodeMode}
                    onToggleCodeMode={() => {
                        const turnedOn = !activeConversation.isCodeMode;
                        setActiveConversation(prev => prev ? { ...prev, isCodeMode: turnedOn } : prev);
                    }}
                    selectedModelId={selectedModelId!}
                    handleModelChange={handleModelChange}
                    selectedResponseStyleName={selectedResponseStyleName!}
                    handleStyleChange={handleStyleChange}
                    selectedVoice={selectedVoice}
                    handleVoiceChange={handleVoiceChange}
                    isRecording={isRecording}
                    isTranscribing={isTranscribing}
                    startRecording={startRecording}
                    stopRecording={stopRecording}
                    openCamera={openCamera}
                    visualizeToolState={visualizeToolState}
                />
            </div>
        </div>
    );
};

export default ChatInterface;
