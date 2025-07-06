
"use client";

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Brain, Fingerprint, ImageIcon, X, Send } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { AVAILABLE_POLLINATIONS_MODELS, AVAILABLE_RESPONSE_STYLES } from '@/config/chat-options';
import type { PollinationsModel, ResponseStyle } from '@/config/chat-options';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (
    message: string,
    options: {
      isImageMode?: boolean;
    }
  ) => void;
  isLoading: boolean;
  isImageModeActive: boolean;
  onToggleImageMode: () => void;
  uploadedFilePreviewUrl: string | null;
  onFileSelect: (file: File | null) => void;
  isLongLanguageLoopActive: boolean;
  selectedModelId: string;
  selectedResponseStyleName: string;
  onModelChange: (modelId: string) => void;
  onStyleChange: (styleName: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  isImageModeActive,
  onToggleImageMode,
  uploadedFilePreviewUrl,
  onFileSelect,
  isLongLanguageLoopActive,
  selectedModelId,
  selectedResponseStyleName,
  onModelChange,
  onStyleChange,
}) => {
  const [inputValue, setInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 40), 130); // Max height 130px
        textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputValue]);


  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (isLoading) return;

    const canSendMessage = (isLongLanguageLoopActive && isImageModeActive && inputValue.trim() !== '') ||
                           (isLongLanguageLoopActive && !!uploadedFilePreviewUrl && inputValue.trim() !== '') ||
                           (isLongLanguageLoopActive && !!uploadedFilePreviewUrl && inputValue.trim() === '') ||
                           (!isImageModeActive && inputValue.trim() !== '');


    if (canSendMessage) {
      onSendMessage(
        inputValue.trim(),
        {
          isImageMode: isLongLanguageLoopActive ? isImageModeActive : undefined,
        }
      );
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height after send
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
    setInputValue(e.target.value);
  };

  const handleSelectModel = (model: PollinationsModel) => {
    onModelChange(model.id);
  };

  const handleSelectStyle = (style: ResponseStyle) => {
    onStyleChange(style.name);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onFileSelect(file || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const placeholderText = "chat with AI";
  const currentSelectedModel = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_POLLINATIONS_MODELS[0];
  const currentSelectedStyle = AVAILABLE_RESPONSE_STYLES.find(s => s.name === selectedResponseStyleName) || AVAILABLE_RESPONSE_STYLES[0];

  const iconSizeClass = "w-6 h-6";
  const iconColorClass = "text-foreground/80 hover:text-foreground";
  const iconStrokeWidth = 1.75;


  return (
    <div className="sticky bottom-0 left-0 right-0 bg-transparent px-2 py-3 md:px-3 md:py-4">
      <div
        className="max-w-3xl mx-auto bg-input rounded-2xl p-3 shadow-xl flex flex-col min-h-[96px]"
      >
        <form onSubmit={handleSubmit} className="w-full flex-grow">
            <div className="relative flex w-full h-full items-start">
                <Textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleTextareaInput}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholderText}
                    className="flex-grow w-full bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none p-2 pr-14 m-0 leading-tight resize-none overflow-y-auto"
                    rows={1}
                    disabled={isLoading}
                    aria-label="Chat message input"
                    style={{ lineHeight: '1.5rem' }}
                />
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 text-foreground/80 hover:text-foreground"
                    disabled={isLoading || (!inputValue.trim() && !(isLongLanguageLoopActive && uploadedFilePreviewUrl))}
                    onClick={() => handleSubmit()}
                    aria-label="Send message"
                  >
                      <Send className={iconSizeClass} strokeWidth={iconStrokeWidth} />
                </Button>
            </div>
        </form>

        {isLongLanguageLoopActive && (
          <div className="flex justify-between items-center mt-2 pt-2">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={cn("rounded-lg px-2 py-1 h-auto", iconColorClass)} aria-label="Select AI Model">
                    <Brain className="w-5 h-5 mr-1.5" strokeWidth={iconStrokeWidth}/>
                    <span className="text-xs font-medium">{currentSelectedModel.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Select Model</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {AVAILABLE_POLLINATIONS_MODELS.map((model) => (
                    <DropdownMenuItem key={model.id} onClick={() => handleSelectModel(model)} className={selectedModelId === model.id ? "bg-accent" : ""}>
                      {model.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={cn("rounded-lg px-2 py-1 h-auto", iconColorClass)} aria-label="Select Response Style">
                    <Fingerprint className="w-5 h-5 mr-1.5" strokeWidth={iconStrokeWidth} />
                    <span className="text-xs font-medium">{currentSelectedStyle.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Response Style</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {AVAILABLE_RESPONSE_STYLES.map((style) => (
                    <DropdownMenuItem key={style.name} onClick={() => handleSelectStyle(style)} className={selectedResponseStyleName === style.name ? "bg-accent" : ""}>
                      {style.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                    "rounded-lg",
                    iconColorClass,
                    isImageModeActive && "bg-accent text-accent-foreground"
                )}
                onClick={onToggleImageMode}
                aria-label={isImageModeActive ? "Switch to text input" : "Switch to image generation prompt"}
                title={isImageModeActive ? "Switch to text input" : "Switch to image generation prompt"}
                disabled={isLoading || !!uploadedFilePreviewUrl}
              >
                <ImageIcon className={iconSizeClass} strokeWidth={iconStrokeWidth} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("rounded-lg", iconColorClass)}
                onClick={() => {
                    if (uploadedFilePreviewUrl) {
                        onFileSelect(null);
                    } else {
                        fileInputRef.current?.click();
                    }
                }}
                title={uploadedFilePreviewUrl ? "Clear uploaded image" : "Attach file"}
                disabled={isLoading || isImageModeActive}
              >
                {uploadedFilePreviewUrl ? <X className={iconSizeClass} strokeWidth={iconStrokeWidth} /> : <Paperclip className={iconSizeClass} strokeWidth={iconStrokeWidth} />}
              </Button>
            </div>
          </div>
        )}
      </div>
       <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isLoading || isImageModeActive || !isLongLanguageLoopActive}
      />
    </div>
  );
};

export default ChatInput;
