
"use client";

import type React from 'react';
import { cn } from '@/lib/utils';
import type { ChatMessage, ChatMessageContentPart } from '@/types';
// Avatars removed: import { Bot, User } from 'lucide-react';
import Image from 'next/image';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const renderContent = (content: string | ChatMessageContentPart[]) => {
    if (typeof content === 'string') {
      let displayContent = content;
      if (message.role === 'assistant' && (!content || content.trim() === '')) {
        displayContent = "[AI response was empty]";
      }
      // Removed whitespace-pre-wrap to better match screenshot
      return <p className="text-sm">{displayContent}</p>;
    }

    // Handle array of content parts
    return content.map((part, index) => {
      if (part.type === 'text') {
        // Removed whitespace-pre-wrap
        return <p key={index} className="text-sm">{part.text}</p>;
      }
      if (part.type === 'image_url') {
        const altText = part.image_url.altText || (part.image_url.isGenerated ? "Generated image" : (part.image_url.isUploaded ? "Uploaded image" : "Image"));
        return (
          <div key={index} className="mt-2 mb-1">
            <Image
              src={part.image_url.url}
              alt={altText}
              width={300} // Example width
              height={200} // Example height, adjust as needed
              style={{ objectFit: "contain", maxWidth: "100%", height: "auto" }} // Ensure responsive
              className="rounded-md"
              data-ai-hint={part.image_url.isGenerated ? "illustration digital art" : (part.image_url.isUploaded ? "photo object" : "image")}
            />
          </div>
        );
      }
      return null;
    });
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 my-1 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out w-full', // Reduced my-2 to my-1
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatars removed */}
      <div
        className={cn(
          'max-w-[85%] p-3', // Shadow removed generally
          isUser
            ? 'bg-primary text-primary-foreground rounded-xl' // User bubble specific style from screenshot
            : 'bg-transparent text-foreground rounded-none' // AI message: no background, no distinct rounding
        )}
      >
        {renderContent(message.content)}
      </div>
    </div>
  );
};

export default MessageBubble;
