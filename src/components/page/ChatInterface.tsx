
"use client";

import React, { useEffect } from 'react';
import { useChat } from '@/components/ChatProvider';

// UI Components
import ChatView from '@/components/chat/ChatView';
import ChatInput from '@/components/chat/ChatInput';
import HistoryPanel from '@/components/chat/HistoryPanel';
import AdvancedSettingsPanel from '@/components/chat/AdvancedSettingsPanel';

// Types & Config
import { DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME } from '@/config/chat-options';
import { Loader2 } from 'lucide-react';
import { X } from 'lucide-react';

export default function ChatInterface() {
  const chat = useChat();

  // The logic to select or start a new chat has been moved to ChatProvider
  // to ensure it runs correctly after localStorage is loaded.
  // This component now just displays the UI based on the provider's state.

  if (!chat.isInitialLoadComplete || !chat.activeConversation) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Initializing Chat...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <ChatView
        conversation={chat.activeConversation}
        messages={chat.currentMessages}
        isLoading={chat.isAiResponding}
        className="flex-grow overflow-y-auto px-4 w-full max-w-4xl mx-auto pt-2 pb-4 no-scrollbar"
        onPlayAudio={chat.handlePlayAudio}
        playingMessageId={chat.playingMessageId}
        isTtsLoadingForId={chat.isTtsLoadingForId}
        onCopyToClipboard={chat.handleCopyToClipboard}
        onRegenerate={chat.regenerateLastResponse}
      />
      <div className="px-4 pt-2 pb-4 shrink-0">
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
            isLoading={chat.isAiResponding}
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
          />

          {chat.isHistoryPanelOpen && (
            <HistoryPanel
              allConversations={chat.allConversations}
              activeConversation={chat.activeConversation}
              onSelectChat={chat.selectChat}
              onClose={chat.closeHistoryPanel}
              onRequestEditTitle={chat.requestEditTitle}
              onRequestDeleteChat={chat.requestDeleteChat}
              onStartNewChat={chat.startNewChat}
              toDate={chat.toDate}
            />
          )}

          {chat.isAdvancedPanelOpen && (
            <AdvancedSettingsPanel
              onClose={chat.closeAdvancedPanel}
              selectedModelId={chat.activeConversation.selectedModelId || DEFAULT_POLLINATIONS_MODEL_ID}
              onModelChange={chat.handleModelChange}
              selectedResponseStyleName={chat.activeConversation.selectedResponseStyleName || DEFAULT_RESPONSE_STYLE_NAME}
              onStyleChange={chat.handleStyleChange}
              selectedVoice={chat.selectedVoice}
              onVoiceChange={chat.handleVoiceChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};
