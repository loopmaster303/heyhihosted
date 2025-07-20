'use client';

import type React from 'react';
import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Search, Send, Mic, Loader2, MessageSquare, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

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

  const startRecording = async () => {
    try {
      if (!MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        throw new Error("audio/webm;codecs=opus not supported by this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if(event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });

        stream.getTracks().forEach(track => track.stop());
        setIsTranscribing(true);
        
        const formData = new FormData();
        formData.append("audioFile", audioFile);

        try {
          const response = await fetch('/api/stt', {
            method: 'POST',
            body: formData,
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Transcription failed");
          onInputChange((prev) => `${prev}${prev ? ' ' : ''}${result.transcription}`.trim());
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          toast({ title: "STT failed", description: message, variant: "destructive" });
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not start recording.";
      toast({ title: "Mic error", description: message, variant: "destructive" });
    }
  };


  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const placeholderText = isImageMode
    ? "just provide in natural language your imagination and the machine (gpt image-1) will visualize it directy in chat."
    : "just ask/discuss everything. get natural and humanlike support by the machine.";

  const iconColorClass = "text-foreground/60 hover:text-foreground";
  const displayTitle = chatTitle === "default.long.language.loop" || !chatTitle ? "New Chat" : chatTitle;

  const ActionButton = ({ onClick, title, disabled, children, className }: { onClick?: () => void; title: string; disabled?: boolean; children: React.ReactNode; className?: string }) => (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn("group rounded-lg h-11 px-3 text-sm font-bold flex items-center gap-2", iconColorClass, className)}
      title={title}
      disabled={disabled}
    >
      {children}
    </Button>
  );

  const ActionLabel = ({ text }: { text: string }) => (
    <span className="w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden">
      {text}
    </span>
  );

  return (
    <div className="max-w-3xl mx-auto">
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
            <div className="flex flex-1 items-center justify-between gap-1">
                <ActionButton onClick={onToggleImageMode} title={isImageMode ? "Switch to Chat Mode" : "Switch to Image Mode"} disabled={isLoading}>
                    {isImageMode ? <ImageIcon className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                    <ActionLabel text={isImageMode ? "visualize" : "text"} />
                </ActionButton>
                
                <ActionButton onClick={() => fileInputRef.current?.click()} title="Analyze document" disabled={isLoading || isImageMode}>
                    <Search className="w-5 h-5" />
                    <ActionLabel text="analyze" />
                </ActionButton>

                <ActionButton onClick={handleMicClick} title={isRecording ? "Stop recording" : (isTranscribing ? "Transcribing..." : "Start recording")} disabled={isLoading || isImageMode} className={cn(isRecording && "text-red-500 hover:text-red-600", isTranscribing && "text-blue-500")}>
                    {isTranscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                    <ActionLabel text="yak with ai" />
                </ActionButton>
            </div>
            
            <Button 
              type="submit" 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-12 w-12 flex-shrink-0 rounded-lg text-foreground/60 hover:text-foreground",
                "transition-all duration-200 ml-4",
                !isLoading && (inputValue.trim() || uploadedFilePreviewUrl) && "text-blue-400 hover:text-blue-300 shadow-[0_0_15px_2px_rgba(147,197,253,0.4)]"
              )} 
              disabled={isLoading || (!inputValue.trim() && !(isLongLanguageLoopActive && uploadedFilePreviewUrl))} 
              aria-label="Send message">
              <Send className="w-6 h-6" strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      </form>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" disabled={isLoading || !isLongLanguageLoopActive || isImageMode} />
      <div className="mt-3 flex justify-between items-center px-1">
        <button onClick={onToggleHistoryPanel} className={cn("text-left text-foreground/90 text-sm font-bold font-code select-none truncate", "hover:text-foreground transition-colors duration-200 px-2 py-1 rounded-md")} aria-label="Open chat history">
          └ {displayTitle}
        </button>
        <button onClick={onToggleAdvancedPanel} className={cn("text-right text-foreground/90 text-sm font-bold font-code select-none truncate", "hover:text-foreground transition-colors duration-200 px-2 py-1 rounded-md")} aria-label="Open advanced settings">
          └ Advanced
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
