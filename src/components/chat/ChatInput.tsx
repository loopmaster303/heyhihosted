
"use client";

import type React from 'react';
import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, X, Send, Image as ImageIcon, MessageSquare, Mic, MicOff, Loader2 } from 'lucide-react';
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
  const { toast } = useToast();

  // Speech-to-Text state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks to turn off the microphone indicator
        stream.getTracks().forEach(track => track.stop());

        setIsTranscribing(true);
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            const response = await fetch('/api/stt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioDataUri: base64Audio }),
            });
            const result = await response.json();
            if (!response.ok) {
              throw new Error(result.error || "Failed to transcribe audio.");
            }
            onInputChange((prev: string) => `${prev}${prev ? ' ' : ''}${result.transcription}`.trim());

          } catch (error) {
            console.error("Transcription Error:", error);
            toast({ title: "Transcription Failed", description: error instanceof Error ? error.message : "Could not process audio.", variant: "destructive" });
          } finally {
            setIsTranscribing(false);
          }
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({ title: "Microphone Access Denied", description: "Please enable microphone permissions in your browser.", variant: "destructive"});
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
  
  const iconColorClass = "text-foreground/80 hover:text-foreground";
  const iconStrokeWidth = 1.75;

  const displayTitle = chatTitle === "default.long.language.loop" || !chatTitle ? "New Chat" : chatTitle;

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="w-full">
        <div
          className="bg-input rounded-2xl p-3 shadow-xl flex flex-col min-h-[96px]"
        >
          <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholderText}
              className="flex-grow w-full bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none p-2 m-0 leading-tight resize-none overflow-y-auto"
              rows={1}
              disabled={isLoading || isRecording || isTranscribing}
              aria-label="Chat message input"
              style={{ lineHeight: '1.5rem' }}
          />
          <div className="flex w-full items-center justify-end gap-2 mt-2">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("rounded-lg h-10 w-10 flex-shrink-0", iconColorClass, isImageMode && "bg-accent text-accent-foreground")}
                onClick={onToggleImageMode}
                title={isImageMode ? "Switch to Chat Mode" : "Switch to Image Mode"}
                disabled={isLoading}
            >
                {isImageMode ? 
                  <ImageIcon className="w-6 h-6" strokeWidth={iconStrokeWidth} /> : 
                  <MessageSquare className="w-6 h-6" strokeWidth={iconStrokeWidth} />}
            </Button>
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
                disabled={isLoading || isImageMode}
              >
                {uploadedFilePreviewUrl ? <X className="w-5 h-5" strokeWidth={iconStrokeWidth} /> : <Paperclip className="w-5 h-5" strokeWidth={iconStrokeWidth} />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleMicClick}
                className={cn(
                    "rounded-lg h-10 w-10 flex-shrink-0",
                    isRecording ? "text-red-500 hover:text-red-600" : iconColorClass,
                    isTranscribing && "text-blue-500"
                )}
                title={isRecording ? "Stop recording" : (isTranscribing ? "Transcribing..." : "Start recording")}
                disabled={isLoading || isImageMode}
                >
                {isTranscribing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : isRecording ? (
                    <MicOff className="w-5 h-5" strokeWidth={iconStrokeWidth} />
                ) : (
                    <Mic className="w-5 h-5" strokeWidth={iconStrokeWidth} />
                )}
                </Button>
             <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="text-foreground/80 hover:text-foreground h-10 w-10 flex-shrink-0"
                disabled={isLoading || (!inputValue.trim() && !(isLongLanguageLoopActive && uploadedFilePreviewUrl)) || isRecording || isTranscribing}
                aria-label="Send message"
              >
                  <Send className="w-6 h-6" strokeWidth={iconStrokeWidth} />
            </Button>
          </div>
        </div>
      </form>
       <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isLoading || !isLongLanguageLoopActive || isImageMode}
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
