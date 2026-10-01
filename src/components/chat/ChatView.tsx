"use client";

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import type { ChatMessage } from '@/types';
import MessageBubble, { type MessageMediaHandlers } from './MessageBubble';
import { cn } from '@/lib/utils';

interface ChatViewProps extends MessageMediaHandlers {
  messages: ChatMessage[];
  isAiResponding: boolean;
  onPlayAudio: (text: string, messageId: string) => void;
  playingMessageId: string | null;
  isTtsLoadingForId: string | null;
  onCopyToClipboard: (text: string) => void;
  onRegenerate: () => void;
  className?: string;
}

const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isAiResponding,
  onPlayAudio,
  playingMessageId,
  isTtsLoadingForId,
  onCopyToClipboard,
  onRegenerate,
  onRetryMedia,
  onZoomImage,
  onOpenInCreate,
  className,
}) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  useEffect(() => {
    if (messages.length === 0) return;
    requestAnimationFrame(() => {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth',
        align: 'end',
      });
    });
  }, [messages.length, isAiResponding]);

  const lastAssistantIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'assistant') return i;
    }
    return -1;
  }, [messages]);

  const displayMessages = useMemo(() => {
    const showLoadingBubble = isAiResponding && messages[messages.length - 1]?.role === 'user';
    if (!showLoadingBubble) return messages;
    return [...messages, {
      id: 'loading',
      role: 'assistant' as const,
      content: '',
      timestamp: new Date().toISOString(),
    }];
  }, [messages, isAiResponding]);

  const itemContent = useCallback((index: number) => {
    const msg = displayMessages[index];
    return (
      <div className="mx-auto w-full max-w-3xl px-4">
        <MessageBubble
          message={msg}
          onPlayAudio={onPlayAudio}
          isPlaying={playingMessageId === msg.id}
          isLoadingAudio={isTtsLoadingForId === msg.id}
          isAnyAudioActive={playingMessageId !== null || isTtsLoadingForId !== null}
          onCopy={onCopyToClipboard}
          onRegenerate={onRegenerate}
          isLastMessage={index === lastAssistantIndex && !isAiResponding}
          onRetryMedia={onRetryMedia}
          onZoomImage={onZoomImage}
          onOpenInCreate={onOpenInCreate}
        />
      </div>
    );
  }, [displayMessages, onPlayAudio, playingMessageId, isTtsLoadingForId, onCopyToClipboard, onRegenerate, lastAssistantIndex, isAiResponding, onRetryMedia, onZoomImage, onOpenInCreate]);

  if (displayMessages.length === 0) {
    return <div className={cn('h-full w-full', className)} />;
  }

  return (
    <div className={cn('flex h-full w-full flex-col', className)}>
      <Virtuoso
        ref={virtuosoRef}
        data={displayMessages}
        itemContent={itemContent}
        followOutput="smooth"
        initialTopMostItemIndex={Math.max(0, displayMessages.length - 1)}
        className="flex-grow overscroll-contain py-4"
        style={{ height: '100%' }}
        overscan={200}
        role="log"
        aria-label="Unterhaltung"
      />
    </div>
  );
};

export default ChatView;
