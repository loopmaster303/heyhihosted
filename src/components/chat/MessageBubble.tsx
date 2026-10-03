"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { Copy, RefreshCw, StopCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatImagePayload, ChatMessage, ChatMessageContentPart } from '@/types';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { useLanguage } from '@/components/LanguageProvider';
import { useAssetUrl } from '@/hooks/useAssetUrl';
import { AudioMessage } from './AudioMessage';
import { ChatImage } from './ChatImage';

export interface MessageMediaHandlers {
  onRetryMedia?: (messageId: string, partIndex: number) => void;
  onZoomImage?: (image: ChatImagePayload, src: string) => void;
  onOpenInCreate?: (image: ChatImagePayload) => void;
}

interface MessageBubbleProps extends MessageMediaHandlers {
  message: ChatMessage;
  onPlayAudio?: (text: string, messageId: string) => void;
  isPlaying?: boolean;
  isLoadingAudio?: boolean;
  isAnyAudioActive?: boolean;
  onCopy?: (text: string) => void;
  onRegenerate?: () => void;
  isLastMessage?: boolean;
}

function textOf(content: ChatMessage['content']): string {
  if (typeof content === 'string') return content;
  const part = content.find((p) => p.type === 'text');
  return part && part.type === 'text' ? part.text : '';
}

/** Die Zeile "Vision Context: …" ist eine Anweisung an das Modell, kein Text fuer Menschen. */
function visibleUserText(text: string): string {
  return text.replace(/^Vision Context:\n(?:- IMAGE_\d+: .*\n)*\n?/, '');
}

const TypingDots: React.FC<{ label: string }> = ({ label }) => (
  <span className="inline-flex items-center gap-1 py-1" role="status" aria-label={label}>
    {[0, 150, 300].map((delay) => (
      <span
        key={delay}
        className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60"
        style={{ animationDelay: `${delay}ms`, animationDuration: '1s' }}
      />
    ))}
  </span>
);

const UploadedThumb: React.FC<{ image: ChatImagePayload; onZoom?: (src: string) => void }> = ({ image, onZoom }) => {
  const { url } = useAssetUrl(image.metadata?.assetId ?? undefined, image.url);
  const src = url || image.url || image.remoteUrl || '';
  if (!src) return null;
  return (
    <button
      type="button"
      onClick={() => onZoom?.(src)}
      className="press block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Hochgeladenes Bild vergrößern${image.altText ? `: ${image.altText}` : ''}`}
    >
      <img src={src} alt={image.altText || 'Hochgeladenes Bild'} className="h-28 w-auto max-w-[12rem] object-cover" />
    </button>
  );
};

const ChatVideo: React.FC<{ url: string; alt: string; assetId?: string | null }> = ({ url, alt, assetId }) => {
  const { url: localUrl } = useAssetUrl(assetId ?? undefined, url);
  return (
    <video
      controls
      preload="metadata"
      playsInline
      src={localUrl || url}
      aria-label={alt}
      className="w-full max-w-[min(100%,24rem)] rounded-2xl"
    />
  );
};

