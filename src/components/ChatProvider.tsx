
"use client";

import React, { useState, useEffect, useCallback, useRef, useContext, createContext } from 'react';
import { useToast } from "@/hooks/use-toast";

import type { ChatMessage, Conversation, ChatMessageContentPart, ApiChatMessage } from '@/types';
import { getPollinationsChatCompletion } from '@/ai/flows/pollinations-chat-flow';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';
import { DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME, AVAILABLE_RESPONSE_STYLES, AVAILABLE_POLLINATIONS_MODELS, AVAILABLE_TTS_VOICES } from '@/config/chat-options';
import useLocalStorageState from '@/hooks/useLocalStorageState';

export interface UseChatLogicProps {
  userDisplayName?: string;
  customSystemPrompt?: string;
  onConversationStarted?: () => void;
}

// This function contains the entire logic of the original useChat hook
export function useChatLogic({ userDisplayName, customSystemPrompt, onConversationStarted }: UseChatLogicProps) {
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [allConversations, setAllConversations] = useState<Conversation[]>([]);
    const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
    const [isAiResponding, setIsAiResponding] = useState(false);
    
    const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [chatToDeleteId, setChatToDeleteId] = useState<string | null>(null);
    
    const [isEditTitleDialogOpen, setIsEditTitleDialogOpen] = useState(false);
    const [chatToEditId, setChatToEditId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  
    const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [chatInputValue, setChatInputValue] = useState('');

    const [selectedVoice, setSelectedVoice] = useState<string>(AVAILABLE_TTS_VOICES[0].id);
  
    const { toast } = useToast();
  
    const loadConversations = useCallback((loadedConversationsRaw: any) => {
      let loadedConversations: Conversation[] = [];
      if (Array.isArray(loadedConversationsRaw)) {
          try {
              loadedConversations = loadedConversationsRaw.map((conv: any) => ({
                  ...conv,
                  id: conv.id || crypto.randomUUID(),
                  createdAt: new Date(conv.createdAt),
                  messages: (conv.messages || []).map((msg: any) => ({ ...msg, id: msg.id || crypto.randomUUID(), timestamp: new Date(msg.timestamp) })),
              })).filter((conv: Conversation) => !isNaN(conv.createdAt.getTime()) && conv.toolType === 'long language loops' && conv.messages.some(msg => msg.role === 'user' || msg.role === 'assistant'));
              setAllConversations(loadedConversations.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()));
          } catch(e) {
              console.error("Failed to parse conversations", e);
          }
      }
      setIsInitialLoadComplete(true);
      return loadedConversations;
    }, []);
  
    useEffect(() => {
      if (!isInitialLoadComplete) {
        return;
      }
      try {
        const conversationsToStore = allConversations
          .filter(conv => conv.toolType === 'long language loops' && conv.messages.some(msg => msg.role === 'user' || msg.role === 'assistant'))
          .map(conv => {
            // Create a deep copy to avoid mutating the active state
            const storableConv = JSON.parse(JSON.stringify(conv));
            
            // Remove non-serializable File object
            delete storableConv.uploadedFile;
    
            // Process messages to handle large data URIs
            storableConv.messages = storableConv.messages.map((msg: ChatMessage) => {
              if (Array.isArray(msg.content)) {
                msg.content = msg.content.map(part => {
                  if (part.type === 'image_url' && part.image_url.url.startsWith('data:image')) {
                    // Replace large data URI with a placeholder to prevent storage overflow
                    return {
                      ...part,
                      image_url: {
                        ...part.image_url,
                        url: 'https://placehold.co/512x512.png?text=Image+History+Disabled',
                        altText: 'Image removed from history to save space.',
                        isGenerated: false,
                        isUploaded: false,
                      }
                    };
                  }
                  return part;
                });
              }
              return msg;
            });
    
            // Also handle the top-level uploadedFilePreview
            if (storableConv.uploadedFilePreview && storableConv.uploadedFilePreview.startsWith('data:image')) {
              storableConv.uploadedFilePreview = null;
            }
    
            return storableConv;
          });
          
        if (conversationsToStore.length > 0) {
            localStorage.setItem('chatConversations', JSON.stringify(conversationsToStore));
        } else {
            localStorage.removeItem('chatConversations');
        }
      } catch (error) {
          console.error("Error saving conversations to localStorage (might be full):", error);
      }
    }, [allConversations, isInitialLoadComplete]);
  
    const updateActiveConversationState = useCallback((updates: Partial<Conversation>) => {
      setActiveConversation(prevActive => {
        if (!prevActive) return null;
        const updatedConv = { ...prevActive, ...updates };
        setAllConversations(prevAllConvs => prevAllConvs.map(c => (c.id === prevActive.id ? updatedConv : c)));
        return updatedConv;
      });
    }, []);
  
    useEffect(() => {
      if (activeConversation) {
        setCurrentMessages(activeConversation.messages);
      } else {
        setCurrentMessages([]);
      }
    }, [activeConversation]);
  
    const updateConversationTitle = useCallback(async (conversationId: string, messagesForTitleGen: ChatMessage[]) => {
      const convToUpdate = allConversations.find(c => c.id === conversationId);
      if (!convToUpdate || convToUpdate.toolType !== 'long language loops') return;
  
      const isDefaultTitle = convToUpdate.title === "default.long.language.loop" || convToUpdate.title.toLowerCase().startsWith("new ") || convToUpdate.title === "Chat";
  
      if (messagesForTitleGen.length >= 1 && messagesForTitleGen.length < 5 && isDefaultTitle) {
        const firstUserMessage = messagesForTitleGen.find(msg => msg.role === 'user');
        if (firstUserMessage) {
            const textContent = typeof firstUserMessage.content === 'string'
              ? firstUserMessage.content
              : firstUserMessage.content.find(p => p.type === 'text')?.text || '';
            
            if (textContent.trim()) {
                try {
                  const { title } = await generateChatTitle({ messages: textContent });
                  setAllConversations(prev => prev.map(c => (c.id === conversationId ? { ...c, title } : c)));
                  if (activeConversation?.id === conversationId) {
                      setActiveConversation(prev => (prev ? { ...prev, title } : null));
                  }
                } catch (error) { 
                    console.error("Failed to generate chat title:", error); 
                }
            }
        }
      }
    }, [allConversations, activeConversation?.id]);
    
    const sendMessage = useCallback(async (
      _messageText: string
    ) => {
      const messageText = chatInputValue.trim();
      if (!activeConversation || activeConversation.toolType !== 'long language loops' || (!messageText && !activeConversation.uploadedFile)) return;
  
      const { selectedModelId, selectedResponseStyleName, messages, uploadedFile, uploadedFilePreview } = activeConversation;
      const currentModel = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_POLLINATIONS_MODELS[0];
      
      let effectiveSystemPrompt = '';
      const basicStylePrompt = (AVAILABLE_RESPONSE_STYLES.find(s => s.name === 'Basic') || AVAILABLE_RESPONSE_STYLES[0]).systemPrompt;
  
      if (selectedResponseStyleName === "User's Default") {
          if (customSystemPrompt && customSystemPrompt.trim()) {
              effectiveSystemPrompt = customSystemPrompt.replace(/{userDisplayName}/gi, userDisplayName || "User");
          } else {
              effectiveSystemPrompt = basicStylePrompt;
          }
      } else {
          const selectedStyle = AVAILABLE_RESPONSE_STYLES.find(s => s.name === selectedResponseStyleName);
          effectiveSystemPrompt = selectedStyle ? selectedStyle.systemPrompt : basicStylePrompt;
      }
  
      setIsAiResponding(true);
      setChatInputValue('');
      const convId = activeConversation.id;
      const isFileUpload = !!uploadedFile;
  
      if (isFileUpload && !currentModel.vision) {
        toast({ title: "Model Incompatibility", description: `Model '${currentModel.name}' doesn't support images.`, variant: "destructive" });
        setIsAiResponding(false);
        return;
      }
  
      let userMessageContent: string | ChatMessageContentPart[] = messageText;
      if (isFileUpload && uploadedFilePreview) {
        userMessageContent = [
          { type: 'text', text: messageText || "Describe this image." },
          { type: 'image_url', image_url: { url: uploadedFilePreview, altText: uploadedFile.name, isUploaded: true } }
        ];
      }
  
      const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: userMessageContent, timestamp: new Date(), toolType: 'long language loops' };
      
      const updatedMessagesForState = [...messages, userMessage];
      
      updateActiveConversationState({ messages: updatedMessagesForState, uploadedFile: null, uploadedFilePreview: null });

      // Convert to API-compatible format
      const historyForApi: ApiChatMessage[] = updatedMessagesForState
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));
      
      let aiResponseText: string | null = null;
      try {
        const result = await getPollinationsChatCompletion({
          messages: historyForApi,
          modelId: currentModel.id,
          systemPrompt: effectiveSystemPrompt
        });
        aiResponseText = result.responseText;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
        aiResponseText = `Sorry, an error occurred: ${errorMessage}`;
      }
  
      if (aiResponseText !== null) {
        const aiMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: aiResponseText, timestamp: new Date(), toolType: 'long language loops' };
        const finalMessages = [...updatedMessagesForState, aiMessage];
        updateActiveConversationState({ messages: finalMessages });
        updateConversationTitle(convId, finalMessages);
      }
      
      setIsAiResponding(false);
    }, [activeConversation, customSystemPrompt, userDisplayName, toast, updateActiveConversationState, updateConversationTitle, chatInputValue]);
  
    const selectChat = useCallback((conversationId: string | null) => {
      if (conversationId === null) {
          setActiveConversation(null);
          return;
      }
      const conversationToSelect = allConversations.find(c => c.id === conversationId);
      if (!conversationToSelect) return;
  
      setActiveConversation({ ...conversationToSelect, uploadedFile: null, uploadedFilePreview: null });
      onConversationStarted?.();
    }, [allConversations, onConversationStarted]);
    
    const startNewChat = useCallback(() => {
      const newConversation: Conversation = {
        id: crypto.randomUUID(),
        title: "default.long.language.loop",
        messages: [],
        createdAt: new Date(),
        toolType: 'long language loops',
        selectedModelId: DEFAULT_POLLINATIONS_MODEL_ID, 
        selectedResponseStyleName: DEFAULT_RESPONSE_STYLE_NAME,
      };
      setAllConversations(prev => [newConversation, ...prev].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setActiveConversation(newConversation);
      onConversationStarted?.();
    }, [onConversationStarted]);
    
    const requestEditTitle = (conversationId: string) => {
      const convToEdit = allConversations.find(c => c.id === conversationId);
      if (!convToEdit) return;
      setChatToEditId(conversationId);
      setEditingTitle(convToEdit.title);
      setIsEditTitleDialogOpen(true);
    };
    
    const confirmEditTitle = () => {
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
  
    const cancelEditTitle = () => setIsEditTitleDialogOpen(false);
  
    const requestDeleteChat = (conversationId: string) => {
      setChatToDeleteId(conversationId);
      setIsDeleteDialogOpen(true);
    };
    
    const deleteChat = (conversationId: string, silent = false) => {
        const wasActive = activeConversation?.id === conversationId;
        const updatedConversations = allConversations.filter(c => c.id !== conversationId);
        setAllConversations(updatedConversations);
  
        if (wasActive) {
          const nextChat = updatedConversations.find(c => c.toolType === 'long language loops');
          if (nextChat) selectChat(nextChat.id);
          else startNewChat();
        }
        if (!silent) {
          toast({ title: "Chat Deleted" });
        }
    }
  
    const confirmDeleteChat = () => {
      if (!chatToDeleteId) return;
      deleteChat(chatToDeleteId);
      setIsDeleteDialogOpen(false);
    };
  
    const cancelDeleteChat = () => setIsDeleteDialogOpen(false);
  
    const handleFileSelect = (file: File | null) => {
      if (!activeConversation) return;
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          updateActiveConversationState({ uploadedFile: file, uploadedFilePreview: reader.result as string });
        };
        reader.readAsDataURL(file);
      } else {
        updateActiveConversationState({ uploadedFile: null, uploadedFilePreview: null });
      }
    };
  
    const clearUploadedImage = () => {
      if (activeConversation) handleFileSelect(null); 
    }
  
    const handleModelChange = useCallback((modelId: string) => {
      if (activeConversation) updateActiveConversationState({ selectedModelId: modelId });
    }, [activeConversation, updateActiveConversationState]);
  
    const handleStyleChange = useCallback((styleName: string) => {
       if (activeConversation) updateActiveConversationState({ selectedResponseStyleName: styleName });
    }, [activeConversation, updateActiveConversationState]);

    const handleVoiceChange = (voiceId: string) => {
      setSelectedVoice(voiceId);
    };
  
    const toggleHistoryPanel = () => setIsHistoryPanelOpen(prev => !prev);
    const closeHistoryPanel = useCallback(() => setIsHistoryPanelOpen(false), []);
  
    const handlePlayAudio = useCallback(async (text: string, messageId: string) => {
      toast({ title: "Not Implemented", description: "Text-to-speech has been temporarily disabled." });
    }, [toast]);
  
    const handleStartRecording = useCallback(async () => {
      toast({ title: "Not Implemented", description: "Speech-to-text has been temporarily disabled." });
    }, [toast]);
  
    const handleStopRecording = useCallback(() => {
      // Dummy function
    }, []);
  
    const handleToggleRecording = useCallback(() => {
      if (isRecording) {
        handleStopRecording();
      } else {
        handleStartRecording();
      }
    }, [isRecording, handleStartRecording, handleStopRecording]);
  
    const handleCopyToClipboard = useCallback((text: string) => {
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        toast({ title: "Copied to Clipboard" });
      }).catch(err => {
        console.error("Failed to copy text: ", err);
        toast({ title: "Copy Failed", variant: "destructive" });
      });
    }, [toast]);
  
    const regenerateLastResponse = useCallback(async () => {
      if (isAiResponding || !activeConversation) return;
  
      const lastMessageIndex = activeConversation.messages.length - 1;
      const lastMessage = activeConversation.messages[lastMessageIndex];
  
      if (!lastMessage || lastMessage.role !== 'assistant') {
        toast({ title: "Action Not Available", description: "You can only regenerate the AI's most recent response.", variant: "destructive" });
        return;
      }
  
      setIsAiResponding(true);
      const historyForApi = activeConversation.messages.slice(0, lastMessageIndex);
      updateActiveConversationState({ messages: historyForApi });
      
      const apiMessages: ApiChatMessage[] = historyForApi
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));
      
      let aiResponseText: string | null = null;
      try {
        const { selectedModelId, selectedResponseStyleName } = activeConversation;
        const currentModel = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_POLLINATIONS_MODELS[0];
        let effectiveSystemPrompt = '';
        const basicStylePrompt = (AVAILABLE_RESPONSE_STYLES.find(s => s.name === 'Basic') || AVAILABLE_RESPONSE_STYLES[0]).systemPrompt;
        if (selectedResponseStyleName === "User's Default") {
          effectiveSystemPrompt = (customSystemPrompt && customSystemPrompt.trim()) ? customSystemPrompt.replace(/{userDisplayName}/gi, userDisplayName || "User") : basicStylePrompt;
        } else {
          const selectedStyle = AVAILABLE_RESPONSE_STYLES.find(s => s.name === selectedResponseStyleName);
          effectiveSystemPrompt = selectedStyle ? selectedStyle.systemPrompt : basicStylePrompt;
        }
        
        const result = await getPollinationsChatCompletion({
          messages: apiMessages,
          modelId: currentModel.id,
          systemPrompt: effectiveSystemPrompt
        });
        aiResponseText = result.responseText;
  
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
        aiResponseText = `Sorry, an error occurred: ${errorMessage}`;
        // Restore original message on error to not lose context
        updateActiveConversationState({ messages: [...historyForApi, lastMessage] }); 
      }
  
      if (aiResponseText !== null) {
        const aiMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: aiResponseText, timestamp: new Date(), toolType: 'long language loops' };
        const finalMessages = [...historyForApi, aiMessage];
        updateActiveConversationState({ messages: finalMessages });
      }
      
      setIsAiResponding(false);
    }, [isAiResponding, activeConversation, updateActiveConversationState, customSystemPrompt, userDisplayName, toast]);
  
  
    return {
      activeConversation, allConversations, currentMessages, isAiResponding,
      isHistoryPanelOpen, isDeleteDialogOpen, isEditTitleDialogOpen, editingTitle,
      isRecording, playingMessageId, chatInputValue,
      selectedVoice,
      loadConversations, selectChat, startNewChat, deleteChat, sendMessage,
      requestEditTitle, confirmEditTitle, cancelEditTitle, setEditingTitle,
      requestDeleteChat, confirmDeleteChat, cancelDeleteChat,
      handleFileSelect, clearUploadedImage, handleModelChange, handleStyleChange,
      handleVoiceChange,
      toggleHistoryPanel, closeHistoryPanel, handlePlayAudio, handleToggleRecording,
      setChatInputValue,
      handleCopyToClipboard,
      regenerateLastResponse,
    };
}


type ChatContextType = ReturnType<typeof useChatLogic>;

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userDisplayName] = useLocalStorageState<string>("userDisplayName", "User");
    const [customSystemPrompt] = useLocalStorageState<string>("customSystemPrompt", "");
    
    const chat = useChatLogic({ userDisplayName, customSystemPrompt });
    
    return (
        <ChatContext.Provider value={chat}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

    