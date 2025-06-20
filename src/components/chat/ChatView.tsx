
"use client";

import type React from 'react';
import { useEffect, useRef } from 'react';
import type { ChatMessage, Conversation } from '@/types';
import MessageBubble from './MessageBubble';
// Header related imports like Button, ArrowLeft, Loader2, SidebarTrigger, useSidebar are removed
import { cn } from '@/lib/utils';

interface ChatViewProps {
  conversation: Conversation | null; // Keep conversation for potential future use or context, even if title is not displayed here
  messages: ChatMessage[];
  isLoading: boolean;
  // onGoBack prop is removed as header is removed
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
      {/* Header is completely removed */}
      <div className="flex-grow overflow-y-auto p-4 space-y-0"> {/* Ensure bg-background is applied here or by parent */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {messages.length === 1 && messages[0].role === 'system' && !isLoading && (
           <div className="text-center text-foreground/70 py-10">
            <p>You can now start talking to the AI.</p>
          </div>
         )}
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-foreground/70 py-10">
             <p>Just send something and we get deep into the Loop.</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatView;
