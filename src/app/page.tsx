
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import ChatView from '@/components/chat/ChatView';
import ChatInput from '@/components/chat/ChatInput';
import SidebarNav from '@/components/navigation/SidebarNav';
import VisualizingLoopsTool from '@/components/tools/VisualizingLoopsTool';
import GPTImageTool from '@/components/tools/GPTImageTool'; 
import ReplicateImageTool from '@/components/tools/ReplicateImageTool';
import PersonalizationTool from '@/components/tools/PersonalizationTool';
import { Button } from "@/components/ui/button";
import NextImage from 'next/image';
import { X } from 'lucide-react';

import type { ChatMessage, Conversation, ToolType, TileItem, ChatMessageContentPart, CurrentAppView } from '@/types';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';
import { getPollinationsChatCompletion, type PollinationsChatInput } from '@/ai/flows/pollinations-chat-flow';
import { generateImageViaPollinations } from '@/ai/flows/generate-image-flow';
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME, AVAILABLE_RESPONSE_STYLES } from '@/config/chat-options';
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
  { id: 'long language loops', title: 'long.language.loops' },
  { id: 'nocost imagination', title: 'nocost.imagination' },
  { id: 'premium imagination', title: 'premium.imagination' },
  { id: 'personalization', title: 'import/personalization' },
];

