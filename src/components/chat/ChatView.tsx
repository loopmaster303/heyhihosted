
"use client";

import React, { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/types';
import MessageBubble from './MessageBubble';
import { cn } from '@/lib/utils';
import { Loader2, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const INITIAL_MESSAGES_TO_SHOW = 50;
const LOAD_MORE_INCREMENT = 25;

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
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const animatedAssistantMessagesRef = useRef<Set<string>>(new Set());

  // Pagination state
  const [visibleMessageCount, setVisibleMessageCount] = useState(INITIAL_MESSAGES_TO_SHOW);

  // Reset visible count when switching conversations (messages length changes dramatically)
  const prevMessagesLength = useRef(messages.length);
  useEffect(() => {
    if (Math.abs(messages.length - prevMessagesLength.current) > 10) {
      setVisibleMessageCount(INITIAL_MESSAGES_TO_SHOW);
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    // This effect now triggers whenever the lastUserMessageId changes.
    // This correctly handles both sending a new message and receiving an AI response,
    // ensuring the viewport always focuses on the latest user interaction.
    if (lastUserMessageId) {
      const node = messageRefs.current[lastUserMessageId];
      if (node) {
        // We use requestAnimationFrame to ensure the DOM has updated before we scroll.
        requestAnimationFrame(() => {
          node.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    }
  }, [lastUserMessageId]); // The key change: dependency is now only on lastUserMessageId

  const isLastMessageForRegeneration = (index: number) => {
    // A message is the "last" for regeneration purposes if it's from the assistant
    // and there are no newer messages from the assistant.
    if (messages[index].role !== 'assistant') return false;

    // Find the index of the very last assistant message in the array
    const lastAssistantMessageIndex = messages.slice().reverse().findIndex(m => m.role === 'assistant');
    if (lastAssistantMessageIndex === -1) return false;

    const actualLastIndex = messages.length - 1 - lastAssistantMessageIndex;

    return index === actualLastIndex;
  };

  // Calculate which messages to show
  const totalMessages = messages.length;
  const hasOlderMessages = totalMessages > visibleMessageCount;
  const startIndex = Math.max(0, totalMessages - visibleMessageCount);
  const visibleMessages = messages.slice(startIndex);

  const loadMoreMessages = () => {
    setVisibleMessageCount(prev => Math.min(prev + LOAD_MORE_INCREMENT, totalMessages));
  };

  return (
    <div className={cn("w-full h-auto flex flex-col bg-transparent", className)}>
      {/* Load More Button */}
      {hasOlderMessages && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMoreMessages}
            className="gap-2"
          >
            <ChevronUp className="w-4 h-4" />
            {t('chat.loadOlder')}
            <span className="text-xs text-muted-foreground ml-1">
              ({totalMessages - visibleMessageCount} {totalMessages - visibleMessageCount === 1 ? 'Nachricht' : 'Nachrichten'})
            </span>
          </Button>
        </div>
      )}

      <div className="flex-grow space-y-0">
        {visibleMessages.map((msg, index) => {
          // Adjust index for original array position
          const originalIndex = startIndex + index;
          const isLast = originalIndex === messages.length - 1;
          // Only animate if this is a genuinely new message being generated, not recalled messages
          const shouldAnimate = msg.role === 'assistant' && msg.id !== 'loading' && isLast && !animatedAssistantMessagesRef.current.has(msg.id) && isAiResponding;

          return (
            <div
              key={msg.id}
              ref={el => { messageRefs.current[msg.id] = el; }}
            >
              <MessageBubble
                message={msg}
                onPlayAudio={onPlayAudio}
                isPlaying={playingMessageId === msg.id}
                isLoadingAudio={isTtsLoadingForId === msg.id}
                isAnyAudioActive={playingMessageId !== null || isTtsLoadingForId !== null}
                onCopy={onCopyToClipboard}
                onRegenerate={onRegenerate}
                isLastMessage={isLastMessageForRegeneration(originalIndex)}
                isAiResponding={isAiResponding && isLast}
                shouldAnimate={shouldAnimate}
                onTypewriterComplete={(id) => animatedAssistantMessagesRef.current.add(id)}
              />
            </div>
          );
        })}
        {isAiResponding && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
          <MessageBubble
            message={{ id: 'loading', role: 'assistant', content: '', timestamp: new Date().toISOString() }}
            isAiResponding={true}
          />
        )}
      </div>
    </div>
  );
};

export default ChatView;
