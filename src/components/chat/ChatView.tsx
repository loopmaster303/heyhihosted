
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
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // This effect ensures that the view scrolls to the bottom whenever messages change.
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const parent = scrollContainer.parentElement;
      if (parent) {
        parent.scrollTop = parent.scrollHeight;
      }
    }
  }, [messages, isAiResponding]);


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
    <div ref={scrollContainerRef} className={cn("w-full h-auto flex flex-col bg-transparent", className)}>
      <div className="flex-grow space-y-0">
        {messages.map((msg, index) => (
          <div key={msg.id}>
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
