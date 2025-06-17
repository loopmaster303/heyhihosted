
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
          // Ensure only LLL conversations might have these properties
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
    if (!convToUpdate || convToUpdate.toolType !== 'Long Language Loops') return; // Only LLL can generate titles

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
    if (toolType === 'Long Language Loops') {
      const newConversationId = crypto.randomUUID();
      const now = new Date();
      const conversationTitle = "New Long Language Loop";

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
    } else {
      // For FLUX Kontext, Easy Image Loop, Code a Loop - do not open chat view.
      // Stay on tiles view, ensure no active chat.
      // You might want to implement specific logic for these tools later.
      toast({
        title: "Tool Selected",
        description: `${toolType} selected. Chat functionality is only available for 'Long Language Loops'.`,
      });
      if (currentView === 'chat') {
          setCurrentView('tiles');
          setActiveConversation(null);
          setCurrentMessages([]);
      }
    }
  }, [currentView, toast]);

  const handleSelectChatFromHistory = useCallback((conversationId: string) => {
    const conversation = allConversations.find(c => c.id === conversationId);
    if (conversation) {
      if (conversation.toolType === 'Long Language Loops') { // Only allow opening LLL chats
        setActiveConversation(conversation);
        setCurrentMessages(conversation.messages);
        setCurrentView('chat');
      } else {
         toast({
            title: "Action Not Allowed",
            description: `This chat history item belongs to the '${conversation.toolType}' tool, which does not have a dedicated chat view.`,
            variant: "destructive"
        });
      }
    }
  }, [allConversations, toast]);


  const handleSendMessageGlobal = useCallback(async (
    messageText: string,
    modelId: string = DEFAULT_POLLINATIONS_MODEL_ID,
    systemPrompt: string = getDefaultSystemPrompt(),
    options: {
      isImageModeIntent?: boolean;
    } = {}
  ) => {
    if (!activeConversation) {
      toast({
        title: "No Active Chat",
        description: "Please select or start a 'Long Language Loop' chat to send a message.",
        variant: "destructive",
      });
      return;
    }

    if (activeConversation.toolType !== 'Long Language Loops') {
        toast({
            title: "Action Not Supported",
            description: `Sending messages is only supported for 'Long Language Loops'. Current tool: ${activeConversation.toolType}`,
            variant: "destructive",
        });
        return;
    }

    setIsAiResponding(true);
    const conversationToUpdateId = activeConversation.id;
    let currentMessagesForTurn = [...activeConversation.messages];
    const currentToolType = activeConversation.toolType; // Should be 'Long Language Loops'

    const activeIsImageModeForSend = isImageMode || options.isImageModeIntent || false;
    const activeUploadedFileForSend = uploadedFile;
    const activeUploadedFilePreviewForSend = uploadedFilePreview;

    let userMessageContent: string | ChatMessageContentPart[] = messageText.trim();
    let aiResponseContent: string | ChatMessageContentPart[] | null = null;
    let skipPollinationsChatCall = false;

    // This block is specific to 'Long Language Loops'
    if (activeIsImageModeForSend && messageText.trim()) {
      userMessageContent = `Image prompt: "${messageText.trim()}"`;
    } else if (activeUploadedFileForSend && activeUploadedFilePreviewForSend) {
      const textPart: ChatMessageContentPart = { type: 'text', text: messageText.trim() || "Describe this image." };
      const imagePart: ChatMessageContentPart = {
        type: 'image_url',
        image_url: { url: activeUploadedFilePreviewForSend, altText: activeUploadedFileForSend.name, isUploaded: true }
      };
      userMessageContent = [textPart, imagePart];
    } else if (activeUploadedFileForSend && !activeUploadedFilePreviewForSend) {
        console.error("File selected for LLL, but no preview data URI available.");
        toast({ title: "File Error", description: "Could not process uploaded file data.", variant: "destructive" });
        setIsAiResponding(false);
        return;
    }


    const userMessage: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content: userMessageContent, timestamp: new Date(), toolType: currentToolType,
    };
    currentMessagesForTurn.push(userMessage);
    setCurrentMessages([...currentMessagesForTurn]);

    const interimConversationUpdate = {
        messages: [...currentMessagesForTurn],
        isImageMode: activeIsImageModeForSend, // Keep current image mode intent
        uploadedFile: activeUploadedFileForSend,
        uploadedFilePreview: activeUploadedFilePreviewForSend,
    };
    updateActiveConversationState(interimConversationUpdate); // Update active and all conversations

    if (activeIsImageModeForSend && messageText.trim()) {
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
      // Reset image/file state only after a successful image generation or file processing turn
      ...( (activeIsImageModeForSend && messageText.trim()) || activeUploadedFileForSend ? {
          isImageMode: false,
          uploadedFile: null,
          uploadedFilePreview: null,
      } : {
          // Preserve current isImageMode if it wasn't an image/file send action.
          // This allows toggling image mode without sending a message.
          isImageMode: activeIsImageModeForSend 
      })
    };
    updateActiveConversationState(finalConversationState);

    // Reset local component state if it was an image/file operation
    if ((activeIsImageModeForSend && messageText.trim()) || activeUploadedFileForSend) {
        setIsImageMode(false);
        setUploadedFile(null);
        setUploadedFilePreview(null);
    }


    const finalConvForTitle = allConversations.find(c => c.id === conversationToUpdateId);
    if (finalConvForTitle) {
        const messagesToConsiderForTitle = currentMessagesForTurn.filter(msg => msg.role === 'user' || msg.role === 'assistant');
        if (messagesToConsiderForTitle.length > 0) {
            updateConversationTitle(conversationToUpdateId, messagesToConsiderForTitle);
        }
    }
    setIsAiResponding(false);

  }, [
    activeConversation,
    allConversations,
    updateConversationTitle,
    toast,
    isImageMode, // Now includes local isImageMode for activeIsImageModeForSend
    uploadedFile, // And local uploadedFile
    uploadedFilePreview, // And local uploadedFilePreview
    updateActiveConversationState,
  ]);

  const handleGoBackToTilesView = () => {
    setCurrentView('tiles');
    setActiveConversation(null);
    setCurrentMessages([]); // Clear messages when going back
  };

  const handleRequestEditTitle = (conversationId: string) => {
    const conversation = allConversations.find(c => c.id === conversationId);
    if (!conversation) return;
    // Only allow editing for LLL chats
    if (conversation.toolType !== 'Long Language Loops') {
        toast({ title: "Action Not Allowed", description: "Title editing is only available for 'Long Language Loops' chats.", variant: "destructive"});
        return;
    }
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
    const convToDelete = allConversations.find(c => c.id === conversationId);
     // Only allow deleting LLL chats from history (other tools don't create persistent chats in this model)
    if (convToDelete && convToDelete.toolType !== 'Long Language Loops') {
        toast({ title: "Action Not Allowed", description: "Chat deletion is only available for 'Long Language Loops' chats.", variant: "destructive"});
        return;
    }
    setChatToDeleteId(conversationId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteChat = () => {
    if (!chatToDeleteId) return;

    const wasActiveConversationDeleted = activeConversation?.id === chatToDeleteId;
    const updatedConversations = allConversations.filter(c => c.id !== chatToDeleteId);
    setAllConversations(updatedConversations);

    if (wasActiveConversationDeleted) {
      // Find the next LLL conversation to make active, or go to tiles view
      const nextLllConversation = updatedConversations
        .filter(c => c.toolType === 'Long Language Loops')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      if (nextLllConversation) {
        setActiveConversation(nextLllConversation);
        setCurrentMessages(nextLllConversation.messages);
      } else {
        setCurrentView('tiles');
        setActiveConversation(null);
        setCurrentMessages([]);
      }
    }
    setIsDeleteDialogOpen(false);
    setChatToDeleteId(null);
    toast({ title: "Chat Deleted", description: "The 'Long Language Loops' conversation has been removed." });
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
        setIsImageMode(false); // Turn off image prompt mode if a file is selected

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
        {/* ChatInput removed from tile view */}
      </div>
    );
  }

  // Chat view (only for Long Language Loops)
  return (
    <div className="flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav
          tileItems={toolTileItems}
          activeToolType={activeConversation?.toolType || null} // This will be 'Long Language Loops' if in chat view
          onSelectTile={handleSelectTile} // handleSelectTile will bring back to tiles if non-LLL is clicked from sidebar
          allConversations={allConversations.filter(c => c.toolType === 'Long Language Loops')} // Only show LLL chats in history
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
      {activeConversation && activeConversation.toolType === 'Long Language Loops' && (
        <ChatInput
          onSendMessage={(message, model, system) => handleSendMessageGlobal(message, model, system, {isImageModeIntent: isImageMode})}
          isLoading={isAiResponding}
          isImageModeActive={isImageMode}
          onToggleImageMode={handleToggleImageMode}
          uploadedFilePreviewUrl={uploadedFilePreview}
          onFileSelect={handleFileSelect}
          isLongLanguageLoopActive={true} // Always true if ChatInput is rendered here
        />
      )}
      {isDeleteDialogOpen && chatToDeleteId && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this 'Long Language Loops' chat
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