const PERSONALIZATION_SETTINGS_KEY = 'personalizationSettings';
const ACTIVE_TOOL_TYPE_KEY = 'activeToolTypeForView';
const ACTIVE_CONVERSATION_ID_KEY = 'activeConversationId';


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

  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  const [userDisplayName, setUserDisplayName] = useState<string>("User");
  const [customSystemPrompt, setCustomSystemPrompt] = useState<string>("");

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
          return false; 
        });
        setAllConversations(activeStoredConversations.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (error) {
        console.error("Failed to parse conversations from localStorage", error);
        localStorage.removeItem('chatConversations'); 
      }
    }

    const storedPersonalization = localStorage.getItem(PERSONALIZATION_SETTINGS_KEY);
    if (storedPersonalization) {
      try {
        const settings = JSON.parse(storedPersonalization);
        if (settings.userDisplayName) setUserDisplayName(settings.userDisplayName);
        if (settings.customSystemPrompt) setCustomSystemPrompt(settings.customSystemPrompt);
      } catch (error) {
        console.error("Failed to parse personalization settings from localStorage", error);
        localStorage.removeItem(PERSONALIZATION_SETTINGS_KEY);
      }
    }

    const storedActiveToolType = localStorage.getItem(ACTIVE_TOOL_TYPE_KEY) as ToolType | null;
    if (storedActiveToolType && toolTileItems.some(item => item.id === storedActiveToolType)) {
      setActiveToolTypeForView(storedActiveToolType);
      
      if (storedActiveToolType === 'long language loops') {
        const storedActiveConvId = localStorage.getItem(ACTIVE_CONVERSATION_ID_KEY);
        if (storedActiveConvId) {
          // We need to find the conversation from the potentially already loaded `allConversations`
          // This part requires `allConversations` to be populated first.
          // Let's adjust the logic slightly: populate `allConversations` then try to find the active one.
          const conv = JSON.parse(storedConversations || '[]').find((c: Conversation) => c.id === storedActiveConvId);
          if (conv) {
             setActiveConversation(conv);
             setCurrentMessages(conv.messages);
             setCurrentView('chat');
          } else {
            setCurrentView('tiles'); 
          }
        } else {
            setCurrentView('tiles'); 
        }
      } else if (storedActiveToolType === 'nocost imagination') {
        setCurrentView('easyImageLoopTool');
      } else if (storedActiveToolType === 'premium imagination') {
        setCurrentView('replicateImageTool');
      } else if (storedActiveToolType === 'personalization') {
        setCurrentView('personalizationTool');
      } else {
        setCurrentView('tiles');
      }
    } else {
        setCurrentView('tiles');
    }


    setIsInitialLoadComplete(true);
  }, []); 

  
  useEffect(() => {
    if (isInitialLoadComplete) {
      if (activeToolTypeForView) {
        localStorage.setItem(ACTIVE_TOOL_TYPE_KEY, activeToolTypeForView);
      } else {
        localStorage.removeItem(ACTIVE_TOOL_TYPE_KEY);
      }
      if (currentView === 'chat' && activeConversation) {
        localStorage.setItem(ACTIVE_CONVERSATION_ID_KEY, activeConversation.id);
      } else {
        // Only remove if we are not in chat or there's no active conversation
        if (currentView !== 'chat' || !activeConversation) {
           localStorage.removeItem(ACTIVE_CONVERSATION_ID_KEY);
        }
      }
    }
  }, [activeToolTypeForView, activeConversation, currentView, isInitialLoadComplete]);


  const savePersonalizationSettings = useCallback(() => {
    const settings = { userDisplayName, customSystemPrompt };
    localStorage.setItem(PERSONALIZATION_SETTINGS_KEY, JSON.stringify(settings));
  }, [userDisplayName, customSystemPrompt]);

  useEffect(() => {
    if (isInitialLoadComplete) {
        savePersonalizationSettings();
    }
  }, [userDisplayName, customSystemPrompt, isInitialLoadComplete, savePersonalizationSettings]);


  useEffect(() => {
    if (isInitialLoadComplete) { 
        const conversationsToStore = allConversations
            .filter(conv => { 
                if (conv.toolType === 'long language loops') {
                    return conv.messages.some(msg => msg.role === 'user' || msg.role === 'assistant');
                }
                return false; 
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

    const isDefaultTitle = convToUpdate.title === "default.long.language.loop" || 
                           convToUpdate.title.toLowerCase().startsWith("new ") || // Keep for backward compatibility if old "new..." titles exist
                           convToUpdate.title === "Chat"; // Another fallback check


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
    const conversationTitle = "default.long.language.loop"; 
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
        setCurrentView('easyImageLoopTool');
    } else if (toolType === 'premium imagination') {
        setActiveConversation(null);
        setCurrentMessages([]);
        setCurrentView('replicateImageTool');
    } else if (toolType === 'personalization') {
        setActiveConversation(null);
        setCurrentMessages([]);
        setCurrentView('personalizationTool');
    }
    
    if (previousActiveConv && previousActiveConv.toolType === 'long language loops') {
      if (activeConversation?.id !== previousActiveConv.id || toolType !== 'long language loops') {
        cleanupPreviousEmptyLllChat(previousActiveConv);
      }
    }
  }, [activeConversation, cleanupPreviousEmptyLllChat, startNewLongLanguageLoopChat]);


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
      return;
    }
  
    const currentActiveConv = activeConversation; 
    const currentModelId = currentActiveConv.selectedModelId || DEFAULT_POLLINATIONS_MODEL_ID;
    
    let effectiveSystemPrompt: string;
    if (customSystemPrompt && customSystemPrompt.trim() !== "") {
      effectiveSystemPrompt = customSystemPrompt.replace(/{userDisplayName}/gi, userDisplayName || "User");
    } else {
      const currentStyleName = currentActiveConv.selectedResponseStyleName || DEFAULT_RESPONSE_STYLE_NAME;
      effectiveSystemPrompt = AVAILABLE_RESPONSE_STYLES.find(s => s.name === currentStyleName)?.systemPrompt || AVAILABLE_RESPONSE_STYLES.find(s => s.name === DEFAULT_RESPONSE_STYLE_NAME)!.systemPrompt;
    }
  
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
        toast({ title: "File Error", description: "Could not process uploaded file data for sending.", variant: "destructive" });
        setIsAiResponding(false);
        return;
    }
  
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content: userMessageContent, timestamp: new Date(), toolType: currentToolType,
    };
    
    const messagesForApiSubmission = [...(currentActiveConv.messages || []), userMessage]
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

    if (messagesForApiSubmission.length === 0) {
      toast({ title: "Cannot send message", description: "The message content appears to be empty after processing.", variant: "destructive" });
      setIsAiResponding(false);
      return;
    }

    const updatedMessagesForState = [...(currentActiveConv.messages || []), userMessage];
    updateActiveConversationState({ messages: updatedMessagesForState });
    setCurrentMessages(updatedMessagesForState);
  
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
        const errorMessageText = error instanceof Error ? error.message : "Failed to generate image.";
        toast({ title: "Image Generation Error", description: errorMessageText, variant: "destructive" });
        aiResponseContent = `Sorry, I couldn't generate the image. ${errorMessageText}`;
        skipPollinationsChatCall = true; 
      }
    }
    
    if (!skipPollinationsChatCall) {
      try {
        const apiInput: PollinationsChatInput = {
          messages: messagesForApiSubmission, 
          modelId: currentModelId,
          systemPrompt: effectiveSystemPrompt,
        };
        const result = await getPollinationsChatCompletion(apiInput);
        aiResponseContent = result.responseText;
      } catch (error) {
        const errorMessageText = error instanceof Error ? error.message : "Failed to get AI response.";
        toast({ title: "AI Error", description: errorMessageText, variant: "destructive" });
        aiResponseContent = `Sorry, I couldn't get a response. ${errorMessageText}`;
      }
    }

    if (aiResponseContent !== null) {
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(), role: 'assistant', content: aiResponseContent, timestamp: new Date(), toolType: currentToolType,
      };
      const finalMessages = [...updatedMessagesForState, aiMessage];
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

    const finalMessagesForTitle = (allConversations.find(c=>c.id === conversationToUpdateId)?.messages || updatedMessagesForState);
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
    customSystemPrompt,
    userDisplayName,
  ]);


  const handleRequestEditTitle = (conversationId: string) => {
    const conversation = allConversations.find(c => c.id === conversationId);
    if (!conversation) return;

    if (conversation.toolType !== 'long language loops') {
        toast({ title: "Action Not Allowed", description: "Title editing is only available for 'long.language.loops' chats.", variant: "destructive"});
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
        toast({ title: "Action Not Allowed", description: "Chat deletion is only available for 'long.language.loops' chats.", variant: "destructive"});
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
    toast({ title: "Chat Deleted", description: "The 'long.language.loops' conversation has been removed." });
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
                  className="font-code text-3xl sm:text-4xl md:text-5xl text-foreground hover:text-primary transition-colors duration-200 text-left"
                  aria-label={`Run ${item.title.replace(/\s/g, '')}`}
                >
                  {item.id === 'personalization' ? `└${item.title}` : `└run/${item.title}`}
                </button>
              ))}
            </div>
          </main>
        </>
      ) : (
        <div className="flex flex-1 overflow-hidden bg-background">
          <aside className="w-80 flex-shrink-0 bg-sidebar-background">
            <SidebarNav
              toolTileItems={toolTileItems} 
              onSelectTile={handleSelectTile} 
              activeToolType={activeToolTypeForView}
              onSelectNewChat={startNewLongLanguageLoopChat}
              allConversations={allConversations.filter(c => c.toolType === 'long language loops')} 
              activeConversationId={activeConversation?.id || null}
              onSelectChatHistory={handleSelectChatFromHistory}
              onEditTitle={handleRequestEditTitle}
              onDeleteChat={handleRequestDeleteChat}
              onNavigateToTiles={handleGoBackToTilesView}
              className="w-full h-full"
            />
          </aside>
          
          <main className="flex-1 flex flex-col overflow-hidden bg-background">
            {currentView === 'chat' && activeConversation && activeConversation.toolType === 'long language loops' && (
              <>
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
                <h1 className="text-xl font-code font-extralight text-center py-3 md:py-4 text-foreground/80 tracking-normal select-none">
                    {activeConversation.title || "Chat"}
                </h1>
              </>
            )}
            {currentView === 'easyImageLoopTool' && ( 
              <>
                <VisualizingLoopsTool />
              </>
            )}
            {currentView === 'gptImageTool' && ( 
              <>
                <GPTImageTool />
              </>
            )}
            {currentView === 'replicateImageTool' && ( 
              <>
                <ReplicateImageTool />
              </>
            )}
            {currentView === 'personalizationTool' && (
              <PersonalizationTool
                userDisplayName={userDisplayName}
                setUserDisplayName={setUserDisplayName}
                customSystemPrompt={customSystemPrompt}
                setCustomSystemPrompt={setCustomSystemPrompt}
                onSave={savePersonalizationSettings}
              />
            )}
          </main>
        </div>
      )}

      {isDeleteDialogOpen && chatToDeleteId && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this 'long.language.loops' chat
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
