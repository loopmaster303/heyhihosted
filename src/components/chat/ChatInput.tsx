
"use client";

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, Paperclip, ChevronDown, Brain, Fingerprint, ImagePlus, X, Mic, ArrowUp } from 'lucide-react';
import Image from 'next/image'; // Kept for future use if needed, but preview is removed
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
  uploadedFilePreviewUrl: string | null; // Still needed to determine icon state
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
    if (isImageModeActive || uploadedFilePreviewUrl) {
      // Input value is not cleared here anymore to allow text with image
    }
  }, [isImageModeActive, uploadedFilePreviewUrl]);

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (isLoading) return;

    const canSendMessage = (isLongLanguageLoopActive && isImageModeActive && inputValue.trim() !== '') ||
                           (isLongLanguageLoopActive && !!uploadedFilePreviewUrl) || // Can send if image is uploaded (even with empty text)
                           (!isImageModeActive && inputValue.trim() !== '');

    if (canSendMessage) {
      onSendMessage(
        inputValue.trim(),
        {
          isImageMode: isLongLanguageLoopActive ? isImageModeActive : false,
        }
      );
      setInputValue('');
      // File selection is not cleared here automatically, user needs to explicitly clear it or send.
      // onFileSelect(null); // This was removed to allow resending same image with different prompt.

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
        textareaRef.current.style.height = `${newHeight}px`;
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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const maxHeight = 120; // Consistent max height
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
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

  // Icon for the attach/image mode button
  let AttachIcon = Mic;
  let attachLabel = "Voice input (not implemented)";
  let attachAction = () => { /* Placeholder for voice input */ };

  if (isLongLanguageLoopActive) {
    if (uploadedFilePreviewUrl) {
      AttachIcon = X; // Show X to clear uploaded image
      attachLabel = "Clear uploaded image";
      attachAction = () => onFileSelect(null);
    } else if (isImageModeActive) {
      AttachIcon = ImagePlus; // Mode for prompting an image generation
      attachLabel = "Switch to text input";
      attachAction = onToggleImageMode;
    } else {
      AttachIcon = Paperclip; // Default: attach file or switch to image prompt
      attachLabel = "Attach file or prompt for image";
      // This button could open a small menu or directly toggle image prompt mode / open file dialog
      // For simplicity, let's make it toggle image prompt mode. File dialog is separate.
      // Or, it could directly open file dialog if we remove onToggleImageMode from it.
      // Let's make it trigger file input first.
      attachAction = () => fileInputRef.current?.click();
    }
  }


  const placeholderText = 
    isLongLanguageLoopActive && isImageModeActive ? "Describe the image you want to generate..." :
    isLongLanguageLoopActive && uploadedFilePreviewUrl ? "Describe the uploaded image or ask a question..." :
    "Wie kann ich helfen?";

  const currentSelectedModel = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_POLLINATIONS_MODELS[0];
  const currentSelectedStyle = AVAILABLE_RESPONSE_STYLES.find(s => s.name === selectedResponseStyleName) || AVAILABLE_RESPONSE_STYLES[0];

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2 md:p-3">
      {/* Removed uploadedFilePreviewUrl display from here */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="relative bg-input rounded-xl p-2.5 flex items-end gap-2 shadow-lg">
          {/* Left Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {isLongLanguageLoopActive && (
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-muted-foreground hover:text-foreground rounded-lg"
                    onClick={attachAction}
                    aria-label={attachLabel}
                    title={attachLabel}
                    disabled={isLoading}
                  >
                    <AttachIcon className="w-5 h-5" />
                  </Button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              disabled={isLoading || (isLongLanguageLoopActive && isImageModeActive)} // Disable file input if in image prompt mode
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground rounded-lg flex items-center gap-1 text-xs" aria-label="Select AI Model">
                  <Brain className="w-4 h-4" />
                  <span>{currentSelectedModel.name.substring(0,10)+(currentSelectedModel.name.length > 10 ? '...' : '')}</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
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
                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground rounded-lg flex items-center gap-1 text-xs" aria-label="Select Response Style">
                  <Fingerprint className="w-4 h-4" />
                   <span>{currentSelectedStyle.name}</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
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

          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            className="flex-grow resize-none w-full min-h-[40px] max-h-[120px] bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none overflow-y-auto p-0 m-0 leading-tight"
            rows={1}
            disabled={isLoading}
            aria-label="Chat message input"
            style={{ height: 'auto' }}
          />

          {/* Right Controls - Send Button */}
          <Button
            type="submit"
            size="icon"
            className="w-8 h-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shrink-0"
            disabled={isLoading || !inputValue.trim() && !(isLongLanguageLoopActive && uploadedFilePreviewUrl) }
            aria-label="Send message"
          >
            <ArrowUp className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
