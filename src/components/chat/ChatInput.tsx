
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
} from "@/components/ui/dropdown-menu";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; 
        textareaRef.current.style.height = '120px'; 
        textareaRef.current.focus();
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
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground rounded-lg flex items-center gap-1">
                    <Brain className="w-5 h-5" />
                    <ChevronDown className="w-3 h-3 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>Model Gemini Pro</DropdownMenuItem>
                  <DropdownMenuItem>Model Flash</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground rounded-lg flex items-center gap-1">
                    <Fingerprint className="w-5 h-5" />
                    <ChevronDown className="w-3 h-3 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>Friendly</DropdownMenuItem>
                  <DropdownMenuItem>Professional</DropdownMenuItem>
                  <DropdownMenuItem>Unfriendly</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-foreground rounded-lg"
                aria-label="Generate image"
              >
                <ImageIcon className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-foreground rounded-lg"
                aria-label="Attach files"
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

