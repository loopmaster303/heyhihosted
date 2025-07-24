
'use client';

import type React from 'react';
import { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, ImageIcon, Paperclip, Camera, File, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types';
import HistoryPanel from './HistoryPanel';
import AdvancedSettingsPanel from './AdvancedSettingsPanel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatInputProps {
  onSendMessage: (message: string, options?: { isImageModeIntent?: boolean }) => void;
  isLoading: boolean;
  uploadedFilePreviewUrl: string | null;
  onFileSelect: (file: File | null, fileType: string | null) => void;
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
  isRecording: boolean;
  isTranscribing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  openCamera: () => void;
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
  isRecording,
  isTranscribing,
  startRecording,
  stopRecording,
  openCamera,
}) => {
  const docInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isTitleHovered, setIsTitleHovered] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 40), 130);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputValue]);

  const handleSubmit = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (isLoading || isRecording) return;

    const canSendMessage = (isLongLanguageLoopActive && !!uploadedFilePreviewUrl) || (inputValue.trim() !== '');

    if (canSendMessage) {
      onSendMessage(inputValue.trim(), { isImageModeIntent: isImageMode });
      onInputChange('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [isLoading, isRecording, isLongLanguageLoopActive, uploadedFilePreviewUrl, inputValue, onSendMessage, isImageMode, onInputChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleTextareaInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value);
  }, [onInputChange]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>, fileType: 'document' | 'image') => {
    const file = event.target.files?.[0];
    onFileSelect(file || null, fileType);
    if (event.currentTarget) {
      event.currentTarget.value = "";
    }
  }, [onFileSelect]);
  
  const handleMicClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, stopRecording, startRecording]);

  const placeholderText = isRecording
    ? 'Recording...'
    : isTranscribing
    ? 'Transcribing...'
    : isImageMode
    ? "just provide in natural language your imagination and the machine (gpt image-1) will visualize it directy in chat."
    : "just ask/discuss everything. get natural and humanlike support by the machine.";

  const iconColorClass = "text-foreground/60 hover:text-foreground";
  const displayTitle = chatTitle === "default.long.language.loop" || !chatTitle ? "New Chat" : chatTitle;
  const showChatTitle = chatTitle !== "default.long.language.loop" && !!chatTitle;


  return (
    <div className="relative">
      <div className="relative">
          {isHistoryPanelOpen && (
              <div ref={historyPanelRef} className="absolute bottom-full mb-2 left-0 w-full z-30">
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
              <div ref={advancedPanelRef} className="absolute bottom-full mb-2 left-0 w-full z-30">
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
            <div className="bg-secondary rounded-2xl p-3 shadow-xl flex flex-col min-h-0">
                <div className="flex-grow">
                    <Textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={handleTextareaInput}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholderText}
                        className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none p-2 m-0 leading-tight resize-none overflow-y-auto"
                        rows={1}
                        disabled={isLoading || isRecording || isTranscribing}
                        aria-label="Chat message input"
                        style={{ lineHeight: '1.5rem' }}
                    />
                </div>
                <div className="flex w-full items-center justify-between gap-1 -ml-1">
                    <div className="flex items-center gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onToggleImageMode}
                            className={cn(
                                "group rounded-lg h-12 w-12 transition-colors duration-300",
                                isImageMode ? 'text-blue-500 hover:text-blue-600' : iconColorClass
                            )}
                            title={isImageMode ? "Switch to Text Mode" : "Switch to Visualize Mode"}
                            disabled={isLoading || isRecording || isTranscribing}
                        >
                            <ImageIcon className="w-16 h-16" />
                        </Button>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className={cn("group rounded-lg h-12 w-12", iconColorClass)}
                                    title="Attach a file"
                                    disabled={isLoading || isImageMode || isRecording || isTranscribing}
                                >
                                    <Paperclip className="w-16 h-16" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64" side="top" align="start">
                                <DropdownMenuItem onSelect={() => docInputRef.current?.click()}>
                                    <File className="mr-2 h-4 w-4" />
                                    <span>Analyze document from file</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => imageInputRef.current?.click()}>
                                    <FileImage className="mr-2 h-4 w-4" />
                                    <span>Analyze image from file</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={openCamera}>
                                    <Camera className="mr-2 h-4 w-4" />
                                    <span>Analyze image from camera</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center gap-0">
                      <Button
                          type="button"
                          variant="ghost"
                          onClick={handleMicClick}
                          disabled={isLoading || isTranscribing || isImageMode}
                          className={cn(
                              "group rounded-lg h-12 w-12 transition-colors duration-300",
                              isRecording ? "text-red-500 hover:text-red-600" : iconColorClass
                          )}
                      >
                          <Mic className="w-16 h-16" />
                      </Button>
                      <Button 
                          type="submit" 
                          variant="ghost" 
                          size="icon" 
                          className={cn(
                          "h-12 w-12",
                          !isLoading && (inputValue.trim() || uploadedFilePreviewUrl) 
                            ? "text-blue-500 hover:text-blue-600"
                            : iconColorClass
                          )} 
                          disabled={isLoading || isRecording || (!inputValue.trim() && !(isLongLanguageLoopActive && uploadedFilePreviewUrl))} 
                          aria-label="Send message">
                          <Send className="w-16 h-16" />
                      </Button>
                    </div>
                </div>
            </div>
          </form>
      </div>

      <div className="flex justify-between items-center px-6 py-2">
          <button
              onClick={onToggleHistoryPanel}
              className="text-foreground/80 hover:text-foreground font-bold text-xl px-2 py-1 rounded-lg pointer-events-auto transition-colors"
              aria-label="Open chat history"
          >
              Conversations
          </button>
          <div
            className="text-center h-9 flex items-center"
            onMouseEnter={() => setIsTitleHovered(true)}
            onMouseLeave={() => setIsTitleHovered(false)}
          >
              {showChatTitle &&
                  (isTitleHovered ? (
                      <button
                          onClick={startNewChat}
                          className="text-foreground font-bold text-xl px-2 py-1 rounded-lg transition-colors hover:text-foreground/80 animate-in fade-in-0"
                          aria-label="Start new chat"
                      >
                          New Conversation
                      </button>
                  ) : (
                      <span className="text-foreground/50 font-bold text-xl px-2 py-1 rounded-lg pointer-events-none animate-in fade-in-0">
                          {displayTitle}
                      </span>
                  ))}
          </div>
          <button
              onClick={onToggleAdvancedPanel}
              className="text-foreground/80 hover:text-foreground font-bold text-xl px-2 py-1 rounded-lg pointer-events-auto transition-colors"
              aria-label="Open advanced settings"
          >
              Configurations
          </button>
      </div>
      <input type="file" ref={docInputRef} onChange={(e) => handleFileChange(e, 'document')} accept="image/*,application/pdf" className="hidden" disabled={isLoading || !isLongLanguageLoopActive || isImageMode} />
      <input type="file" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} accept="image/*" className="hidden" disabled={isLoading || !isLongLanguageLoopActive || isImageMode} />
    </div>
  );
};

export default ChatInput;

    