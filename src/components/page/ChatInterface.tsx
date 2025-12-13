"use client";

import React from 'react';
import ChatView from '@/components/chat/ChatView';
import ChatInput from '@/components/chat/ChatInput';
import { useChat } from '@/components/ChatProvider';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

const ChatInterface: React.FC = () => {
    const {
        activeConversation,
        isAiResponding,
        sendMessage,
        chatInputValue,
        setChatInputValue,
        isImageMode,
        toggleImageMode,
        handleFileSelect,
        clearUploadedImage,
        isHistoryPanelOpen,
        toggleHistoryPanel,
        closeHistoryPanel,
        isAdvancedPanelOpen,
        toggleAdvancedPanel,
        closeAdvancedPanel,
        toggleWebBrowsing,
        webBrowsingEnabled,
        allConversations,
        selectChat,
        requestEditTitle,
        deleteChat,
        startNewChat,
        toDate,
        handleModelChange,
        handleStyleChange,
        handleVoiceChange,
        selectedVoice,
        lastUserMessageId,
        handlePlayAudio,
        playingMessageId,
        isTtsLoadingForId,
        handleCopyToClipboard,
        regenerateLastResponse,
        isRecording, isTranscribing, startRecording, stopRecording,
        openCamera,
        availableImageModels,
        selectedImageModelId,
        handleImageModelChange,
        setActiveConversation,
    } = useChat();

    const advancedPanelRef = React.useRef<HTMLDivElement>(null);

    // This hook now correctly ignores clicks inside any Radix UI Select/Dropdown content
    useOnClickOutside([advancedPanelRef], closeAdvancedPanel, 'radix-select-content');

    if (!activeConversation) {
        return null; // Don't show anything while loading to prevent flicker
    }

    const { messages, title, selectedModelId, selectedResponseStyleName, uploadedFilePreview } = activeConversation;
    // Simplified logic - just check if there are messages
    const shouldShowWelcome = !messages || messages.length === 0;

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
            <div className="flex-grow overflow-y-auto pt-[72px] pb-4 px-4 no-scrollbar">
                {messages && messages.length > 0 ? (
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
                ) : (
                    // Completely empty area - no branding, no text, nothing
                    <div className="h-full"></div>
                )}
            </div>

            <div className="shrink-0 px-4 pb-4">
                <ChatInput
                    onSendMessage={(msg, opts) => sendMessage(msg, opts)}
                    isLoading={isAiResponding}
                    uploadedFilePreviewUrl={uploadedFilePreview || null}
                    onFileSelect={(file, type) => handleFileSelect(file, type)}
                    onClearUploadedImage={clearUploadedImage}
                    isLongLanguageLoopActive={true}
                    inputValue={chatInputValue}
                    onInputChange={setChatInputValue}
                    isImageMode={isImageMode}
                    onToggleImageMode={toggleImageMode}
                    webBrowsingEnabled={webBrowsingEnabled}
                    onToggleWebBrowsing={toggleWebBrowsing}
                    isCodeMode={!!activeConversation.isCodeMode}
                    onToggleCodeMode={() => {
                        // Flip code mode in the active conversation via context updater
                        const turnedOn = !activeConversation.isCodeMode;
                        // Apply the toggle
                        setActiveConversation(prev => prev ? { ...prev, isCodeMode: turnedOn } : prev);
                    }}
                    chatTitle={title}
                    onToggleHistoryPanel={toggleHistoryPanel}
                    onToggleGalleryPanel={() => { }}
                    onToggleAdvancedPanel={toggleAdvancedPanel}
                    isGalleryPanelOpen={false}
                    isHistoryPanelOpen={isHistoryPanelOpen}
                    isAdvancedPanelOpen={isAdvancedPanelOpen}
                    advancedPanelRef={advancedPanelRef}
                    allConversations={allConversations}
                    activeConversation={activeConversation}
                    selectChat={selectChat}
                    closeHistoryPanel={closeHistoryPanel}
                    requestEditTitle={requestEditTitle}
                    deleteChat={deleteChat}
                    startNewChat={startNewChat}
                    closeAdvancedPanel={closeAdvancedPanel}
                    toDate={toDate}
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
                    availableImageModels={availableImageModels}
                    selectedImageModelId={selectedImageModelId}
                    handleImageModelChange={handleImageModelChange}
                />
            </div>
        </div>
    );
};

export default ChatInterface;
