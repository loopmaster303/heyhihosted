
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
    // Check if enough messages and if title is still default
    const convIndex = allConversations.findIndex(c => c.id === conversationId);
    if (convIndex === -1) return;

    const conversation = allConversations[convIndex];
    if (messagesForTitleGen.length >= 1 && messagesForTitleGen.length < 5 && (conversation.title.startsWith("New ") || conversation.title === "Chat")) {
      const relevantMessages = messagesForTitleGen
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(0, 3) 
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n\n');

      if (relevantMessages.length > 0) {
        try {
          console.log("Attempting to generate title for:", conversation.id, "with messages:", relevantMessages);
          const result = await generateChatTitle({ messages: relevantMessages });
          console.log("Generated title:", result.title);
          
          setAllConversations(prev =>
            prev.map(c => (c.id === conversationId ? { ...c, title: result.title } : c))
          );
          if (activeConversation?.id === conversationId) {
            setActiveConversation(prev => (prev ? { ...prev, title: result.title } : null));
          }
        } catch (error) {
          console.error("Failed to generate chat title:", error);
          // Toast for title generation failure is optional, can be noisy
        }
      }
    }
  }, [allConversations, activeConversation?.id]);

  const handleSelectTile = useCallback((toolType: ToolType) => {
    const newConversationId = crypto.randomUUID();
    const now = new Date();
    
    let systemMessageContent = `You are now in ${toolType} mode. How can I assist you with ${toolType.toLowerCase()}?`;
    if (toolType === 'Long Language Loops') {
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
      title: `New ${toolType} Chat`, // Default title
      messages: [systemMessage],
      createdAt: now,
      toolType: toolType,
    };

    setAllConversations(prev => [newConversation, ...prev.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())]);
    setActiveConversation(newConversation);
    setCurrentMessages([systemMessage]);
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
    let isNewConversation = false;

    if (!activeConversation) { // Sent from initial tile view or if no active conversation
      isNewConversation = true;
      currentToolType = 'Long Language Loops'; // Default to LLL
      const newConversationId = crypto.randomUUID();
      const now = new Date();
      
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

      conversationToUpdate = {
        id: newConversationId,
        title: `New ${currentToolType} Chat`, // Default title
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
        const apiMessages = messagesForThisTurn
          .filter(msg => msg.role === 'user' || msg.role === 'assistant' || (msg.role === 'system' && msg.content === systemPrompt))
          .map(msg => ({ role: msg.role, content: msg.content }));

        if (!apiMessages.find(msg => msg.role === 'system' && msg.content === systemPrompt) && systemPrompt) {
            apiMessages.unshift({role: 'system', content: systemPrompt});
        }
        
        const apiInput: PollinationsChatInput = {
          messages: apiMessages,
          modelId: modelId,
          systemPrompt: systemPrompt,
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
    
    // Attempt to update title after AI responds, for new or existing conversations
    // Pass only user and assistant messages for title generation
    const messagesForTitleGen = finalMessages.filter(msg => msg.role === 'user' || msg.role === 'assistant');
    if (messagesForTitleGen.length > 0) {
        updateConversationTitle(conversationToUpdate.id, messagesForTitleGen);
    }
    
    setIsAiResponding(false);

  }, [activeConversation, currentMessages, allConversations, updateConversationTitle, toast]);

  const handleGoBackToTilesView = () => {
    setCurrentView('tiles');
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
            onGoBack={handleGoBackToTilesView} // This might need to be rethought if sidebar is persistent
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
