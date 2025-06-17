
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
          // Ensure these are initialized correctly or default if not present
          isImageMode: conv.toolType === 'Long Language Loops' ? (conv.isImageMode || false) : undefined,
          uploadedFile: null, // Files are not stored in localStorage
          uploadedFilePreview: null, // Previews are not stored
        }));
        setAllConversations(parsedConversations);
      } catch (error) {
        console.error("Failed to parse conversations from localStorage", error);
        localStorage.removeItem('chatConversations'); // Clear potentially corrupted data
      }
    }
  }, []);

  useEffect(() => {
    // Only save if there are conversations or if an item was previously stored (to clear it if all are deleted)
    if (allConversations.length > 0 || localStorage.getItem('chatConversations')) {
        const conversationsToStore = allConversations.map(conv => {
            // Exclude non-serializable File objects and temporary previews
            const { uploadedFile, uploadedFilePreview, ...storableConv } = conv;
            return storableConv;
        });
        localStorage.setItem('chatConversations', JSON.stringify(conversationsToStore));
    }
  }, [allConversations]);

  useEffect(() => {
    // Sync local LLL state when activeConversation changes
    if (activeConversation && activeConversation.toolType === 'Long Language Loops') {
      setIsImageMode(activeConversation.isImageMode || false);
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

    // Create the fully updated conversation data
    // Important: spread the existing activeConversation first, then the updates
    const updatedConvData = { ...activeConversation, ...updates };
    
    // Update the activeConversation state
    setActiveConversation(updatedConvData);
    
    // Update this conversation in the allConversations list
    setAllConversations(prevAllConvs => 
        prevAllConvs.map(c => (c.id === activeConversation.id ? updatedConvData : c))
    );
  }, [activeConversation]); // Dependency on activeConversation is key


  const updateConversationTitle = useCallback(async (conversationId: string, messagesForTitleGen: ChatMessage[]) => {
    const convToUpdate = allConversations.find(c => c.id === conversationId);
    if (!convToUpdate) return;

    // Check if the title is one of the default/placeholder titles
    const isDefaultTitle = convToUpdate.title === "New Long Language Loop" ||
                           convToUpdate.title.startsWith("New ") || // Catches "New <ToolName> Chat"
                           convToUpdate.title === "Chat" || // General fallback
                           convToUpdate.title === `New ${convToUpdate.toolType} Chat`; // Tool specific fallback


    // Only generate title if it's a default one and we have 1-4 messages
    if (messagesForTitleGen.length >= 1 && messagesForTitleGen.length < 5 && isDefaultTitle) {
      // Extract text from messages for the title generation prompt
      const relevantTextMessages = messagesForTitleGen
        .map(msg => {
          if (typeof msg.content === 'string') return `${msg.role}: ${msg.content}`;
          // If content is an array, find the first text part
          const textPart = msg.content.find(part => part.type === 'text');
          return textPart ? `${msg.role}: ${textPart.text}` : null;
        })
        .filter(Boolean) // Remove nulls (e.g., if a message was only an image)
        .slice(0, 3) // Use up to the first 3 relevant messages for brevity
        .join('\n\n');

      if (relevantTextMessages.length > 0) {
        try {
          // Call the AI flow to generate a title
          const result = await generateChatTitle({ messages: relevantTextMessages });
          
          const newTitle = result.title;
          // Update the title in allConversations array
          setAllConversations(prev =>
            prev.map(c => (c.id === conversationId ? { ...c, title: newTitle } : c))
          );
          // If the updated conversation is the active one, update its title in activeConversation state
          if (activeConversation?.id === conversationId) {
            setActiveConversation(prev => (prev ? { ...prev, title: newTitle } : null));
          }
        } catch (error) {
          console.error("Failed to generate chat title:", error);
          // Optionally, toast an error to the user or handle silently
        }
      }
    }
  }, [allConversations, activeConversation?.id]); // Dependencies

  const handleSelectTile = useCallback((toolType: ToolType) => {
    const newConversationId = crypto.randomUUID();
    const now = new Date();
    let conversationTitle: string;

    // Determine initial title based on tool type
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
      // Initialize LLL-specific state if it's an LLL tool
      isImageMode: toolType === 'Long Language Loops' ? false : undefined,
      uploadedFile: toolType === 'Long Language Loops' ? null : undefined,
      uploadedFilePreview: toolType === 'Long Language Loops' ? null : undefined,
    };

    // Add new conversation and sort (newest first)
    setAllConversations(prev => [newConversation, ...prev.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())]);
    setActiveConversation(newConversation);
    setCurrentMessages([]); // Clear messages for the new chat
    setCurrentView('chat'); // Switch to chat view
  }, []);

  const handleSelectChatFromHistory = useCallback((conversationId: string) => {
    const conversation = allConversations.find(c => c.id === conversationId);
    if (conversation) {
      setActiveConversation(conversation);
      setCurrentMessages(conversation.messages);
      setCurrentView('chat');
      // LLL specific state (isImageMode, uploadedFile, uploadedFilePreview) will be synced by the useEffect hook watching activeConversation
    }
  }, [allConversations]);


  const handleSendMessageGlobal = useCallback(async (
    messageText: string,
    modelId: string = DEFAULT_POLLINATIONS_MODEL_ID,
    systemPrompt: string = getDefaultSystemPrompt(),
    options: { 
      isImageModeIntent?: boolean; // User's intent if starting a new LLL chat in image mode
    } = {}
  ) => {
    setIsAiResponding(true);
    let conversationToUpdateId: string;
    let currentMessagesForTurn: ChatMessage[];
    let currentToolType: ToolType;
    let currentConversationRef = activeConversation; // Use a ref to the activeConversation at the start

    // If no active conversation, create a new one (defaults to LLL for now if direct send from tile view)
    if (!currentConversationRef) {
      currentToolType = 'Long Language Loops'; // Default for direct send without prior selection
      const newConversationId = crypto.randomUUID();
      conversationToUpdateId = newConversationId;
      const now = new Date();
      
      const tempNewConv: Conversation = {
        id: newConversationId, title: "New Long Language Loop", messages: [], createdAt: now, toolType: currentToolType,
        isImageMode: (currentToolType === 'Long Language Loops' ? (options.isImageModeIntent || false) : undefined), // Set image mode based on intent
        uploadedFile: (currentToolType === 'Long Language Loops' ? uploadedFile : undefined), // Carry over local file if any
        uploadedFilePreview: (currentToolType === 'Long Language Loops' ? uploadedFilePreview : undefined), // Carry over local preview
      };
      setAllConversations(prev => [tempNewConv, ...prev.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())]);
      setActiveConversation(tempNewConv); // Set this new one as active
      currentConversationRef = tempNewConv; // Update our working reference
      currentMessagesForTurn = []; // Start with empty messages for the turn
      setCurrentMessages([]);
      setCurrentView('chat');
    } else {
      conversationToUpdateId = currentConversationRef.id;
      currentToolType = currentConversationRef.toolType;
      currentMessagesForTurn = [...currentConversationRef.messages]; // Copy existing messages
    }
    
    // Determine the active LLL states for *this specific send operation*
    // These use the currentConversationRef which is guaranteed to be set by now.
    const activeIsImageModeForSend = currentToolType === 'Long Language Loops' ? (currentConversationRef.isImageMode || options.isImageModeIntent || false) : false;
    const activeUploadedFileForSend = currentToolType === 'Long Language Loops' ? (currentConversationRef.uploadedFile || null) : null;
    const activeUploadedFilePreviewForSend = currentToolType === 'Long Language Loops' ? (currentConversationRef.uploadedFilePreview || null) : null;


    let userMessageContent: string | ChatMessageContentPart[] = messageText.trim();
    let aiResponseContent: string | ChatMessageContentPart[] | null = null;
    let skipPollinationsChatCall = false; // Flag to skip text chat if image generated

    // Prepare user message content based on tool type and mode
    if (currentToolType === 'Long Language Loops') {
      if (activeIsImageModeForSend && messageText.trim()) { // Image generation prompt
        userMessageContent = `Image prompt: "${messageText.trim()}"`;
      } else if (activeUploadedFileForSend) { // File upload with optional text
        const textPart: ChatMessageContentPart = { type: 'text', text: messageText.trim() || "Describe this image." }; // Default text if none provided
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
      // If neither image mode nor file upload, userMessageContent remains the plain messageText
    }

    // Create the user message object
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content: userMessageContent, timestamp: new Date(), toolType: currentToolType,
    };
    currentMessagesForTurn.push(userMessage);
    setCurrentMessages([...currentMessagesForTurn]); // Update UI immediately with user message

    // Update conversation in allConversations and activeConversation *before* AI call
    // This makes the user message appear immediately
    const interimConversationUpdate = { 
        messages: [...currentMessagesForTurn],
        // If LLL tool and this send involves a file, update the conversation's file state to match what was sent
        ...(currentToolType === 'Long Language Loops' && activeUploadedFileForSend && {
          uploadedFile: activeUploadedFileForSend,
          uploadedFilePreview: activeUploadedFilePreviewForSend,
        }),
        // If LLL tool and this send involves image mode, update the conversation's image mode state
        ...(currentToolType === 'Long Language Loops' && {
            isImageMode: activeIsImageModeForSend
        })
    };

    setAllConversations(prev => prev.map(c => c.id === conversationToUpdateId ? { ...c, ...interimConversationUpdate } : c));
    // Ensure activeConversation is also updated with this interim state
    // Use functional update for setActiveConversation if currentConversationRef might be stale
    setActiveConversation(prevActive => 
        prevActive && prevActive.id === conversationToUpdateId ? { ...prevActive, ...interimConversationUpdate } : prevActive
    );
    
    // Perform AI operation: Image Generation or Text Chat
    if (currentToolType === 'Long Language Loops' && activeIsImageModeForSend && messageText.trim()) {
      // Image Generation Path
      try {
        const result = await generateImageViaPollinations({ prompt: messageText.trim() });
        aiResponseContent = [
          { type: 'text', text: `Generated image for: "${result.promptUsed}"` },
          { type: 'image_url', image_url: { url: result.imageDataUri, altText: `Generated image for ${result.promptUsed}`, isGenerated: true } }
        ];
        skipPollinationsChatCall = true; // Image generated, skip text chat call
      } catch (error) {
        console.error("Error generating image via Pollinations:", error);
        const errorMessageText = error instanceof Error ? error.message : "Failed to generate image.";
        toast({ title: "Image Generation Error", description: errorMessageText, variant: "destructive" });
        aiResponseContent = `Sorry, I couldn't generate the image. ${errorMessageText}`;
        skipPollinationsChatCall = true; // Still skip, but with an error message
      }
    } else if (!skipPollinationsChatCall) { 
      // Text Chat Path (includes LLL file analysis and other tools)
      try {
        // Prepare messages for Pollinations API (handles string or ChatMessageContentPart[])
        const apiMessages = currentMessagesForTurn
          .map(msg => {
            if (msg.role === 'system') return null; // Exclude system messages from direct API send history
            // Content is already in the correct type (string | ChatMessageContentPart[])
            return { role: msg.role as 'user' | 'assistant', content: msg.content };
          })
          .filter(Boolean) as PollinationsChatInput['messages']; // Type assertion after filtering nulls

        const apiInput: PollinationsChatInput = {
          messages: apiMessages,
          modelId: modelId,
          systemPrompt: systemPrompt, // Send the resolved system prompt
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

    // Add AI response message if content was generated
    if (aiResponseContent !== null) {
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(), role: 'assistant', content: aiResponseContent, timestamp: new Date(), toolType: currentToolType,
      };
      currentMessagesForTurn.push(aiMessage);
      setCurrentMessages([...currentMessagesForTurn]); // Update UI with AI message
    }
    
    // Final state updates for the conversation
    // This includes resetting LLL specific states after the operation
    const finalConversationState: Partial<Conversation> = {
      messages: [...currentMessagesForTurn],
      // Reset LLL tool specific states if an image was generated or a file was processed in this turn
      ...(currentToolType === 'Long Language Loops' && (activeIsImageModeForSend || activeUploadedFileForSend) && {
        isImageMode: false, // Turn off image mode after generation or file processing
        uploadedFile: null, // Clear uploaded file after processing
        uploadedFilePreview: null, // Clear preview after processing
      }),
    };
    
    setAllConversations(prev =>
      prev.map(c => (c.id === conversationToUpdateId ? { ...c, ...finalConversationState } : c))
    );
    
    // Ensure activeConversation is also fully updated with the final state including resets
    setActiveConversation(prevActive => 
      prevActive && prevActive.id === conversationToUpdateId ? { ...prevActive, ...finalConversationState } : 
      (currentConversationRef && currentConversationRef.id === conversationToUpdateId ? { ...currentConversationRef, ...finalConversationState } : prevActive)
    );


    // Update conversation title if needed
    const conversationForTitle = allConversations.find(c => c.id === conversationToUpdateId) || currentConversationRef; // Get the most up-to-date version
    if (conversationForTitle) { 
        // Use currentMessagesForTurn as it contains all messages up to this point in the turn
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
    uploadedFile, // current local state of uploaded file (before send)
    uploadedFilePreview, // current local state of preview (before send)
    updateActiveConversationState, // Added this dependency
    // Removed isImageMode from here as its "active" version for send is derived inside
  ]);

  const handleGoBackToTilesView = () => {
    setCurrentView('tiles');
    setActiveConversation(null); // Clear active conversation when going back
    // Local LLL state (isImageMode, etc.) will reset via useEffect watching activeConversation
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
    
    // Filter out the deleted conversation
    const updatedConversations = allConversations.filter(c => c.id !== chatToDeleteId);
    setAllConversations(updatedConversations);

    if (wasActiveConversationDeleted) {
      if (updatedConversations.length > 0) {
        // If there are remaining conversations, set the most recent one as active
        const sortedRemainingConversations = [...updatedConversations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const nextActiveConversation = sortedRemainingConversations[0];
        setActiveConversation(nextActiveConversation);
        setCurrentMessages(nextActiveConversation.messages);
        // LLL specific state will be synced by useEffect hook
      } else {
        // No conversations left, go back to tiles view
        setCurrentView('tiles');
        setActiveConversation(null);
        setCurrentMessages([]);
        // LLL specific state will be reset by useEffect hook
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
    
    // Update the active conversation's state
    updateActiveConversationState({ 
        isImageMode: newImageModeState, 
        // If switching to image mode, clear any existing file selection from conversation state
        ...(newImageModeState ? { uploadedFile: null, uploadedFilePreview: null } : {}) 
    });

    if (newImageModeState) { // If switching to image mode, also clear local file selection
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
        // Update local state for ChatInput preview
        setUploadedFile(file);
        setUploadedFilePreview(dataUrl);
        setIsImageMode(false); // When a file is selected, ensure image prompt mode is off locally

        // Update active conversation's state
        updateActiveConversationState({ 
          uploadedFile: file, 
          uploadedFilePreview: dataUrl,
          isImageMode: false // Also ensure isImageMode is false in the conversation data
        });
      };
      reader.readAsDataURL(file);
    } else { // File cleared
      // Update local state for ChatInput
      setUploadedFile(null);
      setUploadedFilePreview(null);
      // Update active conversation's state
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
        {/* ChatInput in tile view is simplified, primarily for starting new LLL chats */}
        <ChatInput
            onSendMessage={(message, model, system) => handleSendMessageGlobal(message, model, system, {isImageModeIntent: false})}
            isLoading={isAiResponding}
            isImageModeActive={false} // Image mode not applicable when no chat active
            onToggleImageMode={() => {
                // To create LLL chat in image mode directly:
                // 1. Create a new LLL conversation
                // 2. Set its isImageMode to true
                // 3. Set it active
                // For now, this is best handled by selecting LLL then toggling.
            }} 
            uploadedFilePreviewUrl={null} // No file preview when no chat active
            onFileSelect={() => {}} // File selection not applicable when no chat active
            isLongLanguageLoopActive={false} // LLL not active by default in tile view
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
          onEditTitle={handleRequestEditTitle} // Pass the handler
          onDeleteChat={handleRequestDeleteChat} // Pass the handler
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
        onSendMessage={(message, model, system) => handleSendMessageGlobal(message, model, system, {isImageModeIntent: isImageMode})} // Pass current local isImageMode as intent for new chats
        isLoading={isAiResponding}
        // ChatInput's isImageModeActive reflects the LLL tool's current image mode state
        isImageModeActive={activeConversation?.toolType === 'Long Language Loops' ? isImageMode : false}
        onToggleImageMode={handleToggleImageMode}
        // ChatInput's uploadedFilePreviewUrl reflects the LLL tool's current file preview state
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

