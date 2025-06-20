
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
}

const ChatView: React.FC<ChatViewProps> = ({ conversation, messages, isLoading, className }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  return (
    <div className={cn("w-full h-full flex flex-col bg-background overflow-hidden", className)}>
      <div className="flex-grow overflow-y-auto p-4 space-y-0">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {/* Placeholder removed: "Just send something and see the AI loop..." */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatView;
