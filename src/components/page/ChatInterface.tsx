
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
        allConversations,
        selectChat,
        requestEditTitle,
        requestDeleteChat,
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
    } = useChat();
    
    const historyPanelRef = React.useRef<HTMLDivElement>(null);
    const advancedPanelRef = React.useRef<HTMLDivElement>(null);

    // This hook now correctly ignores clicks inside any Radix UI Select/Dropdown content
    useOnClickOutside([historyPanelRef], closeHistoryPanel, 'radix-select-content');
    useOnClickOutside([advancedPanelRef], closeAdvancedPanel, 'radix-select-content');


    if (!activeConversation) {
        return <div className="flex-grow flex items-center justify-center"><p>Loading conversation...</p></div>;
    }
    
    const { messages, title, selectedModelId, selectedResponseStyleName, uploadedFilePreview } = activeConversation;

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
            <div className="flex-grow overflow-y-auto pt-[72px] pb-4 px-4 no-scrollbar">
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
                    chatTitle={title}
                    onToggleHistoryPanel={toggleHistoryPanel}
                    onToggleAdvancedPanel={toggleAdvancedPanel}
                    isHistoryPanelOpen={isHistoryPanelOpen}
                    isAdvancedPanelOpen={isAdvancedPanelOpen}
                    historyPanelRef={historyPanelRef}
                    advancedPanelRef={advancedPanelRef}
                    allConversations={allConversations}
                    activeConversation={activeConversation}
                    selectChat={selectChat}
                    closeHistoryPanel={closeHistoryPanel}
                    requestEditTitle={requestEditTitle}
                    requestDeleteChat={requestDeleteChat}
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
