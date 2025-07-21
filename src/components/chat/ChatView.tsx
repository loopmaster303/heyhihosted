
"use client";

import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/types';
import MessageBubble from './MessageBubble';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

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
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    // Scroll to the top of the last user message when an AI response is complete
    if (lastUserMessageId && !isAiResponding) {
      const node = messageRefs.current[lastUserMessageId];
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [lastUserMessageId, isAiResponding]);

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

  return (
    <div className={cn("w-full h-auto flex flex-col bg-transparent", className)}>
      <div className="flex-grow space-y-0">
        {messages.map((msg, index) => (
          <div 
            key={msg.id} 
            ref={el => messageRefs.current[msg.id] = el}
          >
            <MessageBubble 
              message={msg}
              onPlayAudio={onPlayAudio}
              isPlaying={playingMessageId === msg.id}
              isLoadingAudio={isTtsLoadingForId === msg.id}
              isAnyAudioActive={playingMessageId !== null || isTtsLoadingForId !== null}
              onCopy={onCopyToClipboard}
              onRegenerate={onRegenerate}
              isLastMessage={isLastMessageForRegeneration(index)}
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
