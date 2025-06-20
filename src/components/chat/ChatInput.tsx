
"use client";

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Brain, Fingerprint, Image as ImageIcon, X, SendHorizontal } from 'lucide-react'; // Changed ImagePlus to Image, Send to SendHorizontal
import NextImage from 'next/image'; // For potential future use, but preview is outside now
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
  uploadedFilePreviewUrl: string | null; // This prop remains for logic (e.g. showing X on paperclip)
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
  uploadedFilePreviewUrl, // Used to determine icon for paperclip/X
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
        textareaRef.current.style.height = 'auto'; // Reset height
        const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 40), 120); // Min height 40px, Max 120px
        textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputValue]);


  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (isLoading) return;

    const canSendMessage = (isLongLanguageLoopActive && isImageModeActive && inputValue.trim() !== '') ||
                           (isLongLanguageLoopActive && !!uploadedFilePreviewUrl && inputValue.trim() !== '') || // Allow sending text with uploaded image
                           (isLongLanguageLoopActive && !!uploadedFilePreviewUrl && inputValue.trim() === '') || // Allow sending just uploaded image
                           (!isImageModeActive && inputValue.trim() !== '');


    if (canSendMessage) {
      onSendMessage(
        inputValue.trim(),
        {
          isImageMode: isLongLanguageLoopActive ? isImageModeActive : undefined,
        }
      );
      setInputValue('');
      // File selection clearing is handled by parent or if user explicitly clears
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
      fileInputRef.current.value = ""; // Reset file input to allow re-selection of the same file
    }
  };

  const placeholderText =
    isLongLanguageLoopActive && isImageModeActive ? "Describe the image you want to generate..." :
    isLongLanguageLoopActive && uploadedFilePreviewUrl ? "Describe the uploaded image or ask a question..." :
    "Was möchtest du wissen?";

  const currentSelectedModel = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_POLLINATIONS_MODELS[0];
  const currentSelectedStyle = AVAILABLE_RESPONSE_STYLES.find(s => s.name === selectedResponseStyleName) || AVAILABLE_RESPONSE_STYLES[0];

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm px-2 py-3 md:px-3 md:py-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="bg-input rounded-2xl p-3 shadow-xl flex flex-col min-h-[80px]"> {/* Increased min-h for taller bubble */}
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            className="flex-grow w-full bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none p-1 m-0 leading-tight resize-none overflow-y-auto"
            rows={1} // Start with 1 row, will auto-grow
            disabled={isLoading}
            aria-label="Chat message input"
          />

          <div className="flex justify-between items-center mt-2 pt-1">
            {/* Left Controls */}
            <div className="flex items-center gap-1.5">
              {isLongLanguageLoopActive && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground hover:text-foreground rounded-lg" aria-label="Select AI Model">
                        <Brain className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Select Model ({currentSelectedModel.name})</DropdownMenuLabel>
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
                      <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground hover:text-foreground rounded-lg" aria-label="Select Response Style">
                        <Fingerprint className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Response Style ({currentSelectedStyle.name})</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {AVAILABLE_RESPONSE_STYLES.map((style) => (
                        <DropdownMenuItem key={style.name} onClick={() => handleSelectStyle(style)} className={selectedResponseStyleName === style.name ? "bg-accent" : ""}>
                          {style.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1.5">
              {isLongLanguageLoopActive && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "w-9 h-9 text-muted-foreground hover:text-foreground rounded-lg",
                        isImageModeActive && "bg-accent text-accent-foreground"
                    )}
                    onClick={onToggleImageMode}
                    aria-label={isImageModeActive ? "Switch to text input" : "Switch to image generation prompt"}
                    title={isImageModeActive ? "Switch to text input" : "Switch to image generation prompt"}
                    disabled={isLoading || !!uploadedFilePreviewUrl} // Disable if file is uploaded or loading
                  >
                    <ImageIcon className="w-5 h-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 text-muted-foreground hover:text-foreground rounded-lg"
                    onClick={() => {
                        if (uploadedFilePreviewUrl) {
                            onFileSelect(null); // Clear the file
                        } else {
                            fileInputRef.current?.click(); // Open file dialog
                        }
                    }}
                    title={uploadedFilePreviewUrl ? "Clear uploaded image" : "Attach file"}
                    disabled={isLoading || isImageModeActive}
                  >
                    {uploadedFilePreviewUrl ? <X className="w-5 h-5"/> : <Paperclip className="w-5 h-5" />}
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    disabled={isLoading || isImageModeActive}
                  />
                </>
              )}
              <Button
                type="submit"
                size="icon"
                className="w-9 h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shrink-0"
                disabled={isLoading || (!inputValue.trim() && !(isLongLanguageLoopActive && uploadedFilePreviewUrl)) }
                aria-label="Send message"
              >
                <SendHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
