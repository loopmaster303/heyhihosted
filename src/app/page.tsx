
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
import { generateImageViaPollinations } from '@/ai/flows/generate-image-flow';
import { useToast } from "@/hooks/use-toast";
import { GalleryHorizontal, CodeXml, MessageSquare, BrainCircuit } from 'lucide-react';
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
  { id: 'FLUX Kontext', title: 'FLUX Kontext', icon: BrainCircuit, description: "Engage with contextual AI" },
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
          isImageMode: conv.toolType === 'Long Language Loops' ? (conv.isImageMode || false) : undefined,
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
    if (activeConversation && activeConversation.toolType === 'Long Language Loops') {
      setIsImageMode(activeConversation.isImageMode || false);
      setUploadedFile(activeConversation.uploadedFile || null);
      setUploadedFilePreview(activeConversation.uploadedFilePreview || null);
    } else {
      setIsImageMode(false);
      setUploadedFile(null);
      setUploadedFilePreview(null);
    }
  }, [activeConversation]);

  const updateActiveConversationState = useCallback((updates: Partial<Conversation>) => {
    setActiveConversation(prevActive => {
      if (!prevActive) return null;
      const updatedConv = { ...prevActive, ...updates };
      setAllConversations(prevAllConvs =>
        prevAllConvs.map(c => (c.id === prevActive.id ? updatedConv : c))
      );
      return updatedConv;
    });
  }, []);


  const updateConversationTitle = useCallback(async (conversationId: string, messagesForTitleGen: ChatMessage[]) => {
    const convToUpdate = allConversations.find(c => c.id === conversationId);
    if (!convToUpdate) return;

    const isDefaultTitle = convToUpdate.title === "New Long Language Loop" ||
                           convToUpdate.title.startsWith("New ") || 
                           convToUpdate.title === "Chat" || 
                           convToUpdate.title === `New ${convToUpdate.toolType} Chat`;


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
          const newTitle = result.title;
          setAllConversations(prev =>
            prev.map(c => (c.id === conversationId ? { ...c, title: newTitle } : c))
          );
          if (activeConversation?.id === conversationId) {
            setActiveConversation(prev => (prev ? { ...prev, title: newTitle } : null));
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
      isImageMode: toolType === 'Long Language Loops' ? false : undefined,
      uploadedFile: toolType === 'Long Language Loops' ? null : undefined,
      uploadedFilePreview: toolType === 'Long Language Loops' ? null : undefined,
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
      isImageModeIntent?: boolean; 
    } = {}
  ) => {
    setIsAiResponding(true);
    let currentConversationRef = activeConversation;
    let conversationToUpdateId: string;
    let currentMessagesForTurn: ChatMessage[];
    let currentToolType: ToolType;
    
    if (!currentConversationRef) {
      currentToolType = 'Long Language Loops'; 
      const newConversationId = crypto.randomUUID();
      conversationToUpdateId = newConversationId;
      const now = new Date();
      
      const tempNewConv: Conversation = {
        id: newConversationId, title: "New Long Language Loop", messages: [], createdAt: now, toolType: currentToolType,
        isImageMode: (currentToolType === 'Long Language Loops' ? (options.isImageModeIntent || false) : undefined),
        uploadedFile: (currentToolType === 'Long Language Loops' ? uploadedFile : undefined), 
        uploadedFilePreview: (currentToolType === 'Long Language Loops' ? uploadedFilePreview : undefined),
      };
      setAllConversations(prev => [tempNewConv, ...prev.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())]);
      setActiveConversation(tempNewConv); 
      currentConversationRef = tempNewConv; 
      currentMessagesForTurn = []; 
      setCurrentMessages([]);
      setCurrentView('chat');
    } else {
      conversationToUpdateId = currentConversationRef.id;
      currentToolType = currentConversationRef.toolType;
      currentMessagesForTurn = [...currentConversationRef.messages]; 
    }
    
    const activeIsImageModeForSend = currentToolType === 'Long Language Loops' ? (currentConversationRef.isImageMode || options.isImageModeIntent || false) : false;
    const activeUploadedFileForSend = currentToolType === 'Long Language Loops' ? (currentConversationRef.uploadedFile || null) : null;
    const activeUploadedFilePreviewForSend = currentToolType === 'Long Language Loops' ? (currentConversationRef.uploadedFilePreview || null) : null;

    let userMessageContent: string | ChatMessageContentPart[] = messageText.trim();
    let aiResponseContent: string | ChatMessageContentPart[] | null = null;
    let skipPollinationsChatCall = false; 

    if (currentToolType === 'Long Language Loops') {
      if (activeIsImageModeForSend && messageText.trim()) { 
        userMessageContent = `Image prompt: "${messageText.trim()}"`;
      } else if (activeUploadedFileForSend) { 
        const textPart: ChatMessageContentPart = { type: 'text', text: messageText.trim() || "Describe this image." }; 
        if (!activeUploadedFilePreviewForSend) {
          console.error("File selected for LLL, but no preview data URI available.");
          toast({ title: "File Error", description: "Could not process uploaded file data.", variant: "destructive" });
          setIsAiResponding(false);
          return;
        }
        const imagePart: ChatMessageContentPart = { 
          type: 'image_url', 
          image_url: { url: activeUploadedFilePreviewForSend, altText: activeUploadedFileForSend.name, isUploaded: true }
        };
        userMessageContent = [textPart, imagePart];
      }
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content: userMessageContent, timestamp: new Date(), toolType: currentToolType,
    };
    currentMessagesForTurn.push(userMessage);
    setCurrentMessages([...currentMessagesForTurn]); 

    const interimConversationUpdate = { 
        messages: [...currentMessagesForTurn],
        ...(currentToolType === 'Long Language Loops' && activeUploadedFileForSend && {
          uploadedFile: activeUploadedFileForSend,
          uploadedFilePreview: activeUploadedFilePreviewForSend,
        }),
        ...(currentToolType === 'Long Language Loops' && {
            isImageMode: activeIsImageModeForSend
        })
    };
    
    // Ensure currentConversationRef is updated before any async calls if it was newly created
    // This makes sure that the ref passed to updateConversationTitle is the most current one.
    if (activeConversation?.id !== currentConversationRef.id && currentConversationRef.id === conversationToUpdateId) {
       setActiveConversation({ ...currentConversationRef, ...interimConversationUpdate });
    } else {
       setActiveConversation(prevActive => 
           prevActive && prevActive.id === conversationToUpdateId ? { ...prevActive, ...interimConversationUpdate } : prevActive
       );
    }
    setAllConversations(prev => prev.map(c => c.id === conversationToUpdateId ? { ...c, ...interimConversationUpdate } : c));
    
    if (currentToolType === 'Long Language Loops' && activeIsImageModeForSend && messageText.trim()) {
      try {
        const result = await generateImageViaPollinations({ prompt: messageText.trim() });
        aiResponseContent = [
          { type: 'text', text: `Generated image for: "${result.promptUsed}"` },
          { type: 'image_url', image_url: { url: result.imageDataUri, altText: `Generated image for ${result.promptUsed}`, isGenerated: true } }
        ];
        skipPollinationsChatCall = true; 
      } catch (error) {
        console.error("Error generating image via Pollinations:", error);
        const errorMessageText = error instanceof Error ? error.message : "Failed to generate image.";
        toast({ title: "Image Generation Error", description: errorMessageText, variant: "destructive" });
        aiResponseContent = `Sorry, I couldn't generate the image. ${errorMessageText}`;
        skipPollinationsChatCall = true; 
      }
    } else if (!skipPollinationsChatCall) { 
      try {
        const apiMessages = currentMessagesForTurn
          .map(msg => {
            if (msg.role === 'system') return null; 
            return { role: msg.role as 'user' | 'assistant', content: msg.content };
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
        const errorMessageText = error instanceof Error ? error.message : "Failed to get AI response.";
        toast({ title: "AI Error", description: errorMessageText, variant: "destructive" });
        aiResponseContent = `Sorry, I couldn't get a response. ${errorMessageText}`;
      }
    }

    if (aiResponseContent !== null) {
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(), role: 'assistant', content: aiResponseContent, timestamp: new Date(), toolType: currentToolType,
      };
      currentMessagesForTurn.push(aiMessage);
      setCurrentMessages([...currentMessagesForTurn]); 
    }
    
    const finalConversationState: Partial<Conversation> = {
      messages: [...currentMessagesForTurn],
      ...(currentToolType === 'Long Language Loops' && (activeIsImageModeForSend || activeUploadedFileForSend) && {
        isImageMode: false, 
        uploadedFile: null, 
        uploadedFilePreview: null, 
      }),
    };
    
    setActiveConversation(prevActive => {
        const baseConv = prevActive && prevActive.id === conversationToUpdateId ? prevActive : 
                         (currentConversationRef && currentConversationRef.id === conversationToUpdateId ? currentConversationRef : null);
        if (!baseConv) return prevActive; // Should not happen if logic is correct
        
        const updatedConv = { ...baseConv, ...finalConversationState };
        setAllConversations(prevAll => prevAll.map(c => c.id === conversationToUpdateId ? updatedConv : c));
        return updatedConv;
    });

    // Get the most up-to-date conversation for title generation
    const finalConvForTitle = allConversations.find(c => c.id === conversationToUpdateId) || 
                              (activeConversation?.id === conversationToUpdateId ? activeConversation : currentConversationRef);

    if (finalConvForTitle) { 
        const messagesToConsiderForTitle = currentMessagesForTurn.filter(msg => msg.role === 'user' || msg.role === 'assistant');
        if (messagesToConsiderForTitle.length > 0) {
            // Pass the up-to-date finalConvForTitle or its messages for context
            updateConversationTitle(conversationToUpdateId, messagesToConsiderForTitle);
        }
    }
    setIsAiResponding(false);

  }, [
    activeConversation, 
    allConversations, 
    updateConversationTitle, 
    toast, 
    uploadedFile, 
    uploadedFilePreview,
    updateActiveConversationState, 
  ]);

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
      setAllConversations(prevConvs => 
        prevConvs.map(c => c.id === conversationId ? { ...c, title: updatedTitle } : c)
      );
      if (activeConversation?.id === conversationId) {
        setActiveConversation(prevActive => prevActive ? { ...prevActive, title: updatedTitle } : null);
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
    
    const newImageModeState = !isImageMode; 
    setIsImageMode(newImageModeState); 
    
    updateActiveConversationState({ 
        isImageMode: newImageModeState, 
        ...(newImageModeState ? { uploadedFile: null, uploadedFilePreview: null } : {}) 
    });

    if (newImageModeState) { 
        setUploadedFile(null);
        setUploadedFilePreview(null);
    }
  };

  const handleFileSelect = (file: File | null) => {
    if (!activeConversation || activeConversation.toolType !== 'Long Language Loops') return;
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setUploadedFile(file);
        setUploadedFilePreview(dataUrl);
        setIsImageMode(false); 

        updateActiveConversationState({ 
          uploadedFile: file, 
          uploadedFilePreview: dataUrl,
          isImageMode: false 
        });
      };
      reader.readAsDataURL(file);
    } else { 
      setUploadedFile(null);
      setUploadedFilePreview(null);
      updateActiveConversationState({ uploadedFile: null, uploadedFilePreview: null });
    }
  };


  if (currentView === 'tiles') {
    return (
      <div className="flex flex-col h-screen bg-background text-primary selection:bg-primary selection:text-primary-foreground">
        <AppHeader />
        <main className="flex-grow container mx-auto px-2 sm:px-4 py-6 flex flex-col items-center overflow-y-auto">
          <TileMenu onSelectTile={handleSelectTile} tileItems={toolTileItems} />
        </main>
        <ChatInput
            onSendMessage={(message, model, system) => handleSendMessageGlobal(message, model, system, {isImageModeIntent: false})}
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
        onSendMessage={(message, model, system) => handleSendMessageGlobal(message, model, system, {isImageModeIntent: isImageMode})}
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

