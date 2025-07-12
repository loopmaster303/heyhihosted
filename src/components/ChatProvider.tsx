
"use client";

import React, { useState, useEffect, useCallback, useRef, useContext, createContext } from 'react';
import { useToast } from "@/hooks/use-toast";

import type { ChatMessage, Conversation, ChatMessageContentPart, ApiChatMessage } from '@/types';
import { getPollinationsChatCompletion } from '@/ai/flows/pollinations-chat-flow';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';
import { DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME, AVAILABLE_RESPONSE_STYLES, AVAILABLE_POLLINATIONS_MODELS, AVAILABLE_TTS_VOICES } from '@/config/chat-options';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { getPollinationsTranscription } from '@/ai/flows/pollinations-stt-flow';

import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, query, orderBy, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, type User, signInAnonymously } from 'firebase/auth';


export interface UseChatLogicProps {
  userDisplayName?: string;
  customSystemPrompt?: string;
}

const MAX_STORED_CONVERSATIONS = 50;

export function useChatLogic({ userDisplayName, customSystemPrompt }: UseChatLogicProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [allConversations, setAllConversations] = useState<Conversation[]>([]);
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
    const [isTtsLoadingForId, setIsTtsLoadingForId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [chatInputValue, setChatInputValue] = useState('');

    const [selectedVoice, setSelectedVoice] = useState<string>(AVAILABLE_TTS_VOICES[0].id);
  
    const { toast } = useToast();

    const loadConversations = useCallback(async (user: User) => {
        const conversationsRef = collection(db, 'users', user.uid, 'conversations');
        const q = query(conversationsRef, orderBy('createdAt', 'desc'));

        try {
            const querySnapshot = await getDocs(q);
            const loadedConversations: Conversation[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt.toDate(),
                    messages: (data.messages || []).map((msg: any) => ({
                        ...msg,
                        id: msg.id || crypto.randomUUID(),
                        timestamp: msg.timestamp?.toDate() || new Date()
                    }))
                } as Conversation;
            });
            setAllConversations(loadedConversations);
            return loadedConversations;
        } catch (error) {
            console.error("Error loading conversations from Firestore:", error);
            toast({ title: "Error", description: "Could not load chat history.", variant: "destructive" });
            return [];
        }
    }, [toast]);
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                await loadConversations(user);
                setIsInitialLoadComplete(true);
            } else {
                try {
                    const userCredential = await signInAnonymously(auth);
                    setCurrentUser(userCredential.user);
                    setAllConversations([]);
                    setIsInitialLoadComplete(true);
                } catch (error) {
                    console.error("Anonymous sign-in failed:", error);
                    toast({ title: "Authentication Error", description: "Could not connect. Please check your Firebase configuration and security rules.", variant: "destructive" });
                    setIsInitialLoadComplete(true); 
                }
            }
        });
        return () => unsubscribe();
    }, [toast, loadConversations]);
    
    const updateFirestoreConversation = useCallback(async (conversation: Conversation) => {
        if (!currentUser) return;
        
        const storableConv = JSON.parse(JSON.stringify(conversation));
        
        delete storableConv.uploadedFile;
        delete storableConv.uploadedFilePreview;

        storableConv.messages = storableConv.messages.map((msg: ChatMessage) => {
          if (Array.isArray(msg.content)) {
            msg.content = msg.content.map(part => {
              if (part.type === 'image_url' && part.image_url.url.startsWith('data:image') && part.image_url.url.length > 500 * 1024) { 
                return { ...part, image_url: { ...part.image_url, url: 'https://placehold.co/512x512.png?text=Image+History+Disabled' } };
              }
              return part;
            });
          }
          return msg;
        });

        const convRef = doc(db, 'users', currentUser.uid, 'conversations', storableConv.id);
        try {
            await setDoc(convRef, storableConv, { merge: true });
        } catch (error) {
            console.error("Error saving conversation to Firestore:", error);
            toast({ title: "Save Error", description: "Could not save changes to the cloud.", variant: "destructive" });
        }
    }, [currentUser, toast]);

    const updateActiveConversationState = useCallback((updates: Partial<Conversation>) => {
      setActiveConversation(prevActive => {
        if (!prevActive) return null;
        const updatedConv = { ...prevActive, ...updates };
        
        setAllConversations(prevAllConvs => {
            const existing = prevAllConvs.find(c => c.id === prevActive.id);
            if (existing) {
                return prevAllConvs.map(c => (c.id === prevActive.id ? updatedConv : c));
            }
            return [updatedConv, ...prevAllConvs];
        });
        
        updateFirestoreConversation(updatedConv);
        return updatedConv;
      });
      
      if (updates.hasOwnProperty('isImageMode')) { 
          setIsImageMode(updates.isImageMode || false);
      }
    }, [updateFirestoreConversation]);
  
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
        const firstUserMessage = messagesForTitleGen.find(msg => msg.role === 'user');
        if (firstUserMessage) {
            const textContent = typeof firstUserMessage.content === 'string'
              ? firstUserMessage.content
              : firstUserMessage.content.find(p => p.type === 'text')?.text || '';
            
            if (textContent.trim()) {
                try {
                  const { title } = await generateChatTitle({ messages: textContent });
                  updateActiveConversationState({ title });
                } catch (error) { 
                    console.error("Failed to generate chat title:", error); 
                }
            }
        }
      }
    }, [allConversations, updateActiveConversationState]);
    
    const sendMessage = useCallback(async (
      _messageText: string,
      options: { isImageModeIntent?: boolean; } = {}
    ) => {
      if (!currentUser || !activeConversation || activeConversation.toolType !== 'long language loops' || (!chatInputValue.trim() && !activeConversation.uploadedFile)) return;
  
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
  
      let userMessageContent: string | ChatMessageContentPart[] = chatInputValue.trim();
      if (isFileUpload && uploadedFilePreview) {
        userMessageContent = [
          { type: 'text', text: chatInputValue.trim() || "Describe this image." },
          { type: 'image_url', image_url: { url: uploadedFilePreview, altText: uploadedFile.name, isUploaded: true } }
        ];
      }
  
      const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: userMessageContent, timestamp: new Date(), toolType: 'long language loops' };
      
      const updatedMessagesForState = isImagePrompt ? messages : [...messages, userMessage];
      updateActiveConversationState({ messages: updatedMessagesForState });

      const historyForApi: ApiChatMessage[] = updatedMessagesForState
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));
      
      let aiResponseContent: string | ChatMessageContentPart[] | null = null;
      try {
          if (isImagePrompt && chatInputValue.trim()) {
              const response = await fetch('/api/openai-image', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ prompt: chatInputValue.trim(), model: 'gptimage', private: true }),
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error || 'Failed to generate image.');
              aiResponseContent = [
                  { type: 'text', text: `Generated image for: "${chatInputValue.trim()}"` },
                  { type: 'image_url', image_url: { url: result.imageUrl, altText: `Generated image for ${chatInputValue.trim()}`, isGenerated: true } }
              ];
          } else {
              const result = await getPollinationsChatCompletion({
                messages: historyForApi,
                modelId: currentModel.id,
                systemPrompt: effectiveSystemPrompt
              });
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
    }, [activeConversation, customSystemPrompt, userDisplayName, toast, updateActiveConversationState, updateConversationTitle, chatInputValue, currentUser]);
  
    const selectChat = useCallback((conversationId: string | null) => {
      if (conversationId === null) {
          setActiveConversation(null);
          return;
      }
      const conversationToSelect = allConversations.find(c => c.id === conversationId);
      if (conversationToSelect) {
        setActiveConversation({ ...conversationToSelect, uploadedFile: null, uploadedFilePreview: null });
      }
    }, [allConversations]);
    
    const startNewChat = useCallback(async () => {
      if (!currentUser) return;

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

      // Optimistically update UI
      setActiveConversation(newConversation);
      setAllConversations(prev => [newConversation, ...prev].sort((a, b) => new Date(b.createdAt.toString()).getTime() - new Date(a.createdAt.toString()).getTime()));

      // Prune old conversations if necessary
      if (allConversations.length >= MAX_STORED_CONVERSATIONS) {
          const oldestConversation = [...allConversations].sort((a, b) => new Date(a.createdAt.toString()).getTime() - new Date(b.createdAt.toString()).getTime())[0];
          try {
              const oldConvRef = doc(db, 'users', currentUser.uid, 'conversations', oldestConversation.id);
              await deleteDoc(oldConvRef);
          } catch(error) {
              console.error("Error deleting oldest conversation:", error);
          }
      }

      // Persist to Firestore
      const convRef = doc(db, 'users', currentUser.uid, 'conversations', newConversation.id);
      try {
        await setDoc(convRef, newConversation);
      } catch (error) {
        console.error("Error creating new conversation in Firestore:", error);
        toast({ title: "Error", description: "Could not create new chat.", variant: "destructive" });
        // Rollback optimistic update on failure
        setAllConversations(prev => prev.filter(c => c.id !== newConversation.id));
        setActiveConversation(null);
      }
    }, [currentUser, allConversations, toast]);
    
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
      updateActiveConversationState({ title: editingTitle.trim() });
      toast({ title: "Title Updated" });
      setIsEditTitleDialogOpen(false);
    };
  
    const cancelEditTitle = () => setIsEditTitleDialogOpen(false);
  
    const requestDeleteChat = (conversationId: string) => {
      setChatToDeleteId(conversationId);
      setIsDeleteDialogOpen(true);
    };
    
    const deleteChat = useCallback(async (conversationId: string) => {
        if (!currentUser) return;
        const wasActive = activeConversation?.id === conversationId;

        // Optimistically update UI
        const conversationsBeforeDelete = allConversations;
        const updatedConversations = allConversations.filter(c => c.id !== conversationId);
        setAllConversations(updatedConversations);
  
        if (wasActive) {
          const nextChat = updatedConversations.find(c => c.toolType === 'long language loops');
          selectChat(nextChat ? nextChat.id : null);
        }

        toast({ title: "Chat Deleted" });
        
        // Persist to Firestore
        const convRef = doc(db, 'users', currentUser.uid, 'conversations', conversationId);
        try {
            await deleteDoc(convRef);
        } catch (error) {
            console.error("Error deleting conversation from Firestore:", error);
            toast({ title: "Delete Error", description: "Could not delete chat from the cloud.", variant: "destructive" });
            // Rollback on failure
            setAllConversations(conversationsBeforeDelete);
        }
    }, [currentUser, activeConversation?.id, allConversations, selectChat, toast]);
  
    const confirmDeleteChat = () => {
      if (!chatToDeleteId) return;
      deleteChat(chatToDeleteId);
      setIsDeleteDialogOpen(false);
    };
  
    const cancelDeleteChat = () => setIsDeleteDialogOpen(false);
    
    const toggleImageMode = () => {
      if (!activeConversation) return;
      const newImageModeState = !isImageMode; 
      setActiveConversation(prev => prev ? {...prev, isImageMode: newImageModeState, uploadedFile: null, uploadedFilePreview: null } : null);
      setIsImageMode(newImageModeState);
    };

    const handleFileSelect = (file: File | null) => {
      if (!activeConversation) return;
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setActiveConversation(prev => prev ? {...prev, isImageMode: false, uploadedFile: file, uploadedFilePreview: reader.result as string } : null);
        };
        reader.readAsDataURL(file);
      } else {
        setActiveConversation(prev => prev ? {...prev, uploadedFile: null, uploadedFilePreview: null } : null);
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
      // If clicking the button of the currently playing audio, stop it.
      if (audioRef.current && playingMessageId === messageId) {
        audioRef.current.pause();
        audioRef.current = null;
        setPlayingMessageId(null);
        return;
      }

      // If any other audio is playing, stop it before proceeding.
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setPlayingMessageId(null); // Clear the playing state
      }
      
      if (!text || !text.trim()) {
        return;
      }
      
      setIsTtsLoadingForId(messageId);
      
      try {
        const { audioDataUri } = await textToSpeech(text, selectedVoice);
        const audio = new Audio(audioDataUri);
        audioRef.current = audio;
        
        setPlayingMessageId(messageId);

        audio.play();
        
        audio.onended = () => {
          if (audioRef.current === audio) {
            audioRef.current = null;
            setPlayingMessageId(null);
          }
        };
        
        audio.onerror = (e) => {
          toast({ title: "Audio Playback Error", variant: "destructive" });
          if (audioRef.current === audio) {
            audioRef.current = null;
            setPlayingMessageId(null);
          }
        };
      } catch (error) {
        console.error("TTS Error:", error);
        toast({ title: "Text-to-Speech Error", description: error instanceof Error ? error.message : "Could not generate audio.", variant: "destructive" });
        if (playingMessageId === messageId) {
            setPlayingMessageId(null);
        }
      } finally {
        setIsTtsLoadingForId(null);
      }
    }, [playingMessageId, toast, selectedVoice]);
  
    const handleStartRecording = useCallback(async () => {
        if (isRecording) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64data = reader.result as string;
                    toast({ title: "Transcribing audio..." });
                    try {
                        const { transcription } = await getPollinationsTranscription({ audioDataUri: base64data });
                        setChatInputValue(prev => prev ? `${prev} ${transcription}` : transcription);
                        toast({ title: "Transcription complete" });
                    } catch (error) {
                        console.error("Transcription Error:", error);
                        toast({ title: "Transcription Failed", description: error instanceof Error ? error.message : "Could not transcribe audio.", variant: "destructive" });
                    }
                };

                // Clean up stream tracks
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setIsRecording(true);
            toast({ title: "Recording started..." });
        } catch (error) {
            console.error("Error starting recording:", error);
            toast({ title: "Microphone Access Denied", description: "Please enable microphone permissions in your browser settings.", variant: "destructive" });
        }
    }, [isRecording, toast]);

    const handleStopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            toast({ title: "Recording stopped." });
        }
    }, [isRecording, toast]);
  
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

        const regenerationPromptSuffix = `\n(Bitte formuliere deine vorherige Antwort um oder biete eine alternative Perspektive an.)`;
        effectiveSystemPrompt += regenerationPromptSuffix;
        
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
      activeConversation,
      allConversations,
      isAiResponding, isImageMode,
      isHistoryPanelOpen, isDeleteDialogOpen, isEditTitleDialogOpen, editingTitle,
      isRecording, playingMessageId, isTtsLoadingForId, chatInputValue,
      selectedVoice,
      isInitialLoadComplete,
      selectChat, startNewChat, deleteChat, sendMessage,
      requestEditTitle, confirmEditTitle, cancelEditTitle, setEditingTitle,
      requestDeleteChat, confirmDeleteChat, cancelDeleteChat, toggleImageMode,
      handleFileSelect, clearUploadedImage, handleModelChange, handleStyleChange,
      handleVoiceChange,
      toggleHistoryPanel, closeHistoryPanel, handlePlayAudio, handleToggleRecording,
      setChatInputValue,
      handleCopyToClipboard,
      regenerateLastResponse,
      currentUser
    };
}


type ChatContextType = ReturnType<typeof useChatLogic> & {
    currentMessages: ChatMessage[];
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userDisplayName] = useLocalStorageState<string>("userDisplayName", "User");
    const [customSystemPrompt] = useLocalStorageState<string>("customSystemPrompt", "");
    
    const chatLogic = useChatLogic({ userDisplayName, customSystemPrompt });
    
    const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        if (chatLogic.activeConversation) {
            setCurrentMessages(chatLogic.activeConversation.messages);
        } else {
            setCurrentMessages([]);
        }
    }, [chatLogic.activeConversation]);

    const chatContextValue = {
        ...chatLogic,
        currentMessages
    };

    return (
        <ChatContext.Provider value={chatContextValue}>
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
