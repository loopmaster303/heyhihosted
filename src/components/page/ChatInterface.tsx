
'use client';

import React, { useEffect, useRef } from 'react';
import { useChat } from '@/components/ChatProvider';
import ChatView from '@/components/chat/ChatView';
import ChatInput from '@/components/chat/ChatInput';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME } from '@/config/chat-options';
import { Loader2, X } from 'lucide-react';

// Define a constant for the header height to ensure consistency
const HEADER_HEIGHT = '72px';
// Define a constant for the input area's minimum height (approximate)
const INPUT_AREA_HEIGHT = '148px';

export default function ChatInterface() {
  const chat = useChat();

  const historyPanelRef = useRef<HTMLDivElement>(null);
  const advancedPanelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  useOnClickOutside([historyPanelRef], () => {
    if (chat.isHistoryPanelOpen) chat.closeHistoryPanel();
  }, 'radix-select-content');
   useOnClickOutside([advancedPanelRef], () => {
    if (chat.isAdvancedPanelOpen) chat.closeAdvancedPanel();
  }, 'radix-select-content');

  useEffect(() => {
    return () => {
      if (chat.isAdvancedPanelOpen) chat.closeAdvancedPanel();
      if (chat.isHistoryPanelOpen) chat.closeHistoryPanel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom when a new chat is started and it's empty
  useEffect(() => {
    if (chat.activeConversation?.messages.length === 0 && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [chat.activeConversation?.id, chat.activeConversation?.messages.length]);


  if (!chat.isInitialLoadComplete || !chat.activeConversation) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Initializing Chat...</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen flex flex-col overflow-hidden">
      
      {/* Scrollable chat content area */}
      <div 
        ref={scrollContainerRef}
        className="flex-grow overflow-y-auto" 
        style={{
          paddingTop: HEADER_HEIGHT,
          // Add padding at the bottom to ensure last message isn't hidden by the input
          paddingBottom: INPUT_AREA_HEIGHT, 
        }}
      >
        <ChatView
          messages={chat.activeConversation.messages}
          lastUserMessageId={chat.lastUserMessageId}
          isAiResponding={chat.isAiResponding}
          className="w-full max-w-4xl mx-auto px-4"
          onPlayAudio={chat.handlePlayAudio}
          playingMessageId={chat.playingMessageId}
          isTtsLoadingForId={chat.isTtsLoadingForId}
          onCopyToClipboard={chat.handleCopyToClipboard}
          onRegenerate={chat.regenerateLastResponse}
        />
      </div>

      {/* Fixed input area at the bottom */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-auto bg-gradient-to-t from-background via-background/80 to-transparent">
        <div className="max-w-3xl mx-auto px-4 pb-2 pt-1">
          {chat.activeConversation.uploadedFilePreview && !chat.isImageMode && (
            <div className="p-2 relative w-fit self-center">
              <img
                src={chat.activeConversation.uploadedFilePreview}
                alt="Uploaded preview"
                width={80}
                height={80}
                style={{ objectFit: "cover" }}
                className="rounded-md"
              />
              <button
                type="button"
                className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 flex items-center justify-center"
                onClick={chat.clearUploadedImage}
                aria-label="Clear uploaded image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <ChatInput
            onSendMessage={chat.sendMessage}
            isLoading={chat.isAiResponding || chat.isTranscribing}
            uploadedFilePreviewUrl={chat.activeConversation.uploadedFilePreview ?? null}
            onFileSelect={chat.handleFileSelect}
            isLongLanguageLoopActive={true}
            inputValue={chat.chatInputValue}
            onInputChange={chat.setChatInputValue}
            isImageMode={chat.isImageMode}
            onToggleImageMode={chat.toggleImageMode}
            chatTitle={chat.activeConversation.title || "New Chat"}
            onToggleHistoryPanel={chat.toggleHistoryPanel}
            onToggleAdvancedPanel={chat.toggleAdvancedPanel}
            isHistoryPanelOpen={chat.isHistoryPanelOpen}
            isAdvancedPanelOpen={chat.isAdvancedPanelOpen}
            historyPanelRef={historyPanelRef}
            advancedPanelRef={advancedPanelRef}
            allConversations={chat.allConversations}
            activeConversation={chat.activeConversation}
            selectChat={chat.selectChat}
            closeHistoryPanel={chat.closeHistoryPanel}
            requestEditTitle={chat.requestEditTitle}
            requestDeleteChat={chat.requestDeleteChat}
            startNewChat={chat.startNewChat}
            closeAdvancedPanel={chat.closeAdvancedPanel}
            toDate={chat.toDate}
            selectedModelId={chat.activeConversation.selectedModelId || DEFAULT_POLLINATIONS_MODEL_ID}
            handleModelChange={chat.handleModelChange}
            selectedResponseStyleName={chat.activeConversation.selectedResponseStyleName || DEFAULT_RESPONSE_STYLE_NAME}
            handleStyleChange={chat.handleStyleChange}
            selectedVoice={chat.selectedVoice}
            handleVoiceChange={chat.handleVoiceChange}
            isRecording={chat.isRecording}
            isTranscribing={chat.isTranscribing}
            startRecording={chat.startRecording}
            stopRecording={chat.stopRecording}
            openCamera={chat.openCamera}
          />
        </div>
      </div>
    </div>
  );
};
