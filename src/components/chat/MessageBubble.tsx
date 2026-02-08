"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ChatMessage, ChatMessageContentPart } from '@/types';
import { Loader2, StopCircle, RefreshCw, Copy, Download, Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlinkingCursor } from '@/components/ui/BlinkingCursor';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { useLanguage } from '@/components/LanguageProvider';
// Force refresh
import { DatabaseService } from '@/lib/services/database';

import { useAssetUrl } from '@/hooks/useAssetUrl';
import { AudioMessage } from './AudioMessage';

const fitWithin = (ratio: number, maxWidth: number, maxHeight: number) => {
  const safeRatio = ratio > 0 ? ratio : 1;
  const maxRatio = maxWidth / maxHeight;
  if (safeRatio >= maxRatio) {
    return { width: maxWidth, height: Math.round(maxWidth / safeRatio) };
  }
  return { width: Math.round(maxHeight * safeRatio), height: maxHeight };
};

interface ChatImageCardProps {
  url: string;
  altText: string;
  isGenerated?: boolean;
  isUploaded?: boolean;
  assetId?: string; // Neu: ID für lokalen Vault
}

const ChatImageCard: React.FC<ChatImageCardProps> = ({
  url,
  altText,
  isGenerated = false,
  isUploaded = false,
  assetId,
}) => {
  const { url: vaultUrl, isLoading: isVaultLoading } = useAssetUrl(assetId, url);
  const [isLoaded, setIsLoaded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const src = vaultUrl || url;

  const maxRetries = 8;
  const maxWidth = isGenerated ? 320 : 120;
  const maxHeight = isGenerated ? 240 : 120;
  const ratio = aspectRatio || 1;
  const size = fitWithin(ratio, maxWidth, maxHeight);
 
  const canReload = src?.startsWith('http') && !src.includes('blob:');

  const imageUrl = canReload && reloadToken > 0
    ? `${src}${src.includes('?') ? '&' : '?'}r=${reloadToken}`
    : src;

  useEffect(() => {
    setIsLoaded(false);
    setAspectRatio(null);
    setRetryCount(0);
    setReloadToken(0);
  }, [src]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(altText || 'image').slice(0, 30)}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setAspectRatio(img.naturalWidth / img.naturalHeight);
    }
    setIsLoaded(true);
  };

  const handleImageError = () => {
    if (!isGenerated || !canReload) return;
    if (retryCount >= maxRetries) return;
    const next = retryCount + 1;
    setRetryCount(next);
    window.setTimeout(() => setReloadToken(next), 1200 * next);
  };

  const showLoading = isGenerated && !isLoaded;

  return (
    <>
      <div
        className={cn(
          "relative group rounded-md border border-border/50 bg-muted/10 overflow-hidden",
          isGenerated ? "shadow-sm" : "shadow-none"
        )}
        style={{ width: size.width, height: size.height }}
      >
        <img
          src={imageUrl}
          alt={altText}
          className={cn(
            "h-full w-full",
            isUploaded ? "object-cover" : "object-contain",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
          data-ai-hint={
            isGenerated
              ? 'illustration digital art'
              : isUploaded
                ? 'photo object'
                : 'image'
          }
        />
        {showLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="rounded-full bg-black/70 text-white p-2 hover:bg-black/90 transition-colors"
            title="Expand"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-full bg-black/70 text-white p-2 hover:bg-black/90 transition-colors"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
      {isPreviewOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="relative max-w-full max-h-full w-auto h-auto flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={canReload && reloadToken > 0 ? imageUrl : url}
              alt={altText}
              className="max-w-[95vw] max-h-[95vh] w-auto h-auto object-contain rounded-lg shadow-glass-heavy"
            />
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="absolute -top-12 right-0 sm:top-4 sm:right-4 rounded-full bg-black/50 text-white p-2 hover:bg-black/70 transition-colors"
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

interface ChatVideoCardProps {
  url: string;
  altText: string;
  isGenerated?: boolean;
  assetId?: string;
}

const ChatVideoCard: React.FC<ChatVideoCardProps> = ({
  url,
  altText,
  isGenerated = false,
  assetId,
}) => {
  const { url: vaultUrl } = useAssetUrl(assetId, url);
  const [isReady, setIsReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);

  const src = vaultUrl || url;
  const canReload = src?.startsWith('http') && !src.includes('blob:');
  const maxRetries = 10;

  const videoUrl = canReload && reloadToken > 0
    ? `${src}${src.includes('?') ? '&' : '?'}r=${reloadToken}`
    : src;

  useEffect(() => {
    setIsReady(false);
    setRetryCount(0);
    setReloadToken(0);
  }, [src]);

  const handleVideoError = () => {
    if (!isGenerated || !canReload) return;
    if (retryCount >= maxRetries) return;
    const next = retryCount + 1;
    setRetryCount(next);
    window.setTimeout(() => setReloadToken(next), 1500 * next);
  };

  return (
    <div className="relative group rounded-md border border-glass-border/60 bg-glass-background/30 backdrop-blur-sm overflow-hidden shadow-glass">
      <video
        controls
        preload="metadata"
        playsInline
        src={videoUrl}
        className="max-w-[360px] w-full h-auto object-contain"
        aria-label={altText}
        onLoadedMetadata={() => setIsReady(true)}
        onCanPlay={() => setIsReady(true)}
        onError={handleVideoError}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
      {isGenerated && !isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

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

  // Call onTypewriterComplete immediately for animated messages (no effect now)
  React.useEffect(() => {
    if (shouldAnimate && textContent && message.id !== 'loading') {
      onTypewriterComplete?.(message.id);
    }
  }, [shouldAnimate, textContent, onTypewriterComplete, message.id]);

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

  // Check if message is media-only (has images, no text or empty text)
  const isMediaOnly = React.useMemo(() => {
    if (typeof message.content === 'string') return false;
    const hasImages = message.content.some(p => p.type === 'image_url');
    const hasVideos = message.content.some(p => p.type === 'video_url');
    const hasAudio = message.content.some(p => p.type === 'audio_url');
    const textPart = message.content.find(p => p.type === 'text');
    const hasText = textPart && textPart.text.trim().length > 0;
    return (hasImages || hasVideos || hasAudio) && !hasText;
  }, [message.content]);

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

      return <p className="text-[15px] leading-7 whitespace-pre-wrap">{content}</p>;
    }

    const textParts = content.filter((part) => part.type === 'text');
    const imageParts = content.filter((part) => part.type === 'image_url');
    const videoParts = content.filter((part) => part.type === 'video_url');
    const audioParts = content.filter((part) => part.type === 'audio_url');

    return (
      <div className="flex flex-col">
        {textParts.map((part, index) => (
          <p key={`text-${index}`} className="text-[15px] leading-7 whitespace-pre-wrap mb-2">
            {part.type === 'text' ? part.text : ''}
          </p>
        ))}
        {imageParts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {imageParts.map((part, index) => {
              if (part.type !== 'image_url') return null;
              const altText =
                part.image_url.altText ||
                (part.image_url.isGenerated
                  ? 'Generated image'
                  : part.image_url.isUploaded
                    ? 'Uploaded image'
                    : 'Image');

              return (
                <ChatImageCard
                  key={`image-${index}`}
                  url={part.image_url.url}
                  altText={altText}
                  isGenerated={part.image_url.isGenerated}
                  isUploaded={part.image_url.isUploaded}
                  assetId={(part.image_url as any).metadata?.assetId}
                />
              );
            })}
          </div>
        )}
        {videoParts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {videoParts.map((part, index) => {
              if (part.type !== 'video_url') return null;
              const altText = part.video_url.altText || 'Generated video';
              return (
                <ChatVideoCard
                  key={`video-${index}`}
                  url={part.video_url.url}
                  altText={altText}
                  isGenerated={part.video_url.isGenerated}
                  assetId={(part.video_url as any).metadata?.assetId}
                />
              );
            })}
          </div>
        )}
        {audioParts.length > 0 && (
          <div className="mt-2 flex flex-col gap-2 w-full max-w-[400px]">
            {audioParts.map((part, index) => {
              if (part.type !== 'audio_url') return null;
              return (
                <AudioMessage
                  key={`audio-${index}`}
                  audioUrl={part.audio_url.url}
                  duration={part.audio_url.duration}
                  prompt={textContent || undefined}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
      className={cn(
        'flex items-start gap-3 my-4 w-full group',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'relative transition-all',
          isMediaOnly ? 'p-0 bg-transparent border-none shadow-none max-w-full' : 'max-w-[85%] p-4 rounded-3xl px-6 py-4 shadow-sm',
          !isMediaOnly && isUser
            ? 'bg-primary/20 text-foreground border border-primary/20 shadow-sm backdrop-blur-md'
            : !isMediaOnly && 'bg-glass-background/40 backdrop-blur-xl text-foreground border border-glass-border shadow-glass'
        )}
      >
        <div className="flex flex-col">
          {renderContent(message.content)}
        </div>

        {isAssistant && message.id !== 'loading' && !isMediaOnly && (
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
    </motion.div>
  );
};

export default MessageBubble;
