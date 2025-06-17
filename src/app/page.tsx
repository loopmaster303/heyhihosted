
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
      // Do not load file/preview from activeConversation as File objects are not serializable
      // setUploadedFile(activeConversation.uploadedFile || null);
      // setUploadedFilePreview(activeConversation.uploadedFilePreview || null);
    } else {
      setIsImageMode(false);
      setUploadedFile(null);
      setUploadedFilePreview(null);
    }
  }, [activeConversation]);

  const updateActiveConversationState = useCallback((updates: Partial<Conversation>) => {
    setActiveConversation(prevActive => {
      if (!prevActive) return null;
      // Exclude File object from being directly spread into activeConversation or allConversations
      const { uploadedFile: newUploadedFile, ...otherUpdates } = updates;
      const updatedConv = { ...prevActive, ...otherUpdates };
      
      setAllConversations(prevAllConvs =>
        prevAllConvs.map(c => (c.id === prevActive.id ? updatedConv : c))
      );
      return updatedConv;
    });
    // Handle File object separately for local state if present in updates
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
        // uploadedFile: null, // File objects are not stored in conversation state
        // uploadedFilePreview: null,
      };

      setAllConversations(prev => [newConversation, ...prev.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())]);
      setActiveConversation(newConversation);
      setCurrentMessages([]);
      setIsImageMode(false); // Reset local image mode
      setUploadedFile(null); // Reset local file
      setUploadedFilePreview(null); // Reset local preview
      setCurrentView('chat');
    } else {
      toast({
        title: "Tool Selected",
        description: `${toolType} selected. This tool is not yet fully implemented. Chat functionality is only available for 'Long Language Loops'.`,
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
      if (conversation.toolType === 'Long Language Loops') { 
        setActiveConversation(conversation);
        setCurrentMessages(conversation.messages);
        // Sync local UI state with the selected conversation's LLL-specific state
        setIsImageMode(conversation.isImageMode || false);
        setUploadedFile(null); // Files are not stored, so reset on load
        setUploadedFilePreview(null); // Previews are not stored, reset on load
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
    let currentMessagesForTurn = [...activeConversation.messages]; // Use messages from activeConversation directly
    const currentToolType = activeConversation.toolType;

    const activeIsImageModeForSend = isImageMode || options.isImageModeIntent || false;
    const activeUploadedFileForSend = uploadedFile;
    const activeUploadedFilePreviewForSend = uploadedFilePreview;

    let userMessageContent: string | ChatMessageContentPart[] = messageText.trim();
    let aiResponseContent: string | ChatMessageContentPart[] | null = null;
    let skipPollinationsChatCall = false;

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
    setCurrentMessages([...currentMessagesForTurn]); // Update local UI immediately

    // Interim update to conversation state in allConversations
    // We update isImageMode in conversation state to reflect the mode used for *this* send.
    // File objects are not stored in the conversation object itself.
    setAllConversations(prevAll => prevAll.map(c => 
        c.id === conversationToUpdateId ? { ...c, messages: [...currentMessagesForTurn], isImageMode: activeIsImageModeForSend } : c
    ));
    // Update activeConversation to reflect the new messages and the image mode used for the send
    setActiveConversation(prevActive => prevActive ? { ...prevActive, messages: [...currentMessagesForTurn], isImageMode: activeIsImageModeForSend } : null);


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
            if (msg.role === 'system') return null; // Exclude system messages from API call history if any
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
      setCurrentMessages([...currentMessagesForTurn]); // Update local UI with AI message
    }

    // Final update to conversation state in allConversations and activeConversation
    // Reset image/file related states in the *conversation object* and *local component state* only after successful image/file operation
    const wasImageOrFileOperation = (activeIsImageModeForSend && messageText.trim()) || activeUploadedFileForSend;
    const finalIsImageModeForConv = wasImageOrFileOperation ? false : activeIsImageModeForSend;

    setAllConversations(prevAll => prevAll.map(c => 
        c.id === conversationToUpdateId ? { ...c, messages: [...currentMessagesForTurn], isImageMode: finalIsImageModeForConv } : c
    ));
    setActiveConversation(prevActive => prevActive ? { ...prevActive, messages: [...currentMessagesForTurn], isImageMode: finalIsImageModeForConv } : null);
    
    if (wasImageOrFileOperation) {
        setIsImageMode(false);
        setUploadedFile(null);
        setUploadedFilePreview(null);
    }


    const finalConvForTitle = allConversations.find(c => c.id === conversationToUpdateId);
    if (finalConvForTitle) { // Ensure conv exists before trying to access messages
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
    isImageMode, 
    uploadedFile, 
    uploadedFilePreview,
    updateActiveConversationState, // Removed, direct updates are used now.
  ]);

  const handleGoBackToTilesView = () => {
    setCurrentView('tiles');
    setActiveConversation(null);
    setCurrentMessages([]); 
  };

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
    const updatedConversations = allConversations.filter(c => c.id !== chatToDeleteId);
    setAllConversations(updatedConversations);

    if (wasActiveConversationDeleted) {
      const nextLllConversation = updatedConversations
        .filter(c => c.toolType === 'Long Language Loops')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      if (nextLllConversation) {
        setActiveConversation(nextLllConversation);
        setCurrentMessages(nextLllConversation.messages);
        setIsImageMode(nextLllConversation.isImageMode || false);
        setUploadedFile(null);
        setUploadedFilePreview(null);
      } else {
        setCurrentView('tiles');
        setActiveConversation(null);
        setCurrentMessages([]);
        setIsImageMode(false);
        setUploadedFile(null);
        setUploadedFilePreview(null);
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
    // Update conversation state only if it differs
    if (activeConversation.isImageMode !== newImageModeState) {
        updateActiveConversationState({ isImageMode: newImageModeState });
    }

    if (newImageModeState) { // If turning image mode ON
        setUploadedFile(null);
        setUploadedFilePreview(null);
        if (activeConversation.isImageMode !== newImageModeState) { // Avoid redundant update
           updateActiveConversationState({ isImageMode: true, uploadedFile: null, uploadedFilePreview: null });
        }
    } else { // If turning image mode OFF
        if (activeConversation.isImageMode !== newImageModeState) { // Avoid redundant update
           updateActiveConversationState({ isImageMode: false });
        }
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

        // Update conversation state to reflect that image mode is off because a file is active
        updateActiveConversationState({ isImageMode: false });
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedFile(null);
      setUploadedFilePreview(null);
      // No specific change to conversation.isImageMode needed here,
      // as clearing a file doesn't automatically toggle image prompt mode.
    }
  };


  if (currentView === 'tiles') {
    return (
      <div className="flex flex-col h-screen bg-background text-primary selection:bg-primary selection:text-primary-foreground">
        <AppHeader />
        <main className="flex-grow container mx-auto px-2 sm:px-4 py-6 flex flex-col items-center overflow-y-auto">
          <TileMenu onSelectTile={handleSelectTile} tileItems={toolTileItems} />
        </main>
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
          allConversations={allConversations.filter(c => c.toolType === 'Long Language Loops')}
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
          {activeConversation && activeConversation.toolType === 'Long Language Loops' && (
            <ChatInput
              onSendMessage={(message, model, system) => handleSendMessageGlobal(message, model, system, {isImageModeIntent: isImageMode})}
              isLoading={isAiResponding}
              isImageModeActive={isImageMode}
              onToggleImageMode={handleToggleImageMode}
              uploadedFilePreviewUrl={uploadedFilePreview}
              onFileSelect={handleFileSelect}
              isLongLanguageLoopActive={true}
            />
          )}
        </main>
      </div>
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
