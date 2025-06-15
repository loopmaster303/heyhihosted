"use client";

import type React from 'react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const Icon = isUser ? User : Bot;
  const initial = isUser ? 'U' : 'AI';

  return (
    <div
      className={cn(
        'flex items-start gap-3 my-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className="w-8 h-8">
          <AvatarImage src={`https://placehold.co/40x40/4B0082/E6E6FA?text=${initial}`} alt="AI Avatar" data-ai-hint="robot face" />
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot size={20} />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[70%] p-3 rounded-xl shadow-md',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-secondary text-secondary-foreground rounded-bl-none'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className={cn(
            "text-xs mt-1",
            isUser ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"
          )}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {isUser && (
         <Avatar className="w-8 h-8">
          <AvatarImage src={`https://placehold.co/40x40/E6E6FA/4B0082?text=${initial}`} alt="User Avatar" data-ai-hint="person silhouette" />
          <AvatarFallback className="bg-accent text-accent-foreground">
            <User size={20} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default MessageBubble;
