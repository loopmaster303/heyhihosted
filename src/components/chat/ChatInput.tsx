"use client";

import type React from 'react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, CornerDownLeft, Paperclip, Link as LinkIcon, Cpu, Mic, ChevronDown } from 'lucide-react';
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
        textareaRef.current.style.height = '100px'; 
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
    <form onSubmit={handleSubmit} className="sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-4 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht eingeben..."
            className="flex-grow resize-none min-h-[100px] max-h-[300px] pr-14 bg-input text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-accent overflow-y-auto"
            rows={3}
            disabled={isLoading}
            aria-label="Chat message input"
            style={{ height: '100px' }} 
          />
          <div className="absolute right-2 bottom-2 flex flex-col space-y-1">
            <Button
              type="submit"
              size="icon"
              className="w-10 h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message"
            >
              {isLoading ? (
                <CornerDownLeft className="w-5 h-5 animate-pulse" />
              ) : (
                <SendHorizonal className="w-5 h-5" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-10 h-10 text-muted-foreground hover:text-foreground rounded-lg"
              aria-label="Insert link"
            >
              <LinkIcon className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-10 h-10 text-muted-foreground hover:text-foreground rounded-lg"
              aria-label="Attach files"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-start gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full w-8 h-8 flex items-center justify-center gap-1">
                <Cpu className="w-4 h-4" />
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
              <Button variant="outline" size="icon" className="rounded-full w-8 h-8 flex items-center justify-center gap-1">
                <Mic className="w-4 h-4" />
                <ChevronDown className="w-3 h-3 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Enable Microphone</DropdownMenuItem>
              <DropdownMenuItem>Voice Settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
