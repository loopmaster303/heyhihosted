
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import type { ChatMessage, ChatMessageContentPart } from '@/types';
import Image from 'next/image';
import { Loader2, StopCircle, RefreshCw, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageBubbleProps {
  message: ChatMessage;
  onPlayAudio?: (text: string, messageId: string) => void;
  isPlaying?: boolean;
  isLoadingAudio?: boolean;
  isAnyAudioActive?: boolean;
  onCopy?: (text: string) => void;
  onRegenerate?: () => void;
  isLastMessage?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onPlayAudio,
  isPlaying,
  isLoadingAudio,
  isAnyAudioActive,
  onCopy,
  onRegenerate,
  isLastMessage,
}) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handlePlayClick = () => {
    const textContent = getTextContent();
    if (textContent && onPlayAudio) {
      onPlayAudio(textContent, message.id);
    }
  }

  const handleCopyClick = () => {
    const textContent = getTextContent();
    if (textContent && onCopy) {
      onCopy(textContent);
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
          <div key={index} className="mt-2 mb-1 relative" style={{width: '300px', height: '200px'}}>
            <Image
              src={part.image_url.url}
              alt={altText}
              fill
              sizes="(max-width: 768px) 80vw, 300px"
              className="rounded-md object-contain"
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
        'flex items-start gap-3 my-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out w-full group',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] relative', 
          isUser
            ? 'bg-primary text-primary-foreground p-3 rounded-xl'
            : 'bg-transparent text-secondary-foreground p-3 rounded-xl'
        )}
      >
        <div className="flex flex-col">
          {renderContent(message.content)}
        </div>
        
        {isAssistant && message.id !== 'loading' && (
          <div className="absolute top-full mt-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {hasAudioContent && onPlayAudio && (
              <Button 
                variant="ghost"
                size="icon"
                onClick={handlePlayClick}
                className={cn(
                  "h-7 w-7 text-foreground/80 hover:text-foreground",
                  isPlaying && "text-blue-500 hover:text-blue-600"
                )}
                aria-label={isPlaying ? "Stop audio" : "Play audio"}
                disabled={isAnyAudioActive && !isPlaying}
              >
                {isLoadingAudio ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPlaying ? (
                  <StopCircle className="h-4 w-4"/>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 10v4M7 6v12M11 2v20M15 6v12M19 10v4"/></svg>
                )}
              </Button>
            )}
            {isLastMessage && onRegenerate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRegenerate}
                className="h-7 w-7 text-foreground/80 hover:text-foreground"
                aria-label="Regenerate response"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {onCopy && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyClick}
                className="h-7 w-7 text-foreground/80 hover:text-foreground"
                aria-label="Copy text"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