/**
 * Eine Nachricht. Text steht in einer leichten Blase, Medien stehen darunter
 * fuer sich — ohne Blase, ohne Rahmen. Aktionen (vorlesen, neu erzeugen,
 * kopieren) sind auf Touch immer sichtbar und am Desktop bei Hover UND
 * Tastaturfokus — nie nur beim Ueberfahren.
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onPlayAudio,
  isPlaying,
  isLoadingAudio,
  isAnyAudioActive,
  onCopy,
  onRegenerate,
  isLastMessage,
  onRetryMedia,
  onZoomImage,
  onOpenInCreate,
}) => {
  const { t } = useLanguage();
  const [justCopied, setJustCopied] = useState(false);
  const isUser = message.role === 'user';
  const isLoading = message.id === 'loading';
  const rawText = textOf(message.content);
  const text = isUser ? visibleUserText(rawText) : rawText;
  const parts: ChatMessageContentPart[] = typeof message.content === 'string' ? [] : message.content;
  const mediaParts = parts
    .map((part, index) => ({ part, index }))
    .filter(({ part }) => part.type !== 'text');
  const uploads = mediaParts.filter(({ part }) => part.type === 'image_url' && part.image_url.isUploaded);
  const generated = mediaParts.filter(({ part }) => !(part.type === 'image_url' && part.image_url.isUploaded));

  const showTextBubble = isLoading || text.trim().length > 0 || (message.isStreaming && !text);
  const showActions = !isUser && !isLoading && !message.isStreaming && text.trim().length > 0;

  return (
    <div className={cn('group flex w-full animate-rise flex-col gap-2 py-2', isUser ? 'items-end' : 'items-start')}>
      {isUser && uploads.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2">
          {uploads.map(({ part, index }) => part.type === 'image_url' && (
            <UploadedThumb
              key={index}
              image={part.image_url}
              onZoom={(src) => onZoomImage?.(part.image_url, src)}
            />
          ))}
        </div>
      )}

      {showTextBubble && (
        <div
          className={cn(
            'max-w-[min(100%,42rem)] rounded-3xl px-4 py-2.5 text-[15px] leading-7',
            isUser ? 'bg-primary/15 text-foreground' : 'bg-muted/45 text-foreground',
          )}
        >
          {isLoading || (message.isStreaming && !text) ? (
            <TypingDots label={t('chat.thinking')} />
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words">{text}</p>
          ) : (
            <div className="min-w-0 break-words">
              <MarkdownRenderer content={text} />
            </div>
          )}
        </div>
      )}

      {!isUser && generated.map(({ part, index }) => {
        if (part.type === 'image_url') {
          return (
            <ChatImage
              key={index}
              image={part.image_url}
              onRetry={onRetryMedia ? () => onRetryMedia(message.id, index) : undefined}
              onZoom={(src) => onZoomImage?.(part.image_url, src)}
              onOpenInCreate={onOpenInCreate ? () => onOpenInCreate(part.image_url) : undefined}
            />
          );
        }
        if (part.type === 'video_url') {
          return (
            <ChatVideo
              key={index}
              url={part.video_url.url}
              alt={part.video_url.altText || t('media.generatedVideo')}
              assetId={part.video_url.metadata?.assetId}
            />
          );
        }
        if (part.type === 'audio_url') {
          return (
            <AudioMessage
              key={index}
              audioUrl={part.audio_url.url}
              duration={part.audio_url.duration}
              className="w-full max-w-[24rem]"
            />
          );
        }
        return null;
      })}

      {showActions && (
        <div className="reveal-on-hover -mt-1 flex items-center gap-0.5 text-muted-foreground">
          {onPlayAudio && (
            <BubbleAction
              label={isPlaying ? t('action.stopAudio') : t('action.playAudio')}
              onClick={() => onPlayAudio(text, message.id)}
              disabled={isAnyAudioActive && !isPlaying}
              pressed={isPlaying}
            >
              {isLoadingAudio ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPlaying ? (
                <StopCircle className="h-4 w-4" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="M3 10v4M7 6v12M11 2v20M15 6v12M19 10v4" /></svg>
              )}
            </BubbleAction>
          )}
          {isLastMessage && onRegenerate && (
            <BubbleAction label={t('action.regenerate')} onClick={onRegenerate}>
              <RefreshCw className="h-4 w-4" />
            </BubbleAction>
          )}
          {onCopy && (
            <BubbleAction
              label={justCopied ? 'Kopiert' : t('action.copy')}
              onClick={() => {
                onCopy(text);
                setJustCopied(true);
                window.setTimeout(() => setJustCopied(false), 1500);
              }}
            >
              <Copy className="h-4 w-4" />
            </BubbleAction>
          )}
        </div>
      )}
    </div>
  );
};

function BubbleAction({ label, onClick, children, disabled, pressed }: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className="press grid h-11 w-11 place-items-center rounded-full hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 md:h-9 md:w-9"
    >
      {children}
    </button>
  );
}

export default MessageBubble;
