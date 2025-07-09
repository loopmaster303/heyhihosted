"use client";

import React from 'react';
import { useChat } from '@/components/ChatProvider';

// UI Components
import ChatView from '@/components/chat/ChatView';
import ChatInput from '@/components/chat/ChatInput';
import HistoryPanel from '@/components/chat/HistoryPanel';

// Types & Config
import { DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME } from '@/config/chat-options';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export default function ChatInterface() {
  const chat = useChat();

  if (!chat.activeConversation) {
    return null; 
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
      />
      <div className="px-4 pt-2 pb-4 shrink-0">
        <div className="max-w-3xl mx-auto relative">
          {chat.activeConversation.uploadedFilePreview && (
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
            isImageModeActive={chat.isImageMode}
            onToggleImageMode={chat.toggleImageMode}
            uploadedFilePreviewUrl={chat.activeConversation.uploadedFilePreview ?? null}
            onFileSelect={chat.handleFileSelect}
            isLongLanguageLoopActive={true}
            selectedModelId={chat.activeConversation.selectedModelId || DEFAULT_POLLINATIONS_MODEL_ID}
            selectedResponseStyleName={chat.activeConversation.selectedResponseStyleName || DEFAULT_RESPONSE_STYLE_NAME}
            onModelChange={chat.handleModelChange}
            onStyleChange={chat.handleStyleChange}
            isRecording={chat.isRecording}
            onToggleRecording={chat.handleToggleRecording}
            inputValue={chat.chatInputValue}
            onInputChange={chat.setChatInputValue}
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
            />
          )}
        </div>

        {chat.activeConversation.title && (
          <button
            onClick={chat.toggleHistoryPanel}
            className={cn(
              "text-center text-muted-foreground/80 text-base mt-3 font-code select-none w-full truncate",
              "hover:text-foreground transition-colors duration-200"
            )}
            aria-label="Open chat history"
          >
            {chat.activeConversation.title.replace('default.long.language.loop', 'New Chat')}
          </button>
        )}
      </div>
    </div>
  );
};
