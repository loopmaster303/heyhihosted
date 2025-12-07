'use client';

import type React from 'react';
import { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, ImageIcon, Paperclip, Camera, File, FileImage, XCircle, Code2, MoreHorizontal, Palette, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types';
import HistoryPanel from './HistoryPanel';
import AdvancedSettingsPanel from './AdvancedSettingsPanel';
import { useLanguage } from '../LanguageProvider';
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
  onClearUploadedImage: () => void;
  isLongLanguageLoopActive: boolean;
  inputValue: string;
  onInputChange: (value: string | ((prev: string) => string)) => void;
  isImageMode: boolean;
  onToggleImageMode: () => void;
  isCodeMode?: boolean;
  onToggleCodeMode?: () => void;
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
  deleteChat: (id: string) => void;
  startNewChat: () => void;
  closeAdvancedPanel: () => void;
  toDate: (timestamp: Date | string | undefined | null) => Date;
  selectedModelId: string;
  handleModelChange: (modelId: string) => void;
  selectedResponseStyleName: string;
  handleStyleChange: (styleName: string) => void;
  selectedVoice: string;
  handleVoiceChange: (voiceId: string) => void;
  webBrowsingEnabled: boolean;
  onToggleWebBrowsing: () => void;
  isRecording: boolean;
  isTranscribing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  openCamera: () => void;
  availableImageModels: string[];
  selectedImageModelId: string;
  handleImageModelChange: (modelId: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  uploadedFilePreviewUrl,
  onFileSelect,
  onClearUploadedImage,
  isLongLanguageLoopActive,
  inputValue,
  onInputChange,
  isImageMode,
  onToggleImageMode,
  chatTitle,
    onToggleHistoryPanel,
    onToggleAdvancedPanel,
    webBrowsingEnabled,
    onToggleWebBrowsing,
    isHistoryPanelOpen,
  isAdvancedPanelOpen,
  historyPanelRef,
  advancedPanelRef,
  allConversations,
  activeConversation,
  selectChat,
  closeHistoryPanel,
  requestEditTitle,
  deleteChat,
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
  availableImageModels,
  selectedImageModelId,
  handleImageModelChange,
  isCodeMode = false,
  onToggleCodeMode,
}) => {
  const { t } = useLanguage();
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const docInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isTitleHovered, setIsTitleHovered] = useState(false);

  const TEXTAREA_MIN_HEIGHT = 80;
  const TEXTAREA_MAX_HEIGHT = 220;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(
        Math.max(textareaRef.current.scrollHeight, TEXTAREA_MIN_HEIGHT),
        TEXTAREA_MAX_HEIGHT
      );
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
    ? t('chat.recording')
    : isTranscribing
    ? t('chat.transcribing')
    : isImageMode
    ? `Imagination using ${selectedImageModelId}...`
    : isCodeMode
    ? `Coding & reasoning with qwen-coder...`
    : t('chat.placeholder');

  const iconColorClass = "text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white";
  const displayTitle = chatTitle === "default.long.language.loop" || !chatTitle ? "New Chat" : chatTitle;
  const showChatTitle = chatTitle !== "default.long.language.loop" && !!chatTitle;

  // Listen for reuse prompt (sidebar / entry draft)
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<string>;
      if (typeof custom.detail === 'string') {
        onInputChange(custom.detail);
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }
    };
    window.addEventListener('sidebar-reuse-prompt', handler);
    try {
      const storedTarget = localStorage.getItem('sidebar-preload-target');
      const storedPrompt = localStorage.getItem('sidebar-preload-prompt');
      if (storedPrompt && storedTarget === 'chat') {
        onInputChange(storedPrompt);
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
        localStorage.removeItem('sidebar-preload-prompt');
        localStorage.removeItem('sidebar-preload-target');
      }
    } catch {}
    return () => window.removeEventListener('sidebar-reuse-prompt', handler);
  }, [onInputChange]);


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
                      onDeleteChat={deleteChat}
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
                      availableImageModels={availableImageModels}
                      selectedImageModelId={selectedImageModelId}
                      onImageModelChange={handleImageModelChange}
                      onClose={closeAdvancedPanel}
                  />
              </div>
          )}
          <form onSubmit={handleSubmit} className="w-full">
             <div className="bg-pink-100 dark:bg-[#252525] rounded-2xl p-3 shadow-xl flex flex-col min-h-0">
                <div className="flex-grow">
                    <Textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={handleTextareaInput}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholderText}
                         className="w-full bg-transparent text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none p-2 m-0 leading-tight resize-none overflow-auto min-h-[80px] max-h-[220px]"
                        rows={1}
                        disabled={isLoading || isRecording || isTranscribing}
                        aria-label="Chat message input"
                        style={{ lineHeight: '1.5rem', fontSize: '17px' }}
                    />
                </div>
                <div className="flex w-full items-center justify-between gap-1 -ml-1">
                    <div className="flex items-center gap-0">
                        {/* Image/Visualize Mode - Always visible */}
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onToggleImageMode}
                            className={cn(
                                "group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300",

                                isImageMode ? 'text-blue-500 hover:text-blue-600' : iconColorClass
                            )}
                            title={isImageMode ? "Switch to Text Mode" : "Switch to Visualize Mode"}
                            disabled={isLoading || isRecording || isTranscribing}
                        >
                            <ImageIcon className="w-[20px] h-[20px]" />
                        </Button>

                        {/* Web Browsing Toggle */}
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onToggleWebBrowsing}
                            className={cn(
                                "group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300",
                                webBrowsingEnabled ? 'text-green-500 hover:text-green-600' : iconColorClass
                            )}
                            title={webBrowsingEnabled ? t('chat.webBrowsingEnabled') : t('chat.webBrowsingDisabled')}
                            disabled={isLoading || isRecording || isTranscribing}
                        >
                            <Globe className="w-[20px] h-[20px]" />
                        </Button>

                        {/* Mobile: Code + Attach buttons → Dropdown | Desktop: Show all buttons */}
                        {isMobile ? (
                            /* Mobile Dropdown */
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className={cn(
                                            "group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300",

                                            (isCodeMode || uploadedFilePreviewUrl) 
                                                ? 'text-purple-500 hover:text-purple-600' 
                                                : iconColorClass
                                        )}
                                        disabled={isLoading || isRecording || isTranscribing}
                                    >
                                        <MoreHorizontal className="w-[18px] h-[18px]" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64" side="top" align="start">
                                    <DropdownMenuItem 
                                        onSelect={() => onToggleCodeMode && onToggleCodeMode()}
                                        className={isCodeMode ? 'text-purple-500' : ''}
                                    >
                                        <Code2 className="mr-2 h-4 w-4" />
                                        <span>{isCodeMode ? 'Code Mode: Ein' : 'Code Mode: Aktivieren'}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => docInputRef.current?.click()}>
                                        <File className="mr-2 h-4 w-4" />
                                        <span>Dokument hochladen</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => imageInputRef.current?.click()}>
                                        <FileImage className="mr-2 h-4 w-4" />
                                        <span>Bild hochladen</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={openCamera}>
                                        <Camera className="mr-2 h-4 w-4" />
                                        <span>Kamera aufnehmen</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            /* Desktop Layout - Show all buttons */
                            <>
                                {/* Code Mode toggle */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => onToggleCodeMode && onToggleCodeMode()}
                                    className={cn(
                                        "group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300",

                                        isCodeMode ? 'text-purple-500 hover:text-purple-600' : iconColorClass
                                    )}
                                    title={isCodeMode ? "Code Mode: On" : "Code Mode: Off"}
                                    disabled={isLoading || isRecording || isTranscribing}
                                >
                                        <Code2 className="w-[20px] h-[20px]" />
                                </Button>
                            </>
                        )}
                        
                        {/* Desktop: Show file attachment buttons */}
                        {!isMobile && (
                            <>
                                {uploadedFilePreviewUrl && !isImageMode && (
                                    <div className="relative group mr-2">
                                        <Image
                                            src={uploadedFilePreviewUrl}
                                            alt="File preview"
                                            width={36}
                                            height={36}
                                            className="rounded-md object-cover h-9 w-9"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            onClick={onClearUploadedImage}
                                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label="Remove attached file"
                                        >
                                            <XCircle className="h-5 w-5" />
                                        </Button>

                                    </div>
                                )}
                                
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className={cn("group rounded-lg h-12 w-12", iconColorClass)}
                                            title="Attach a file"
                                            disabled={isLoading || isImageMode || isRecording || isTranscribing}
                                        >
                                            <Paperclip className="w-[20px] h-[20px]" />
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
                            </>
                        )}
                        
                        {/* Mobile: File preview in the same row */}
                        {isMobile && uploadedFilePreviewUrl && !isImageMode && (
                            <div className="relative group mr-2">
                                <Image
                                    src={uploadedFilePreviewUrl}
                                    alt="File preview"
                                    width={36}
                                    height={36}
                                    className="rounded-md object-cover h-9 w-9"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onClick={onClearUploadedImage}
                                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Remove attached file"
                                >
                                    <XCircle className="h-5 w-5" />
                                </Button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-0">
                      <Button
                          type="button"
                          variant="ghost"
                          onClick={handleMicClick}
                          disabled={isLoading || isTranscribing || isImageMode}
                          className={cn(
                                            "group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300",
                              isRecording ? "text-red-500 hover:text-red-600" : iconColorClass
                          )}
                      >
                          <Mic className="w-[18px] h-[18px]" style={{ maxWidth: '500px', width: '100%' }} />
                      </Button>
                      <Button 
                          type="submit" 
                          variant="ghost" 
                          size="icon" 
                          className={cn(
                          "h-14 w-14 md:h-12 md:w-12",
                          !isLoading && (inputValue.trim() || uploadedFilePreviewUrl) 
                            ? "text-blue-500 hover:text-blue-600"
                            : iconColorClass
                          )} 
                          disabled={isLoading || isRecording || (!inputValue.trim() && !(isLongLanguageLoopActive && uploadedFilePreviewUrl))} 
                          aria-label="Send message">
                          <Send className="w-[26px] h-[26px]" />
                      </Button>
                    </div>
                </div>
            </div>
          </form>
      </div>

      <div className="flex justify-between items-center px-4 sm:px-6 py-2">
          <button
              onClick={onToggleHistoryPanel}
              className="text-foreground/80 hover:text-foreground font-bold text-sm sm:text-base md:text-lg px-2 py-1 rounded-lg pointer-events-auto transition-colors"
              aria-label="Open chat history"
          >
              {t('nav.conversations')}
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
                          className="text-foreground font-bold text-sm sm:text-base md:text-lg px-2 py-1 rounded-lg transition-colors hover:text-foreground/80 animate-in fade-in-0"
                          aria-label="Start new chat"
                      >
                          {t('nav.newConversation')}
                      </button>
                  ) : (
                      <span className="text-foreground/50 font-bold text-sm sm:text-base md:text-lg px-2 py-1 rounded-lg pointer-events-none animate-in fade-in-0">
                          {displayTitle}
                      </span>
                  ))}
          </div>
          <button
              onClick={onToggleAdvancedPanel}
              className="text-foreground/80 hover:text-foreground font-bold text-sm sm:text-base md:text-lg px-2 py-1 rounded-lg pointer-events-auto transition-colors"
              aria-label="Open advanced settings"
          >
              {t('nav.configurations')}
          </button>
      </div>
      <input type="file" ref={docInputRef} onChange={(e) => handleFileChange(e, 'document')} accept="image/*,application/pdf" className="hidden" disabled={isLoading || !isLongLanguageLoopActive || isImageMode} />
      <input type="file" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} accept="image/*" className="hidden" disabled={isLoading || !isLongLanguageLoopActive || isImageMode} />
    </div>
  );
};

export default ChatInput;
