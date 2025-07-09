
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import type { ChatMessage, ChatMessageContentPart } from '@/types';
import Image from 'next/image';
import { Loader2, Volume2 } from 'lucide-react';
import { Button } from '../ui/button';

interface MessageBubbleProps {
  message: ChatMessage;
  onPlayAudio?: (text: string, messageId: string) => void;
  isAudioPlayingForId?: string | null;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onPlayAudio, isAudioPlayingForId }) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handlePlayClick = () => {
    if (typeof message.content === 'string' && onPlayAudio) {
      onPlayAudio(message.content, message.id);
    } else if (Array.isArray(message.content)) {
      const textPart = message.content.find(p => p.type === 'text');
      if (textPart && textPart.text && onPlayAudio) {
        onPlayAudio(textPart.text, message.id);
      }
    }
  }

  const getTextContent = (): string | null => {
      if (typeof message.content === 'string') return message.content;
      if (Array.isArray(message.content)) {
          const textPart = message.content.find(p => p.type === 'text');
          return textPart?.text || null;
      }
      return null;
  }

  const hasAudioContent = isAssistant && !!getTextContent();


  const renderContent = (content: string | ChatMessageContentPart[]) => {
    if (message.id === 'loading') {
      return (
        <div className="flex items-center justify-center p-2">
            <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      );
    }
    
    if (typeof content === 'string') {
      let displayContent = content;
      if (message.role === 'assistant' && (!content || content.trim() === '')) {
        displayContent = "[AI response was empty]";
      }
      return <p className="text-sm whitespace-pre-wrap">{displayContent}</p>;
    }

    return content.map((part, index) => {
      if (part.type === 'text') {
        return <p key={index} className="text-sm whitespace-pre-wrap mb-2">{part.text}</p>;
      }
      if (part.type === 'image_url') {
        const altText = part.image_url.altText || (part.image_url.isGenerated ? "Generated image" : (part.image_url.isUploaded ? "Uploaded image" : "Image"));
        return (
          <div key={index} className="mt-2 mb-1">
            <Image
              src={part.image_url.url}
              alt={altText}
              width={300} 
              height={200} 
              style={{ objectFit: "contain", maxWidth: "100%", height: "auto" }} 
              className="rounded-md"
              data-ai-hint={part.image_url.isGenerated ? "illustration digital art" : (part.image_url.isUploaded ? "photo object" : "image")}
            />
          </div>
        );
      }
      return null;
    });
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 my-1 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] relative group', 
          isUser
            ? 'bg-primary text-primary-foreground p-3 rounded-xl'
            : 'bg-transparent text-secondary-foreground p-3 rounded-xl'
        )}
      >
        {renderContent(message.content)}
        {hasAudioContent && (
             <Button 
                variant="ghost"
                size="icon"
                onClick={handlePlayClick}
                className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                aria-label="Play audio"
                disabled={isAudioPlayingForId === message.id}
             >
                {isAudioPlayingForId === message.id ? (
                    <Loader2 className="h-4 w-4 animate-spin"/>
                ) : (
                    <Volume2 className="h-4 w-4"/>
                )}
             </Button>
         )}
      </div>
    </div>
  );
};

export default MessageBubble;
