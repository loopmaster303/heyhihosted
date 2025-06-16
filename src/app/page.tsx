
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
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const { toast } = useToast();

  // Load conversations from localStorage on initial mount
  useEffect(() => {
    const storedConversations = localStorage.getItem('chatConversations');
    if (storedConversations) {
      try {
        const parsedConversations: Conversation[] = JSON.parse(storedConversations).map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt), // Ensure dates are Date objects
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp) // Ensure timestamps are Date objects
          }))
        }));
        setAllConversations(parsedConversations);
      } catch (error) {
        console.error("Failed to parse conversations from localStorage", error);
        localStorage.removeItem('chatConversations'); // Clear corrupted data
      }
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (allConversations.length > 0) {
      localStorage.setItem('chatConversations', JSON.stringify(allConversations));
    } else {
      // If all conversations are deleted, remove the item from localStorage
      const storedConversations = localStorage.getItem('chatConversations');
      if (storedConversations) {
        localStorage.removeItem('chatConversations');
      }
    }
  }, [allConversations]);


  const updateConversationTitle = useCallback(async (conversationId: string, messagesForTitleGen: ChatMessage[]) => {
    const convIndex = allConversations.findIndex(c => c.id === conversationId);
    if (convIndex === -1) return;

    const conversation = allConversations[convIndex];
    // Only generate title if it's still a default-like title
    const isDefaultTitle = conversation.title === "New Long Language Loop" || 
                           conversation.title.startsWith("New ") || 
                           conversation.title === "Chat";

    if (messagesForTitleGen.length >= 1 && messagesForTitleGen.length < 5 && isDefaultTitle) {
      const relevantMessages = messagesForTitleGen
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(0, 3) 
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n\n');

      if (relevantMessages.length > 0) {
        try {
          const result = await generateChatTitle({ messages: relevantMessages });
          
          setAllConversations(prev =>
            prev.map(c => (c.id === conversationId ? { ...c, title: result.title } : c))
          );
          if (activeConversation?.id === conversationId) {
            setActiveConversation(prev => (prev ? { ...prev, title: result.title } : null));
          }
        } catch (error) {
          console.error("Failed to generate chat title:", error);
        }
      }
    }
  }, [allConversations, activeConversation?.id]);

  const handleSelectTile = useCallback((toolType: ToolType) => {
    const newConversationId = crypto.randomUUID();
    const now = new Date();
    
    let conversationTitle: string;

    if (toolType === 'Long Language Loops') {
      conversationTitle = "New Long Language Loop";
    } else {
      conversationTitle = `New ${toolType} Chat`;
    }
    
    const newConversation: Conversation = {
      id: newConversationId,
      title: conversationTitle,
      messages: [], // Start with no messages
      createdAt: now,
      toolType: toolType,
    };

    setAllConversations(prev => [newConversation, ...prev.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())]);
    setActiveConversation(newConversation);
    setCurrentMessages([]); // Start with no messages
    setCurrentView('chat');
  }, []);

  const handleSelectChatFromHistory = useCallback((conversationId: string) => {
    const conversation = allConversations.find(c => c.id === conversationId);
    if (conversation) {
      setActiveConversation(conversation);
      setCurrentMessages(conversation.messages);
      setCurrentView('chat');
    }
  }, [allConversations]);


  const handleSendMessageGlobal = useCallback(async (
    messageText: string, 
    modelId: string = DEFAULT_POLLINATIONS_MODEL_ID, 
    systemPrompt: string = getDefaultSystemPrompt()
  ) => {
    setIsAiResponding(true);
    let conversationToUpdate: Conversation;
    let messagesForThisTurn: ChatMessage[];
    let currentToolType: ToolType;

    if (!activeConversation) { 
      currentToolType = 'Long Language Loops'; 
      const newConversationId = crypto.randomUUID();
      const now = new Date();
      
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        timestamp: new Date(),
        toolType: currentToolType,
      };
      
      messagesForThisTurn = [userMessage]; // Start with only the user's message

      conversationToUpdate = {
        id: newConversationId,
        title: "New Long Language Loop",
        messages: messagesForThisTurn, 
        createdAt: now,
        toolType: currentToolType,
      };
      
      setAllConversations(prev => [conversationToUpdate!, ...prev.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())]);
      setActiveConversation(conversationToUpdate);
      setCurrentMessages(messagesForThisTurn);
      setCurrentView('chat');
    } else {
      conversationToUpdate = activeConversation;
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
        // Prepare messages for the API: only user and assistant messages. System prompt is handled separately by the flow.
        const apiMessages = messagesForThisTurn
          .filter(msg => msg.role === 'user' || msg.role === 'assistant')
          .map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content }));
        
        const apiInput: PollinationsChatInput = {
          messages: apiMessages,
          modelId: modelId,
          systemPrompt: systemPrompt,  // Pass the selected or default system prompt
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
        // Fallback for FLUX Kontext or other non-LLL tools
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
    
    const updatedConversationWithAiResponse = {
      ...conversationToUpdate,
      messages: finalMessages,
    };
    setActiveConversation(updatedConversationWithAiResponse);
    setAllConversations(prev =>
      prev.map(c => (c.id === conversationToUpdate.id ? updatedConversationWithAiResponse : c))
    );
    
    const messagesForTitleGen = finalMessages.filter(msg => msg.role === 'user' || msg.role === 'assistant');
    if (messagesForTitleGen.length > 0) {
        updateConversationTitle(conversationToUpdate.id, messagesForTitleGen);
    }
    
    setIsAiResponding(false);

  }, [activeConversation, currentMessages, allConversations, updateConversationTitle, toast]);

  const handleGoBackToTilesView = () => {
    setCurrentView('tiles');
    setActiveConversation(null); // Clear active conversation when going back to tiles
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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav 
          tileItems={toolTileItems} 
          activeToolType={activeConversation?.toolType || null}
          onSelectTile={handleSelectTile} // Sidebar tiles also start new chats
          allConversations={allConversations}
          activeConversationId={activeConversation?.id || null}
          onSelectChatHistory={handleSelectChatFromHistory}
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
