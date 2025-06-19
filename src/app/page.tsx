
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import TileMenu from '@/components/navigation/TileMenu';
import ChatView from '@/components/chat/ChatView';
import ChatInput from '@/components/chat/ChatInput';
import SidebarNav from '@/components/navigation/SidebarNav';
import ToolViewHeader from '@/components/layout/ToolViewHeader';
import ImageKontextTool from '@/components/tools/ImageKontextTool';
import VisualizingLoopsTool from '@/components/tools/VisualizingLoopsTool';
import GPTImageTool from '@/components/tools/GPTImageTool';
import ReplicateImageTool from '@/components/tools/ReplicateImageTool'; // New Tool
import { Button } from "@/components/ui/button";

import type { ChatMessage, Conversation, ToolType, TileItem, ChatMessageContentPart, CurrentAppView } from '@/types';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';
import { getPollinationsChatCompletion, type PollinationsChatInput } from '@/ai/flows/pollinations-chat-flow';
import { generateImageViaPollinations } from '@/ai/flows/generate-image-flow';
import { useToast } from "@/hooks/use-toast";
import { GalleryHorizontal, MessageSquare, BrainCircuit } from 'lucide-react'; // CodeXml removed, GalleryHorizontal used for new tool
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


const toolTileItems: TileItem[] = [
  { id: 'FLUX Kontext', title: 'FLUX Kontext', icon: BrainCircuit, description: "Engage with contextual AI" },
  { id: 'Easy Image Loop', title: 'Visualizing Loops', icon: GalleryHorizontal, description: "Generate images via Pollinations or OpenAI" },
  { id: 'Replicate Image Tool', title: 'Visualizing Loops 2.0 beta', icon: GalleryHorizontal, description: "Generate images via Replicate API" }, // Updated Tile
  { id: 'Long Language Loops', title: 'Long Language Loops', icon: MessageSquare, description: "Chat, generate images, or analyze uploaded pictures." },
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
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
          isImageMode: conv.toolType === 'Long Language Loops' ? (conv.isImageMode || false) : undefined,
          selectedModelId: conv.selectedModelId || (conv.toolType === 'Long Language Loops' ? DEFAULT_POLLINATIONS_MODEL_ID : undefined),
          selectedResponseStyleName: conv.selectedResponseStyleName || (conv.toolType === 'Long Language Loops' ? DEFAULT_RESPONSE_STYLE_NAME : undefined),
        }));
        
        // Filter out empty LLL chats on load
        const activeStoredConversations = parsedConversations.filter(conv => {
          if (conv.toolType === 'Long Language Loops') {
            return conv.messages.some(msg => msg.role === 'user' || msg.role === 'assistant');
          }
          return true;
        });
        setAllConversations(activeStoredConversations.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (error) {
        console.error("Failed to parse conversations from localStorage", error);
        localStorage.removeItem('chatConversations'); // Clear corrupted data
      }
    }
    setIsInitialLoadComplete(true);
  }, []);

  useEffect(() => {
    if (isInitialLoadComplete) { // Only run after initial load
        const conversationsToStore = allConversations
            .filter(conv => { // Filter empty LLL chats before saving
                if (conv.toolType === 'Long Language Loops') {
                    return conv.messages.some(msg => msg.role === 'user' || msg.role === 'assistant');
                }
                return true;
            })
            .map(conv => { // Prepare for storage
                const { uploadedFile: _uploadedFile, uploadedFilePreview: _uploadedFilePreview, ...storableConv } = conv;
                return storableConv;
            });

        if (conversationsToStore.length > 0) {
            localStorage.setItem('chatConversations', JSON.stringify(conversationsToStore));
        } else {
            // If all conversations were filtered out (e.g., only empty LLL chats existed)
            localStorage.removeItem('chatConversations');
        }
    }
  }, [allConversations, isInitialLoadComplete]);


  const updateActiveConversationState = useCallback((updates: Partial<Pick<Conversation, 'isImageMode' | 'uploadedFilePreview' | 'selectedModelId' | 'selectedResponseStyleName'>> & { uploadedFile?: File | null }) => {
    setActiveConversation(prevActive => {
      if (!prevActive) return null;
      const { uploadedFile: newUploadedFile, ...otherUpdates } = updates;
      const updatedConv = { ...prevActive, ...otherUpdates };

      setAllConversations(prevAllConvs =>
        prevAllConvs.map(c => (c.id === prevActive.id ? updatedConv : c))
      );
      return updatedConv;
    });

    if (updates.hasOwnProperty('uploadedFile')) {
        setUploadedFile(updates.uploadedFile || null);
    }
    if (updates.hasOwnProperty('uploadedFilePreview')) {
        setUploadedFilePreview(updates.uploadedFilePreview || null);
    }
    if (updates.hasOwnProperty('isImageMode')) {
        setIsImageMode(updates.isImageMode || false);
    }
  }, []);


  useEffect(() => {
    if (activeConversation) {
      if (activeConversation.toolType === 'Long Language Loops') {
        setIsImageMode(activeConversation.isImageMode || false);
      } else {
        setIsImageMode(false);
        setUploadedFile(null);
        setUploadedFilePreview(null);
      }
    } else {
        setIsImageMode(false);
        setUploadedFile(null);
        setUploadedFilePreview(null);
    }
  }, [activeConversation]);


  const updateConversationTitle = useCallback(async (conversationId: string, messagesForTitleGen: ChatMessage[]) => {
    const convToUpdate = allConversations.find(c => c.id === conversationId);
    if (!convToUpdate || convToUpdate.toolType !== 'Long Language Loops') return;

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


  const handleSelectPollinationsForLoop = () => {
    setActiveToolTypeForView('Easy Image Loop');
    setCurrentView('easyImageLoopTool');
    setActiveConversation(null); 
    setIsModelPreSelectionDialogOpen(false);
  };

  const handleSelectOpenAIForLoop = () => {
    setActiveToolTypeForView('Easy Image Loop'); 
    setCurrentView('gptImageTool');
    setActiveConversation(null); 
    setIsModelPreSelectionDialogOpen(false);
  };

  const cleanupPreviousEmptyLllChat = useCallback((previousActiveConv: Conversation | null) => {
    if (previousActiveConv && previousActiveConv.toolType === 'Long Language Loops') {
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
    setUploadedFile(null);
    setUploadedFilePreview(null);
    setActiveToolTypeForView(null);

    cleanupPreviousEmptyLllChat(prevActive);
  }, [activeConversation, cleanupPreviousEmptyLllChat]);

  const handleSelectTile = useCallback((toolType: ToolType) => {
    const previousActiveConv = activeConversation;

    setActiveToolTypeForView(toolType);
    setIsImageMode(false);
    setUploadedFile(null);
    setUploadedFilePreview(null);

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
        selectedModelId: DEFAULT_POLLINATIONS_MODEL_ID,
        selectedResponseStyleName: DEFAULT_RESPONSE_STYLE_NAME,
      };
      setAllConversations(prev => [newConversation, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setActiveConversation(newConversation);
      setCurrentMessages([]);
      setCurrentView('chat');
    } else {
      setActiveConversation(null);
      setCurrentMessages([]);
      if (toolType === 'FLUX Kontext') {
        setCurrentView('fluxKontextTool');
      } else if (toolType === 'Easy Image Loop') {
        setIsModelPreSelectionDialogOpen(true);
      } else if (toolType === 'Replicate Image Tool') {
        setCurrentView('replicateImageTool');
      } else {
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
    }
    
    if (previousActiveConv && previousActiveConv.toolType === 'Long Language Loops') {
      if (activeConversation?.id !== previousActiveConv.id || toolType !== 'Long Language Loops') {
        cleanupPreviousEmptyLllChat(previousActiveConv);
      }
    }

  }, [activeConversation, toast, handleGoBackToTilesView, cleanupPreviousEmptyLllChat, currentView]);


  const handleSelectChatFromHistory = useCallback((conversationId: string) => {
    const conversationToSelect = allConversations.find(c => c.id === conversationId);
    if (!conversationToSelect) return;

    const previousActiveConv = activeConversation;

    if (conversationToSelect.toolType === 'Long Language Loops') {
      setActiveConversation({
        ...conversationToSelect,
        selectedModelId: conversationToSelect.selectedModelId || DEFAULT_POLLINATIONS_MODEL_ID,
        selectedResponseStyleName: conversationToSelect.selectedResponseStyleName || DEFAULT_RESPONSE_STYLE_NAME,
      });
      setCurrentMessages(conversationToSelect.messages);
      setIsImageMode(conversationToSelect.isImageMode || false);
      setUploadedFile(null); 
      setUploadedFilePreview(null);
      setActiveToolTypeForView('Long Language Loops');
      setCurrentView('chat');
    } else {
       toast({
          title: "Error",
          description: `Cannot open chat for tool type: ${conversationToSelect.toolType}.`,
          variant: "destructive"
      });
      return; 
    }

    if (previousActiveConv && previousActiveConv.id !== conversationId && previousActiveConv.toolType === 'Long Language Loops') {
       cleanupPreviousEmptyLllChat(previousActiveConv);
    }
  }, [allConversations, activeConversation, toast, cleanupPreviousEmptyLllChat]);


  const handleSendMessageGlobal = useCallback(async (
    messageText: string,
    options: {
      isImageModeIntent?: boolean;
    } = {}
  ) => {
    if (!activeConversation || activeConversation.toolType !== 'Long Language Loops') {
      return;
    }

    const currentModelId = activeConversation.selectedModelId || DEFAULT_POLLINATIONS_MODEL_ID;
    const currentStyleName = activeConversation.selectedResponseStyleName || DEFAULT_RESPONSE_STYLE_NAME;
    const currentSystemPrompt = AVAILABLE_RESPONSE_STYLES.find(s => s.name === currentStyleName)?.systemPrompt || AVAILABLE_RESPONSE_STYLES.find(s => s.name === DEFAULT_RESPONSE_STYLE_NAME)!.systemPrompt;


    setIsAiResponding(true);
    const conversationToUpdateId = activeConversation.id;
    let currentMessagesForTurn = [...activeConversation.messages]; 
    const currentToolType = activeConversation.toolType;

    const isActuallyImagePromptMode = options.isImageModeIntent || false;
    const isActuallyFileUploadMode = !!uploadedFile && !isActuallyImagePromptMode;

    let userMessageContent: string | ChatMessageContentPart[] = messageText.trim();
    let aiResponseContent: string | ChatMessageContentPart[] | null = null;
    let skipPollinationsChatCall = false;

    if (isActuallyImagePromptMode && messageText.trim()) {
      userMessageContent = `Image prompt: "${messageText.trim()}"`;
    } else if (isActuallyFileUploadMode && uploadedFile && uploadedFilePreview) {
      const textPart: ChatMessageContentPart = { type: 'text', text: messageText.trim() || "Describe this image." };
      const imagePart: ChatMessageContentPart = {
        type: 'image_url',
        image_url: { url: uploadedFilePreview, altText: uploadedFile.name, isUploaded: true }
      };
      userMessageContent = [textPart, imagePart];
    } else if (isActuallyFileUploadMode && (!uploadedFile || !uploadedFilePreview)){
        console.error("File selected for LLL, but file data or preview is missing.");
        toast({ title: "File Error", description: "Could not process uploaded file data for sending.", variant: "destructive" });
        setIsAiResponding(false);
        return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content: userMessageContent, timestamp: new Date(), toolType: currentToolType,
    };
    
    setActiveConversation(prevActive => {
      if (!prevActive) return null;
      const updatedMessages = [...prevActive.messages, userMessage];
      setCurrentMessages(updatedMessages); 
      return { ...prevActive, messages: updatedMessages };
    });
     setAllConversations(prevAll => prevAll.map(c => c.id === conversationToUpdateId ? {...c, messages: [...c.messages, userMessage]} : c));


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
    } else if (!skipPollinationsChatCall) {
      try {
        const messagesForApi = (allConversations.find(c => c.id === conversationToUpdateId)?.messages || [userMessage])
          .map(msg => {
            if (msg.role === 'system') return null;
            let apiContentString = "";
            if (typeof msg.content === 'string') {
              apiContentString = msg.content;
            } else {
              const textPart = msg.content.find(part => part.type === 'text');
              apiContentString = textPart ? textPart.text : "[Image content - text part missing]";
            }
            return { role: msg.role as 'user' | 'assistant', content: apiContentString };
          })
          .filter(Boolean) as PollinationsChatInput['messages'];

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
      setActiveConversation(prevActive => {
        if (!prevActive) return null;
        const updatedMessages = [...prevActive.messages, aiMessage];
        setCurrentMessages(updatedMessages);
        return { ...prevActive, messages: updatedMessages };
      });
      setAllConversations(prevAll => prevAll.map(c => c.id === conversationToUpdateId ? {...c, messages: [...c.messages, aiMessage]} : c));
    }
    
    const finalIsImageMode = (isActuallyImagePromptMode || isActuallyFileUploadMode) ? false : activeConversation.isImageMode; 
    updateActiveConversationState({ isImageMode: finalIsImageMode });


    if (isActuallyImagePromptMode || isActuallyFileUploadMode) {
        setIsImageMode(false); 
        setUploadedFile(null);
        setUploadedFilePreview(null);
        updateActiveConversationState({ uploadedFile: null, uploadedFilePreview: null, isImageMode: false}); 
    }

    const finalMessagesForTitle = allConversations.find(c=>c.id === conversationToUpdateId)?.messages || [];
    if (finalMessagesForTitle.length > 0) {
      updateConversationTitle(conversationToUpdateId, finalMessagesForTitle);
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


  const handleRequestEditTitle = (conversationId: string) => {
    const conversation = allConversations.find(c => c.id === conversationId);
    if (!conversation) return;

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
      toast({ title: "Title Updated", description: `Chat title changed to: ${updatedTitle}`});
    }
  };


  const handleRequestDeleteChat = (conversationId: string) => {
    const convToDelete = allConversations.find(c => c.id === conversationId);
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
    
    setAllConversations(prevAllConvs => prevAllConvs.filter(c => c.id !== chatToDeleteId));

    if (wasActiveConversationDeleted) {
      const nextLllConversation = allConversations 
        .filter(c => c.id !== chatToDeleteId && c.toolType === 'Long Language Loops')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      if (nextLllConversation) {
        handleSelectChatFromHistory(nextLllConversation.id);
      } else {
        handleGoBackToTilesView();
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
    if (newImageModeState) { 
        setUploadedFile(null);
        setUploadedFilePreview(null);
        updateActiveConversationState({ isImageMode: newImageModeState, uploadedFile: null, uploadedFilePreview: null });
    } else { 
        updateActiveConversationState({ isImageMode: newImageModeState });
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

        updateActiveConversationState({ isImageMode: false, uploadedFilePreview: dataUrl, uploadedFile: file });
      };
      reader.readAsDataURL(file);
    } else { 
      setUploadedFile(null);
      setUploadedFilePreview(null);
      updateActiveConversationState({ uploadedFilePreview: null, uploadedFile: null });
    }
  };

  const handleModelChange = useCallback((modelId: string) => {
    if (activeConversation && activeConversation.toolType === 'Long Language Loops') {
      updateActiveConversationState({ selectedModelId: modelId });
    }
  }, [activeConversation, updateActiveConversationState]);

  const handleStyleChange = useCallback((styleName: string) => {
     if (activeConversation && activeConversation.toolType === 'Long Language Loops') {
      updateActiveConversationState({ selectedResponseStyleName: styleName });
    }
  }, [activeConversation, updateActiveConversationState]);


  return (
    <div className="flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {currentView === 'tiles' ? (
        <>
          <AppHeader />
          <main className="flex-grow container mx-auto px-2 sm:px-4 py-6 flex flex-col items-center overflow-y-auto">
            <TileMenu onSelectTile={handleSelectTile} tileItems={toolTileItems} />
          </main>
        </>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <SidebarNav
            tileItems={toolTileItems}
            activeToolType={activeToolTypeForView}
            onSelectTile={handleSelectTile}
            allConversations={allConversations.filter(c => c.toolType === 'Long Language Loops')} 
            activeConversationId={activeConversation?.id || null}
            onSelectChatHistory={handleSelectChatFromHistory}
            onEditTitle={handleRequestEditTitle}
            onDeleteChat={handleRequestDeleteChat}
            className="w-60 md:w-72 flex-shrink-0"
          />
          <main className="flex-1 flex flex-col overflow-hidden">
            {currentView === 'chat' && activeConversation && activeConversation.toolType === 'Long Language Loops' && (
              <>
                <ChatView
                  conversation={activeConversation}
                  messages={currentMessages}
                  isLoading={isAiResponding}
                  onGoBack={handleGoBackToTilesView}
                  className="flex-grow overflow-y-auto"
                />
                <ChatInput
                  onSendMessage={(message) => handleSendMessageGlobal(message, {isImageModeIntent: isImageMode})}
                  isLoading={isAiResponding}
                  isImageModeActive={isImageMode}
                  onToggleImageMode={handleToggleImageMode}
                  uploadedFilePreviewUrl={uploadedFilePreview}
                  onFileSelect={handleFileSelect}
                  isLongLanguageLoopActive={true}
                  selectedModelId={activeConversation.selectedModelId || DEFAULT_POLLINATIONS_MODEL_ID}
                  selectedResponseStyleName={activeConversation.selectedResponseStyleName || DEFAULT_RESPONSE_STYLE_NAME}
                  onModelChange={handleModelChange}
                  onStyleChange={handleStyleChange}
                />
              </>
            )}
            {currentView === 'fluxKontextTool' && (
              <>
                <ToolViewHeader title="FLUX Kontext" onGoBack={handleGoBackToTilesView} />
                <ImageKontextTool />
              </>
            )}
            {currentView === 'easyImageLoopTool' && ( 
              <>
                <ToolViewHeader title="Visualizing Loops (Pollinations)" onGoBack={handleGoBackToTilesView} />
                <VisualizingLoopsTool />
              </>
            )}
            {currentView === 'gptImageTool' && ( 
              <>
                <ToolViewHeader title="Visualizing Loops (OpenAI GPT)" onGoBack={handleGoBackToTilesView} />
                <GPTImageTool />
              </>
            )}
             {currentView === 'replicateImageTool' && ( 
              <>
                <ToolViewHeader title="Visualizing Loops 2.0 (Replicate)" onGoBack={handleGoBackToTilesView} />
                <ReplicateImageTool />
              </>
            )}
          </main>
        </div>
      )}

      {isModelPreSelectionDialogOpen && (
        <AlertDialog open={isModelPreSelectionDialogOpen} onOpenChange={setIsModelPreSelectionDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Choose Image Generation Engine</AlertDialogTitle>
              <AlertDialogDescription>
                Select which image generation service you'd like to use for "Visualizing Loops".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
               <Button onClick={handleSelectPollinationsForLoop} className="w-full sm:w-auto">Pollinations (Flux, Turbo)</Button>
               <Button onClick={handleSelectOpenAIForLoop} className="w-full sm:w-auto">OpenAI (GPT Image)</Button>
            </AlertDialogFooter>
             <AlertDialogCancel
                onClick={() => {
                    setIsModelPreSelectionDialogOpen(false);
                    if (currentView === 'tiles' || activeToolTypeForView === 'Easy Image Loop') { 
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

    
