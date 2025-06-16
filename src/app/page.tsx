
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import TileMenu from '@/components/navigation/TileMenu';
import ChatView from '@/components/chat/ChatView';
import ChatInput from '@/components/chat/ChatInput';
import SidebarNav from '@/components/navigation/SidebarNav';
import type { ChatMessage, Conversation, ToolType, TileItem } from '@/types';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';
import { getPollinationsChatCompletion } from '@/ai/flows/pollinations-chat-flow';
import type { PollinationsChatInput } from '@/ai/flows/pollinations-chat-flow';
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, GalleryHorizontal, CodeXml, MessageSquare } from 'lucide-react';
import { DEFAULT_POLLINATIONS_MODEL_ID, getDefaultSystemPrompt } from '@/config/chat-options';


const toolTileItems: TileItem[] = [
  { id: 'FLUX Kontext', title: 'FLUX Kontext', icon: ImageIcon, description: "Engage with contextual AI" },
  { id: 'Easy Image Loop', title: 'Visualizing Loops', icon: GalleryHorizontal, description: "Generate images effortlessly" },
  { id: 'Code a Loop', title: 'Code some Loops', icon: CodeXml, description: "AI-assisted coding" },
  { id: 'Long Language Loops', title: 'Long Language Loops', icon: MessageSquare, description: "Loops about everything." },
];

