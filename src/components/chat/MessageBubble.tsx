
"use client";

import type React from 'react';
import { cn } from '@/lib/utils';
import type { ChatMessage, ChatMessageContentPart } from '@/types';
import { Bot, User } from 'lucide-react'; // User might not be needed if we remove avatar
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
      return <p className="text-sm whitespace-pre-wrap">{displayContent}</p>;
    }

    // Handle array of content parts
    return content.map((part, index) => {
      if (part.type === 'text') {
        return <p key={index} className="text-sm whitespace-pre-wrap">{part.text}</p>;
      }
      if (part.type === 'image_url') {
        const altText = part.image_url.altText || (part.image_url.isGenerated ? "Generated image" : (part.image_url.isUploaded ? "Uploaded image" : "Image"));
        return (
          <div key={index} className="mt-2 mb-1">
            <Image
              src={part.image_url.url}
              alt={altText}
              width={300}
              height={200}
              style={{ objectFit: "contain" }}
              className="rounded-md max-w-full h-auto"
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
        'flex items-start gap-3 my-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        // No avatar for AI, but keep a small spacer to align with user messages if they had one, or for structure
        // Or remove entirely if AI messages are fully left-aligned without an avatar indent
        <div className="w-8 flex-shrink-0 md:w-0"></div> // Adjusted for no AI avatar look
      )}
      <div
        className={cn(
          'max-w-[85%] p-3 shadow-md',
          isUser
            ? 'bg-primary text-primary-foreground rounded-lg' // User bubble with background
            : 'bg-transparent text-foreground rounded-none' // AI message: no background
        )}
      >
        {renderContent(message.content)}
        {/* Timestamps removed for cleaner look as per screenshot
        <p className={cn(
            "text-xs mt-1",
            isUser ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"
          )}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        */}
      </div>
      {isUser && (
        // No avatar for User
         <div className="w-0 flex-shrink-0"></div>
      )}
    </div>
  );
};

export default MessageBubble;
