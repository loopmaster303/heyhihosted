
"use client";

import type React from 'react';
import { useEffect, useRef } from 'react';
import type { ChatMessage, Conversation } from '@/types';
import MessageBubble from './MessageBubble';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AVAILABLE_POLLINATIONS_MODELS, AVAILABLE_RESPONSE_STYLES, DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME } from '@/config/chat-options';

interface ChatViewProps {
  conversation: Conversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  onGoBack: () => void;
  className?: string;
}

const ChatView: React.FC<ChatViewProps> = ({ conversation, messages, isLoading, onGoBack, className }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const modelIdToUse = conversation?.selectedModelId || DEFAULT_POLLINATIONS_MODEL_ID;
  const styleNameToUse = conversation?.selectedResponseStyleName || DEFAULT_RESPONSE_STYLE_NAME;

  const selectedModelName = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === modelIdToUse)?.name || modelIdToUse;
  const selectedStyleName = AVAILABLE_RESPONSE_STYLES.find(s => s.name === styleNameToUse)?.name || styleNameToUse;


  return (
    <div className={cn("w-full h-full flex flex-col bg-background overflow-hidden", className)}>
      <header className="p-4 flex items-center justify-between bg-card sticky top-0 z-10 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onGoBack} aria-label="Go back to tools menu">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold text-card-foreground truncate">
            {conversation?.title || 'New Chat'}
          </h2>
          {conversation?.toolType === 'Long Language Loops' && (
            <p className="text-xs text-muted-foreground">
              Model: {selectedModelName} &bull; Style: {selectedStyleName}
            </p>
          )}
        </div>
        <div className="w-8 flex-shrink-0"> 
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        </div>
      </header>
      <div className="flex-grow overflow-y-auto p-4 space-y-2">
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
