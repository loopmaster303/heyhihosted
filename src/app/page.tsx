
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatView from '@/components/chat/ChatView';
import ChatInput from '@/components/chat/ChatInput';
import VisualizingLoopsTool from '@/components/tools/VisualizingLoopsTool';
import ReplicateImageTool from '@/components/tools/ReplicateImageTool';
import PersonalizationTool from '@/components/tools/PersonalizationTool';
import { Button } from "@/components/ui/button";
import NextImage from 'next/image';
import { X, Pencil, Trash2, Check, Plus } from 'lucide-react';
import { Input } from "@/components/ui/input";

import type { ChatMessage, Conversation, ToolType, TileItem, ChatMessageContentPart, CurrentAppView } from '@/types';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';
import { getPollinationsChatCompletion, type PollinationsChatInput } from '@/ai/flows/pollinations-chat-flow';
import { useToast } from "@/hooks/use-toast";
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
  { id: 'long language loops', title: 'chat/ai-assistance/free' },
  { id: 'nocost imagination', title: 'generate/images/free' },
  { id: 'premium imagination', title: 'generate/images/premium' },
  { id: 'personalization', title: 'settings/personalize' },
];

const PERSONALIZATION_SETTINGS_KEY = 'personalizationSettings';
const ACTIVE_TOOL_TYPE_KEY = 'activeToolTypeForView';
const ACTIVE_CONVERSATION_ID_KEY = 'activeConversationId';


const FloatingToolMenu: React.FC<{
    onSelectTile: (id: ToolType) => void;
    onNewChat: () => void;
    className?: string;
}> = ({ onSelectTile, onNewChat, className }) => {
    return (
        <div className={`group relative flex flex-col items-center ${className}`}>
            <div className="absolute bottom-full mb-4 w-full max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center space-y-2 z-10">
                {toolTileItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onSelectTile(item.id)}
                        className="font-code text-lg text-foreground/80 hover:text-foreground transition-colors duration-150 block w-full text-center py-1.5 bg-background/50 backdrop-blur-md rounded-md shadow-lg"
                    >
                        {`└${item.title}`}
                    </button>
                ))}
                 <button
                    onClick={onNewChat}
                    className="font-code text-lg text-foreground/80 hover:text-foreground transition-colors duration-150 block w-full text-center py-1.5 bg-background/50 backdrop-blur-md rounded-md shadow-lg flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" /> New Chat
                </button>
            </div>
            <div className="font-code text-lg cursor-pointer text-muted-foreground hover:text-foreground">
                {"</hey.hi>"}
            </div>
        </div>
    );
};


