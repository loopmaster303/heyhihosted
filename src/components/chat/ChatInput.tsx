
"use client";

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, Paperclip, ChevronDown, Brain, Fingerprint, ImageIcon as ImageIconLucide, X, ImagePlay } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { AVAILABLE_POLLINATIONS_MODELS, AVAILABLE_RESPONSE_STYLES, DEFAULT_POLLINATIONS_MODEL_ID, getDefaultSystemPrompt } from '@/config/chat-options';
import type { PollinationsModel, ResponseStyle } from '@/config/chat-options';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (
    message: string, 
    modelId: string, 
    systemPrompt: string,
    options: {
      isImageMode?: boolean;
      uploadedImageFile?: File | null;
    }
  ) => void;
  isLoading: boolean;
  isImageModeActive: boolean; // Is image prompt mode active globally for the conversation
  onToggleImageMode: () => void;
  uploadedFilePreviewUrl: string | null;
  onFileSelect: (file: File | null) => void; // Callback when a file is selected or cleared
  isLongLanguageLoopActive: boolean; // To enable/disable image/file features
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading,
  isImageModeActive,
  onToggleImageMode,
  uploadedFilePreviewUrl,
  onFileSelect,
  isLongLanguageLoopActive
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState<PollinationsModel>(
    AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === DEFAULT_POLLINATIONS_MODEL_ID) || AVAILABLE_POLLINATIONS_MODELS[0]
  );
  const [selectedSystemPrompt, setSelectedSystemPrompt] = useState<string>(getDefaultSystemPrompt());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // If image mode is activated externally (e.g. by selecting a file), clear text input
    if (isImageModeActive || uploadedFilePreviewUrl) {
      setInputValue('');
    }
  }, [isImageModeActive, uploadedFilePreviewUrl]);

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (isLoading) return;

    // For image mode, inputValue must not be empty.
    // For text/file mode, either inputValue or an uploaded file must exist.
    const canSendMessage = isImageModeActive 
      ? inputValue.trim() !== ''
      : inputValue.trim() !== '' || !!uploadedFilePreviewUrl;

    if (canSendMessage) {
      onSendMessage(
        inputValue.trim(), 
        selectedModel.id, 
        selectedSystemPrompt,
        {
          isImageMode: isImageModeActive,
          // uploadedImageFile is handled by parent, this just signals intent
        }
      );
      setInputValue('');
      // File clearing is handled by parent via onFileSelect(null) after processing
      if (textareaRef.current) {
        textareaRef.current.style.height = '120px'; // Reset height
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
      const maxHeight = isLongLanguageLoopActive ? 200 : 300; // Smaller max height if image preview is shown
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  const handleSelectModel = (model: PollinationsModel) => {
    setSelectedModel(model);
  };

  const handleSelectStyle = (style: ResponseStyle) => {
    setSelectedSystemPrompt(style.systemPrompt);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onFileSelect(file || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  };

  const handleClearUploadPreview = () => {
    onFileSelect(null);
  };
  
  const placeholderText = isLongLanguageLoopActive && isImageModeActive 
    ? "Bild generieren mit Prompt..." 
    : "Nachricht eingeben...";

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm p-3 md:p-4 border-t border-border">
      {isLongLanguageLoopActive && uploadedFilePreviewUrl && (
        <div className="max-w-3xl mx-auto mb-2 flex justify-center">
          <div className="relative w-fit max-w-[200px] group">
            <Image 
              src={uploadedFilePreviewUrl} 
              alt="Upload preview" 
              width={200} height={150} 
              className="rounded-md object-contain border border-border" 
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
        <div className="relative bg-input rounded-xl p-3 flex flex-col gap-2 shadow-lg border border-border/50">
          <div className="relative flex-grow">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholderText}
              className="flex-grow resize-none w-full min-h-[120px] max-h-[300px] pr-12 pl-2 py-2 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none overflow-y-auto"
              rows={4}
              disabled={isLoading}
              aria-label="Chat message input"
              style={{ height: '120px' }}
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute right-2 top-2 w-8 h-8 text-primary hover:text-primary/80 disabled:text-muted-foreground"
              disabled={isLoading || (isImageModeActive ? !inputValue.trim() : (!inputValue.trim() && !uploadedFilePreviewUrl))}
              aria-label="Send message"
            >
              <SendHorizonal className="w-6 h-6" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="flex items-center gap-1 md:gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground rounded-lg flex items-center gap-1" aria-label="Select AI Model">
                    <Brain className="w-5 h-5" />
                    <ChevronDown className="w-3 h-3 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Select Model ({selectedModel.name})</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {AVAILABLE_POLLINATIONS_MODELS.map((model) => (
                    <DropdownMenuItem key={model.id} onClick={() => handleSelectModel(model)} className={selectedModel.id === model.id ? "bg-accent" : ""}>
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
                   <DropdownMenuLabel>Response Style</DropdownMenuLabel>
                   <DropdownMenuSeparator />
                  {AVAILABLE_RESPONSE_STYLES.map((style) => (
                    <DropdownMenuItem key={style.name} onClick={() => handleSelectStyle(style)} className={selectedSystemPrompt === style.systemPrompt ? "bg-accent" : ""}>
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
