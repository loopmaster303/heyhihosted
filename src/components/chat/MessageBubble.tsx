
"use client";

/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { cn } from '@/lib/utils';
import type { ChatMessage, ChatMessageContentPart } from '@/types';
import Image from 'next/image';
import { Loader2, StopCircle, RefreshCw, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTypewriter } from '@/hooks/useTypewriter';
import { BlinkingCursor } from '@/components/ui/BlinkingCursor';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { useLanguage } from '@/components/LanguageProvider';
import { useState, useEffect } from 'react';

interface MessageBubbleProps {
  message: ChatMessage;
  onPlayAudio?: (text: string, messageId: string) => void;
  isPlaying?: boolean;
  isLoadingAudio?: boolean;
  isAnyAudioActive?: boolean;
  onCopy?: (text: string) => void;
  onRegenerate?: () => void;
  isLastMessage?: boolean;
  isAiResponding?: boolean;
  shouldAnimate?: boolean;
  onTypewriterComplete?: (messageId: string) => void;
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
  isAiResponding = false,
  shouldAnimate = false,
  onTypewriterComplete,
}) => {
  const { t } = useLanguage();
  const [skipAnimation, setSkipAnimation] = useState(false);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isStreaming = Boolean(message.isStreaming);

  const getTextContent = (): string | null => {
    if (typeof message.content === 'string') return message.content;
    if (Array.isArray(message.content)) {
      const textPart = message.content.find(p => p.type === 'text');
      return textPart?.text || null;
    }
    return null;
  }

  const textContent = getTextContent();
  const shouldUseTypewriter = Boolean(shouldAnimate && isAssistant && textContent && message.id !== 'loading' && !skipAnimation && !isStreaming);


  const { displayedText, isTyping, isComplete } = useTypewriter({
    text: textContent || '',
    speed: 25, // milliseconds per character
    delay: 0,
    skipAnimation: !shouldUseTypewriter,
    onComplete: () => {
      if (onTypewriterComplete) {
        onTypewriterComplete(message.id);
      }
    }
  });

  // Click-to-skip functionality
  useEffect(() => {
    const handleClick = () => {
      if (shouldUseTypewriter && isTyping) {
        setSkipAnimation(true);
      }
    };

    if (shouldUseTypewriter) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [shouldUseTypewriter, isTyping]);

  React.useEffect(() => {
    if (!shouldUseTypewriter && shouldAnimate && textContent) {
      onTypewriterComplete?.(message.id);
    }
  }, [shouldUseTypewriter, shouldAnimate, textContent, onTypewriterComplete, message.id]);

  // Reset skip animation when message changes
  React.useEffect(() => {
    setSkipAnimation(false);
  }, [message.id]);

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

  const hasAudioContent = isAssistant && !!getTextContent();

  const renderContent = (content: string | ChatMessageContentPart[]) => {
    if (message.id === 'loading') {
      return (
        <div className="flex items-center gap-2 p-2">
          <div className="flex gap-1">
            <span
              className="w-2 h-2 bg-current rounded-full animate-bounce"
              style={{ animationDelay: '0ms', animationDuration: '1s' }}
            />
            <span
              className="w-2 h-2 bg-current rounded-full animate-bounce"
              style={{ animationDelay: '150ms', animationDuration: '1s' }}
            />
            <span
              className="w-2 h-2 bg-current rounded-full animate-bounce"
              style={{ animationDelay: '300ms', animationDuration: '1s' }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{t('chat.thinking')}</span>
        </div>
      );
    }

    if (typeof content === 'string') {
      if (message.role === 'assistant' && (!content || content.trim() === '')) {
        // Show blinking cursor while AI is responding
        return (
          <div className="flex items-center p-2">
            <BlinkingCursor className="text-primary" />
          </div>
        );
      }

      if (isStreaming) {
        return (
          <p className="text-sm whitespace-pre-wrap">
            {content}
            <BlinkingCursor className="text-primary ml-1" />
          </p>
        );
      }

      // If content contains fenced code blocks, render via Markdown for nicer code display
      if (/```/.test(content)) {
        return <MarkdownRenderer content={content} />;
      }

      // Use typewriter effect for assistant messages
      if (shouldUseTypewriter) {
        return (
          <p className="text-[15px] leading-7 whitespace-pre-wrap font-mono">
            {displayedText}
            {isTyping && <BlinkingCursor className="text-primary ml-1" />}
          </p>
        );
      }

      return <p className="text-[15px] leading-7 whitespace-pre-wrap">{content}</p>;
    }

    return content.map((part, index) => {
      if (part.type === 'text') {
        return <p key={index} className="text-[15px] leading-7 whitespace-pre-wrap mb-2">{part.text}</p>;
      }
      if (part.type === 'image_url') {
        const altText =
          part.image_url.altText ||
          (part.image_url.isGenerated
            ? 'Generated image'
            : part.image_url.isUploaded
              ? 'Uploaded image'
              : 'Image');

        const handleDownload = async (e: React.MouseEvent) => {
          e.stopPropagation();
          try {
            const res = await fetch(part.image_url.url);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${(altText || 'image').slice(0, 30)}.jpg`;
            link.click();
            URL.revokeObjectURL(url);
          } catch {
            window.open(part.image_url.url, '_blank');
          }
        };

        return (
          <div
            key={index}
            className="mt-2 mb-1 w-[300px] max-w-full relative group"
          >
            <img
              src={part.image_url.url}
              alt={altText}
              className="w-full max-h-[220px] rounded-md object-contain border border-border/50 bg-muted/20"
              data-ai-hint={
                part.image_url.isGenerated
                  ? 'illustration digital art'
                  : part.image_url.isUploaded
                    ? 'photo object'
                    : 'image'
              }
            />
            <button
              type="button"
              onClick={handleDownload}
              className="absolute bottom-2 right-2 rounded-full bg-black/70 text-white p-2 opacity-0 group-hover:opacity-100 transition"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
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
          'max-w-[85%] relative p-3 rounded-2xl px-5 py-3.5',
          isUser
            ? 'bg-secondary text-secondary-foreground shadow-sm'
            : 'bg-transparent text-foreground'
        )}
      >
        <div className="flex flex-col">
          {renderContent(message.content)}
        </div>

        {isAssistant && message.id !== 'loading' && (
          <div className="absolute top-full mt-1 left-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                  <StopCircle className="h-4 w-4" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 10v4M7 6v12M11 2v20M15 6v12M19 10v4" /></svg>
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