export default function Home() {
  const [currentView, setCurrentView] = useState<CurrentAppView>('tiles');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chatToDeleteId, setChatToDeleteId] = useState<string | null>(null);

  const [isEditTitleDialogOpen, setIsEditTitleDialogOpen] = useState(false);
  const [chatToEditId, setChatToEditId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const [isImageMode, setIsImageMode] = useState(false);
  const [activeToolTypeForView, setActiveToolTypeForView] = useState<ToolType | null>(null);

  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  const [userDisplayName, setUserDisplayName] = useState<string>("User");
  const [customSystemPrompt, setCustomSystemPrompt] = useState<string>("");

  useEffect(() => {
    let loadedConversations: Conversation[] = [];
    try {
        const storedConversations = localStorage.getItem('chatConversations');
        if (storedConversations) {
            const parsedConvsRaw = JSON.parse(storedConversations);
            if (Array.isArray(parsedConvsRaw)) {
                loadedConversations = parsedConvsRaw.map((conv: any) => ({
                    ...conv,
                    id: conv.id || crypto.randomUUID(),
                    createdAt: new Date(conv.createdAt),
                    messages: (conv.messages || []).map((msg: any) => ({ ...msg, id: msg.id || crypto.randomUUID(), timestamp: new Date(msg.timestamp) })),
                })).filter(conv => !isNaN(conv.createdAt.getTime()) && conv.toolType === 'long language loops' && conv.messages.some(msg => msg.role === 'user' || msg.role === 'assistant'));
                setAllConversations(loadedConversations.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()));
            }
        }
    } catch (error) {
        console.error("Failed to parse conversations from localStorage.", error);
        localStorage.removeItem('chatConversations');
    }

    try {
        const storedPersonalization = localStorage.getItem(PERSONALIZATION_SETTINGS_KEY);
        if (storedPersonalization) {
            const settings = JSON.parse(storedPersonalization);
            if (settings.userDisplayName) setUserDisplayName(settings.userDisplayName);
            if (settings.customSystemPrompt) setCustomSystemPrompt(settings.customSystemPrompt);
        }
    } catch (error) {
        console.error("Failed to parse personalization settings.", error);
        localStorage.removeItem(PERSONALIZATION_SETTINGS_KEY);
    }

    const storedActiveToolType = localStorage.getItem(ACTIVE_TOOL_TYPE_KEY) as ToolType | null;
    if (storedActiveToolType && toolTileItems.some(item => item.id === storedActiveToolType)) {
      setActiveToolTypeForView(storedActiveToolType);
      const storedActiveConvId = localStorage.getItem(ACTIVE_CONVERSATION_ID_KEY);
      const conv = storedActiveToolType === 'long language loops' && storedActiveConvId ? loadedConversations.find(c => c.id === storedActiveConvId) : undefined;
      
      if (conv) {
         setActiveConversation(conv);
         setCurrentMessages(conv.messages);
         setCurrentView('chat');
      } else {
         setCurrentView(getViewForTool(storedActiveToolType));
      }
    } else {
        setCurrentView('tiles');
    }

    setIsInitialLoadComplete(true);
  }, []);


  const getViewForTool = (toolType: ToolType): CurrentAppView => {
    switch(toolType) {
        case 'long language loops': return 'chat';
        case 'nocost imagination': return 'easyImageLoopTool';
        case 'premium imagination': return 'replicateImageTool';
        case 'personalization': return 'personalizationTool';
        default: return 'tiles';
    }
  };


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
        localStorage.removeItem(ACTIVE_CONVERSATION_ID_KEY);
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
            .filter(conv => conv.toolType === 'long language loops' && conv.messages.some(msg => msg.role === 'user' || msg.role === 'assistant'))
            .map(conv => {
                const { uploadedFile: _uploadedFile, ...storableConv } = conv;
                return storableConv;
            });
        localStorage.setItem('chatConversations', JSON.stringify(conversationsToStore));
    }
  }, [allConversations, isInitialLoadComplete]);


  const updateActiveConversationState = useCallback((updates: Partial<Conversation>) => {
    setActiveConversation(prevActive => {
      if (!prevActive) return null;
      const updatedConv = { ...prevActive, ...updates };
      setAllConversations(prevAllConvs => prevAllConvs.map(c => (c.id === prevActive.id ? updatedConv : c)));
      return updatedConv;
    });

    if (updates.hasOwnProperty('isImageMode')) { 
        setIsImageMode(updates.isImageMode || false);
    }
  }, []);


  useEffect(() => {
    if (activeConversation) {
        setIsImageMode(activeConversation.isImageMode || false);
    } else {
        setIsImageMode(false); 
    }
  }, [activeConversation]);


  const updateConversationTitle = useCallback(async (conversationId: string, messagesForTitleGen: ChatMessage[]) => {
    const convToUpdate = allConversations.find(c => c.id === conversationId);
    if (!convToUpdate || convToUpdate.toolType !== 'long language loops') return;

    const isDefaultTitle = convToUpdate.title === "default.long.language.loop" || convToUpdate.title.toLowerCase().startsWith("new ") || convToUpdate.title === "Chat";

    if (messagesForTitleGen.length >= 1 && messagesForTitleGen.length < 5 && isDefaultTitle) {
      const relevantText = messagesForTitleGen.map(msg => typeof msg.content === 'string' ? `${msg.role}: ${msg.content}` : `${msg.role}: ${msg.content.find(p => p.type === 'text')?.text || ''}`).filter(Boolean).slice(0, 3).join('\n\n');
      if (relevantText) {
        try {
          const { title } = await generateChatTitle({ messages: relevantText });
          setAllConversations(prev => prev.map(c => (c.id === conversationId ? { ...c, title } : c)));
          if (activeConversation?.id === conversationId) {
            setActiveConversation(prev => (prev ? { ...prev, title } : null));
          }
        } catch (error) { console.error("Failed to generate chat title:", error); }
      }
    }
  }, [allConversations, activeConversation?.id]);


  const cleanupPreviousEmptyLllChat = useCallback((previousActiveConv: Conversation | null) => {
    if (previousActiveConv && previousActiveConv.toolType === 'long language loops' && !previousActiveConv.messages.some(msg => msg.role === 'user' || msg.role === 'assistant')) {
        setAllConversations(prevAllConvs => prevAllConvs.filter(c => c.id !== previousActiveConv.id));
    }
  }, []);

  const startNewLongLanguageLoopChat = useCallback(() => {
    const previousActiveConv = activeConversation;
    cleanupPreviousEmptyLllChat(previousActiveConv); 

    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: "default.long.language.loop",
      messages: [],
      createdAt: new Date(),
      toolType: 'long language loops',
      isImageMode: false, 
      selectedModelId: DEFAULT_POLLINATIONS_MODEL_ID, 
      selectedResponseStyleName: DEFAULT_RESPONSE_STYLE_NAME,
    };
    setAllConversations(prev => [newConversation, ...prev].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    setActiveConversation(newConversation);
    setCurrentMessages([]);
    setActiveToolTypeForView('long language loops');
    setCurrentView('chat');
  }, [activeConversation, cleanupPreviousEmptyLllChat]);


  const handleSelectTile = useCallback((toolType: ToolType) => {
    cleanupPreviousEmptyLllChat(activeConversation);
    setActiveToolTypeForView(toolType);
    if (toolType === 'long language loops') {
      const latestChat = allConversations.find(c => c.toolType === 'long language loops');
      if (latestChat) handleSelectChatFromHistory(latestChat.id);
      else startNewLongLanguageLoopChat();
    } else {
        setActiveConversation(null); 
        setCurrentMessages([]);
        setCurrentView(getViewForTool(toolType));
    }
  }, [activeConversation, cleanupPreviousEmptyLllChat, startNewLongLanguageLoopChat, allConversations]);

  const handleSelectChatFromHistory = useCallback((conversationId: string) => {
    const conversationToSelect = allConversations.find(c => c.id === conversationId);
    if (!conversationToSelect) return;
    cleanupPreviousEmptyLllChat(activeConversation);
    setActiveConversation({ ...conversationToSelect, uploadedFile: null });
    setCurrentMessages(conversationToSelect.messages);
    setIsImageMode(conversationToSelect.isImageMode || false);
    setActiveToolTypeForView('long language loops');
    setCurrentView('chat');
  }, [allConversations, activeConversation, cleanupPreviousEmptyLllChat]);


  const handleSendMessageGlobal = useCallback(async (
    messageText: string,
    options: { isImageModeIntent?: boolean; } = {}
  ) => {
    if (!activeConversation || activeConversation.toolType !== 'long language loops') return;

    const { selectedModelId, selectedResponseStyleName, messages, uploadedFile, uploadedFilePreview } = activeConversation;
    const currentModel = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_POLLINATIONS_MODELS[0];
    
    let effectiveSystemPrompt = customSystemPrompt.trim() ? customSystemPrompt.replace(/{userDisplayName}/gi, userDisplayName || "User") : (AVAILABLE_RESPONSE_STYLES.find(s => s.name === selectedResponseStyleName) || AVAILABLE_RESPONSE_STYLES[0]).systemPrompt;

    setIsAiResponding(true);
    const convId = activeConversation.id;
    const isImagePrompt = options.isImageModeIntent || false;
    const isFileUpload = !!uploadedFile && !isImagePrompt;

    if (isFileUpload && !currentModel.vision) {
      toast({ title: "Model Incompatibility", description: `Model '${currentModel.name}' doesn't support images.`, variant: "destructive" });
      setIsAiResponding(false);
      return;
    }

    let userMessageContent: string | ChatMessageContentPart[] = messageText.trim();
    if (isFileUpload && uploadedFilePreview) {
      userMessageContent = [
        { type: 'text', text: messageText.trim() || "Describe this image." },
        { type: 'image_url', image_url: { url: uploadedFilePreview, altText: uploadedFile.name, isUploaded: true } }
      ];
    }

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: userMessageContent, timestamp: new Date(), toolType: 'long language loops' };
    const messagesForApi = [...messages, userMessage];
    const updatedMessagesForState = isImagePrompt ? messages : [...messages, userMessage];
    
    updateActiveConversationState({ messages: updatedMessagesForState });
    setCurrentMessages(updatedMessagesForState);

    let aiResponseContent: string | ChatMessageContentPart[] | null = null;
    try {
        if (isImagePrompt && messageText.trim()) {
            const response = await fetch('/api/openai-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: messageText.trim(), model: 'gptimage', private: true }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to generate image.');
            aiResponseContent = [
                { type: 'text', text: `Generated image for: "${messageText.trim()}"` },
                { type: 'image_url', image_url: { url: result.imageUrl, altText: `Generated image for ${messageText.trim()}`, isGenerated: true } }
            ];
        } else {
            const apiInput: PollinationsChatInput = { messages: messagesForApi, modelId: currentModel.id, systemPrompt: effectiveSystemPrompt };
            const result = await getPollinationsChatCompletion(apiInput);
            aiResponseContent = result.responseText;
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
        aiResponseContent = `Sorry, an error occurred: ${errorMessage}`;
    }

    if (aiResponseContent !== null) {
      const aiMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: aiResponseContent, timestamp: new Date(), toolType: 'long language loops' };
      const finalMessages = [...updatedMessagesForState, aiMessage];
      updateActiveConversationState({ messages: finalMessages });
      setCurrentMessages(finalMessages);
      updateConversationTitle(convId, finalMessages);
    }
    
    if (isImagePrompt || isFileUpload) {
        updateActiveConversationState({ isImageMode: false, uploadedFile: null, uploadedFilePreview: null });
    }
    setIsAiResponding(false);
  }, [activeConversation, customSystemPrompt, userDisplayName, toast, updateActiveConversationState, updateConversationTitle]);


  const handleRequestEditTitle = (conversationId: string) => {
    const convToEdit = allConversations.find(c => c.id === conversationId);
    if (!convToEdit) return;
    setChatToEditId(conversationId);
    setEditingTitle(convToEdit.title);
    setIsEditTitleDialogOpen(true);
  };
  
  const handleConfirmEditTitle = () => {
    if (!chatToEditId || !editingTitle.trim()) {
      toast({ title: "Invalid Title", description: "Title cannot be empty.", variant: "destructive" });
      return;
    }
    const updatedTitle = editingTitle.trim();
    setAllConversations(prev => prev.map(c => (c.id === chatToEditId ? { ...c, title: updatedTitle } : c)));
    if (activeConversation?.id === chatToEditId) {
      setActiveConversation(prev => (prev ? { ...prev, title: updatedTitle } : null));
    }
    toast({ title: "Title Updated" });
    setIsEditTitleDialogOpen(false);
  };

  const handleRequestDeleteChat = (conversationId: string) => {
    setChatToDeleteId(conversationId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteChat = () => {
    if (!chatToDeleteId) return;
    const wasActive = activeConversation?.id === chatToDeleteId;
    const updatedConversations = allConversations.filter(c => c.id !== chatToDeleteId);
    setAllConversations(updatedConversations);

    if (wasActive) {
      const nextChat = updatedConversations.find(c => c.toolType === 'long language loops');
      if (nextChat) handleSelectChatFromHistory(nextChat.id);
      else setCurrentView('tiles');
    }
    setIsDeleteDialogOpen(false);
    toast({ title: "Chat Deleted" });
  };

  const handleToggleImageMode = () => {
    if (!activeConversation) return;
    const newImageModeState = !isImageMode; 
    updateActiveConversationState({ isImageMode: newImageModeState, uploadedFile: null, uploadedFilePreview: null });
  };

  const handleFileSelect = (file: File | null) => {
    if (!activeConversation) return;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateActiveConversationState({ isImageMode: false, uploadedFile: file, uploadedFilePreview: reader.result as string });
      };
      reader.readAsDataURL(file);
    } else {
      updateActiveConversationState({ uploadedFile: null, uploadedFilePreview: null });
    }
  };

  const handleModelChange = useCallback((modelId: string) => {
    if (activeConversation) updateActiveConversationState({ selectedModelId: modelId });
  }, [activeConversation, updateActiveConversationState]);

  const handleStyleChange = useCallback((styleName: string) => {
     if (activeConversation) updateActiveConversationState({ selectedResponseStyleName: styleName });
  }, [activeConversation, updateActiveConversationState]);

  const clearUploadedImageForLLL = () => {
    if (activeConversation) handleFileSelect(null); 
  }

  const renderContent = () => {
    switch (currentView) {
      case 'chat':
        if (!activeConversation) return null; // Or some fallback UI
        return (
          <>
            <ChatView
              conversation={activeConversation}
              messages={currentMessages}
              isLoading={isAiResponding}
              className="flex-grow overflow-y-auto"
            />
            <div className="px-4 pt-3 pb-2">
              <FloatingToolMenu onSelectTile={handleSelectTile} onNewChat={startNewLongLanguageLoopChat} className="mb-2"/>
              {activeConversation.uploadedFilePreview && (
                  <div className="max-w-3xl mx-auto p-2 relative w-fit self-center">
                  <NextImage src={activeConversation.uploadedFilePreview} alt="Uploaded preview" width={80} height={80} style={{ objectFit: "cover" }} className="rounded-md" data-ai-hint="upload preview" />
                  <Button type="button" variant="ghost" size="icon" className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90" onClick={clearUploadedImageForLLL} aria-label="Clear uploaded image">
                      <X className="w-4 h-4" />
                  </Button>
                  </div>
              )}
              <ChatInput
                onSendMessage={handleSendMessageGlobal}
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
              <div className="flex items-center justify-center text-center py-2 px-4 space-x-2">
                  <h1 className="text-sm font-code font-extralight text-foreground/60 tracking-normal select-none">
                      {activeConversation.title || "Chat"}
                  </h1>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => handleRequestEditTitle(activeConversation.id)}>
                      <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRequestDeleteChat(activeConversation.id)}>
                      <Trash2 className="w-3 h-3" />
                  </Button>
              </div>
            </div>
          </>
        );
      case 'easyImageLoopTool':
      case 'replicateImageTool':
      case 'personalizationTool':
        return (
            <div className="flex flex-col h-full">
                <div className="p-4 border-b border-border">
                   <FloatingToolMenu onSelectTile={handleSelectTile} onNewChat={startNewLongLanguageLoopChat} />
                </div>
                <div className="flex-grow overflow-y-auto">
                    {currentView === 'easyImageLoopTool' && <VisualizingLoopsTool />}
                    {currentView === 'replicateImageTool' && <ReplicateImageTool />}
                    {currentView === 'personalizationTool' && (
                        <PersonalizationTool
                            userDisplayName={userDisplayName}
                            setUserDisplayName={setUserDisplayName}
                            customSystemPrompt={customSystemPrompt}
                            setCustomSystemPrompt={setCustomSystemPrompt}
                            onSave={savePersonalizationSettings}
                        />
                    )}
                </div>
            </div>
        );
      case 'tiles':
      default:
        return (
          <main className="flex-grow container mx-auto px-4 sm:px-6 py-10 flex flex-col items-center justify-center overflow-y-auto">
              <FloatingToolMenu onSelectTile={handleSelectTile} onNewChat={startNewLongLanguageLoopChat} />
              <footer className="absolute bottom-10 w-full max-w-4xl text-center">
                <p className="font-code text-xs sm:text-sm text-muted-foreground leading-relaxed text-center">
                  {"Say hi to </hey.hi> – chat with Artificial Intelligence or create stunning images with it, all for free. Try different models, generate images, and personalize your experience. No paywall, no limits, for everyone."}
                </p>
              </footer>
          </main>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {renderContent()}

      {isDeleteDialogOpen && chatToDeleteId && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this chat.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDeleteChat}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isEditTitleDialogOpen && (
        <AlertDialog open={isEditTitleDialogOpen} onOpenChange={setIsEditTitleDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Edit Chat Title</AlertDialogTitle><AlertDialogDescription>Enter a new title for this chat.</AlertDialogDescription></AlertDialogHeader>
            <Input value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmEditTitle(); }} placeholder="New chat title" autoFocus />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsEditTitleDialogOpen(false)}><X className="h-4 w-4 mr-2" />Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmEditTitle}><Check className="h-4 w-4 mr-2" />Save</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
