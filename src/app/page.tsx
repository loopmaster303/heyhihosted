"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import TileMenu from '@/components/navigation/TileMenu';
import ChatView from '@/components/chat/ChatView';
import type { ChatMessage, Conversation, ToolType } from '@/types';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [currentView, setCurrentView] = useState<'tiles' | 'chat'>('tiles');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const { toast } = useToast();

  const handleSelectTile = useCallback((toolType: ToolType) => {
    const newConversationId = crypto.randomUUID();
    const now = new Date();
    const systemMessageContent = `You are now in ${toolType} mode. How can I assist you with ${toolType.toLowerCase()}?`;
    
    const systemMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'system',
      content: systemMessageContent,
      timestamp: now,
      toolType: toolType,
    };

    const newConversation: Conversation = {
      id: newConversationId,
      title: `New ${toolType} Chat`,
      messages: [systemMessage],
      createdAt: now,
      toolType: toolType,
    };
    setActiveConversation(newConversation);
    setCurrentMessages([systemMessage]);
    setCurrentView('chat');
  }, []);

  const updateConversationTitle = useCallback(async (conversation: Conversation) => {
    if (conversation.messages.length > 1 && conversation.messages.length < 5 && (conversation.title.startsWith("New "))) {
      const messagesForTitle = conversation.messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(0, 3) 
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      if (messagesForTitle.length > 0) {
        try {
          const result = await generateChatTitle({ messages: messagesForTitle });
          setActiveConversation(prev => prev ? { ...prev, title: result.title } : null);
        } catch (error) {
          console.error("Failed to generate chat title:", error);
          // Toast for error can be added here if needed
        }
      }
    }
  }, []);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!activeConversation) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      toolType: activeConversation.toolType,
    };

    const updatedMessages = [...currentMessages, userMessage];
    setCurrentMessages(updatedMessages);
    setIsAiResponding(true);

    // Simulate AI response
    // In a real app, this would call the Pollinations API or similar
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let aiResponseContent = `AI response to "${messageText}" using ${activeConversation.toolType || 'general AI'}.`;
    if (activeConversation.toolType === 'Easy Image Loop' && messageText.toLowerCase().includes('image')) {
        aiResponseContent = `Okay, I'll generate an image based on: "${messageText}". Here is a placeholder: ![Placeholder Image](https://placehold.co/300x200.png?text=Generated+Image)`;
    } else if (activeConversation.toolType === 'Code a Loop' && messageText.toLowerCase().includes('code')) {
        aiResponseContent = "```python\nfor i in range(5):\n  print(f'Loop iteration {i+1} for: {messageText}')\n```";
    }


    const aiMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: aiResponseContent,
      timestamp: new Date(),
      toolType: activeConversation.toolType,
    };
    
    const finalMessages = [...updatedMessages, aiMessage];
    setCurrentMessages(finalMessages);
    
    const updatedConversation = {
      ...activeConversation,
      messages: finalMessages,
    };
    setActiveConversation(updatedConversation);
    setIsAiResponding(false);

    updateConversationTitle(updatedConversation);

  }, [activeConversation, currentMessages, updateConversationTitle]);

  const handleGoBack = () => {
    setCurrentView('tiles');
    setActiveConversation(null);
    setCurrentMessages([]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <AppHeader />
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-6 flex flex-col items-center justify-center">
        {currentView === 'tiles' ? (
          <TileMenu onSelectTile={handleSelectTile} />
        ) : (
          <ChatView
            conversation={activeConversation}
            messages={currentMessages}
            onSendMessage={handleSendMessage}
            isLoading={isAiResponding}
            onGoBack={handleGoBack}
          />
        )}
      </main>
    </div>
  );
}
