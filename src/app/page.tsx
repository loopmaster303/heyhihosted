
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import TileMenu from '@/components/navigation/TileMenu';
import ChatView from '@/components/chat/ChatView';
import ChatInput from '@/components/chat/ChatInput'; // Import global ChatInput
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
          toast({
            title: "Error",
            description: "Could not update chat title.",
            variant: "destructive",
          });
        }
      }
    }
  }, [toast]);

  const handleSendMessageGlobal = useCallback(async (messageText: string) => {
    setIsAiResponding(true);
    let conversationToUpdate = activeConversation;
    let messagesForThisTurn: ChatMessage[];

    if (!conversationToUpdate) {
      const defaultToolType: ToolType = 'Long Language Loops'; // Ensure this is 'Long Language Loops'
      const newConversationId = crypto.randomUUID();
      const now = new Date();
      const systemMessageContent = `You are now in ${defaultToolType} mode. How can I assist you with ${defaultToolType.toLowerCase()}?`;
      
      const systemMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'system',
        content: systemMessageContent,
        timestamp: now,
        toolType: defaultToolType,
      };

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        timestamp: new Date(),
        toolType: defaultToolType,
      };
      
      messagesForThisTurn = [systemMessage, userMessage];

      const newConversation: Conversation = {
        id: newConversationId,
        title: `New ${defaultToolType} Chat`,
        messages: messagesForThisTurn, 
        createdAt: now,
        toolType: defaultToolType,
      };
      
      setActiveConversation(newConversation);
      setCurrentMessages(messagesForThisTurn);
      setCurrentView('chat');
      conversationToUpdate = newConversation;
    } else {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        timestamp: new Date(),
        toolType: conversationToUpdate.toolType,
      };
      messagesForThisTurn = [...currentMessages, userMessage];
      setCurrentMessages(messagesForThisTurn);
    }
    
    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let aiResponseContent = `AI response to "${messageText}" using ${conversationToUpdate.toolType || 'general AI'}.`;
    if (conversationToUpdate.toolType === 'Easy Image Loop' && messageText.toLowerCase().includes('image')) {
        aiResponseContent = `Okay, I'll generate an image based on: "${messageText}". Here is a placeholder: ![Placeholder Image](https://placehold.co/300x200.png?text=Generated+Image)`;
    } else if (conversationToUpdate.toolType === 'Code a Loop' && messageText.toLowerCase().includes('code')) {
        aiResponseContent = "```python\nfor i in range(5):\n  print(f'Loop iteration {i+1} for: {messageText}')\n```";
    }

    const aiMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: aiResponseContent,
      timestamp: new Date(),
      toolType: conversationToUpdate.toolType,
    };
    
    const finalMessages = [...messagesForThisTurn, aiMessage];
    setCurrentMessages(finalMessages);
    
    const updatedConversation = {
      ...conversationToUpdate,
      messages: finalMessages,
    };
    setActiveConversation(updatedConversation);
    setIsAiResponding(false);

    updateConversationTitle(updatedConversation);

  }, [activeConversation, currentMessages, updateConversationTitle, toast]);

  const handleGoBack = () => {
    setCurrentView('tiles');
    setActiveConversation(null); 
    setCurrentMessages([]);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <AppHeader />
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-6 flex flex-col items-center overflow-y-auto">
        {currentView === 'tiles' ? (
          <TileMenu onSelectTile={handleSelectTile} />
        ) : (
          <ChatView
            conversation={activeConversation}
            messages={currentMessages}
            isLoading={isAiResponding}
            onGoBack={handleGoBack}
          />
        )}
      </main>
      <ChatInput
        onSendMessage={handleSendMessageGlobal}
        isLoading={isAiResponding}
      />
    </div>
  );
}
