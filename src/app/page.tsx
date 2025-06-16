
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


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

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chatToDeleteId, setChatToDeleteId] = useState<string | null>(null);


  useEffect(() => {
    const storedConversations = localStorage.getItem('chatConversations');
    if (storedConversations) {
      try {
        const parsedConversations: Conversation[] = JSON.parse(storedConversations).map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setAllConversations(parsedConversations);
      } catch (error) {
        console.error("Failed to parse conversations from localStorage", error);
        localStorage.removeItem('chatConversations');
      }
    }
  }, []);

  useEffect(() => {
    if (allConversations.length > 0 || localStorage.getItem('chatConversations')) {
        localStorage.setItem('chatConversations', JSON.stringify(allConversations));
    }
  }, [allConversations]);


  const updateConversationTitle = useCallback(async (conversationId: string, messagesForTitleGen: ChatMessage[]) => {
    const convIndex = allConversations.findIndex(c => c.id === conversationId);
    if (convIndex === -1) return;

    const conversation = allConversations[convIndex];
    const isDefaultTitle = conversation.title === "New Long Language Loop" ||
                           conversation.title.startsWith("New ") || // Catches "New FLUX Kontext Chat" etc.
                           conversation.title === "Chat"; // A very generic fallback

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
      const selectedTool = toolTileItems.find(item => item.id === toolType);
      conversationTitle = selectedTool ? `New ${selectedTool.title} Chat` : `New ${toolType} Chat`;
    }

    const newConversation: Conversation = {
      id: newConversationId,
      title: conversationTitle,
      messages: [],
      createdAt: now,
      toolType: toolType,
    };

    setAllConversations(prev => [newConversation, ...prev.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())]);
    setActiveConversation(newConversation);
    setCurrentMessages([]);
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
    let conversationToUpdateId: string;
    let messagesForThisTurn: ChatMessage[];
    let currentToolType: ToolType;

    if (!activeConversation) {
      currentToolType = 'Long Language Loops'; // Default to LLL if no active conversation
      const newConversationId = crypto.randomUUID();
      conversationToUpdateId = newConversationId;
      const now = new Date();

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        timestamp: new Date(),
        toolType: currentToolType,
      };

      messagesForThisTurn = [userMessage];

      const newConversation: Conversation = {
        id: newConversationId,
        title: "New Long Language Loop",
        messages: messagesForThisTurn,
        createdAt: now,
        toolType: currentToolType,
      };

      setAllConversations(prev => [newConversation, ...prev.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())]);
      setActiveConversation(newConversation);
      setCurrentMessages(messagesForThisTurn);
      setCurrentView('chat');
    } else {
      conversationToUpdateId = activeConversation.id;
      currentToolType = activeConversation.toolType || 'Long Language Loops';
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        timestamp: new Date(),
        toolType: currentToolType,
      };
      messagesForThisTurn = [...currentMessages, userMessage];
      setCurrentMessages(messagesForThisTurn);

      setAllConversations(prev =>
        prev.map(c => c.id === conversationToUpdateId ? {...c, messages: messagesForThisTurn} : c)
      );
      if (activeConversation && activeConversation.id === conversationToUpdateId) {
          setActiveConversation(prev => prev ? {...prev, messages: messagesForThisTurn} : null);
      }
    }

    let aiResponseContent = `An unexpected error occurred.`;

    if (currentToolType === 'Long Language Loops') {
      try {
        const apiMessages = messagesForThisTurn
          .filter(msg => msg.role === 'user' || msg.role === 'assistant')
          .map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content }));

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

    setAllConversations(prev =>
      prev.map(c => (c.id === conversationToUpdateId ? { ...c, messages: finalMessages } : c))
    );
    if (activeConversation && activeConversation.id === conversationToUpdateId) {
        setActiveConversation(prev => prev ? {...prev, messages: finalMessages} : null);
    }

    const conversationForTitle = allConversations.find(c => c.id === conversationToUpdateId) || 
                                 (activeConversation?.id === conversationToUpdateId ? activeConversation : null);
                                 
    if (conversationForTitle) {
      // Use finalMessages which includes the AI response for title generation
      const messagesForTitleGen = finalMessages.filter(msg => msg.role === 'user' || msg.role === 'assistant');
      updateConversationTitle(conversationToUpdateId, messagesForTitleGen);
    }

    setIsAiResponding(false);

  }, [activeConversation, currentMessages, allConversations, updateConversationTitle, toast]);

  const handleGoBackToTilesView = () => {
    setCurrentView('tiles');
    setActiveConversation(null);
  };

  const handleRequestEditTitle = (conversationId: string) => {
    const conversation = allConversations.find(c => c.id === conversationId);
    if (!conversation) return;

    const newTitle = window.prompt("Enter new chat title:", conversation.title);
    if (newTitle && newTitle.trim() !== "") {
      const updatedTitle = newTitle.trim();
      setAllConversations(prev =>
        prev.map(c => (c.id === conversationId ? { ...c, title: updatedTitle } : c))
      );
      if (activeConversation?.id === conversationId) {
        setActiveConversation(prev => (prev ? { ...prev, title: updatedTitle } : null));
      }
    }
  };

  const handleRequestDeleteChat = (conversationId: string) => {
    setChatToDeleteId(conversationId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteChat = () => {
    if (!chatToDeleteId) return;

    const wasActiveConversationDeleted = activeConversation?.id === chatToDeleteId;
    const updatedConversations = allConversations.filter(c => c.id !== chatToDeleteId);
    setAllConversations(updatedConversations);

    if (wasActiveConversationDeleted) {
      if (updatedConversations.length > 0) {
        const sortedRemainingConversations = [...updatedConversations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const nextActiveConversation = sortedRemainingConversations[0];
        setActiveConversation(nextActiveConversation);
        setCurrentMessages(nextActiveConversation.messages);
      } else {
        setCurrentView('tiles');
        setActiveConversation(null);
        setCurrentMessages([]);
      }
    }

    setIsDeleteDialogOpen(false);
    setChatToDeleteId(null);
    toast({ title: "Chat Deleted", description: "The conversation has been removed." });
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
          onSelectTile={handleSelectTile}
          allConversations={allConversations}
          activeConversationId={activeConversation?.id || null}
          onSelectChatHistory={handleSelectChatFromHistory}
          onEditTitle={handleRequestEditTitle}
          onDeleteChat={handleRequestDeleteChat}
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
      {isDeleteDialogOpen && chatToDeleteId && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this chat
                and remove its data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsDeleteDialogOpen(false); setChatToDeleteId(null); }}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeleteChat}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
    