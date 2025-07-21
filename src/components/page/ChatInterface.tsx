
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@/components/ChatProvider';

// UI Components
import ChatView from '@/components/chat/ChatView';
import ChatInput from '@/components/chat/ChatInput';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

// Types & Config
import { DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME } from '@/config/chat-options';
import { Loader2 } from 'lucide-react';
import { X } from 'lucide-react';

export default function ChatInterface() {
  const chat = useChat();

  const historyPanelRef = useRef<HTMLDivElement>(null);
  const advancedPanelRef = useRef<HTMLDivElement>(null);
  
  // Custom hook to handle clicks outside of the history panel
  useOnClickOutside([historyPanelRef], () => {
    if (chat.isHistoryPanelOpen) chat.closeHistoryPanel();
  }, 'radix-select-content');
   useOnClickOutside([advancedPanelRef], () => {
    if (chat.isAdvancedPanelOpen) chat.closeAdvancedPanel();
  }, 'radix-select-content');


  useEffect(() => {
    return () => {
      // Ensure panels are closed on component unmount
      if (chat.isAdvancedPanelOpen) chat.closeAdvancedPanel();
      if (chat.isHistoryPanelOpen) chat.closeHistoryPanel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!chat.isInitialLoadComplete || !chat.activeConversation) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Initializing Chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="relative flex-grow overflow-hidden">
        <ChatView
          conversation={chat.activeConversation}
          messages={chat.currentMessages}
          isLoading={chat.isAiResponding}
          className="h-full overflow-y-auto px-4 w-full max-w-4xl mx-auto pt-2 pb-4 no-scrollbar"
          onPlayAudio={chat.handlePlayAudio}
          playingMessageId={chat.playingMessageId}
          isTtsLoadingForId={chat.isTtsLoadingForId}
          onCopyToClipboard={chat.handleCopyToClipboard}
          onRegenerate={chat.regenerateLastResponse}
        />
      </div>
      <div className="relative shrink-0 px-4 pb-2 pt-1">
        <div className="max-w-3xl mx-auto relative">
          {chat.activeConversation.uploadedFilePreview && !chat.isImageMode && (
            <div className="max-w-3xl mx-auto p-2 relative w-fit self-center">
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
          />
        </div>
      </div>
    </div>
  );
};
