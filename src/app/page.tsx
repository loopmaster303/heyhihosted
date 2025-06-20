
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import ChatView from '@/components/chat/ChatView';
import ChatInput from '@/components/chat/ChatInput';
import SidebarNav from '@/components/navigation/SidebarNav';
import ToolViewHeader from '@/components/layout/ToolViewHeader';
import VisualizingLoopsTool from '@/components/tools/VisualizingLoopsTool';
import GPTImageTool from '@/components/tools/GPTImageTool';
import ReplicateImageTool from '@/components/tools/ReplicateImageTool';
import { Button } from "@/components/ui/button";
import NextImage from 'next/image';
import { X, PanelLeft } from 'lucide-react';

import type { ChatMessage, Conversation, ToolType, TileItem, ChatMessageContentPart, CurrentAppView } from '@/types';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';
import { getPollinationsChatCompletion, type PollinationsChatInput } from '@/ai/flows/pollinations-chat-flow';
import { generateImageViaPollinations } from '@/ai/flows/generate-image-flow';
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Image as ImageIconLucide, ImagePlus } from 'lucide-react'; // Renamed Image to ImageIconLucide
import { DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME, AVAILABLE_RESPONSE_STYLES, AVAILABLE_POLLINATIONS_MODELS } from '@/config/chat-options';
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
import { SidebarProvider, Sidebar, SidebarContent, SidebarRail, SidebarTrigger } from '@/components/ui/sidebar'; // Removed SidebarInset as it's not used now


const toolTileItems: TileItem[] = [
  { id: 'long language loops', title: 'long languageloops', icon: MessageSquare }, // Note: title changed to remove space for path style
  { id: 'nocost imagination', title: 'low costimagination', icon: ImageIconLucide }, // Note: title changed
  { id: "premium imagination", title: "premium costimagination", icon: ImagePlus }, // Note: title changed
];

