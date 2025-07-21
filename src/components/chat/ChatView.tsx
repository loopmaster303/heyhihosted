
"use client";

import React, { useEffect, useRef, useLayoutEffect } from 'react';
import type { ChatMessage } from '@/types';
import MessageBubble from './MessageBubble';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ChatViewProps {
  messages: ChatMessage[];
  className?: string;
  onPlayAudio: (text: string, messageId: string) => void;
  playingMessageId: string | null;
  isTtsLoadingForId: string | null;
  onCopyToClipboard: (text: string) => void;
  onRegenerate: () => void;
  isAiResponding: boolean;
  lastUserMessageId: string | null;
}

const ChatView: React.FC<ChatViewProps> = ({
  messages,
  className,
  onPlayAudio,
  playingMessageId,
  isTtsLoadingForId,
  onCopyToClipboard,
  onRegenerate,
  isAiResponding,
  lastUserMessageId,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useLayoutEffect(() => {
    if (lastUserMessageId && messageRefs.current[lastUserMessageId]) {
      const element = messageRefs.current[lastUserMessageId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (messages.length > 0 && !lastUserMessageId) {
      // On initial load or chat switch, scroll to bottom
      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [lastUserMessageId, messages]);


  const isLastMessage = (index: number) => {
    // A message is the "last" for regeneration purposes if it's from the assistant
    // and there are no newer messages from the assistant.
    if (messages[index].role !== 'assistant') return false;
    
    // Find the index of the very last assistant message in the array
    const lastAssistantMessageIndex = messages.slice().reverse().findIndex(m => m.role === 'assistant');
    if (lastAssistantMessageIndex === -1) return false;

    const actualLastIndex = messages.length - 1 - lastAssistantMessageIndex;
    
    return index === actualLastIndex;
  };


  return (
    <div ref={scrollContainerRef} className={cn("w-full h-full flex flex-col bg-background overflow-y-auto no-scrollbar", className)}>
      <div className="flex-grow space-y-0">
        {messages.map((msg, index) => (
          <div key={msg.id} ref={el => messageRefs.current[msg.id] = el}>
            <MessageBubble 
              message={msg}
              onPlayAudio={onPlayAudio}
              isPlaying={playingMessageId === msg.id}
              isLoadingAudio={isTtsLoadingForId === msg.id}
              isAnyAudioActive={playingMessageId !== null || isTtsLoadingForId !== null}
              onCopy={onCopyToClipboard}
              onRegenerate={onRegenerate}
              isLastMessage={isLastMessage(index)}
            />
          </div>
        ))}
        {isAiResponding && messages[messages.length - 1]?.role === 'user' && (
           <MessageBubble message={{ id: 'loading', role: 'assistant', content: '', timestamp: new Date().toISOString() }} />
        )}
      </div>
    </div>
  );
};

export default ChatView;