export default function Home() {
  const [currentView, setCurrentView] = useState<'tiles' | 'chat'>('tiles');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const { toast } = useToast();

  const handleSelectTile = useCallback((toolType: ToolType) => {
    const newConversationId = crypto.randomUUID();
    const now = new Date();
    
    // For "Long Language Loops", use the default system prompt from config.
    // For others, use a generic system message.
    let systemMessageContent = `You are now in ${toolType} mode. How can I assist you with ${toolType.toLowerCase()}?`;
    if (toolType === 'Long Language Loops') {
      // This message is for UI display. The actual system prompt for API is handled by ChatInput selection.
      systemMessageContent = `Switched to Long Language Loops. ${getDefaultSystemPrompt()}`;
    }
    
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
          // Toast for title generation failure is optional, can be noisy
        }
      }
    }
  }, []);

  const handleSendMessageGlobal = useCallback(async (
    messageText: string, 
    modelId: string = DEFAULT_POLLINATIONS_MODEL_ID, 
    systemPrompt: string = getDefaultSystemPrompt()
  ) => {
    setIsAiResponding(true);
    let conversationToUpdate = activeConversation;
    let messagesForThisTurn: ChatMessage[];
    let currentToolType: ToolType;

    if (!conversationToUpdate) { // Sent from initial tile view or if no active conversation
      currentToolType = 'Long Language Loops'; // Default to LLL
      const newConversationId = crypto.randomUUID();
      const now = new Date();
      
      // UI system message
      const uiSystemMessageContent = `Started a new chat in ${currentToolType} mode. ${systemPrompt}`;
      const uiSystemMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'system',
        content: uiSystemMessageContent,
        timestamp: now,
        toolType: currentToolType,
      };

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        timestamp: new Date(),
        toolType: currentToolType,
      };
      
      messagesForThisTurn = [uiSystemMessage, userMessage];

      const newConversation: Conversation = {
        id: newConversationId,
        title: `New ${currentToolType} Chat`,
        messages: messagesForThisTurn, 
        createdAt: now,
        toolType: currentToolType,
      };
      
      setActiveConversation(newConversation);
      setCurrentMessages(messagesForThisTurn);
      setCurrentView('chat');
      conversationToUpdate = newConversation;
    } else {
      currentToolType = conversationToUpdate.toolType || 'Long Language Loops';
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        timestamp: new Date(),
        toolType: currentToolType,
      };
      messagesForThisTurn = [...currentMessages, userMessage];
      setCurrentMessages(messagesForThisTurn);
    }
    
    let aiResponseContent = `An unexpected error occurred.`;

    if (currentToolType === 'Long Language Loops') {
      try {
        // Prepare messages for API: system prompt + user/assistant history + current user message
        const apiMessages = messagesForThisTurn
          .filter(msg => msg.role === 'user' || msg.role === 'assistant' || (msg.role === 'system' && msg.content === systemPrompt)) // Include the relevant system prompt
          .map(msg => ({ role: msg.role, content: msg.content }));

        // Ensure the selected systemPrompt is the first message if not already there
        if (!apiMessages.find(msg => msg.role === 'system' && msg.content === systemPrompt) && systemPrompt) {
            apiMessages.unshift({role: 'system', content: systemPrompt});
        }
        
        const apiInput: PollinationsChatInput = {
          messages: apiMessages,
          modelId: modelId,
          systemPrompt: systemPrompt, // This is now primary, API structure prepends it
        };
        const result = await getPollinationsChatCompletion(apiInput);
        aiResponseContent = result.responseText;
      } catch (error) {
        console.error("Error getting chat completion:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to get AI response.";
        toast({
          title: "AI Error",
          description: errorMessage,
          variant: "destructive",
        });
        aiResponseContent = `Sorry, I couldn't get a response. ${errorMessage}`;
      }
    } else if (currentToolType === 'Easy Image Loop' && messageText.toLowerCase().includes('image')) {
        aiResponseContent = `Okay, I'll generate an image based on: "${messageText}". Here is a placeholder: ![Placeholder Image](https://placehold.co/300x200.png?text=Generated+Image)`;
    } else if (currentToolType === 'Code a Loop' && messageText.toLowerCase().includes('code')) {
        aiResponseContent = "```python\nfor i in range(5):\n  print(f'Loop iteration {i+1} for: {messageText}')\n```";
    } else {
        // Fallback for other tools or general mock response
        aiResponseContent = `Mock AI response for "${messageText}" in ${currentToolType} mode. Model: ${modelId}.`;
    }

    const aiMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: aiResponseContent,
      timestamp: new Date(),
      toolType: currentToolType,
    };
    
    const finalMessages = [...messagesForThisTurn, aiMessage];
    setCurrentMessages(finalMessages);
    
    if (conversationToUpdate) {
        const updatedConversation = {
        ...conversationToUpdate,
        messages: finalMessages,
        };
        setActiveConversation(updatedConversation);
        updateConversationTitle(updatedConversation); // Attempt to update title
    }
    
    setIsAiResponding(false);

  }, [activeConversation, currentMessages, updateConversationTitle, toast]);

  const handleGoBackToTilesView = () => {
    setCurrentView('tiles');
    // setActiveConversation(null); // Keep active conversation for potential resume? Or clear?
    // setCurrentMessages([]); // Clear messages if conversation is fully reset
  };

  if (currentView === 'tiles') {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <AppHeader />
        <main className="flex-grow container mx-auto px-2 sm:px-4 py-6 flex flex-col items-center overflow-y-auto">
          <TileMenu onSelectTile={handleSelectTile} tileItems={toolTileItems} />
        </main>
        <ChatInput 
            onSendMessage={handleSendMessageGlobal} 
            isLoading={isAiResponding} 
        />
      </div>
    );
  }

  // currentView === 'chat'
  return (
    <div className="flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav 
          tileItems={toolTileItems} 
          activeToolType={activeConversation?.toolType || null}
          onSelectTile={handleSelectTile}
          className="w-60 md:w-72 flex-shrink-0 bg-card border-r border-border" 
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatView
            conversation={activeConversation}
            messages={currentMessages}
            isLoading={isAiResponding}
            onGoBack={handleGoBackToTilesView}
            className="flex-grow overflow-y-auto"
          />
        </main>
      </div>
      <ChatInput 
        onSendMessage={handleSendMessageGlobal} 
        isLoading={isAiResponding}
      />
    </div>
  );
}
