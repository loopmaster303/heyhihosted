
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
          // Do not load File objects from localStorage
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
            // Explicitly exclude non-serializable fields if they were ever part of the Conversation type
            const { uploadedFile: _uploadedFile, uploadedFilePreview: _uploadedFilePreview, ...storableConv } = conv;
            return storableConv;
        });
        localStorage.setItem('chatConversations', JSON.stringify(conversationsToStore));
    }
  }, [allConversations]);


  const updateActiveConversationState = useCallback((updates: Partial<Pick<Conversation, 'isImageMode' | 'uploadedFilePreview'>> & { uploadedFile?: File | null }) => {
    setActiveConversation(prevActive => {
      if (!prevActive) return null;
      const { uploadedFile: newUploadedFile, ...otherUpdates } = updates; // Separate File object
      const updatedConv = { ...prevActive, ...otherUpdates };
      
      setAllConversations(prevAllConvs =>
        prevAllConvs.map(c => (c.id === prevActive.id ? updatedConv : c))
      );
      return updatedConv;
    });

    // Manage local component state for File objects and previews separately
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
        // Do not load file/preview from activeConversation for local state here
        // as File objects are not stored in allConversations / localStorage.
        // Local state for file/preview is managed by handleFileSelect and handleSendMessageGlobal.
      } else {
        setIsImageMode(false);
        setUploadedFile(null);
        setUploadedFilePreview(null);
      }
    } else {
        // Reset LLL specific UI state if no conversation is active
        setIsImageMode(false);
        setUploadedFile(null);
        setUploadedFilePreview(null);
    }
  }, [activeConversation]);


  const updateConversationTitle = useCallback(async (conversationId: string, messagesForTitleGen: ChatMessage[]) => {
    const convToUpdate = allConversations.find(c => c.id === conversationId);
    if (!convToUpdate || convToUpdate.toolType !== 'Long Language Loops') return;

    const isDefaultTitle = convToUpdate.title === "New Long Language Loop" ||
                           convToUpdate.title.startsWith("New ") || // Covers "New FLUX Kontext Chat" etc. if those were possible
                           convToUpdate.title === "Chat" || // A generic default
                           convToUpdate.title === `New ${convToUpdate.toolType} Chat`;


    if (messagesForTitleGen.length >= 1 && messagesForTitleGen.length < 5 && isDefaultTitle) {
      const relevantTextMessages = messagesForTitleGen
        .map(msg => {
          if (typeof msg.content === 'string') return `${msg.role}: ${msg.content}`;
          const textPart = msg.content.find(part => part.type === 'text');
          return textPart ? `${msg.role}: ${textPart.text}` : null;
        })
        .filter(Boolean)
        .slice(0, 3) // Use first 3 relevant messages
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
          // Don't toast here, it's a background process
        }
      }
    }
  }, [allConversations, activeConversation?.id]); // Added activeConversation?.id

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
        isImageMode: false, // Default for new LLL chat
      };

      setAllConversations(prev => [newConversation, ...prev.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())]);
      setActiveConversation(newConversation);
      setCurrentMessages([]); // Clear messages for the new chat
      setIsImageMode(false); // Reset local image mode state
      setUploadedFile(null); // Reset local file state
      setUploadedFilePreview(null); // Reset local preview state
      setCurrentView('chat');
    } else {
      // For other tools, stay on tile view or switch to it, do not start a chat.
      toast({
        title: "Tool Selected",
        description: `${toolType} selected. This tool does not have a dedicated chat view.`,
      });
      if (currentView === 'chat') { // If coming from a chat view (e.g. LLL)
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
        // Sync local UI state with the selected LLL conversation's mode
        setIsImageMode(conversation.isImageMode || false);
        // Files are not stored in conversation objects, so reset local file state
        setUploadedFile(null); 
        setUploadedFilePreview(null);
        setCurrentView('chat');
      } else {
         // This case should ideally not happen if only LLL chats are shown in history for selection
         toast({
            title: "Error",
            description: `Cannot open chat for tool type: ${conversation.toolType}.`,
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
      isImageModeIntent?: boolean; // True if send is initiated with image mode toggle ON
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

    // This function should only be callable if activeConversation.toolType === 'Long Language Loops'
    // because ChatInput is only rendered for LLL.
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

    // Determine current mode for this specific send operation
    // options.isImageModeIntent comes from ChatInput, reflecting if the image toggle was active
    // uploadedFile is the local state for the file input
    const isActuallyImagePromptMode = options.isImageModeIntent || false;
    const isActuallyFileUploadMode = !!uploadedFile && !isActuallyImagePromptMode; // File upload takes precedence if not in image prompt mode

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
    // Else, it's a plain text message. userMessageContent is already messageText.trim().

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content: userMessageContent, timestamp: new Date(), toolType: currentToolType,
    };
    currentMessagesForTurn.push(userMessage);
    setCurrentMessages([...currentMessagesForTurn]);

    // Update conversation: add new user message, set isImageMode based on this send operation
    // This state will be used if the user navigates away and comes back before AI responds.
    const interimConversationUpdate = {
      messages: [...currentMessagesForTurn],
      isImageMode: isActuallyImagePromptMode, // Persist the mode used for this send.
    };
    setActiveConversation(prev => prev ? { ...prev, ...interimConversationUpdate } : null);
    setAllConversations(prevAll => prevAll.map(c =>
        c.id === conversationToUpdateId ? { ...c, ...interimConversationUpdate } : c
    ));


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
        skipPollinationsChatCall = true; // Still skip, even on error, to show error as AI response
      }
    } else if (!skipPollinationsChatCall) { // Covers text messages and file uploads (which need text chat API)
      try {
        // Construct messages for API: use processed content from currentMessagesForTurn
        const apiMessages = currentMessagesForTurn
          .map(msg => {
            if (msg.role === 'system') return null; // Exclude system messages from history sent to API
            
            // For Pollinations /openai, content must be string.
            // If msg.content is array (e.g. uploaded image), extract text.
            let apiContentString = "";
            if (typeof msg.content === 'string') {
              apiContentString = msg.content;
            } else { // It's ChatMessageContentPart[]
              const textPart = msg.content.find(part => part.type === 'text');
              apiContentString = textPart ? textPart.text : "[Image content - text part missing]";
              // Note: image_url part is not sent to /openai endpoint by pollinations-chat-flow.ts
            }
            return { role: msg.role as 'user' | 'assistant', content: apiContentString };
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

    // Final state update for conversation and local UI state reset
    const finalConversationUpdate = {
      messages: [...currentMessagesForTurn],
      isImageMode: (isActuallyImagePromptMode || isActuallyFileUploadMode) ? false : activeConversation.isImageMode, // Reset LLL-specific modes after use
    };
    setActiveConversation(prevActive => prevActive ? { ...prevActive, ...finalConversationUpdate } : null);
    setAllConversations(prevAll => prevAll.map(c =>
        c.id === conversationToUpdateId ? { ...c, ...finalConversationUpdate } : c
    ));
    
    // Reset local UI state for LLL if an image/file operation just completed
    if (isActuallyImagePromptMode || isActuallyFileUploadMode) {
        setIsImageMode(false);
        setUploadedFile(null);
        setUploadedFilePreview(null);
    }

    // Update title if needed
    const messagesToConsiderForTitle = currentMessagesForTurn.filter(msg => msg.role === 'user' || msg.role === 'assistant');
    if (messagesToConsiderForTitle.length > 0) {
      updateConversationTitle(conversationToUpdateId, messagesToConsiderForTitle);
    }

    setIsAiResponding(false);

  }, [
    activeConversation,
    allConversations, 
    updateConversationTitle,
    toast,
    uploadedFile, 
    uploadedFilePreview,
    // updateActiveConversationState, // Removed, direct updates used
  ]);

  const handleGoBackToTilesView = () => {
    setCurrentView('tiles');
    setActiveConversation(null);
    setCurrentMessages([]); 
    // Reset LLL specific states when going back to tiles
    setIsImageMode(false);
    setUploadedFile(null);
    setUploadedFilePreview(null);
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
      toast({ title: "Title Updated", description: `Chat title changed to: ${updatedTitle}`});
    }
  };


  const handleRequestDeleteChat = (conversationId: string) => {
    const convToDelete = allConversations.find(c => c.id === conversationId);
    // Ensure only LLL chats can be deleted via this UI path.
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
      // Try to select the next most recent 'Long Language Loops' chat, or go to tiles view
      const nextLllConversation = updatedConversations
        .filter(c => c.toolType === 'Long Language Loops') // Make sure to only consider LLL
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      if (nextLllConversation) {
        setActiveConversation(nextLllConversation);
        setCurrentMessages(nextLllConversation.messages);
        setIsImageMode(nextLllConversation.isImageMode || false); // Sync UI
        setUploadedFile(null); // Reset local file state
        setUploadedFilePreview(null); // Reset local preview state
      } else {
        // No other LLL chats, go back to tiles view
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
    // Update local component state first
    setIsImageMode(newImageModeState);
    if (newImageModeState) { // If turning image mode ON
        setUploadedFile(null); // Clear any uploaded file
        setUploadedFilePreview(null);
    }
    // Persist this change to the active conversation object immediately
    updateActiveConversationState({ 
      isImageMode: newImageModeState,
      ...(newImageModeState && { uploadedFile: null, uploadedFilePreview: null }) // Also clear file if turning image mode on
    });
  };

  const handleFileSelect = (file: File | null) => {
    if (!activeConversation || activeConversation.toolType !== 'Long Language Loops') return;

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Update local component state
        setUploadedFile(file);
        setUploadedFilePreview(dataUrl);
        setIsImageMode(false); // Turn off image prompt mode if a file is selected

        // Persist that image mode is OFF (because file is selected) in conversation state
        updateActiveConversationState({ isImageMode: false, uploadedFilePreview: dataUrl, uploadedFile: file });
      };
      reader.readAsDataURL(file);
    } else { // File cleared
      setUploadedFile(null);
      setUploadedFilePreview(null);
      // No change to conversation.isImageMode needed when just clearing a file, 
      // user might want to switch to image prompt or type text.
      // Persist that file is cleared in conversation state
      updateActiveConversationState({ uploadedFilePreview: null, uploadedFile: null });
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
          allConversations={allConversations.filter(c => c.toolType === 'Long Language Loops')} // Only LLL chats in history
          activeConversationId={activeConversation?.id || null}
          onSelectChatHistory={handleSelectChatFromHistory}
          onEditTitle={handleRequestEditTitle} // Pass handler
          onDeleteChat={handleRequestDeleteChat} // Pass handler
          className="w-60 md:w-72 flex-shrink-0 bg-card border-r border-border"
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatView
            conversation={activeConversation}
            messages={currentMessages}
            isLoading={isAiResponding}
            onGoBack={handleGoBackToTilesView}
            className="flex-grow overflow-y-auto" // Ensures ChatView takes up space
          />
          {/* ChatInput is only rendered if an LLL conversation is active */}
          {activeConversation && activeConversation.toolType === 'Long Language Loops' && (
            <ChatInput
              onSendMessage={(message, model, system) => handleSendMessageGlobal(message, model, system, {isImageModeIntent: isImageMode})}
              isLoading={isAiResponding}
              isImageModeActive={isImageMode} // Pass local component state
              onToggleImageMode={handleToggleImageMode}
              uploadedFilePreviewUrl={uploadedFilePreview} // Pass local component state
              onFileSelect={handleFileSelect}
              isLongLanguageLoopActive={true} // True because it's inside LLL condition
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