export default function Home() {
  const [currentView, setCurrentView] = useState<CurrentAppView>('tiles');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chatToDeleteId, setChatToDeleteId] = useState<string | null>(null);

  const [isImageMode, setIsImageMode] = useState(false);
  const [activeToolTypeForView, setActiveToolTypeForView] = useState<ToolType | null>(null);

  const [isModelPreSelectionDialogOpen, setIsModelPreSelectionDialogOpen] = useState(false);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);


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
          isImageMode: conv.toolType === 'long language loops' ? (conv.isImageMode || false) : undefined,
          selectedModelId: conv.selectedModelId || (conv.toolType === 'long language loops' ? DEFAULT_POLLINATIONS_MODEL_ID : undefined),
          selectedResponseStyleName: conv.selectedResponseStyleName || (conv.toolType === 'long language loops' ? DEFAULT_RESPONSE_STYLE_NAME : undefined),
        }));
        
        const activeStoredConversations = parsedConversations.filter(conv => {
          if (conv.toolType === 'long language loops') {
            return conv.messages.some(msg => msg.role === 'user' || msg.role === 'assistant');
          }
           // For other tool types, we are not storing separate conversations for them anymore,
           // so we don't need to filter them here.
          return false; 
        });
        setAllConversations(activeStoredConversations.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (error) {
        console.error("Failed to parse conversations from localStorage", error);
        localStorage.removeItem('chatConversations'); 
      }
    }
    setIsInitialLoadComplete(true);
  }, []);

  useEffect(() => {
    if (isInitialLoadComplete) { 
        const conversationsToStore = allConversations
            .filter(conv => { 
                if (conv.toolType === 'long language loops') {
                    return conv.messages.some(msg => msg.role === 'user' || msg.role === 'assistant');
                }
                return false; // Only store LLL conversations
            })
            .map(conv => { 
                const { uploadedFile: _uploadedFile, ...storableConv } = conv;
                return storableConv;
            });

        if (conversationsToStore.length > 0) {
            localStorage.setItem('chatConversations', JSON.stringify(conversationsToStore));
        } else {
            localStorage.removeItem('chatConversations');
        }
    }
  }, [allConversations, isInitialLoadComplete]);


  const updateActiveConversationState = useCallback((updates: Partial<Conversation>) => {
    setActiveConversation(prevActive => {
      if (!prevActive) return null;
      const updatedConv = {
        ...prevActive,
        ...updates,
        uploadedFile: updates.hasOwnProperty('uploadedFile') ? updates.uploadedFile : prevActive.uploadedFile,
        uploadedFilePreview: updates.hasOwnProperty('uploadedFilePreview') ? updates.uploadedFilePreview : prevActive.uploadedFilePreview,
      };

      setAllConversations(prevAllConvs =>
        prevAllConvs.map(c => (c.id === prevActive.id ? updatedConv : c))
      );
      return updatedConv;
    });

    if (updates.hasOwnProperty('isImageMode')) {
        setIsImageMode(updates.isImageMode || false);
    }
  }, []);


  useEffect(() => {
    if (activeConversation) {
      if (activeConversation.toolType === 'long language loops') {
        setIsImageMode(activeConversation.isImageMode || false);
      } else {
        setIsImageMode(false);
      }
    } else {
        setIsImageMode(false);
    }
  }, [activeConversation]);


  const updateConversationTitle = useCallback(async (conversationId: string, messagesForTitleGen: ChatMessage[]) => {
    const convToUpdate = allConversations.find(c => c.id === conversationId);
    if (!convToUpdate || convToUpdate.toolType !== 'long language loops') return;

    const isDefaultTitle = convToUpdate.title === "New long language loops" || 
                           convToUpdate.title.toLowerCase().startsWith("new ") ||
                           convToUpdate.title === "Chat";


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


  const handleSelectPollinationsForLoop = () => {
    setActiveToolTypeForView('nocost imagination');
    setCurrentView('easyImageLoopTool');
    setActiveConversation(null); 
    setIsModelPreSelectionDialogOpen(false);
  };

  const handleSelectOpenAIForLoop = () => {
    setActiveToolTypeForView('nocost imagination'); 
    setCurrentView('gptImageTool');
    setActiveConversation(null); 
    setIsModelPreSelectionDialogOpen(false);
  };

  const cleanupPreviousEmptyLllChat = useCallback((previousActiveConv: Conversation | null) => {
    if (previousActiveConv && previousActiveConv.toolType === 'long language loops') {
        const hasMeaningfulMessages = previousActiveConv.messages.some(msg => msg.role === 'user' || msg.role === 'assistant');
        if (!hasMeaningfulMessages) {
            setAllConversations(prevAllConvs => prevAllConvs.filter(c => c.id !== previousActiveConv.id));
        }
    }
  }, []); 

  const handleGoBackToTilesView = useCallback(() => {
    const prevActive = activeConversation;

    setCurrentView('tiles');
    setActiveConversation(null);
    setCurrentMessages([]);
    setIsImageMode(false);
    setActiveToolTypeForView(null);

    cleanupPreviousEmptyLllChat(prevActive);
  }, [activeConversation, cleanupPreviousEmptyLllChat]);

  const startNewLongLanguageLoopChat = useCallback(() => {
    const previousActiveConv = activeConversation;
    cleanupPreviousEmptyLllChat(previousActiveConv);

    const newConversationId = crypto.randomUUID();
    const now = new Date();
    const conversationTitle = "New long language loops";
    const newConversation: Conversation = {
      id: newConversationId,
      title: conversationTitle,
      messages: [],
      createdAt: now,
      toolType: 'long language loops',
      isImageMode: false,
      uploadedFile: null,
      uploadedFilePreview: null,
      selectedModelId: DEFAULT_POLLINATIONS_MODEL_ID,
      selectedResponseStyleName: DEFAULT_RESPONSE_STYLE_NAME,
    };
    setAllConversations(prev => [newConversation, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setActiveConversation(newConversation);
    setCurrentMessages([]);
    setActiveToolTypeForView('long language loops');
    setCurrentView('chat');
  }, [activeConversation, cleanupPreviousEmptyLllChat]);


  const handleSelectTile = useCallback((toolType: ToolType) => {
    const previousActiveConv = activeConversation;

    setActiveToolTypeForView(toolType);
    setIsImageMode(false);

    if (toolType === 'long language loops') {
      startNewLongLanguageLoopChat();
    } else if (toolType === 'nocost imagination') {
        setActiveConversation(null); 
        setCurrentMessages([]);
        setIsModelPreSelectionDialogOpen(true);
    } else if (toolType === 'premium imagination') {
        setActiveConversation(null);
        setCurrentMessages([]);
        setCurrentView('replicateImageTool');
    } else {
      // This case should ideally not be reached with the new UI, but kept as a fallback.
      toast({
        title: "Tool Selected",
        description: `${toolType} selected. This tool is not yet fully implemented.`,
      });
      if (currentView !== 'tiles') {
          handleGoBackToTilesView(); 
      } else {
        setActiveToolTypeForView(null);
      }
    }
    
    // Cleanup logic for previous LLL chat only if the new selection isn't also LLL or is a different LLL chat
    if (previousActiveConv && previousActiveConv.toolType === 'long language loops') {
      if (activeConversation?.id !== previousActiveConv.id || toolType !== 'long language loops') {
        cleanupPreviousEmptyLllChat(previousActiveConv);
      }
    }

  }, [activeConversation, toast, handleGoBackToTilesView, cleanupPreviousEmptyLllChat, currentView, startNewLongLanguageLoopChat]);


  const handleSelectChatFromHistory = useCallback((conversationId: string) => {
    const conversationToSelect = allConversations.find(c => c.id === conversationId);
    if (!conversationToSelect) return;

    const previousActiveConv = activeConversation;

    if (conversationToSelect.toolType === 'long language loops') {
      setActiveConversation({
        ...conversationToSelect,
        selectedModelId: conversationToSelect.selectedModelId || DEFAULT_POLLINATIONS_MODEL_ID,
        selectedResponseStyleName: conversationToSelect.selectedResponseStyleName || DEFAULT_RESPONSE_STYLE_NAME,
        uploadedFile: null, 
      });
      setCurrentMessages(conversationToSelect.messages);
      setIsImageMode(conversationToSelect.isImageMode || false);
      setActiveToolTypeForView('long language loops');
      setCurrentView('chat');
    } else {
       // Non-LLL chats are not directly selectable from history in this UI paradigm
       return; 
    }

    if (previousActiveConv && previousActiveConv.id !== conversationId && previousActiveConv.toolType === 'long language loops') {
       cleanupPreviousEmptyLllChat(previousActiveConv);
    }
  }, [allConversations, activeConversation, cleanupPreviousEmptyLllChat]);


  const handleSendMessageGlobal = useCallback(async (
    messageText: string,
    options: {
      isImageModeIntent?: boolean;
    } = {}
  ) => {
    if (!activeConversation || activeConversation.toolType !== 'long language loops') {
      console.warn("handleSendMessageGlobal called without active LLL conversation.");
      return;
    }
  
    const currentActiveConv = activeConversation; 
    const currentModelId = currentActiveConv.selectedModelId || DEFAULT_POLLINATIONS_MODEL_ID;
    const currentStyleName = currentActiveConv.selectedResponseStyleName || DEFAULT_RESPONSE_STYLE_NAME;
    const currentSystemPrompt = AVAILABLE_RESPONSE_STYLES.find(s => s.name === currentStyleName)?.systemPrompt || AVAILABLE_RESPONSE_STYLES.find(s => s.name === DEFAULT_RESPONSE_STYLE_NAME)!.systemPrompt;
  
    setIsAiResponding(true);
    const conversationToUpdateId = currentActiveConv.id;
    const currentToolType = currentActiveConv.toolType;
  
    const isActuallyImagePromptMode = options.isImageModeIntent || false;
    const isActuallyFileUploadMode = !!currentActiveConv.uploadedFile && !isActuallyImagePromptMode;
  
    let userMessageContent: string | ChatMessageContentPart[] = messageText.trim();
  
    if (isActuallyImagePromptMode && messageText.trim()) {
      userMessageContent = `Image prompt: "${messageText.trim()}"`;
    } else if (isActuallyFileUploadMode && currentActiveConv.uploadedFile && currentActiveConv.uploadedFilePreview) {
      const textPart: ChatMessageContentPart = { type: 'text', text: messageText.trim() || "Describe this image." };
      const imagePart: ChatMessageContentPart = {
        type: 'image_url',
        image_url: { url: currentActiveConv.uploadedFilePreview, altText: currentActiveConv.uploadedFile.name, isUploaded: true }
      };
      userMessageContent = [textPart, imagePart];
    } else if (isActuallyFileUploadMode && (!currentActiveConv.uploadedFile || !currentActiveConv.uploadedFilePreview)){
        console.error("File selected for LLL, but file data or preview is missing from activeConversation.");
        toast({ title: "File Error", description: "Could not process uploaded file data for sending.", variant: "destructive" });
        setIsAiResponding(false);
        return;
    }
  
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content: userMessageContent, timestamp: new Date(), toolType: currentToolType,
    };
    
    const messagesForApiSubmission = [...(currentActiveConv.messages || []), userMessage];
  
    updateActiveConversationState({ messages: messagesForApiSubmission });
    setCurrentMessages(messagesForApiSubmission);
  
    let aiResponseContent: string | ChatMessageContentPart[] | null = null;
    let skipPollinationsChatCall = false;
  
    if (isActuallyImagePromptMode && messageText.trim()) {
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
    }
    
    if (!skipPollinationsChatCall) {
      try {
        const messagesForApi = messagesForApiSubmission
          .filter(msg => msg.role === 'user' || msg.role === 'assistant') 
          .map(msg => {
            let apiContentString: string;
            if (typeof msg.content === 'string') {
              apiContentString = msg.content;
            } else { 
              const textPart = msg.content.find(part => part.type === 'text');
              apiContentString = textPart ? textPart.text : "[Image content - text part missing]";
              if (apiContentString.trim() === "" && msg.content.some(p => p.type === 'image_url') && !textPart) {
                apiContentString = "[Image content only]";
              }
            }
            return { role: msg.role as 'user' | 'assistant', content: apiContentString };
          });

        if (messagesForApi.length === 0) {
          toast({ title: "Cannot send message", description: "The message content appears to be empty after processing.", variant: "destructive" });
          setIsAiResponding(false);
          return;
        }

        const apiInput: PollinationsChatInput = {
          messages: messagesForApi,
          modelId: currentModelId,
          systemPrompt: currentSystemPrompt,
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
      const finalMessages = [...messagesForApiSubmission, aiMessage];
      updateActiveConversationState({ messages: finalMessages });
      setCurrentMessages(finalMessages);
    }
    
    if (isActuallyImagePromptMode || isActuallyFileUploadMode) {
        updateActiveConversationState({ 
            isImageMode: false, 
            uploadedFile: null, 
            uploadedFilePreview: null 
        });
    }

    const finalMessagesForTitle = (allConversations.find(c=>c.id === conversationToUpdateId)?.messages || messagesForApiSubmission);
    if (finalMessagesForTitle.length > 0) {
      updateConversationTitle(conversationToUpdateId, finalMessagesForTitle);
    }
    setIsAiResponding(false);

  }, [
    activeConversation,
    allConversations, 
    updateConversationTitle,
    toast,
    updateActiveConversationState,
  ]);


  const handleRequestEditTitle = (conversationId: string) => {
    const conversation = allConversations.find(c => c.id === conversationId);
    if (!conversation) return;

    if (conversation.toolType !== 'long language loops') {
        toast({ title: "Action Not Allowed", description: "Title editing is only available for 'long language loops' chats.", variant: "destructive"});
        return;
    }

    const newTitle = window.prompt("Enter new chat title:", conversation.title);
    if (newTitle && newTitle.trim() !== "") {
      const updatedTitle = newTitle.trim();
      setAllConversations(prevConvs =>
        prevConvs.map(c => c.id === conversationId ? { ...c, title: updatedTitle } : c)
      );
      if (activeConversation?.id === conversationId) {
        setActiveConversation(prev => prevActive ? { ...prevActive, title: updatedTitle } : null);
      }
      toast({ title: "Title Updated", description: `Chat title changed to: ${updatedTitle}`});
    }
  };


  const handleRequestDeleteChat = (conversationId: string) => {
    const convToDelete = allConversations.find(c => c.id === conversationId);
    if (convToDelete && convToDelete.toolType !== 'long language loops') {
        toast({ title: "Action Not Allowed", description: "Chat deletion is only available for 'long language loops' chats.", variant: "destructive"});
        return;
    }
    setChatToDeleteId(conversationId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteChat = () => {
    if (!chatToDeleteId) return;

    const wasActiveConversationDeleted = activeConversation?.id === chatToDeleteId;
    
    setAllConversations(prevAllConvs => prevAllConvs.filter(c => c.id !== chatToDeleteId));

    if (wasActiveConversationDeleted) {
      const nextLllConversation = allConversations 
        .filter(c => c.id !== chatToDeleteId && c.toolType === 'long language loops')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      if (nextLllConversation) {
        handleSelectChatFromHistory(nextLllConversation.id);
      } else {
        handleGoBackToTilesView(); 
      }
    }
    setIsDeleteDialogOpen(false);
    setChatToDeleteId(null);
    toast({ title: "Chat Deleted", description: "The 'long language loops' conversation has been removed." });
  };

  const handleToggleImageMode = () => {
    if (!activeConversation || activeConversation.toolType !== 'long language loops') return;

    const newImageModeState = !isImageMode; 
    if (newImageModeState) { 
      updateActiveConversationState({ isImageMode: newImageModeState, uploadedFile: null, uploadedFilePreview: null });
    } else { 
      updateActiveConversationState({ isImageMode: newImageModeState });
    }
  };

  const handleFileSelect = (file: File | null) => {
    if (!activeConversation || activeConversation.toolType !== 'long language loops') return;

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        updateActiveConversationState({ 
            isImageMode: false, 
            uploadedFile: file, 
            uploadedFilePreview: dataUrl 
        });
      };
      reader.readAsDataURL(file);
    } else { 
      updateActiveConversationState({ 
          uploadedFile: null, 
          uploadedFilePreview: null 
      });
    }
  };

  const handleModelChange = useCallback((modelId: string) => {
    if (activeConversation && activeConversation.toolType === 'long language loops') {
      updateActiveConversationState({ selectedModelId: modelId });
    }
  }, [activeConversation, updateActiveConversationState]);

  const handleStyleChange = useCallback((styleName: string) => {
     if (activeConversation && activeConversation.toolType === 'long language loops') {
      updateActiveConversationState({ selectedResponseStyleName: styleName });
    }
  }, [activeConversation, updateActiveConversationState]);

  const clearUploadedImageForLLL = () => {
    if (activeConversation && activeConversation.toolType === 'long language loops') {
        handleFileSelect(null); 
    }
  }


  return (
    <div className="flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {currentView === 'tiles' ? (
        <>
          <AppHeader onNavigateToTiles={handleGoBackToTilesView} />
          <main className="flex-grow container mx-auto px-4 sm:px-6 py-10 flex flex-col items-start justify-start overflow-y-auto">
            <div className="flex flex-col items-start justify-start space-y-3 animate-in fade-in-0 duration-500">
              {toolTileItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectTile(item.id)}
                  className="font-code text-xl sm:text-2xl md:text-3xl text-foreground hover:text-primary transition-colors duration-200 text-left"
                  aria-label={`Run ${item.title.replace(/\s/g, '')}`}
                >
                  └run/{item.title.replace(/\s/g, '')}
                </button>
              ))}
            </div>
          </main>
        </>
      ) : (
        <SidebarProvider>
          <div className="flex flex-1 overflow-hidden bg-background">
            <Sidebar side="left" collapsible="icon" className="border-r-0 bg-sidebar-background"> {/* Removed border-r */}
              <SidebarContent>
                <SidebarNav
                  activeToolType={activeToolTypeForView}
                  onSelectNewChat={startNewLongLanguageLoopChat}
                  allConversations={allConversations.filter(c => c.toolType === 'long language loops')} 
                  activeConversationId={activeConversation?.id || null}
                  onSelectChatHistory={handleSelectChatFromHistory}
                  onEditTitle={handleRequestEditTitle}
                  onDeleteChat={handleRequestDeleteChat}
                  onNavigateToTiles={handleGoBackToTilesView}
                  className="w-full"
                />
              </SidebarContent>
              <SidebarRail className="hidden"/> {/* Hide rail to remove visual line if present */}
            </Sidebar>
            {/* SidebarInset is removed to allow main content to take full width when sidebar is part of the flow */}
              <main className="flex-1 flex flex-col overflow-hidden bg-background">
                {currentView === 'chat' && activeConversation && activeConversation.toolType === 'long language loops' && (
                  <>
                    <div className="p-2 flex items-center justify-between sticky top-0 z-10 bg-transparent flex-shrink-0"> {/* bg-card removed, now transparent */}
                        <div className="flex items-center gap-1">
                            <SidebarTrigger className="text-foreground/70 hover:text-foreground" />
                            {/* Removed back arrow, navigation via sidebar logo now */}
                        </div>
                         <div className="w-8 flex-shrink-0"> {/* Spacer for loading icon */}
                            {isAiResponding && <X className="h-5 w-5 animate-spin text-primary" />}
                        </div>
                    </div>
                    <ChatView
                      conversation={activeConversation}
                      messages={currentMessages}
                      isLoading={isAiResponding}
                      className="flex-grow overflow-y-auto"
                    />
                    {activeConversation.uploadedFilePreview && (
                       <div className="max-w-3xl mx-auto p-2 relative w-fit self-center">
                        <NextImage
                          src={activeConversation.uploadedFilePreview}
                          alt="Uploaded preview"
                          width={80}
                          height={80}
                          style={{ objectFit: "cover" }}
                          className="rounded-md"
                          data-ai-hint="upload preview"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                          onClick={clearUploadedImageForLLL}
                          aria-label="Clear uploaded image"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <ChatInput
                      onSendMessage={(message, opts) => handleSendMessageGlobal(message, opts)}
                      isLoading={isAiResponding}
                      isImageModeActive={isImageMode} 
                      onToggleImageMode={handleToggleImageMode}
                      uploadedFilePreviewUrl={activeConversation.uploadedFilePreview} 
                      onFileSelect={handleFileSelect}
                      isLongLanguageLoopActive={true}
                      selectedModelId={activeConversation.selectedModelId || DEFAULT_POLLINATIONS_MODEL_ID}
                      selectedResponseStyleName={activeConversation.selectedResponseStyleName || DEFAULT_RESPONSE_STYLE_NAME}
                      onModelChange={handleModelChange}
                      onStyleChange={handleStyleChange}
                    />
                     <h1 className="text-3xl md:text-4xl font-code font-semibold text-center py-4 md:py-6 text-foreground tracking-wider select-none">
                        {activeConversation.title || "Chat"}
                    </h1>
                  </>
                )}
                {currentView === 'easyImageLoopTool' && ( 
                  <>
                    <ToolViewHeader title="nocost imagination (Pollinations)" onGoBack={handleGoBackToTilesView} />
                    <VisualizingLoopsTool />
                  </>
                )}
                {currentView === 'gptImageTool' && ( 
                  <>
                    <ToolViewHeader title="nocost imagination (OpenAI GPT)" onGoBack={handleGoBackToTilesView} />
                    <GPTImageTool />
                  </>
                )}
                 {currentView === 'replicateImageTool' && ( 
                  <>
                    <ToolViewHeader title="premium imagination (Replicate)" onGoBack={handleGoBackToTilesView} />
                    <ReplicateImageTool />
                  </>
                )}
              </main>
          </div>
        </SidebarProvider>
      )}

      {isModelPreSelectionDialogOpen && activeToolTypeForView === 'nocost imagination' && (
        <AlertDialog open={isModelPreSelectionDialogOpen} onOpenChange={setIsModelPreSelectionDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Choose Image Generation Engine</AlertDialogTitle>
              <AlertDialogDescription>
                Select which image generation service you'd like to use for "nocost imagination".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
               <Button onClick={handleSelectPollinationsForLoop} className="w-full sm:w-auto">Pollinations (Flux, Turbo)</Button>
               <Button onClick={handleSelectOpenAIForLoop} className="w-full sm:w-auto">OpenAI (GPT Image)</Button>
            </AlertDialogFooter>
             <AlertDialogCancel
                onClick={() => {
                    setIsModelPreSelectionDialogOpen(false);
                    if (currentView === 'tiles' || activeToolTypeForView === 'nocost imagination') { 
                        setActiveToolTypeForView(null); 
                    }
                }}
                className="mt-2 sm:mt-0 w-full"
            >
                Cancel
            </AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isDeleteDialogOpen && chatToDeleteId && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this 'long language loops' chat
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
