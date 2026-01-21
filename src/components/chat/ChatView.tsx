
"use client";

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import type { ChatMessage } from '@/types';
import MessageBubble from './MessageBubble';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';

interface ChatViewProps {
  messages: ChatMessage[];
  lastUserMessageId: string | null;
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
  lastUserMessageId,
  isAiResponding,
  onPlayAudio,
  playingMessageId,
  isTtsLoadingForId,
  onCopyToClipboard,
  onRegenerate,
  className,
}) => {
  const { t } = useLanguage();
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const animatedAssistantMessagesRef = useRef<Set<string>>(new Set());

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        virtuosoRef.current?.scrollToIndex({
          index: messages.length - 1,
          behavior: 'smooth',
          align: 'end',
        });
      });
    }
  }, [messages.length, isAiResponding]);

  // Scroll to specific message when lastUserMessageId changes
  useEffect(() => {
    if (lastUserMessageId) {
      const index = messages.findIndex(m => m.id === lastUserMessageId);
      if (index !== -1) {
        requestAnimationFrame(() => {
          virtuosoRef.current?.scrollToIndex({
            index,
            behavior: 'smooth',
            align: 'start',
          });
        });
      }
    }
  }, [lastUserMessageId, messages]);

  const isLastMessageForRegeneration = useCallback((index: number) => {
    if (messages[index].role !== 'assistant') return false;
    const lastAssistantMessageIndex = messages.slice().reverse().findIndex(m => m.role === 'assistant');
    if (lastAssistantMessageIndex === -1) return false;
    const actualLastIndex = messages.length - 1 - lastAssistantMessageIndex;
    return index === actualLastIndex;
  }, [messages]);

  // Prepare messages with loading indicator if needed
  const displayMessages = useMemo(() => {
    const msgs = [...messages];
    const showLoadingBubble = isAiResponding && messages.length > 0 && messages[messages.length - 1]?.role === 'user';
    if (showLoadingBubble) {
      msgs.push({
        id: 'loading',
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      });
    }
    return msgs;
  }, [messages, isAiResponding]);

  const itemContent = useCallback((index: number) => {
    const msg = displayMessages[index];
    const isLoadingMessage = msg.id === 'loading';
    const isLast = index === displayMessages.length - 1;

    // Only animate if this is a genuinely new message being generated
    const shouldAnimate =
      msg.role === 'assistant' &&
      !isLoadingMessage &&
      isLast &&
      !animatedAssistantMessagesRef.current.has(msg.id) &&
      isAiResponding;

    return (
      <div className="px-0 py-1">
        <MessageBubble
          message={msg}
          onPlayAudio={onPlayAudio}
          isPlaying={playingMessageId === msg.id}
          isLoadingAudio={isTtsLoadingForId === msg.id}
          isAnyAudioActive={playingMessageId !== null || isTtsLoadingForId !== null}
          onCopy={onCopyToClipboard}
          onRegenerate={onRegenerate}
          isLastMessage={!isLoadingMessage && isLastMessageForRegeneration(index)}
          isAiResponding={isAiResponding && isLast}
          shouldAnimate={shouldAnimate}
          onTypewriterComplete={(id) => animatedAssistantMessagesRef.current.add(id)}
        />
      </div>
    );
  }, [displayMessages, isAiResponding, onPlayAudio, playingMessageId, isTtsLoadingForId, onCopyToClipboard, onRegenerate, isLastMessageForRegeneration]);

  if (displayMessages.length === 0) {
    return <div className={cn("w-full h-full", className)} />;
  }

  return (
    <div className={cn("w-full h-full flex flex-col bg-transparent", className)}>
      <Virtuoso
        ref={virtuosoRef}
        data={displayMessages}
        itemContent={itemContent}
        followOutput="smooth"
        initialTopMostItemIndex={Math.max(0, displayMessages.length - 1)}
        initialTopMostItemIndex={Math.max(0, displayMessages.length - 1)}
        className="flex-grow no-scrollbar py-4"
        style={{ height: '100%' }}
        overscan={200}
      />
    </div>
  );
};

export default ChatView;
