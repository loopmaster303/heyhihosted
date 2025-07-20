
'use client';

import type React from 'react';
import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Search, Send, Mic, MessageSquare, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types';
import HistoryPanel from './HistoryPanel';
import AdvancedSettingsPanel from './AdvancedSettingsPanel';

interface ChatInputProps {
  onSendMessage: (message: string, options?: { isImageModeIntent?: boolean }) => void;
  isLoading: boolean;
  uploadedFilePreviewUrl: string | null;
  onFileSelect: (file: File | null) => void;
  isLongLanguageLoopActive: boolean;
  inputValue: string;
  onInputChange: (value: string | ((prev: string) => string)) => void;
  isImageMode: boolean;
  onToggleImageMode: () => void;
  chatTitle: string;
  onToggleHistoryPanel: () => void;
  onToggleAdvancedPanel: () => void;
  isHistoryPanelOpen: boolean;
  isAdvancedPanelOpen: boolean;
  historyPanelRef: React.RefObject<HTMLDivElement>;
  advancedPanelRef: React.RefObject<HTMLDivElement>;
  allConversations: Conversation[];
  activeConversation: Conversation | null;
  selectChat: (id: string) => void;
  closeHistoryPanel: () => void;
  requestEditTitle: (id: string) => void;
  requestDeleteChat: (id: string) => void;
  startNewChat: () => void;
  closeAdvancedPanel: () => void;
  toDate: (timestamp: Date | string | undefined | null) => Date;
  selectedModelId: string;
  handleModelChange: (modelId: string) => void;
  selectedResponseStyleName: string;
  handleStyleChange: (styleName: string) => void;
  selectedVoice: string;
  handleVoiceChange: (voiceId: string) => void;
  isControlsVisible: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  uploadedFilePreviewUrl,
  onFileSelect,
  isLongLanguageLoopActive,
  inputValue,
  onInputChange,
  isImageMode,
  onToggleImageMode,
  chatTitle,
  onToggleHistoryPanel,
  onToggleAdvancedPanel,
  isHistoryPanelOpen,
  isAdvancedPanelOpen,
  historyPanelRef,
  advancedPanelRef,
  allConversations,
  activeConversation,
  selectChat,
  closeHistoryPanel,
  requestEditTitle,
  requestDeleteChat,
  startNewChat,
  closeAdvancedPanel,
  toDate,
  selectedModelId,
  handleModelChange,
  selectedResponseStyleName,
  handleStyleChange,
  selectedVoice,
  handleVoiceChange,
  isControlsVisible
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 40), 130);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputValue]);

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (isLoading) return;

    const canSendMessage = (isLongLanguageLoopActive && !!uploadedFilePreviewUrl) || (inputValue.trim() !== '');

    if (canSendMessage) {
      onSendMessage(inputValue.trim(), { isImageModeIntent: isImageMode });
      onInputChange('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onFileSelect(file || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const placeholderText = isImageMode
    ? "just provide in natural language your imagination and the machine (gpt image-1) will visualize it directy in chat."
    : "just ask/discuss everything. get natural and humanlike support by the machine.";

  const iconColorClass = "text-foreground/60 hover:text-foreground";
  const displayTitle = chatTitle === "default.long.language.loop" || !chatTitle ? "New Chat" : chatTitle;
  const showChatTitle = chatTitle !== "default.long.language.loop" && !!chatTitle;


  return (
    <div className="relative">
      <div className={cn(
          "relative transition-all duration-300 ease-in-out",
          isControlsVisible ? '-translate-y-12' : 'translate-y-0'
      )}>
          {isHistoryPanelOpen && (
              <div ref={historyPanelRef}>
                  <HistoryPanel
                      allConversations={allConversations}
                      activeConversation={activeConversation}
                      onSelectChat={(id) => {
                          selectChat(id);
                          closeHistoryPanel();
                      }}
                      onRequestEditTitle={requestEditTitle}
                      onRequestDeleteChat={requestDeleteChat}
                      onStartNewChat={() => {
                          startNewChat();
                          closeHistoryPanel();
                      }}
                      toDate={toDate}
                      onClose={closeHistoryPanel}
                  />
              </div>
          )}
          {isAdvancedPanelOpen && (
              <div ref={advancedPanelRef}>
                  <AdvancedSettingsPanel
                      selectedModelId={selectedModelId}
                      onModelChange={handleModelChange}
                      selectedResponseStyleName={selectedResponseStyleName}
                      onStyleChange={handleStyleChange}
                      selectedVoice={selectedVoice}
                      onVoiceChange={handleVoiceChange}
                      onClose={closeAdvancedPanel}
                  />
              </div>
          )}
          <form onSubmit={handleSubmit} className="w-full">
              <div className="bg-input rounded-2xl p-3 shadow-xl flex flex-col min-h-[96px]">
              <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholderText}
                  className="flex-grow w-full bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none p-2 m-0 leading-tight resize-none overflow-y-auto"
                  rows={1}
                  disabled={isLoading}
                  aria-label="Chat message input"
                  style={{ lineHeight: '1.5rem' }}
              />
              <div className="flex w-full items-center justify-between gap-2 mt-2 px-1">
                  <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={onToggleImageMode}
                        className={cn("group rounded-lg h-11 w-11", iconColorClass)}
                        title={isImageMode ? "Switch to Chat Mode" : "Switch to Image Mode"}
                        disabled={isLoading}
                      >
                          {isImageMode ? <ImageIcon className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        className={cn("group rounded-lg h-11 w-11", iconColorClass)}
                        title="Analyze document"
                        disabled={isLoading || isImageMode}
                      >
                          <Search className="w-6 h-6" />
                      </Button>
                  </div>
                  
                  <div className="relative group flex items-center">
                    <div className="absolute right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                        <Button type="button" variant="ghost" disabled={isLoading || isImageMode} className={cn("flex-row items-center h-auto py-2 px-3 text-foreground/60 hover:text-foreground")}>
                            <Mic className="w-6 h-6" />
                            <span className="text-sm font-normal whitespace-nowrap ml-2">yak with ai</span>
                        </Button>
                    </div>

                    <Button 
                        type="submit" 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                        "h-14 w-14 flex-shrink-0 rounded-lg text-foreground/60 hover:text-foreground",
                        "transition-all duration-200",
                        !isLoading && (inputValue.trim() || uploadedFilePreviewUrl) && "text-blue-400 hover:text-blue-300 shadow-[0_0_15px_2px_rgba(147,197,253,0.4)]"
                        )} 
                        disabled={isLoading || (!inputValue.trim() && !(isLongLanguageLoopActive && uploadedFilePreviewUrl))} 
                        aria-label="Send message">
                        <Send className="w-7 h-7" strokeWidth={2.5} />
                    </Button>
                  </div>
              </div>
              </div>
          </form>
      </div>

      <div className={cn(
          "absolute bottom-0 left-0 right-0 flex justify-between items-end px-6 transition-opacity duration-300 ease-in-out pointer-events-none",
          isControlsVisible ? 'opacity-100' : 'opacity-0'
      )}>
          <button
              onClick={onToggleHistoryPanel}
              className="bg-black/50 backdrop-blur-sm text-white font-bold text-xl px-6 py-2 rounded-lg pointer-events-auto shadow-lg"
              aria-label="Open chat history"
          >
              throwback
          </button>
          <div className="text-center">
              {showChatTitle && (
                  <span className="bg-black/20 text-white font-bold text-xl px-6 py-2 rounded-lg pointer-events-none shadow-lg backdrop-blur-sm">
                      {displayTitle}
                  </span>
              )}
          </div>
          <button
              onClick={onToggleAdvancedPanel}
              className="text-white font-bold text-xl px-6 py-2 rounded-lg pointer-events-auto"
              aria-label="Open advanced settings"
          >
              advanced
          </button>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" disabled={isLoading || !isLongLanguageLoopActive || isImageMode} />
    </div>
  );
};

export default ChatInput;
