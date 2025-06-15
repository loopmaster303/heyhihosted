"use client";

import type React from 'react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, CornerDownLeft } from 'lucide-react';

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
      textareaRef.current?.focus();
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
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };


  return (
    <form onSubmit={handleSubmit} className="sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-4 border-t border-border">
      <div className="relative flex items-end gap-2 max-w-3xl mx-auto">
        <Textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-grow resize-none min-h-[40px] max-h-[200px] pr-20 bg-input text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-accent"
          rows={1}
          disabled={isLoading}
          aria-label="Chat message input"
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-2 bottom-2 w-10 h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
          disabled={isLoading || !inputValue.trim()}
          aria-label="Send message"
        >
          {isLoading ? (
            <CornerDownLeft className="w-5 h-5 animate-pulse" />
          ) : (
            <SendHorizonal className="w-5 h-5" />
          )}
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
