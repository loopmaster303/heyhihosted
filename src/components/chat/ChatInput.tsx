
"use client";

import type React from 'react';
import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Brain, Fingerprint, X, Send, Speech, Image as ImageIcon, MessageSquare, Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UseAudioRecorderControls } from '@/hooks/useAudioRecorder';

interface ChatInputProps {
  onSendMessage: (message: string, options?: { isImageModeIntent?: boolean }) => void;
  isLoading: boolean;
  uploadedFilePreviewUrl: string | null;
  onFileSelect: (file: File | null) => void;
  isLongLanguageLoopActive: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  isImageMode: boolean;
  onToggleImageMode: () => void;
  chatTitle: string;
  onToggleHistoryPanel: () => void;
  onToggleAdvancedPanel: () => void;
  audioRecorder: UseAudioRecorderControls;
  isSttLoading: boolean;
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
  audioRecorder,
  isSttLoading
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
    if (isLoading || audioRecorder.isRecording) return;

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

  const handleMicClick = () => {
    if (audioRecorder.isRecording) {
      audioRecorder.stopRecording();
    } else {
      audioRecorder.startRecording();
    }
  };

  const placeholderText = isImageMode 
    ? "just provide in natural language your imagination and the machine (gpt image-1) will visualize it directy in chat." 
    : "just ask/discuss everything. get natural and humanlike support by the machine.";
  
  const iconColorClass = "text-foreground/80 hover:text-foreground";
  const iconStrokeWidth = 1.75;

  const displayTitle = chatTitle === "default.long.language.loop" || !chatTitle ? "New Chat" : chatTitle;

  const isRecordingActive = audioRecorder.isRecording;
  const isProcessing = isSttLoading;

  return (
    <div className="max-w-3xl mx-auto">
      <div
        className="bg-input rounded-2xl p-3 shadow-xl flex flex-col min-h-[96px]"
      >
        <form onSubmit={handleSubmit} className="w-full flex-grow">
            <div className="flex w-full items-start gap-2">
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "rounded-lg h-10 w-10 flex-shrink-0", 
                        iconColorClass, 
                        isRecordingActive && "bg-red-500/20 text-red-500 hover:text-red-600 hover:bg-red-500/30"
                    )}
                    onClick={handleMicClick}
                    title={isRecordingActive ? "Stop recording" : "Start recording"}
                    disabled={isLoading || isImageMode || isProcessing}
                >
                    {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" strokeWidth={iconStrokeWidth} /> :
                     isRecordingActive ? <Mic className="w-6 h-6 animate-pulse" strokeWidth={iconStrokeWidth} /> :
                     <Mic className="w-6 h-6" strokeWidth={iconStrokeWidth} />}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("rounded-lg h-10 w-10 flex-shrink-0", iconColorClass, isImageMode && "bg-accent text-accent-foreground")}
                    onClick={onToggleImageMode}
                    title={isImageMode ? "Switch to Chat Mode" : "Switch to Image Mode"}
                    disabled={isLoading || isRecordingActive || isProcessing}
                >
                    {isImageMode ? 
                      <ImageIcon className="w-6 h-6" strokeWidth={iconStrokeWidth} /> : 
                      <MessageSquare className="w-6 h-6" strokeWidth={iconStrokeWidth} />}
                </Button>
                <Textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleTextareaInput}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholderText}
                    className="flex-grow w-full bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none p-2 m-0 leading-tight resize-none overflow-y-auto"
                    rows={1}
                    disabled={isLoading || isRecordingActive || isProcessing}
                    aria-label="Chat message input"
                    style={{ lineHeight: '1.5rem' }}
                />
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("rounded-lg h-10 w-10 flex-shrink-0", iconColorClass)}
                    onClick={() => {
                        if (uploadedFilePreviewUrl) {
                            onFileSelect(null);
                        } else {
                            fileInputRef.current?.click();
                        }
                    }}
                    title={uploadedFilePreviewUrl ? "Clear uploaded image" : "Attach file"}
                    disabled={isLoading || isImageMode || isRecordingActive || isProcessing}
                  >
                    {uploadedFilePreviewUrl ? <X className="w-5 h-5" strokeWidth={iconStrokeWidth} /> : <Paperclip className="w-5 h-5" strokeWidth={iconStrokeWidth} />}
                  </Button>
                 <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="text-foreground/80 hover:text-foreground h-10 w-10 flex-shrink-0"
                    disabled={isLoading || (!inputValue.trim() && !(isLongLanguageLoopActive && uploadedFilePreviewUrl)) || isRecordingActive || isProcessing}
                    aria-label="Send message"
                  >
                      <Send className="w-6 h-6" strokeWidth={iconStrokeWidth} />
                </Button>
            </div>
        </form>
      </div>
       <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isLoading || !isLongLanguageLoopActive || isImageMode || isRecordingActive || isProcessing}
      />
      <div className="mt-3 flex justify-between items-center px-1">
        <button
            onClick={onToggleHistoryPanel}
            className={cn(
              "text-left text-foreground/90 text-sm font-bold font-code select-none truncate",
              "hover:text-foreground transition-colors duration-200 px-2 py-1 rounded-md"
            )}
            aria-label="Open chat history"
          >
           └ {displayTitle}
        </button>

        <button
            onClick={onToggleAdvancedPanel}
            className={cn(
                "text-right text-foreground/90 text-sm font-bold font-code select-none truncate",
                "hover:text-foreground transition-colors duration-200 px-2 py-1 rounded-md"
            )}
            aria-label="Open advanced settings"
            >
            └ Advanced
        </button>

      </div>
    </div>
  );
};

export default ChatInput;
