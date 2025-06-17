
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import TileMenu from '@/components/navigation/TileMenu';
import ChatView from '@/components/chat/ChatView';
import ChatInput from '@/components/chat/ChatInput';
import SidebarNav from '@/components/navigation/SidebarNav';
import type { ChatMessage, Conversation, ToolType, TileItem, ChatMessageContentPart } from '@/types';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';
import { getPollinationsChatCompletion, type PollinationsChatInput } from '@/ai/flows/pollinations-chat-flow';
import { generateImageViaPollinations } from '@/ai/flows/generate-image-flow'; // Updated import
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
  { id: 'Long Language Loops', title: 'Long Language Loops', icon: MessageSquare, description: "Chat, generate images, or analyze uploaded pictures." },
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

  // States for image mode and file upload, specific to active conversation
  const [isImageMode, setIsImageMode] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);


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
          })),
          isImageMode: conv.isImageMode || false,
          uploadedFile: null, 
          uploadedFilePreview: null,
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
        const conversationsToStore = allConversations.map(conv => {
            const { uploadedFile, uploadedFilePreview, ...storableConv } = conv;
            return storableConv;
        });
        localStorage.setItem('chatConversations', JSON.stringify(conversationsToStore));
    }
  }, [allConversations]);

  useEffect(() => {
    if (activeConversation) {
      setIsImageMode(activeConversation.isImageMode || false);
      setUploadedFile(activeConversation.uploadedFile || null);
      setUploadedFilePreview(activeConversation.uploadedFilePreview || null);
    } else {
      setIsImageMode(false);
      setUploadedFile(null);
      setUploadedFilePreview(null);
    }
  }, [activeConversation]);

  const updateActiveConversationState = (updates: Partial<Conversation>) => {
    if (!activeConversation) return;
    const updatedConv = { ...activeConversation, ...updates };
    setActiveConversation(updatedConv);
    setAllConversations(prev => prev.map(c => c.id === activeConversation.id ? updatedConv : c));
  };


  const updateConversationTitle = useCallback(async (conversationId: string, messagesForTitleGen: ChatMessage[]) => {
    const convIndex = allConversations.findIndex(c => c.id === conversationId);
    if (convIndex === -1) return;

    const conversation = allConversations[convIndex];
    const isDefaultTitle = conversation.title === "New Long Language Loop" ||
                           conversation.title.startsWith("New ") || 
                           conversation.title === "Chat";

    if (messagesForTitleGen.length >= 1 && messagesForTitleGen.length < 5 && isDefaultTitle) {
      const relevantTextMessages = messagesForTitleGen
        .map(msg => {
          if (typeof msg.content === 'string') return `${msg.role}: ${msg.content}`;
          const textPart = msg.content.find(part => part.type === 'text');
          return textPart ? `${msg.role}: ${textPart.text}` : null;
        })
        .filter(Boolean) 
        .slice(0, 3)
        .join('\n\n');

      if (relevantTextMessages.length > 0) {
        try {
          const result = await generateChatTitle({ messages: relevantTextMessages });
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
      isImageMode: false,
      uploadedFile: null,
      uploadedFilePreview: null,
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
    systemPrompt: string = getDefaultSystemPrompt(),
    options: { 
      isImageMode?: boolean;
    } = {}
  ) => {
    setIsAiResponding(true);
    let conversationToUpdateId: string;
    let messagesForThisTurn: ChatMessage[];
    let currentToolType: ToolType;
    let currentConversationRef = activeConversation; 

    if (!currentConversationRef) {
      currentToolType = 'Long Language Loops'; 
      const newConversationId = crypto.randomUUID();
      conversationToUpdateId = newConversationId;
      const now = new Date();
      const tempNewConv: Conversation = {
        id: newConversationId, title: "New Long Language Loop", messages: [], createdAt: now, toolType: currentToolType,
        isImageMode: options.isImageMode || false,
        uploadedFile: uploadedFile || null, 
        uploadedFilePreview: uploadedFilePreview || null, 
      };
      setAllConversations(prev => [tempNewConv, ...prev.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())]);
      setActiveConversation(tempNewConv);
      currentConversationRef = tempNewConv;
      messagesForThisTurn = [];
      setCurrentMessages([]);
      setCurrentView('chat');
    } else {
      conversationToUpdateId = currentConversationRef.id;
      currentToolType = currentConversationRef.toolType || 'Long Language Loops';
      messagesForThisTurn = [...currentMessages];
    }
    
    const activeIsImageMode = currentConversationRef.isImageMode || false;
    const activeUploadedFile = currentConversationRef.uploadedFile || null;

    let userMessageContent: string | ChatMessageContentPart[] = messageText;
    let aiResponseContent: string | ChatMessageContentPart[] = `An unexpected error occurred.`;
    let skipPollinationsCall = false;

    if (currentToolType === 'Long Language Loops') {
      if (activeIsImageMode && messageText.trim()) { 
        userMessageContent = `Image prompt: "${messageText.trim()}"`;
        try {
          // Use the new Pollinations image generation flow
          const result = await generateImageViaPollinations({ prompt: messageText.trim() });
          aiResponseContent = [
            { type: 'text', text: `Generated image for: "${result.promptUsed}"` },
            { type: 'image_url', image_url: { url: result.imageDataUri, altText: `Generated image for ${result.promptUsed}`, isGenerated: true } }
          ];
          skipPollinationsCall = true;
          updateActiveConversationState({ isImageMode: false }); 
        } catch (error) {
          console.error("Error generating image via Pollinations:", error);
          const errorMessage = error instanceof Error ? error.message : "Failed to generate image.";
          toast({ title: "Image Generation Error", description: errorMessage, variant: "destructive" });
          aiResponseContent = `Sorry, I couldn't generate the image. ${errorMessage}`;
          skipPollinationsCall = true; 
          updateActiveConversationState({ isImageMode: false });
        }
      } else if (activeUploadedFile) { 
        const reader = new FileReader();
        const fileReadPromise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(activeUploadedFile);
        });

        try {
          const dataUrl = await fileReadPromise;
          const textPart: ChatMessageContentPart = { type: 'text', text: messageText.trim() || "Describe this image." };
          const imagePart: ChatMessageContentPart = { type: 'image_url', image_url: { url: dataUrl, altText: activeUploadedFile.name, isUploaded: true } };
          userMessageContent = [textPart, imagePart];
          updateActiveConversationState({ uploadedFile: null, uploadedFilePreview: null });
        } catch (error) {
           console.error("Error reading uploaded file:", error);
           toast({ title: "File Read Error", description: "Could not read the uploaded file.", variant: "destructive" });
           aiResponseContent = `Sorry, I couldn't read the uploaded file.`;
           skipPollinationsCall = true;
           updateActiveConversationState({ uploadedFile: null, uploadedFilePreview: null });
        }
      }
    }


    const userMessage: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content: userMessageContent, timestamp: new Date(), toolType: currentToolType,
    };
    messagesForThisTurn = [...messagesForThisTurn, userMessage];
    setCurrentMessages(messagesForThisTurn);
    setAllConversations(prev => prev.map(c => c.id === conversationToUpdateId ? {...c, messages: messagesForThisTurn} : c));
    if (currentConversationRef && currentConversationRef.id === conversationToUpdateId) {
      setActiveConversation(prev => prev ? {...prev, messages: messagesForThisTurn} : null);
    }


    if (!skipPollinationsCall) { 
      try {
        const apiMessages = messagesForThisTurn
          .map(msg => {
            if (typeof msg.content === 'string') {
              return { role: msg.role as 'user' | 'assistant', content: msg.content };
            }
            const role = msg.role as 'user' | 'assistant'; 
            if (role !== 'user' && role !== 'assistant') return null; 
            return { role, content: msg.content };
          })
          .filter(Boolean) as PollinationsChatInput['messages'];


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
        toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
        aiResponseContent = `Sorry, I couldn't get a response. ${errorMessage}`;
      }
    }


    const aiMessage: ChatMessage = {
      id: crypto.randomUUID(), role: 'assistant', content: aiResponseContent, timestamp: new Date(), toolType: currentToolType,
    };
    const finalMessages = [...messagesForThisTurn, aiMessage];
    setCurrentMessages(finalMessages);

    setAllConversations(prev =>
      prev.map(c => (c.id === conversationToUpdateId ? { ...c, messages: finalMessages, isImageMode: false, uploadedFile: null, uploadedFilePreview: null } : c))
    );
     const finalActiveConv = allConversations.find(c => c.id === conversationToUpdateId);
     if (finalActiveConv) {
         setActiveConversation({...finalActiveConv, messages: finalMessages, isImageMode: false, uploadedFile: null, uploadedFilePreview: null });
     }


    const conversationForTitle = allConversations.find(c => c.id === conversationToUpdateId) || 
                                 (activeConversation?.id === conversationToUpdateId ? activeConversation : null);
    if (conversationForTitle) {
      updateConversationTitle(conversationToUpdateId, finalMessages.filter(msg => msg.role === 'user' || msg.role === 'assistant'));
    }
    setIsAiResponding(false);

  }, [activeConversation, currentMessages, allConversations, updateConversationTitle, toast, uploadedFile, uploadedFilePreview]);

  const handleGoBackToTilesView = () => {
    setCurrentView('tiles');
    setActiveConversation(null);
    setIsImageMode(false);
    setUploadedFile(null);
    setUploadedFilePreview(null);
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

  const handleToggleImageMode = () => {
    if (!activeConversation || activeConversation.toolType !== 'Long Language Loops') return;
    const newImageMode = !isImageMode;
    updateActiveConversationState({ isImageMode: newImageMode, uploadedFile: null, uploadedFilePreview: null });
  };

  const handleFileSelect = (file: File | null) => {
    if (!activeConversation || activeConversation.toolType !== 'Long Language Loops') return;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateActiveConversationState({ 
          uploadedFile: file, 
          uploadedFilePreview: reader.result as string,
          isImageMode: false 
        });
      };
      reader.readAsDataURL(file);
    } else { 
      updateActiveConversationState({ uploadedFile: null, uploadedFilePreview: null });
    }
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
            isImageModeActive={false} 
            onToggleImageMode={() => {}} 
            uploadedFilePreviewUrl={null} 
            onFileSelect={() => {}} 
            isLongLanguageLoopActive={false} 
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
        isImageModeActive={activeConversation?.toolType === 'Long Language Loops' ? isImageMode : false}
        onToggleImageMode={handleToggleImageMode}
        uploadedFilePreviewUrl={activeConversation?.toolType === 'Long Language Loops' ? uploadedFilePreview : null}
        onFileSelect={handleFileSelect}
        isLongLanguageLoopActive={activeConversation?.toolType === 'Long Language Loops'}
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
