
"use client";

import React, { useState, useEffect, useCallback, useRef, useContext, createContext } from 'react';
import { useToast } from "@/hooks/use-toast";

import type { ChatMessage, Conversation, ChatMessageContentPart } from '@/types';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';
import { getPollinationsChatCompletion, type PollinationsChatInput } from '@/ai/flows/pollinations-chat-flow';
import { DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME, AVAILABLE_RESPONSE_STYLES, AVAILABLE_POLLINATIONS_MODELS, AVAILABLE_TTS_VOICES } from '@/config/chat-options';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { speechToText } from '@/ai/flows/stt-flow';
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
    
    const [isImageMode, setIsImageMode] = useState(false);
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  
    const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
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
          // Don't toast here as it can be annoying, but the error is logged.
          // The user already sees the crash boundary if this fails during a write operation.
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
        setCurrentMessages(activeConversation.messages);
        setIsImageMode(activeConversation.isImageMode || false);
      } else {
        setCurrentMessages([]);
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
    
    const sendMessage = useCallback(async (
      _messageText: string,
      options: { isImageModeIntent?: boolean; } = {}
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
      const isImagePrompt = options.isImageModeIntent || false;
      const isFileUpload = !!uploadedFile && !isImagePrompt;
  
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
      const messagesForApi = [...messages, userMessage];
      const updatedMessagesForState = isImagePrompt ? messages : [...messages, userMessage];
      
      updateActiveConversationState({ messages: updatedMessagesForState });
  
      let aiResponseContent: string | ChatMessageContentPart[] | null = null;
      try {
          if (isImagePrompt && messageText) {
              const response = await fetch('/api/openai-image', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ prompt: messageText, model: 'gptimage', private: true }),
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error || 'Failed to generate image.');
              aiResponseContent = [
                  { type: 'text', text: `Generated image for: "${messageText}"` },
                  { type: 'image_url', image_url: { url: result.imageUrl, altText: `Generated image for ${messageText}`, isGenerated: true } }
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
        updateConversationTitle(convId, finalMessages);
      }
      
      if (isImagePrompt || isFileUpload) {
          updateActiveConversationState({ isImageMode: false, uploadedFile: null, uploadedFilePreview: null });
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
  
      setActiveConversation({ ...conversationToSelect, uploadedFile: null });
      onConversationStarted?.();
    }, [allConversations, onConversationStarted]);
    
    const startNewChat = useCallback(() => {
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
  
    const toggleImageMode = () => {
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
      if (playingMessageId) return;
      setPlayingMessageId(messageId);
      try {
        const { audioDataUri } = await textToSpeech(text, selectedVoice);
        const audio = new Audio(audioDataUri);
        audio.play();
        audio.onended = () => {
          setPlayingMessageId(null);
        };
        audio.onerror = () => {
          toast({ title: "Audio Playback Error", description: "Could not play the generated audio.", variant: "destructive" });
          setPlayingMessageId(null);
        }
      } catch (error) {
        console.error("TTS Error:", error);
        toast({ title: "Text-to-Speech Error", description: "Could not generate audio.", variant: "destructive" });
        setPlayingMessageId(null);
      }
    }, [playingMessageId, toast, selectedVoice]);
  
    const handleStartRecording = useCallback(async () => {
      if (isRecording) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
  
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
  
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
              const base64Audio = reader.result as string;
              if(!base64Audio) return;
              setIsAiResponding(true);
              try {
                  const { transcription } = await speechToText({ audioDataUri: base64Audio });
                  setChatInputValue(prev => (prev ? prev + ' ' : '') + transcription);
              } catch (error) {
                  console.error("STT Error:", error);
                  toast({ title: "Speech-to-Text Error", description: "Could not transcribe audio.", variant: "destructive" });
              } finally {
                  setIsAiResponding(false);
              }
          };
        };
  
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Microphone access error:", error);
        toast({ title: "Microphone Access Denied", description: "Please enable microphone permissions in your browser.", variant: "destructive" });
      }
    }, [isRecording, toast]);
  
    const handleStopRecording = useCallback(() => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      }
    }, [isRecording]);
  
    const handleToggleRecording = useCallback(() => {
      if (isRecording) {
        handleStopRecording();
      } else {
        handleStartRecording();
      }
    }, [isRecording, handleStartRecording, handleStopRecording]);
  
  
    return {
      activeConversation, allConversations, currentMessages, isAiResponding, isImageMode,
      isHistoryPanelOpen, isDeleteDialogOpen, isEditTitleDialogOpen, editingTitle,
      isRecording, playingMessageId, chatInputValue,
      selectedVoice,
      loadConversations, selectChat, startNewChat, deleteChat, sendMessage,
      requestEditTitle, confirmEditTitle, cancelEditTitle, setEditingTitle,
      requestDeleteChat, confirmDeleteChat, cancelDeleteChat, toggleImageMode,
      handleFileSelect, clearUploadedImage, handleModelChange, handleStyleChange,
      handleVoiceChange,
      toggleHistoryPanel, closeHistoryPanel, handlePlayAudio, handleToggleRecording,
      setChatInputValue,
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
