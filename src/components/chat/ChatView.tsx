
"use client";

import type React from 'react';
import { useEffect, useRef } from 'react';
import type { ChatMessage, Conversation } from '@/types';
import MessageBubble from './MessageBubble';
// ChatInput is removed as it's now global
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface ChatViewProps {
  conversation: Conversation | null;
  messages: ChatMessage[];
  // onSendMessage prop is removed
  isLoading: boolean;
  onGoBack: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ conversation, messages, isLoading, onGoBack }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  return (
    <div className="w-full h-full max-w-4xl flex flex-col bg-background shadow-xl rounded-lg overflow-hidden animate-in fade-in-0 duration-500">
      <header className="p-4 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={onGoBack} aria-label="Go back to tools menu">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold text-card-foreground">
          {conversation?.title || 'New Chat'}
        </h2>
        <div className="w-8"> {/* Placeholder for potential right-side icon */}
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        </div>
      </header>
      <div className="flex-grow overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {/* Placeholder for when no user/assistant messages are present yet, but a system message might be */}
        {messages.length === 1 && messages[0].role === 'system' && !isLoading && (
           <div className="text-center text-muted-foreground py-10">
            <p>You can now start talking to the AI.</p>
            {conversation?.toolType && <p className="mt-2 text-sm">You are in <span className="font-semibold text-primary">{conversation.toolType}</span> mode.</p>}
          </div>
         )}
         {/* Fallback placeholder if messages array is truly empty (should be rare with new logic) */}
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground py-10">
            <p>Start the conversation by typing a message below.</p>
            {conversation?.toolType && <p className="mt-2 text-sm">You are in <span className="font-semibold text-primary">{conversation.toolType}</span> mode.</p>}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* ChatInput component is removed from here */}
    </div>
  );
};

export default ChatView;

    