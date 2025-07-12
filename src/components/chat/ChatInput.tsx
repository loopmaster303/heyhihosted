
"use client";

import type React from 'react';
import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Brain, Fingerprint, X, Send, Speech, Image as ImageIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { AVAILABLE_POLLINATIONS_MODELS, AVAILABLE_RESPONSE_STYLES, AVAILABLE_TTS_VOICES } from '@/config/chat-options';
import type { PollinationsModel, ResponseStyle } from '@/config/chat-options';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string, options?: { isImageModeIntent?: boolean }) => void;
  isLoading: boolean;
  uploadedFilePreviewUrl: string | null;
  onFileSelect: (file: File | null) => void;
  isLongLanguageLoopActive: boolean;
  selectedModelId: string;
  selectedResponseStyleName: string;
  onModelChange: (modelId: string) => void;
  onStyleChange: (styleName: string) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  isImageMode: boolean;
  onToggleImageMode: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  uploadedFilePreviewUrl,
  onFileSelect,
  isLongLanguageLoopActive,
  selectedModelId,
  selectedResponseStyleName,
  onModelChange,
  onStyleChange,
  inputValue,
  onInputChange,
  selectedVoice,
  onVoiceChange,
  isImageMode,
  onToggleImageMode,
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

  const handleSelectModel = (model: PollinationsModel) => {
    onModelChange(model.id);
  };

  const handleSelectStyle = (style: ResponseStyle) => {
    onStyleChange(style.name);
  };

  const handleSelectVoice = (voiceValue: string) => {
    onVoiceChange(voiceValue);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onFileSelect(file || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const placeholderText = isImageMode ? "describe the image you want to create..." : "chat with AI...";
  const currentSelectedModel = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_POLLINATIONS_MODELS[0];
  const currentSelectedStyle = AVAILABLE_RESPONSE_STYLES.find(s => s.name === selectedResponseStyleName) || AVAILABLE_RESPONSE_STYLES[0];
  const currentSelectedVoice = AVAILABLE_TTS_VOICES.find(v => v.id === selectedVoice);
  
  const iconColorClass = "text-foreground/80 hover:text-foreground";
  const iconStrokeWidth = 1.75;

  return (
    <div className="max-w-3xl mx-auto">
      <div
        className="bg-input rounded-2xl p-3 shadow-xl flex flex-col min-h-[96px]"
      >
        <form onSubmit={handleSubmit} className="w-full flex-grow">
            <div className="flex w-full items-start gap-2">
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
                 <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="text-foreground/80 hover:text-foreground"
                    disabled={isLoading || (!inputValue.trim() && !(isLongLanguageLoopActive && uploadedFilePreviewUrl))}
                    aria-label="Send message"
                  >
                      <Send className="w-6 h-6" strokeWidth={iconStrokeWidth} />
                </Button>
            </div>
            
            {isLongLanguageLoopActive && (
              <div className="flex justify-between items-center mt-2 pt-2">
                 <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn("rounded-lg h-8 w-8", iconColorClass, isImageMode && "bg-accent text-accent-foreground")}
                        onClick={onToggleImageMode}
                        title={isImageMode ? "Switch to Chat Mode" : "Switch to Image Mode"}
                        disabled={isLoading}
                    >
                        <ImageIcon className="w-5 h-5" strokeWidth={iconStrokeWidth} />
                    </Button>
                 </div>
                <div className="flex items-center gap-2">
                  {/* Model Select Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={cn("rounded-lg px-2 py-1 h-auto", iconColorClass)} aria-label="select Machines Brain">
                        <Brain className="w-4 h-4 mr-1.5" strokeWidth={iconStrokeWidth}/>
                        <span className="text-xs font-medium">{currentSelectedModel.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>select Machines Brain</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {AVAILABLE_POLLINATIONS_MODELS.map((model) => (
                        <DropdownMenuItem key={model.id} onClick={() => handleSelectModel(model)} className={selectedModelId === model.id ? "bg-accent" : ""}>
                          {model.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Response Style Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={cn("rounded-lg px-2 py-1 h-auto", iconColorClass)} aria-label="select Machines Role and Behavior">
                        <Fingerprint className="w-4 h-4 mr-1.5" strokeWidth={iconStrokeWidth} />
                        <span className="text-xs font-medium">{currentSelectedStyle?.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>select Machines Role and Behavior</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {AVAILABLE_RESPONSE_STYLES.map((style) => (
                        <DropdownMenuItem key={style.name} onClick={() => handleSelectStyle(style)} className={selectedResponseStyleName === style.name ? "bg-accent" : ""}>
                          {style?.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Voice Selection Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={cn("rounded-lg px-2 py-1 h-auto", iconColorClass)} aria-label="select Machines Voice">
                        <Speech className="w-4 h-4 mr-1.5" strokeWidth={iconStrokeWidth} />
                        <span className="text-xs font-medium">{currentSelectedVoice?.name || 'Voice'}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>select Machines Voice</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {AVAILABLE_TTS_VOICES.map((voice) => (
                        <DropdownMenuItem
                          key={voice.id}
                          onClick={() => handleSelectVoice(voice.id)}
                          className={selectedVoice === voice.id ? "bg-accent" : ""}
                        >
                          {voice.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("rounded-lg h-8 w-8", iconColorClass)}
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
                </div>
              </div>
            )}
        </form>
      </div>
       <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isLoading || !isLongLanguageLoopActive || isImageMode}
      />
    </div>
  );
};

export default ChatInput;
