
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
import { GalleryHorizontal, CodeXml, MessageSquare, BrainCircuit } from 'lucide-react'; // Replaced ImageIcon with BrainCircuit for LLL
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

  // Local component states for LLL tool, synced from/to activeConversation
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
          // Ensure these fields are initialized from storage if they exist, or default
          isImageMode: conv.isImageMode || false,
          // uploadedFile and uploadedFilePreview are transient, not stored directly
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
            // Exclude File object and large data URIs from localStorage
            const { uploadedFile, uploadedFilePreview, ...storableConv } = conv;
            return storableConv;
        });
        localStorage.setItem('chatConversations', JSON.stringify(conversationsToStore));
    }
  }, [allConversations]);

  // Sync local LLL states when activeConversation changes
  useEffect(() => {
    if (activeConversation && activeConversation.toolType === 'Long Language Loops') {
      setIsImageMode(activeConversation.isImageMode || false);
      // uploadedFile and uploadedFilePreview are primarily driven by user interaction
      // and then reflected into activeConversation. If loading a conversation,
      // these would typically be null unless we were to store previews (which we don't).
      // So, setting them from activeConversation here is mostly for consistency if it was
      // programmatically set, but usually they'll be null initially.
      setUploadedFile(activeConversation.uploadedFile || null);
      setUploadedFilePreview(activeConversation.uploadedFilePreview || null);
    } else {
      // Reset if not LLL or no active conversation
      setIsImageMode(false);
      setUploadedFile(null);
      setUploadedFilePreview(null);
    }
  }, [activeConversation]);

  const updateActiveConversationState = useCallback((updates: Partial<Conversation>) => {
    if (!activeConversation) return;

    // Create the fully updated conversation object
    const updatedConvData = { ...activeConversation, ...updates };
    
    // Update the activeConversation state
    setActiveConversation(updatedConvData);
    
    // Update this conversation in the allConversations list
    setAllConversations(prevAllConvs => 
        prevAllConvs.map(c => (c.id === activeConversation.id ? updatedConvData : c))
    );
  }, [activeConversation]);


  const updateConversationTitle = useCallback(async (conversationId: string, messagesForTitleGen: ChatMessage[]) => {
    // This function assumes allConversations is the source of truth for the conv to update
    const convToUpdate = allConversations.find(c => c.id === conversationId);
    if (!convToUpdate) return;

    const isDefaultTitle = convToUpdate.title === "New Long Language Loop" ||
                           convToUpdate.title.startsWith("New ") || 
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
  }, [allConversations, activeConversation?.id]); // Ensure activeConversation.id dependency

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
      isImageMode: toolType === 'Long Language Loops' ? false : undefined, // Initialize for LLL
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
      // Local LLL states will be synced by useEffect dep on activeConversation
      setCurrentView('chat');
    }
  }, [allConversations]);


  const handleSendMessageGlobal = useCallback(async (
    messageText: string,
    modelId: string = DEFAULT_POLLINATIONS_MODEL_ID,
    systemPrompt: string = getDefaultSystemPrompt(),
    options: { 
      isImageModeIntent?: boolean; // Intent from ChatInput for image mode
    } = {}
  ) => {
    setIsAiResponding(true);
    let conversationToUpdateId: string;
    let currentMessagesForTurn: ChatMessage[]; // Use a local copy for this turn
    let currentToolType: ToolType;
    let currentConversationRef = activeConversation;

    // Determine if we need to create a new conversation
    if (!currentConversationRef) {
      currentToolType = 'Long Language Loops'; // Default new conversations to LLL
      const newConversationId = crypto.randomUUID();
      conversationToUpdateId = newConversationId;
      const now = new Date();
      
      const tempNewConv: Conversation = {
        id: newConversationId, title: "New Long Language Loop", messages: [], createdAt: now, toolType: currentToolType,
        isImageMode: (options.isImageModeIntent || false), // Use intent from ChatInput
        uploadedFile: uploadedFile, // Use local page state for new conv
        uploadedFilePreview: uploadedFilePreview, // Use local page state
      };
      setAllConversations(prev => [tempNewConv, ...prev.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())]);
      setActiveConversation(tempNewConv);
      currentConversationRef = tempNewConv; // Update ref to new conversation
      currentMessagesForTurn = []; // Start with empty messages for new conv
      setCurrentMessages([]);
      setCurrentView('chat');
    } else {
      conversationToUpdateId = currentConversationRef.id;
      currentToolType = currentConversationRef.toolType;
      currentMessagesForTurn = [...currentConversationRef.messages]; // Copy from existing
    }
    
    // For this specific send operation, use states relevant to the currentConversationRef
    // which includes local component states (isImageMode, uploadedFile) if it's a new conversation,
    // or the activeConversation's own states if it's an existing one.
    const activeIsImageModeForSend = currentConversationRef.isImageMode || false;
    const activeUploadedFileForSend = currentConversationRef.uploadedFile || null;
    const activeUploadedFilePreviewForSend = currentConversationRef.uploadedFilePreview || null;

    let userMessageContent: string | ChatMessageContentPart[] = messageText.trim();
    let aiResponseContent: string | ChatMessageContentPart[] | null = null; // Initialize to null
    let skipPollinationsChatCall = false; // Renamed for clarity

    // Construct User Message
    if (currentToolType === 'Long Language Loops') {
      if (activeIsImageModeForSend && messageText.trim()) { 
        userMessageContent = `Image prompt: "${messageText.trim()}"`;
        // AI response will be handled by image generation logic below
      } else if (activeUploadedFileForSend) {
        const textPart: ChatMessageContentPart = { type: 'text', text: messageText.trim() || "Describe this image." };
        // We need the data URI for the uploaded file to send to AI.
        // The preview (activeUploadedFilePreviewForSend) is already a data URI.
        if (!activeUploadedFilePreviewForSend) {
          // This should ideally not happen if activeUploadedFileForSend is set.
          // Fallback or error if preview isn't available.
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
    setCurrentMessages([...currentMessagesForTurn]); // Update UI immediately with user message

    // Update conversation in allConversations and activeConversation with user message
    // but defer full state reset (isImageMode, uploadedFile) until after AI response
    const interimConversationUpdate = { messages: [...currentMessagesForTurn] };
    setAllConversations(prev => prev.map(c => c.id === conversationToUpdateId ? { ...c, ...interimConversationUpdate } : c));
    if (activeConversation?.id === conversationToUpdateId) {
      setActiveConversation(prev => prev ? { ...prev, ...interimConversationUpdate } : null);
    }
    

    // Perform AI action (Image Gen, Image Analysis, or Text Chat)
    if (currentToolType === 'Long Language Loops' && activeIsImageModeForSend && messageText.trim()) {
      // Image Generation Path
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
      // Text Chat or LLL Image Analysis Path (uses Pollinations Chat)
      try {
        // Prepare messages for Pollinations API
        const apiMessages = currentMessagesForTurn // Use messages up to and including the current user message
          .map(msg => {
            if (msg.role === 'system') return null; // Don't send system messages from history if using dedicated systemPrompt
            // Content can be string or ChatMessageContentPart[]
            return { role: msg.role as 'user' | 'assistant', content: msg.content };
          })
          .filter(Boolean) as PollinationsChatInput['messages'];

        const apiInput: PollinationsChatInput = {
          messages: apiMessages,
          modelId: modelId,
          systemPrompt: systemPrompt, // This is the overall system prompt
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

    // Construct AI Message and Final Updates
    if (aiResponseContent !== null) {
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(), role: 'assistant', content: aiResponseContent, timestamp: new Date(), toolType: currentToolType,
      };
      currentMessagesForTurn.push(aiMessage);
      setCurrentMessages([...currentMessagesForTurn]); // Update UI with AI message
    }
    
    // Final state updates for the conversation, including resetting LLL modes
    const finalConversationState = {
      messages: [...currentMessagesForTurn],
      isImageMode: (currentToolType === 'Long Language Loops' && activeIsImageModeForSend) ? false : (currentConversationRef.isImageMode || false),
      uploadedFile: (currentToolType === 'Long Language Loops' && activeUploadedFileForSend) ? null : (currentConversationRef.uploadedFile || null),
      uploadedFilePreview: (currentToolType === 'Long Language Loops' && activeUploadedFileForSend) ? null : (currentConversationRef.uploadedFilePreview || null),
    };

    setAllConversations(prev =>
      prev.map(c => (c.id === conversationToUpdateId ? { ...c, ...finalConversationState } : c))
    );
    if (activeConversation?.id === conversationToUpdateId) {
      setActiveConversation(prev => prev ? { ...prev, ...finalConversationState } : null);
    } else if (currentConversationRef?.id === conversationToUpdateId && !activeConversation) {
      // This case handles if it was a new conversation that became active
      // setActiveConversation was already called when the new conv was created.
      // The useEffect for activeConversation should sync local component states (isImageMode etc.)
      // We might need to ensure the activeConversation object in state has these final properties too.
      // This is slightly complex because setActiveConversation(tempNewConv) happened earlier.
      // Let's ensure the tempNewConv that was made active also gets these final updates if it's still the one.
       setActiveConversation(prev => prev && prev.id === conversationToUpdateId ? { ...prev, ...finalConversationState } : prev);
    }


    const conversationForTitle = allConversations.find(c => c.id === conversationToUpdateId) || currentConversationRef; // Check currentConversationRef too
    if (conversationForTitle) { // Use the messages that now include the AI response
      updateConversationTitle(conversationToUpdateId, currentMessagesForTurn.filter(msg => msg.role === 'user' || msg.role === 'assistant'));
    }
    setIsAiResponding(false);

  }, [
    activeConversation, 
    allConversations, // Added as a dependency for updateConversationTitle and finding conv by ID
    updateConversationTitle, 
    toast, 
    uploadedFile, // Local state used for new conversations
    uploadedFilePreview, // Local state used for new conversations
    // isImageMode is also local state, but its intent is passed via options.isImageModeIntent
  ]);

  const handleGoBackToTilesView = () => {
    setCurrentView('tiles');
    setActiveConversation(null);
    // Local LLL states (isImageMode, uploadedFile, etc.) will be reset by useEffect
    // when activeConversation becomes null.
  };

  const handleRequestEditTitle = (conversationId: string) => {
    const conversation = allConversations.find(c => c.id === conversationId);
    if (!conversation) return;
    const newTitle = window.prompt("Enter new chat title:", conversation.title);
    if (newTitle && newTitle.trim() !== "") {
      const updatedTitle = newTitle.trim();
      updateActiveConversationState({ title: updatedTitle }); // Use centralized update
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
        // Local LLL states will sync via useEffect
      } else {
        setCurrentView('tiles');
        setActiveConversation(null);
        setCurrentMessages([]);
        // Local LLL states will sync via useEffect
      }
    }
    setIsDeleteDialogOpen(false);
    setChatToDeleteId(null);
    toast({ title: "Chat Deleted", description: "The conversation has been removed." });
  };

  const handleToggleImageMode = () => {
    if (!activeConversation || activeConversation.toolType !== 'Long Language Loops') return;
    const newImageModeState = !isImageMode; // Toggle local state
    setIsImageMode(newImageModeState); // Update local state for ChatInput
    
    // Update the actual conversation object
    updateActiveConversationState({ 
        isImageMode: newImageModeState, 
        // If switching to image mode, clear any uploaded file from conversation
        ...(newImageModeState ? { uploadedFile: null, uploadedFilePreview: null } : {}) 
    });
    // Also clear local file states if switching to image mode
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
        // Update local states for ChatInput preview
        setUploadedFile(file);
        setUploadedFilePreview(dataUrl);
        setIsImageMode(false); // Turn off image prompt mode locally

        // Update the actual conversation object
        updateActiveConversationState({ 
          uploadedFile: file, 
          uploadedFilePreview: dataUrl,
          isImageMode: false // Ensure image prompt mode is off in conversation
        });
      };
      reader.readAsDataURL(file);
    } else { 
      // Clear local states for ChatInput preview
      setUploadedFile(null);
      setUploadedFilePreview(null);
      // Update the actual conversation object
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
        {/* Simplified ChatInput for tiles view, no LLL features needed */}
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
            messages={currentMessages} // Display messages from currentMessages state
            isLoading={isAiResponding}
            onGoBack={handleGoBackToTilesView}
            className="flex-grow overflow-y-auto"
          />
        </main>
      </div>
      <ChatInput
        onSendMessage={(message, model, system) => handleSendMessageGlobal(message, model, system, {isImageModeIntent: isImageMode})}
        isLoading={isAiResponding}
        // Props for ChatInput are driven by local component states (isImageMode, uploadedFilePreview)
        // which are synced with activeConversation by useEffect or specific handlers.
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

    