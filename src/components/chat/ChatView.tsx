
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

  return (
    <div className={cn("w-full h-auto flex flex-col bg-transparent", className)}>
      <div className="flex-grow space-y-0">
        {messages.map((msg, index) => (
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
              isLastMessage={isLastMessageForRegeneration(index)}
              isAiResponding={isAiResponding && index === messages.length - 1}
            />
          </div>
        ))}
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
