
"use client";

import type React from 'react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, Paperclip, ChevronDown, Brain, Fingerprint, ImageIcon } from 'lucide-react';
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

interface ChatInputProps {
  onSendMessage: (message: string, modelId: string, systemPrompt: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState<PollinationsModel>(
    AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === DEFAULT_POLLINATIONS_MODEL_ID) || AVAILABLE_POLLINATIONS_MODELS[0]
  );
  const [selectedSystemPrompt, setSelectedSystemPrompt] = useState<string>(getDefaultSystemPrompt());

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim(), selectedModel.id, selectedSystemPrompt);
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = '120px';
        // textareaRef.current.focus(); // Re-focusing might not always be desired
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
      const maxHeight = 300;
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

  return (
    <form onSubmit={handleSubmit} className="sticky bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm p-3 md:p-4 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <div className="relative bg-input rounded-xl p-3 flex flex-col gap-2 shadow-lg border border-border/50">
          
          <div className="relative flex-grow">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Nachricht eingeben..."
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
              disabled={isLoading || !inputValue.trim()}
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-foreground rounded-lg"
                aria-label="Generate image (feature coming soon)"
                disabled // Feature not implemented
                title="Generate image (coming soon)"
              >
                <ImageIcon className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-foreground rounded-lg"
                aria-label="Attach files (feature coming soon)"
                disabled // Feature not implemented
                title="Attach files (coming soon)"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
