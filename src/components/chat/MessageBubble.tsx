
"use client";

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { ChatMessage, ChatMessageContentPart } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, Square, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const { toast } = useToast();

  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const textContent = Array.isArray(message.content)
    ? message.content.filter(p => p.type === 'text').map(p => p.text).join(' ')
    : typeof message.content === 'string' ? message.content : '';

  const hasText = textContent.trim().length > 0;

  const handlePlayAudio = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }
    if (!hasText) return;

    setIsLoadingAudio(true);
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textContent, voice: 'alloy' })
      });
      if (!response.ok) {
        throw new Error('Failed to fetch audio from the server.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      if (audioRef.current) {
        audioRef.current.src = url;
      } else {
        audioRef.current = new Audio(url);
      }
      
      const newAudio = audioRef.current;
      newAudio.play();
      setIsPlaying(true);
      
      newAudio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      newAudio.onerror = () => {
        toast({ title: "Audio Error", description: "Could not play the audio file.", variant: "destructive" });
        setIsPlaying(false);
        setIsLoadingAudio(false);
        URL.revokeObjectURL(url);
      }

    } catch (error) {
      const msg = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Text-to-Speech Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const renderContent = (content: string | ChatMessageContentPart[]) => {
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        
        {!isUser && hasText && (
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "absolute -bottom-2 -right-3 h-7 w-7 rounded-full bg-accent/80 text-accent-foreground transition-opacity",
              (isHovered || isPlaying || isLoadingAudio) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            onClick={handlePlayAudio}
            disabled={isLoadingAudio}
          >
            {isLoadingAudio 
              ? <Loader2 className="h-4 w-4 animate-spin" /> 
              : isPlaying 
              ? <Square className="h-4 w-4" /> 
              : <Volume2 className="h-4 w-4" />
            }
          </Button>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
