
"use client";

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, Paperclip, ChevronDown, Brain, Fingerprint, ImagePlay, X } from 'lucide-react'; 
import Image from 'next/image';
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
    // modelId and systemPrompt are now handled by parent via selectedModelId/selectedResponseStyleName
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
    if (isImageModeActive || uploadedFilePreviewUrl) {
      setInputValue('');
    }
  }, [isImageModeActive, uploadedFilePreviewUrl]);

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (isLoading) return;

    const canSendMessage = (isLongLanguageLoopActive && isImageModeActive && inputValue.trim() !== '') || 
                           (isLongLanguageLoopActive && !!uploadedFilePreviewUrl) || 
                           (!isImageModeActive && inputValue.trim() !== ''); 

    if (canSendMessage) {
      onSendMessage(
        inputValue.trim(), 
        {
          isImageMode: isLongLanguageLoopActive ? isImageModeActive : false, 
        }
      );
      setInputValue(''); 
      
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
      const maxHeight = isLongLanguageLoopActive && (isImageModeActive || uploadedFilePreviewUrl) ? 120 : 200; 
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

  const handleClearUploadPreview = () => {
    onFileSelect(null); 
  };
  
  const placeholderText = isLongLanguageLoopActive && isImageModeActive 
    ? "Bild generieren mit Prompt..." 
    : (isLongLanguageLoopActive && uploadedFilePreviewUrl ? "Optional: Bild beschreiben oder Frage stellen..." : "Nachricht eingeben...");

  const currentSelectedModel = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_POLLINATIONS_MODELS[0];
  const currentSelectedStyle = AVAILABLE_RESPONSE_STYLES.find(s => s.name === selectedResponseStyleName) || AVAILABLE_RESPONSE_STYLES[0];


  return (
    <div className="sticky bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm p-3 md:p-4">
      {isLongLanguageLoopActive && uploadedFilePreviewUrl && (
        <div className="max-w-3xl mx-auto mb-2 flex justify-center">
          <div className="relative w-fit max-w-[200px] group">
            <Image 
              src={uploadedFilePreviewUrl} 
              alt="Upload preview" 
              width={200} height={150} 
              className="rounded-md object-contain" 
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-70 group-hover:opacity-100"
              onClick={handleClearUploadPreview}
              aria-label="Clear image upload"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="relative bg-input rounded-xl p-3 flex flex-col gap-2 shadow-lg">
          <div className="relative flex-grow">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholderText}
              className="flex-grow resize-none w-full min-h-[60px] max-h-[200px] pr-12 pl-2 py-2 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none overflow-y-auto"
              rows={1} 
              disabled={isLoading}
              aria-label="Chat message input"
              style={{ height: 'auto' }} 
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 text-primary hover:text-primary/80 disabled:text-muted-foreground"
              disabled={isLoading || 
                (isLongLanguageLoopActive && isImageModeActive && !inputValue.trim()) || 
                (isLongLanguageLoopActive && !isImageModeActive && !uploadedFilePreviewUrl && !inputValue.trim()) || 
                (!isLongLanguageLoopActive && !inputValue.trim()) 
              }
              aria-label="Send message"
            >
              <SendHorizonal className="w-6 h-6" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1 md:gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground rounded-lg flex items-center gap-1" aria-label="Select AI Model">
                    <Brain className="w-5 h-5" />
                    <ChevronDown className="w-3 h-3 opacity-70" />
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
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground rounded-lg flex items-center gap-1" aria-label="Select Response Style">
                    <Fingerprint className="w-5 h-5" />
                    <ChevronDown className="w-3 h-3 opacity-70" />
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
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              {isLongLanguageLoopActive && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "w-8 h-8 rounded-lg",
                        isImageModeActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground",
                        uploadedFilePreviewUrl ? "opacity-50 cursor-not-allowed" : "" 
                    )}
                    onClick={onToggleImageMode} 
                    aria-label={isImageModeActive ? "Switch to text input mode" : "Switch to image prompt mode"}
                    title={isImageModeActive ? "Textmodus aktivieren" : "Bildmodus aktivieren"}
                    disabled={!!uploadedFilePreviewUrl || isLoading} 
                  >
                    <ImagePlay className="w-5 h-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-8 h-8 text-muted-foreground hover:text-foreground rounded-lg",
                      isImageModeActive ? "opacity-50 cursor-not-allowed" : "" 
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach image file"
                    title="Attach image file"
                    disabled={isImageModeActive || isLoading} 
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                    disabled={isImageModeActive || isLoading} 
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
