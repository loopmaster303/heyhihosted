
"use client";

import type React from 'react';
import { useEffect, useRef } from 'react';
import type { ChatMessage, Conversation } from '@/types';
import MessageBubble from './MessageBubble';
import { cn } from '@/lib/utils';

interface ChatViewProps {
  conversation: Conversation | null; 
  messages: ChatMessage[];
  isLoading: boolean;
  className?: string;
  onPlayAudio: (text: string, messageId: string) => void;
  playingMessageId: string | null;
}

const ChatView: React.FC<ChatViewProps> = ({ conversation, messages, isLoading, className, onPlayAudio, playingMessageId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  return (
    <div className={cn("w-full h-full flex flex-col bg-background overflow-hidden", className)}>
      <div className="flex-grow overflow-y-auto p-4 space-y-0 no-scrollbar">
        {messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg}
            onPlayAudio={onPlayAudio}
            isAudioPlayingForId={playingMessageId}
          />
        ))}
        {isLoading && messages.length > 0 && (
            <MessageBubble message={{ id: 'loading', role: 'assistant', content: '...', timestamp: new Date() }} />
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatView;

    
